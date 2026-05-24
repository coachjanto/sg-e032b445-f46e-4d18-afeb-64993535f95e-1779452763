import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Smartphone,
  Plus,
  MoreVertical,
  Power,
  Trash2,
  Edit,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SenderDevice {
  id: string;
  label: string;
  type: "qr" | "dripsender" | "cloudchat" | "meta";
  status: "connected" | "disconnected" | "connecting" | "qr_ready" | "expired";
  phone_number: string | null;
  last_active: string | null;
}

export default function DevicesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [devices, setDevices] = useState<SenderDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("qr");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState<SenderDevice | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>("Generating QR Code...");

  const [qrLabel, setQrLabel] = useState("");
  const [dsLabel, setDsLabel] = useState("");
  const [dsApiKey, setDsApiKey] = useState("");
  const [dsBaseUrl, setDsBaseUrl] = useState("https://api.dripsender.com");
  const [ccLabel, setCcLabel] = useState("");
  const [ccApiKey, setCcApiKey] = useState("");
  const [ccInstanceId, setCcInstanceId] = useState("");
  const [ccWebhookUrl, setCcWebhookUrl] = useState("");
  const [metaLabel, setMetaLabel] = useState("");
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [metaAppId, setMetaAppId] = useState("");

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("sender_devices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive",
      });
      return;
    }

    setDevices((data as SenderDevice[]) || []);
    setLoading(false);
  };

  const handleAddQrDevice = async () => {
    if (!qrLabel.trim()) {
      toast({
        title: "Error",
        description: "Device label is required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("sender_devices").insert({
      user_id: user.id,
      label: qrLabel,
      type: "qr",
      status: "disconnected",
      credentials_encrypted: null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "QR device created. Connect to start using it.",
    });
    setQrLabel("");
    setDialogOpen(false);
    fetchDevices();
  };

  const handleAddDripSenderDevice = async () => {
    if (!dsLabel.trim() || !dsApiKey.trim() || !dsBaseUrl.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const credentials = JSON.stringify({
      apiKey: dsApiKey,
      baseUrl: dsBaseUrl,
    });

    const { error } = await supabase.from("sender_devices").insert({
      user_id: user.id,
      label: dsLabel,
      type: "dripsender",
      status: "disconnected",
      credentials_encrypted: credentials,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "DripSender device created successfully",
    });
    setDsLabel("");
    setDsApiKey("");
    setDsBaseUrl("https://api.dripsender.com");
    setDialogOpen(false);
    fetchDevices();
  };

  const handleAddCloudChatDevice = async () => {
    if (!ccLabel.trim() || !ccApiKey.trim() || !ccInstanceId.trim()) {
      toast({
        title: "Error",
        description: "Label, API Key, and Instance ID are required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const credentials = JSON.stringify({
      apiKey: ccApiKey,
      instanceId: ccInstanceId,
      webhookUrl: ccWebhookUrl,
    });

    const { error } = await supabase.from("sender_devices").insert({
      user_id: user.id,
      label: ccLabel,
      type: "cloudchat",
      status: "disconnected",
      credentials_encrypted: credentials,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "CloudChat device created successfully",
    });
    setCcLabel("");
    setCcApiKey("");
    setCcInstanceId("");
    setCcWebhookUrl("");
    setDialogOpen(false);
    fetchDevices();
  };

  const handleAddMetaDevice = async () => {
    if (!metaLabel.trim() || !metaPhoneId.trim() || !metaAccessToken.trim()) {
      toast({
        title: "Error",
        description: "Label, Phone Number ID, and Access Token are required",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const credentials = JSON.stringify({
      phoneNumberId: metaPhoneId,
      accessToken: metaAccessToken,
      wabaId: metaWabaId,
      appId: metaAppId,
    });

    const { error } = await supabase.from("sender_devices").insert({
      user_id: user.id,
      label: metaLabel,
      type: "meta",
      status: "disconnected",
      credentials_encrypted: credentials,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Meta WhatsApp Business API device created",
    });
    setMetaLabel("");
    setMetaPhoneId("");
    setMetaAccessToken("");
    setMetaWabaId("");
    setMetaAppId("");
    setDialogOpen(false);
    fetchDevices();
  };

  const handleDeleteDevice = async (id: string) => {
    const { error } = await supabase
      .from("sender_devices")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Device deleted successfully",
    });
    fetchDevices();
  };

  const handleConnectQR = async (device: SenderDevice) => {
    setConnectingDevice(device);
    setQrDialogOpen(true);
    setConnectionStatus("Generating QR Code...");
    setQrCodeUrl("");

    try {
      // Update device status to connecting
      await supabase
        .from("sender_devices")
        .update({ status: "connecting" })
        .eq("id", device.id);

      // TODO: Replace with actual QR generation API
      // For now, generate a placeholder QR code URL
      // In production, this should call your WhatsApp QR generation endpoint
      const placeholderQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=wa-connect-${device.id}`;
      
      setQrCodeUrl(placeholderQR);
      setConnectionStatus("Scan QR Code with WhatsApp");

      // Simulate checking connection status (polling)
      // In production, use WebSocket or polling to real API
      const checkInterval = setInterval(async () => {
        const { data: updatedDevice } = await supabase
          .from("sender_devices")
          .select("status")
          .eq("id", device.id)
          .single();

        if (updatedDevice?.status === "connected") {
          setConnectionStatus("✅ Connected Successfully!");
          clearInterval(checkInterval);
          fetchDevices();
          setTimeout(() => {
            setQrDialogOpen(false);
          }, 2000);
        }
      }, 3000);

      // Stop checking after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (connectionStatus !== "✅ Connected Successfully!") {
          setConnectionStatus("QR Code Expired. Please try again.");
          supabase
            .from("sender_devices")
            .update({ status: "expired" })
            .eq("id", device.id);
        }
      }, 120000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
      setQrDialogOpen(false);
    }
  };

  const handleTestConnection = async (device: SenderDevice) => {
    setConnectingDevice(device);
    
    try {
      // Update status to connecting
      await supabase
        .from("sender_devices")
        .update({ status: "connecting" })
        .eq("id", device.id);

      fetchDevices();

      // Parse credentials
      const credentials = device.credentials_encrypted 
        ? JSON.parse(device.credentials_encrypted as string)
        : null;

      if (!credentials) {
        throw new Error("No credentials found for this device");
      }

      let testResult = false;

      // Test connection based on device type
      if (device.type === "cloudchat") {
        // Test CloudChat connection
        const response = await fetch(`https://app.cloudchat.id/api/v1/instances/${credentials.instanceId}/status`, {
          headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
          },
        });
        testResult = response.ok;
      } else if (device.type === "dripsender") {
        // Test DripSender connection
        const response = await fetch(`${credentials.baseUrl}/api/v1/auth/me`, {
          headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
          },
        });
        testResult = response.ok;
      } else if (device.type === "meta") {
        // Test Meta API connection
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}`,
          {
            headers: {
              "Authorization": `Bearer ${credentials.accessToken}`,
            },
          }
        );
        testResult = response.ok;
      }

      // Update device status
      const newStatus = testResult ? "connected" : "disconnected";
      await supabase
        .from("sender_devices")
        .update({ 
          status: newStatus,
          last_active: testResult ? new Date().toISOString() : null,
        })
        .eq("id", device.id);

      toast({
        title: testResult ? "Success" : "Failed",
        description: testResult 
          ? "Device connected successfully" 
          : "Failed to connect. Please check your credentials.",
        variant: testResult ? "default" : "destructive",
      });

      fetchDevices();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive",
      });
      
      await supabase
        .from("sender_devices")
        .update({ status: "disconnected" })
        .eq("id", device.id);
      
      fetchDevices();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
      case "connecting":
        return <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Connecting</Badge>;
      case "qr_ready":
        return <Badge variant="outline" className="border-accent"><QrCode className="h-3 w-3 mr-1" />QR Ready</Badge>;
      case "expired":
        return <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      qr: <Badge variant="outline" className="font-display border-primary/30">QR</Badge>,
      dripsender: <Badge variant="outline" className="font-display border-accent/30">DS</Badge>,
      cloudchat: <Badge variant="outline" className="font-display border-primary/30">CC</Badge>,
      meta: <Badge variant="outline" className="font-display border-accent/30">META</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge variant="outline">{type}</Badge>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">{t("devices")}</h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Manage your WhatsApp sender devices and connections
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-display bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-primary/30">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Add WhatsApp Sender Device</DialogTitle>
                  <DialogDescription>
                    Choose a connection method and configure your device
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                    <TabsTrigger value="qr" className="font-display">QR Code</TabsTrigger>
                    <TabsTrigger value="dripsender" className="font-display">DripSender</TabsTrigger>
                    <TabsTrigger value="cloudchat" className="font-display">CloudChat</TabsTrigger>
                    <TabsTrigger value="meta" className="font-display">Meta API</TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr-label">Device Label</Label>
                      <Input
                        id="qr-label"
                        placeholder="e.g., My Personal WhatsApp"
                        value={qrLabel}
                        onChange={(e) => setQrLabel(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="glass-card p-4 rounded-lg border border-primary/20">
                      <p className="text-sm">
                        <strong className="text-primary">How it works:</strong> After creating the device, scan a QR code with your WhatsApp mobile app to connect.
                      </p>
                    </div>
                    <Button onClick={handleAddQrDevice} className="w-full font-display bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Create QR Device
                    </Button>
                  </TabsContent>

                  <TabsContent value="dripsender" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="ds-label">Device Label</Label>
                      <Input
                        id="ds-label"
                        placeholder="e.g., DripSender Account 1"
                        value={dsLabel}
                        onChange={(e) => setDsLabel(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ds-apikey">API Key</Label>
                      <Input
                        id="ds-apikey"
                        type="password"
                        placeholder="Your DripSender API Key"
                        value={dsApiKey}
                        onChange={(e) => setDsApiKey(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ds-baseurl">Base URL</Label>
                      <Input
                        id="ds-baseurl"
                        placeholder="https://api.dripsender.com"
                        value={dsBaseUrl}
                        onChange={(e) => setDsBaseUrl(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button onClick={handleAddDripSenderDevice} className="w-full font-display bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Add DripSender Device
                    </Button>
                  </TabsContent>

                  <TabsContent value="cloudchat" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc-label">Device Label</Label>
                      <Input
                        id="cc-label"
                        placeholder="e.g., CloudChat Instance 1"
                        value={ccLabel}
                        onChange={(e) => setCcLabel(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc-apikey">API Key</Label>
                      <Input
                        id="cc-apikey"
                        type="password"
                        placeholder="Your CloudChat API Key"
                        value={ccApiKey}
                        onChange={(e) => setCcApiKey(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc-instanceid">Instance ID</Label>
                      <Input
                        id="cc-instanceid"
                        placeholder="your-instance-id"
                        value={ccInstanceId}
                        onChange={(e) => setCcInstanceId(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc-webhook">Webhook URL (Optional)</Label>
                      <Input
                        id="cc-webhook"
                        placeholder="https://yourdomain.com/webhook"
                        value={ccWebhookUrl}
                        onChange={(e) => setCcWebhookUrl(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button onClick={handleAddCloudChatDevice} className="w-full font-display bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Add CloudChat Device
                    </Button>
                  </TabsContent>

                  <TabsContent value="meta" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-label">Device Label</Label>
                      <Input
                        id="meta-label"
                        placeholder="e.g., Meta Business Account"
                        value={metaLabel}
                        onChange={(e) => setMetaLabel(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-phoneid">Phone Number ID</Label>
                      <Input
                        id="meta-phoneid"
                        placeholder="123456789012345"
                        value={metaPhoneId}
                        onChange={(e) => setMetaPhoneId(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-token">Access Token</Label>
                      <Input
                        id="meta-token"
                        type="password"
                        placeholder="Your WhatsApp Business API Access Token"
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-wabaid">WABA ID (Optional)</Label>
                      <Input
                        id="meta-wabaid"
                        placeholder="123456789012345"
                        value={metaWabaId}
                        onChange={(e) => setMetaWabaId(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-appid">App ID (Optional)</Label>
                      <Input
                        id="meta-appid"
                        placeholder="123456789012345"
                        value={metaAppId}
                        onChange={(e) => setMetaAppId(e.target.value)}
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <Button onClick={handleAddMetaDevice} className="w-full font-display bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Add Meta API Device
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* QR Code Connection Dialog */}
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogContent className="glass-card border-primary/30 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-accent" />
                  Connect WhatsApp
                </DialogTitle>
                <DialogDescription>
                  Scan this QR code with your WhatsApp mobile app
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  {qrCodeUrl ? (
                    <div className="p-4 bg-white rounded-lg border-4 border-primary/20">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code" 
                        className="w-64 h-64"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-primary/20">
                      <RefreshCw className="h-12 w-12 text-primary/50 animate-spin" />
                    </div>
                  )}
                  
                  <div className="text-center space-y-2">
                    <p className="font-display text-lg">{connectionStatus}</p>
                    <div className="glass-card p-4 rounded-lg border border-primary/20 text-left">
                      <p className="text-sm font-semibold mb-2">How to connect:</p>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open WhatsApp on your phone</li>
                        <li>Tap Menu or Settings → Linked Devices</li>
                        <li>Tap "Link a Device"</li>
                        <li>Point your phone at this screen to scan the QR code</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {connectingDevice && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-display">{connectingDevice.label}</p>
                        <p className="text-xs text-muted-foreground">QR Connection</p>
                      </div>
                    </div>
                    {getStatusBadge(connectingDevice.status)}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setQrDialogOpen(false)}
                  className="flex-1 border-primary/20"
                >
                  Cancel
                </Button>
                {qrCodeUrl && (
                  <Button 
                    onClick={() => {
                      setConnectionStatus("Generating new QR Code...");
                      setQrCodeUrl("");
                      setTimeout(() => {
                        if (connectingDevice) {
                          handleConnectQR(connectingDevice);
                        }
                      }, 500);
                    }}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh QR
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {loading ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">Loading devices...</div>
              </CardContent>
            </Card>
          ) : devices.length === 0 ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="py-12">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                  <p className="font-display text-muted-foreground">No devices yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your first WhatsApp sender device to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <Card key={device.id} className="glass-card border-primary/20 hover:border-accent/40 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="font-display text-lg">{device.label}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {getTypeBadge(device.type)}
                          {getStatusBadge(device.status)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-primary/20">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Label
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (device.type === "qr") {
                                handleConnectQR(device);
                              } else {
                                handleTestConnection(device);
                              }
                            }}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Reconnect
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {device.phone_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-display">{device.phone_number}</span>
                        </div>
                      )}
                      {device.last_active && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Active:</span>
                          <span className="text-xs">
                            {new Date(device.last_active).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {device.type === "qr" && device.status === "disconnected" && (
                        <Button 
                          onClick={() => handleConnectQR(device)}
                          className="w-full mt-4 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20" 
                          variant="outline"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Connect via QR
                        </Button>
                      )}
                      {(device.type === "dripsender" || device.type === "cloudchat" || device.type === "meta") && device.status === "disconnected" && (
                        <Button 
                          onClick={() => handleTestConnection(device)}
                          className="w-full mt-4 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20" 
                          variant="outline"
                        >
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}