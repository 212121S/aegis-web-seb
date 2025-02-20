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
  Badge
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
  Assessment
} from "@mui/icons-material";

// Components
import Logo from "./components/Logo";
import HomePage from "./components/HomePage";
import Register from "./components/Register";
import LoginPage from "./components/LoginPage";
import TestSession from "./components/TestSession";
import ProctoringMonitor from "./components/ProctoringMonitor";
import AboutPage from "./components/AboutPage";
import PaymentPage from "./components/PaymentPage";
import PaymentSuccess from "./components/PaymentSuccess";
import AccountSettings from "./components/AccountSettings";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
      contrastText: "#fff"
    },
    secondary: {
      main: "#f50057",
      light: "#ff4081",
      dark: "#c51162",
      contrastText: "#fff"
    },
    background: {
      default: "#f5f5f5"
    }
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 600
    },
    h3: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          color: "#333"
        }
      }
    }
  }
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const navItems = [
    { text: "Home", icon: <Home />, path: "/", auth: false },
    { text: "About", icon: <Info />, path: "/about", auth: false },
    { text: "Practice Tests", icon: <Assessment />, path: "/test", auth: true },
    { text: "Pricing", icon: <Payment />, path: "/pricing", auth: false },
    { text: "Account", icon: <AccountCircle />, path: "/account", auth: true }
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
              <Route
                path="/payment/success"
                element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test"
                element={
                  <ProtectedRoute>
                    <TestSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/proctor"
                element={
                  <ProtectedRoute>
                    <ProctoringMonitor />
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

export default App;
