import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Shield, Settings as SettingsIcon, Sparkles, Copy, CheckCircle2, Webhook } from "lucide-react";
import { SEO } from "@/components/SEO";

interface SettingsData {
  dripsender_api_key?: string;
  dripsender_enabled: boolean;
  cloudchat_api_key?: string;
  cloudchat_endpoint?: string;
  cloudchat_enabled: boolean;
  ai_enabled: boolean;
  ai_provider: "openai" | "gemini";
  openai_api_key?: string;
  openai_model: string;
  gemini_api_key?: string;
  gemini_model: string;
}

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    dripsender_enabled: false,
    cloudchat_enabled: false,
    ai_enabled: false,
    ai_provider: "openai",
    openai_model: "gpt-3.5-turbo",
    gemini_model: "gemini-pro",
  });

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhook/whatsapp`
    : "";
  
  const cloudchatWebhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook/cloudchat`
    : "";

  const dripsenderWebhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook/dripsender`
    : "";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCloudchatWebhookUrl = () => {
    navigator.clipboard.writeText(cloudchatWebhookUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "CloudChat webhook URL copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDripsenderWebhookUrl = () => {
    navigator.clipboard.writeText(dripsenderWebhookUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Dripsender webhook URL copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    loadSettings();
  };

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          dripsender_api_key: data.dripsender_api_key || "",
          dripsender_enabled: data.dripsender_enabled || false,
          cloudchat_api_key: data.cloudchat_api_key || "",
          cloudchat_endpoint: data.cloudchat_endpoint || "",
          cloudchat_enabled: data.cloudchat_enabled || false,
          ai_enabled: data.ai_enabled || false,
          ai_provider: (data.ai_provider as "openai" | "gemini") || "openai",
          openai_api_key: data.openai_api_key || "",
          openai_model: data.openai_model || "gpt-3.5-turbo",
          gemini_api_key: data.gemini_api_key || "",
          gemini_model: data.gemini_model || "gemini-pro",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("settings")
        .upsert({
          user_id: user.id,
          ...settings,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-full py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Settings</h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Configure your API integrations and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="font-display bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="dripsender" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="dripsender" className="font-display">Dripsender</TabsTrigger>
              <TabsTrigger value="cloudchat" className="font-display">Cloudchat</TabsTrigger>
              <TabsTrigger value="ai" className="font-display">AI Auto-reply</TabsTrigger>
            </TabsList>

            <TabsContent value="dripsender" className="space-y-4 mt-6">
              <Card className="glass-card border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-accent" />
                    <CardTitle className="font-display text-lg">Webhook Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Copy this webhook URL and configure it in your Dripsender dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={dripsenderWebhookUrl}
                      readOnly
                      className="bg-background/70 border-accent/30 font-mono text-sm"
                    />
                    <Button
                      onClick={copyDripsenderWebhookUrl}
                      variant="outline"
                      className="shrink-0 border-accent/30 hover:bg-accent/10"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="glass-card p-3 rounded-lg border border-accent/20 bg-accent/5">
                    <p className="text-xs text-muted-foreground">
                      <strong>Setup Instructions:</strong>
                    </p>
                    <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      <li>Copy the webhook URL above</li>
                      <li>Go to your Dripsender dashboard webhook settings</li>
                      <li>Paste the webhook URL</li>
                      <li>Save and test the connection</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Dripsender API Configuration</CardTitle>
                  <CardDescription>
                    Configure your Dripsender API key for WhatsApp messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                    <div className="space-y-0.5">
                      <Label className="font-display">Enable Dripsender</Label>
                      <p className="text-sm text-muted-foreground">
                        Turn on to use Dripsender for WhatsApp campaigns
                      </p>
                    </div>
                    <Switch
                      checked={settings.dripsender_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, dripsender_enabled: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dripsender-key" className="font-display">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="dripsender-key"
                        type="password"
                        placeholder="dk_..."
                        value={settings.dripsender_api_key || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, dripsender_api_key: e.target.value })
                        }
                        className="bg-background/50 border-primary/20 focus:border-primary"
                      />
                      <Shield className="w-5 h-5 text-primary shrink-0 mt-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from Dripsender dashboard. Format: dk_xxxxx
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cloudchat" className="space-y-4 mt-6">
              <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-primary" />
                    <CardTitle className="font-display text-lg">Webhook Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Copy this webhook URL and paste it in your CloudChat Developer App settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={cloudchatWebhookUrl}
                      readOnly
                      className="bg-background/70 border-primary/30 font-mono text-sm"
                    />
                    <Button
                      onClick={copyCloudchatWebhookUrl}
                      variant="outline"
                      className="shrink-0 border-primary/30 hover:bg-primary/10"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="glass-card p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-xs text-muted-foreground">
                      <strong>Setup Steps:</strong>
                    </p>
                    <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      <li>Go to CloudChat Developer App settings</li>
                      <li>Paste this webhook URL in "WEBHOOK URL" field</li>
                      <li>Click "Ping Test" to verify the connection</li>
                      <li>Link your WhatsApp channel to the app</li>
                      <li>Enable the app status toggle</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-accent/20">
                <CardHeader>
                  <CardTitle className="font-display text-xl">CloudChat API Configuration</CardTitle>
                  <CardDescription>
                    Configure your CloudChat Secret Key from Developer App settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20">
                    <div className="space-y-0.5">
                      <Label className="font-display">Enable Cloudchat</Label>
                      <p className="text-sm text-muted-foreground">
                        Turn on to use Cloudchat for live messaging
                      </p>
                    </div>
                    <Switch
                      checked={settings.cloudchat_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, cloudchat_enabled: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cloudchat-key" className="font-display">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cloudchat-key"
                        type="password"
                        placeholder="Enter your Cloudchat API key"
                        value={settings.cloudchat_api_key || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, cloudchat_api_key: e.target.value })
                        }
                        className="bg-background/50 border-accent/20 focus:border-accent"
                      />
                      <Shield className="w-5 h-5 text-accent shrink-0 mt-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your API key is encrypted and stored securely
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cloudchat-endpoint" className="font-display">API Endpoint</Label>
                    <Input
                      id="cloudchat-endpoint"
                      type="url"
                      placeholder="https://api.cloudchat.com/v1"
                      value={settings.cloudchat_endpoint || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, cloudchat_endpoint: e.target.value })
                      }
                      className="bg-background/50 border-accent/20 focus:border-accent"
                    />
                    <p className="text-xs text-muted-foreground">
                      Base URL for Cloudchat API endpoints
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-6">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="font-display text-xl">AI Auto-reply Configuration</CardTitle>
                  <CardDescription>
                    Configure AI-powered automatic message responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-primary/20">
                    <div className="space-y-0.5">
                      <Label className="font-display">Enable AI Auto-reply</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically respond to messages using AI
                      </p>
                    </div>
                    <Switch
                      checked={settings.ai_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, ai_enabled: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-provider" className="font-display">AI Provider</Label>
                    <Select
                      value={settings.ai_provider}
                      onValueChange={(value: "openai" | "gemini") =>
                        setSettings({ ...settings, ai_provider: value })
                      }
                    >
                      <SelectTrigger id="ai-provider" className="bg-background/50 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-primary/20">
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.ai_provider === "openai" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="openai-key" className="font-display">OpenAI API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="openai-key"
                            type="password"
                            placeholder="sk-..."
                            value={settings.openai_api_key || ""}
                            onChange={(e) =>
                              setSettings({ ...settings, openai_api_key: e.target.value })
                            }
                            className="bg-background/50 border-primary/20 focus:border-primary"
                          />
                          <Shield className="w-5 h-5 text-primary shrink-0 mt-2" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get your API key from platform.openai.com
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="openai-model" className="font-display">OpenAI Model</Label>
                        <Select
                          value={settings.openai_model}
                          onValueChange={(value) =>
                            setSettings({ ...settings, openai_model: value })
                          }
                        >
                          <SelectTrigger id="openai-model" className="bg-background/50 border-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-primary/20">
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {settings.ai_provider === "gemini" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gemini-key" className="font-display">Gemini API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="gemini-key"
                            type="password"
                            placeholder="Enter your Gemini API key"
                            value={settings.gemini_api_key || ""}
                            onChange={(e) =>
                              setSettings({ ...settings, gemini_api_key: e.target.value })
                            }
                            className="bg-background/50 border-accent/20 focus:border-accent"
                          />
                          <Shield className="w-5 h-5 text-accent shrink-0 mt-2" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get your API key from makersuite.google.com
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gemini-model" className="font-display">Gemini Model</Label>
                        <Select
                          value={settings.gemini_model}
                          onValueChange={(value) =>
                            setSettings({ ...settings, gemini_model: value })
                          }
                        >
                          <SelectTrigger id="gemini-model" className="bg-background/50 border-accent/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-accent/20">
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}