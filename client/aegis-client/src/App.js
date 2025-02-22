import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Divider,
  Badge,
  CircularProgress
} from "@mui/material";
import {
  Menu as MenuIcon,
  Home,
  Login as LoginIcon,
  PersonAdd,
  ExitToApp,
  Info,
  Payment,
  AccountCircle,
  School,
  Assessment,
  VerifiedUser
} from "@mui/icons-material";

// Components
import Logo from "./components/Logo";
import HomePage from "./components/HomePage";
import Register from "./components/Register";
import LoginPage from "./components/LoginPage";
import AboutPage from "./components/AboutPage";
import PaymentPage from "./components/PaymentPage";
import PaymentSuccess from "./components/PaymentSuccess";
import AccountSettings from "./components/AccountSettings";
import VerificationPage from "./components/VerificationPage";
import AdminQuestionManager from "./components/AdminQuestionManager";
import UserDashboard from "./components/UserDashboard";
import PracticeTest from "./components/PracticeTest";
import OfficialTest from "./components/OfficialTest";
import TestResults from "./components/TestResults";

// Import theme from theme file
import theme from './theme';

// Import hooks and services
import { useSubscription } from './hooks/useSubscription';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, requireSubscription = false }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { loading: subLoading, error, subscription, refreshSubscription } = useSubscription();

  // Effect to refresh subscription status when route is accessed
  useEffect(() => {
    if (requireSubscription && isAuthenticated && !loading) {
      refreshSubscription();
    }
  }, [requireSubscription, isAuthenticated, loading, refreshSubscription]);

  if (loading || subLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSubscription && (!subscription?.active || error)) {
    console.log('Subscription check failed:', { subscription, error });
    return <Navigate to="/pricing" state={{ 
      from: location,
      message: 'An active subscription is required to access this feature'
    }} replace />;
  }

  return children;
};

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { text: "Home", icon: <Home />, path: "/", auth: false },
    { text: "About", icon: <Info />, path: "/about", auth: false },
    { text: "Dashboard", icon: <Assessment />, path: "/dashboard", auth: true },
    { text: "Pricing", icon: <Payment />, path: "/pricing", auth: false },
    { text: "Account", icon: <AccountCircle />, path: "/account", auth: true },
    { text: "Verify Results", icon: <VerifiedUser />, path: "/verify", auth: false }
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box 
        sx={{ 
          p: 2, 
          display: "flex", 
          alignItems: "center",
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)"
          }
        }}
      >
        <Logo size={32} animated={true} sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
          Aegis
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => {
          if (item.auth && !isAuthenticated) return null;
          return (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.text}
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.08)",
                  transform: "translateX(8px)"
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
        {!isAuthenticated ? (
          <>
            <ListItem
              button
              component={Link}
              to="/login"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.08)",
                  transform: "translateX(8px)"
                }
              }}
            >
              <ListItemIcon>
                <LoginIcon />
              </ListItemIcon>
              <ListItemText primary="Sign In" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/register"
              sx={{
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.08)",
                  transform: "translateX(8px)"
                }
              }}
            >
              <ListItemIcon>
                <PersonAdd />
              </ListItemIcon>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        ) : (
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(244, 67, 54, 0.08)",
                transform: "translateX(8px)"
              }
            }}
          >
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
          <AppBar 
            position="fixed" 
            elevation={0}
            sx={{
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
              }
            }}
          >
            <Toolbar>
              {isMobile && (
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Logo size={40} animated={true} sx={{ mr: 1 }} />
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  flexGrow: 1,
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05)",
                    color: "primary.main"
                  }
                }}
              >
                Aegis
              </Typography>
              {!isMobile && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  {navItems.map((item) => {
                    if (item.auth && !isAuthenticated) return null;
                    return (
                      <Button
                        key={item.text}
                        color="inherit"
                        component={Link}
                        to={item.path}
                        startIcon={item.icon}
                        sx={{
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            color: "primary.main"
                          }
                        }}
                      >
                        {item.text}
                      </Button>
                    );
                  })}
                  {!isAuthenticated ? (
                    <>
                      <Button
                        color="inherit"
                        component={Link}
                        to="/login"
                        startIcon={<LoginIcon />}
                        sx={{
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            color: "primary.main"
                          }
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        variant="contained"
                        component={Link}
                        to="/register"
                        startIcon={<PersonAdd />}
                        sx={{
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)"
                          }
                        }}
                      >
                        Register
                      </Button>
                    </>
                  ) : (
                    <Button
                      color="inherit"
                      onClick={handleLogout}
                      startIcon={<ExitToApp />}
                      sx={{
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          color: "error.main"
                        }
                      }}
                    >
                      Sign Out
                    </Button>
                  )}
                </Box>
              )}
            </Toolbar>
          </AppBar>

          {isMobile && (
            <Drawer
              variant="temporary"
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true
              }}
              sx={{
                "& .MuiDrawer-paper": {
                  boxSizing: "border-box",
                  width: 250,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)"
                }
              }}
            >
              {drawer}
            </Drawer>
          )}

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: { xs: 8, sm: 9 },
              width: "100%",
              minHeight: "100vh",
              bgcolor: "background.default"
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PaymentPage />} />
              <Route path="/verify" element={<VerificationPage />} />
              <Route path="/verify/:token" element={<VerificationPage />} />
              <Route
                path="/payment/success"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <AccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/practice"
                element={
                  <ProtectedRoute requireSubscription={true}>
                    <PracticeTest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/official"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <OfficialTest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/results/:testId"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <TestResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <AdminQuestionManager />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
