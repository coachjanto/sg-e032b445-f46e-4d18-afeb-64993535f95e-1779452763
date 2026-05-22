import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Smartphone, XCircle, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalMessages: number;
  successRate: number;
  activeDevices: number;
  failedMessages: number;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    successRate: 0,
    activeDevices: 0,
    failedMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: devices } = await supabase
        .from("sender_devices")
        .select("id, status")
        .eq("user_id", user.id);

      const activeDevices = devices?.filter(d => d.status === "connected").length || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: messages } = await supabase
        .from("message_logs")
        .select("id, status")
        .gte("timestamp", today.toISOString());

      const totalMessages = messages?.length || 0;
      const failedMessages = messages?.filter(m => m.status === "failed").length || 0;
      const successRate = totalMessages > 0 
        ? Math.round(((totalMessages - failedMessages) / totalMessages) * 100) 
        : 0;

      setStats({
        totalMessages,
        successRate,
        activeDevices,
        failedMessages,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="relative">
              <h1 className="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-200 animate-gradient-shift">
                {t("dashboard")}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Overview of your WhatsApp messaging operations
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalMessagesSent")}</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                  {stats.totalMessages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-3">
                  {t("todayStats")}
                </p>
                <Link href="/campaigns" className="text-xs text-primary hover:text-accent transition-colors inline-flex items-center gap-1 font-medium">
                  View campaigns <TrendingUp className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl hover:shadow-accent/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
                  <Smartphone className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                  {stats.activeDevices}
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-3">
                  Currently connected
                </p>
                <Link href="/devices" className="text-xs text-accent hover:text-primary transition-colors inline-flex items-center gap-1 font-medium">
                  Manage devices <Zap className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-green-500">
                  {stats.successRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-3">
                  {t("todayStats")}
                </p>
                <Link href="/contacts" className="text-xs text-green-500 hover:text-green-600 transition-colors inline-flex items-center gap-1 font-medium">
                  View contacts <TrendingUp className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("failedMessages")}</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-red-500">
                  {stats.failedMessages}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("todayStats")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="font-display text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <Link
                href="/devices"
                className="group relative overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 mb-3">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <span className="font-display text-sm font-semibold">{t("addDevice")}</span>
                </div>
              </Link>
              <Link
                href="/contacts"
                className="group relative overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-accent/30 rounded-xl hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 mb-3">
                    <MessageSquare className="h-8 w-8 text-accent" />
                  </div>
                  <span className="font-display text-sm font-semibold">{t("addContact")}</span>
                </div>
              </Link>
              <Link
                href="/campaigns"
                className="group relative overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-500/30 rounded-xl hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <span className="font-display text-sm font-semibold">{t("newCampaign")}</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card border-accent/20">
            <CardHeader>
              <CardTitle className="font-display text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent mb-4">
                  <MessageSquare className="h-16 w-16 text-primary/50" />
                </div>
                <p className="font-display text-lg font-semibold mb-2">No recent activity</p>
                <p className="text-sm text-muted-foreground">Start by adding a device or creating a campaign</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}