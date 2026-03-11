import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Clock, Image, Mic, FileText, BarChart2, Save, Bold, Italic, Strikethrough, Smile } from "lucide-react";
import { mockMessages, mockCampaigns, mockAccounts } from "@/data/grupozap-mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusMap = { sent: { label: "Enviada", cls: "bg-emerald-500/20 text-emerald-400" }, scheduled: { label: "Agendada", cls: "bg-blue-500/20 text-blue-400" }, draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" } };

export default function GZMessages() {
  const [schedule, setSchedule] = useState(false);
  const [msgContent, setMsgContent] = useState("");

  const spintaxPreview = (text: string) => {
    return text.replace(/\{([^}]+)\}/g, (_, group) => {
      const options = group.split("|");
      return options[0] || group;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mensagens</h1>
          <p className="text-sm text-muted-foreground">Envie e agende mensagens para seus grupos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Mensagem</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Nova Mensagem</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Campanha</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{mockCampaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Conta</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{mockAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div>
                <Label>Mensagem</Label>
                <div className="flex gap-1 mb-1.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Strikethrough className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-3.5 w-3.5" /></Button>
                </div>
                <Textarea placeholder="Digite sua mensagem... Use {Oi|Olá|Oba} para Spintax" rows={4} value={msgContent} onChange={(e) => setMsgContent(e.target.value)} />
                {msgContent.includes("{") && (
                  <div className="mt-2 p-2 rounded-lg bg-muted/20 text-xs">
                    <p className="text-muted-foreground mb-1">Preview:</p>
                    <p>{spintaxPreview(msgContent)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Image className="h-3 w-3" /> Imagem</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Mic className="h-3 w-3" /> Áudio</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><FileText className="h-3 w-3" /> Documento</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><BarChart2 className="h-3 w-3" /> Enquete</Button>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={schedule} onCheckedChange={setSchedule} />
                <Label>Agendar envio</Label>
              </div>
              {schedule && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data</Label><Input type="date" /></div>
                  <div><Label>Hora</Label><Input type="time" /></div>
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1 gap-1.5" onClick={() => toast.success(schedule ? "Mensagem agendada!" : "Mensagem enviada!")}>
                  {schedule ? <Clock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {schedule ? "Agendar" : "Enviar Agora"}
                </Button>
                <Button variant="outline" className="gap-1.5"><Save className="h-4 w-4" /> Salvar Modelo</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages list */}
      <div className="space-y-3">
        {mockMessages.map((m) => {
          const st = statusMap[m.status];
          const campaign = mockCampaigns.find((c) => c.id === m.campaignId);
          return (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", m.status === "sent" ? "bg-emerald-500/20" : "bg-blue-500/20")}>
                  {m.status === "sent" ? <Send className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-[10px]", st.cls)}>{st.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{campaign?.name}</span>
                  </div>
                  <p className="text-sm">{m.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {m.sentAt ? `Enviada em ${new Date(m.sentAt).toLocaleString("pt-BR")}` : m.scheduledAt ? `Agendada para ${new Date(m.scheduledAt).toLocaleString("pt-BR")}` : "Rascunho"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
