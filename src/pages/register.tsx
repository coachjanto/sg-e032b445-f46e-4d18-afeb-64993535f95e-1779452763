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
import { MessageSquare, CheckCircle2, Sparkles, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
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
              <CardTitle className="text-2xl font-display">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                {t("emailVerificationSent")}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <AlertDescription className="text-center">
                Click the verification link in your email to activate your account, then return to login.
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter>
            <Button
              variant="outline"
              className="w-full h-11 font-display font-semibold border-primary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
              onClick={() => router.push("/login")}
            >
              {t("backToLogin")}
            </Button>
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
              {t("register")}
              <UserPlus className="h-5 w-5 text-accent" />
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Create your WhatsApp management account
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">{t("name")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-background/50 border-primary/20 focus:border-primary transition-all"
              />
            </div>
            
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
                autoComplete="new-password"
                className="h-11 bg-background/50 border-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? t("loading") : t("register")}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:text-primary transition-colors font-medium">
                {t("login")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}