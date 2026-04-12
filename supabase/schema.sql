-- MiroFish Visualizer Database Schema for phi-kanban Supabase project
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MiroFish Scenarios table
CREATE TABLE IF NOT EXISTS mirofish_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES mirofish_scenarios(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interaction', 'sentiment_shift', 'emergence', 'milestone')),
  description TEXT NOT NULL,
  agents_involved TEXT[] DEFAULT '{}',
  impact FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MiroFish User Settings table
CREATE TABLE IF NOT EXISTS mirofish_user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
ALTER TABLE mirofish_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mirofish_scenarios
CREATE POLICY "Users can view own mirofish scenarios" ON mirofish_scenarios
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mirofish scenarios" ON mirofish_scenarios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mirofish scenarios" ON mirofish_scenarios
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mirofish scenarios" ON mirofish_scenarios
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mirofish_agents
CREATE POLICY "Users can view agents for own scenarios" ON mirofish_agents
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert agents for own scenarios" ON mirofish_agents
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete agents for own scenarios" ON mirofish_agents
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_agents.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_events
CREATE POLICY "Users can view events for own scenarios" ON mirofish_events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert events for own scenarios" ON mirofish_events
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete events for own scenarios" ON mirofish_events
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM mirofish_scenarios s 
    WHERE s.id = mirofish_events.scenario_id 
    AND s.user_id = auth.uid()
  ));

-- RLS Policies for mirofish_user_settings
CREATE POLICY "Users can view own settings" ON mirofish_user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON mirofish_user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON mirofish_user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for mirofish file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mirofish-uploads', 'mirofish-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to mirofish-uploads bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'mirofish-uploads');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'mirofish-uploads' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'mirofish-uploads' 
    AND auth.uid() = owner
  );
