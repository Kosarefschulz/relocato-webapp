import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  Button,
  Typography,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewColumn as ViewColumnIcon,
  GetApp as GetAppIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import LoadingSkeleton from './LoadingSkeleton';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  filterable?: boolean;
  format?: (value: any) => string | React.ReactNode;
  filter?: {
    type: 'text' | 'select' | 'date' | 'number' | 'boolean';
    options?: { label: string; value: any }[];
  };
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  renderExpandedRow?: (row: any) => React.ReactNode;
  onRowClick?: (row: any) => void;
  onExport?: (data: any[]) => void;
  onSelectionChange?: (selected: any[]) => void;
  initialPageSize?: number;
  stickyHeader?: boolean;
  dense?: boolean;
  loading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  searchable = true,
  exportable = false,
  selectable = false,
  expandable = false,
  renderExpandedRow,
  onRowClick,
  onExport,
  onSelectionChange,
  initialPageSize = 25,
  stickyHeader = true,
  dense = false,
  loading = false,
}) => {
  const theme = useTheme();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(col => col.id));
  const [selected, setSelected] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Menu states
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (search && searchable) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          if (!visibleColumns.includes(column.id)) return false;
          const value = row[column.id];
          return String(value).toLowerCase().includes(search.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue !== '' && filterValue != null) {
        const column = columns.find(col => col.id === columnId);
        if (column?.filter?.type === 'select') {
          filtered = filtered.filter(row => row[columnId] === filterValue);
        } else if (column?.filter?.type === 'boolean') {
          filtered = filtered.filter(row => Boolean(row[columnId]) === filterValue);
        } else {
          filtered = filtered.filter(row =>
            String(row[columnId]).toLowerCase().includes(String(filterValue).toLowerCase())
          );
        }
      }
    });

    // Apply sorting
    if (orderBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        if (aValue < bValue) {
          return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, search, filters, orderBy, order, columns, visibleColumns, searchable]);

  const handleRequestSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: any) => {
    const selectedIndex = selected.findIndex(item => item.id === row.id);
    let newSelected: any[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, row);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const isSelected = (row: any) => selected.findIndex(item => item.id === row.id) !== -1;

  const handleToggleExpanded = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (columnId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setPage(0);
  };

  const handleExport = () => {
    if (onExport) {
      const exportData = processedData.map(row => {
        const exportRow: any = {};
        visibleColumns.forEach(columnId => {
          const column = columns.find(col => col.id === columnId);
          if (column) {
            exportRow[column.label] = row[columnId];
          }
        });
        return exportRow;
      });
      onExport(exportData);
    }
  };

  const numSelected = selected.length;
  const rowCount = Math.min(rowsPerPage, processedData.length - page * rowsPerPage);
  const hasFilters = Object.values(filters).some(value => value !== '' && value != null) || search !== '';

  // Show loading skeleton
  if (loading) {
    return <LoadingSkeleton variant="table" rows={initialPageSize} columns={columns.length} />;
  }

  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title || 'Daten'}
            {processedData.length !== data.length && (
              <Chip 
                label={`${processedData.length} von ${data.length}`}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {exportable && (
              <Tooltip title="Exportieren">
                <IconButton onClick={handleExport}>
                  <GetAppIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Spalten">
              <IconButton onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
                <ViewColumnIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter">
              <IconButton 
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                color={hasFilters ? 'primary' : 'default'}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search */}
        {searchable && (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* Active Filters */}
        {hasFilters && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Filter:
            </Typography>
            {search && (
              <Chip
                label={`Suche: "${search}"`}
                size="small"
                onDelete={() => setSearch('')}
                variant="outlined"
              />
            )}
            {Object.entries(filters).map(([columnId, value]) => {
              if (value === '' || value == null) return null;
              const column = columns.find(col => col.id === columnId);
              return (
                <Chip
                  key={columnId}
                  label={`${column?.label}: ${value}`}
                  size="small"
                  onDelete={() => handleFilterChange(columnId, '')}
                  variant="outlined"
                />
              );
            })}
            <Button size="small" onClick={clearFilters}>
              Alle löschen
            </Button>
          </Box>
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {expandable && <TableCell />}
              {columns
                .filter(column => visibleColumns.includes(column.id))
                .map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isItemSelected = isSelected(row);
                const isExpanded = expandedRows.has(row.id);
                
                return (
                  <React.Fragment key={row.id || index}>
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelectRow(row)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {expandable && (
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpanded(row.id);
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      )}
                      {columns
                        .filter(column => visibleColumns.includes(column.id))
                        .map((column) => {
                          const value = row[column.id];
                          return (
                            <TableCell key={column.id} align={column.align}>
                              {column.format ? column.format(value) : value}
                            </TableCell>
                          );
                        })}
                    </TableRow>
                    {expandable && isExpanded && renderExpandedRow && (
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={columns.length + (selectable ? 1 : 0) + 1}
                        >
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              {renderExpandedRow(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={processedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Zeilen pro Seite:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} von ${count !== -1 ? count : `mehr als ${to}`}`
        }
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        }}
      />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 300, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Filter
          </Typography>
          {columns.filter(col => col.filterable !== false).map((column) => (
            <Box key={column.id} sx={{ mb: 2 }}>
              {column.filter?.type === 'select' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{column.label}</InputLabel>
                  <Select
                    value={filters[column.id] || ''}
                    label={column.label}
                    onChange={(e) => handleFilterChange(column.id, e.target.value)}
                  >
                    <MenuItem value="">Alle</MenuItem>
                    {column.filter.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label={column.label}
                  type={column.filter?.type === 'number' ? 'number' : 'text'}
                  value={filters[column.id] || ''}
                  onChange={(e) => handleFilterChange(column.id, e.target.value)}
                />
              )}
            </Box>
          ))}
          <Button fullWidth onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        </Box>
      </Menu>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 250 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Spalten anzeigen
          </Typography>
          {columns.map((column) => (
            <FormControl key={column.id} fullWidth>
              <MenuItem>
                <Checkbox
                  checked={visibleColumns.includes(column.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibleColumns(prev => [...prev, column.id]);
                    } else {
                      setVisibleColumns(prev => prev.filter(id => id !== column.id));
                    }
                  }}
                />
                <ListItemText primary={column.label} />
              </MenuItem>
            </FormControl>
          ))}
        </Box>
      </Menu>
    </Paper>
  );
};

export default DataTable;