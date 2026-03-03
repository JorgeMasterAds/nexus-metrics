import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">POLÍTICA DE PRIVACIDADE</h1>
        <p className="text-xl font-semibold text-primary mb-1">NEXUS METRICS</p>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 03 de março de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. INTRODUÇÃO">
            <p>A presente Política de Privacidade descreve como o Nexus Metrics coleta, utiliza, armazena, compartilha e protege dados pessoais no contexto da utilização da plataforma.</p>
            <p>A política aplica-se a:</p>
            <ul>
              <li>Usuários cadastrados</li>
              <li>Usuários do plano gratuito</li>
              <li>Assinantes de planos pagos</li>
              <li>Visitantes do site</li>
            </ul>
            <p>Ao utilizar a plataforma, o Usuário declara ciência e concordância com esta Política.</p>
          </Section>

          <Section title="2. PAPEL NO TRATAMENTO DE DADOS">
            <p>Nos termos da Lei nº 13.709/2018:</p>
            <p>O Nexus Metrics atua predominantemente como Operador, tratando dados pessoais em nome do Usuário.</p>
            <p>O Usuário é o Controlador, responsável por:</p>
            <ul>
              <li>Definir finalidade do tratamento</li>
              <li>Garantir base legal</li>
              <li>Obter consentimento quando necessário</li>
              <li>Atender solicitações de titulares</li>
            </ul>
            <p>Em relação aos dados do próprio cadastro do Usuário, o Nexus Metrics atua como Controlador.</p>
          </Section>

          <Section title="3. DADOS COLETADOS">
            <p><strong>3.1 Dados fornecidos pelo Usuário</strong></p>
            <ul>
              <li>Nome</li>
              <li>E-mail</li>
              <li>Senha criptografada</li>
              <li>Informações de perfil</li>
              <li>Dados de contato</li>
            </ul>
            <p><strong>3.2 Dados provenientes de integrações</strong></p>
            <p>Conforme autorização do Usuário, a plataforma poderá tratar:</p>
            <ul>
              <li>Nome de comprador</li>
              <li>E-mail de comprador</li>
              <li>Telefone de comprador</li>
              <li>Dados de campanhas publicitárias</li>
              <li>Métricas financeiras</li>
              <li>UTMs e parâmetros de rastreamento</li>
              <li>Identificadores de conta</li>
              <li>Dados de leads gerenciados no CRM</li>
              <li>Respostas a pesquisas e questionários</li>
            </ul>
            <p>Esses dados são inseridos ou integrados sob responsabilidade do Usuário.</p>

            <p><strong>3.3 Dados coletados via API da Meta (Facebook/Instagram)</strong></p>
            <p>
              O Nexus Metrics utiliza a API de Marketing da Meta para leitura de dados de campanhas publicitárias e investimentos em anúncios.
              Os dados são coletados exclusivamente mediante autorização explícita do Usuário via fluxo OAuth 2.0.
            </p>
            <p>Os dados acessados incluem:</p>
            <ul>
              <li>Nome e identificador das contas de anúncios</li>
              <li>Métricas de campanhas (impressões, cliques, investimento)</li>
              <li>Nome e identificador de campanhas, conjuntos de anúncios e anúncios</li>
              <li>Identificador do usuário Meta</li>
            </ul>
            <p>
              <strong>Esses dados são utilizados exclusivamente para exibição de relatórios e métricas dentro da plataforma Nexus Metrics e não são compartilhados com terceiros.</strong>
            </p>
            <p>
              O Usuário pode revogar o acesso a qualquer momento através das{" "}
              <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Configurações de Integrações Comerciais da Meta
              </a>{" "}
              ou pela seção <strong>Integrações → Meta Ads</strong> dentro do Nexus Metrics.
            </p>
            <p>
              Para solicitar a exclusão dos dados vinculados à Meta, consulte nossa{" "}
              <a href="/data-deletion" className="text-primary underline">página de exclusão de dados</a>.
            </p>
          </Section>

          <Section title="4. DADOS COLETADOS AUTOMATICAMENTE">
            <p>Durante a navegação poderão ser coletados:</p>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador</li>
              <li>Sistema operacional</li>
              <li>Páginas acessadas</li>
              <li>Tempo de navegação</li>
              <li>Dados de interação</li>
            </ul>
            <p>A coleta ocorre para fins de:</p>
            <ul>
              <li>Segurança</li>
              <li>Prevenção a fraudes</li>
              <li>Melhoria da experiência</li>
              <li>Análise estatística</li>
            </ul>
          </Section>

          <Section title="5. COOKIES E TECNOLOGIAS DE RASTREAMENTO">
            <p>O Nexus Metrics utiliza:</p>
            <ul>
              <li>Meta Pixel</li>
              <li>Google Analytics</li>
            </ul>
            <p>Essas ferramentas podem coletar:</p>
            <ul>
              <li>Dados de navegação</li>
              <li>Interações com páginas</li>
              <li>Eventos de conversão</li>
            </ul>
            <p>O Usuário pode gerenciar cookies diretamente nas configurações do navegador.</p>
          </Section>

          <Section title="6. FINALIDADES DO TRATAMENTO">
            <p>Os dados pessoais tratados pelo Nexus Metrics possuem finalidades específicas e legítimas, incluindo:</p>
            <p><strong>6.1 Execução do contrato</strong></p>
            <ul>
              <li>Criar e manter contas de Usuário</li>
              <li>Permitir acesso à plataforma</li>
              <li>Processar integrações autorizadas</li>
              <li>Exibir métricas e relatórios</li>
            </ul>
            <p><strong>6.2 Cumprimento de obrigações legais</strong></p>
            <ul>
              <li>Atendimento a solicitações judiciais</li>
              <li>Cumprimento de obrigações fiscais e regulatórias</li>
              <li>Cooperação com autoridades competentes</li>
            </ul>
            <p><strong>6.3 Segurança e prevenção a fraudes</strong></p>
            <ul>
              <li>Monitoramento de acessos</li>
              <li>Identificação de atividades suspeitas</li>
              <li>Proteção contra invasões</li>
            </ul>
            <p><strong>6.4 Melhoria da plataforma</strong></p>
            <ul>
              <li>Análise de uso</li>
              <li>Correção de erros</li>
              <li>Otimização de performance</li>
              <li>Desenvolvimento de novos recursos</li>
            </ul>
            <p><strong>6.5 Marketing e análise estatística</strong></p>
            <ul>
              <li>Mensuração de campanhas</li>
              <li>Avaliação de comportamento agregado</li>
              <li>Remarketing por meio do Meta Pixel e Google Analytics</li>
            </ul>
            <p>Os dados não são vendidos a terceiros.</p>
          </Section>

          <Section title="7. COMPARTILHAMENTO DE DADOS">
            <p>O Nexus Metrics poderá compartilhar dados pessoais exclusivamente nas seguintes hipóteses:</p>
            <p><strong>7.1 Prestadores de serviço essenciais</strong></p>
            <ul>
              <li>Provedores de hospedagem</li>
              <li>Serviços de autenticação</li>
              <li>Serviços de infraestrutura</li>
              <li>Ferramentas de análise</li>
            </ul>
            <p>Esses fornecedores atuam mediante contrato e obrigação de confidencialidade.</p>
            <p><strong>7.2 Plataformas integradas</strong></p>
            <p>Quando autorizado pelo Usuário, dados poderão ser transmitidos para:</p>
            <ul>
              <li>Meta Ads</li>
              <li>Hotmart</li>
            </ul>
            <p>Conforme fluxo normal da integração.</p>
            <p><strong>7.3 Obrigações legais</strong></p>
            <p>Em caso de determinação judicial ou exigência legal.</p>
          </Section>

          <Section title="8. TRANSFERÊNCIA INTERNACIONAL DE DADOS">
            <p>Os dados poderão ser armazenados em servidores localizados nos Estados Unidos por meio do provedor Supabase.</p>
            <p>A transferência internacional ocorre com:</p>
            <ul>
              <li>Criptografia de dados</li>
              <li>Medidas técnicas adequadas</li>
              <li>Observância da legislação aplicável</li>
            </ul>
            <p>Ao utilizar a plataforma, o Usuário declara ciência dessa condição.</p>
          </Section>

          <Section title="9. SEGURANÇA DA INFORMAÇÃO">
            <p>O Nexus Metrics adota medidas de segurança compatíveis com padrões de mercado, incluindo:</p>
            <ul>
              <li>Criptografia em trânsito</li>
              <li>Controle de acesso por perfil</li>
              <li>Autenticação em dois fatores</li>
              <li>Monitoramento de acessos</li>
              <li>Proteção contra acesso não autorizado</li>
            </ul>
            <p>Embora sejam adotadas medidas razoáveis, nenhum sistema é totalmente imune a riscos.</p>
          </Section>

          <Section title="10. RETENÇÃO DE DADOS">
            <p>Os dados serão mantidos:</p>
            <ul>
              <li>Enquanto durar a relação contratual</li>
              <li>Pelo prazo necessário para cumprimento de obrigações legais</li>
            </ul>
            <p>Após cancelamento da conta:</p>
            <ul>
              <li>Os dados permanecerão armazenados por até 6 meses</li>
              <li>Após esse período, serão excluídos definitivamente</li>
            </ul>
          </Section>

          <Section title="11. DIREITOS DOS TITULARES DE DADOS">
            <p>Nos termos da Lei nº 13.709/2018, o titular de dados pessoais possui os seguintes direitos:</p>
            <ul>
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação de dados tratados com consentimento</li>
              <li>Informação sobre compartilhamento</li>
              <li>Revogação de consentimento</li>
            </ul>
            <p>Quando o Nexus Metrics atuar como Operador, as solicitações deverão ser direcionadas ao Usuário Controlador responsável pelos dados.</p>
            <p>Nos casos em que o Nexus Metrics atuar como Controlador, as solicitações poderão ser encaminhadas diretamente à plataforma.</p>
          </Section>

          <Section title="12. RESPONSABILIDADE DO USUÁRIO COMO CONTROLADOR">
            <p>O Usuário, na condição de Controlador, declara que:</p>
            <ul>
              <li>Possui base legal para tratar os dados inseridos</li>
              <li>Obteve consentimento quando necessário</li>
              <li>Informou adequadamente os titulares</li>
              <li>Cumpre integralmente a legislação aplicável</li>
            </ul>
            <p>O Nexus Metrics não se responsabiliza por irregularidades decorrentes de coleta ilícita ou uso inadequado de dados pelo Usuário.</p>
          </Section>

          <Section title="13. PROCEDIMENTO PARA EXERCÍCIO DE DIREITOS">
            <p>Solicitações relacionadas a dados pessoais poderão ser enviadas por meio dos canais oficiais de atendimento da plataforma.</p>
            <p>Para proteção do titular, poderá ser solicitada confirmação de identidade antes do atendimento.</p>
            <p>As solicitações serão analisadas e respondidas dentro dos prazos legais aplicáveis.</p>
          </Section>

          <Section title="14. ATUALIZAÇÕES DA POLÍTICA">
            <p>Esta Política poderá ser atualizada a qualquer momento para refletir:</p>
            <ul>
              <li>Alterações legais</li>
              <li>Atualizações técnicas</li>
              <li>Modificações na plataforma</li>
            </ul>
            <p>A versão vigente estará sempre disponível na plataforma.</p>
            <p>O uso contínuo após atualização implica ciência da nova versão.</p>
          </Section>

          <Section title="15. CONTATO">
            <p>Para assuntos relacionados à privacidade e proteção de dados, o Usuário poderá entrar em contato pelos canais oficiais disponibilizados na plataforma.</p>
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
