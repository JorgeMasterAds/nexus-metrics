

# Analise do Software — Nexus Metrics

## Estado Atual

O Nexus Metrics e uma plataforma de analytics para infoprodutores brasileiros com: dashboard de metricas, Smart Links com rastreamento, integracao com Meta/Google Ads, GA4, CRM, pesquisas, automacoes, formularios e sistema multi-tenant (accounts/projects).

---

## Problemas Identificados e Melhorias Necessarias

### 1. CRITICOS — Seguranca e Integridade

- **Credenciais armazenadas em texto plano**: A tabela `platform_integrations` salva `credentials` como JSONB sem criptografia. Client IDs, Secrets e Tokens ficam expostos a qualquer query. Deve-se usar `vault.secrets` do Supabase ou criptografar antes de salvar.
- **RLS fraco na tabela `sales`**: A policy atual permite SELECT para qualquer usuario autenticado (`auth.role() = 'authenticated'`), ou seja, usuario A ve vendas do usuario B. Precisa filtrar por `account_id` com RLS adequado.
- **INSERT irrestrito em `sales`**: A policy de INSERT usa `WITH CHECK (true)`, permitindo que qualquer request insira dados. Deveria ser restrito ao service_role (removendo a policy e usando apenas a chave service_role nas Edge Functions).
- **Tabela `platform_integrations` filtra por `user_id`** mas o codigo frontend usa `account_id`. Ha um mismatch: a migration cria com `user_id` mas o frontend salva `account_id`. Isso causa falhas silenciosas no RLS.

### 2. ARQUITETURA — Codigo e Performance

- **Dashboard.tsx com 1764 linhas**: Arquivo monolitico e dificil de manter. Deveria ser dividido em componentes menores (KPI cards, graficos individuais, tabelas UTM, secoes Meta/Google/GA4).
- **Integrations.tsx com 1764 linhas**: Mesmo problema. Cada tab (Plataformas, Forms, Meta, Google, Logs, Script) deveria ser um componente separado.
- **AppSidebar.tsx com 739 linhas**: Sidebar com logica de permissao inline. Menus devem ser definidos como dados e renderizados via map.
- **Duplicacao de codigo**: `CustomTooltipContent`, `TOOLTIP_STYLE`, `TICK_STYLE` estao duplicados entre `Dashboard.tsx` e `Home.tsx`. Extrair para componente compartilhado.
- **`(supabase as any)` usado em todo o codebase**: Indica que os tipos do Supabase nao estao sincronizados. Corrigir o arquivo `types.ts` para refletir todas as tabelas.
- **Queries sem paginacao**: `fetchAllRows` carrega tudo em memoria. Para tabelas grandes (clicks, conversions), isso pode causar problemas de performance.

### 3. FUNCIONAL — Gaps nas Integrações

- **Webhook URL incorreta**: A URL gerada (`dev.nexusmetrics.jmads.com.br/webhook/hotmart`) nao aponta para nenhuma Edge Function real. As Edge Functions estao em `supabase.co/functions/v1/hotmart-webhook`. Precisa de um proxy no Cloudflare ou corrigir a URL exibida.
- **Edge Functions sem account_id**: As webhooks de plataformas (hotmart-webhook, etc.) inserem na tabela `sales` sem associar a nenhum `account_id`, tornando impossivel saber de qual usuario veio a venda.
- **Sem validacao de webhook**: Nenhuma Edge Function valida a assinatura/token do webhook. A Hotmart envia `x-hotmart-hottok`, Kiwify envia token — ambos estao comentados ou ignorados.
- **Sem sincronizacao historica**: O `hotmartService.ts` existe mas nao e chamado em nenhum lugar. Falta um botao "Sincronizar historico" na UI.
- **Plataformas tab nao carrega credenciais salvas**: O `PlatformConfigDialog` inicializa `fields` como `{}` sem popular com os valores salvos do `integration.credentials`.

### 4. UX — Melhorias de Interface

- **Sidebar muito longa**: Muitos itens (15+) com varios marcados como "Em breve" ou "Beta" para nao-super-admins. Considerar agrupar em categorias ou ocultar features nao disponiveis.
- **Onboarding incompleto**: Verifica se tem webhooks, mas nao guia o usuario a configurar plataformas de venda.
- **Sem feedback visual de conexao**: Apos salvar credenciais de plataforma, nao ha teste de conexao real. O botao "Testar Conexao" nao existe.
- **Sem notificacao de novas vendas**: O Realtime esta configurado mas nao emite toast/som quando uma venda chega.

### 5. INFRA — Deploy e Operacional

- **PWA sem estrategia de cache inteligente**: O service worker pode servir HTML antigo, causando 404 em rotas novas (problema ja enfrentado).
- **Edge Functions duplicadas**: Existem `hotmart-webhook` (novo, tabela sales) e `webhook` (antigo, tabela conversions). Duplicacao de logica sem unificacao.
- **Sem monitoramento de Edge Functions**: Nao ha logging estruturado nem alertas quando webhooks falham.

---

## Plano de Acao Priorizado

### Fase 1 — Correcoes Criticas (imediato)
1. Corrigir RLS de `sales` para filtrar por `account_id`
2. Adicionar `account_id` na tabela `sales` e nas Edge Functions
3. Alinhar `platform_integrations` para usar `account_id` (nao `user_id`)
4. Remover policy de INSERT aberta em `sales`
5. Criptografar credenciais antes de salvar

### Fase 2 — Funcionalidade (proximo sprint)
6. Corrigir URL de webhook (proxy Cloudflare ou usar URL real)
7. Implementar validacao de assinatura nos webhooks
8. Popular campos de credenciais ao abrir dialog de plataforma
9. Adicionar botao "Testar Conexao"
10. Implementar sincronizacao historica da Hotmart

### Fase 3 — Qualidade de Codigo (continuo)
11. Dividir Dashboard.tsx em componentes menores
12. Dividir Integrations.tsx em componentes por tab
13. Extrair componentes compartilhados (tooltips, chart helpers)
14. Sincronizar tipos do Supabase (eliminar `as any`)
15. Adicionar testes unitarios para hooks criticos

### Fase 4 — UX e Polish
16. Adicionar toast/som para vendas em tempo real
17. Simplificar sidebar (agrupar/ocultar itens)
18. Melhorar onboarding com guia de plataformas
19. Adicionar metricas de saude das integracoes

