import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity, Eye, EyeOff, AlertTriangle, Sparkles, Shield, Loader2 } from "lucide-react";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/TurnstileWidget";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

type Mode = "login" | "register" | "forgot" | "limit-reached" | "mfa-verify";

const AUTH_ERROR_MAP: Record<string, string> = {
  "captcha verification process failed": "Falha na verificação de segurança. Tente novamente.",
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Seu email ainda não foi confirmado. Verifique sua caixa de entrada.",
  "User already registered": "Este email já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this once every 60 seconds": "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  "New password should be different from the old password.": "A nova senha deve ser diferente da anterior.",
};

function translateAuthError(msg: string): string {
  if (!msg) return "Ocorreu um erro inesperado.";
  const lower = msg.toLowerCase();
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) return value;
  }
  return msg;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { toast } = useToast();

  // MFA state
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const hasTurnstile = !!TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("referral_code", ref);
  }, [searchParams]);

  

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "A senha deve ter no mínimo 8 caracteres";
    if (!/[a-zA-Z]/.test(pw)) return "A senha deve conter pelo menos 1 letra";
    if (!/[0-9]/.test(pw)) return "A senha deve conter pelo menos 1 número";
    if (pw.toLowerCase() === email.toLowerCase()) return "A senha não pode ser igual ao email";
    return null;
  };

  const handleMfaChallenge = async () => {
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const totpFactors = factorsData?.totp?.filter((f: any) => f.status === "verified") || [];
      if (totpFactors.length === 0) return; // No MFA enrolled, login complete

      const factor = totpFactors[0];
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError) throw challengeError;

      setMfaFactorId(factor.id);
      setMfaChallengeId(challenge.id);
      setMode("mfa-verify");
    } catch (err: any) {
      toast({ title: "Erro MFA", description: err.message, variant: "destructive" });
    }
  };

  const verifyMfa = async () => {
    if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) return;
    setMfaVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      if (error) throw error;
      // MFA verified, session is now fully authenticated - redirect happens via onAuthStateChange
    } catch (err: any) {
      toast({ title: "Código inválido", description: "Verifique o código no seu app autenticador.", variant: "destructive" });
      setMfaCode("");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {

        if (password !== confirmPassword) {
          toast({ title: "Senhas não conferem", description: "A senha e a confirmação devem ser iguais.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const pwError = validatePassword(password);
        if (pwError) {
          toast({ title: "Senha fraca", description: pwError, variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
        });
        if (error) throw error;

        // Check for MFA
        await handleMfaChallenge();
      } else if (mode === "register") {
        const { data: limitData, error: limitError } = await supabase.functions.invoke("check-user-limit");
        if (limitError) throw limitError;
        if (!limitData?.canRegister) {
          setMode("limit-reached");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
            captchaToken: turnstileToken || undefined,
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
        setMode("login");
      }
    } catch (err: any) {
      const translatedMsg = translateAuthError(err.message);
      toast({ title: "Erro", description: translatedMsg, variant: "destructive" });
      
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark-gradient flex">
      {/* Left side - Login form */}
      <div className="w-full lg:w-[480px] flex flex-col items-center justify-center p-8 lg:p-12">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">
            Nexus <span className="gradient-text">Metrics</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          {mode === "mfa-verify" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Verificação 2FA</h1>
                <p className="text-sm text-muted-foreground">
                  Digite o código de 6 dígitos do seu app autenticador
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-center text-2xl tracking-[0.5em] h-14"
                  autoFocus
                />
                <Button
                  onClick={verifyMfa}
                  disabled={mfaVerifying || mfaCode.length !== 6}
                  className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90"
                >
                  {mfaVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verificar
                </Button>
                <button
                  onClick={() => {
                    setMode("login");
                    setMfaCode("");
                    setMfaFactorId(null);
                    setMfaChallengeId(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  ← Voltar ao login
                </button>
              </div>
            </div>
          ) : mode === "limit-reached" ? (
            <div className="text-center space-y-6">
              <div className="h-20 w-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Vagas esgotadas!</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Devido à alta demanda, as vagas para usuários do plano gratuito estão temporariamente encerradas.
                </p>
              </div>
              <div className="rounded-xl bg-card border border-border/50 p-5 space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Assine um plano e garanta seu acesso!</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Com um plano pago você tem acesso imediato, mais smartlinks, webhooks, projetos e suporte prioritário.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Bronze", price: "R$ 57,00" },
                    { name: "Prata", price: "R$ 97,00" },
                    { name: "Ouro", price: "R$ 147,00" },
                  ].map((plan) => (
                    <div key={plan.name} className="p-3 rounded-lg bg-secondary/50 border border-border/30 text-center">
                      <p className="text-xs font-semibold">{plan.name}</p>
                      <p className="text-[10px] text-muted-foreground">{plan.price}/mês</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar ao login
              </button>
            </div>
          ) : (
          <>
          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Recuperar senha"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "login"
              ? "Acesse sua conta Nexus Metrics"
              : mode === "register"
              ? "Comece a rastrear seus resultados"
              : "Enviaremos um link de redefinição"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA: Turnstile only */}
                {hasTurnstile && (
                  <TurnstileWidget
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onVerify={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => {}}
                  />
                )}
              </>
            )}

            {/* Turnstile on login only */}
            {mode === "login" && hasTurnstile && (
              <TurnstileWidget
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => {}}
              />
            )}

           <Button
              type="submit"
              className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90"
              disabled={loading || (hasTurnstile && mode !== "forgot" && !turnstileToken)}
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin },
                  });
                  if (error) {
                    toast({ title: "Erro", description: error.message, variant: "destructive" });
                    setLoading(false);
                  }
                }}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
              </Button>
            </>
          )}

          <div className="mt-6 text-sm space-y-2">
            {mode === "login" && (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-muted-foreground hover:text-foreground transition-colors block w-full text-left"
                >
                  Esqueceu a senha?
                </button>
                <span className="text-muted-foreground">
                  Não tem conta?{" "}
                  <button onClick={() => setMode("register")} className="text-primary hover:underline">
                    Criar conta
                  </button>
                </span>
              </>
            )}
            {(mode === "register" || mode === "forgot") && (
              <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground transition-colors">
                ← Voltar ao login
              </button>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden lg:block flex-1 relative border-l border-border/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[hsl(var(--destructive))]/5" />
        <div className="absolute inset-0 flex items-center justify-center">
        </div>
      </div>
    </div>
  );
}
