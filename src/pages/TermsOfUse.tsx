import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">TERMO DE USO</h1>
        <p className="text-xl font-semibold text-primary mb-1">NEXUS METRICS</p>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 03 de março de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. ACEITAÇÃO E VINCULAÇÃO JURÍDICA">
            <p>Estes Termos de Uso regulam o acesso e utilização da plataforma Nexus Metrics, software disponibilizado no modelo SaaS para análise, consolidação e visualização de métricas de marketing digital.</p>
            <p>Ao criar uma conta, acessar ou utilizar qualquer funcionalidade da plataforma, o Usuário declara:</p>
            <ul>
              <li>Ter capacidade legal para contratar</li>
              <li>Que leu integralmente este documento</li>
              <li>Que concorda com todas as cláusulas aqui previstas</li>
            </ul>
            <p>O aceite eletrônico possui validade jurídica plena.</p>
            <p>Caso o Usuário não concorde com qualquer disposição, deverá cessar imediatamente o uso da plataforma.</p>
          </Section>

          <Section title="2. DEFINIÇÕES">
            <p>Para fins deste Termo:</p>
            <ul>
              <li><strong>Plataforma:</strong> software Nexus Metrics, acessível via internet.</li>
              <li><strong>Usuário:</strong> pessoa física ou jurídica que realiza cadastro e utiliza a plataforma.</li>
              <li><strong>Conta:</strong> registro individual criado para acesso à plataforma.</li>
              <li><strong>Projeto:</strong> ambiente interno criado pelo Usuário para organização de contas e dados.</li>
              <li><strong>Plano Gratuito:</strong> modalidade de uso sem cobrança, com limitações técnicas e operacionais.</li>
              <li><strong>Plano Pago:</strong> modalidade mediante assinatura processada via Hotmart.</li>
              <li><strong>Controlador:</strong> Usuário que determina a finalidade e os meios do tratamento dos dados pessoais inseridos ou integrados.</li>
              <li><strong>Operador:</strong> Nexus Metrics, que realiza tratamento de dados pessoais em nome do Usuário.</li>
              <li><strong>Dados do Cliente:</strong> informações inseridas manualmente ou importadas via integrações, incluindo métricas, UTMs e dados de compradores.</li>
            </ul>
          </Section>

          <Section title="3. OBJETO DA PLATAFORMA">
            <p>O Nexus Metrics consiste em ferramenta tecnológica destinada a:</p>
            <ul>
              <li>Leitura e exibição de dados provenientes da API oficial do Meta Ads</li>
              <li>Consolidação de métricas de campanhas publicitárias</li>
              <li>Leitura e organização de parâmetros UTM</li>
              <li>Integração com plataformas de vendas (Hotmart, Cakto, Kiwify e similares)</li>
              <li>Visualização de dados de vendas vinculados ao Usuário</li>
              <li>Gestão de múltiplos projetos com isolamento total de dados</li>
              <li>Convite de usuários adicionais conforme limites do plano</li>
              <li>Criação e gestão de Smart Links para distribuição inteligente de tráfego</li>
              <li>Gestão de leads e pipelines de vendas (CRM)</li>
              <li>Criação de pesquisas e questionários</li>
              <li>Integração com Google Ads e Google Analytics 4</li>
              <li>Relatórios exportáveis em múltiplos formatos (CSV, Excel, PDF)</li>
            </ul>
            <p>A plataforma <strong>não</strong>:</p>
            <ul>
              <li>Executa campanhas publicitárias</li>
              <li>Realiza gestão ativa de anúncios</li>
              <li>Intermedeia pagamentos</li>
              <li>Atua como consultoria estratégica</li>
              <li>Garante resultados financeiros</li>
            </ul>
            <p>O serviço é exclusivamente analítico e informativo.</p>
          </Section>

          <Section title="4. CADASTRO E RESPONSABILIDADE DA CONTA">
            <p>Para utilização da plataforma, o Usuário deverá realizar cadastro com informações verdadeiras, completas e atualizadas.</p>
            <p>O Usuário é integralmente responsável por:</p>
            <ul>
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Utilizar senha segura</li>
              <li>Ativar autenticação em dois fatores</li>
              <li>Restringir acessos indevidos</li>
            </ul>
            <p>A plataforma poderá suspender ou encerrar contas em caso de:</p>
            <ul>
              <li>Informações falsas</li>
              <li>Uso fraudulento</li>
              <li>Violação destes Termos</li>
              <li>Atividades ilícitas</li>
            </ul>
            <p>O compartilhamento de credenciais é expressamente proibido.</p>
          </Section>

          <Section title="5. PLANOS, ASSINATURA E COBRANÇA">
            <p>A contratação dos Planos Pagos ocorre por meio da Hotmart.</p>
            <p>As condições de pagamento, parcelamento, garantia e estorno seguem integralmente as políticas da Hotmart.</p>
            <p>Os planos poderão variar quanto a:</p>
            <ul>
              <li>Número de projetos</li>
              <li>Quantidade de contas Meta conectadas</li>
              <li>Volume de processamento de dados</li>
              <li>Limite de histórico</li>
              <li>Número de usuários convidados</li>
            </ul>
            <p>O Plano Gratuito possui limitações técnicas e poderá ser modificado, suspenso ou encerrado a qualquer momento.</p>
            <p>O cancelamento pode ser solicitado a qualquer tempo, produzindo efeitos ao final do período já pago.</p>
            <p>Não há aplicação de multa por cancelamento.</p>
          </Section>

          <Section title="6. INTEGRAÇÕES COM TERCEIROS">
            <p>O Nexus Metrics permite integração com plataformas de terceiros, incluindo, mas não se limitando a:</p>
            <ul>
              <li>Meta Ads, por meio da API oficial da Meta Platforms</li>
              <li>Hotmart, Cakto, Kiwify e outras plataformas de vendas, por meio de webhooks</li>
              <li>Google Ads e Google Analytics 4, por meio de APIs oficiais</li>
            </ul>
            <p>A conexão com tais plataformas depende de autorização expressa do Usuário por meio de mecanismos oficiais de autenticação.</p>
            <p>A plataforma realiza exclusivamente leitura e consolidação de dados autorizados, não executando ações diretas nas contas integradas.</p>
            <p>O Usuário reconhece que:</p>
            <ul>
              <li>Mudanças nas APIs podem impactar funcionalidades</li>
              <li>Interrupções externas podem afetar temporariamente o serviço</li>
              <li>Bloqueios ou restrições impostas pelas plataformas integradas não são de responsabilidade do Nexus Metrics</li>
            </ul>
            <p>O Usuário é integralmente responsável por cumprir os Termos de Uso e Políticas das plataformas integradas.</p>
          </Section>

          <Section title="7. TRATAMENTO DE DADOS E PAPEL NA LGPD">
            <p>Nos termos da Lei nº 13.709/2018, o Nexus Metrics atua como Operador de dados pessoais.</p>
            <p>O Usuário atua como Controlador, sendo responsável por:</p>
            <ul>
              <li>Determinar a finalidade do tratamento</li>
              <li>Garantir base legal adequada</li>
              <li>Obter consentimento quando necessário</li>
              <li>Atender direitos dos titulares</li>
            </ul>
            <p>A plataforma poderá tratar e armazenar, conforme uso do Usuário:</p>
            <ul>
              <li>Nome e e-mail do titular da conta</li>
              <li>Nome, e-mail e telefone de compradores integrados via Hotmart</li>
              <li>Dados de campanhas publicitárias</li>
              <li>Métricas financeiras relacionadas a anúncios</li>
              <li>Parâmetros UTM</li>
              <li>Dados técnicos de acesso</li>
            </ul>
            <p>O Nexus Metrics não utiliza os dados para finalidade diversa daquela contratada.</p>
          </Section>

          <Section title="8. TRANSFERÊNCIA INTERNACIONAL DE DADOS">
            <p>Os dados poderão ser armazenados em servidores localizados nos Estados Unidos, por meio do provedor de infraestrutura Supabase.</p>
            <p>A transferência internacional ocorre de forma criptografada e com adoção de medidas técnicas adequadas, nos termos da legislação aplicável.</p>
            <p>O Usuário declara ciência dessa condição ao utilizar a plataforma.</p>
          </Section>

          <Section title="9. SEGURANÇA DA INFORMAÇÃO">
            <p>O Nexus Metrics adota medidas técnicas e organizacionais compatíveis com padrões de mercado, incluindo:</p>
            <ul>
              <li>Criptografia de dados em trânsito</li>
              <li>Autenticação em dois fatores</li>
              <li>Controle de acesso por perfil</li>
              <li>Monitoramento de tentativas de acesso</li>
              <li>Proteção contra acessos não autorizados</li>
            </ul>
            <p>Embora sejam adotadas medidas razoáveis de segurança, nenhum sistema é absolutamente imune a falhas.</p>
            <p>O Usuário é responsável por manter suas credenciais protegidas.</p>
          </Section>

          <Section title="10. RETENÇÃO E EXCLUSÃO DE DADOS">
            <p>Os dados serão mantidos enquanto houver relação contratual ativa.</p>
            <p>Após cancelamento:</p>
            <ul>
              <li>Os dados permanecerão armazenados por até 6 meses</li>
              <li>Após esse período, serão excluídos definitivamente</li>
            </ul>
            <p>Não será possível recuperação após a exclusão definitiva.</p>
          </Section>

          <Section title="11. EXPORTAÇÃO DE DADOS">
            <p>A plataforma poderá permitir exportação de dados.</p>
            <p>O Usuário é integralmente responsável pelo uso, armazenamento e eventual compartilhamento posterior dessas informações.</p>
            <p>O Nexus Metrics não se responsabiliza por tratamento posterior realizado fora da plataforma.</p>
          </Section>

          <Section title="12. REGRAS DE USO ACEITÁVEL">
            <p>O Usuário compromete-se a utilizar a plataforma de forma ética, legal e em conformidade com a legislação brasileira.</p>
            <p>É expressamente proibido utilizar o Nexus Metrics para:</p>
            <ul>
              <li>Práticas ilegais ou fraudulentas</li>
              <li>Armazenamento ou tratamento de dados obtidos de forma ilícita</li>
              <li>Violação de direitos de terceiros</li>
              <li>Manipulação indevida de métricas</li>
              <li>Atividades que violem as políticas da Meta, Hotmart ou outras plataformas integradas</li>
              <li>Uso político-partidário em desacordo com a legislação eleitoral</li>
              <li>Armazenamento de conteúdo ofensivo, discriminatório ou ilícito</li>
            </ul>
            <p>A violação poderá resultar em suspensão imediata ou encerramento definitivo da conta, sem direito a indenização.</p>
          </Section>

          <Section title="13. SUSPENSÃO E ENCERRAMENTO">
            <p>O Nexus Metrics poderá suspender ou encerrar o acesso do Usuário nos seguintes casos:</p>
            <ul>
              <li>Descumprimento destes Termos</li>
              <li>Inadimplência</li>
              <li>Uso abusivo da infraestrutura</li>
              <li>Determinação judicial ou administrativa</li>
              <li>Risco à segurança da plataforma</li>
            </ul>
            <p>A suspensão poderá ocorrer sem aviso prévio quando necessária para preservar a integridade do sistema.</p>
          </Section>

          <Section title="14. LIMITAÇÃO DE RESPONSABILIDADE">
            <p>O Nexus Metrics é ferramenta de apoio analítico.</p>
            <p>Não se responsabiliza por:</p>
            <ul>
              <li>Decisões estratégicas tomadas pelo Usuário</li>
              <li>Resultados financeiros de campanhas</li>
              <li>Perdas decorrentes de investimentos em mídia paga</li>
              <li>Mudanças nas políticas ou APIs de terceiros</li>
              <li>Interrupções causadas por falhas externas</li>
              <li>Suspensões de contas em plataformas integradas</li>
            </ul>
            <p>A responsabilidade total da plataforma, quando aplicável, limita-se ao valor pago pelo Usuário nos últimos 12 meses.</p>
            <p>Em nenhuma hipótese haverá responsabilidade por lucros cessantes, danos indiretos ou perdas de oportunidade.</p>
          </Section>

          <Section title="15. PROPRIEDADE INTELECTUAL">
            <p>Todo o software, estrutura, código-fonte, design, banco de dados, relatórios, marca Nexus Metrics e demais elementos da plataforma são protegidos por legislação de propriedade intelectual.</p>
            <p>É proibido:</p>
            <ul>
              <li>Copiar</li>
              <li>Distribuir</li>
              <li>Modificar</li>
              <li>Realizar engenharia reversa</li>
              <li>Revender a plataforma</li>
              <li>Criar produtos derivados</li>
            </ul>
            <p>Sem autorização expressa.</p>
          </Section>

          <Section title="16. AUSÊNCIA DE VÍNCULO COM META OU TERCEIROS">
            <p>O Nexus Metrics não é afiliado, patrocinado, administrado ou associado à Meta Platforms, Inc., Facebook, Instagram ou Hotmart.</p>
            <p>A utilização das APIs ocorre exclusivamente mediante autorização do Usuário.</p>
            <p>Após sair do ambiente da Meta, qualquer responsabilidade recai exclusivamente sobre o Nexus Metrics e o Usuário.</p>
          </Section>

          <Section title="17. ALTERAÇÕES DOS TERMOS">
            <p>Estes Termos poderão ser atualizados a qualquer momento.</p>
            <p>A versão vigente estará disponível na plataforma.</p>
            <p>O uso contínuo após atualização constitui aceite da nova versão.</p>
          </Section>

          <Section title="18. DISPOSIÇÕES GERAIS">
            <p>Caso qualquer cláusula seja considerada inválida, as demais permanecerão em pleno vigor.</p>
            <p>Estes Termos constituem o acordo integral entre as partes, substituindo entendimentos anteriores.</p>
          </Section>

          <Section title="19. FORO">
            <p>Fica eleito o foro da Comarca de São Paulo – SP, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias.</p>
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
