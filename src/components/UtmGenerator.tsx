import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash2, Link2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface UtmRow {
  id: string;
  label: string;
  url: string;
  src: string;
  utm_source: string;
  utm_campaign: string;
  utm_medium: string;
  utm_conjunto: string;
  utm_content: string;
  utm_term: string;
}

const SRC_OPTIONS = [
  { value: "pag", label: "Pago" },
  { value: "org", label: "Orgânico" },
];

interface UtmTemplate {
  label: string;
  src: string;
  utm_source: string;
  utm_campaign: string;
  utm_medium: string;
  utm_conjunto: string;
  utm_content: string;
}

const TEMPLATES: UtmTemplate[] = [
  // Pago
  { label: "Facebook Ads", src: "pag", utm_source: "{{site_source_name}}", utm_campaign: "{{campaign.name}}", utm_medium: "{{placement}}", utm_conjunto: "{{adset.name}}", utm_content: "{{ad.name}}" },
  // Orgânicos — baseados na planilha
  { label: "IG Link Bio", src: "org", utm_source: "instagram", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "ig_link_bio" },
  { label: "IG Direct", src: "org", utm_source: "instagram", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "ig_direct" },
  { label: "IG Stories", src: "org", utm_source: "instagram", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "ig_stories" },
  { label: "IG ManyChat", src: "org", utm_source: "instagram", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "ig_direct_manychat" },
  { label: "WhatsApp", src: "org", utm_source: "whatsapp", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "msg_grupos" },
  { label: "E-mail", src: "org", utm_source: "email", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "email" },
  { label: "E-mail Convite", src: "org", utm_source: "email", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "convite_todabase" },
  { label: "TikTok Bio", src: "org", utm_source: "tiktok", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "tk_link_bio" },
  { label: "Facebook", src: "org", utm_source: "facebook", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "fb_direct" },
  { label: "YouTube", src: "org", utm_source: "youtube", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "yt_descricao" },
  { label: "Telegram", src: "org", utm_source: "telegram", utm_campaign: "", utm_medium: "organic", utm_conjunto: "org", utm_content: "msg_canal" },
];

const FIELD_HINTS: Record<string, string> = {
  url: "URL de destino do seu link",
  src: "Tipo de tráfego: pago ou orgânico",
  utm_source: "Origem do tráfego (ex: instagram, facebook)",
  utm_campaign: "Nome da campanha",
  utm_medium: "Mídia utilizada (ex: cpc, organic)",
  utm_conjunto: "Conjunto de anúncios (adset)",
  utm_content: "Conteúdo do anúncio ou link",
  utm_term: "Palavra-chave (opcional)",
};

const emptyRow = (): UtmRow => ({
  id: crypto.randomUUID(),
  label: "",
  url: "",
  src: "org",
  utm_source: "",
  utm_campaign: "",
  utm_medium: "",
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
    if (row.utm_campaign) url.searchParams.set("utm_campaign", row.utm_campaign);
    if (row.utm_medium) url.searchParams.set("utm_medium", row.utm_medium);
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

  const addFromTemplate = useCallback((tpl: UtmTemplate) => {
    const newRow: UtmRow = {
      id: crypto.randomUUID(),
      label: tpl.label,
      url: rows[0]?.url || "",
      src: tpl.src,
      utm_source: tpl.utm_source,
      utm_campaign: tpl.utm_campaign,
      utm_medium: tpl.utm_medium,
      utm_conjunto: tpl.utm_conjunto,
      utm_content: tpl.utm_content,
      utm_term: "",
    };
    setRows(prev => [...prev, newRow]);
    toast.success(`"${tpl.label}" adicionado`);
  }, [rows]);

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
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_conjunto", label: "Conjunto" },
    { key: "utm_content", label: "Content" },
    { key: "utm_term", label: "Term" },
  ];

  const paidTemplates = TEMPLATES.filter(t => t.src === "pag");
  const organicTemplates = TEMPLATES.filter(t => t.src === "org");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Gerador de UTMs</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Clique em um template para adicionar uma linha pré-preenchida.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="text-[11px] h-7 gap-1 px-2.5">
            <Copy className="h-3 w-3" /> Copiar todos
          </Button>
          <Button size="sm" onClick={addRow} className="text-[11px] h-7 gap-1 px-2.5 gradient-bg border-0 text-primary-foreground">
            <Plus className="h-3 w-3" /> Novo link
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-lg border border-border/30 bg-card/50 p-3">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mr-1">Pago</span>
          {paidTemplates.map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => addFromTemplate(tpl)}
              className="px-2 py-0.5 rounded border border-primary/30 bg-primary/5 hover:bg-primary/15 text-[10px] font-medium text-foreground transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">Orgânico</span>
          {organicTemplates.map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => addFromTemplate(tpl)}
              className="px-2 py-0.5 rounded border border-border/40 bg-muted/30 hover:bg-muted/60 text-[10px] font-medium text-foreground/80 transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {rows.map((row, idx) => {
        const generatedUrl = buildUrl(row);
        return (
          <Card key={row.id} className="overflow-hidden">
            <CardHeader className="py-2.5 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <Input
                    value={row.label}
                    onChange={e => updateRow(row.id, "label", e.target.value)}
                    placeholder={`Link ${idx + 1}`}
                    className="h-6 text-[11px] w-36 border-dashed"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {rows.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => removeRow(row.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 space-y-2">
              {/* URL + SRC */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-2">
                <div>
                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5 block">URL de destino</Label>
                  <Input
                    value={row.url}
                    onChange={e => updateRow(row.id, "url", e.target.value)}
                    placeholder="https://seusite.com.br/pagina"
                    className="text-[11px] h-7"
                  />
                </div>
                <div>
                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5 block">SRC</Label>
                  <Select value={row.src} onValueChange={v => updateRow(row.id, "src", v)}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SRC_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* UTM fields — order: Source, Campaign, Medium, Content, Term */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {fields.map(f => (
                  <div key={f.key}>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="h-2.5 w-2.5 text-muted-foreground/30 cursor-help" /></TooltipTrigger>
                        <TooltipContent className="text-[11px] max-w-[180px]">{FIELD_HINTS[f.key]}</TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      value={row[f.key] as string}
                      onChange={e => updateRow(row.id, f.key, e.target.value)}
                      placeholder={f.label.toLowerCase()}
                      className="text-[11px] h-7 font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Generated URL */}
              {generatedUrl && (
                <div className="rounded-md bg-muted/20 border border-border/20 px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">URL gerada</span>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-1 px-1.5" onClick={() => copyUrl(generatedUrl)}>
                      <Copy className="h-2.5 w-2.5" /> Copiar
                    </Button>
                  </div>
                  <p className="text-[11px] text-foreground/80 font-mono break-all select-all leading-relaxed">{generatedUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
