import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash2, Link2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UtmRow {
  id: string;
  label: string;
  url: string;
  src: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_conjunto: string;
  utm_content: string;
  utm_term: string;
}

const SRC_OPTIONS = [
  { value: "pag", label: "Pago (pag)" },
  { value: "org", label: "Orgânico (org)" },
];

const ADS_MACROS = {
  utm_source: "{{site_source_name}}",
  utm_medium: "{{placement}}",
  utm_campaign: "{{campaign.name}}",
  utm_conjunto: "{{adset.name}}",
  utm_content: "{{ad.name}}",
};

const FIELD_HINTS: Record<string, string> = {
  url: "URL de destino do seu link",
  src: "Tipo de tráfego: pago ou orgânico",
  utm_source: "Origem do tráfego (ex: facebook, google, instagram)",
  utm_medium: "Mídia utilizada (ex: cpc, email, organic)",
  utm_campaign: "Nome da campanha",
  utm_conjunto: "Conjunto de anúncios (adset)",
  utm_content: "Conteúdo do anúncio",
  utm_term: "Palavra-chave (opcional)",
};

const emptyRow = (): UtmRow => ({
  id: crypto.randomUUID(),
  label: "",
  url: "",
  src: "org",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_conjunto: "",
  utm_content: "",
  utm_term: "",
});

function buildUrl(row: UtmRow): string {
  if (!row.url) return "";
  try {
    let base = row.url.trim();
    if (!base.startsWith("http")) base = "https://" + base;
    const url = new URL(base);
    if (row.src) url.searchParams.set("src", row.src);
    if (row.utm_source) url.searchParams.set("utm_source", row.utm_source);
    if (row.utm_medium) url.searchParams.set("utm_medium", row.utm_medium);
    if (row.utm_campaign) url.searchParams.set("utm_campaign", row.utm_campaign);
    if (row.utm_conjunto) url.searchParams.set("utm_conjunto", row.utm_conjunto);
    if (row.utm_content) url.searchParams.set("utm_content", row.utm_content);
    if (row.utm_term) url.searchParams.set("utm_term", row.utm_term);
    return url.toString();
  } catch {
    return "";
  }
}

export default function UtmGenerator() {
  const [rows, setRows] = useState<UtmRow[]>([emptyRow()]);

  const updateRow = useCallback((id: string, field: keyof UtmRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  }, []);

  const fillAdsMacros = useCallback((id: string) => {
    setRows(prev => prev.map(r => r.id === id ? {
      ...r,
      src: "pag",
      utm_source: ADS_MACROS.utm_source,
      utm_medium: ADS_MACROS.utm_medium,
      utm_campaign: ADS_MACROS.utm_campaign,
      utm_conjunto: ADS_MACROS.utm_conjunto,
      utm_content: ADS_MACROS.utm_content,
    } : r));
  }, []);

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  }, []);

  const copyAll = useCallback(() => {
    const urls = rows.map(r => buildUrl(r)).filter(Boolean);
    if (urls.length === 0) return toast.error("Nenhuma URL gerada");
    navigator.clipboard.writeText(urls.join("\n"));
    toast.success(`${urls.length} URL(s) copiada(s)!`);
  }, [rows]);

  const fields: { key: keyof UtmRow; label: string }[] = [
    { key: "utm_source", label: "Source" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_conjunto", label: "Conjunto" },
    { key: "utm_content", label: "Content" },
    { key: "utm_term", label: "Term" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Gerador de UTMs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Insira a URL e os parâmetros UTM para gerar links rastreáveis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="text-xs gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copiar todos
          </Button>
          <Button size="sm" onClick={addRow} className="text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo link
          </Button>
        </div>
      </div>

      {rows.map((row, idx) => {
        const generatedUrl = buildUrl(row);
        return (
          <Card key={row.id} className="overflow-hidden">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <Input
                    value={row.label}
                    onChange={e => updateRow(row.id, "label", e.target.value)}
                    placeholder={`Link ${idx + 1}`}
                    className="h-7 text-xs w-40 border-dashed"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 gap-1" onClick={() => fillAdsMacros(row.id)}>
                    Preencher Ads
                  </Button>
                  {rows.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => removeRow(row.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* URL + src */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">URL de destino</Label>
                    <Tooltip><TooltipTrigger asChild><HelpCircle className="h-2.5 w-2.5 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs max-w-[200px]">{FIELD_HINTS.url}</TooltipContent></Tooltip>
                  </div>
                  <Input
                    value={row.url}
                    onChange={e => updateRow(row.id, "url", e.target.value)}
                    placeholder="https://seusite.com.br/pagina"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">SRC</Label>
                    <Tooltip><TooltipTrigger asChild><HelpCircle className="h-2.5 w-2.5 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs max-w-[200px]">{FIELD_HINTS.src}</TooltipContent></Tooltip>
                  </div>
                  <Select value={row.src} onValueChange={v => updateRow(row.id, "src", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SRC_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* UTM fields */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <div className="flex items-center gap-1 mb-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="h-2.5 w-2.5 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs max-w-[200px]">{FIELD_HINTS[f.key]}</TooltipContent></Tooltip>
                    </div>
                    <Input
                      value={row[f.key] as string}
                      onChange={e => updateRow(row.id, f.key, e.target.value)}
                      placeholder={`${f.label}`}
                      className="text-xs h-8"
                    />
                  </div>
                ))}
              </div>

              {/* Generated URL */}
              {generatedUrl && (
                <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">URL gerada</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={() => copyUrl(generatedUrl)}>
                      <Copy className="h-3 w-3" /> Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/80 font-mono break-all select-all leading-relaxed">{generatedUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
