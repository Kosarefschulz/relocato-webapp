import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Button,
  Fade,
  Tooltip,
  Badge,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Collapse,
  Menu,
  MenuItem,
  LinearProgress
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Settings as SettingsIcon,
  Psychology as ThinkingIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  MoreVert as MoreIcon,
  Lightbulb as SuggestionIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  Assignment as TaskIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { AIAssistantServiceV2, AIResponse } from '../../services/ai/aiAssistantServiceV2';
import { useAuth } from '../../contexts/AuthContext';
import { aiConfigService } from '../../services/ai/aiConfigService';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actions?: any[];
  suggestions?: string[];
  isThinking?: boolean;
  error?: boolean;
  feedback?: 'positive' | 'negative';
}

interface AIAssistantChatV2Props {
  apiKey?: string;
  onActionExecuted?: (action: any, result: any) => void;
  initialExpanded?: boolean;
}

export const AIAssistantChatV2: React.FC<AIAssistantChatV2Props> = ({
  apiKey,
  onActionExecuted,
  initialExpanded = false
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hallo! 👋 Ich bin Ihr intelligenter Umzugs-Assistent. 

Ich kenne mich mit dem gesamten System aus und kann Ihnen bei allen Aufgaben helfen:
• **Kundenmanagement** - Suchen, anlegen, bearbeiten
• **Angebote & Preise** - Kalkulationen und Erstellung
• **Rechnungen** - Erstellen und verwalten
• **E-Mails** - Professionelle Kommunikation
• **Analysen** - Geschäftseinblicke und Trends

Fragen Sie mich einfach irgendetwas! Ich denke mit und gebe Ihnen proaktive Vorschläge.`,
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'Was sind die aktuellen Geschäftszahlen?',
        'Erstelle ein Angebot für 35m³',
        'Zeige Kunden aus Berlin',
        'Wie optimiere ich meine Preise?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [aiService, setAiService] = useState<AIAssistantServiceV2 | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [backgroundTasks, setBackgroundTasks] = useState<Map<string, any>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialisiere AI Service mit Default Config
    const initAIService = async () => {
      try {
        const config = await aiConfigService.getConfig();
        if (config && config.apiKey) {
          setAiService(new AIAssistantServiceV2({ 
            apiKey: config.apiKey,
            model: config.model 
          }));
        }
      } catch (error) {
        console.error('Error initializing AI service:', error);
      }
    };
    
    initAIService();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if ((!messageText.trim() && attachedImages.length === 0) || !aiService || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    // Zeige "Denkt nach..." Nachricht
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Verwende erweiterte Funktion für Hintergrundaufgaben
      const response: AIResponse = await aiService.processEnhancedMessage(messageText, attachedImages);
      
      // Entferne "Denkt nach..." und füge echte Antwort hinzu
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMessage.id);
        return [...filtered, {
          id: (Date.now() + 2).toString(),
          text: response.message,
          sender: 'ai',
          timestamp: new Date(),
          actions: response.actions,
          suggestions: response.suggestions
        }];
      });

      // Führe Aktionen aus, wenn vorhanden
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          try {
            const result = await aiService.executeAction(action);
            if (onActionExecuted) {
              onActionExecuted(action, result);
            }
            
            // Zeige Aktionsergebnis
            if (result.message) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `✅ ${result.message}`,
                sender: 'ai',
                timestamp: new Date()
              }]);
            }
            
            // Verfolge Hintergrundaufgaben
            if (action.type === 'background_task' && result.taskId) {
              setBackgroundTasks(prev => new Map(prev).set(result.taskId, {
                status: 'processing',
                ...action.data
              }));
              
              // Prüfe Status periodisch
              checkBackgroundTaskStatus(result.taskId);
            }
          } catch (error) {
            console.error('Error executing action:', error);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: `❌ Fehler bei Aktion: ${error instanceof Error ? error.message : 'Unbekannt'}`,
              sender: 'ai',
              timestamp: new Date(),
              error: true
            }]);
          }
        }
      }
    } catch (error) {
      // Entferne "Denkt nach..." bei Fehler
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `Entschuldigung, es ist ein Fehler aufgetreten. Ich versuche trotzdem zu helfen! 

Was kann ich für Sie tun? Hier einige Möglichkeiten:`,
        sender: 'ai',
        timestamp: new Date(),
        error: true,
        suggestions: [
          'Kundenübersicht anzeigen',
          'Preise kalkulieren',
          'Angebot erstellen',
          'Hilfe zum System'
        ]
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

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleMessageAction = (messageId: string, action: 'copy' | 'thumbsUp' | 'thumbsDown') => {
    if (action === 'copy') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.text);
      }
    } else {
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, feedback: action === 'thumbsUp' ? 'positive' : 'negative' }
          : m
      ));
    }
    setAnchorEl(null);
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Behalte Willkommensnachricht
    if (aiService) {
      aiService.clearHistory();
    }
  };

  const checkBackgroundTaskStatus = async (taskId: string) => {
    if (!aiService) return;
    
    const checkStatus = async () => {
      const status = await aiService.getBackgroundTaskStatus(taskId);
      
      if (status) {
        setBackgroundTasks(prev => new Map(prev).set(taskId, status));
        
        if (status.status === 'completed') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `✅ Hintergrundaufgabe abgeschlossen: ${status.result?.message || 'Erfolgreich'}`,
            sender: 'ai',
            timestamp: new Date()
          }]);
        } else if (status.status === 'failed') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `❌ Hintergrundaufgabe fehlgeschlagen: ${status.error}`,
            sender: 'ai',
            timestamp: new Date(),
            error: true
          }]);
        } else if (status.status === 'processing') {
          // Prüfe erneut in 2 Sekunden
          setTimeout(checkStatus, 2000);
        }
      }
    };
    
    checkStatus();
  };

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
        width: expanded ? { xs: '95%', sm: 450, md: 500 } : 60,
        height: expanded ? { xs: '80vh', sm: 650 } : 60,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              boxShadow: 3,
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s'
            }}
            onClick={() => setExpanded(true)}
          >
            <Badge badgeContent={messages.length - 1} color="error">
              <AIIcon fontSize="large" />
            </Badge>
          </IconButton>
        </Tooltip>
      ) : (
        <Paper
          elevation={12}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AIIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  KI-Assistent
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Powered by GPT-4
                </Typography>
              </Box>
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

          {/* Messages */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 1 }}>
            <List sx={{ py: 0 }}>
              {messages.map((message, index) => (
                <Fade in key={message.id}>
                  <ListItem
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      gap: 1,
                      px: 0,
                      py: 1
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.300',
                        fontSize: '0.9rem'
                      }}
                    >
                      {message.sender === 'user' ? <PersonIcon /> : <AIIcon />}
                    </Avatar>
                    
                    <Box sx={{ maxWidth: '80%' }}>
                      <Card
                        sx={{
                          bgcolor: message.error
                            ? 'error.light'
                            : message.sender === 'user'
                            ? 'primary.light'
                            : 'background.paper',
                          color: message.error || message.sender === 'user' ? 'white' : 'text.primary',
                          boxShadow: 1,
                          position: 'relative'
                        }}
                      >
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          {message.isThinking ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                Denke nach...
                              </Typography>
                            </Box>
                          ) : (
                            <>
                              <Box sx={{ 
                                '& p': { m: 0, mb: 1 }, 
                                '& p:last-child': { mb: 0 },
                                '& ul': { mt: 0.5, mb: 1, pl: 2.5 },
                                '& li': { mb: 0.5 },
                                '& strong': { fontWeight: 600 }
                              }}>
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                              </Box>
                              
                              {/* Actions */}
                              {message.actions && message.actions.length > 0 && (
                                <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {message.actions.map((action, idx) => (
                                    <Chip
                                      key={idx}
                                      label={action.description || action.type}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ 
                                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                                        fontSize: '0.75rem'
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                              
                              {/* Timestamp and Actions */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mt: 1
                              }}>
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.6, fontSize: '0.7rem' }}
                                >
                                  {message.timestamp.toLocaleTimeString('de-DE', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Typography>
                                
                                {message.sender === 'ai' && (
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton 
                                      size="small" 
                                      sx={{ p: 0.5 }}
                                      onClick={() => handleMessageAction(message.id, 'copy')}
                                    >
                                      <CopyIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      sx={{ 
                                        p: 0.5,
                                        color: message.feedback === 'positive' ? 'success.main' : 'inherit'
                                      }}
                                      onClick={() => handleMessageAction(message.id, 'thumbsUp')}
                                    >
                                      <ThumbUpIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      sx={{ 
                                        p: 0.5,
                                        color: message.feedback === 'negative' ? 'error.main' : 'inherit'
                                      }}
                                      onClick={() => handleMessageAction(message.id, 'thumbsDown')}
                                    >
                                      <ThumbDownIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <Collapse in={showSuggestions}>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <SuggestionIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                            {message.suggestions.map((suggestion, idx) => (
                              <Chip
                                key={idx}
                                label={suggestion}
                                size="small"
                                variant="outlined"
                                onClick={() => handleSuggestionClick(suggestion)}
                                sx={{ 
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Collapse>
                      )}
                    </Box>
                  </ListItem>
                </Fade>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Divider />

          {/* Attached Images */}
          {attachedImages.length > 0 && (
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Angehängte Bilder:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                {attachedImages.map((img, idx) => (
                  <Chip
                    key={idx}
                    icon={<ImageIcon />}
                    label={`Bild ${idx + 1}`}
                    size="small"
                    onDelete={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Background Tasks */}
          {backgroundTasks.size > 0 && (
            <Box sx={{ px: 2, pb: 1 }}>
              {Array.from(backgroundTasks.entries()).map(([id, task]) => (
                <Box key={id} sx={{ mb: 0.5 }}>
                  <LinearProgress 
                    variant={task.status === 'processing' ? 'indeterminate' : 'determinate'} 
                    value={task.status === 'completed' ? 100 : 0}
                    sx={{ height: 2, mb: 0.5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    <TaskIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    {task.customerName} - {task.amount}€
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Input */}
          <Box sx={{ p: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      setAttachedImages(prev => [...prev, base64.split(',')[1]]);
                    };
                    reader.readAsDataURL(file);
                  });
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ alignSelf: 'flex-end' }}
              >
                <AttachIcon />
              </IconButton>
              <TextField
                inputRef={inputRef}
                fullWidth
                placeholder="Fragen Sie mich alles..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                InputProps={{
                  startAdornment: loading && (
                    <InputAdornment position="start">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  )
                }}
              />
              <IconButton
                color="primary"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
            
            {/* Quick Actions */}
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Schnellaktionen:
              </Typography>
              {['Hilfe', 'Statistiken', 'Neuer Kunde'].map((action) => (
                <Chip
                  key={action}
                  label={action}
                  size="small"
                  onClick={() => handleSuggestionClick(action)}
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};