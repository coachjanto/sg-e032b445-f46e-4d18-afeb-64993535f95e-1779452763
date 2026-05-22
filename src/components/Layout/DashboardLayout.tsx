import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Smartphone,
  Users,
  MessageSquare,
  Send,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navigation = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("devices"), href: "/devices", icon: Smartphone },
    { name: t("contacts"), href: "/contacts", icon: Users },
    { name: t("liveChat"), href: "/live-chat", icon: MessageSquare },
    { name: t("campaigns"), href: "/campaigns", icon: Send },
    { name: t("analytics"), href: "/analytics", icon: BarChart3 },
    { name: t("settings"), href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 glass-card border-r border-primary/20 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-primary/20">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AskaraOne
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-primary/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-lg shadow-primary/20"
                      : "text-sidebar-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur-sm" />
                  )}
                  <Icon className={`h-5 w-5 shrink-0 relative z-10 ${active ? "text-primary" : ""}`} />
                  <span className="relative z-10">{item.name}</span>
                  {active && <Sparkles className="h-4 w-4 text-accent ml-auto relative z-10" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-primary/20 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start font-medium hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between glass-card border-b border-primary/20 px-4 lg:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <LanguageSwitcher />
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}