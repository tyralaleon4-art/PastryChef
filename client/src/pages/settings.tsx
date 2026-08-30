import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth, type User as AuthUser } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Lock, ChefHat, Loader2, Save, Shield } from "lucide-react";
import { useI18n, Language } from "@/i18n";
import { BRANDING } from "@/config/branding";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

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

  const profileMutation = useMutation({
    mutationFn: (displayName: string) =>
      apiRequest("PUT", "/api/auth/profile", { displayName }),
    onSuccess: () => {
      toast({ title: t("settings.profileUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("settings.profileUpdateFailed"), variant: "destructive" });
    },
  });

  const languageMutation = useMutation({
    mutationFn: (language: Language) => apiRequest("PUT", "/api/auth/profile", { language }),
    onSuccess: (_response, language) => {
      queryClient.setQueryData<AuthUser | null>(["/api/auth/me"], (current) =>
        current ? { ...current, language } : current,
      );
      toast({ title: t("settings.languageUpdated") });
    },
    onError: () => toast({ title: t("common.error"), description: t("settings.languageUpdateFailed"), variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiRequest("PUT", "/api/auth/profile", { currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: t("settings.passwordChanged") });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("nieprawidłowe")
        ? t("settings.currentPasswordInvalid")
        : t("settings.changePasswordFailed");
      toast({ title: t("common.error"), description: msg, variant: "destructive" });
    },
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileForm.displayName);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t("common.error"), description: t("settings.passwordsDiffer"), variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: t("common.error"), description: t("settings.passwordMin"), variant: "destructive" });
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
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Header
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
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
                    {isAdmin ? <><Shield size={12} className="mr-1" />{t("role.admin")}</> : <><ChefHat size={12} className="mr-1" />{t("role.employee")}</>}
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
                {t("settings.profile")}
              </CardTitle>
              <CardDescription>{t("settings.profileDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.displayName")}</Label>
                  <Input
                    placeholder={t("settings.displayNamePlaceholder")}
                    value={profileForm.displayName}
                    onChange={e => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">{t("settings.displayNameHelp")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.username")}</Label>
                  <Input value={user?.username || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">{t("settings.usernameHelp")}</p>
                </div>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("common.saving")}</> : <><Save size={16} className="mr-2" />{t("settings.saveProfile")}</>}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.language")}</CardTitle>
              <CardDescription>{t("settings.languageDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                aria-label={t("settings.language")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={user?.language === "en" ? "en" : "pl"}
                disabled={languageMutation.isPending}
                onChange={(event) => languageMutation.mutate(event.target.value as Language)}
              >
                <option value="pl">{t("settings.polish")}</option>
                <option value="en">{t("settings.english")}</option>
              </select>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                {t("settings.changePassword")}
              </CardTitle>
              <CardDescription>{t("settings.changePasswordDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.currentPassword")}</Label>
                  <Input
                    type="password"
                    placeholder={t("settings.enterCurrentPassword")}
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t("settings.newPassword")}</Label>
                  <Input
                    type="password"
                    placeholder={t("settings.newPasswordPlaceholder")}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.repeatPassword")}</Label>
                  <Input
                    type="password"
                    placeholder={t("settings.repeatNewPassword")}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("settings.changing")}</> : <><Lock size={16} className="mr-2" />{t("settings.changePassword")}</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* App info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat size={18} className="text-primary" />
                {t("settings.about")}
              </CardTitle>
              <CardDescription>{BRANDING.productName} — {t("settings.aboutDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("settings.version")}</span>
                <span className="font-medium text-foreground">1.0</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>{t("settings.loggedInAs")}</span>
                <span className="font-medium text-foreground">{user?.displayName || user?.username}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
