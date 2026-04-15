-- MiroFish Visualizer Database Schema for phi-kanban Supabase project
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MiroFish Scenarios table
CREATE TABLE IF NOT EXISTS mirofish_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  seed_text TEXT,
  uploaded_file JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parameters JSONB NOT NULL DEFAULT '{"agentCount": 50, "simulationRounds": 100, "temperature": 0.7}'::jsonb,
  results JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- MiroFish Simulation Agents table (for detailed agent storage)
CREATE TABLE IF NOT EXISTS mirofish_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  personality TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  connections TEXT[] DEFAULT '{}',
  state TEXT NOT NULL CHECK (state IN ('idle', 'active', 'interacting')),
  sentiment FLOAT NOT NULL,
  influence FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish Simulation Events table
CREATE TABLE IF NOT EXISTS mirofish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interaction', 'sentiment_shift', 'emergence', 'milestone', 'post_viral', 'consensus', 'conflict')),
  description TEXT NOT NULL,
  agents_involved TEXT[] DEFAULT '{}',
  impact FLOAT NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  related_post_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish Posts table (agent posts/content)
CREATE TABLE IF NOT EXISTS mirofish_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  round INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'reddit')),
  sentiment FLOAT NOT NULL DEFAULT 0,
  engagement FLOAT NOT NULL DEFAULT 0,
  likes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish Comments table (comments on posts)
CREATE TABLE IF NOT EXISTS mirofish_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL,
  post_id TEXT NOT NULL REFERENCES mirofish_posts(post_id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  round INTEGER NOT NULL,
  likes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish Simulation Rounds table (tracking each simulation round)
CREATE TABLE IF NOT EXISTS mirofish_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentiment_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  new_connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish User Settings table
CREATE TABLE IF NOT EXISTS mirofish_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_agent_count INTEGER DEFAULT 50,
  default_simulation_rounds INTEGER DEFAULT 100,
  default_temperature FLOAT DEFAULT 0.7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mirofish_scenarios_user_id ON mirofish_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_scenarios_status ON mirofish_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_mirofish_scenarios_created_at ON mirofish_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mirofish_agents_scenario_id ON mirofish_agents(scenario_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_events_scenario_id ON mirofish_events(scenario_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_events_timestamp ON mirofish_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mirofish_posts_scenario_id ON mirofish_posts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_posts_round ON mirofish_posts(round);
CREATE INDEX IF NOT EXISTS idx_mirofish_posts_agent_id ON mirofish_posts(agent_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_comments_post_id ON mirofish_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_rounds_scenario_id ON mirofish_rounds(scenario_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION mirofish_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for mirofish_scenarios
DROP TRIGGER IF EXISTS mirofish_update_scenarios_updated_at ON mirofish_scenarios;
CREATE TRIGGER mirofish_update_scenarios_updated_at
  BEFORE UPDATE ON mirofish_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION mirofish_update_updated_at_column();

-- Trigger for mirofish_user_settings
DROP TRIGGER IF EXISTS mirofish_update_user_settings_updated_at ON mirofish_user_settings;
CREATE TRIGGER mirofish_update_user_settings_updated_at
  BEFORE UPDATE ON mirofish_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION mirofish_update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE mirofish_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirofish_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mirofish_scenarios
DROP POLICY IF EXISTS "Users can view own mirofish scenarios" ON mirofish_scenarios;
CREATE POLICY "Users can view own mirofish scenarios" ON mirofish_scenarios
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mirofish scenarios" ON mirofish_scenarios;
CREATE POLICY "Users can insert own mirofish scenarios" ON mirofish_scenarios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mirofish scenarios" ON mirofish_scenarios;
CREATE POLICY "Users can update own mirofish scenarios" ON mirofish_scenarios
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mirofish scenarios" ON mirofish_scenarios;
CREATE POLICY "Users can delete own mirofish scenarios" ON mirofish_scenarios
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mirofish_agents
DROP POLICY IF EXISTS "Users can view agents for own scenarios" ON mirofish_agents;
CREATE POLICY "Users can view agents for own scenarios" ON mirofish_agents
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert agents for own scenarios" ON mirofish_agents;
CREATE POLICY "Users can insert agents for own scenarios" ON mirofish_agents
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete agents for own scenarios" ON mirofish_agents;
CREATE POLICY "Users can delete agents for own scenarios" ON mirofish_agents
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_events
DROP POLICY IF EXISTS "Users can view events for own scenarios" ON mirofish_events;
CREATE POLICY "Users can view events for own scenarios" ON mirofish_events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert events for own scenarios" ON mirofish_events;
CREATE POLICY "Users can insert events for own scenarios" ON mirofish_events
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete events for own scenarios" ON mirofish_events;
CREATE POLICY "Users can delete events for own scenarios" ON mirofish_events
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON mirofish_user_settings;
CREATE POLICY "Users can view own settings" ON mirofish_user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON mirofish_user_settings;
CREATE POLICY "Users can insert own settings" ON mirofish_user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON mirofish_user_settings;
CREATE POLICY "Users can update own settings" ON mirofish_user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mirofish_posts
DROP POLICY IF EXISTS "Users can view posts for own scenarios" ON mirofish_posts;
CREATE POLICY "Users can view posts for own scenarios" ON mirofish_posts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_posts.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert posts for own scenarios" ON mirofish_posts;
CREATE POLICY "Users can insert posts for own scenarios" ON mirofish_posts
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_posts.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete posts for own scenarios" ON mirofish_posts;
CREATE POLICY "Users can delete posts for own scenarios" ON mirofish_posts
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_posts.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_comments
DROP POLICY IF EXISTS "Users can view comments for own scenarios" ON mirofish_comments;
CREATE POLICY "Users can view comments for own scenarios" ON mirofish_comments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_comments.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert comments for own scenarios" ON mirofish_comments;
CREATE POLICY "Users can insert comments for own scenarios" ON mirofish_comments
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_comments.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete comments for own scenarios" ON mirofish_comments;
CREATE POLICY "Users can delete comments for own scenarios" ON mirofish_comments
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_comments.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_rounds
DROP POLICY IF EXISTS "Users can view rounds for own scenarios" ON mirofish_rounds;
CREATE POLICY "Users can view rounds for own scenarios" ON mirofish_rounds
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_rounds.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert rounds for own scenarios" ON mirofish_rounds;
CREATE POLICY "Users can insert rounds for own scenarios" ON mirofish_rounds
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_rounds.scenario_id 
    AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete rounds for own scenarios" ON mirofish_rounds;
CREATE POLICY "Users can delete rounds for own scenarios" ON mirofish_rounds
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_rounds.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- Create storage bucket for mirofish file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mirofish-uploads', 'mirofish-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to mirofish-uploads bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'mirofish-uploads');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'mirofish-uploads' 
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'mirofish-uploads' 
    AND auth.uid() = owner
  );
