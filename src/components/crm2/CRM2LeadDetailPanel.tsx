import { useState } from "react";
import { X, User, Trash2, Plus, Edit2, Tag, MessageSquare, ExternalLink, ShoppingCart, Globe, Building2, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCRM2Notes, useCRM2Activities } from "@/hooks/useCRM2";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { lead: any; crm: any; onClose: () => void; }

export default function CRM2LeadDetailPanel({ lead, crm, onClose }: Props) {
  const notes = useCRM2Notes("lead", lead.id);
  const activities = useCRM2Activities("lead", lead.id);
  const [noteText, setNoteText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: lead.first_name || "", last_name: lead.last_name || "",
    email: lead.email || "", phone: lead.phone || "",
    organization: lead.organization || "", source: lead.source || "",
    job_title: lead.job_title || "", website: lead.website || "",
    industry: lead.industry || "", territory: lead.territory || "",
  });
  const [showDelete, setShowDelete] = useState(false);

  const handleSaveEdit = () => { crm.updateLead.mutate({ id: lead.id, ...editForm }); setEditing(false); };
  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    crm.addNote.mutate({ content: noteText.trim(), reference_type: "lead", reference_id: lead.id });
    setNoteText("");
  };
  const handleDelete = () => { crm.deleteLead.mutate(lead.id); onClose(); };

  // Extract UTMs from lead metadata
  const utmFields = [
    { key: "utm_source", label: "UTM Source", value: lead.utm_source },
    { key: "utm_medium", label: "UTM Medium", value: lead.utm_medium },
    { key: "utm_campaign", label: "UTM Campaign", value: lead.utm_campaign },
    { key: "utm_content", label: "UTM Content", value: lead.utm_content },
    { key: "utm_term", label: "UTM Term", value: lead.utm_term },
  ].filter(f => f.value);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{lead.first_name} {lead.last_name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Criado {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="details" className="text-xs">Dados</TabsTrigger>
              <TabsTrigger value="utms" className="text-xs">UTMs</TabsTrigger>
              <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Timeline</TabsTrigger>
            </TabsList>

            {/* ── DETALHES ── */}
            <TabsContent value="details" className="space-y-5">
              {editing ? (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nome</Label><Input className="mt-1 h-8 text-sm" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
                    <div><Label className="text-xs">Sobrenome</Label><Input className="mt-1 h-8 text-sm" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
                  </div>
                  <div><Label className="text-xs">Email</Label><Input className="mt-1 h-8 text-sm" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input className="mt-1 h-8 text-sm" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                  <div><Label className="text-xs">Empresa</Label><Input className="mt-1 h-8 text-sm" value={editForm.organization} onChange={e => setEditForm({ ...editForm, organization: e.target.value })} /></div>
                  <div><Label className="text-xs">Cargo</Label><Input className="mt-1 h-8 text-sm" value={editForm.job_title} onChange={e => setEditForm({ ...editForm, job_title: e.target.value })} /></div>
                  <div><Label className="text-xs">Website</Label><Input className="mt-1 h-8 text-sm" value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Setor</Label><Input className="mt-1 h-8 text-sm" value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} /></div>
                    <div><Label className="text-xs">Território</Label><Input className="mt-1 h-8 text-sm" value={editForm.territory} onChange={e => setEditForm({ ...editForm, territory: e.target.value })} /></div>
                  </div>
                  <div><Label className="text-xs">Origem</Label><Input className="mt-1 h-8 text-sm" value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} /></div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <InfoField label="Nome completo" value={`${lead.first_name || ""} ${lead.last_name || ""}`} />
                    <InfoField label="E-mail" value={lead.email} />
                    <InfoField label="Telefone" value={lead.phone || lead.mobile_no} />
                    <InfoField label="Empresa" value={lead.organization} />
                    <InfoField label="Cargo" value={lead.job_title} />
                    <InfoField label="Website" value={lead.website} />
                  </div>
                  {lead.source && <div className="border-t border-border pt-3"><InfoField label="Origem" value={lead.source} /></div>}

                  {/* Tags section */}
                  {lead.lead_tag_assignments && lead.lead_tag_assignments.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {lead.lead_tag_assignments.map((ta: any) => (
                          <Badge key={ta.id || ta.tag_id} variant="outline" className="text-[10px]">
                            <Tag className="h-2.5 w-2.5 mr-1" /> {ta.lead_tags?.name || ta.tag_id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {lead.crm2_lead_statuses && (
                    <div className="border-t border-border pt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: lead.crm2_lead_statuses.color, color: lead.crm2_lead_statuses.color }}>
                        {lead.crm2_lead_statuses.name}
                      </span>
                      {lead.converted && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Convertido</span>}
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <Label className="text-xs text-muted-foreground">Alterar Status</Label>
                    <Select value={lead.status_id || ""} onValueChange={v => crm.updateLead.mutate({ id: lead.id, status_id: v })}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        {crm.leadStatuses.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-xs mt-2 gap-1"><Edit2 className="h-3 w-3" /> Editar</Button>
                </div>
              )}

              {/* Notes */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Anotações internas</h3>
                <Textarea placeholder="Escreva detalhes sobre a negociação..." value={noteText} onChange={e => setNoteText(e.target.value)} className="text-xs min-h-[80px]" />
                <Button size="sm" onClick={handleSaveNote} disabled={!noteText.trim()} className="text-xs">Salvar nota</Button>
                {(notes.data || []).length > 0 && (
                  <div className="space-y-2 pt-2">
                    {(notes.data || []).map((n: any) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-muted/30 text-xs">
                        <p className="text-foreground">{n.content}</p>
                        <p className="text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── UTMs / Campos Personalizados ── */}
            <TabsContent value="utms" className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Parâmetros UTM</h3>
                {utmFields.length > 0 ? (
                  <div className="space-y-2">
                    {utmFields.map(f => (
                      <div key={f.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground font-mono">{f.key}</span>
                        <Badge variant="outline" className="text-xs font-mono">{f.value}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum UTM capturado para este lead.</p>
                )}
              </div>

              {/* Custom fields placeholder */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Campos personalizados</h3>
                {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(lead.custom_fields as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground">{k}</span>
                        <span className="text-xs text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum campo personalizado.</p>
                )}
              </div>
            </TabsContent>

            {/* ── BUSINESS LINKS ── */}
            <TabsContent value="business" className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Vínculos Empresariais</h3>
                {lead.organization ? (
                  <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.organization}</p>
                      {lead.industry && <p className="text-xs text-muted-foreground">{lead.industry}</p>}
                      {lead.territory && <p className="text-xs text-muted-foreground">{lead.territory}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma empresa vinculada.</p>
                )}
              </div>

              {/* Revenue info */}
              {(lead.total_value > 0 || lead.annual_revenue > 0) && (
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> Valor</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {lead.total_value > 0 && <InfoField label="Valor total" value={`R$ ${lead.total_value?.toFixed(2)}`} highlight="green" />}
                    {lead.annual_revenue > 0 && <InfoField label="Receita anual" value={`R$ ${lead.annual_revenue?.toFixed(2)}`} />}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── TIMELINE ── */}
            <TabsContent value="history" className="space-y-4">
              {(activities.data || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada.</p>
              ) : (
                <div className="relative pl-4 space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {(activities.data || []).map((a: any, i: number) => (
                    <div key={a.id} className="relative flex gap-3 pb-4">
                      {/* Dot */}
                      <div className={cn("h-3.5 w-3.5 rounded-full border-2 border-card shrink-0 mt-1 z-10",
                        a.activity_type === 'created' ? "bg-blue-500" :
                        a.activity_type === 'converted' ? "bg-emerald-500" :
                        a.activity_type === 'status_changed' ? "bg-amber-500" : "bg-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-foreground">{formatActivity(a.activity_type)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {a.data && Object.keys(a.data).length > 0 && (
                          <div className="mt-1 p-2 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
                            {Object.entries(a.data as Record<string, any>).map(([k, v]) => (
                              <span key={k} className="mr-2">{k}: <strong>{String(v)}</strong></span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead "{lead.first_name} {lead.last_name}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoField({ label, value, highlight }: { label: string; value?: string | null; highlight?: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm", highlight === "green" ? "text-emerald-500 font-medium" : "text-foreground")}>{value || "—"}</p>
    </div>
  );
}

function formatActivity(type: string) {
  const map: Record<string, string> = {
    created: "Lead criado", converted: "Convertido em Deal", status_changed: "Status alterado",
    note_added: "Nota adicionada", task_created: "Tarefa criada", updated: "Lead atualizado",
    purchase: "Compra registrada",
  };
  return map[type] || type;
}
