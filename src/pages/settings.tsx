import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Shield } from "lucide-react";

interface SettingsData {
  dripsender_api_key?: string;
  dripsender_webhook_url?: string;
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
  const [settings, setSettings] = useState<SettingsData>({
    dripsender_enabled: false,
    cloudchat_enabled: false,
    ai_enabled: false,
    ai_provider: "openai",
    openai_model: "gpt-3.5-turbo",
    gemini_model: "gemini-pro",
  });

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
          dripsender_webhook_url: data.dripsender_webhook_url || "",
          dripsender_enabled: data.dripsender_enabled || false,
          cloudchat_api_key: data.cloudchat_api_key || "",
          cloudchat_endpoint: data.cloudchat_endpoint || "",
          cloudchat_enabled: data.cloudchat_enabled || false,
          ai_enabled: data.ai_enabled || false,
          ai_provider: data.ai_provider || "openai",
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

  const maskApiKey = (key?: string) => {
    if (!key || key.length < 8) return "••••••••";
    return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO
        title="Settings - AskaraOne WA Blaster"
        description="Configure API integrations and settings"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your API integrations and preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dripsender">Dripsender</TabsTrigger>
            <TabsTrigger value="cloudchat">Cloudchat</TabsTrigger>
            <TabsTrigger value="ai">AI Auto-reply</TabsTrigger>
          </TabsList>

          <TabsContent value="dripsender" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dripsender API Configuration</CardTitle>
                <CardDescription>
                  Configure your Dripsender API for WhatsApp blast campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Dripsender</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on to use Dripsender for campaigns
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
                  <Label htmlFor="dripsender-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dripsender-key"
                      type="password"
                      placeholder="Enter your Dripsender API key"
                      value={settings.dripsender_api_key || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, dripsender_api_key: e.target.value })
                      }
                    />
                    <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dripsender-webhook">Webhook URL</Label>
                  <Input
                    id="dripsender-webhook"
                    type="url"
                    placeholder="https://your-domain.com/api/webhook"
                    value={settings.dripsender_webhook_url || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, dripsender_webhook_url: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Webhook URL for receiving Dripsender callbacks
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cloudchat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cloudchat API Configuration</CardTitle>
                <CardDescription>
                  Configure your Cloudchat API for live chat integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Cloudchat</Label>
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
                  <Label htmlFor="cloudchat-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cloudchat-key"
                      type="password"
                      placeholder="Enter your Cloudchat API key"
                      value={settings.cloudchat_api_key || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, cloudchat_api_key: e.target.value })
                      }
                    />
                    <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cloudchat-endpoint">API Endpoint</Label>
                  <Input
                    id="cloudchat-endpoint"
                    type="url"
                    placeholder="https://api.cloudchat.com/v1"
                    value={settings.cloudchat_endpoint || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, cloudchat_endpoint: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Base URL for Cloudchat API endpoints
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Auto-reply Configuration</CardTitle>
                <CardDescription>
                  Configure AI-powered automatic message responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable AI Auto-reply</Label>
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
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <Select
                    value={settings.ai_provider}
                    onValueChange={(value: "openai" | "gemini") =>
                      setSettings({ ...settings, ai_provider: value })
                    }
                  >
                    <SelectTrigger id="ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.ai_provider === "openai" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="openai-key"
                          type="password"
                          placeholder="sk-..."
                          value={settings.openai_api_key || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, openai_api_key: e.target.value })
                          }
                        />
                        <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get your API key from platform.openai.com
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="openai-model">OpenAI Model</Label>
                      <Select
                        value={settings.openai_model}
                        onValueChange={(value) =>
                          setSettings({ ...settings, openai_model: value })
                        }
                      >
                        <SelectTrigger id="openai-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                      <Label htmlFor="gemini-key">Gemini API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="gemini-key"
                          type="password"
                          placeholder="Enter your Gemini API key"
                          value={settings.gemini_api_key || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, gemini_api_key: e.target.value })
                          }
                        />
                        <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get your API key from makersuite.google.com
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gemini-model">Gemini Model</Label>
                      <Select
                        value={settings.gemini_model}
                        onValueChange={(value) =>
                          setSettings({ ...settings, gemini_model: value })
                        }
                      >
                        <SelectTrigger id="gemini-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
  );
}