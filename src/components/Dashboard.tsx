import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.firebase';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden und Angebot erstellen',
      icon: <SearchIcon sx={{ fontSize: 48 }} />,
      action: () => navigate('/search-customer'),
      color: '#1976d2'
    },
    {
      title: 'Neuer Kunde',
      description: 'Neuen Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: 48 }} />,
      action: () => navigate('/new-customer'),
      color: '#2e7d32'
    },
    {
      title: 'Angebote',
      description: 'Alle versendeten Angebote anzeigen',
      icon: <DescriptionIcon sx={{ fontSize: 48 }} />,
      action: () => navigate('/quotes'),
      color: '#ed6c02'
    },
    {
      title: 'Kunden',
      description: 'Kundenliste anzeigen',
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      action: () => navigate('/customers'),
      color: '#9c27b0'
    },
    {
      title: 'E-Mail Test',
      description: 'SendGrid E-Mail-System testen',
      icon: <EmailIcon sx={{ fontSize: 48 }} />,
      action: () => {
        console.log('📧 E-Mail Test wird gestartet...');
        alert('📧 E-Mail-Test:\n\n1. Gehen Sie zu einem Kunden\n2. Erstellen Sie ein Angebot\n3. Das System sendet automatisch eine E-Mail\n\nOder testen Sie direkt die CreateQuote Funktion!');
      },
      color: '#d32f2f'
    }
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Umzugs-Angebote
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {user?.email}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose} disabled>
                <AccountCircleIcon sx={{ mr: 1 }} />
                {user?.email}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Abmelden
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Willkommen zurück! Was möchten Sie heute erledigen?
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {dashboardItems.map((item, index) => (
            <Grid xs={12} sm={6} md={6} key={index}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3
                  },
                  minHeight: 200
                }}
                onClick={item.action}
              >
                <Box sx={{ color: item.color, mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {item.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;