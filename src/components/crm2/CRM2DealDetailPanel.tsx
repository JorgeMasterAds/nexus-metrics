import { useState } from "react";
import { X, User, Clock, MessageSquare, Trash2, Plus, Edit2, CheckSquare, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCRM2Notes, useCRM2Activities } from "@/hooks/useCRM2";

interface Props {
  deal: any;
  crm: any;
  onClose: () => void;
}

export default function CRM2DealDetailPanel({ deal, crm, onClose }: Props) {
  const notes = useCRM2Notes("deal", deal.id);
  const activities = useCRM2Activities("deal", deal.id);
  const [noteText, setNoteText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: deal.title || "",
    deal_value: deal.deal_value || "",
    source: deal.source || "",
    next_step: deal.next_step || "",
    expected_closure_date: deal.expected_closure_date || "",
  });
  const [showDelete, setShowDelete] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSaveEdit = () => {
    crm.updateDeal.mutate({ id: deal.id, ...editForm, deal_value: editForm.deal_value ? parseFloat(String(editForm.deal_value)) : null });
    setEditing(false);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    crm.addNote.mutate({ content: noteText.trim(), reference_type: "deal", reference_id: deal.id });
    setNoteText("");
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    crm.createTask.mutate({ title: taskTitle, reference_type: "deal", reference_id: deal.id });
    setTaskTitle("");
  };

  const dealTasks = crm.tasks.filter((t: any) => t.reference_type === "deal" && t.reference_id === deal.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{deal.title || "Deal sem título"}</h2>
              <p className="text-xs text-muted-foreground">{deal.deal_value ? fmt(deal.deal_value) : "Sem valor"}</p>
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
              <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">Notas</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {editing ? (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div><Label className="text-xs">Título</Label><Input className="mt-1 h-8 text-sm" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
                  <div><Label className="text-xs">Valor (R$)</Label><Input className="mt-1 h-8 text-sm" type="number" value={editForm.deal_value} onChange={(e) => setEditForm({ ...editForm, deal_value: e.target.value })} /></div>
                  <div><Label className="text-xs">Origem</Label><Input className="mt-1 h-8 text-sm" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} /></div>
                  <div><Label className="text-xs">Próximo Passo</Label><Input className="mt-1 h-8 text-sm" value={editForm.next_step} onChange={(e) => setEditForm({ ...editForm, next_step: e.target.value })} /></div>
                  <div><Label className="text-xs">Previsão de Fechamento</Label><Input className="mt-1 h-8 text-sm" type="date" value={editForm.expected_closure_date} onChange={(e) => setEditForm({ ...editForm, expected_closure_date: e.target.value })} /></div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div><p className="text-[11px] text-muted-foreground">Título</p><p className="text-sm">{deal.title || "—"}</p></div>
                    <div><p className="text-[11px] text-muted-foreground">Valor</p><p className="text-sm font-semibold text-emerald-500">{deal.deal_value ? fmt(deal.deal_value) : "—"}</p></div>
                    <div><p className="text-[11px] text-muted-foreground">Empresa</p><p className="text-sm">{deal.crm2_organizations?.name || "—"}</p></div>
                    <div><p className="text-[11px] text-muted-foreground">Origem</p><p className="text-sm">{deal.source || "—"}</p></div>
                    <div><p className="text-[11px] text-muted-foreground">Próximo Passo</p><p className="text-sm">{deal.next_step || "—"}</p></div>
                    <div><p className="text-[11px] text-muted-foreground">Previsão</p><p className="text-sm">{deal.expected_closure_date ? new Date(deal.expected_closure_date).toLocaleDateString("pt-BR") : "—"}</p></div>
                  </div>
                  {deal.crm2_deal_statuses && (
                    <div className="border-t border-border pt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: deal.crm2_deal_statuses.color, color: deal.crm2_deal_statuses.color }}>{deal.crm2_deal_statuses.name}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3">
                    <Label className="text-xs text-muted-foreground">Alterar Status</Label>
                    <Select value={deal.status_id || ""} onValueChange={(v) => crm.updateDeal.mutate({ id: deal.id, status_id: v })}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {crm.dealStatuses.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name} ({s.probability}%)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-xs mt-2 gap-1"><Edit2 className="h-3 w-3" /> Editar</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <Textarea placeholder="Escreva uma nota..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="text-xs min-h-[80px]" />
                <Button size="sm" onClick={handleSaveNote} disabled={!noteText.trim()} className="text-xs">Salvar nota</Button>
                {(notes.data || []).map((n: any) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-muted/30 text-xs">
                    <p>{n.content}</p>
                    <p className="text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Nova tarefa..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="text-xs h-8 flex-1" />
                  <Button size="sm" className="h-8" onClick={handleCreateTask} disabled={!taskTitle.trim()}><Plus className="h-3 w-3" /></Button>
                </div>
                {dealTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                    <button onClick={() => crm.updateTask.mutate({ id: t.id, status: t.status === "done" ? "todo" : "done" })}
                      className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${t.status === "done" ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"}`}>
                      {t.status === "done" && <span className="text-[8px]">✓</span>}
                    </button>
                    <span className={t.status === "done" ? "line-through text-muted-foreground flex-1" : "flex-1"}>{t.title}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              {(activities.data || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade.</p>
              ) : (
                <div className="space-y-2">
                  {(activities.data || []).map((a: any) => (
                    <div key={a.id} className="flex items-start gap-2 p-3 rounded-xl border border-border">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{a.activity_type}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                        </div>
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
            <AlertDialogTitle>Excluir deal?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
