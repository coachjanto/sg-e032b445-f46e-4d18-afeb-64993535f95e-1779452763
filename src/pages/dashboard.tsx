import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Smartphone, XCircle } from "lucide-react";

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

      // Fetch devices count
      const { data: devices } = await supabase
        .from("sender_devices")
        .select("id, status")
        .eq("user_id", user.id);

      const activeDevices = devices?.filter(d => d.status === "connected").length || 0;

      // Fetch message logs for today
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

  const statCards = [
    {
      title: t("totalMessagesSent"),
      value: stats.totalMessages,
      subtitle: t("todayStats"),
      icon: MessageSquare,
      color: "text-accent",
    },
    {
      title: t("successRate"),
      value: `${stats.successRate}%`,
      subtitle: t("todayStats"),
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: t("activeDevices"),
      value: stats.activeDevices,
      subtitle: "Currently connected",
      icon: Smartphone,
      color: "text-blue-500",
    },
    {
      title: t("failedMessages"),
      value: stats.failedMessages,
      subtitle: t("todayStats"),
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your WhatsApp messaging operations
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-mono font-bold">
                      {loading ? "..." : card.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.subtitle}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <a
                href="/devices"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-accent transition-colors"
              >
                <Smartphone className="h-8 w-8 text-accent mb-2" />
                <span className="font-mono text-sm">{t("addDevice")}</span>
              </a>
              <a
                href="/contacts"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-accent transition-colors"
              >
                <MessageSquare className="h-8 w-8 text-accent mb-2" />
                <span className="font-mono text-sm">{t("addContact")}</span>
              </a>
              <a
                href="/campaigns"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-accent transition-colors"
              >
                <CheckCircle2 className="h-8 w-8 text-accent mb-2" />
                <span className="font-mono text-sm">{t("newCampaign")}</span>
              </a>
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono">No recent activity</p>
                <p className="text-sm mt-2">Start by adding a device or creating a campaign</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}