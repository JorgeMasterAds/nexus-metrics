import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">EXCLUSÃO DE DADOS</h1>
        <p className="text-xl font-semibold text-primary mb-1">NEXUS METRICS</p>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 02 de março de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. SOBRE A EXCLUSÃO DE DADOS">
            <p>
              O Nexus Metrics permite que usuários solicitem a exclusão completa dos dados associados à sua conta Meta conectada à plataforma.
            </p>
            <p>
              Ao solicitar a exclusão, os seguintes dados serão removidos permanentemente do nosso banco de dados:
            </p>
            <ul>
              <li>Token de acesso (access token) armazenado</li>
              <li>Identificador da conta Meta (meta_user_id)</li>
              <li>Registros de contas de anúncios vinculadas (ad_accounts)</li>
              <li>Registros de integração com o provedor Meta Ads</li>
            </ul>
          </Section>

          <Section title="2. COMO SOLICITAR A EXCLUSÃO">
            <p>Existem duas formas de solicitar a exclusão dos seus dados:</p>

            <p><strong>2.1 Pela plataforma Nexus Metrics</strong></p>
            <p>
              Acesse <strong>Integrações → Meta Ads</strong> e clique no botão <strong>"Desconectar"</strong>.
              Isso revogará o token de acesso e removerá todos os dados vinculados à sua conta Meta da nossa plataforma.
            </p>

            <p><strong>2.2 Pelas configurações da Meta</strong></p>
            <p>
              Você pode revogar o acesso do Nexus Metrics diretamente nas configurações da sua conta Meta:
            </p>
            <ul>
              <li>Acesse <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary underline">Configurações do Facebook → Integrações Comerciais</a></li>
              <li>Localize o Nexus Metrics na lista</li>
              <li>Clique em "Remover" e marque a opção para solicitar exclusão de dados</li>
            </ul>
            <p>
              Ao remover via Meta, nosso sistema receberá automaticamente uma notificação e procederá com a exclusão dos dados.
            </p>

            <p><strong>2.3 Por e-mail</strong></p>
            <p>
              Você também pode solicitar a exclusão enviando um e-mail para:
            </p>
            <p className="text-foreground font-medium">suporte@nexusmetrics.jmads.com.br</p>
            <p>Inclua no e-mail o endereço de e-mail associado à sua conta no Nexus Metrics.</p>
          </Section>

          <Section title="3. PRAZO PARA EXCLUSÃO">
            <p>
              A exclusão dos dados é processada imediatamente após a solicitação. Em casos excepcionais, o prazo máximo é de 48 horas úteis.
            </p>
          </Section>

          <Section title="4. DADOS RETIDOS">
            <p>
              Dados agregados e anonimizados (como métricas históricas de investimento em anúncios) podem ser retidos para fins estatísticos, conforme permitido pela legislação aplicável. Esses dados não permitem a identificação do usuário.
            </p>
          </Section>

          <Section title="5. CONTATO">
            <p>
              Para dúvidas sobre a exclusão de dados ou privacidade, entre em contato:
            </p>
            <p className="text-foreground font-medium">suporte@nexusmetrics.jmads.com.br</p>
          </Section>
        </div>

        <div className="border-t border-border/30 mt-12 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexus Metrics. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
