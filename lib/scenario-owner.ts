import { createHash, randomBytes, randomUUID } from 'node:crypto'

import type { NextRequest, NextResponse } from 'next/server'

export const SCENARIO_OWNER_COOKIE = 'mirofish_owner'

const OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function createScenarioOwnerToken() {
  return `${randomUUID()}-${randomBytes(18).toString('hex')}`
}

export function hashScenarioOwnerToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function getScenarioOwnerToken(request: NextRequest) {
  return request.cookies.get(SCENARIO_OWNER_COOKIE)?.value ?? null
}

export function getScenarioOwnerHash(request: NextRequest) {
  const token = getScenarioOwnerToken(request)
  return token ? hashScenarioOwnerToken(token) : null
}

export function ensureScenarioOwner(request: NextRequest) {
  const existingToken = getScenarioOwnerToken(request)

  if (existingToken) {
    return {
      token: existingToken,
      ownerHash: hashScenarioOwnerToken(existingToken),
      shouldSetCookie: false,
    }
  }

  const token = createScenarioOwnerToken()

  return {
    token,
    ownerHash: hashScenarioOwnerToken(token),
    shouldSetCookie: true,
  }
}

export function setScenarioOwnerCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SCENARIO_OWNER_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OWNER_COOKIE_MAX_AGE_SECONDS,
  })
}
