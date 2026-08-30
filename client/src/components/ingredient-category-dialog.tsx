import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, FolderCog, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import type { IngredientCategory, IngredientWithStock, InsertIngredientCategory } from "@shared/schema";

interface IngredientCategoryDialogProps {
  trigger?: React.ReactNode;
}

export default function IngredientCategoryDialog({ trigger }: IngredientCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<IngredientCategory | null>(null);
  const [replacementCategoryId, setReplacementCategoryId] = useState("none");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: categories = [], isLoading } = useQuery<IngredientCategory[]>({
    queryKey: ["/api/ingredient-categories"],
    enabled: open,
  });
  const { data: ingredients = [] } = useQuery<IngredientWithStock[]>({
    queryKey: ["/api/ingredients"],
    enabled: open,
  });
  const usageByCategory = useMemo(() => ingredients.reduce<Record<string, number>>((counts, ingredient) => {
    if (ingredient.categoryId) counts[ingredient.categoryId] = (counts[ingredient.categoryId] || 0) + 1;
    return counts;
  }, {}), [ingredients]);

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/ingredient-categories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const saveCategory = useMutation({
    mutationFn: async (category: InsertIngredientCategory) => {
      const response = editingId
        ? await apiRequest("PUT", `/api/ingredient-categories/${editingId}`, category)
        : await apiRequest("POST", "/api/ingredient-categories", category);
      return response.json();
    },
    onSuccess: () => {
      invalidateRelated();
      resetForm();
      toast({
        title: editingId ? t("ingredientCategories.updated") : t("ingredientCategories.created"),
        description: editingId ? t("ingredientCategories.updatedDescription") : t("ingredientCategories.createdDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: editingId ? t("ingredientCategories.updateFailed") : t("ingredientCategories.createFailed"),
        variant: "destructive",
      });
    },
  });

  const removeCategory = useMutation({
    mutationFn: async ({ categoryId, replacementId }: { categoryId: string; replacementId: string | null }) => {
      const response = await apiRequest("DELETE", `/api/ingredient-categories/${categoryId}`, {
        replacementCategoryId: replacementId,
      });
      return response.json() as Promise<{ deleted: boolean; usageCount: number; reassignedTo: string | null }>;
    },
    onSuccess: () => {
      invalidateRelated();
      setDeleteCategory(null);
      toast({ title: t("ingredientCategories.deleted"), description: t("ingredientCategories.deletedDescription") });
    },
    onError: () => toast({ title: t("common.error"), description: t("ingredientCategories.deleteFailed"), variant: "destructive" }),
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveCategory.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}
        title={t("ingredientCategories.title")}
        description={t("ingredientCategories.subtitle")}
        className="sm:max-w-2xl max-h-[88vh] overflow-y-auto"
        testId="dialog-manage-ingredient-categories"
        trigger={trigger || <Button variant="outline" size="sm" data-testid="button-manage-categories"><FolderCog size={16} className="mr-2" />{t("ingredientCategories.manage")}</Button>}
      >
        <div className="space-y-6 pb-2">
          <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{editingId ? t("ingredientCategories.edit") : t("ingredientCategories.add")}</h3>
              {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X size={16} className="mr-1" />{t("common.cancel")}</Button>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="category-name">{t("ingredientCategories.name")}</Label><Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ingredientCategories.namePlaceholder")} required /></div>
              <div><Label htmlFor="category-description">{t("ingredientCategories.description")}</Label><Textarea id="category-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("ingredientCategories.descriptionPlaceholder")} className="min-h-[40px] sm:h-10" /></div>
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={saveCategory.isPending || !name.trim()}>{saveCategory.isPending ? t("common.saving") : <><Plus size={16} className="mr-2" />{editingId ? t("common.save") : t("ingredientCategories.create")}</>}</Button></div>
          </form>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("ingredientCategories.yourCategories")}</h3>
            {isLoading ? <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div> : categories.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("ingredientCategories.empty")}</p>
            ) : categories.map(category => {
              const usage = usageByCategory[category.id] || 0;
              return <div key={category.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{category.name}</span><Badge variant="secondary">{t("ingredientCategories.assignedCount", { count: usage })}</Badge></div>{category.description && <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>}</div>
                <div className="flex gap-2 self-end sm:self-auto"><Button size="sm" variant="outline" onClick={() => { setEditingId(category.id); setName(category.name); setDescription(category.description || ""); }}><Edit2 size={15} className="mr-1" />{t("common.edit")}</Button><Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setDeleteCategory(category); setReplacementCategoryId("none"); }}><Trash2 size={15} className="mr-1" />{t("common.delete")}</Button></div>
              </div>;
            })}
          </div>
        </div>
      </ResponsiveDialog>
      <AlertDialog open={!!deleteCategory} onOpenChange={(next) => !next && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("ingredientCategories.deleteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("ingredientCategories.deleteDescription", { name: deleteCategory?.name || "", count: deleteCategory ? usageByCategory[deleteCategory.id] || 0 : 0 })}</AlertDialogDescription></AlertDialogHeader>
          {(deleteCategory ? usageByCategory[deleteCategory.id] || 0 : 0) > 0 && <div className="space-y-2"><Label>{t("ingredientCategories.reassignLabel")}</Label><Select value={replacementCategoryId} onValueChange={setReplacementCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("ingredientCategories.noCategory")}</SelectItem>{categories.filter(category => category.id !== deleteCategory?.id).map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{replacementCategoryId === "none" ? t("ingredientCategories.noCategoryHelp") : t("ingredientCategories.reassignHelp")}</p></div>}
          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteCategory && removeCategory.mutate({ categoryId: deleteCategory.id, replacementId: replacementCategoryId === "none" ? null : replacementCategoryId })} disabled={removeCategory.isPending || !deleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{removeCategory.isPending ? t("ingredientCategories.deleting") : t("common.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
