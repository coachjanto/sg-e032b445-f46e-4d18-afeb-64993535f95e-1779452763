import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MessageSquare, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <ThemeSwitch />
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md glass-card border-primary/30 shadow-2xl shadow-primary/20 relative z-10">
        <CardHeader className="space-y-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <span className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-200 animate-gradient-shift">
              AskaraOne
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl font-display flex items-center justify-center gap-2">
              {t("login")}
              <Sparkles className="h-5 w-5 text-accent" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              WhatsApp Sender Management Platform
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-background/50 border-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 bg-background/50 border-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-accent hover:text-primary transition-colors font-medium">
                {t("forgotPassword")}
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full h-11 font-display font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/30" 
              disabled={loading}
            >
              {loading ? t("loading") : t("login")}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent hover:text-primary transition-colors font-medium">
                {t("register")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}