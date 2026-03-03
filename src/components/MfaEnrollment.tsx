import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Copy, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function MfaEnrollment() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const { data: factors = [], isLoading } = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data?.totp || [];
    },
  });

  const activeFactor = factors.find((f: any) => f.status === "verified");

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Nexus Metrics Authenticator",
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyErr) throw verifyErr;

      toast({ title: "2FA ativado!", description: "Autenticação de dois fatores configurada com sucesso." });
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      qc.invalidateQueries({ queryKey: ["mfa-factors"] });
    } catch (err: any) {
      toast({ title: "Código inválido", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const unenrollFactor = async () => {
    if (!activeFactor) return;
    if (!confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) return;
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
      if (error) throw error;
      toast({ title: "2FA desativado" });
      qc.invalidateQueries({ queryKey: ["mfa-factors"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUnenrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
      <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Autenticação de Dois Fatores (2FA)
      </h2>

      {activeFactor ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <ShieldCheck className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium">2FA está ativo</p>
              <p className="text-xs text-muted-foreground">
                Sua conta está protegida com autenticação de dois fatores via app autenticador.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={unenrollFactor}
            disabled={unenrolling}
          >
            {unenrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
            Desativar 2FA
          </Button>
        </div>
      ) : qrCode ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code abaixo com seu app autenticador (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="p-3 bg-white rounded-xl">
              <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Chave manual</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted/50 p-2 rounded font-mono break-all flex-1">
                    {secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(secret || "");
                      toast({ title: "Copiado!" });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mfa-code">Código de verificação</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={verifyEnrollment}
                  disabled={verifying || verifyCode.length !== 6}
                  className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Ativar 2FA
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setQrCode(null); setSecret(null); setFactorId(null); setVerifyCode(""); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">2FA não está ativo</p>
              <p className="text-xs text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta usando um app autenticador.
              </p>
            </div>
          </div>
          <Button
            onClick={startEnroll}
            disabled={enrolling}
            className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
          >
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
            Configurar 2FA
          </Button>
        </div>
      )}
    </div>
  );
}
