import { useState } from "react";
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
import { MessageSquare, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
        
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <ThemeSwitch />
          <LanguageSwitcher />
        </div>
        
        <Card className="w-full max-w-md glass-card border-green-500/30 shadow-2xl shadow-green-500/20 relative z-10">
          <CardHeader className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-display">{t("checkEmail")}</CardTitle>
              <CardDescription className="text-base mt-2">
                Password reset link sent successfully
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <AlertDescription className="text-center">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to set a new password.
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full h-11 font-display font-semibold border-primary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10">
                {t("backToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              {t("resetPassword")}
              <KeyRound className="h-5 w-5 text-accent" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email to receive a reset link
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleReset}>
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
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full h-11 font-display font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/30" 
              disabled={loading}
            >
              {loading ? t("loading") : t("sendResetLink")}
            </Button>
            
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full h-11 font-display hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10">
                {t("backToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}