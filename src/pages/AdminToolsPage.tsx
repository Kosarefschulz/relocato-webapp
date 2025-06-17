import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Tabs, Tab, IconButton, Badge, Tooltip, Button, Card, CardContent, Alert } from '@mui/material';
import Grid from '../components/GridCompat';
import {
  ArrowBack as ArrowBackIcon,
  MergeType as MergeIcon,
  Email as EmailIcon,
  CloudUpload as CloudUploadIcon,
  Error as ErrorIcon,
  ManageSearch as ManageSearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DuplicateCustomerManager from '../components/DuplicateCustomerManager';
import EmlFileUpload from '../components/EmlFileUpload';
import FailedEmailRecovery from '../components/FailedEmailRecovery';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Admin Tools
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Verwaltungstools für Kundendaten und E-Mail-Import
            </Typography>
          </Box>
        </Box>

        {/* Info Card */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MergeIcon fontSize="large" color="primary" />
                  <Box>
                    <Typography variant="h6">Duplikate-Verwaltung</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Finden und bereinigen Sie doppelte Kundeneinträge
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CloudUploadIcon fontSize="large" color="primary" />
                  <Box>
                    <Typography variant="h6">EML Import</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Importieren Sie Kunden aus .eml E-Mail-Dateien
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ErrorIcon fontSize="large" color="primary" />
                  <Box>
                    <Typography variant="h6">Fehlgeschlagene E-Mails</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bearbeiten Sie nicht importierte E-Mails manuell
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            label="Duplikate-Verwaltung" 
            icon={<MergeIcon />}
            iconPosition="start"
          />
          <Tab 
            label="EML Import" 
            icon={<CloudUploadIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Fehlgeschlagene E-Mails" 
            icon={<ErrorIcon />}
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <DuplicateCustomerManager />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <EmlFileUpload />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <FailedEmailRecovery />
        </TabPanel>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Tipp:</strong> Führen Sie regelmäßig eine Duplikatsprüfung durch, um Ihre Kundendatenbank sauber zu halten. 
            Nutzen Sie den Auto-Modus für exakte Duplikate und überprüfen Sie ähnliche Einträge manuell.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default AdminToolsPage;