
-- Fix features arrays to match actual max_* limits

UPDATE plans SET features = jsonb_build_array(
  '1 projeto',
  '1 smartlink',
  '1 webhook',
  '1 usuário',
  '100 leads',
  '0 agentes IA',
  '0 dispositivos',
  '1 pesquisa'
) WHERE name = 'free';

UPDATE plans SET features = jsonb_build_array(
  '1 projeto',
  '3 smartlinks',
  '3 webhooks',
  '2 usuários',
  '500 leads',
  '1 agente IA',
  '1 dispositivo',
  '3 pesquisas',
  'Relatórios básicos',
  'Suporte padrão'
) WHERE name = 'bronze';

UPDATE plans SET features = jsonb_build_array(
  '2 projetos',
  '5 smartlinks',
  '10 webhooks',
  '3 usuários',
  '2.000 leads',
  '1 agente IA',
  '1 dispositivo',
  '5 pesquisas',
  'Exportação CSV',
  'Filtros avançados',
  'Suporte prioritário'
) WHERE name = 'prata';

UPDATE plans SET features = jsonb_build_array(
  '5 projetos',
  '10 smartlinks',
  '20 webhooks',
  '3 usuários',
  '10.000 leads',
  '2 agentes IA',
  '2 dispositivos',
  '10 pesquisas',
  'Relatórios avançados',
  'API futura',
  'Suporte dedicado'
) WHERE name = 'ouro';
