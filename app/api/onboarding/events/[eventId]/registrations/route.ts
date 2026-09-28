import { NextRequest, NextResponse } from 'next/server'

const API_URL = (process.env.CN_API_URL ?? 'https://apiv2.challengenow.se').replace(/\/$/, '')

type RouteContext = { params: Promise<{ eventId: string }> }

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { eventId } = await params
  if (!/^\d+$/.test(eventId)) {
    return NextResponse.json({ message: 'Invalid event id' }, { status: 400 })
  }

  const payload = await request.json().catch(() => null)
  const firebaseToken = payload?.firebaseToken
  const idempotencyKey = payload?.idempotencyKey
  if (typeof firebaseToken !== 'string' || typeof idempotencyKey !== 'string') {
    return NextResponse.json({ message: 'Authentication and idempotency key are required' }, { status: 400 })
  }

  const registration = {
    profile: payload.profile,
    ...(payload.teamId != null ? { teamId: payload.teamId } : {}),
    ...(payload.team != null ? { team: payload.team } : {}),
  }

  let apiResponse: Response
  try {
    apiResponse = await fetch(`${API_URL}/api/onboarding/events/${eventId}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-Auth': firebaseToken,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(registration),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ message: 'Registration service unavailable' }, { status: 503 })
  }

  const body = await apiResponse.json().catch(() => null)
  if (!apiResponse.ok) {
    return NextResponse.json(
      { code: body?.code, message: body?.message ?? 'Registration failed' },
      { status: apiResponse.status },
    )
  }

  return NextResponse.json(
    { user: body?.user, registration: body?.registration },
    { status: apiResponse.status },
  )
}
