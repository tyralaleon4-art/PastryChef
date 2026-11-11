import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = Record<string, unknown> & { id: string; name: string; unit: string; version: string };

export default function IngredientDuplicates() {
  const { language } = useI18n();
  const pl = language === "pl";
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState("");
  const query = useQuery<Row[]>({ queryKey: ["/api/admin/ingredient-duplicates"] });
  const rows = query.data ?? [];
  useEffect(() => { setConfirmed(false); }, [query.data]);
  const target = rows.find(r => r.id === targetId);
  const source = rows.find(r => r.id === sourceId);
  const candidates = rows.filter(r => target && r.id !== target.id && r.name.trim().toLowerCase() === target.name.trim().toLowerCase() && r.unit === target.unit);
  const merge = useMutation({
    mutationFn: async () => {
      if (!source || !target) throw new Error("Select ingredients");
      return (await apiRequest("POST", "/api/admin/ingredient-merge", {
        sourceId, targetId, sourceVersion: source.version, targetVersion: target.version,
      })).json();
    },
    onSuccess: async (data) => {
      setResult(pl ? `Scalono. Przepięte pozycje receptur: ${data.recipeLinks}, logi: ${data.inventoryLinks}.` : `Merged. Recipe links: ${data.recipeLinks}, inventory logs: ${data.inventoryLinks}.`);
      setSourceId(""); setTargetId(""); setConfirmed(false);
      await queryClient.invalidateQueries();
    },
  });
  const labels: Record<string, string> = {
    name: "Nazwa", unit: "Jednostka", cost_per_unit: "Cena za jednostkę (PLN)",
    current_stock: "Stan magazynowy", minimum_stock: "Stan minimalny", supplier: "Dostawca",
    category_id: "Identyfikator kategorii", allergens: "Alergeny", is_vegan: "Wegański",
    is_gluten_free: "Bez glutenu", is_lactose_free: "Bez laktozy", density_g_per_ml: "Gęstość",
    weight_per_piece_g: "Masa sztuki (g)", calories_per_100g: "Kalorie / 100 g",
    protein_per_100g: "Białko / 100 g", fat_per_100g: "Tłuszcz / 100 g",
    carbs_per_100g: "Węglowodany / 100 g", fiber_per_100g: "Błonnik / 100 g", expiry_date: "Termin ważności",
  };
  const show = (value: unknown): string => value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return <Card>
    <CardHeader><CardTitle>{pl ? "Scalanie duplikatów składników" : "Merge duplicate ingredients"}</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm">{pl
        ? "Wybierz składnik do zachowania i jego kopię. Wszystkie receptury i logi zostaną przepięte, także na innych kontach. Ilości w recepturach pozostaną bez zmian. Zachowujemy wyłącznie dane wybranej pozycji, w tym cenę, alergeny i stan magazynowy — stanów nie sumujemy. Kopia zostanie usunięta. Różne jednostki wymagają osobnej korekty."
        : "Select the record to keep and its duplicate. All accounts' recipe and inventory links will be reassigned; recipe quantities stay unchanged. Only the kept record's metadata, price, allergens and stock survive; stock is not added. The duplicate is deleted. Different units need separate correction."}</p>
      <Button variant="outline" disabled={query.isFetching || merge.isPending} onClick={() => { setConfirmed(false); void query.refetch(); }}>{pl ? "Odśwież duplikaty" : "Refresh duplicates"}</Button>
      {query.isLoading && <p>{pl ? "Ładowanie…" : "Loading…"}</p>}
      {query.isError && <p role="alert">{pl ? "Nie udało się pobrać duplikatów." : "Could not load duplicates."}</p>}
      {query.isSuccess && !rows.length && <p>{pl ? "Brak powtarzających się nazw." : "No duplicate names."}</p>}
      <label className="block">{pl ? "Zachowaj dane tego składnika" : "Keep this ingredient"}
        <select className="block w-full border rounded p-2 bg-background" value={targetId} disabled={merge.isPending} onChange={e => { setTargetId(e.target.value); setSourceId(""); setConfirmed(false); merge.reset(); setResult(""); }}>
          <option value="">{pl ? "Wybierz…" : "Select…"}</option>
          {rows.map(r => <option key={r.id} value={r.id}>{r.name} · {show(r.cost_per_unit)} PLN/{r.unit} · {show(r.supplier)} · {r.id.slice(0, 8)}</option>)}
        </select>
      </label>
      {target && <label className="block">{pl ? "Kopia do scalenia i usunięcia" : "Duplicate to merge and delete"}
        <select className="block w-full border rounded p-2 bg-background" value={sourceId} disabled={merge.isPending} onChange={e => { setSourceId(e.target.value); setConfirmed(false); merge.reset(); }}>
          <option value="">{pl ? "Wybierz…" : "Select…"}</option>
          {candidates.map(r => <option key={r.id} value={r.id}>{r.name} · {show(r.cost_per_unit)} PLN/{r.unit} · {show(r.supplier)} · {r.id.slice(0, 8)}</option>)}
        </select>
      </label>}
      {source && target && <>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th>{pl ? "Pole" : "Field"}</th><th>{pl ? "Zachowamy" : "Keep"}</th><th>{pl ? "Usuniemy" : "Discard"}</th></tr></thead>
          <tbody>{Object.keys(labels).map(key => <tr key={key} className={JSON.stringify(target[key]) !== JSON.stringify(source[key]) ? "bg-amber-100 text-black" : ""}>
            <td className="p-2">{pl ? labels[key] : key.replaceAll("_", " ")}</td><td className="p-2 break-all">{show(target[key])}</td><td className="p-2 break-all">{show(source[key])}</td>
          </tr>)}</tbody>
        </table></div>
        <label className="flex gap-2 items-start"><input type="checkbox" checked={confirmed} disabled={merge.isPending} onChange={e => setConfirmed(e.target.checked)} />
          {pl ? "Potwierdzam: zachować dane lewej kolumny i usunąć kopię po przepięciu receptur. Koszty receptur mogą się zmienić." : "Keep the left column and delete the duplicate after relinking recipes. Recipe costs may change."}
        </label>
        <Button disabled={!confirmed || merge.isPending} onClick={() => merge.mutate()}>{merge.isPending ? (pl ? "Scalanie…" : "Merging…") : (pl ? "Scal tę parę" : "Merge this pair")}</Button>
      </>}
      {merge.isError && <p role="alert" className="text-destructive">{merge.error.message}</p>}
      {result && <p role="status">{result}</p>}
    </CardContent>
  </Card>;
}
