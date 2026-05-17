import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-primary rounded-xl p-2.5">
              <Utensils className="text-primary-foreground" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-primary">PastryPro</h1>
          </div>
          <p className="text-muted-foreground">Profesjonalny system zarządzania recepturami</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Zaloguj się</TabsTrigger>
            <TabsTrigger value="register">Utwórz konto</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Witaj ponownie</CardTitle>
                <CardDescription>Zaloguj się, aby kontynuować</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Nazwa użytkownika</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Hasło</Label>
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
                  <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logowanie...</> : "Zaloguj się"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Utwórz konto</CardTitle>
                <CardDescription>Zarejestruj się, aby zarządzać przepisami</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-displayname">Imię i nazwisko (opcjonalnie)</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Nazwa użytkownika</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Hasło</Label>
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
                  <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Tworzenie konta...</> : "Utwórz konto"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
