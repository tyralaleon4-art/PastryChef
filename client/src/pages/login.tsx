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

export default function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
      const msg = err.message?.includes("401") ? "Nieprawidłowa nazwa użytkownika lub hasło" : "Błąd logowania";
      toast({ title: "Nie udało się zalogować", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password.length < 6) {
      toast({ title: "Hasło za krótkie", description: "Hasło musi mieć co najmniej 6 znaków", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await register(registerForm.username, registerForm.password, registerForm.displayName || undefined);
      setLocation("/");
    } catch (err: any) {
      const msg = err.message?.includes("409") ? "Ta nazwa użytkownika jest już zajęta" : "Rejestracja nie powiodła się";
      toast({ title: "Błąd rejestracji", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg p-4">
      <div className="w-full max-w-md">

        {/* Brand Header — typograficzne logo bez obrazka */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-secondary/60" />
            <span className="text-secondary text-xs tracking-[0.3em] uppercase font-medium">Patisserie Pro</span>
            <div className="h-px w-12 bg-secondary/60" />
          </div>
          <h1 className="ads-logo-text text-4xl font-bold text-foreground tracking-[0.12em] uppercase leading-tight">
            Art de Sucre
          </h1>
          <p className="text-secondary font-medium tracking-[0.2em] text-sm mt-2 uppercase">by Leon Tyrała</p>
          <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
            Profesjonalny system zarządzania recepturami
          </p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-1 bg-primary/8 border border-border">
            <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium">
              Zaloguj się
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium">
              Utwórz konto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border border-border/80 shadow-lg bg-white">
              <div className="h-1 rounded-t-lg bg-gradient-to-r from-secondary/80 via-secondary to-secondary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">Witaj ponownie</CardTitle>
                <CardDescription>Zaloguj się, aby kontynuować pracę</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-username" className="text-foreground/80 font-medium">Nazwa użytkownika</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Wpisz nazwę użytkownika"
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
                    <Label htmlFor="login-password" className="text-foreground/80 font-medium">Hasło</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Wpisz hasło"
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
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Logowanie...</> : "Zaloguj się"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border border-border/80 shadow-lg bg-white">
              <div className="h-1 rounded-t-lg bg-gradient-to-r from-secondary/80 via-secondary to-secondary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">Utwórz konto</CardTitle>
                <CardDescription>Zarejestruj się, aby zarządzać przepisami</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-displayname" className="text-foreground/80 font-medium">Imię i nazwisko <span className="text-muted-foreground font-normal">(opcjonalnie)</span></Label>
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
                    <Label htmlFor="reg-username" className="text-foreground/80 font-medium">Nazwa użytkownika</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder="Wybierz nazwę użytkownika"
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
                    <Label htmlFor="reg-password" className="text-foreground/80 font-medium">Hasło</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Minimum 6 znaków"
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
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tworzenie konta...</> : "Utwórz konto"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6 tracking-wide">
          © 2025 Art de Sucre · System recepturowy
        </p>
      </div>
    </div>
  );
}
