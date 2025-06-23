import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Button,
  Fade,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { AIAssistantService, AIAction } from '../../services/ai/aiAssistantService';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: AIAction[];
  error?: boolean;
}

interface AIAssistantChatProps {
  apiKey?: string;
  onActionExecuted?: (action: AIAction, result: any) => void;
  initialExpanded?: boolean;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  apiKey,
  onActionExecuted,
  initialExpanded = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [aiService, setAiService] = useState<AIAssistantService | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (key) {
      setAiService(new AIAssistantService({ apiKey: key }));
    }
  }, [apiKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || !aiService || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.processCommand(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'ai',
        timestamp: new Date(),
        actions: response.actions
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          try {
            const result = await aiService.executeAction(action);
            if (onActionExecuted) {
              onActionExecuted(action, result);
            }
          } catch (error) {
            console.error('Error executing action:', error);
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        sender: 'ai',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getSuggestions = () => [
    'Erstelle ein Angebot für Max Mustermann',
    'Zeige alle Kunden aus Berlin',
    'Berechne den Preis für 45m³ und 100km',
    'Sende eine E-Mail an den letzten Kunden',
    'Erstelle eine Rechnung für Angebot #123'
  ];

  if (!aiService) {
    return (
      <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
        <Alert severity="warning">
          OpenAI API-Schlüssel nicht konfiguriert
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: expanded ? 400 : 60,
        height: expanded ? 600 : 60,
        transition: 'all 0.3s ease',
        zIndex: 1300
      }}
    >
      {!expanded ? (
        <Tooltip title="KI-Assistent öffnen">
          <IconButton
            color="primary"
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
            onClick={() => setExpanded(true)}
          >
            <Badge badgeContent={messages.length} color="error">
              <AIIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      ) : (
        <Paper
          elevation={8}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon />
              <Typography variant="h6">KI-Assistent</Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={clearChat}
              >
                <ClearIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'white' }}
                onClick={() => setExpanded(false)}
              >
                <CollapseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Wie kann ich Ihnen helfen?
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {getSuggestions().map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      sx={{ m: 0.5 }}
                      onClick={() => setInput(suggestion)}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <List>
                {messages.map((message, index) => (
                  <Fade in key={message.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                        gap: 1
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: message.sender === 'user' ? 'primary.main' : 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: message.sender === 'user' ? 'white' : 'text.primary'
                        }}
                      >
                        {message.sender === 'user' ? <PersonIcon /> : <AIIcon />}
                      </Box>
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '80%',
                          backgroundColor: message.error
                            ? 'error.light'
                            : message.sender === 'user'
                            ? 'primary.light'
                            : 'grey.100',
                          color: message.error || message.sender === 'user' ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                        {message.actions && message.actions.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {message.actions.map((action, idx) => (
                              <Chip
                                key={idx}
                                label={`Aktion: ${action.type}`}
                                size="small"
                                color="primary"
                                sx={{ mr: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7
                          }}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </ListItem>
                  </Fade>
                ))}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nachricht eingeben..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};