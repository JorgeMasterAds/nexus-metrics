import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function DataDeletionStatus() {
  const [searchParams] = useSearchParams();
  const confirmationCode = searchParams.get("id");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Status da Exclusão de Dados</h1>

        <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4">
          {confirmationCode ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Exclusão processada</p>
                  <p className="text-xs text-muted-foreground">Seus dados vinculados à Meta foram removidos com sucesso.</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Código de confirmação:</p>
                <p className="text-sm font-mono text-foreground">{confirmationCode}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens de acesso, identificadores Meta e contas de anúncios vinculadas foram permanentemente removidos do nosso sistema.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum código de confirmação fornecido. Se você solicitou exclusão de dados, verifique o link recebido.
            </p>
          )}
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>Dúvidas? Entre em contato: <span className="text-foreground">suporte@nexusmetrics.jmads.com.br</span></p>
        </div>
      </div>
    </div>
  );
}
