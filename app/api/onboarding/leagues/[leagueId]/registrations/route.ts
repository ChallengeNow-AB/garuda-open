import { NextRequest, NextResponse } from 'next/server'

const API_URL = (process.env.CN_API_URL ?? 'https://apiv2.challengenow.se').replace(/\/$/, '')

export async function POST(request: NextRequest, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params
  const payload = await request.json().catch(() => null)
  if (!/^[1-9]\d*$/.test(leagueId) || typeof payload?.firebaseToken !== 'string' || typeof payload?.idempotencyKey !== 'string') {
    return NextResponse.json({ message: 'Invalid registration request' }, { status: 400 })
  }
  try {
    const response = await fetch(`${API_URL}/api/onboarding/leagues/${leagueId}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firebase-Auth': payload.firebaseToken, 'Idempotency-Key': payload.idempotencyKey },
      body: JSON.stringify({ profile: payload.profile, team: payload.team, teamId: payload.teamId }),
      cache: 'no-store',
    })
    const body = await response.json().catch(() => null)
    return NextResponse.json(response.ok ? { user: body?.user, registration: body?.registration, receipt: body?.receipt ?? null } : { code: body?.code, message: 'Registration failed' }, { status: response.status })
  } catch {
    return NextResponse.json({ message: 'Registration service unavailable' }, { status: 503 })
  }
}
