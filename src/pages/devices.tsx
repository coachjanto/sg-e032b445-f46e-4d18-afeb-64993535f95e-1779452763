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

  // Form states for different connection types
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

    // In production, encrypt these credentials
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
      description: "DripSender device created. Test connection to verify.",
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
      description: "CloudChat device created. Test connection to verify.",
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
      description: "Meta WhatsApp Business API device created.",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500 hover:bg-green-600"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
      case "connecting":
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Connecting</Badge>;
      case "qr_ready":
        return <Badge variant="outline"><QrCode className="h-3 w-3 mr-1" />QR Ready</Badge>;
      case "expired":
        return <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Disconnected</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      qr: <Badge variant="outline" className="font-mono">QR</Badge>,
      dripsender: <Badge variant="outline" className="font-mono">DS</Badge>,
      cloudchat: <Badge variant="outline" className="font-mono">CC</Badge>,
      meta: <Badge variant="outline" className="font-mono">META</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge variant="outline">{type}</Badge>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold tracking-tight">{t("devices")}</h1>
              <p className="text-muted-foreground mt-2">
                Manage your WhatsApp sender devices and connections
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-mono">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-mono">Add WhatsApp Sender Device</DialogTitle>
                  <DialogDescription>
                    Choose a connection method and configure your device
                  </DialogDescription>
                </DialogHeader>

                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="qr" className="font-mono">QR Code</TabsTrigger>
                    <TabsTrigger value="dripsender" className="font-mono">DripSender</TabsTrigger>
                    <TabsTrigger value="cloudchat" className="font-mono">CloudChat</TabsTrigger>
                    <TabsTrigger value="meta" className="font-mono">Meta API</TabsTrigger>
                  </TabsList>

                  {/* QR Code Tab */}
                  <TabsContent value="qr" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr-label">Device Label</Label>
                      <Input
                        id="qr-label"
                        placeholder="e.g., My Personal WhatsApp"
                        value={qrLabel}
                        onChange={(e) => setQrLabel(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A friendly name to identify this device
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        <strong>How it works:</strong> After creating the device, you'll scan a QR code with your WhatsApp mobile app to connect. Uses Baileys library for multi-device connection.
                      </p>
                    </div>
                    <Button onClick={handleAddQrDevice} className="w-full font-mono">
                      Create QR Device
                    </Button>
                  </TabsContent>

                  {/* DripSender Tab */}
                  <TabsContent value="dripsender" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="ds-label">Device Label</Label>
                      <Input
                        id="ds-label"
                        placeholder="e.g., DripSender Account 1"
                        value={dsLabel}
                        onChange={(e) => setDsLabel(e.target.value)}
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ds-baseurl">Base URL</Label>
                      <Input
                        id="ds-baseurl"
                        placeholder="https://api.dripsender.com"
                        value={dsBaseUrl}
                        onChange={(e) => setDsBaseUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddDripSenderDevice} className="w-full font-mono">
                      Add DripSender Device
                    </Button>
                  </TabsContent>

                  {/* CloudChat Tab */}
                  <TabsContent value="cloudchat" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc-label">Device Label</Label>
                      <Input
                        id="cc-label"
                        placeholder="e.g., CloudChat Instance 1"
                        value={ccLabel}
                        onChange={(e) => setCcLabel(e.target.value)}
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc-instanceid">Instance ID</Label>
                      <Input
                        id="cc-instanceid"
                        placeholder="your-instance-id"
                        value={ccInstanceId}
                        onChange={(e) => setCcInstanceId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc-webhook">Webhook URL (Optional)</Label>
                      <Input
                        id="cc-webhook"
                        placeholder="https://yourdomain.com/webhook"
                        value={ccWebhookUrl}
                        onChange={(e) => setCcWebhookUrl(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddCloudChatDevice} className="w-full font-mono">
                      Add CloudChat Device
                    </Button>
                  </TabsContent>

                  {/* Meta API Tab */}
                  <TabsContent value="meta" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-label">Device Label</Label>
                      <Input
                        id="meta-label"
                        placeholder="e.g., Meta Business Account"
                        value={metaLabel}
                        onChange={(e) => setMetaLabel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-phoneid">Phone Number ID</Label>
                      <Input
                        id="meta-phoneid"
                        placeholder="123456789012345"
                        value={metaPhoneId}
                        onChange={(e) => setMetaPhoneId(e.target.value)}
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-wabaid">WhatsApp Business Account ID (Optional)</Label>
                      <Input
                        id="meta-wabaid"
                        placeholder="123456789012345"
                        value={metaWabaId}
                        onChange={(e) => setMetaWabaId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-appid">App ID (Optional)</Label>
                      <Input
                        id="meta-appid"
                        placeholder="123456789012345"
                        value={metaAppId}
                        onChange={(e) => setMetaAppId(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddMetaDevice} className="w-full font-mono">
                      Add Meta API Device
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Devices List */}
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground font-mono">Loading devices...</div>
              </CardContent>
            </Card>
          ) : devices.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-mono text-muted-foreground">No devices yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your first WhatsApp sender device to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <Card key={device.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="font-mono text-lg">{device.label}</CardTitle>
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Label
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
                    <div className="space-y-2 text-sm">
                      {device.phone_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-mono">{device.phone_number}</span>
                        </div>
                      )}
                      {device.last_active && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Active:</span>
                          <span className="font-mono text-xs">
                            {new Date(device.last_active).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {device.type === "qr" && device.status === "disconnected" && (
                        <Button className="w-full mt-4" variant="outline">
                          <QrCode className="h-4 w-4 mr-2" />
                          Connect via QR
                        </Button>
                      )}
                      {(device.type === "dripsender" || device.type === "cloudchat" || device.type === "meta") && device.status === "disconnected" && (
                        <Button className="w-full mt-4" variant="outline">
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