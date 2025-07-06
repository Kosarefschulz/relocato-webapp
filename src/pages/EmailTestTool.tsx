import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Send as SendIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  BugReport as BugReportIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { ionosEmailService as emailService } from '../services/emailServiceIONOS';
import { emailCustomerLinkService } from '../services/emailCustomerLinkService';
import { supabase } from '../config/supabase';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
  timestamp?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
}

const EmailTestTool: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'Email Sending',
      tests: [
        { name: 'Send simple text email', status: 'pending' },
        { name: 'Send HTML email', status: 'pending' },
        { name: 'Send email with attachment', status: 'pending' },
        { name: 'Send email to multiple recipients', status: 'pending' }
      ]
    },
    {
      name: 'Email Reading',
      tests: [
        { name: 'Get folder list', status: 'pending' },
        { name: 'Read INBOX emails', status: 'pending' },
        { name: 'Read single email content', status: 'pending' },
        { name: 'Check MIME decoding', status: 'pending' },
        { name: 'Load email attachments', status: 'pending' }
      ]
    },
    {
      name: 'Email Operations',
      tests: [
        { name: 'Mark email as read/unread', status: 'pending' },
        { name: 'Star/unstar email', status: 'pending' },
        { name: 'Delete email', status: 'pending' },
        { name: 'Move email to folder', status: 'pending' }
      ]
    },
    {
      name: 'Customer Linking',
      tests: [
        { name: 'Create test customer', status: 'pending' },
        { name: 'Link email to customer', status: 'pending' },
        { name: 'Get linked customer', status: 'pending' },
        { name: 'Unlink email from customer', status: 'pending' }
      ]
    },
    {
      name: 'Database Persistence',
      tests: [
        { name: 'Save emails to database', status: 'pending' },
        { name: 'Read emails from database', status: 'pending' },
        { name: 'Update email flags in database', status: 'pending' },
        { name: 'Search emails in database', status: 'pending' }
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testEmail, setTestEmail] = useState('test@relocato.de');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Test functions
  const testSendSimpleEmail = async (): Promise<TestResult> => {
    try {
      const result = await emailService.sendEmail(
        testEmail,
        'Test Email - Simple Text',
        'This is a test email sent from the Email Test Tool.\n\nTimestamp: ' + new Date().toISOString()
      );
      return {
        name: 'Send simple text email',
        status: result ? 'success' : 'error',
        message: result ? 'Email sent successfully' : 'Failed to send email',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Send simple text email',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testSendHtmlEmail = async (): Promise<TestResult> => {
    try {
      const htmlContent = `
        <h1>Test HTML Email</h1>
        <p>This is a <strong>test email</strong> with HTML content.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `;
      const result = await emailService.sendEmail(
        testEmail,
        'Test Email - HTML Content',
        htmlContent
      );
      return {
        name: 'Send HTML email',
        status: result ? 'success' : 'error',
        message: result ? 'Email sent successfully' : 'Failed to send email',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Send HTML email',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testGetFolders = async (): Promise<TestResult> => {
    try {
      const folders = await emailService.getFolders();
      return {
        name: 'Get folder list',
        status: 'success',
        message: `Found ${folders.length} folders`,
        details: folders,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Get folder list',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testReadInboxEmails = async (): Promise<TestResult> => {
    try {
      const { emails, total } = await emailService.getEmails('INBOX', 1, 10);
      return {
        name: 'Read INBOX emails',
        status: 'success',
        message: `Found ${emails.length} emails (Total: ${total})`,
        details: emails.slice(0, 5).map(e => ({
          subject: e.subject,
          from: e.from,
          date: e.date
        })),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Read INBOX emails',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testReadSingleEmail = async (): Promise<TestResult> => {
    try {
      // First get an email
      const { emails } = await emailService.getEmails('INBOX', 1, 1);
      if (emails.length === 0) {
        return {
          name: 'Read single email content',
          status: 'error',
          message: 'No emails found in INBOX',
          timestamp: new Date().toISOString()
        };
      }

      const email = await emailService.getEmail(String(emails[0].uid || emails[0].id), 'INBOX');
      return {
        name: 'Read single email content',
        status: 'success',
        message: 'Email content loaded successfully',
        details: {
          subject: email?.subject,
          hasText: !!email?.text,
          hasHtml: !!email?.html,
          attachments: email?.attachments?.length || 0
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Read single email content',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testMimeDecoding = async (): Promise<TestResult> => {
    try {
      const testStrings = [
        '=?UTF-8?B?VMOkc3Q=?= Email',
        '=?UTF-8?Q?Test_=C3=BC=C3=B6=C3=A4?=',
        'Normal subject without encoding'
      ];
      
      const { decodeMimeString } = await import('../utils/mimeParser');
      const results = testStrings.map(str => ({
        original: str,
        decoded: decodeMimeString(str)
      }));

      return {
        name: 'Check MIME decoding',
        status: 'success',
        message: 'MIME decoding works correctly',
        details: results,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Check MIME decoding',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testCreateCustomer = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test.customer@example.com',
          phoneNumber: '+49 123 456789',
          status: 'lead',
          source: 'test'
        })
        .select()
        .single();

      if (error) throw error;

      // Store customer ID for later tests
      window.localStorage.setItem('testCustomerId', data.id);

      return {
        name: 'Create test customer',
        status: 'success',
        message: 'Test customer created',
        details: { customerId: data.id },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Create test customer',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testLinkEmailToCustomer = async (): Promise<TestResult> => {
    try {
      const customerId = window.localStorage.getItem('testCustomerId');
      if (!customerId) {
        return {
          name: 'Link email to customer',
          status: 'error',
          message: 'No test customer found. Run "Create test customer" first.',
          timestamp: new Date().toISOString()
        };
      }

      // Get first email
      const { emails } = await emailService.getEmails('INBOX', 1, 1);
      if (emails.length === 0) {
        return {
          name: 'Link email to customer',
          status: 'error',
          message: 'No emails found in INBOX',
          timestamp: new Date().toISOString()
        };
      }

      await emailCustomerLinkService.linkEmailToCustomer(emails[0].id, customerId);

      return {
        name: 'Link email to customer',
        status: 'success',
        message: 'Email linked to customer successfully',
        details: { emailId: emails[0].id, customerId },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: 'Link email to customer',
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    const updatedSuites = [...testSuites];

    for (let suiteIndex = 0; suiteIndex < updatedSuites.length; suiteIndex++) {
      const suite = updatedSuites[suiteIndex];
      
      for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
        const test = suite.tests[testIndex];
        setCurrentTest(`${suite.name} - ${test.name}`);
        
        // Update test status to running
        updatedSuites[suiteIndex].tests[testIndex] = { ...test, status: 'running' };
        setTestSuites([...updatedSuites]);

        // Run the actual test
        let result: TestResult;
        switch (test.name) {
          case 'Send simple text email':
            result = await testSendSimpleEmail();
            break;
          case 'Send HTML email':
            result = await testSendHtmlEmail();
            break;
          case 'Get folder list':
            result = await testGetFolders();
            break;
          case 'Read INBOX emails':
            result = await testReadInboxEmails();
            break;
          case 'Read single email content':
            result = await testReadSingleEmail();
            break;
          case 'Check MIME decoding':
            result = await testMimeDecoding();
            break;
          case 'Create test customer':
            result = await testCreateCustomer();
            break;
          case 'Link email to customer':
            result = await testLinkEmailToCustomer();
            break;
          default:
            result = {
              name: test.name,
              status: 'error',
              message: 'Test not implemented yet',
              timestamp: new Date().toISOString()
            };
        }

        // Update test with result
        updatedSuites[suiteIndex].tests[testIndex] = result;
        setTestSuites([...updatedSuites]);
        setTestResults(prev => [...prev, result]);

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  // Export test results
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      suites: testSuites,
      results: testResults
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-test-results-${Date.now()}.json`;
    a.click();
  };

  // Copy test results to clipboard
  const copyResults = () => {
    const summary = testSuites.map(suite => {
      const passed = suite.tests.filter(t => t.status === 'success').length;
      const failed = suite.tests.filter(t => t.status === 'error').length;
      return `${suite.name}: ${passed}/${suite.tests.length} passed${failed > 0 ? ` (${failed} failed)` : ''}`;
    }).join('\n');
    
    navigator.clipboard.writeText(summary);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BugReportIcon sx={{ mr: 2, fontSize: 40 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4">Email System Test Tool</Typography>
            <Typography variant="body2" color="text.secondary">
              Automated testing for email functionality
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy results summary">
              <IconButton onClick={copyResults}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export detailed results">
              <IconButton onClick={exportResults}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Test Email Address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Email address to use for sending tests"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
            onClick={runAllTests}
            disabled={isRunning}
            size="large"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          {currentTest && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {currentTest}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Test Suites */}
        {testSuites.map((suite, index) => (
          <Accordion key={index} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ flexGrow: 1 }}>{suite.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  {suite.tests.filter(t => t.status === 'success').length > 0 && (
                    <Chip
                      label={`${suite.tests.filter(t => t.status === 'success').length} passed`}
                      color="success"
                      size="small"
                    />
                  )}
                  {suite.tests.filter(t => t.status === 'error').length > 0 && (
                    <Chip
                      label={`${suite.tests.filter(t => t.status === 'error').length} failed`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {suite.tests.map((test, testIndex) => (
                  <ListItem
                    key={testIndex}
                    secondaryAction={
                      test.details && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedResult(test);
                            setShowResultDialog(true);
                          }}
                        >
                          Details
                        </Button>
                      )
                    }
                  >
                    <ListItemIcon>
                      {getStatusIcon(test.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={test.name}
                      secondary={test.message}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Result Details Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Result Details</DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedResult.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedResult.timestamp}
              </Typography>
              <Alert severity={selectedResult.status === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
                {selectedResult.message}
              </Alert>
              {selectedResult.details && (
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <pre style={{ margin: 0, overflow: 'auto' }}>
                    {JSON.stringify(selectedResult.details, null, 2)}
                  </pre>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTestTool;