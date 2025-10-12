import { useState, useEffect, useRef } from "react";
// Remove AdminPage import - we'll use a simple div wrapper
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import {
  Search,
  MessageSquare,
  Send,
  Mail,
  MailOpen,
  User,
  Plus,
  Reply,
  Trash2
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  message_type: string;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  recipient?: {
    full_name: string;
    email: string;
  };
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterType, setFilterType] = useState<string>('all');
  const loadingRef = useRef(false);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('admin-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔄 Messages: Real-time update received:', payload);
          // Only reload if we're not already loading
          if (!loadingRef.current) {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Messages: Unsubscribing from real-time updates');
      messagesSubscription.unsubscribe();
    };
  }, []);

  const loadMessages = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, email),
          recipient:recipient_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.sender?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || message.message_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeVariant = (type: string) => {
    switch (type) {
      case 'support':
        return 'destructive';
      case 'order':
        return 'default';
      case 'marketing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const messageStats = {
    total: messages.length,
    unread: messages.filter(m => !m.is_read).length,
    support: messages.filter(m => m.message_type === 'support').length,
    order: messages.filter(m => m.message_type === 'order').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="support">Support</option>
                  <option value="order">Order</option>
                  <option value="general">General</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{messageStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{messageStats.unread}</div>
                  <div className="text-sm text-gray-600">Unread</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{messageStats.support}</div>
                  <div className="text-sm text-gray-600">Support</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{messageStats.order}</div>
                  <div className="text-sm text-gray-600">Orders</div>
                </CardContent>
              </Card>
            </div>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>Messages ({filteredMessages.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        !message.is_read ? 'bg-blue-50' : ''
                      } ${selectedMessage?.id === message.id ? 'bg-primary/10' : ''}`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {message.is_read ? (
                            <MailOpen className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Mail className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="font-medium">
                            {message.sender?.full_name || message.sender?.email || 'Unknown'}
                          </span>
                          <Badge variant={getMessageTypeVariant(message.message_type)}>
                            {message.message_type}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{message.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail & Reply */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Message Details</CardTitle>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {selectedMessage.sender?.full_name || 'Unknown User'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedMessage.sender?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedMessage.created_at)}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">{selectedMessage.subject}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Reply</h4>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="mb-3"
                      rows={4}
                    />
                    <Button className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No Message Selected</h3>
                  <p className="text-sm text-gray-600">
                    Select a message from the list to view details and reply.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
  );
}
