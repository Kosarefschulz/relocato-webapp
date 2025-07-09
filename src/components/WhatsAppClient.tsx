import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Paperclip, Image, FileText, MapPin, Search, Phone, Archive, Check, CheckCheck } from 'lucide-react';
import { whatsappService, WhatsAppMessage, WhatsAppConversation } from '../services/whatsappService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const WhatsAppClient: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
    
    // Set up real-time subscription
    const subscription = setupRealtimeSubscription();
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
      markAsRead(selectedConversation.conversation_id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupRealtimeSubscription = () => {
    // Subscribe to new messages
    const subscription = whatsappService.subscribeToMessages((payload) => {
      if (payload.new) {
        // Update conversations list
        loadConversations();
        
        // Update messages if in same conversation
        if (selectedConversation && payload.new.conversation_id === selectedConversation.conversation_id) {
          setMessages(prev => [payload.new, ...prev]);
        }
      }
    });

    return subscription;
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await whatsappService.getConversations('active');
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const data = await whatsappService.getMessages(conversationId);
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await whatsappService.markAsRead(conversationId);
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await whatsappService.sendTextMessage(
        selectedConversation.phone_number,
        newMessage
      );
      setNewMessage('');
      // Reload messages
      loadMessages(selectedConversation.conversation_id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    setSending(true);
    try {
      // Upload file to Supabase Storage first
      // Then send via WhatsApp
      // Implementation depends on your storage setup
      console.log('File upload not yet implemented');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.phone_number.includes(searchTerm) ||
    conv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message_preview?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white border-r border-gray-200`}>
        {/* Header */}
        <div className="p-4 bg-green-600 text-white">
          <h2 className="text-xl font-semibold mb-3">WhatsApp</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200 w-4 h-4" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-green-700 text-white placeholder-green-200 rounded-lg focus:outline-none focus:bg-green-800"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Keine Unterhaltungen vorhanden
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg font-semibold text-gray-600">
                    {conversation.customer_name?.charAt(0) || conversation.phone_number.slice(-2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conversation.customer_name || conversation.phone_number}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {conversation.last_message_at && formatMessageTime(conversation.last_message_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message_preview}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <div className="ml-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unread_count}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-gray-200 flex items-center">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden mr-3 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <span className="text-lg font-semibold text-gray-600">
                {selectedConversation.customer_name?.charAt(0) || selectedConversation.phone_number.slice(-2)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {selectedConversation.customer_name || selectedConversation.phone_number}
              </h3>
              <p className="text-sm text-gray-500">{selectedConversation.phone_number}</p>
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 ml-2">
              <Archive className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">
                Keine Nachrichten vorhanden
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOutbound = message.direction === 'outbound';
                  const showDate = index === 0 || 
                    new Date(messages[index - 1].timestamp).toDateString() !== 
                    new Date(message.timestamp).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: de })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOutbound
                              ? 'bg-green-100 text-gray-900'
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          {message.message_type === 'text' ? (
                            <p className="whitespace-pre-wrap">{message.text_content}</p>
                          ) : (
                            <div className="flex items-center">
                              {message.message_type === 'image' && <Image className="w-4 h-4 mr-2" />}
                              {message.message_type === 'document' && <FileText className="w-4 h-4 mr-2" />}
                              {message.message_type === 'location' && <MapPin className="w-4 h-4 mr-2" />}
                              <span className="text-sm">
                                {message.caption || `[${message.message_type}]`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {isOutbound && (
                              <span className="text-gray-500">
                                {message.status === 'read' ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                ) : message.status === 'delivered' ? (
                                  <CheckCheck className="w-4 h-4" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 hover:text-gray-900"
                disabled={sending}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Nachricht schreiben..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-green-500"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Business</h3>
            <p className="text-gray-600">Wählen Sie eine Unterhaltung aus, um zu beginnen</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppClient;