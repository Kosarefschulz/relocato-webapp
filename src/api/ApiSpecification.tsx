import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Collapse,
} from '@mui/material';
import {
  Api as ApiIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Http as HttpIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileCopy as FileCopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  VpnKey as KeyIcon,
  AccountTree as TreeIcon,
  Schema as SchemaIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnimatedCard, SlideInContainer } from '../components/MicroAnimations';

interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description: string;
  tags: string[];
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  security: ApiSecurity[];
  deprecated: boolean;
  version: string;
  rateLimit: {
    requests: number;
    window: string; // e.g., "1m", "1h", "1d"
  };
  examples: ApiExample[];
}

interface ApiParameter {
  id: string;
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description: string;
  example: any;
  schema?: any;
}

interface ApiRequestBody {
  description: string;
  required: boolean;
  contentType: string;
  schema: any;
  examples: Record<string, any>;
}

interface ApiResponse {
  code: number;
  description: string;
  contentType: string;
  schema?: any;
  examples: Record<string, any>;
  headers?: Record<string, any>;
}

interface ApiSecurity {
  type: 'apiKey' | 'oauth2' | 'bearer' | 'basic';
  name: string;
  in?: 'header' | 'query';
  flows?: any;
  scopes?: string[];
}

interface ApiExample {
  id: string;
  name: string;
  description: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
}

interface ApiTag {
  id: string;
  name: string;
  description: string;
  endpoints: string[];
}

interface ApiModel {
  id: string;
  name: string;
  description: string;
  properties: Record<string, ApiProperty>;
  required: string[];
  example: any;
}

interface ApiProperty {
  type: string;
  description: string;
  example?: any;
  format?: string;
  enum?: string[];
  items?: ApiProperty;
  properties?: Record<string, ApiProperty>;
}

interface ApiSpecificationProps {
  onEndpointTested?: (endpoint: ApiEndpoint, result: any) => void;
  onDocumentationGenerated?: (format: string) => void;
}

const ApiSpecification: React.FC<ApiSpecificationProps> = ({
  onEndpointTested,
  onDocumentationGenerated,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [models, setModels] = useState<ApiModel[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEndpointDialogOpen, setIsEndpointDialogOpen] = useState(false);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);

  useEffect(() => {
    initializeApiSpecification();
  }, []);

  const initializeApiSpecification = () => {
    // Initialize API tags
    const apiTags: ApiTag[] = [
      {
        id: 'customers',
        name: 'Customers',
        description: 'Customer management operations',
        endpoints: [],
      },
      {
        id: 'quotes',
        name: 'Quotes',
        description: 'Quote generation and management',
        endpoints: [],
      },
      {
        id: 'bookings',
        name: 'Bookings',
        description: 'Booking and scheduling operations',
        endpoints: [],
      },
      {
        id: 'invoices',
        name: 'Invoices',
        description: 'Invoice management and billing',
        endpoints: [],
      },
      {
        id: 'crew',
        name: 'Crew Management',
        description: 'Staff and crew management',
        endpoints: [],
      },
      {
        id: 'vehicles',
        name: 'Vehicles',
        description: 'Vehicle fleet management',
        endpoints: [],
      },
      {
        id: 'routes',
        name: 'Route Planning',
        description: 'Route optimization and planning',
        endpoints: [],
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Payment processing and tracking',
        endpoints: [],
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Business intelligence and reporting',
        endpoints: [],
      },
      {
        id: 'auth',
        name: 'Authentication',
        description: 'User authentication and authorization',
        endpoints: [],
      },
    ];

    // Initialize API models
    const apiModels: ApiModel[] = [
      {
        id: 'Customer',
        name: 'Customer',
        description: 'Customer entity',
        properties: {
          id: { type: 'string', description: 'Unique customer identifier', example: 'cust_123' },
          firstName: { type: 'string', description: 'Customer first name', example: 'Max' },
          lastName: { type: 'string', description: 'Customer last name', example: 'Mustermann' },
          email: { type: 'string', format: 'email', description: 'Email address', example: 'max@example.com' },
          phone: { type: 'string', description: 'Phone number', example: '+49 151 12345678' },
          address: {
            type: 'object',
            description: 'Customer address',
            properties: {
              street: { type: 'string', description: 'Street address' },
              city: { type: 'string', description: 'City' },
              postalCode: { type: 'string', description: 'Postal code' },
              country: { type: 'string', description: 'Country code' },
            },
          },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
        },
        required: ['firstName', 'lastName', 'email', 'phone'],
        example: {
          id: 'cust_123',
          firstName: 'Max',
          lastName: 'Mustermann',
          email: 'max@example.com',
          phone: '+49 151 12345678',
          address: {
            street: 'Musterstraße 123',
            city: 'Berlin',
            postalCode: '10115',
            country: 'DE',
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
      },
      {
        id: 'Quote',
        name: 'Quote',
        description: 'Moving quote entity',
        properties: {
          id: { type: 'string', description: 'Unique quote identifier', example: 'quote_456' },
          customerId: { type: 'string', description: 'Customer ID', example: 'cust_123' },
          fromAddress: { type: 'string', description: 'Source address' },
          toAddress: { type: 'string', description: 'Destination address' },
          movingDate: { type: 'string', format: 'date', description: 'Planned moving date' },
          estimatedVolume: { type: 'number', description: 'Estimated volume in cubic meters' },
          pricing: {
            type: 'object',
            description: 'Pricing details for the quote',
            properties: {
              basePrice: { type: 'number', description: 'Base price' },
              additionalServices: { type: 'number', description: 'Additional services cost' },
              total: { type: 'number', description: 'Total price' },
              currency: { type: 'string', description: 'Currency code' },
            },
          },
          status: { type: 'string', enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], description: 'Quote status' },
          validUntil: { type: 'string', format: 'date-time', description: 'Quote expiration' },
        },
        required: ['customerId', 'fromAddress', 'toAddress', 'movingDate'],
        example: {
          id: 'quote_456',
          customerId: 'cust_123',
          fromAddress: 'Musterstraße 123, 10115 Berlin',
          toAddress: 'Beispielweg 456, 10117 Berlin',
          movingDate: '2024-02-15',
          estimatedVolume: 35.5,
          pricing: {
            basePrice: 850.0,
            additionalServices: 150.0,
            total: 1000.0,
            currency: 'EUR',
          },
          status: 'sent',
          validUntil: '2024-01-30T23:59:59Z',
        },
      },
      {
        id: 'Booking',
        name: 'Booking',
        description: 'Moving booking entity',
        properties: {
          id: { type: 'string', description: 'Unique booking identifier' },
          quoteId: { type: 'string', description: 'Associated quote ID' },
          customerId: { type: 'string', description: 'Customer ID' },
          scheduledDate: { type: 'string', format: 'date-time', description: 'Scheduled moving date/time' },
          assignedCrew: { type: 'array', items: { type: 'string' }, description: 'Assigned crew member IDs' },
          assignedVehicles: { type: 'array', items: { type: 'string' }, description: 'Assigned vehicle IDs' },
          status: { type: 'string', enum: ['confirmed', 'in_progress', 'completed', 'cancelled'], description: 'Booking status' },
          specialInstructions: { type: 'string', description: 'Special instructions' },
        },
        required: ['quoteId', 'customerId', 'scheduledDate'],
        example: {
          id: 'booking_789',
          quoteId: 'quote_456',
          customerId: 'cust_123',
          scheduledDate: '2024-02-15T09:00:00Z',
          assignedCrew: ['crew_001', 'crew_002', 'crew_003'],
          assignedVehicles: ['vehicle_001'],
          status: 'confirmed',
          specialInstructions: 'Piano on 3rd floor, no elevator',
        },
      },
    ];

    // Initialize API endpoints
    const apiEndpoints: ApiEndpoint[] = [
      // Customer endpoints
      {
        id: 'get-customers',
        path: '/api/v1/customers',
        method: 'GET',
        summary: 'List customers',
        description: 'Retrieve a paginated list of customers with optional filtering',
        tags: ['customers'],
        parameters: [
          {
            id: 'page',
            name: 'page',
            in: 'query',
            required: false,
            type: 'integer',
            description: 'Page number for pagination',
            example: 1,
          },
          {
            id: 'limit',
            name: 'limit',
            in: 'query',
            required: false,
            type: 'integer',
            description: 'Number of items per page',
            example: 20,
          },
          {
            id: 'search',
            name: 'search',
            in: 'query',
            required: false,
            type: 'string',
            description: 'Search term for customer name or email',
            example: 'mustermann',
          },
        ],
        responses: [
          {
            code: 200,
            description: 'Successful response',
            contentType: 'application/json',
            schema: {
              type: 'object',
              description: 'Customer list response',
              properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
                pagination: {
                  type: 'object',
                  description: 'Pagination details',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' },
                  },
                },
              },
            },
            examples: {
              success: {
                data: [apiModels.find(m => m.id === 'Customer')?.example],
                pagination: { page: 1, limit: 20, total: 150, pages: 8 },
              },
            },
          },
          {
            code: 400,
            description: 'Bad request',
            contentType: 'application/json',
            examples: {
              error: { error: 'Invalid pagination parameters', code: 'INVALID_PARAMS' },
            },
          },
        ],
        security: [{ type: 'bearer', name: 'Authorization' }],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 100, window: '1m' },
        examples: [
          {
            id: 'get-customers-example',
            name: 'List customers with pagination',
            description: 'Example request to get customers with pagination',
            request: {
              method: 'GET',
              url: '/api/v1/customers?page=1&limit=10',
              headers: { 'Authorization': 'Bearer jwt_token_here' },
            },
            response: {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
              body: {
                data: [apiModels.find(m => m.id === 'Customer')?.example],
                pagination: { page: 1, limit: 10, total: 150, pages: 15 },
              },
            },
          },
        ],
      },
      {
        id: 'create-customer',
        path: '/api/v1/customers',
        method: 'POST',
        summary: 'Create customer',
        description: 'Create a new customer record',
        tags: ['customers'],
        parameters: [],
        requestBody: {
          description: 'Customer data',
          required: true,
          contentType: 'application/json',
          schema: { $ref: '#/components/schemas/Customer' },
          examples: {
            newCustomer: {
              firstName: 'Max',
              lastName: 'Mustermann',
              email: 'max@example.com',
              phone: '+49 151 12345678',
              address: {
                street: 'Musterstraße 123',
                city: 'Berlin',
                postalCode: '10115',
                country: 'DE',
              },
            },
          },
        },
        responses: [
          {
            code: 201,
            description: 'Customer created successfully',
            contentType: 'application/json',
            schema: { $ref: '#/components/schemas/Customer' },
            examples: {
              created: apiModels.find(m => m.id === 'Customer')?.example,
            },
          },
          {
            code: 400,
            description: 'Validation error',
            contentType: 'application/json',
            examples: {
              validation: {
                error: 'Validation failed',
                details: [
                  { field: 'email', message: 'Email already exists' },
                  { field: 'phone', message: 'Invalid phone number format' },
                ],
              },
            },
          },
        ],
        security: [{ type: 'bearer', name: 'Authorization' }],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 10, window: '1m' },
        examples: [],
      },
      // Quote endpoints
      {
        id: 'get-quotes',
        path: '/api/v1/quotes',
        method: 'GET',
        summary: 'List quotes',
        description: 'Retrieve a list of quotes with filtering options',
        tags: ['quotes'],
        parameters: [
          {
            id: 'customer-id',
            name: 'customerId',
            in: 'query',
            required: false,
            type: 'string',
            description: 'Filter by customer ID',
            example: 'cust_123',
          },
          {
            id: 'status',
            name: 'status',
            in: 'query',
            required: false,
            type: 'string',
            description: 'Filter by quote status',
            example: 'sent',
          },
        ],
        responses: [
          {
            code: 200,
            description: 'Successful response',
            contentType: 'application/json',
            schema: {
              type: 'object',
              description: 'Quote list response',
              properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/Quote' } },
              },
            },
            examples: {
              success: { data: [apiModels.find(m => m.id === 'Quote')?.example] },
            },
          },
        ],
        security: [{ type: 'bearer', name: 'Authorization' }],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 100, window: '1m' },
        examples: [],
      },
      {
        id: 'create-quote',
        path: '/api/v1/quotes',
        method: 'POST',
        summary: 'Create quote',
        description: 'Generate a new moving quote',
        tags: ['quotes'],
        parameters: [],
        requestBody: {
          description: 'Quote data',
          required: true,
          contentType: 'application/json',
          schema: { $ref: '#/components/schemas/Quote' },
          examples: {
            newQuote: {
              customerId: 'cust_123',
              fromAddress: 'Musterstraße 123, 10115 Berlin',
              toAddress: 'Beispielweg 456, 10117 Berlin',
              movingDate: '2024-02-15',
              estimatedVolume: 35.5,
            },
          },
        },
        responses: [
          {
            code: 201,
            description: 'Quote created successfully',
            contentType: 'application/json',
            schema: { $ref: '#/components/schemas/Quote' },
            examples: {
              created: apiModels.find(m => m.id === 'Quote')?.example,
            },
          },
        ],
        security: [{ type: 'bearer', name: 'Authorization' }],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 5, window: '1m' },
        examples: [],
      },
      // Authentication endpoints
      {
        id: 'auth-login',
        path: '/api/v1/auth/login',
        method: 'POST',
        summary: 'User login',
        description: 'Authenticate user and return JWT token',
        tags: ['auth'],
        parameters: [],
        requestBody: {
          description: 'Login credentials',
          required: true,
          contentType: 'application/json',
          schema: {
            type: 'object',
            description: 'Login request body',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', format: 'password' },
            },
            required: ['email', 'password'],
          },
          examples: {
            login: {
              email: 'admin@relocato.de',
              password: 'secure_password',
            },
          },
        },
        responses: [
          {
            code: 200,
            description: 'Login successful',
            contentType: 'application/json',
            schema: {
              type: 'object',
              description: 'Authentication response',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  description: 'User details',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
                expiresIn: { type: 'integer' },
              },
            },
            examples: {
              success: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                  id: 'user_123',
                  email: 'admin@relocato.de',
                  role: 'admin',
                },
                expiresIn: 3600,
              },
            },
          },
          {
            code: 401,
            description: 'Invalid credentials',
            contentType: 'application/json',
            examples: {
              unauthorized: {
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS',
              },
            },
          },
        ],
        security: [],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 5, window: '1m' },
        examples: [],
      },
      // Analytics endpoints
      {
        id: 'get-analytics-overview',
        path: '/api/v1/analytics/overview',
        method: 'GET',
        summary: 'Analytics overview',
        description: 'Get business analytics overview with KPIs',
        tags: ['analytics'],
        parameters: [
          {
            id: 'period',
            name: 'period',
            in: 'query',
            required: false,
            type: 'string',
            description: 'Time period for analytics',
            example: '30d',
          },
        ],
        responses: [
          {
            code: 200,
            description: 'Analytics data',
            contentType: 'application/json',
            schema: {
              type: 'object',
              description: 'Analytics data response',
              properties: {
                revenue: { type: 'number' },
                bookings: { type: 'integer' },
                customers: { type: 'integer' },
                conversionRate: { type: 'number' },
                trends: {
                  type: 'object',
                  description: 'Trend data',
                  properties: {
                    revenue: { type: 'array', items: { type: 'object' } },
                    bookings: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
            examples: {
              overview: {
                revenue: 125000.50,
                bookings: 45,
                customers: 38,
                conversionRate: 0.78,
                trends: {
                  revenue: [
                    { date: '2024-01-01', value: 12500 },
                    { date: '2024-01-02', value: 13200 },
                  ],
                  bookings: [
                    { date: '2024-01-01', value: 5 },
                    { date: '2024-01-02', value: 7 },
                  ],
                },
              },
            },
          },
        ],
        security: [{ type: 'bearer', name: 'Authorization' }],
        deprecated: false,
        version: '1.0',
        rateLimit: { requests: 30, window: '1m' },
        examples: [],
      },
    ];

    setTags(apiTags);
    setModels(apiModels);
    setEndpoints(apiEndpoints);
  };

  const toggleEndpointExpansion = (endpointId: string) => {
    setExpandedEndpoints(prev =>
      prev.includes(endpointId)
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    setIsTestingEndpoint(true);
    setSelectedEndpoint(endpoint);
    
    // Simulate API test
    setTimeout(() => {
      const mockResult = {
        status: 200,
        responseTime: Math.floor(Math.random() * 200) + 50,
        headers: {
          'Content-Type': 'application/json',
          'X-Rate-Limit-Remaining': '95',
        },
        body: endpoint.responses.find(r => r.code === 200)?.examples || {},
      };
      
      onEndpointTested?.(endpoint, mockResult);
      setIsTestingEndpoint(false);
      alert(`Test erfolgreich! Response Time: ${mockResult.responseTime}ms`);
    }, 1500);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return theme.palette.info.main;
      case 'POST': return theme.palette.success.main;
      case 'PUT': return theme.palette.warning.main;
      case 'PATCH': return theme.palette.warning.light;
      case 'DELETE': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(endpoint => {
      const tagMatch = selectedTag === 'all' || endpoint.tags.includes(selectedTag);
      const searchMatch = !searchTerm || 
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return tagMatch && searchMatch;
    });
  }, [endpoints, selectedTag, searchTerm]);

  const renderEndpointsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          API Endpoints
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => onDocumentationGenerated?.('openapi')}
          >
            OpenAPI Export
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsEndpointDialogOpen(true)}
          >
            Neuer Endpoint
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Tag</InputLabel>
              <Select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <MenuItem value="all">Alle Tags</MenuItem>
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Suche nach Pfad oder Beschreibung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              {filteredEndpoints.length} von {endpoints.length} Endpoints
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Endpoints List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredEndpoints.map((endpoint, index) => (
          <AnimatedCard key={endpoint.id} delay={index * 50}>
            <Paper elevation={1} sx={{ overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                }}
                onClick={() => toggleEndpointExpansion(endpoint.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={endpoint.method}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getMethodColor(endpoint.method), 0.1),
                      color: getMethodColor(endpoint.method),
                      fontWeight: 'bold',
                      minWidth: 60,
                    }}
                  />
                  
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', flex: 1 }}>
                    {endpoint.path}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ flex: 2 }}>
                    {endpoint.summary}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {endpoint.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                  
                  {endpoint.deprecated && (
                    <Chip label="DEPRECATED" size="small" color="error" />
                  )}
                  
                  <Badge
                    badgeContent={endpoint.responses.length}
                    color="primary"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <ExpandMoreIcon
                      sx={{
                        transform: expandedEndpoints.includes(endpoint.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </Badge>
                </Box>
              </Box>
              
              <Collapse in={expandedEndpoints.includes(endpoint.id)}>
                <Divider />
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {endpoint.description}
                  </Typography>
                  
                  {/* Parameters */}
                  {endpoint.parameters.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Parameter
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>In</TableCell>
                              <TableCell>Typ</TableCell>
                              <TableCell>Pflichtfeld</TableCell>
                              <TableCell>Beschreibung</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {endpoint.parameters.map(param => (
                              <TableRow key={param.id}>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{param.name}</TableCell>
                                <TableCell>
                                  <Chip label={param.in} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{param.type}</TableCell>
                                <TableCell>
                                  {param.required ? (
                                    <CheckCircleIcon color="error" sx={{ fontSize: 16 }} />
                                  ) : (
                                    <span>-</span>
                                  )}
                                </TableCell>
                                <TableCell>{param.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                  
                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Request Body
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {endpoint.requestBody.description}
                        </Typography>
                        <Chip
                          label={endpoint.requestBody.contentType}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                        {endpoint.requestBody.required && (
                          <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                        )}
                        
                        {endpoint.requestBody.examples && Object.keys(endpoint.requestBody.examples).length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Beispiel:
                            </Typography>
                            <SyntaxHighlighter
                              language="json"
                              style={oneLight}
                              customStyle={{
                                fontSize: '0.75rem',
                                margin: '8px 0',
                                borderRadius: '4px',
                              }}
                            >
                              {JSON.stringify(Object.values(endpoint.requestBody.examples)[0], null, 2)}
                            </SyntaxHighlighter>
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  )}
                  
                  {/* Responses */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Responses
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {endpoint.responses.map(response => (
                        <Paper key={response.code} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Chip
                              label={response.code}
                              size="small"
                              color={
                                response.code >= 200 && response.code < 300 ? 'success' :
                                response.code >= 400 && response.code < 500 ? 'warning' :
                                response.code >= 500 ? 'error' : 'default'
                              }
                            />
                            <Typography variant="body2">{response.description}</Typography>
                            <Chip
                              label={response.contentType}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          
                          {response.examples && Object.keys(response.examples).length > 0 && (
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Beispiel:
                              </Typography>
                              <SyntaxHighlighter
                                language="json"
                                style={oneLight}
                                customStyle={{
                                  fontSize: '0.75rem',
                                  margin: '8px 0',
                                  borderRadius: '4px',
                                }}
                              >
                                {JSON.stringify(Object.values(response.examples)[0], null, 2)}
                              </SyntaxHighlighter>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                  
                  {/* Security & Rate Limiting */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Security: {endpoint.security.length > 0 ? endpoint.security[0].type : 'None'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Rate Limit: {endpoint.rateLimit.requests}/{endpoint.rateLimit.window}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ApiIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Version: {endpoint.version}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={isTestingEndpoint ? <CircularProgress size={16} color="inherit" /> : <ApiIcon />}
                      onClick={() => testEndpoint(endpoint)}
                      disabled={isTestingEndpoint}
                    >
                      Test
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setIsEndpointDialogOpen(true);
                      }}
                    >
                      Bearbeiten
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FileCopyIcon />}
                    >
                      Duplizieren
                    </Button>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          </AnimatedCard>
        ))}
      </Box>
    </Box>
  );

  const renderModelsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          API Models
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Neues Model
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {models.map((model, index) => (
          <Grid item xs={12} md={6} key={model.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SchemaIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {model.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {model.description}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Properties ({Object.keys(model.properties).length})
                </Typography>
                
                <List dense>
                  {Object.entries(model.properties).slice(0, 5).map(([key, property]) => (
                    <ListItem key={key} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {key}
                            </Typography>
                            <Chip label={property.type} size="small" variant="outlined" />
                            {model.required.includes(key) && (
                              <Chip label="required" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={property.description}
                      />
                    </ListItem>
                  ))}
                  {Object.keys(model.properties).length > 5 && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="caption" color="text.secondary">
                            +{Object.keys(model.properties).length - 5} weitere Properties...
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Beispiel:
                  </Typography>
                  <SyntaxHighlighter
                    language="json"
                    style={oneLight}
                    customStyle={{
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(model.example, null, 2)}
                  </SyntaxHighlighter>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />}>
                    Bearbeiten
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<FileCopyIcon />}>
                    Schema kopieren
                  </Button>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDocumentationTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        API Dokumentation
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
                OpenAPI 3.0
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Generiere vollständige OpenAPI Spezifikation
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => onDocumentationGenerated?.('openapi')}
              >
                Download
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CodeIcon sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
                Postman Collection
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Exportiere als Postman Collection für Testing
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={() => onDocumentationGenerated?.('postman')}
              >
                Download
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <ApiIcon sx={{ fontSize: 48, color: 'info.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
                SDK Generator
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                Generiere Client SDKs für verschiedene Sprachen
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="info"
                startIcon={<CodeIcon />}
                onClick={() => onDocumentationGenerated?.('sdk')}
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          API Übersicht
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {endpoints.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Endpoints
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {models.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Models
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {tags.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tags
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                v1.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApiIcon color="primary" />
              REST API Specification
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
              >
                API Settings
              </Button>
              
              <Button
                variant="contained"
                startIcon={<CloudIcon />}
              >
                Deploy API
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Comprehensive RESTful API design with OpenAPI 3.0 specification and automated documentation
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Endpoints" icon={<HttpIcon />} />
            <Tab label="Models" icon={<SchemaIcon />} />
            <Tab label="Documentation" icon={<DescriptionIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderEndpointsTab()}
        {selectedTab === 1 && renderModelsTab()}
        {selectedTab === 2 && renderDocumentationTab()}
      </SlideInContainer>
    </Box>
  );
};

export default ApiSpecification;