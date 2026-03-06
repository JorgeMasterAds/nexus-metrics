
-- =============================================
-- AgentHub Schema - Complete Database Setup
-- =============================================

-- Hub User Quotas (token tracking)
CREATE TABLE hub_user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used BIGINT DEFAULT 0,
  tokens_limit BIGINT DEFAULT 100000,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_user_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_quotas_own ON hub_user_quotas FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Agents
CREATE TABLE hub_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_emoji TEXT DEFAULT '🤖',
  mode TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  public_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_agents_own ON hub_agents FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Agent Settings (1:1 with agent)
CREATE TABLE hub_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  model_provider TEXT DEFAULT 'openai',
  model_name TEXT DEFAULT 'gpt-4o-mini',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2048,
  system_prompt TEXT,
  opening_statement TEXT,
  suggested_questions TEXT[] DEFAULT '{}',
  memory_enabled BOOLEAN DEFAULT TRUE,
  memory_window INT DEFAULT 20,
  rag_enabled BOOLEAN DEFAULT FALSE,
  rag_top_k INT DEFAULT 5,
  rag_score_threshold FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_settings_own ON hub_agent_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Knowledge Bases
CREATE TABLE hub_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  chunk_size INT DEFAULT 500,
  chunk_overlap INT DEFAULT 50,
  document_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_knowledge_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_kb_own ON hub_knowledge_bases FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Knowledge Documents
CREATE TABLE hub_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES hub_knowledge_bases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  chunk_count INT DEFAULT 0,
  token_count BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_docs_own ON hub_knowledge_documents FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Agent Knowledge Bases (N:N)
CREATE TABLE hub_agent_knowledge_bases (
  agent_id UUID REFERENCES hub_agents(id) ON DELETE CASCADE,
  knowledge_base_id UUID REFERENCES hub_knowledge_bases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  PRIMARY KEY (agent_id, knowledge_base_id)
);
ALTER TABLE hub_agent_knowledge_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_akb_own ON hub_agent_knowledge_bases FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Agent Tools
CREATE TABLE hub_agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tool_type TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_agent_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_tools_own ON hub_agent_tools FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Agent Workflows
CREATE TABLE hub_agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT DEFAULT 'default',
  graph JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_agent_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_wf_own ON hub_agent_workflows FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Conversations
CREATE TABLE hub_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  channel_type TEXT DEFAULT 'web',
  channel_user_id TEXT,
  title TEXT,
  status TEXT DEFAULT 'active',
  message_count INT DEFAULT 0,
  token_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_conv_own ON hub_conversations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Messages
CREATE TABLE hub_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES hub_conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES hub_agents(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  latency_ms INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_msg_own ON hub_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX hub_messages_conv_idx ON hub_messages (conversation_id, created_at DESC);

-- Hub Agent Logs
CREATE TABLE hub_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID REFERENCES hub_conversations(id),
  message_id UUID REFERENCES hub_messages(id),
  run_id UUID DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  workflow_trace JSONB,
  inputs JSONB,
  outputs JSONB,
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  latency_ms INT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_logs_own ON hub_agent_logs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub Channels
CREATE TABLE hub_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  channel_type TEXT NOT NULL,
  channel_name TEXT,
  webhook_url TEXT,
  credentials JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_ch_own ON hub_channels FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Hub User Integrations (LLM API keys per user)
CREATE TABLE hub_user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_name TEXT,
  credentials JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hub_user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY hub_int_own ON hub_user_integrations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Storage bucket for knowledge base documents
INSERT INTO storage.buckets (id, name, public) VALUES ('hub-documents', 'hub-documents', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload hub documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hub-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own hub documents" ON storage.objects FOR SELECT USING (bucket_id = 'hub-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own hub documents" ON storage.objects FOR DELETE USING (bucket_id = 'hub-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create quotas trigger
CREATE OR REPLACE FUNCTION hub_ensure_user_quotas()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO hub_user_quotas (user_id) VALUES (NEW.user_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE TRIGGER hub_auto_quotas AFTER INSERT ON hub_agents FOR EACH ROW EXECUTE FUNCTION hub_ensure_user_quotas();

-- Updated_at triggers
CREATE TRIGGER hub_agents_updated_at BEFORE UPDATE ON hub_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hub_agent_settings_updated_at BEFORE UPDATE ON hub_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hub_kb_updated_at BEFORE UPDATE ON hub_knowledge_bases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hub_kb_docs_updated_at BEFORE UPDATE ON hub_knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hub_wf_updated_at BEFORE UPDATE ON hub_agent_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER hub_conv_updated_at BEFORE UPDATE ON hub_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
