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
import { MessageSquare, CheckCircle2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4 flex gap-2">
          <ThemeSwitch />
          <LanguageSwitcher />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-center font-mono">{t("checkEmail")}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to set a new password.
            </p>
          </CardContent>
          
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full font-mono">
                {t("backToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <ThemeSwitch />
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <MessageSquare className="h-8 w-8" />
            <span className="text-2xl font-mono font-bold">AskaraOne</span>
          </div>
          <CardTitle className="text-center font-mono">{t("resetPassword")}</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="font-mono"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-mono" disabled={loading}>
              {loading ? t("loading") : t("sendResetLink")}
            </Button>
            
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full font-mono">
                {t("backToLogin")}
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}