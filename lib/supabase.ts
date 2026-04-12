import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      scenarios: {
        Row: {
          id: string
          title: string
          description: string
          seed_text: string | null
          uploaded_file: string | null
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
          uploaded_file?: string | null
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
          uploaded_file?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          parameters?: object
          results?: object | null
          user_id?: string | null
        }
      }
    }
  }
}
