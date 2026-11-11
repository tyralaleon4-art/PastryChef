import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = Record<string, unknown> & { id: string; name: string; unit: string; version: string };
type Preview = {
  version: string; removedCount: number; recipeLinks: number; inventoryLinks: number;
  manualIds: string[];
  groups: { name: string; targetId: string; sourceIds: string[] }[];
};

export default function IngredientDuplicates() {
  const { language } = useI18n();
  const pl = language === "pl";
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState("");
  const [bulkConfirmed, setBulkConfirmed] = useState(false);
  const query = useQuery<Row[]>({ queryKey: ["/api/admin/ingredient-duplicates"] });
  const preview = useQuery<Preview>({ queryKey: ["/api/admin/ingredient-merge-preview"] });
  const rows = query.data ?? [];
  useEffect(() => { setConfirmed(false); }, [query.data]);
  useEffect(() => { setBulkConfirmed(false); }, [preview.data, preview.isFetching]);
  const manualRows = preview.data ? rows.filter(row => preview.data.manualIds.includes(row.id)) : rows;
  const target = rows.find(r => r.id === targetId);
  const source = rows.find(r => r.id === sourceId);
  const candidates = manualRows.filter(r => target && r.id !== target.id && r.name.trim().toLowerCase() === target.name.trim().toLowerCase() && r.unit === target.unit);
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
  const bulk = useMutation({
    mutationFn: async () => {
      if (!preview.data || !bulkConfirmed) throw new Error(pl ? "Potwierdź scalenie" : "Confirm merge");
      return (await apiRequest("POST", "/api/admin/ingredient-merge-identical", {
        version: preview.data.version, confirmed: true,
      })).json();
    },
    onSuccess: async (data) => {
      setResult(pl
        ? `Usunięto identyczne kopie: ${data.removedCount}. Przepięte pozycje receptur: ${data.recipeLinks}, logi: ${data.inventoryLinks}.`
        : `Identical copies removed: ${data.removedCount}. Recipe links: ${data.recipeLinks}, inventory logs: ${data.inventoryLinks}.`);
      setSourceId(""); setTargetId(""); setConfirmed(false); setBulkConfirmed(false);
      await queryClient.invalidateQueries();
    },
    onError: () => { setBulkConfirmed(false); },
  });
  const busy = merge.isPending || bulk.isPending;
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
      <section className="rounded border p-3 space-y-3" aria-label={pl ? "Identyczne kopie" : "Identical copies"}>
        <h3 className="font-semibold">{pl ? "1. Identyczne kopie — zbiorczo" : "1. Identical copies — bulk merge"}</h3>
        <p className="text-sm">{pl
          ? "Automatycznie wybieramy wyłącznie kopie z takimi samymi danymi: jednostką, ceną, kategorią, alergenami, dostawcą, wartościami odżywczymi i stanem magazynowym. Różnice w wielkości liter nazwy, jej skrajnych spacjach oraz kolejności alergenów są pomijane. Zachowamy najstarszy z identycznych wpisów. Stanów nie sumujemy. Receptury zachowają wszystkie pozycje i ilości, również na innych kontach."
          : "Only copies with matching business data qualify: unit, price, category, allergens, supplier, nutrition and stock. Name casing, surrounding spaces and allergen order are ignored. The oldest identical record survives. Stock is not added. All accounts' recipe rows and quantities are preserved."}</p>
        {preview.isLoading && <p>{pl ? "Sprawdzanie identycznych kopii…" : "Checking identical copies…"}</p>}
        {preview.isError && <p role="alert">{pl ? "Nie udało się przygotować podsumowania. Odśwież duplikaty." : "Could not prepare preview. Refresh duplicates."}</p>}
        {preview.data && <>
          <p className="font-medium">{pl
            ? `Kopie do usunięcia: ${preview.data.removedCount} · grupy: ${preview.data.groups.length} · pozycje receptur do przepięcia: ${preview.data.recipeLinks} · logi: ${preview.data.inventoryLinks}.`
            : `Copies to remove: ${preview.data.removedCount} · groups: ${preview.data.groups.length} · recipe links: ${preview.data.recipeLinks} · inventory logs: ${preview.data.inventoryLinks}.`}</p>
          {preview.data.removedCount > 0 ? <>
            <details><summary className="cursor-pointer">{pl ? "Pokaż listę identycznych kopii" : "Show identical copies"}</summary>
              <ul className="list-disc pl-5 max-h-52 overflow-y-auto">{preview.data.groups.map(group => <li key={group.targetId}>{group.name} — {group.sourceIds.length} {pl ? "kopii do usunięcia" : "copies to remove"}</li>)}</ul>
            </details>
            <label className="flex items-start gap-2"><input type="checkbox" checked={bulkConfirmed}
              disabled={busy || preview.isFetching || preview.isError}
              onChange={e => { setBulkConfirmed(e.target.checked); bulk.reset(); setResult(""); }} />
              {pl ? "Potwierdzam scalenie wszystkich identycznych kopii z podsumowania. Kopie zostaną usunięte po przepięciu receptur i logów." : "Merge all identical copies in this summary. Copies will be deleted after relinking recipes and logs."}
            </label>
            <Button disabled={!bulkConfirmed || busy || preview.isFetching || preview.isError}
              onClick={() => bulk.mutate()}>{bulk.isPending ? (pl ? "Scalanie…" : "Merging…") : (pl ? "Scal wszystkie identyczne kopie" : "Merge all identical copies")}</Button>
          </> : <p>{pl ? "Brak identycznych kopii do zbiorczego scalenia." : "No identical copies to merge in bulk."}</p>}
        </>}
        {bulk.isError && <p role="alert" className="text-destructive">{bulk.error.message}</p>}
      </section>
      <h3 className="font-semibold">{pl ? "2. Składniki różniące się danymi — wybór ręczny" : "2. Different data — manual choice"}</h3>
      {preview.data && !manualRows.length && <p>{pl ? "Nie wykryto różniących się kopii. Identyczne obsłużysz powyżej." : "No conflicting copies found. Handle identical copies above."}</p>}
      <p className="text-sm">{pl
        ? "Wybierz składnik do zachowania i jego kopię. Wszystkie receptury i logi zostaną przepięte, także na innych kontach. Ilości w recepturach pozostaną bez zmian. Zachowujemy wyłącznie dane wybranej pozycji, w tym cenę, alergeny i stan magazynowy — stanów nie sumujemy. Kopia zostanie usunięta. Różne jednostki wymagają osobnej korekty."
        : "Select the record to keep and its duplicate. All accounts' recipe and inventory links will be reassigned; recipe quantities stay unchanged. Only the kept record's metadata, price, allergens and stock survive; stock is not added. The duplicate is deleted. Different units need separate correction."}</p>
      <Button variant="outline" disabled={query.isFetching || preview.isFetching || busy} onClick={() => { setConfirmed(false); setBulkConfirmed(false); bulk.reset(); merge.reset(); void query.refetch(); void preview.refetch(); }}>{pl ? "Odśwież duplikaty" : "Refresh duplicates"}</Button>
      {query.isLoading && <p>{pl ? "Ładowanie…" : "Loading…"}</p>}
      {query.isError && <p role="alert">{pl ? "Nie udało się pobrać duplikatów." : "Could not load duplicates."}</p>}
      {query.isSuccess && !rows.length && <p>{pl ? "Brak powtarzających się nazw." : "No duplicate names."}</p>}
      <label className="block">{pl ? "Zachowaj dane tego składnika" : "Keep this ingredient"}
        <select className="block w-full border rounded p-2 bg-background" value={targetId} disabled={busy} onChange={e => { setTargetId(e.target.value); setSourceId(""); setConfirmed(false); merge.reset(); setResult(""); }}>
          <option value="">{pl ? "Wybierz…" : "Select…"}</option>
          {manualRows.map(r => <option key={r.id} value={r.id}>{r.name} · {show(r.cost_per_unit)} PLN/{r.unit} · {show(r.supplier)} · {r.id.slice(0, 8)}</option>)}
        </select>
      </label>
      {target && <label className="block">{pl ? "Kopia do scalenia i usunięcia" : "Duplicate to merge and delete"}
        <select className="block w-full border rounded p-2 bg-background" value={sourceId} disabled={busy} onChange={e => { setSourceId(e.target.value); setConfirmed(false); merge.reset(); }}>
          <option value="">{pl ? "Wybierz…" : "Select…"}</option>
          {candidates.map(r => <option key={r.id} value={r.id}>{r.name} · {show(r.cost_per_unit)} PLN/{r.unit} · {show(r.supplier)} · {r.id.slice(0, 8)}</option>)}
        </select>
      </label>}
      {target && !candidates.length && <p>{pl ? "Brak kopii o zgodnej jednostce. Najpierw sprawdź i popraw jednostki — nie przeliczamy ich automatycznie." : "No duplicate with a matching unit. Check and correct units first; units are not converted automatically."}</p>}
      {source && target && <>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th>{pl ? "Pole" : "Field"}</th><th>{pl ? "Zachowamy" : "Keep"}</th><th>{pl ? "Usuniemy" : "Discard"}</th></tr></thead>
          <tbody>{Object.keys(labels).map(key => <tr key={key} className={JSON.stringify(target[key]) !== JSON.stringify(source[key]) ? "bg-amber-100 text-black" : ""}>
            <td className="p-2">{pl ? labels[key] : key.replaceAll("_", " ")}</td><td className="p-2 break-all">{show(target[key])}</td><td className="p-2 break-all">{show(source[key])}</td>
          </tr>)}</tbody>
        </table></div>
        <label className="flex gap-2 items-start"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />
          {pl ? "Potwierdzam: zachować dane lewej kolumny i usunąć kopię po przepięciu receptur. Koszty receptur mogą się zmienić." : "Keep the left column and delete the duplicate after relinking recipes. Recipe costs may change."}
        </label>
        <Button disabled={!confirmed || busy} onClick={() => merge.mutate()}>{merge.isPending ? (pl ? "Scalanie…" : "Merging…") : (pl ? "Scal tę parę" : "Merge this pair")}</Button>
      </>}
      {merge.isError && <p role="alert" className="text-destructive">{merge.error.message}</p>}
      {result && <p role="status">{result}</p>}
    </CardContent>
  </Card>;
}
