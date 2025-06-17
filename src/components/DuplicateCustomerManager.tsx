import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Collapse,
  Grid,
  Tooltip,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Merge as MergeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService } from '../config/database.config';
import { formatDate } from '../utils/dateUtils';

interface DuplicateGroup {
  masterId: string;
  duplicates: Customer[];
  confidence: number;
  matchType: 'exact' | 'similar' | 'potential';
  matchReasons: string[];
}

interface MergeData {
  selectedIds: string[];
  masterCustomer: Customer;
  mergedData: Partial<Customer>;
}

const DuplicateCustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [currentMergeData, setCurrentMergeData] = useState<MergeData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    exact: 0,
    similar: 0,
    potential: 0,
    processed: 0,
  });

  useEffect(() => {
    loadCustomersAndFindDuplicates();
  }, []);

  const loadCustomersAndFindDuplicates = async () => {
    setLoading(true);
    try {
      const allCustomers = await databaseService.getCustomers();
      setCustomers(allCustomers);
      const groups = findDuplicates(allCustomers);
      setDuplicateGroups(groups);
      updateStats(groups);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (groups: DuplicateGroup[]) => {
    const stats = {
      total: groups.length,
      exact: groups.filter(g => g.matchType === 'exact').length,
      similar: groups.filter(g => g.matchType === 'similar').length,
      potential: groups.filter(g => g.matchType === 'potential').length,
      processed: 0,
    };
    setStats(stats);
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const normalizePhone = (phone: string): string => {
    return phone.replace(/[^0-9]/g, '');
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    if (normalized1 === normalized2) return 1;
    
    // Levenshtein distance calculation
    const len1 = normalized1.length;
    const len2 = normalized2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  };

  const findDuplicates = (customers: Customer[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < customers.length; i++) {
      if (processedIds.has(customers[i].id)) continue;

      const duplicates: Customer[] = [];
      const matchReasons: string[] = [];
      let highestConfidence = 0;
      let matchType: 'exact' | 'similar' | 'potential' = 'potential';

      for (let j = i + 1; j < customers.length; j++) {
        if (processedIds.has(customers[j].id)) continue;

        const comparison = compareCustomers(customers[i], customers[j]);
        
        if (comparison.confidence > 0.3) {
          duplicates.push(customers[j]);
          
          if (comparison.confidence > highestConfidence) {
            highestConfidence = comparison.confidence;
            matchType = comparison.matchType;
          }
          
          comparison.reasons.forEach(reason => {
            if (!matchReasons.includes(reason)) {
              matchReasons.push(reason);
            }
          });
        }
      }

      if (duplicates.length > 0) {
        duplicates.forEach(dup => processedIds.add(dup.id));
        processedIds.add(customers[i].id);
        
        groups.push({
          masterId: customers[i].id,
          duplicates: [customers[i], ...duplicates],
          confidence: highestConfidence,
          matchType,
          matchReasons,
        });
      }
    }

    return groups.sort((a, b) => b.confidence - a.confidence);
  };

  const compareCustomers = (c1: Customer, c2: Customer): { 
    confidence: number; 
    matchType: 'exact' | 'similar' | 'potential';
    reasons: string[];
  } => {
    let confidence = 0;
    const reasons: string[] = [];
    let matchCount = 0;
    const weights = {
      name: 0.3,
      email: 0.25,
      phone: 0.25,
      address: 0.1,
      movingDate: 0.1,
    };

    // Name comparison
    const nameSimilarity = calculateSimilarity(c1.name, c2.name);
    if (nameSimilarity > 0.9) {
      confidence += weights.name;
      matchCount++;
      reasons.push('Name identisch');
    } else if (nameSimilarity > 0.7) {
      confidence += weights.name * 0.7;
      reasons.push('Name ähnlich');
    }

    // Email comparison
    if (c1.email && c2.email) {
      if (c1.email.toLowerCase() === c2.email.toLowerCase()) {
        confidence += weights.email;
        matchCount++;
        reasons.push('E-Mail identisch');
      }
    }

    // Phone comparison
    if (c1.phone && c2.phone) {
      const phone1 = normalizePhone(c1.phone);
      const phone2 = normalizePhone(c2.phone);
      if (phone1 === phone2) {
        confidence += weights.phone;
        matchCount++;
        reasons.push('Telefon identisch');
      }
    }

    // Address comparison
    if (c1.fromAddress && c2.fromAddress) {
      const addressSimilarity = calculateSimilarity(c1.fromAddress, c2.fromAddress);
      if (addressSimilarity > 0.8) {
        confidence += weights.address;
        reasons.push('Abholadresse ähnlich');
      }
    }

    if (c1.toAddress && c2.toAddress) {
      const addressSimilarity = calculateSimilarity(c1.toAddress, c2.toAddress);
      if (addressSimilarity > 0.8) {
        confidence += weights.address;
        reasons.push('Zieladresse ähnlich');
      }
    }

    // Moving date comparison
    if (c1.movingDate && c2.movingDate && c1.movingDate === c2.movingDate) {
      confidence += weights.movingDate;
      reasons.push('Umzugsdatum identisch');
    }

    // Determine match type
    let matchType: 'exact' | 'similar' | 'potential' = 'potential';
    if (matchCount >= 3 || confidence > 0.8) {
      matchType = 'exact';
    } else if (confidence > 0.5) {
      matchType = 'similar';
    }

    return { confidence, matchType, reasons };
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(g => g.masterId)));
    }
  };

  const handleSelectGroup = (masterId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(masterId)) {
      newSelected.delete(masterId);
    } else {
      newSelected.add(masterId);
    }
    setSelectedGroups(newSelected);
  };

  const handleExpandGroup = (masterId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(masterId)) {
      newExpanded.delete(masterId);
    } else {
      newExpanded.add(masterId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleMergeGroup = (group: DuplicateGroup) => {
    const masterCustomer = group.duplicates[0];
    const mergedData: Partial<Customer> = {
      ...masterCustomer,
      // Merge data from all duplicates
      notes: group.duplicates
        .map(c => c.notes)
        .filter(Boolean)
        .join('\n\n'),
      tags: Array.from(new Set(
        group.duplicates.flatMap(c => c.tags || [])
      )),
    };

    setCurrentMergeData({
      selectedIds: group.duplicates.map(c => c.id),
      masterCustomer,
      mergedData,
    });
    setMergeDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    if (!currentMergeData) return;

    setProcessing(true);
    try {
      const { selectedIds, mergedData } = currentMergeData;
      const [masterId, ...duplicateIds] = selectedIds;

      // Update master customer with merged data
      await databaseService.updateCustomer(masterId, mergedData);

      // Delete duplicate customers
      for (const duplicateId of duplicateIds) {
        await databaseService.deleteCustomer(duplicateId);
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        processed: prev.processed + 1,
      }));

      // Reload data
      await loadCustomersAndFindDuplicates();
      setMergeDialogOpen(false);
      setCurrentMergeData(null);
    } catch (error) {
      console.error('Error merging customers:', error);
      alert('Fehler beim Zusammenführen der Kunden');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDuplicates = async () => {
    const groupsToProcess = duplicateGroups.filter(g => selectedGroups.has(g.masterId));
    if (groupsToProcess.length === 0) return;

    if (!window.confirm(`Möchten Sie die Duplikate von ${groupsToProcess.length} Gruppen löschen?`)) {
      return;
    }

    setProcessing(true);
    try {
      for (const group of groupsToProcess) {
        // Keep the first customer, delete the rest
        const [, ...duplicatesToDelete] = group.duplicates;
        
        for (const duplicate of duplicatesToDelete) {
          await databaseService.deleteCustomer(duplicate.id);
        }
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        processed: prev.processed + groupsToProcess.length,
      }));

      // Reload data
      await loadCustomersAndFindDuplicates();
      setSelectedGroups(new Set());
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      alert('Fehler beim Löschen der Duplikate');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoProcess = async () => {
    if (!autoMode) return;

    const exactGroups = duplicateGroups.filter(g => g.matchType === 'exact');
    if (exactGroups.length === 0) {
      alert('Keine exakten Duplikate gefunden');
      return;
    }

    if (!window.confirm(`Möchten Sie ${exactGroups.length} exakte Duplikate automatisch zusammenführen?`)) {
      return;
    }

    setProcessing(true);
    try {
      for (const group of exactGroups) {
        const [master, ...duplicates] = group.duplicates;
        
        // Merge data
        const mergedData: Partial<Customer> = {
          ...master,
          notes: group.duplicates
            .map(c => c.notes)
            .filter(Boolean)
            .join('\n\n'),
          tags: Array.from(new Set(
            group.duplicates.flatMap(c => c.tags || [])
          )),
        };

        await databaseService.updateCustomer(master.id, mergedData);

        // Delete duplicates
        for (const duplicate of duplicates) {
          await databaseService.deleteCustomer(duplicate.id);
        }
      }

      // Update stats
      setStats(prev => ({
        ...prev,
        processed: prev.processed + exactGroups.length,
      }));

      // Reload data
      await loadCustomersAndFindDuplicates();
      alert(`${exactGroups.length} Duplikate erfolgreich zusammengeführt`);
    } catch (error) {
      console.error('Error in auto-process:', error);
      alert('Fehler beim automatischen Verarbeiten');
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredGroups = () => {
    let filtered = duplicateGroups;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.duplicates.some(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
        )
      );
    }

    // Filter by tab
    switch (tabValue) {
      case 1: // Exact
        filtered = filtered.filter(g => g.matchType === 'exact');
        break;
      case 2: // Similar
        filtered = filtered.filter(g => g.matchType === 'similar');
        break;
      case 3: // Potential
        filtered = filtered.filter(g => g.matchType === 'potential');
        break;
    }

    return filtered;
  };

  const filteredGroups = getFilteredGroups();

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return 'error';
      case 'similar':
        return 'warning';
      case 'potential':
        return 'info';
      default:
        return 'default';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return <WarningIcon />;
      case 'similar':
        return <InfoIcon />;
      case 'potential':
        return <InfoIcon />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Duplikate-Verwaltung
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt Gruppen
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Exakte Duplikate
              </Typography>
              <Typography variant="h4" color="error">
                {stats.exact}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ähnliche Einträge
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.similar}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Verarbeitet
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.processed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
              />
            }
            label="Auto-Modus"
          />

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            onClick={() => loadCustomersAndFindDuplicates()}
            disabled={loading || processing}
          >
            Aktualisieren
          </Button>

          {autoMode && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleAutoProcess}
              disabled={loading || processing || stats.exact === 0}
            >
              Auto-Verarbeitung ({stats.exact} exakte)
            </Button>
          )}

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteDuplicates}
            disabled={selectedGroups.size === 0 || processing}
          >
            {selectedGroups.size} ausgewählte löschen
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label={<Badge badgeContent={stats.total} color="primary">Alle</Badge>} />
        <Tab label={<Badge badgeContent={stats.exact} color="error">Exakte Duplikate</Badge>} />
        <Tab label={<Badge badgeContent={stats.similar} color="warning">Ähnliche</Badge>} />
        <Tab label={<Badge badgeContent={stats.potential} color="info">Potenzielle</Badge>} />
      </Tabs>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Duplicates Message */}
      {!loading && filteredGroups.length === 0 && (
        <Alert severity="success">
          Keine Duplikate gefunden! Ihre Kundendatenbank ist sauber.
        </Alert>
      )}

      {/* Duplicate Groups */}
      {!loading && filteredGroups.length > 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Checkbox
              checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
              indeterminate={selectedGroups.size > 0 && selectedGroups.size < filteredGroups.length}
              onChange={handleSelectAll}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedGroups.size} von {filteredGroups.length} ausgewählt
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Gruppe</TableCell>
                  <TableCell>Übereinstimmung</TableCell>
                  <TableCell>Gründe</TableCell>
                  <TableCell>Anzahl</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGroups.map((group) => (
                  <React.Fragment key={group.masterId}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedGroups.has(group.masterId)}
                          onChange={() => handleSelectGroup(group.masterId)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandGroup(group.masterId)}
                          >
                            {expandedGroups.has(group.masterId) ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          <Typography variant="body2">
                            {group.duplicates[0].name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={group.confidence * 100}
                            sx={{ width: 80, height: 8, borderRadius: 4 }}
                            color={getMatchTypeColor(group.matchType) as any}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(group.confidence * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {group.matchReasons.slice(0, 3).map((reason, idx) => (
                            <Chip
                              key={idx}
                              label={reason}
                              size="small"
                              color={getMatchTypeColor(group.matchType) as any}
                              variant="outlined"
                            />
                          ))}
                          {group.matchReasons.length > 3 && (
                            <Chip
                              label={`+${group.matchReasons.length - 3}`}
                              size="small"
                              variant="filled"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${group.duplicates.length} Kunden`}
                          size="small"
                          icon={getMatchTypeIcon(group.matchType) as any}
                          color={getMatchTypeColor(group.matchType) as any}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Zusammenführen">
                          <IconButton
                            color="primary"
                            onClick={() => handleMergeGroup(group)}
                          >
                            <MergeIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Details */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={expandedGroups.has(group.masterId)}>
                          <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              {group.duplicates.map((customer) => (
                                <Grid item xs={12} md={6} key={customer.id}>
                                  <Card variant="outlined">
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom>
                                        {customer.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        ID: {customer.id}
                                      </Typography>
                                      
                                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {customer.email && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EmailIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{customer.email}</Typography>
                                          </Box>
                                        )}
                                        {customer.phone && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{customer.phone}</Typography>
                                          </Box>
                                        )}
                                        {customer.movingDate && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                              {formatDate(customer.movingDate)}
                                            </Typography>
                                          </Box>
                                        )}
                                        {customer.fromAddress && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <HomeIcon fontSize="small" color="action" />
                                            <Typography variant="body2" noWrap>
                                              {customer.fromAddress}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>

                                      {customer.tags && customer.tags.length > 0 && (
                                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                          {customer.tags.map((tag, idx) => (
                                            <Chip
                                              key={idx}
                                              label={tag}
                                              size="small"
                                              variant="outlined"
                                            />
                                          ))}
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Merge Dialog */}
      <Dialog
        open={mergeDialogOpen}
        onClose={() => !processing && setMergeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Kunden zusammenführen
        </DialogTitle>
        <DialogContent>
          {currentMergeData && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Die folgenden {currentMergeData.selectedIds.length} Kunden werden zu einem zusammengeführt.
                Der erste Kunde wird als Hauptkunde verwendet.
              </Alert>

              <Typography variant="h6" gutterBottom>
                Hauptkunde (wird beibehalten):
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body1">
                    <strong>{currentMergeData.masterCustomer.name}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {currentMergeData.masterCustomer.id}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" gutterBottom>
                Zusammengeführte Daten:
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={currentMergeData.mergedData.name || ''}
                        onChange={(e) => setCurrentMergeData({
                          ...currentMergeData,
                          mergedData: {
                            ...currentMergeData.mergedData,
                            name: e.target.value,
                          },
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="E-Mail"
                        value={currentMergeData.mergedData.email || ''}
                        onChange={(e) => setCurrentMergeData({
                          ...currentMergeData,
                          mergedData: {
                            ...currentMergeData.mergedData,
                            email: e.target.value,
                          },
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Telefon"
                        value={currentMergeData.mergedData.phone || ''}
                        onChange={(e) => setCurrentMergeData({
                          ...currentMergeData,
                          mergedData: {
                            ...currentMergeData.mergedData,
                            phone: e.target.value,
                          },
                        })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notizen (kombiniert)"
                        value={currentMergeData.mergedData.notes || ''}
                        onChange={(e) => setCurrentMergeData({
                          ...currentMergeData,
                          mergedData: {
                            ...currentMergeData.mergedData,
                            notes: e.target.value,
                          },
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)} disabled={processing}>
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirmMerge}
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={processing && <CircularProgress size={20} />}
          >
            {processing ? 'Zusammenführen...' : 'Zusammenführen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuplicateCustomerManager;