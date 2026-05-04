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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Shield, User, ChefHat, Loader2 } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string | null;
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
        toast({ title: "User updated successfully" });
      } else {
        if (!form.password) {
          toast({ title: "Password required", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await apiRequest("POST", `/api/admin/users`, payload);
        toast({ title: "User created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onClose();
    } catch (err: any) {
      const msg = err.message?.includes("409") ? "Username already taken" : "Operation failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Display Name</Label>
        <Input
          placeholder="Full name (optional)"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Username *</Label>
        <Input
          placeholder="Login username"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{user ? "New Password (leave blank to keep)" : "Password *"}</Label>
        <Input
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required={!user}
          minLength={form.password ? 6 : undefined}
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Employee (User)</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : user ? "Save Changes" : "Create User"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
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
      toast({ title: "User deleted" });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("400") ? "Cannot delete your own account" : "Failed to delete user";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const admins = users.filter(u => u.role === "admin");
  const regularUsers = users.filter(u => u.role === "user");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header
          title="User Management"
          subtitle="Manage employee accounts and access"
          action={
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" />Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
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
                    <p className="text-sm text-muted-foreground">Total Users</p>
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
                    <p className="text-sm text-muted-foreground">Employees</p>
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
                    <p className="text-sm text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
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
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">@{u.username}</p>
                        </div>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="ml-2 hidden sm:inline-flex">
                          {u.role === "admin" ? "Admin" : "Employee"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditUser(u); setEditOpen(true); }}
                        >
                          <Edit size={16} />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{u.displayName || u.username}</strong> and all their data (recipes, ingredients, production plans). This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteUser.mutate(u.id)}
                                >
                                  Delete
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
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserFormDialog user={editUser} onClose={() => { setEditOpen(false); setEditUser(null); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
