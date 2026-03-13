import React from "react";
import { useI18n, LOCALE_OPTIONS, type Locale } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Copy, User, Camera, Shield, Building2, CreditCard, Users, Plus, Edit2, Mail, UserPlus, Globe, X, ChevronDown, ChevronRight, ChevronLeft, Download, FolderOpen, Filter, Webhook, Gift, ExternalLink, CheckCircle, Clock, DollarSign, Key, Trash2, GripVertical, ShieldCheck, Save, Code, Check } from "lucide-react";
import MfaEnrollment from "@/components/MfaEnrollment";
import { cn } from "@/lib/utils";
import ProductTour, { TOURS } from "@/components/ProductTour";
import { useAccount } from "@/hooks/useAccount";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateProjectModal from "@/components/CreateProjectModal";
import EditProjectModal from "@/components/EditProjectModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
function SortableProjectRow({ project, onEdit, onToggle }: { project: any; onEdit: (p: any) => void; onToggle: (p: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground">
          {project.avatar_url ? <img src={project.avatar_url} alt={project.name} className="h-full w-full object-cover" /> : project.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            {project.name}
            <button onClick={() => onEdit(project)} className="text-muted-foreground hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
          </p>
          <p className="text-[10px] text-muted-foreground">{new Date(project.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
      <button onClick={() => onToggle(project)}>
        <Badge variant={project.is_active ? "default" : "secondary"} className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity">{project.is_active ? "Ativo" : "Inativo"}</Badge>
      </button>
    </div>
  );
}


const CURRENCY_OPTIONS = [
  { value: "BRL", label: "Real Brasileiro (R$)", symbol: "R$" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "ARS", label: "Peso Argentino (ARS)", symbol: "ARS" },
  { value: "MXN", label: "Peso Mexicano (MXN)", symbol: "MXN" },
  { value: "COP", label: "Peso Colombiano (COP)", symbol: "COP" },
  { value: "CLP", label: "Peso Chileno (CLP)", symbol: "CLP" },
  { value: "PEN", label: "Sol Peruano (PEN)", symbol: "PEN" },
];

function PreferencesTab({ accountId }: { accountId: string | undefined }) {
  const { locale, setLocale, t } = useI18n();
  const { toast: showToast } = useToast();
  const qc = useQueryClient();
  const [currency, setCurrency] = useState("BRL");
  const [savingPrefs, setSavingPrefs] = useState(false);

  const { data: accountPrefs } = useQuery({
    queryKey: ["account-prefs", accountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("accounts")
        .select("currency, locale")
        .eq("id", accountId)
        .maybeSingle();
      return data;
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (accountPrefs) {
      if (accountPrefs.currency) setCurrency(accountPrefs.currency);
      if (accountPrefs.locale) setLocale(accountPrefs.locale as Locale);
    }
  }, [accountPrefs]);

  const savePreferences = async () => {
    if (!accountId) return;
    setSavingPrefs(true);
    try {
      const { error } = await (supabase as any).from("accounts").update({
        currency,
        locale,
      }).eq("id", accountId);
      if (error) throw error;
      showToast({ title: t("preferences_saved") });
      qc.invalidateQueries({ queryKey: ["account-prefs", accountId] });
    } catch (err: any) {
      showToast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> {t("language_region")}
        </h2>
        <p className="text-xs text-muted-foreground mb-5">
          {t("language_region_desc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("language")}</Label>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/40 border border-border/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>{t("currency")}:</strong> {t("currency_note")}
          </p>
        </div>
      </div>

      {/* Reset onboarding */}
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" /> Tutorial de configuração
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Refaça o tutorial inicial para reconfigurar plataformas, script de rastreamento e integrações.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={async () => {
            if (!accountId) return;
            await (supabase as any).from("accounts").update({ onboarding_completed: false }).eq("id", accountId);
            qc.invalidateQueries({ queryKey: ["onboarding-check"] });
            showToast({ title: "Tutorial reiniciado! Redirecionando..." });
            setTimeout(() => window.location.href = "/onboarding", 800);
          }}
        >
          <Rocket className="h-3.5 w-3.5" /> Refazer tutorial
        </Button>
      </div>

      <Button onClick={savePreferences} disabled={savingPrefs} className="gradient-bg border-0 text-primary-foreground hover:opacity-90">
        {savingPrefs ? t("saving") : t("save_preferences")}
      </Button>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { activeAccount, activeAccountId } = useAccount();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get("tab") || "personal";
  const [activeTab, setActiveTab] = useState(tabParam || "personal");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);

  // Deactivation confirmation
  const [deactivateProject, setDeactivateProject] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Project ordering from localStorage
  const projectOrderKey = `nexus_project_order_${activeAccountId}`;
  const [projectOrder, setProjectOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(projectOrderKey) || "[]"); } catch { return []; }
  });

  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data } = await supabase.auth.getUser(); return data.user; },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => { const { data } = await (supabase as any).from("profiles").select("*").maybeSingle(); return data; },
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (profile) { setFullName(profile.full_name || ""); setAvatarUrl(profile.avatar_url || ""); }
    if (user) { setEmail(user.email || ""); }
  }, [profile, user]);

  // Fetch sensitive account details directly (only admins/owners have access via RLS)
  const { data: accountDetails } = useQuery({
    queryKey: ["account-details", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("accounts")
        .select("cnpj, phone, address, responsible_name, admin_email")
        .eq("id", activeAccountId)
        .maybeSingle();
      return data;
    },
    enabled: !!activeAccountId,
  });

  useEffect(() => {
    if (activeAccount) {
      setOrgName(activeAccount.name || "");
      setCompanyName(activeAccount.company_name || "");
    }
  }, [activeAccount]);

  useEffect(() => {
    if (accountDetails) {
      setDocNumber(accountDetails.cnpj || "");
      setPhone(accountDetails.phone || "");
      setAddress(accountDetails.address || "");
      setResponsibleName(accountDetails.responsible_name || "");
      setAdminEmail(accountDetails.admin_email || "");
    }
  }, [accountDetails]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("projects").select("*").eq("account_id", activeAccountId).order("created_at");
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  const orderedProjects = React.useMemo(() => {
    if (!projectOrder.length) return projects;
    const orderMap = new Map(projectOrder.map((id: string, idx: number) => [id, idx]));
    return [...projects].sort((a: any, b: any) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }, [projects, projectOrder]);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("subscriptions").select("*, plans:plan_id(*)").eq("account_id", activeAccountId).maybeSingle();
      return data;
    },
    enabled: !!activeAccountId,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => { const { data } = await (supabase as any).from("plans_public").select("*").order("price"); return data || []; },
  });

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["settings-is-super-admin"],
    queryFn: async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return false;
      const { data } = await (supabase as any).from("super_admins").select("id").eq("user_id", u.id).maybeSingle();
      return !!data;
    },
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ["project-members", activeAccountId],
    queryFn: async () => {
      if (!projects.length) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data } = await (supabase as any).from("project_users").select("*, profiles:user_id(full_name, avatar_url)").in("project_id", projectIds);
      return data || [];
    },
    enabled: projects.length > 0,
  });

  // Fetch emails for all project members
  const allMemberUserIds = [...new Set(projectMembers.map((m: any) => m.user_id).filter(Boolean))] as string[];
  const { data: memberEmails = [] } = useQuery({
    queryKey: ["member-emails", allMemberUserIds],
    queryFn: async () => {
      if (!allMemberUserIds.length) return [];
      const { data } = await supabase.rpc("get_user_emails_by_ids", { _user_ids: allMemberUserIds });
      return data || [];
    },
    enabled: allMemberUserIds.length > 0,
  });
  const emailMap: Record<string, string> = {};
  for (const e of memberEmails) emailMap[(e as any).user_id] = (e as any).email;

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("account_users").select("*, profiles:user_id(full_name, avatar_url)").eq("account_id", activeAccountId);
      return data || [];
    },
    enabled: !!activeAccountId,
  });

  // Pending invites for current user
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["settings-pending-invites"],
    queryFn: async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return [];
      const { data, error } = await (supabase as any)
        .from("project_users")
        .select("id, project_id, role, invited_at")
        .eq("user_id", u.id)
        .is("accepted_at", null)
        .not("invited_at", "is", null);
      if (error) return [];
      if (!data || data.length === 0) return [];
      const pIds = data.map((d: any) => d.project_id);
      const { data: pNames } = await (supabase as any).from("projects").select("id, name").in("id", pIds);
      const pMap = new Map((pNames || []).map((p: any) => [p.id, p.name]));
      return data.map((inv: any) => ({ ...inv, project_name: pMap.get(inv.project_id) || "Projeto" }));
    },
  });

  const acceptInviteFromProjects = async (invite: any) => {
    try {
      await (supabase as any).from("project_users").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
      toast({ title: "Convite aceito!", description: `Você agora faz parte de "${invite.project_name}"` });
      qc.invalidateQueries({ queryKey: ["settings-pending-invites"] });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const rejectInviteFromProjects = async (invite: any) => {
    try {
      await (supabase as any).from("project_users").delete().eq("id", invite.id);
      toast({ title: "Convite recusado" });
      qc.invalidateQueries({ queryKey: ["settings-pending-invites"] });
      qc.invalidateQueries({ queryKey: ["pending-invites"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Referral data - only commission table is shown, stats managed by Hotmart
  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", activeAccountId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("referral_codes").select("*").eq("account_id", activeAccountId).eq("is_active", true).maybeSingle();
      return data;
    },
    enabled: !!activeAccountId,
  });


  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    await (supabase as any).from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setAvatarUrl(url);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast({ title: "Foto atualizada!" });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await (supabase as any).from("profiles").update({ full_name: fullName }).eq("id", user?.id);
      if (email !== user?.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email });
        if (emailErr) throw emailErr;
        toast({ title: "Email atualizado", description: "Verifique o novo email para confirmar." });
      }
      toast({ title: "Perfil atualizado!" });
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveOrganization = async () => {
    if (!activeAccount) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("accounts").update({
        name: orgName, company_name: companyName, cnpj: docNumber,
        phone, address, responsible_name: responsibleName, admin_email: adminEmail,
      }).eq("id", activeAccount.id);
      if (error) throw error;
      toast({ title: "Organização atualizada!" });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["account-details", activeAccountId] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { toast({ title: "Senhas diferentes", variant: "destructive" }); return; }
    if (newPassword.length < 8) { toast({ title: "A senha deve ter no mínimo 8 caracteres", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleProject = async (project: any) => {
    if (project.is_active) {
      setDeactivateProject(project);
    } else {
      await (supabase as any).from("projects").update({ is_active: true }).eq("id", project.id);
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["active-projects"] });
      toast({ title: "Projeto ativado!" });
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateProject) return;
    await (supabase as any).from("projects").update({ is_active: false }).eq("id", deactivateProject.id);
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["active-projects"] });
    setDeactivateProject(null);
    toast({ title: "Projeto desativado" });
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !inviteProjectId) {
      toast({ title: "Preencha email e selecione um projeto", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { email: inviteEmail.trim(), project_id: inviteProjectId, role: inviteRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Membro adicionado!", description: data?.message });
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["project-members"] });
    } catch (err: any) {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    } finally { setInviting(false); }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remover este membro do projeto?")) return;
    await (supabase as any).from("project_users").delete().eq("id", memberId);
    qc.invalidateQueries({ queryKey: ["project-members"] });
    toast({ title: "Membro removido" });
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await (supabase as any).from("project_users").update({ role: newRole }).eq("id", memberId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["project-members"] });
      toast({ title: "Papel atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar papel", description: err.message, variant: "destructive" });
    }
  };


  const tabs = [
    { key: "personal", label: t("personal_data"), icon: User },
    { key: "preferences", label: t("preferences"), icon: Globe },
    { key: "projects", label: t("projects"), icon: FolderOpen },
    { key: "team", label: t("team"), icon: Users },
    { key: "subscription", label: t("subscription"), icon: CreditCard },
    { key: "referrals", label: t("referrals"), icon: Gift },
    { key: "apis", label: t("apis"), icon: Key },
    
    { key: "security", label: t("security"), icon: ShieldCheck },
  ];

  return (
    <DashboardLayout
      title={t("settings")}
      subtitle=""
      actions={<ProductTour {...TOURS.settings} triggerLabel="Tutorial" />}
    >
      <div className="w-full flex items-center mb-6 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`/configuracoes?tab=${tab.key}`)}
            className={cn(
              "flex-1 sm:flex-initial px-2 sm:px-4 py-3 sm:py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap",
              activeTab === tab.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            title={tab.label}
          >
            <tab.icon className="h-5 w-5 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===== PERSONAL ===== */}
      {activeTab === "personal" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4">Dados Pessoais</h2>
            <div className="flex items-start gap-6">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-muted/50 border-2 border-border/50 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
                </div>
                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4">Alterar senha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
              <div className="space-y-1.5"><Label>Confirmar</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" /></div>
            </div>
            <Button onClick={changePassword} disabled={saving || !newPassword} className="gradient-bg border-0 text-primary-foreground hover:opacity-90">Alterar senha</Button>
          </div>

          <Button onClick={saveProfile} disabled={saving} className="gradient-bg border-0 text-primary-foreground hover:opacity-90">
            {saving ? "Salvando..." : "Salvar dados pessoais"}
          </Button>
        </div>
      )}

      {/* ===== PREFERENCES ===== */}
      {activeTab === "preferences" && (
        <PreferencesTab accountId={activeAccountId} />
      )}

      {/* ===== SECURITY ===== */}
      {activeTab === "security" && (
        <div className="w-full space-y-6">
          <MfaEnrollment />
        </div>
      )}




      {/* ===== PROJECTS ===== */}
      {activeTab === "projects" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" />Projetos</h2>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCreateProjectOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Novo Projeto
              </Button>
            </div>
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum projeto criado.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                const orderedIds = orderedProjects.map((p: any) => p.id);
                const oldIdx = orderedIds.indexOf(active.id as string);
                const newIdx = orderedIds.indexOf(over.id as string);
                const newOrder = arrayMove(orderedIds, oldIdx, newIdx);
                setProjectOrder(newOrder as string[]);
                localStorage.setItem(projectOrderKey, JSON.stringify(newOrder));
              }}>
                <SortableContext items={orderedProjects.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {orderedProjects.map((p: any) => (
                      <SortableProjectRow key={p.id} project={p} onEdit={setEditProject} onToggle={toggleProject} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {pendingInvites.length > 0 && (
            <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />Convites Pendentes
                <Badge className="text-[10px] gradient-bg border-0 text-primary-foreground">{pendingInvites.length}</Badge>
              </h2>
              <div className="space-y-2">
                {pendingInvites.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <div>
                      <p className="text-sm font-medium">{inv.project_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Papel: <span className="capitalize">{inv.role}</span>
                        {inv.invited_at && <> · {new Date(inv.invited_at).toLocaleDateString("pt-BR")}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs gradient-bg border-0 text-primary-foreground hover:opacity-90" onClick={() => acceptInviteFromProjects(inv)}>Aceitar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectInviteFromProjects(inv)}>Recusar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SUBSCRIPTION ===== */}
      {activeTab === "subscription" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Plano Atual</h2>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/30 mb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-lg font-bold capitalize">
                    {isSuperAdmin ? "Ouro" : (subscription?.plans?.name || subscription?.plan_type || "Free")}
                  </p>
                  {isSuperAdmin && <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Super Admin</Badge>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{subscription?.status || "ativo"}</Badge>
                </div>
              </div>
              {isSuperAdmin ? (
                <p className="text-sm text-muted-foreground">Acesso completo</p>
              ) : (
                <p className="text-2xl font-bold">R$ {(subscription?.plans?.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
              )}
            </div>

            {/* Plan entitlements */}
            {(() => {
              const plan = subscription?.plans;
              if (!plan && !isSuperAdmin) return null;
              const entitlements = isSuperAdmin
                ? [
                    { label: "Projetos", value: "Ilimitados" },
                    { label: "Smart Links", value: "Ilimitados" },
                    { label: "Webhooks", value: "Ilimitados" },
                    { label: "Usuários", value: "Ilimitados" },
                    { label: "Leads", value: "Ilimitados" },
                    { label: "Agentes IA", value: "Ilimitados" },
                    { label: "Dispositivos", value: "Ilimitados" },
                  ]
                : [
                    { label: "Projetos", value: `${plan?.max_projects ?? 1}` },
                    { label: "Smart Links", value: `${plan?.max_smartlinks ?? 1}` },
                    { label: "Webhooks", value: plan?.max_webhooks === -1 ? "Ilimitados" : `${plan?.max_webhooks ?? 1}` },
                    { label: "Usuários", value: `${plan?.max_users ?? 1}` },
                    { label: "Leads", value: `${(plan?.max_leads ?? 100).toLocaleString("pt-BR")}` },
                    { label: "Agentes IA", value: `${plan?.max_agents ?? 0}` },
                    { label: "Dispositivos", value: `${plan?.max_devices ?? 0}` },
                    { label: "Pesquisas", value: `${plan?.max_surveys ?? 1}` },
                  ];
              return (
                <div className="rounded-lg border border-border/30 p-4 mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">Recursos incluídos no plano</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {entitlements.map((e, i) => (
                      <div key={i} className="text-center p-2.5 rounded-lg bg-muted/30">
                        <p className="text-sm font-bold text-foreground">{e.value}</p>
                        <p className="text-[10px] text-muted-foreground">{e.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Add-ons info */}
            {!isSuperAdmin && (
              <div className="rounded-lg border border-border/30 p-4 mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Acréscimos sob demanda</h3>
                <p className="text-xs text-muted-foreground mb-2">Precisa de mais recursos? Entre em contato com o suporte:</p>
                <ul className="space-y-1">
                  <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                    +1.000 leads — R$ 25,00
                  </li>
                  <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                    +1 dispositivo — R$ 50,00
                  </li>
                </ul>
              </div>
            )}

            {!isSuperAdmin && subscription?.current_period_end && <p className="text-xs text-muted-foreground">Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</p>}
          </div>

          {!isSuperAdmin && (
            <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
              <h2 className="text-sm font-semibold mb-4">Planos Disponíveis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((plan: any) => {
                  const isCurrentPlan = subscription?.plan_id === plan.id || (!subscription?.plan_id && plan.name === 'free');
                  const dynamicFeatures = [
                    `${plan.max_projects ?? 1} ${(plan.max_projects ?? 1) === 1 ? 'projeto' : 'projetos'}`,
                    `${plan.max_smartlinks ?? 1} ${(plan.max_smartlinks ?? 1) === 1 ? 'smartlink' : 'smartlinks'}`,
                    plan.max_webhooks === -1 ? 'Webhooks ilimitados' : `${plan.max_webhooks ?? 1} ${(plan.max_webhooks ?? 1) === 1 ? 'webhook' : 'webhooks'}`,
                    `${plan.max_users ?? 1} ${(plan.max_users ?? 1) === 1 ? 'usuário' : 'usuários'}`,
                    `${(plan.max_leads ?? 100).toLocaleString("pt-BR")} leads`,
                    `${plan.max_agents ?? 0} ${(plan.max_agents ?? 0) === 1 ? 'agente IA' : 'agentes IA'}`,
                    `${plan.max_devices ?? 0} ${(plan.max_devices ?? 0) === 1 ? 'dispositivo' : 'dispositivos'}`,
                    `${plan.max_surveys ?? 1} ${(plan.max_surveys ?? 1) === 1 ? 'pesquisa' : 'pesquisas'}`,
                  ];
                  const extraFeatures = (plan.features || []).filter((f: string) =>
                    !/^\d+\s+(projeto|smartlink|webhook|usuário)/i.test(f) && !/ilimitado/i.test(f)
                  );
                  const allFeatures = [...dynamicFeatures, ...extraFeatures];
                  return (
                    <div key={plan.id} className={`p-4 rounded-xl border transition-colors ${isCurrentPlan ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"}`}>
                      <h3 className="font-semibold capitalize mb-1">{plan.name}</h3>
                      <p className="text-xl font-bold mb-3">R$ {plan.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
                      <ul className="space-y-1">
                        {allFeatures.map((f: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary shrink-0" />{f}</li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <Badge className="mt-3 justify-center text-xs">Plano atual</Badge>
                      ) : plan.name === 'free' ? null : (
                        <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => {
                          if (plan.checkout_url) {
                            window.open(plan.checkout_url, '_blank');
                          } else {
                            toast({ title: "Plano indisponível", variant: "destructive" });
                          }
                        }}>Assinar</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TEAM ===== */}
      {activeTab === "team" && (
        <div className="w-full space-y-6">
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" />Convidar Membro</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>E-mail do usuário</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@email.com" /></div>
                <div className="space-y-1.5">
                  <Label>Projeto</Label>
                  <Select value={inviteProjectId} onValueChange={setInviteProjectId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                    <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Papel</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={inviteMember} disabled={inviting || !inviteEmail.trim() || !inviteProjectId} className="gradient-bg border-0 text-primary-foreground hover:opacity-90 w-full">
                    {inviting ? "Convidando..." : "Convidar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project: any) => {
              const members = projectMembers.filter((m: any) => m.project_id === project.id);
              const currentUserIsMember = members.some((m: any) => m.user_id === user?.id);
              const currentUserMember = members.find((m: any) => m.user_id === user?.id);
              const accountRole = teamMembers.find((m: any) => m.user_id === user?.id)?.role;
              const isAccountOwnerOrAdmin = accountRole === "owner" || accountRole === "admin";
              const isCurrentUserAdmin = isAccountOwnerOrAdmin || !currentUserIsMember || currentUserMember?.role === "owner" || currentUserMember?.role === "admin";
              const allMembers = currentUserIsMember ? members : [
                { id: "current-user-owner", user_id: user?.id, role: "owner", accepted_at: new Date().toISOString(), profiles: { full_name: profile?.full_name || user?.email || "Você", avatar_url: profile?.avatar_url } },
                ...members,
              ];
              return (
                <div key={project.id} className="rounded-xl bg-card border border-border/50 card-shadow p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
                    <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                      <FolderOpen className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold truncate">{project.name}</h2>
                      <p className="text-[10px] text-muted-foreground">{allMembers.length} {allMembers.length === 1 ? "membro" : "membros"}</p>
                    </div>
                  </div>
                  {allMembers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro neste projeto.</p>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {allMembers.map((m: any) => {
                        const memberEmail = m.user_id === user?.id ? user?.email : emailMap[m.user_id];
                        const canChangeRole = isCurrentUserAdmin && m.id !== "current-user-owner" && m.user_id !== user?.id;
                        return (
                          <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border/20 hover:border-border/40 transition-colors">
                            <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                              {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : m.profiles?.full_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{m.profiles?.full_name || "Usuário"}</p>
                              {memberEmail && <p className="text-[10px] text-muted-foreground truncate">{memberEmail}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {canChangeRole ? (
                                <Select value={m.role} onValueChange={(val) => updateMemberRole(m.id, val)}>
                                  <SelectTrigger className="h-6 w-auto text-[10px] capitalize border-border/50 px-1.5 gap-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer">Visualizador</SelectItem>
                                    <SelectItem value="member">Membro</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0.5">{m.role}</Badge>
                              )}
                              {m.id !== "current-user-owner" && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeMember(m.id)}><X className="h-3 w-3" /></Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ===== REFERRALS ===== */}
      {activeTab === "referrals" && (
        <div className="w-full space-y-6">
          {/* Hotmart Affiliate Link */}
           <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Gift className="h-4 w-4 text-primary" />Programa de Afiliados — Hotmart</h2>
            <p className="text-xs text-muted-foreground mb-4">Para se tornar um afiliado e obter seus links de indicação, cadastre-se no programa de afiliados da Hotmart.</p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open("https://hotmart.com/pt-br/marketplace", "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Acessar Hotmart — Programa de Afiliados
            </Button>
          </div>

          {/* Commission Table */}
          <div className="rounded-xl bg-card border border-border/50 card-shadow p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Tabela de Comissões por Plano</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Plano</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Periodicidade</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ganho na Venda</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Recorrente</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Ouro Anual - 26% desc.", price: "1.297,00", period: "Anual", initial: "350,28", recurring: "116,76" },
                    { name: "Prata Anual - 23% desc.", price: "897,00", period: "Anual", initial: "242,16", recurring: "80,72" },
                    { name: "Ouro 6 Meses - 15% desc.", price: "747,00", period: "Semestral", initial: "201,62", recurring: "67,21" },
                    { name: "Prata 6 Meses - 15% desc.", price: "497,00", period: "Semestral", initial: "134,04", recurring: "44,68" },
                    { name: "Ouro", price: "147,00", period: "Mensal", initial: "39,44", recurring: "13,15" },
                    { name: "Prata", price: "97,00", period: "Mensal", initial: "25,92", recurring: "0,00" },
                    { name: "Bronze", price: "57,00", period: "Mensal", initial: "15,11", recurring: "0,00" },
                  ].map((plan) => (
                    <tr key={plan.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{plan.name}</td>
                      <td className="py-2.5 px-3">R$ {plan.price}</td>
                      <td className="py-2.5 px-3">{plan.period}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary">R$ {plan.initial}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-success">R$ {plan.recurring}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note: Affiliate stats (Indicações, Comissões Pagas/Pendentes) are managed 
              entirely through Hotmart's platform. We only show the commission table here. */}
        </div>
      )}

      <CreateProjectModal open={createProjectOpen} onOpenChange={setCreateProjectOpen} />
      <EditProjectModal open={!!editProject} onOpenChange={(o) => { if (!o) setEditProject(null); }} project={editProject} />

      

      {/* ===== APIs ===== */}
      {activeTab === "apis" && (
        <ApiKeysTab accountId={activeAccountId} />
      )}

      {/* Deactivation confirmation dialog */}
      <AlertDialog open={!!deactivateProject} onOpenChange={(o) => { if (!o) setDeactivateProject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar projeto "{deactivateProject?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja desativar este projeto? Os seguintes impactos ocorrerão:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Webhooks deixarão de processar eventos</li>
                <li>Dashboard não computará novos dados</li>
                <li>Smart Links deixarão de funcionar</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">Você pode reativar o projeto a qualquer momento.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function ApiKeysTab({ accountId }: { accountId: string | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["ai-api-keys", accountId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ai_api_keys")
        .select("id, provider, label, is_active, created_at")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!accountId,
  });

  const handleAdd = async () => {
    if (!label.trim() || !apiKey.trim()) return;
    const { error } = await (supabase as any).from("ai_api_keys").insert({
      account_id: accountId,
      provider,
      label: label.trim(),
      api_key_encrypted: apiKey.trim(),
    });
    if (error) {
      toast({ title: "Erro", description: "Falha ao salvar API key", variant: "destructive" });
      return;
    }
    toast({ title: "API key adicionada!" });
    qc.invalidateQueries({ queryKey: ["ai-api-keys"] });
    setShowAdd(false);
    setLabel("");
    setApiKey("");
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("ai_api_keys").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["ai-api-keys"] });
    toast({ title: "API key removida" });
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Chaves de API — Provedores de IA</h3>
            <p className="text-xs text-muted-foreground mt-1">Cadastre suas API keys para usar em Automações e AgentHub.</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Nova API Key
          </Button>
        </div>

        <div className="rounded-lg bg-info/10 border border-info/20 p-3 text-xs text-muted-foreground">
          <strong className="text-info">ℹ️ Para que servem?</strong> As API keys cadastradas aqui são utilizadas exclusivamente nas funcionalidades de <strong>Automações</strong> e <strong>AgentHub</strong>. O chatbot de suporte do Nexus é gerenciado internamente pela plataforma.
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-muted-foreground">
          <strong className="text-amber-400">🔒 Segurança:</strong> As chaves são armazenadas no banco e nunca expostas no frontend.
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Carregando...</div>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma API key cadastrada</div>
        ) : (
          <div className="space-y-2">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{k.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{k.provider} • {new Date(k.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(k.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="rounded-xl bg-card border border-border/50 card-shadow p-6 space-y-4">
          <h4 className="text-sm font-semibold">Adicionar API Key</h4>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Provedor</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-50 bg-popover border border-border shadow-lg">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nome / Identificador</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: OpenAI Produção" />
            </div>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

