import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CRM2Settings({ crm }: { crm: any }) {
  const [leadForm, setLeadForm] = useState({ name: "", type: "Open", color: "#3b82f6" });
  const [dealForm, setDealForm] = useState({ name: "", type: "Open", color: "#3b82f6", probability: "50" });

  return (
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
  );
}
