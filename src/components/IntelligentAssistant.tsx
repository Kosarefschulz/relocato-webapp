import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Chip,
  Button,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Calculate as CalculateIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  AttachFile as AttachFileIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { intelligentAssistant } from '../services/ai/intelligentAssistantService';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  steps?: number;
  actions?: any[];
}

interface IntelligentAssistantProps {
  customerId?: string;
  onActionRequested?: (action: string, data: any) => void;
}

export const IntelligentAssistant: React.FC<IntelligentAssistantProps> = ({
  customerId,
  onActionRequested
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kontext beim ersten Laden initialisieren
  useEffect(() => {
    initializeContext();
  }, []);

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeContext = async () => {
    try {
      setLoading(true);
      await intelligentAssistant.loadSupabaseContext();
      setContextLoaded(true);

      // Begrüßungsnachricht
      setMessages([{
        role: 'assistant',
        content: '👋 Hallo! Ich bin dein intelligenter CRM-Assistent. Ich habe Zugriff auf alle deine Kunden, Angebote und Rechnungen. Wie kann ich dir helfen?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Fehler beim Initialisieren:', error);
      setMessages([{
        role: 'assistant',
        content: '❌ Fehler beim Laden des Kontexts. Bitte versuche es erneut.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: input || 'Analysiere dieses Bild',
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await intelligentAssistant.chat(
        userMessage.content,
        selectedImage || undefined
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        steps: result.steps,
        actions: result.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSelectedImage(null);

      // Falls Multi-Step ausgeführt wurde
      if (result.steps && result.steps > 1) {
        console.log(`✅ Multi-Step completed: ${result.steps} steps, ${result.actions?.length || 0} actions`);
      }

      // Falls Aktionen ausgeführt wurden, Kontext neu laden
      if (result.actions && result.actions.length > 0) {
        console.log('✅ Aktionen ausgeführt:', result.actions);
      }
    } catch (error) {
      console.error('Chat-Fehler:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAction = (action: string) => {
    setAnchorEl(null);

    const prompts: { [key: string]: string } = {
      create_customer: 'Lege einen neuen Kunden an',
      search: 'Suche nach Kunden mit offenen Angeboten',
      calculate: 'Erstelle eine Nachberechnung für den letzten Umzug',
      analyze: 'Analysiere die Pipeline und gib mir Optimierungsvorschläge',
      summary: 'Gib mir eine Zusammenfassung der heutigen Aktivitäten'
    };

    if (prompts[action]) {
      setInput(prompts[action]);
    }
  };

  const handleRefreshContext = async () => {
    setLoading(true);
    try {
      await intelligentAssistant.loadSupabaseContext();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '✅ Kontext aktualisiert! Ich habe jetzt die neuesten Daten.',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    intelligentAssistant.resetChat();
    setMessages([{
      role: 'assistant',
      content: '👋 Chat zurückgesetzt. Wie kann ich dir helfen?',
      timestamp: new Date()
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'transparent'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40
            }}
          >
            <AIIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              ✨ Intelligente Suche
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {contextLoaded ? '🟢 Verbunden' : '🔴 Nicht verbunden'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Kontext aktualisieren">
            <IconButton onClick={handleRefreshContext} size="small" sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chat löschen">
            <IconButton onClick={handleClearChat} size="small" sx={{ color: 'white' }}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Schnellaktionen */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Chip
          icon={<PersonAddIcon />}
          label="Kunde anlegen"
          onClick={() => handleQuickAction('create_customer')}
          sx={{
            bgcolor: 'rgba(34, 197, 94, 0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.3)' }
          }}
        />
        <Chip
          icon={<SearchIcon />}
          label="Kunden suchen"
          onClick={() => handleQuickAction('search')}
          sx={{
            bgcolor: 'rgba(99, 102, 241, 0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.3)' }
          }}
        />
        <Chip
          icon={<CalculateIcon />}
          label="Nachberechnung"
          onClick={() => handleQuickAction('calculate')}
          sx={{
            bgcolor: 'rgba(168, 85, 247, 0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(168, 85, 247, 0.3)' }
          }}
        />
        <Chip
          icon={<AssessmentIcon />}
          label="Analyse"
          onClick={() => handleQuickAction('analyze')}
          sx={{
            bgcolor: 'rgba(236, 72, 153, 0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.3)' }
          }}
        />
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <AIIcon fontSize="small" />
                  </Avatar>
                )}

                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.role === 'user'
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  {message.image && (
                    <Box
                      component="img"
                      src={message.image}
                      sx={{
                        maxWidth: '100%',
                        borderRadius: 1,
                        mb: 1
                      }}
                    />
                  )}

                  {/* Multi-Step Badge */}
                  {message.steps && message.steps > 1 && (
                    <Chip
                      label={`${message.steps} Steps · ${message.actions?.length || 0} Aktionen`}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        fontWeight: 600
                      }}
                    />
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.content}
                  </Typography>

                  {/* Actions Details (collapsed) */}
                  {message.actions && message.actions.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 1 }}>
                        Ausgeführte Aktionen:
                      </Typography>
                      {message.actions.map((action, idx) => (
                        <Chip
                          key={idx}
                          label={action.type}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            bgcolor: action.status === 'completed'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: action.status === 'completed' ? '#22c55e' : '#ef4444'
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Paper>

                {message.role === 'user' && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {selectedImage && (
          <Box
            sx={{
              mb: 2,
              position: 'relative',
              display: 'inline-block'
            }}
          >
            <Box
              component="img"
              src={selectedImage}
              sx={{
                maxWidth: 200,
                maxHeight: 100,
                borderRadius: 1,
                border: '2px solid rgba(99, 102, 241, 0.5)'
              }}
            />
            <IconButton
              size="small"
              onClick={() => setSelectedImage(null)}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                '&:hover': { bgcolor: 'error.dark' }
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <Tooltip title="Bild hochladen">
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Frage etwas über Kunden, Angebote, Wissen..."
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main'
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          />

          <IconButton
            onClick={handleSendMessage}
            disabled={loading || (!input.trim() && !selectedImage)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default IntelligentAssistant;
