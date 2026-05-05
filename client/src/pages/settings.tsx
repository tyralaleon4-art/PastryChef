import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Lock, Palette, ChefHat, Loader2, Save, Shield } from "lucide-react";

const PREFS_KEY = "pastrpro_prefs";

interface Prefs {
  language: "pl" | "en";
  recipesDefaultView: "table" | "grid";
  costUnit: "per_kg" | "per_100g";
  compactSidebar: boolean;
  showNutrition: boolean;
}

function loadPrefs(): Prefs {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return defaultPrefs;
  }
}

const defaultPrefs: Prefs = {
  language: "pl",
  recipesDefaultView: "table",
  costUnit: "per_kg",
  compactSidebar: false,
  showNutrition: true,
};

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  // Profile form
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Preferences
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [prefsChanged, setPrefsChanged] = useState(false);

  const updatePref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs(p => ({ ...p, [key]: value }));
    setPrefsChanged(true);
  };

  const savePrefs = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setPrefsChanged(false);
    toast({ title: "Preferencje zapisane" });
  };

  const profileMutation = useMutation({
    mutationFn: (displayName: string) =>
      apiRequest("PUT", "/api/auth/profile", { displayName }),
    onSuccess: () => {
      toast({ title: "Profil zaktualizowany" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({ title: "Błąd", description: "Nie udało się zaktualizować profilu", variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiRequest("PUT", "/api/auth/profile", { currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Hasło zmienione pomyślnie" });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("nieprawidłowe")
        ? "Aktualne hasło jest nieprawidłowe"
        : "Nie udało się zmienić hasła";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    },
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm.displayName);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Błąd", description: "Nowe hasła nie są identyczne", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Błąd", description: "Hasło musi mieć min. 6 znaków", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header
          title="Ustawienia konta"
          subtitle="Zarządzaj profilem i preferencjami aplikacji"
        />

        <div className="p-4 md:p-6 space-y-6 max-w-2xl">

          {/* Account overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold">{user?.displayName || user?.username}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                  <Badge variant={isAdmin ? "default" : "secondary"} className="mt-1">
                    {isAdmin ? <><Shield size={12} className="mr-1" />Administrator</> : <><ChefHat size={12} className="mr-1" />Pracownik</>}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} className="text-primary" />
                Dane profilu
              </CardTitle>
              <CardDescription>Zmień swoje imię i nazwisko wyświetlane w aplikacji</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko</Label>
                  <Input
                    placeholder="Twoje imię i nazwisko"
                    value={profileForm.displayName}
                    onChange={e => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Ta nazwa jest widoczna w pasku bocznym i panelu admina</p>
                </div>
                <div className="space-y-2">
                  <Label>Nazwa użytkownika (login)</Label>
                  <Input value={user?.username || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Login można zmienić tylko przez administratora</p>
                </div>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Zapisuję...</> : <><Save size={16} className="mr-2" />Zapisz dane</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                Zmiana hasła
              </CardTitle>
              <CardDescription>Ustaw nowe hasło do swojego konta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Aktualne hasło</Label>
                  <Input
                    type="password"
                    placeholder="Wpisz aktualne hasło"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Nowe hasło</Label>
                  <Input
                    type="password"
                    placeholder="Min. 6 znaków"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Powtórz nowe hasło</Label>
                  <Input
                    type="password"
                    placeholder="Wpisz nowe hasło ponownie"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Zmieniam...</> : <><Lock size={16} className="mr-2" />Zmień hasło</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={18} className="text-primary" />
                Preferencje aplikacji
              </CardTitle>
              <CardDescription>Dostosuj wygląd i zachowanie aplikacji pod swoje potrzeby</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-2">
                <Label>Domyślny widok przepisów</Label>
                <Select value={prefs.recipesDefaultView} onValueChange={v => updatePref("recipesDefaultView", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Tabela (lista)</SelectItem>
                    <SelectItem value="grid">Kafelki (siatka)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Jak chcesz domyślnie widzieć listę przepisów</p>
              </div>

              <div className="space-y-2">
                <Label>Jednostka kosztu</Label>
                <Select value={prefs.costUnit} onValueChange={v => updatePref("costUnit", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">PLN/kg</SelectItem>
                    <SelectItem value="per_100g">PLN/100g</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Jednostka do wyświetlania kosztów przepisów</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pokazuj wartości odżywcze</Label>
                  <p className="text-xs text-muted-foreground">Wyświetlaj kalorie i makroskładniki na kartach przepisów</p>
                </div>
                <Switch
                  checked={prefs.showNutrition}
                  onCheckedChange={v => updatePref("showNutrition", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kompaktowy pasek boczny</Label>
                  <p className="text-xs text-muted-foreground">Zmniejsz pasek boczny do samych ikon (wymaga przeładowania)</p>
                </div>
                <Switch
                  checked={prefs.compactSidebar}
                  onCheckedChange={v => updatePref("compactSidebar", v)}
                />
              </div>

              {prefsChanged && (
                <Button onClick={savePrefs} className="w-full">
                  <Save size={16} className="mr-2" />
                  Zapisz preferencje
                </Button>
              )}
              {!prefsChanged && (
                <p className="text-xs text-center text-muted-foreground">Preferencje są aktualne</p>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
