import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { BRANDING } from "@/config/branding";

export default function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", displayName: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginForm.username, loginForm.password);
      setLocation("/");
    } catch (err: any) {
      const msg = err.message?.includes("401") ? t("login.invalidCredentials") : t("login.loginError");
      toast({ title: t("login.loginFailed"), description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password.length < 6) {
      toast({ title: t("login.passwordShort"), description: t("login.passwordMin"), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await register(registerForm.username, registerForm.password, registerForm.displayName || undefined);
      setLocation("/");
    } catch (err: any) {
      const msg = err.message?.includes("409") ? t("login.usernameTaken") : t("login.registrationFailed");
      toast({ title: t("login.registrationError"), description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg p-4">
      <div className="w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo-art-de-sucre.png"
            alt="Art de Sucre by Leon Tyrała"
            className="mx-auto h-40 w-40 rounded-2xl object-cover shadow-sm"
          />
          <p className="text-secondary text-xs tracking-[0.3em] uppercase font-medium mt-4">{BRANDING.productName}</p>
          <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
            {t("login.tagline")}
          </p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-1 bg-primary/8 border border-border">
            <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium">
              {t("login.signIn")}
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium">
              {t("login.createAccount")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border border-border/80 shadow-lg bg-white">
              <div className="h-1 rounded-t-lg bg-gradient-to-r from-secondary/80 via-secondary to-secondary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">{t("login.welcome")}</CardTitle>
                <CardDescription>{t("login.continue")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-username" className="text-foreground/80 font-medium">{t("login.username")}</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder={t("login.enterUsername")}
                      style={{ fontSize: '16px' }}
                      value={loginForm.username}
                      onChange={e => setLoginForm(f => ({ ...f, username: e.target.value.trim() }))}
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-foreground/80 font-medium">{t("login.password")}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t("login.enterPassword")}
                      style={{ fontSize: '16px' }}
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.loggingIn")}</> : t("login.signIn")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border border-border/80 shadow-lg bg-white">
              <div className="h-1 rounded-t-lg bg-gradient-to-r from-secondary/80 via-secondary to-secondary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">{t("login.createAccount")}</CardTitle>
                <CardDescription>{t("login.registerDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-displayname" className="text-foreground/80 font-medium">{t("login.name")} <span className="text-muted-foreground font-normal">({t("login.optional")})</span></Label>
                    <Input
                      id="reg-displayname"
                      type="text"
                      placeholder="np. Jan Kowalski"
                      style={{ fontSize: '16px' }}
                      value={registerForm.displayName}
                      onChange={e => setRegisterForm(f => ({ ...f, displayName: e.target.value }))}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-username" className="text-foreground/80 font-medium">{t("login.username")}</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder={t("login.chooseUsername")}
                      style={{ fontSize: '16px' }}
                      value={registerForm.username}
                      onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value.trim() }))}
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password" className="text-foreground/80 font-medium">{t("login.password")}</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder={t("login.minPassword")}
                      style={{ fontSize: '16px' }}
                      value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("login.creatingAccount")}</> : t("login.createAccount")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6 tracking-wide">
          © 2026 {BRANDING.productName} · {t("login.footer")}
        </p>
      </div>
    </div>
  );
}
