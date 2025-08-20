'use client';

import { Grid2 as Grid, Card, CardContent, Typography, Box, Paper } from '@mui/material';
import { People, Description, Euro, TrendingUp, CalendarMonth, Assignment } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const monthlyData = [
  { name: 'Jan', umsatz: 45000, aufträge: 32 },
  { name: 'Feb', umsatz: 52000, aufträge: 38 },
  { name: 'Mar', umsatz: 48000, aufträge: 35 },
  { name: 'Apr', umsatz: 61000, aufträge: 42 },
  { name: 'Mai', umsatz: 55000, aufträge: 40 },
  { name: 'Jun', umsatz: 67000, aufträge: 48 },
];

const stats = [
  { title: 'Kunden', value: '1,234', icon: <People />, color: '#1976d2', change: '+12%' },
  { title: 'Angebote', value: '56', icon: <Description />, color: '#dc004e', change: '+23%' },
  { title: 'Umsatz', value: '€45,678', icon: <Euro />, color: '#388e3c', change: '+18%' },
  { title: 'Aufträge', value: '89', icon: <Assignment />, color: '#f57c00', change: '+7%' },
];

export default function DashboardPage() {
  const t = useTranslations('common');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
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
                    <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
                      {stat.change} vs. letzter Monat
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

        {/* Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Umsatzentwicklung
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="umsatz" stroke="#1976d2" name="Umsatz (€)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Aufträge pro Monat
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aufträge" fill="#dc004e" name="Aufträge" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Anstehende Umzüge
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <CalendarMonth sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">Familie Müller</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Berlin → Hamburg
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    25.08.2025
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Quotes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Neue Angebote
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Box>
                    <Typography variant="body1">Angebot #{2025000 + item}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Herr Schmidt - Komplettumzug
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    €{1200 + item * 150}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}