import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff'
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#fff'
    },
    background: {
      default: '#f5f5f5',
      paper: '#fff'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          zIndex: 1200
        }
      },
      defaultProps: {
        elevation: 1
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      },
      defaultProps: {
        disableElevation: true
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 1
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 1
      }
    }
  },
  shape: {
    borderRadius: 8
  },
  spacing: 8,
  zIndex: {
    appBar: 1200,
    drawer: 1100
  }
});

export default theme;
