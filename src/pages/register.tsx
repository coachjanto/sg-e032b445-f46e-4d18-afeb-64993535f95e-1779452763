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
import { MessageSquare, CheckCircle2 } from "lucide-react";

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
            <CardTitle className="text-center font-mono">Check Your Email</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-center">
                {t("emailVerificationSent")}
              </AlertDescription>
            </Alert>
            
            <p className="text-center text-sm text-muted-foreground">
              Click the verification link in your email to activate your account, then return to login.
            </p>
          </CardContent>
          
          <CardFooter>
            <Button
              variant="outline"
              className="w-full font-mono"
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
          <CardTitle className="text-center font-mono">{t("register")}</CardTitle>
          <CardDescription className="text-center">
            Create your WhatsApp management account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="font-mono"
              />
            </div>
            
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
            
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="font-mono"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-mono" disabled={loading}>
              {loading ? t("loading") : t("register")}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                {t("login")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}