import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Shield, User, ChefHat, Loader2, BookOpen, Utensils, Tag, Download, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { enAiAdmin, plAiAdmin } from "@/i18n/ai-admin";

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string | null;
}

interface UserData {
  user: AdminUser;
  recipes: Array<{
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    isVegan: boolean | null;
    isGlutenFree: boolean | null;
    isLactoseFree: boolean | null;
    allergens: string[] | null;
    servings: number | null;
    prepTimeMinutes: number | null;
    difficulty: string | null;
  }>;
  ingredients: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

function UserFormDialog({ user, onClose }: { user?: AdminUser; onClose: () => void }) {
  const { language, t: commonT } = useI18n();
  const translations = language === "en" ? enAiAdmin : plAiAdmin;
  const t = (key: string) => translations[key] as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    username: user?.username || "",
    displayName: user?.displayName || "",
    password: "",
    role: user?.role || "user",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: any = {
        username: form.username,
        displayName: form.displayName || null,
        role: form.role,
      };
      if (form.password) payload.password = form.password;

      if (user) {
        await apiRequest("PUT", `/api/admin/users/${user.id}`, payload);
        toast({ title: t("admin.userUpdated") });
      } else {
        if (!form.password) {
          toast({ title: t("admin.passwordRequired"), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await apiRequest("POST", `/api/admin/users`, payload);
        toast({ title: t("admin.userCreated") });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onClose();
    } catch (err: any) {
      const msg = err.message?.includes("409") ? t("admin.usernameTaken") : t("admin.operationFailed");
      toast({ title: commonT("common.error"), description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("admin.fullName")}</Label>
        <Input
          placeholder={t("admin.fullNamePlaceholder")}
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.username")} *</Label>
        <Input
          placeholder={t("admin.usernamePlaceholder")}
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{user ? t("admin.newPassword") : `${t("admin.password")} *`}</Label>
        <Input
          type="password"
          placeholder={t("admin.passwordPlaceholder")}
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required={!user}
          minLength={form.password ? 6 : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.role")}</Label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{t("admin.employee")}</SelectItem>
            <SelectItem value="admin">{t("admin.administrator")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("admin.saving")}</> : user ? t("admin.saveChanges") : t("admin.createUser")}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
      </div>
    </form>
  );
}

function UserRecipesSheet({ user, users, currentUserId, open, onClose }: {
  user: AdminUser;
  users: AdminUser[];
  currentUserId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useI18n();
  const translations = language === "en" ? enAiAdmin : plAiAdmin;
  const t = (key: string, values?: Record<string, string | number>) => {
    const entry = translations[key];
    return typeof entry === "function" ? entry(values ?? {}) : entry;
  };
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [targetUserId, setTargetUserId] = useState(currentUserId);

  const { data, isLoading } = useQuery<UserData>({
    queryKey: ["/api/admin/users", user.id, "data"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${user.id}/data`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: open,
  });

  const importAll = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/users/${user.id}/import-recipes`, { targetUserId });
      return res.json() as Promise<{ imported: number; skipped: number; total: number }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", targetUserId, "data"] });
      if (result.imported === 0) {
        toast({ title: t("admin.nothingToImport"), description: t("admin.allRecipesExistOnTarget") });
      } else {
        toast({
          title: t("admin.recipesCopied", { count: result.imported }),
          description: result.skipped > 0 ? t("admin.duplicatesSkipped", { count: result.skipped }) : undefined,
        });
      }
    },
    onError: () => toast({ title: t("admin.importError"), variant: "destructive" }),
  });

  const categoryMap = Object.fromEntries((data?.categories ?? []).map(c => [c.id, c.name]));
  const availableTargets = users.filter(candidate => candidate.id !== user.id);
  const selectedTarget = availableTargets.find(candidate => candidate.id === targetUserId);

  const difficultyLabel: Record<string, string> = {
    easy: t("admin.easy"),
    medium: t("admin.medium"),
    hard: t("admin.hard"),
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            {t("admin.recipesForUser", { name: user.displayName || user.username })}
          </SheetTitle>
          <SheetDescription>{t("admin.copyHint")}</SheetDescription>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? t("admin.loading") : t("admin.recipeIngredientCount", { recipes: data?.recipes.length ?? 0, ingredients: data?.ingredients.length ?? 0 })}
            </p>
            {!isLoading && (data?.recipes.length ?? 0) > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <Label htmlFor="recipe-transfer-target">{t("admin.copyToAccount")}</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={targetUserId} onValueChange={(value) => {
                    setTargetUserId(value);
                    importAll.reset();
                  }}>
                    <SelectTrigger id="recipe-transfer-target" data-testid="select-recipe-transfer-target" className="flex-1">
                      <SelectValue placeholder={t("admin.selectTargetAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map(candidate => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.displayName || candidate.username}
                          {candidate.id === currentUserId ? ` (${t("admin.you")})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => importAll.mutate()}
                    disabled={importAll.isPending || !selectedTarget}
                    className="flex-shrink-0"
                    data-testid="button-copy-all-recipes"
                  >
                    {importAll.isPending ? (
                      <><Loader2 size={14} className="mr-2 animate-spin" />{t("admin.copying")}</>
                    ) : importAll.isSuccess ? (
                      <><CheckCircle2 size={14} className="mr-2 text-green-500" />{t("admin.copied")}</>
                    ) : (
                      <><Download size={14} className="mr-2" />{t("admin.copyAll")}</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("admin.copyHint")}</p>
              </div>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : !data?.recipes.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Utensils size={40} className="text-muted-foreground/40" />
             <p className="text-muted-foreground">{t("admin.noUserRecipes")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recipes.map(recipe => (
              <div key={recipe.id} className="border rounded-lg p-4 bg-card hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Utensils size={15} className="text-primary flex-shrink-0" />
                    <span className="font-medium truncate">{recipe.name}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                     {recipe.isVegan && <Badge variant="outline" className="text-green-600 text-xs">{t("admin.vegan")}</Badge>}
                     {recipe.isGlutenFree && <Badge variant="outline" className="text-blue-600 text-xs">{t("admin.glutenFree")}</Badge>}
                     {recipe.isLactoseFree && <Badge variant="outline" className="text-purple-600 text-xs">{t("admin.lactoseFree")}</Badge>}
                  </div>
                </div>

                {recipe.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{recipe.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {recipe.categoryId && categoryMap[recipe.categoryId] && (
                    <span className="flex items-center gap-1">
                      <Tag size={11} />
                      {categoryMap[recipe.categoryId]}
                    </span>
                  )}
                  {recipe.servings && (
                     <span>{recipe.servings} {t("admin.servings")}</span>
                  )}
                  {recipe.prepTimeMinutes && (
                    <span>{recipe.prepTimeMinutes} min</span>
                  )}
                  {recipe.difficulty && (
                    <span className="capitalize">{difficultyLabel[recipe.difficulty] ?? recipe.difficulty}</span>
                  )}
                  {recipe.allergens && recipe.allergens.length > 0 && (
                     <span className="text-amber-600">{t("admin.allergens", { allergens: recipe.allergens.join(", ") })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Admin() {
  const { language, t: commonT } = useI18n();
  const translations = language === "en" ? enAiAdmin : plAiAdmin;
  const t = (key: string, values?: Record<string, string | number>) => {
    const entry = translations[key];
    return typeof entry === "function" ? entry(values ?? {}) : entry;
  };
  const { user: currentUser, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [recipesUser, setRecipesUser] = useState<AdminUser | null>(null);
  const [recipesOpen, setRecipesOpen] = useState(false);

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("admin.userDeleted") });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("400") ? t("admin.cannotDeleteOwnAccount") : t("admin.deleteUserFailed");
      toast({ title: commonT("common.error"), description: msg, variant: "destructive" });
    },
  });

  const admins = users.filter(u => u.role === "admin");
  const regularUsers = users.filter(u => u.role === "user");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Header
          title={t("admin.title")}
          subtitle={t("admin.subtitle")}
          action={
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" />{t("admin.addUser")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("admin.createNewUser")}</DialogTitle>
                </DialogHeader>
                <UserFormDialog onClose={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          }
        />

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-2"><User className="text-primary" size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                     <p className="text-sm text-muted-foreground">{t("admin.allUsers")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 rounded-full p-2"><ChefHat className="text-blue-500" size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{regularUsers.length}</p>
                     <p className="text-sm text-muted-foreground">{t("admin.employees")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 rounded-full p-2"><Shield className="text-amber-500" size={20} /></div>
                  <div>
                    <p className="text-2xl font-bold">{admins.length}</p>
                     <p className="text-sm text-muted-foreground">{t("admin.administrators")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <Card>
            <CardHeader>
               <CardTitle>{t("admin.allAccounts")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : users.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">{t("admin.noUsers")}</p>
              ) : (
                <div className="space-y-2">
                  {users.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`rounded-full p-2 ${u.role === "admin" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                          {u.role === "admin" ? (
                            <Shield size={16} className="text-amber-500" />
                          ) : (
                            <User size={16} className="text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {u.displayName || u.username}
                            {u.id === currentUser?.id && (
                               <span className="ml-2 text-xs text-muted-foreground">({t("admin.you")})</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">@{u.username}</p>
                        </div>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="ml-2 hidden sm:inline-flex">
                           {u.role === "admin" ? t("admin.administrator") : t("admin.employee")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                           title={t("admin.showRecipes")}
                          onClick={() => { setRecipesUser(u); setRecipesOpen(true); }}
                        >
                          <BookOpen size={16} className="text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                           title={t("admin.editUser")}
                          onClick={() => { setEditUser(u); setEditOpen(true); }}
                        >
                          <Edit size={16} />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t("admin.deleteUser")}>
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                 <AlertDialogTitle>{t("admin.deleteUserQuestion")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                   {t("admin.deleteUserDescription", { name: u.displayName || u.username })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                 <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteUser.mutate(u.id)}
                                >
                                   {t("admin.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>{t("admin.editUser")}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserFormDialog user={editUser} onClose={() => { setEditOpen(false); setEditUser(null); }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Recipes Sheet */}
      {recipesUser && (
        <UserRecipesSheet
          user={recipesUser}
          users={users}
          currentUserId={currentUser?.id ?? ""}
          open={recipesOpen}
          onClose={() => { setRecipesOpen(false); setRecipesUser(null); }}
        />
      )}
    </div>
  );
}
