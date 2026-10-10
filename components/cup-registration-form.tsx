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


const controlClass = 'h-12 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-base font-normal text-ink transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60'
const actionClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-base font-bold text-white transition hover:bg-brand disabled:cursor-wait disabled:opacity-60'

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
    account: 'Har du ett ChallengeNow-konto?', existing: 'Ja, jag har ett konto', newAccount: 'Nej, jag är ny',
    newHint: 'När du slutför anmälan skapas ditt ChallengeNow-konto. Du kan sedan använda samma inloggning i appen för att följa tävlingen.',
    appHint: 'Fortsätt med ditt konto i appen för att slutföra anmälan. Har du inte appen öppnas spelarwebben.',
    openApp: 'Fortsätt i appen', done: 'Du är anmäld!', appInfo: 'Ditt konto är klart. Använd samma e-postadress och lösenord i appen för att följa din anmälan, matcher och resultat.',
    select: 'Välj klass', team: 'Lag- eller spelarnamn', teamType: 'Spelform',
  } : {
    level: 'Level', gender: 'Gender', all: 'All', noMatch: 'No divisions match your filters.', reset: 'Show all',
    account: 'Do you have a ChallengeNow account?', existing: 'Yes, I have an account', newAccount: 'No, I am new',
    newHint: 'Completing your registration creates your ChallengeNow account. Use the same sign-in details in the app to follow the competition.',
    appHint: 'Continue with your account in the app to complete registration. If you do not have the app, the player website opens.',
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
  const divisionGroups = (['INDIVIDUAL', 'DUO', 'SQUAD', 'OTHER'] as const)
    .map(format => ({
      format,
      items: filtered.filter(division => (division.targetAudience || 'OTHER') === format),
    }))
    .filter(group => group.items.length > 0)

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
      <div className="space-y-4 text-ink" role="status">
        <CheckCircle2 className="h-11 w-11 text-brand" />
        <h3 className="mt-4 text-2xl font-black">{words.done}</h3>
        <p className="mt-2 leading-relaxed">{copy.successBody.replace('{team}', result.registration?.team?.name ?? '').replace('{division}', selected?.title ?? cupTitle)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{words.appInfo}</p>
        {selected && <a href={registrationUrl(target, selected.id)} className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white">{words.openApp}</a>}
      </div>
    )
  }

  if (availableDivisions.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.noAvailableDivisions}</p>
  }

  return (
    <form onSubmit={submit} className="space-y-9">
      {divisions.length > 1 && <fieldset disabled={submitting || locked} className="space-y-6">
        <legend className="sr-only">{words.select}</legend>
        {(levels.length > 1 || genders.length > 1) && <div className="grid gap-4 sm:max-w-xl sm:grid-cols-2">
          {levels.length > 1 && <label className="grid gap-2 text-sm font-medium">{words.level}
            <select value={level} onChange={event => { setLevel(event.target.value); setDivisionId(''); idempotencyKey.current = null }} className={controlClass}>
              <option value="">{words.all}</option>{levels.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
            </select>
          </label>}
          {genders.length > 1 && <label className="grid gap-2 text-sm font-medium">{words.gender}
            <select value={gender} onChange={event => { setGender(event.target.value); setDivisionId(''); idempotencyKey.current = null }} className={controlClass}>
              <option value="">{words.all}</option>{genders.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
            </select>
          </label>}
        </div>}
        {filtered.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">{words.noMatch} <button type="button" onClick={() => { setLevel(''); setGender('') }} className="font-medium text-brand underline underline-offset-4">{words.reset}</button></p>
        ) : divisionGroups.map(group => (
          <div key={group.format} className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="border-b border-border bg-[#f7faf7] px-5 py-4 text-sm font-black uppercase tracking-widest text-brand">
              {labels[group.format] || (locale === 'sv' ? 'Övriga klasser' : 'Other divisions')}
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {group.items.map(division => <label key={division.id} className="flex cursor-pointer items-start gap-4 bg-white p-5 transition hover:bg-brand-tint has-[:checked]:bg-brand-tint">
                <input type="radio" name="division" value={division.id} checked={selected?.id === division.id}
                  onChange={() => { setDivisionId(String(division.id)); idempotencyKey.current = null }}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-base text-ink">{division.title}</strong>
                  <span className="mt-1 block text-sm text-muted-foreground">{[division.targetGender, division.skillLevel].filter(Boolean).map(value => labels[value!] ?? value).join(' · ')}</span>
                  {division.capacity != null && <span className="mt-2 block text-xs text-muted-foreground">{copy.spotsLeft.replace('{0}', String(Math.max(0, division.capacity - division.joined)))}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-accent/60 px-3 py-1 text-sm font-bold text-ink">{formatPrice(division.price ?? fallbackPrice, currency, dict.common.free)}</span>
              </label>)}
            </div>
          </div>
        ))}
      </fieldset>}

      <fieldset disabled={submitting || locked} className="border-t border-border pt-8">
        <legend className="text-xl font-bold text-ink">{words.account}</legend>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {(['existing', 'new'] as const).map(choice => (
            <label key={choice} className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input type="radio" name="accountChoice" value={choice} checked={accountChoice === choice}
                onChange={() => { setAccountChoice(choice); setError(null) }}
                className="h-4 w-4 accent-[var(--brand)]" />
              {choice === 'existing' ? words.existing : words.newAccount}
            </label>
          ))}
        </div>
      </fieldset>

      {accountChoice && <>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {accountChoice === 'new' ? words.newHint : words.appHint}
        </p>

        {selected && <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-5 text-sm" aria-live="polite">
          <span className="text-muted-foreground">{locale === 'sv' ? 'Anmälningsavgift' : 'Entry fee'}</span>
          <span className="font-semibold">{formatPrice(selected.price ?? fallbackPrice, currency, dict.common.free)}
            {selected.capacity != null && <span className="ml-3 font-normal text-muted-foreground">{copy.spotsLeft.replace('{0}', String(Math.max(0, selected.capacity - selected.joined)))}</span>}
          </span>
        </div>}

        {selected && accountChoice === 'existing' && (
          <a href={registrationUrl(target, selected.id)} className={actionClass}>{words.openApp}</a>
        )}

        {selected && accountChoice === 'new' && <>
          <fieldset disabled={submitting || locked} className="space-y-5">
            <legend className="sr-only">{copy.personHeading}</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={copy.labels.firstName} name="firstName" autoComplete="given-name" />
              <Field label={copy.labels.lastName} name="lastName" autoComplete="family-name" />
              <Field label={copy.labels.email} name="email" type="email" autoComplete="email" />
              <Field label={copy.labels.phone} name="phoneNumber" type="tel" autoComplete="tel" />
              <Field label={copy.labels.password} name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
              <Field label={copy.labels.birthYear} name="bornYear" type="number" min="1900" max={String(new Date().getFullYear())} required={false} />
            </div>
            <Field label={words.team} name="teamName" autoComplete="organization" />
            {(!selected.targetAudience || !selected.targetGender) && <div className="grid gap-5 sm:grid-cols-2">
              {!selected.targetAudience && <label className="grid gap-2 text-sm font-medium">{words.teamType}<select name="teamType" className={controlClass}>{['INDIVIDUAL', 'DUO', 'SQUAD'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
              {!selected.targetGender && <label className="grid gap-2 text-sm font-medium">{words.gender}<select name="genderType" className={controlClass}>{['MALE', 'FEMALE', 'MIXED'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
            </div>}
            <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm leading-relaxed text-muted-foreground">
              <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />
              <span>{copy.termsPrefix} <a href={`https://www.challengenow.se/${locale}/privacy-policy`} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4">{copy.termsLink}</a>.</span>
            </label>
          </fieldset>

          {error && <p className="text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting} className={actionClass}>
            {submitting && <LoaderCircle size={18} className="animate-spin" />}
            {submitting ? copy.submitting : copy.submit}
          </button>
        </>}
      </>}
    </form>
  )
}

function Field({ label, name, required = true, ...props }: { label: string; name: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input name={name} required={required} className={controlClass} {...props} />
    </label>
  )
}
