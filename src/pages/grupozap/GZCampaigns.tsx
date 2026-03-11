import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, MousePointerClick, Users, UserMinus, Eye } from "lucide-react";
import { mockCampaigns, type GZCampaign } from "@/data/grupozap-mock";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const statusMap = { active: { label: "Ativa", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }, paused: { label: "Pausada", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }, ended: { label: "Encerrada", cls: "bg-muted text-muted-foreground" } };

export default function GZCampaigns() {
  const [campaigns] = useState<GZCampaign[]>(mockCampaigns);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus lançamentos e perpétuos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome da Campanha" />
              <Select><SelectTrigger><SelectValue placeholder="Modo" /></SelectTrigger><SelectContent><SelectItem value="launch">Lançamento</SelectItem><SelectItem value="list">Lista</SelectItem></SelectContent></Select>
              <Button className="w-full" onClick={() => toast.success("Campanha criada!")}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => {
          const st = statusMap[c.status];
          return (
            <Card key={c.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/grupozap/campaigns/${c.id}`)}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge className={cn("text-[10px]", st.cls)}>{st.label}</Badge>
                      <Badge variant="outline" className="text-[10px]">{c.mode === "launch" ? "Lançamento" : "Lista"}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0"><Eye className="h-4 w-4" /></Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                    <p className="text-lg font-bold">{c.clicks.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Cliques</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Users className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
                    <p className="text-lg font-bold">{c.participants.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Participantes</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <UserMinus className="h-4 w-4 mx-auto mb-1 text-red-400" />
                    <p className="text-lg font-bold">{c.exits.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Saídas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground truncate flex-1">{c.link}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(c.link); toast.success("Link copiado!"); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
