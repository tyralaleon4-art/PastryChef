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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Shield, User, ChefHat, Loader2, BookOpen, Utensils, Tag } from "lucide-react";

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
        toast({ title: "Zaktualizowano użytkownika" });
      } else {
        if (!form.password) {
          toast({ title: "Hasło jest wymagane", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await apiRequest("POST", `/api/admin/users`, payload);
        toast({ title: "Utworzono użytkownika" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onClose();
    } catch (err: any) {
      const msg = err.message?.includes("409") ? "Nazwa użytkownika jest zajęta" : "Operacja nie powiodła się";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Imię i nazwisko</Label>
        <Input
          placeholder="Imię i nazwisko (opcjonalnie)"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Nazwa użytkownika *</Label>
        <Input
          placeholder="Login"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{user ? "Nowe hasło (zostaw puste aby nie zmieniać)" : "Hasło *"}</Label>
        <Input
          type="password"
          placeholder="Min. 6 znaków"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required={!user}
          minLength={form.password ? 6 : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label>Rola</Label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Pracownik</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisuję...</> : user ? "Zapisz zmiany" : "Utwórz użytkownika"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Anuluj</Button>
      </div>
    </form>
  );
}

function UserRecipesSheet({ user, open, onClose }: { user: AdminUser; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useQuery<UserData>({
    queryKey: ["/api/admin/users", user.id, "data"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${user.id}/data`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: open,
  });

  const categoryMap = Object.fromEntries((data?.categories ?? []).map(c => [c.id, c.name]));

  const difficultyLabel: Record<string, string> = {
    easy: "łatwy",
    medium: "średni",
    hard: "trudny",
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Przepisy — {user.displayName || user.username}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Wczytuję..." : `${data?.recipes.length ?? 0} przepisów · ${data?.ingredients.length ?? 0} składników`}
          </p>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : !data?.recipes.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Utensils size={40} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">Ten użytkownik nie ma jeszcze żadnych przepisów</p>
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
                    {recipe.isVegan && <Badge variant="outline" className="text-green-600 text-xs">Vegan</Badge>}
                    {recipe.isGlutenFree && <Badge variant="outline" className="text-blue-600 text-xs">Bez glutenu</Badge>}
                    {recipe.isLactoseFree && <Badge variant="outline" className="text-purple-600 text-xs">Bez laktozy</Badge>}
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
                    <span>{recipe.servings} porcji</span>
                  )}
                  {recipe.prepTimeMinutes && (
                    <span>{recipe.prepTimeMinutes} min</span>
                  )}
                  {recipe.difficulty && (
                    <span className="capitalize">{difficultyLabel[recipe.difficulty] ?? recipe.difficulty}</span>
                  )}
                  {recipe.allergens && recipe.allergens.length > 0 && (
                    <span className="text-amber-600">Alergeny: {recipe.allergens.join(", ")}</span>
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
      toast({ title: "Użytkownik usunięty" });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("400") ? "Nie można usunąć własnego konta" : "Nie udało się usunąć użytkownika";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    },
  });

  const admins = users.filter(u => u.role === "admin");
  const regularUsers = users.filter(u => u.role === "user");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header
          title="Zarządzanie użytkownikami"
          subtitle="Zarządzaj kontami pracowników i uprawnieniami"
          action={
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" />Dodaj użytkownika</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Utwórz nowego użytkownika</DialogTitle>
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
                    <p className="text-sm text-muted-foreground">Wszyscy użytkownicy</p>
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
                    <p className="text-sm text-muted-foreground">Pracownicy</p>
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
                    <p className="text-sm text-muted-foreground">Administratorzy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <Card>
            <CardHeader>
              <CardTitle>Wszystkie konta</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Brak użytkowników</p>
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
                              <span className="ml-2 text-xs text-muted-foreground">(ty)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">@{u.username}</p>
                        </div>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="ml-2 hidden sm:inline-flex">
                          {u.role === "admin" ? "Admin" : "Pracownik"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Pokaż przepisy"
                          onClick={() => { setRecipesUser(u); setRecipesOpen(true); }}
                        >
                          <BookOpen size={16} className="text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edytuj użytkownika"
                          onClick={() => { setEditUser(u); setEditOpen(true); }}
                        >
                          <Edit size={16} />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Usuń użytkownika">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Usunąć użytkownika?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Spowoduje to trwałe usunięcie konta <strong>{u.displayName || u.username}</strong> wraz ze wszystkimi danymi (przepisy, składniki, plany produkcji). Tej operacji nie można cofnąć.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteUser.mutate(u.id)}
                                >
                                  Usuń
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
            <DialogTitle>Edytuj użytkownika</DialogTitle>
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
          open={recipesOpen}
          onClose={() => { setRecipesOpen(false); setRecipesUser(null); }}
        />
      )}
    </div>
  );
}
