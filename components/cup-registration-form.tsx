'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { createAccountForRegistration, firebaseErrorCode, MIN_PASSWORD_LENGTH } from '@/lib/firebase'
import { formatPrice } from '@/lib/format'
import { registrationUrl } from '@/lib/registration'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { CupDivision } from '@/lib/types'

type Props = {
  cupTitle: string
  currency?: string
  fallbackPrice?: number
  divisions: CupDivision[]
  registrationOpen?: boolean
  target?: 'event' | 'tournament' | 'league'
  locale: Locale
  dict: Dictionary
}

type RegistrationResult = { registration?: { team?: { name?: string } } }
const TEAM_TYPES = new Set(['INDIVIDUAL', 'SQUAD', 'DUO'])
const GENDER_TYPES = new Set(['MALE', 'FEMALE', 'MIXED'])

function isAvailable(division: CupDivision) {
  return !division.registrationClosed && (division.capacity == null || division.joined < division.capacity)
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `storefront-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function CupRegistrationForm({ cupTitle, currency, fallbackPrice, divisions, registrationOpen = true, target = 'tournament', locale, dict }: Props) {
  const copy = dict.detail.registration
  const words = locale === 'sv' ? {
    level: 'Nivå', gender: 'Kön', all: 'Alla', noMatch: 'Inga klasser matchar dina filter.', reset: 'Visa alla',
    account: 'Har du redan ett konto?', existing: 'Ja, fortsätt i appen', newAccount: 'Nej, jag är ny',
    appHint: 'Anmäl dig med ditt befintliga konto och lag. Länken öppnar appen eller spelarwebben.',
    openApp: 'Fortsätt i appen', done: 'Du är anmäld!', appInfo: 'Ditt konto är klart. Använd samma e-postadress och lösenord i appen för att följa din anmälan, matcher och resultat.',
    select: 'Välj klass', team: 'Lag- eller spelarnamn', teamType: 'Spelform',
  } : {
    level: 'Level', gender: 'Gender', all: 'All', noMatch: 'No divisions match your filters.', reset: 'Show all',
    account: 'Do you already have an account?', existing: 'Yes, continue in the app', newAccount: 'No, I am new',
    appHint: 'Register with your existing account and team. The link opens the app or player website.',
    openApp: 'Continue in the app', done: 'You are registered!', appInfo: 'Your account is ready. Use the same email address and password in the app to follow your registration, matches and results.',
    select: 'Choose division', team: 'Team or player name', teamType: 'Format',
  }
  const labels: Record<string, string> = locale === 'sv'
    ? { MALE: 'Herrar', FEMALE: 'Damer', MIXED: 'Mixed', BEGINNER: 'Nybörjare', INTERMEDIATE: 'Medel', PRO: 'Avancerad', ELITE: 'Elit', INDIVIDUAL: 'Singel', DUO: 'Dubbel', SQUAD: 'Lag' }
    : { MALE: 'Men', FEMALE: 'Women', MIXED: 'Mixed', BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', PRO: 'Advanced', ELITE: 'Elite', INDIVIDUAL: 'Singles', DUO: 'Doubles', SQUAD: 'Team' }
  const [accountChoice, setAccountChoice] = useState<'new' | 'existing' | null>(null)
  const [level, setLevel] = useState('')
  const [gender, setGender] = useState('')
  const pending = useRef<{ payload: Record<string, unknown> } | null>(null)
  const [locked, setLocked] = useState(false)
  const availableDivisions = useMemo(
    () => registrationOpen ? divisions.filter(isAvailable) : [],
    [divisions, registrationOpen],
  )
  const [divisionId, setDivisionId] = useState(() => String(availableDivisions[0]?.id ?? ''))
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationResult | null>(null)
  const idempotencyKey = useRef<string | null>(null)
  const filtered = availableDivisions.filter(division => (!level || division.skillLevel === level) && (!gender || division.targetGender === gender))
  const selected = filtered.find(division => String(division.id) === divisionId) ?? filtered[0]
  const levels = [...new Set(availableDivisions.map(division => division.skillLevel).filter(Boolean))] as string[]
  const genders = [...new Set(availableDivisions.map(division => division.targetGender).filter(Boolean))] as string[]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || accountChoice !== 'new') return
    if (!selected || !registrationOpen || !isAvailable(selected)) {
      setError(copy.errors.unavailable)
      return
    }
    if (!accepted) {
      setError(copy.errors.terms)
      return
    }

    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    if (!pending.current && password.length < MIN_PASSWORD_LENGTH) {
      setError(copy.errors.weakPassword.replace('{0}', String(MIN_PASSWORD_LENGTH)))
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (!pending.current) {
        const firebaseToken = await createAccountForRegistration(String(form.get('email') ?? '').trim(), password)
        idempotencyKey.current ??= createIdempotencyKey()
        const bornYear = String(form.get('bornYear') ?? '').trim()
        pending.current = { payload: {
          firebaseToken,
          idempotencyKey: idempotencyKey.current,
          profile: {
            firstName: String(form.get('firstName') ?? '').trim(),
            lastName: String(form.get('lastName') ?? '').trim(),
            phoneNumber: String(form.get('phoneNumber') ?? '').trim(),
          },
          team: {
            name: String(form.get('teamName') ?? '').trim(),
            teamType: TEAM_TYPES.has(selected.targetAudience ?? '') ? selected.targetAudience : String(form.get('teamType') ?? 'DUO'),
            genderType: GENDER_TYPES.has(selected.targetGender ?? '') ? selected.targetGender : String(form.get('genderType') ?? 'MIXED'),
            ...(bornYear ? { bornYear: Number(bornYear) } : {}),
          },
        } }
        setLocked(true)
      }
      const response = await fetch(`/api/onboarding/${target === 'league' ? 'leagues' : 'events'}/${selected.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pending.current.payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw Object.assign(new Error(body?.message ?? copy.errors.generic), { registrationCode: body?.code })
      }
      if (!body?.registration?.team) throw new Error('Incomplete registration response')
      setResult(body)
    } catch (caught) {
      const registrationCode = (caught as { registrationCode?: string })?.registrationCode
      const authCode = firebaseErrorCode(caught)
      if (['EVENT_FULL', 'LEAGUE_FULL'].includes(registrationCode ?? '')) setError(copy.errors.full)
      else if (['REGISTRATION_CLOSED', 'SEASON_STARTED', 'LEAGUE_INACTIVE'].includes(registrationCode ?? '')) setError(copy.errors.closed)
      else if (['PROFILE_MISMATCH', 'GENDER_MISMATCH', 'TEAM_TYPE_MISMATCH'].includes(registrationCode ?? '')) setError(copy.errors.profileMismatch)
      else if (authCode === 'firebase/not-configured') setError(copy.errors.notConfigured)
      else if (authCode === 'auth/email-already-in-use' && selected) window.location.assign(registrationUrl(target, selected.id))
      else if (authCode === 'auth/invalid-email') setError(copy.errors.invalidEmail)
      else if (authCode === 'auth/weak-password') setError(copy.errors.weakPassword.replace('{0}', String(MIN_PASSWORD_LENGTH)))
      else if (authCode === 'auth/network-request-failed') setError(copy.errors.network)
      else setError(copy.errors.generic)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl border border-brand/25 bg-brand-tint p-7 text-ink" role="status">
        <CheckCircle2 className="h-11 w-11 text-brand" />
        <h3 className="mt-4 text-2xl font-black">{words.done}</h3>
        <p className="mt-2 leading-relaxed">{copy.successBody.replace('{team}', result.registration?.team?.name ?? '').replace('{division}', selected?.title ?? cupTitle)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{words.appInfo}</p>
        {selected && <a href={registrationUrl(target, selected.id)} className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white">{words.openApp}</a>}
      </div>
    )
  }

  if (availableDivisions.length === 0) {
    return <p className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">{copy.noAvailableDivisions}</p>
  }

  return (
    <form onSubmit={submit} className="space-y-7 rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
      <fieldset disabled={submitting || locked} className="space-y-4">
        {divisions.length > 1 && <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">{words.level}
            <select value={level} onChange={event => { setLevel(event.target.value); setDivisionId(''); idempotencyKey.current = null }} className="h-12 rounded-xl border border-border bg-background px-4">
              <option value="">{words.all}</option>{levels.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">{words.gender}
            <select value={gender} onChange={event => { setGender(event.target.value); setDivisionId(''); idempotencyKey.current = null }} className="h-12 rounded-xl border border-border bg-background px-4">
              <option value="">{words.all}</option>{genders.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
            </select>
          </label>
        </div>}
        {filtered.length === 0 && <p role="status">{words.noMatch} <button type="button" onClick={() => { setLevel(''); setGender('') }} className="text-brand underline">{words.reset}</button></p>}
        <label className="mt-5 grid gap-2 text-sm font-bold">
          {divisions.length > 1 ? words.select : cupTitle}
          <select
            name="division"
            disabled={filtered.length === 0}
            value={selected?.id ?? ''}
            onChange={event => { setDivisionId(event.target.value); idempotencyKey.current = null }}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-ink"
          >
            {filtered.map(division => {
              const spots = division.capacity == null ? null : division.capacity - division.joined
              const details = [formatPrice(division.price ?? fallbackPrice, currency, dict.common.free), spots == null ? null : copy.spotsLeft.replace('{0}', String(spots))].filter(Boolean).join(' · ')
              return <option key={division.id} value={division.id}>{division.title} — {details}</option>
            })}
          </select>
        </label>
      </fieldset>

      {selected && <fieldset disabled={submitting || locked}>
        <legend className="text-lg font-black">{words.account}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" aria-pressed={accountChoice === 'existing'} onClick={() => setAccountChoice('existing')} className={`rounded-xl border p-4 text-left font-bold ${accountChoice === 'existing' ? 'border-brand bg-brand-tint' : 'border-border'}`}>{words.existing}</button>
          <button type="button" aria-pressed={accountChoice === 'new'} onClick={() => setAccountChoice('new')} className={`rounded-xl border p-4 text-left font-bold ${accountChoice === 'new' ? 'border-brand bg-brand-tint' : 'border-border'}`}>{words.newAccount}</button>
        </div>
      </fieldset>}
      {selected && accountChoice === 'existing' && <div>
        <p className="mb-4 text-muted-foreground">{words.appHint}</p>
        <a href={registrationUrl(target, selected.id)} className="inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white">{words.openApp}</a>
      </div>}
      {selected && accountChoice === 'new' && <>
      <fieldset disabled={submitting || locked} className="space-y-7">
      <fieldset>
        <legend className="text-lg font-black">{copy.personHeading}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={copy.labels.firstName} name="firstName" autoComplete="given-name" />
          <Field label={copy.labels.lastName} name="lastName" autoComplete="family-name" />
          <Field label={copy.labels.phone} name="phoneNumber" type="tel" autoComplete="tel" />
          <Field label={copy.labels.birthYear} name="bornYear" type="number" min="1900" max={String(new Date().getFullYear())} required={false} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-black">{copy.teamHeading}</legend>
        <div className="mt-3"><Field label={words.team} name="teamName" autoComplete="organization" /></div>
      </fieldset>

      {(!selected.targetAudience || !selected.targetGender) && <div className="grid gap-4 sm:grid-cols-2">
        {!selected.targetAudience && <label className="grid gap-2 text-sm font-bold">{words.teamType}<select name="teamType" className="h-12 rounded-xl border bg-background px-4">{['INDIVIDUAL', 'DUO', 'SQUAD'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
        {!selected.targetGender && <label className="grid gap-2 text-sm font-bold">{words.gender}<select name="genderType" className="h-12 rounded-xl border bg-background px-4">{['MALE', 'FEMALE', 'MIXED'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
      </div>}

      <fieldset>
        <legend className="text-lg font-black">{copy.accountHeading}</legend>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">{copy.accountHint}</p>
          {selected && <a href={registrationUrl(target, selected.id)} className="font-bold text-brand underline underline-offset-4">{copy.existingAccountCta}</a>}
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={copy.labels.email} name="email" type="email" autoComplete="email" />
          <Field label={copy.labels.password} name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm">
        <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
        <span>{copy.termsPrefix} <a href={`https://www.challengenow.se/${locale}/privacy-policy`} target="_blank" rel="noreferrer" className="font-bold text-brand underline underline-offset-2">{copy.termsLink}</a>.</span>
      </label>

      </fieldset>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">{error}</div>}

      <button type="submit" disabled={submitting} className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-black text-white transition hover:bg-brand disabled:cursor-wait disabled:opacity-65">
        {submitting ? <LoaderCircle size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
        {submitting ? copy.submitting : copy.submit}
      </button>
      </>}
    </form>
  )
}

function Field({ label, name, required = true, ...props }: { label: string; name: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input name={name} required={required} className="h-12 rounded-xl border border-border bg-background px-4 font-normal text-ink" {...props} />
    </label>
  )
}
