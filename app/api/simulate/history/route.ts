import { NextRequest, NextResponse } from 'next/server'

import { getScenarioOwnerHash } from '@/lib/scenario-owner'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildHistoryItemsFromApi } from '@/lib/simulation-history'

const DEFAULT_HISTORY_LIMIT = 12
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const ownerHash = getScenarioOwnerHash(request)

    if (!ownerHash) {
      return NextResponse.json({ items: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('mirofish_scenarios')
      .select('id,title,description,status,created_at,updated_at,results')
      .eq('owner_token_hash', ownerHash)
      .order('updated_at', { ascending: false })
      .limit(DEFAULT_HISTORY_LIMIT)

    if (error) {
      console.error('[SimulationHistory] Failed to fetch scenario history', error)
      return NextResponse.json(
        { error: 'Failed to fetch scenario history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      items: buildHistoryItemsFromApi(data || []),
    })
  } catch (error) {
    console.error('[SimulationHistory] Unexpected history fetch error', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenario history' },
      { status: 500 }
    )
  }
}
