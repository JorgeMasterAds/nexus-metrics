import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Flame, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const FIELD_OPTIONS = [
  { value: "has_email", label: "Tem email" },
  { value: "has_phone", label: "Tem telefone" },
  { value: "has_organization", label: "Tem empresa" },
  { value: "has_website", label: "Tem website" },
  { value: "has_job_title", label: "Tem cargo" },
  { value: "has_annual_revenue", label: "Tem receita anual" },
  { value: "source", label: "Origem igual a" },
  { value: "status_type", label: "Tipo de status igual a" },
];

export default function CRM2Settings({ crm }: { crm: any }) {
  const [leadForm, setLeadForm] = useState({ name: "", type: "Open", color: "#3b82f6" });
  const [dealForm, setDealForm] = useState({ name: "", type: "Open", color: "#3b82f6", probability: "50" });
  const [ruleForm, setRuleForm] = useState({ field: "has_email", condition: "exists", value: "", points: "10" });

  const needsValue = ruleForm.field === "source" || ruleForm.field === "status_type";

  return (
    <div className="space-y-6">
      {/* Lead Scoring Rules */}
      <Card className="border-border/30 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" /> Lead Scoring
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Configure regras automáticas para pontuar seus leads
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => crm.recalculateScores.mutate()}
              disabled={crm.recalculateScores.isPending}
            >
              <RefreshCw className={`h-3 w-3 ${crm.recalculateScores.isPending ? "animate-spin" : ""}`} />
              Recalcular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(crm.scoringRules || []).map((r: any) => {
            const fieldLabel = FIELD_OPTIONS.find((f) => f.value === r.field)?.label || r.field;
            return (
              <div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-border/10">
                <Switch
                  checked={r.is_active}
                  onCheckedChange={(checked) => crm.updateScoringRule.mutate({ id: r.id, is_active: checked })}
                  className="scale-75"
                />
                <span className="text-sm flex-1">
                  {fieldLabel}
                  {r.value && <span className="text-muted-foreground ml-1">"{r.value}"</span>}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.points > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {r.points > 0 ? "+" : ""}{r.points} pts
                </span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => crm.deleteScoringRule.mutate(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
          <div className="flex items-end gap-2 pt-2 flex-wrap">
            <div className="min-w-[140px]">
              <Label className="text-xs">Campo</Label>
              <Select value={ruleForm.field} onValueChange={(v) => setRuleForm({ ...ruleForm, field: v, condition: v === "source" || v === "status_type" ? "equals" : "exists" })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsValue && (
              <div className="min-w-[100px]">
                <Label className="text-xs">Valor</Label>
                <Input value={ruleForm.value} onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })} className="h-8 text-xs" placeholder="ex: google" />
              </div>
            )}
            <div className="w-20">
              <Label className="text-xs">Pontos</Label>
              <Input type="number" value={ruleForm.points} onChange={(e) => setRuleForm({ ...ruleForm, points: e.target.value })} className="h-8 text-xs" />
            </div>
            <Button size="sm" className="h-8" onClick={() => {
              const pts = parseInt(ruleForm.points) || 0;
              if (!ruleForm.field || pts === 0) return;
              crm.createScoringRule.mutate({
                field: ruleForm.field,
                condition: needsValue ? "equals" : "exists",
                value: needsValue ? ruleForm.value : null,
                points: pts,
              });
              setRuleForm({ field: "has_email", condition: "exists", value: "", points: "10" });
            }}><Plus className="h-3 w-3" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/30 bg-card/80">
          <CardHeader><CardTitle className="text-sm">Status de Lead</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {crm.leadStatuses.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-border/10">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm flex-1">{s.name}</span>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{s.type}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => crm.deleteLeadStatus.mutate(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex items-end gap-2 pt-2">
              <div className="flex-1"><Label className="text-xs">Nome</Label><Input value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className="h-8 text-xs" /></div>
              <Select value={leadForm.type} onValueChange={(v) => setLeadForm({ ...leadForm, type: v })}>
                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Junk">Junk</SelectItem>
                </SelectContent>
              </Select>
              <Input type="color" value={leadForm.color} onChange={(e) => setLeadForm({ ...leadForm, color: e.target.value })} className="w-10 h-8 p-0.5" />
              <Button size="sm" className="h-8" onClick={() => {
                if (!leadForm.name) return;
                crm.createLeadStatus.mutate(leadForm);
                setLeadForm({ name: "", type: "Open", color: "#3b82f6" });
              }}><Plus className="h-3 w-3" /></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-card/80">
          <CardHeader><CardTitle className="text-sm">Status de Deal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {crm.dealStatuses.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-border/10">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm flex-1">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.probability}%</span>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{s.type}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => crm.deleteDealStatus.mutate(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex items-end gap-2 pt-2 flex-wrap">
              <div className="flex-1 min-w-[100px]"><Label className="text-xs">Nome</Label><Input value={dealForm.name} onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })} className="h-8 text-xs" /></div>
              <Select value={dealForm.type} onValueChange={(v) => setDealForm({ ...dealForm, type: v })}>
                <SelectTrigger className="w-[90px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-16"><Label className="text-xs">%</Label><Input type="number" value={dealForm.probability} onChange={(e) => setDealForm({ ...dealForm, probability: e.target.value })} className="h-8 text-xs" /></div>
              <Input type="color" value={dealForm.color} onChange={(e) => setDealForm({ ...dealForm, color: e.target.value })} className="w-10 h-8 p-0.5" />
              <Button size="sm" className="h-8" onClick={() => {
                if (!dealForm.name) return;
                crm.createDealStatus.mutate({ ...dealForm, probability: parseInt(dealForm.probability) || 0 });
                setDealForm({ name: "", type: "Open", color: "#3b82f6", probability: "50" });
              }}><Plus className="h-3 w-3" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
