import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for MiroFish tables
export type Database = {
  public: {
    Tables: {
      mirofish_scenarios: {
        Row: {
          id: string
          title: string
          description: string
          seed_text: string | null
          uploaded_file: object | null
          status: string
          created_at: string
          updated_at: string
          parameters: object
          results: object | null
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          seed_text?: string | null
          uploaded_file?: object | null
          status?: string
          created_at?: string
          updated_at?: string
          parameters?: object
          results?: object | null
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          seed_text?: string | null
          uploaded_file?: object | null
          status?: string
          created_at?: string
          updated_at?: string
          parameters?: object
          results?: object | null
          user_id?: string | null
        }
      }
      mirofish_agents: {
        Row: {
          id: string
          scenario_id: string
          agent_id: string
          name: string
          role: string
          personality: string
          x: number
          y: number
          connections: string[]
          state: 'idle' | 'active' | 'interacting'
          sentiment: number
          influence: number
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          agent_id: string
          name: string
          role: string
          personality: string
          x: number
          y: number
          connections?: string[]
          state: 'idle' | 'active' | 'interacting'
          sentiment: number
          influence: number
          created_at?: string
        }
      }
      mirofish_events: {
        Row: {
          id: string
          scenario_id: string
          event_id: string
          timestamp: string
          type: 'interaction' | 'sentiment_shift' | 'emergence' | 'milestone'
          description: string
          agents_involved: string[]
          impact: number
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          event_id: string
          timestamp: string
          type: 'interaction' | 'sentiment_shift' | 'emergence' | 'milestone'
          description: string
          agents_involved?: string[]
          impact: number
          created_at?: string
        }
      }
    }
  }
}
