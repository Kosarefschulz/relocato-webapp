import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Chip,
  Avatar
} from '@mui/material';
import Grid from '../components/GridCompat';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  PhoneCallback as PhoneCallbackIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { Customer, CustomerPhase, CUSTOMER_PHASES } from '../types';
import { databaseService } from '../config/database.config';
import { motion } from 'framer-motion';

// Icon mapping
const iconMap: Record<string, React.ReactElement> = {
  Phone: <PhoneIcon sx={{ fontSize: 40 }} />,
  PhoneCallback: <PhoneCallbackIcon sx={{ fontSize: 40 }} />,
  Description: <DescriptionIcon sx={{ fontSize: 40 }} />,
  Event: <EventIcon sx={{ fontSize: 40 }} />,
  LocalShipping: <LocalShippingIcon sx={{ fontSize: 40 }} />,
  Receipt: <ReceiptIcon sx={{ fontSize: 40 }} />,
  Star: <StarIcon sx={{ fontSize: 40 }} />,
  Archive: <ArchiveIcon sx={{ fontSize: 40 }} />,
};

const PipelineDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPhase = searchParams.get('phase') as CustomerPhase | null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseCounts, setPhaseCounts] = useState<Record<CustomerPhase, number>>({} as any);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const allCustomers = await databaseService.getCustomers();
      setCustomers(allCustomers);

      // Count customers per phase
      const counts: Record<string, number> = {};
      CUSTOMER_PHASES.forEach(phase => {
        counts[phase.value] = allCustomers.filter(c => c.currentPhase === phase.value).length;
      });
      // Add customers without phase to 'angerufen'
      const noPhaseCount = allCustomers.filter(c => !c.currentPhase).length;
      counts['angerufen'] = (counts['angerufen'] || 0) + noPhaseCount;

      setPhaseCounts(counts as any);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseClick = (phase: CustomerPhase) => {
    setSearchParams({ phase });
  };

  const handleBackClick = () => {
    if (selectedPhase) {
      setSearchParams({});
    } else {
      navigate('/dashboard');
    }
  };

  const filteredCustomers = selectedPhase
    ? customers.filter(c => (c.currentPhase || 'angerufen') === selectedPhase)
    : [];

  const selectedPhaseConfig = selectedPhase
    ? CUSTOMER_PHASES.find(p => p.value === selectedPhase)
    : null;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: '#ffffff' }}>Lade Pipeline...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1, color: '#ffffff', fontWeight: 700 }}>
          {selectedPhase ? selectedPhaseConfig?.label : 'Kunden-Pipeline'}
        </Typography>
        {selectedPhase && (
          <Chip
            label={`${filteredCustomers.length} Kunden`}
            sx={{
              background: `${selectedPhaseConfig?.color}30`,
              color: selectedPhaseConfig?.color,
              fontWeight: 600,
              border: `1px solid ${selectedPhaseConfig?.color}60`
            }}
          />
        )}
      </Box>

      {/* Phase Overview Cards */}
      {!selectedPhase && (
        <Grid container spacing={3}>
          {CUSTOMER_PHASES.map((phase, index) => {
            const count = phaseCounts[phase.value] || 0;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={phase.value}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      background: 'rgba(30, 30, 30, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${phase.color}40`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${phase.color}40`,
                        border: `1px solid ${phase.color}80`,
                        background: `linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, ${phase.color}15 100%)`
                      }
                    }}
                    onClick={() => handlePhaseClick(phase.value)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: `${phase.color}20`,
                          border: `2px solid ${phase.color}60`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          color: phase.color
                        }}
                      >
                        {iconMap[phase.iconName]}
                      </Box>

                      <Typography
                        variant="h5"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 700,
                          mb: 1
                        }}
                      >
                        {phase.label}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          mb: 2,
                          fontSize: '0.813rem'
                        }}
                      >
                        {phase.description}
                      </Typography>

                      <Chip
                        label={`${count} Kunden`}
                        sx={{
                          background: `${phase.color}30`,
                          color: phase.color,
                          fontWeight: 700,
                          fontSize: '1rem',
                          border: `1px solid ${phase.color}60`,
                          px: 1
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Filtered Customer List */}
      {selectedPhase && selectedPhaseConfig && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {selectedPhaseConfig.description}
            </Typography>
          </Box>

          {filteredCustomers.length === 0 ? (
            <Card sx={{ background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `${selectedPhaseConfig.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: selectedPhaseConfig.color
                  }}
                >
                  {iconMap[selectedPhaseConfig.iconName]}
                </Box>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                  Keine Kunden in dieser Phase
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Aktuell befinden sich keine Kunden in "{selectedPhaseConfig.label}"
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {filteredCustomers.map((customer, index) => (
                <Grid item xs={12} key={customer.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        background: 'rgba(30, 30, 30, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateX(8px)',
                          borderColor: `${selectedPhaseConfig.color}60`,
                          boxShadow: `0 8px 24px ${selectedPhaseConfig.color}30`
                        }
                      }}
                      onClick={() => navigate(`/customer/${customer.id}`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                              fontSize: '1.25rem',
                              fontWeight: 700
                            }}
                          >
                            {customer.name.charAt(0).toUpperCase()}
                          </Avatar>

                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ color: '#ffffff', mb: 0.5 }}>
                              {customer.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {customer.email && (
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {customer.email}
                                </Typography>
                              )}
                              {customer.phone && (
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  • {customer.phone}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {customer.customerNumber && (
                            <Chip
                              label={customer.customerNumber}
                              size="small"
                              sx={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                              }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Container>
  );
};

export default PipelineDashboard;
