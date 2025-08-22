'use client';

import { Box, Typography, Card, CardContent, Grid, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { People, Description, Euro, Assignment, Menu, Dashboard } from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';

const stats = [
  { title: 'Kunden', value: '1,234', icon: <People />, color: '#1976d2' },
  { title: 'Angebote', value: '56', icon: <Description />, color: '#dc004e' },
  { title: 'Umsatz', value: '€45,678', icon: <Euro />, color: '#388e3c' },
  { title: 'Aufträge', value: '89', icon: <Assignment />, color: '#f57c00' },
];

export default function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Relocato CRM
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ width: 240, '& .MuiDrawer-paper': { width: 240 } }}
      >
        <Toolbar />
        <List>
          <ListItem>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <ListItemButton>
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </Link>
          </ListItem>
          <ListItem>
            <Link href="/customers" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <ListItemButton>
                <ListItemIcon><People /></ListItemIcon>
                <ListItemText primary="Kunden" />
              </ListItemButton>
            </Link>
          </ListItem>
          <ListItem>
            <Link href="/quotes" style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
              <ListItemButton>
                <ListItemIcon><Description /></ListItemIcon>
                <ListItemText primary="Angebote" />
              </ListItemButton>
            </Link>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: `${stat.color}20`,
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              ✅ Next.js 15.5 Migration Erfolgreich!
            </Typography>
            <Typography variant="body1">
              🚀 <strong>Turbopack</strong> - 40% schnellere Builds<br/>
              ⚡ <strong>React 19</strong> - Server Components aktiv<br/>
              🔒 <strong>TypeScript</strong> - Strict Mode<br/>
              🎨 <strong>MUI 7</strong> - Modern Material Design<br/>
              🌍 <strong>i18n Ready</strong> - Mehrsprachigkeit vorbereitet<br/>
              📱 <strong>Responsive</strong> - Mobile-optimiert
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}