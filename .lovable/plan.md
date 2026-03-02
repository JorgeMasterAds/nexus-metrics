

# Plano: Sistema de Automacao de Jornada do Lead

## Visao Geral

Criar um sistema visual de automacao (estilo SellFlux) que permite configurar a jornada do lead com nodes de decisao, tags, timers, webhooks e integracao com CRM, SmartLinks e Pesquisas/Quiz. Funcionalidades de disparo (e-mail, WhatsApp, SMS) serao marcadas como "Em breve".

## Arquitetura

O sistema reutiliza a base do `AgentFlowEditor` (editor SVG com drag-and-connect) mas com uma nova pagina dedicada, novos tipos de nodes e integracao profunda com os modulos existentes.

```text
+------------------+     +------------------+     +------------------+
|   SmartLink      |---->|   Automacao      |---->|   CRM            |
|   (gera tag)     |     |   (fluxo visual) |     |   (move lead)    |
+------------------+     +------------------+     +------------------+
                               |       |
                    +----------+       +----------+
                    v                              v
             +-------------+              +---------------+
             | Tags/UTMs   |              | Pesquisas     |
             | (condicoes) |              | (gatilhos)    |
             +-------------+              +---------------+
```

## Etapas de Implementacao

### 1. Banco de Dados - Nova tabela `automations`

Criar tabela para armazenar os fluxos de automacao separados dos ai_agents:

- `id`, `account_id`, `project_id`, `name`, `description`
- `is_active` (boolean)
- `flow_nodes` (jsonb) - array de nodes com posicao, tipo e config
- `flow_connections` (jsonb) - array de conexoes entre nodes
- `trigger_type` (text) - tipo de gatilho inicial
- `trigger_config` (jsonb) - configuracao do gatilho
- `created_at`, `updated_at`

RLS: isolado por `account_id` usando `get_user_account_ids`.

### 2. SmartLinks gerando Tags automaticamente

- Adicionar campo `auto_tags` (text[]) na tabela `smartlinks` ou `smartlink_variants`
- Quando um clique e registrado na edge function `redirect`, atribuir automaticamente as tags configuradas ao lead (via email/phone match)
- Na UI de edicao do SmartLink, adicionar campo para selecionar tags que serao atribuidas ao lead ao clicar

### 3. Nova Pagina `/automacoes`

- Rota: `/automacoes`
- Menu lateral: "Automacoes" (icone Zap ou GitBranch)
- Listagem de automacoes com cards mostrando: nome, status ativo/inativo, mini-preview do fluxo
- Botao "Nova automacao" que cria e abre o editor visual

### 4. Editor Visual de Automacao (reutiliza base do AgentFlowEditor)

Criar `src/components/automations/AutomationFlowEditor.tsx` baseado no `AgentFlowEditor` existente, com novos tipos de nodes:

**Gatilhos (Triggers):**
- `start` - Inicio do fluxo
- `trigger_webhook` - Evento de webhook/venda (Hotmart, Kiwify, etc.)
- `trigger_form` - Formulario enviado
- `trigger_tag_added` - Tag adicionada ao lead
- `trigger_smartlink_click` - Clique em SmartLink
- `trigger_survey_response` - Resposta de pesquisa/quiz

**Acoes:**
- `crm_move` - Mover lead para etapa do Kanban (selecionar pipeline + coluna)
- `add_tag` - Adicionar tag ao lead
- `remove_tag` - Remover tag do lead
- `webhook_send` - Enviar webhook para URL externa
- `update_lead` - Atualizar dados do lead
- `add_note` - Registrar nota no lead

**Logica/Decisao:**
- `condition_tag` - Condicao por tag (lead tem/nao tem tag X)
- `condition_utm` - Condicao por UTM (source, medium, campaign)
- `condition_source` - Condicao por fonte do lead
- `timer` - Aguardar tempo (minutos, horas, dias) com opcao de horario comercial
- `router` - Roteador com multiplas saidas condicionais

**Em Breve (desabilitados, com badge):**
- `send_email` - Disparar e-mail
- `send_whatsapp` - Disparar WhatsApp
- `send_sms` - Disparar SMS

### 5. Painel de Configuracao dos Nodes

Cada node tera um painel lateral ao ser clicado:

- **CRM Move**: Selecionar Kanban (pipeline) + Coluna de destino (stage), similar a imagem 113
- **Timer**: Configurar tempo de espera, intervalo de horario, dias da semana, similar a imagem 115
- **Condicao por Tag**: Selecionar tag existente, verificar se lead tem ou nao
- **Condicao por UTM**: Selecionar parametro UTM e valor esperado
- **Webhook Send**: URL de destino, headers, payload template
- **Add/Remove Tag**: Selecionar ou criar tag

### 6. Integracao com Pesquisas/Quiz

- Novo trigger `trigger_survey_response` que dispara quando um lead responde uma pesquisa
- Configuracao: selecionar pesquisa especifica, filtrar por pontuacao (quiz) ou resposta especifica
- Permite criar automacoes como: "Se lead respondeu quiz com score > 7, adicionar tag 'quente' e mover para etapa Fechamento"

### 7. Hook `useAutomations`

Novo hook em `src/hooks/useAutomations.tsx`:
- CRUD de automacoes
- Queries para listar, criar, atualizar, deletar
- Toggle ativo/inativo

### 8. Atualizacao do Menu Lateral

- Adicionar "Automacoes" no `DashboardLayout` com icone `GitBranch` ou `Zap`
- Posicionar abaixo de "CRM" na navegacao
- Adicionar rota ao `knownAppRoutes` no `App.tsx`

## Detalhes Tecnicos

### Estrutura de Arquivos

```text
src/
  pages/Automations.tsx           -- Pagina de listagem
  components/automations/
    AutomationFlowEditor.tsx      -- Editor visual (baseado no AgentFlowEditor)
    AutomationNodeConfig.tsx      -- Paineis de config por tipo de node
    AutomationNodeTypes.ts        -- Definicoes de tipos de nodes
  hooks/useAutomations.tsx        -- Hook de dados
```

### Nodes "Em Breve"

Os nodes de disparo (email, WhatsApp, SMS) serao renderizados no picker com um badge "Em breve" e estilo opaco/desabilitado. Ao clicar, exibem uma mensagem informativa ao inves de serem adicionados ao fluxo.

### Execucao dos Fluxos

Nesta fase, o foco e na **configuracao visual** dos fluxos. A execucao automatica (engine de processamento) sera implementada posteriormente como edge function. O fluxo salvo no JSON ja estara pronto para ser processado quando o engine for implementado.

## Escopo desta Entrega

1. Tabela `automations` com RLS
2. Campo `auto_tags` em smartlinks para gerar tags no clique
3. Pagina de listagem de automacoes
4. Editor visual completo com todos os tipos de nodes
5. Paineis de configuracao para cada node
6. Integracao visual com CRM (selecionar pipeline/stage)
7. Integracao visual com Tags existentes
8. Integracao visual com Pesquisas/Quiz
9. Nodes de disparo marcados como "Em breve"
10. Menu lateral atualizado

