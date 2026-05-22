import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Search,
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Phone,
  Video,
  Info,
  ArrowDown,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SenderDevice {
  id: string;
  label: string;
  phone_number: string | null;
  status: "connected" | "connecting" | "disconnected" | "qr_ready" | "expired";
  type: "qr" | "dripsender" | "cloudchat" | "meta";
}

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  deviceId: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  direction: "in" | "out";
  status?: "sent" | "delivered" | "read" | "failed";
  type: "text" | "image" | "document" | "audio";
}

const CONNECTION_TYPE_LABELS = {
  qr: "QR",
  dripsender: "DS",
  cloudchat: "CC",
  meta: "META",
};

const STATUS_COLORS = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  disconnected: "bg-red-500",
  qr_ready: "bg-blue-500",
  expired: "bg-gray-500",
};

export default function LiveChatPage() {
  const { t } = useI18n();
  const [devices, setDevices] = useState<SenderDevice[]>([]);
  const [collapsedDevices, setCollapsedDevices] = useState<Set<string>>(new Set());
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Mock chat data per device
  const [chatsByDevice, setChatsByDevice] = useState<Record<string, ChatContact[]>>({});

  useEffect(() => {
    fetchDevices();
    loadCollapsedState();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDevices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("sender_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "connected")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const typedDevices = data as SenderDevice[];
      setDevices(typedDevices);
      
      // Generate mock chats for each device
      const mockChats: Record<string, ChatContact[]> = {};
      typedDevices.forEach((device) => {
        mockChats[device.id] = generateMockChats(device.id, 5);
      });
      setChatsByDevice(mockChats);
    }
  };

  const generateMockChats = (deviceId: string, count: number): ChatContact[] => {
    const names = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Eve Martinez", "Frank Brown", "Grace Lee", "Henry Taylor"];
    return Array.from({ length: count }, (_, i) => ({
      id: `${deviceId}-chat-${i}`,
      name: names[i % names.length],
      phone: `+628${Math.floor(Math.random() * 900000000 + 100000000)}`,
      lastMessage: i === 0 ? "Hi, how can I help?" : "Thanks for your message",
      lastMessageTime: i === 0 ? "2m ago" : `${Math.floor(Math.random() * 60)}m ago`,
      unreadCount: i === 0 ? Math.floor(Math.random() * 5) : 0,
      deviceId,
    }));
  };

  const fetchMessages = async (chatId: string) => {
    // Mock messages
    const mockMessages: Message[] = [
      {
        id: "1",
        content: "Hi there! How can I assist you today?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        direction: "in",
        type: "text",
      },
      {
        id: "2",
        content: "Hello! I need some information about your services.",
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        direction: "out",
        status: "read",
        type: "text",
      },
      {
        id: "3",
        content: "Of course! What would you like to know?",
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        direction: "in",
        type: "text",
      },
      {
        id: "4",
        content: "Can you tell me about pricing?",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        direction: "out",
        status: "read",
        type: "text",
      },
      {
        id: "5",
        content: "Sure! Our pricing starts at $10/month for basic features.",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        direction: "in",
        type: "text",
      },
    ];
    setMessages(mockMessages);
  };

  const loadCollapsedState = () => {
    const saved = localStorage.getItem("collapsed-devices");
    if (saved) {
      setCollapsedDevices(new Set(JSON.parse(saved)));
    }
  };

  const toggleDeviceCollapse = (deviceId: string) => {
    const newCollapsed = new Set(collapsedDevices);
    if (newCollapsed.has(deviceId)) {
      newCollapsed.delete(deviceId);
    } else {
      newCollapsed.add(deviceId);
    }
    setCollapsedDevices(newCollapsed);
    localStorage.setItem("collapsed-devices", JSON.stringify(Array.from(newCollapsed)));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      timestamp: new Date().toISOString(),
      direction: "out",
      status: "sent",
      type: "text",
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");

    // Simulate delivery status updates
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: "delivered" } : m
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: "read" } : m
      ));
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const startResize = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(280, Math.min(500, e.clientX));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusIcon = (status?: string) => {
    if (status === "sent") return "✓";
    if (status === "delivered") return "✓✓";
    if (status === "read") return <span className="text-blue-500">✓✓</span>;
    if (status === "failed") return "⚠";
    return "";
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-background">
        {/* Topbar */}
        <div className="h-16 border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-mono font-bold">Live Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {devices.length} Device{devices.length !== 1 ? "s" : ""} Connected
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div
            className={cn(
              "border-r bg-muted/30 flex flex-col transition-all duration-200",
              sidebarOpen ? "block" : "hidden lg:block",
              "lg:relative absolute inset-y-0 left-0 z-50 lg:z-0"
            )}
            style={{ width: leftPanelWidth }}
          >
            {devices.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-mono text-muted-foreground">No connected devices</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect a device to start chatting
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {devices.map((device) => {
                  const isCollapsed = collapsedDevices.has(device.id);
                  const deviceChats = chatsByDevice[device.id] || [];

                  return (
                    <div key={device.id} className="border-b">
                      {/* Device Section Header */}
                      <div
                        className="flex items-center justify-between p-3 bg-background cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleDeviceCollapse(device.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="font-mono text-sm truncate">
                            {device.phone_number || device.label}
                          </span>
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_COLORS[device.status])} />
                          <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                            {CONNECTION_TYPE_LABELS[device.type]}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Disconnect</DropdownMenuItem>
                            <DropdownMenuItem>Hide Device</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Chat List for this Device */}
                      {!isCollapsed && (
                        <div>
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search chats..."
                                className="pl-9 h-9 font-mono text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            {deviceChats
                              .filter(chat =>
                                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                chat.phone.includes(searchQuery)
                              )
                              .map((chat) => (
                                <div
                                  key={chat.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                    selectedChat?.id === chat.id && "bg-muted"
                                  )}
                                  onClick={() => {
                                    setSelectedChat(chat);
                                    setSidebarOpen(false);
                                  }}
                                >
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage src={chat.avatar} />
                                    <AvatarFallback className="font-mono text-xs">
                                      {chat.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono text-sm font-medium truncate">
                                        {chat.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {chat.lastMessageTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs text-muted-foreground truncate">
                                        {chat.lastMessage}
                                      </p>
                                      {chat.unreadCount > 0 && (
                                        <Badge variant="default" className="h-5 px-1.5 text-xs font-mono">
                                          {chat.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </ScrollArea>
            )}

            {/* Resize Handle */}
            <div
              className="absolute top-0 right-0 bottom-0 w-1 hover:w-2 cursor-col-resize bg-border hover:bg-accent transition-all"
              onMouseDown={startResize}
            />
          </div>

          {/* Right Panel - Chat Window */}
          <div className="flex-1 flex flex-col bg-background">
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-mono text-lg text-muted-foreground">Select a chat to start messaging</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a conversation from the left panel
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => {
                        setSidebarOpen(true);
                        setSelectedChat(null);
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback className="font-mono text-xs">
                        {selectedChat.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-mono font-medium">{selectedChat.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedChat.phone}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      via {devices.find(d => d.id === selectedChat.deviceId)?.phone_number}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Contact Info</DropdownMenuItem>
                        <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                        <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Block Contact</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea
                  className="flex-1 p-4 lg:p-6"
                  onScroll={handleScroll}
                >
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-6">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-mono">Today</span>
                      <Separator className="flex-1" />
                    </div>

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.direction === "out" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.direction === "out"
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.direction === "out" && (
                              <span className="text-xs">{getStatusIcon(message.status)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <Button
                    size="icon"
                    className="absolute bottom-24 right-8 rounded-full shadow-lg"
                    onClick={scrollToBottom}
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                )}

                {/* Input Bar */}
                <div className="border-t p-4 bg-muted/30">
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1 font-mono"
                    />
                    {messageInput.trim() ? (
                      <Button onClick={handleSendMessage}>
                        <Send className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon">
                        <Mic className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}