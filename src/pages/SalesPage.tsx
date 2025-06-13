import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  IconButton,
  Typography,
  Card,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import SalesOverview from '../components/SalesOverview';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Card
          sx={{
            p: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Verkaufsübersicht
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aktuelle Aktivitäten der letzten 5 Tage
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleRefresh}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Card>

        {/* Sales Overview Component */}
        <Box sx={{ height: 'calc(100vh - 250px)' }}>
          <SalesOverview />
        </Box>
      </MotionBox>
    </Container>
  );
};

export default SalesPage;