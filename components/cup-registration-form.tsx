'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import { createAccountForRegistration, firebaseErrorCode, MIN_PASSWORD_LENGTH } from '@/lib/firebase'
import { formatPrice } from '@/lib/format'
import { registrationUrl } from '@/lib/registration'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { CupDivision, PaymentMethod, RegistrationReceipt } from '@/lib/types'
import { PaymentMethodList, ReceiptPayment } from '@/components/payment-details'

type Props = {
  /** The organizer's payment channels, shown beside the fee and on the receipt as a fallback. */
  paymentMethods?: PaymentMethod[]
  cupTitle: string
  currency?: string
  fallbackPrice?: number
  divisions: CupDivision[]
  registrationOpen?: boolean
  target?: 'event' | 'tournament' | 'league'
  guidedDoubles?: boolean
  locale: Locale
  dict: Dictionary
}


const controlClass = 'h-12 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-base font-normal text-ink transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60'
const actionClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 text-base font-bold text-white transition hover:bg-brand disabled:cursor-wait disabled:opacity-60'
const choiceClass = 'flex min-h-13 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-3 text-left transition hover:border-brand hover:bg-brand-tint/40 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand has-[:checked]:border-brand has-[:checked]:bg-brand sm:px-4'

type RegistrationResult = { registration?: { team?: { name?: string } }; receipt?: RegistrationReceipt | null }
const TEAM_TYPES = new Set(['INDIVIDUAL', 'SQUAD', 'DUO'])
const GENDER_TYPES = new Set(['MALE', 'FEMALE', 'MIXED'])

function isAvailable(division: CupDivision) {
  return !division.registrationClosed && (division.capacity == null || division.joined < division.capacity)
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `storefront-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function shuttleType(title: string): string {
  return title.match(/\b(nylon|feather)\b/i)?.[1].toLowerCase() ?? ''
}

export function CupRegistrationForm({ cupTitle, currency, fallbackPrice, divisions, registrationOpen = true, target = 'tournament', guidedDoubles = false, locale, dict, paymentMethods = [] }: Props) {
  const copy = dict.detail.registration
  const words = locale === 'sv' ? {
    level: 'Nivå', gender: 'Kön', all: 'Alla', noMatch: 'Inga klasser matchar dina filter.', reset: 'Visa alla',
    account: 'Har du ett ChallengeNow-konto?', existing: 'Ja, jag har ett konto', newAccount: 'Nej, jag är ny',
    newHint: 'När du slutför anmälan skapas ditt ChallengeNow-konto. Du kan sedan använda samma inloggning i appen för att följa tävlingen.',
    appHint: 'Fortsätt med ditt konto i appen för att slutföra anmälan. Har du inte appen öppnas spelarwebben.',
    openApp: 'Fortsätt i appen', done: 'Du är anmäld!', appInfo: 'Ditt konto är klart. Använd samma e-postadress och lösenord i appen för att följa din anmälan, matcher och resultat.',
    select: 'Välj klass', team: 'Lag- eller spelarnamn', teamType: 'Spelform',
    category: 'Kategori', shuttle: 'Bolltyp', chooseCategory: 'Välj kategori', chooseLevel: 'Välj nivå', chooseShuttle: 'Välj bolltyp',
    nylon: 'Nylonboll', feather: 'Fjäderboll', chooseFilters: 'Välj kategori, nivå och bolltyp för att se din klass.', chosenDivision: 'Din dubbelklass',
    entry: 'Din anmälan', entryHint: 'Välj den dubbelklass som passar er.', playerDetails: 'Spelaruppgifter', playerHint: 'Berätta vem som anmäler laget.', existingDetailsHint: 'Dina uppgifter hämtas från ditt ChallengeNow-konto.', accountStage: 'Ditt konto', finish: 'Slutför anmälan', finishHint: 'Skapa ditt konto för att följa anmälan, matcher och resultat.', existingSwitch: 'Har du redan ett konto? Använd det i stället', newSwitch: 'Ny här? Fyll i dina uppgifter i stället',
  } : {
    level: 'Level', gender: 'Gender', all: 'All', noMatch: 'No divisions match your filters.', reset: 'Show all',
    account: 'Do you have a ChallengeNow account?', existing: 'Yes, I have an account', newAccount: 'No, I am new',
    newHint: 'Completing your registration creates your ChallengeNow account. Use the same sign-in details in the app to follow the competition.',
    appHint: 'Continue with your account in the app to complete registration. If you do not have the app, the player website opens.',
    openApp: 'Continue in the app', done: 'You are registered!', appInfo: 'Your account is ready. Use the same email address and password in the app to follow your registration, matches and results.',
    select: 'Choose division', team: 'Team or player name', teamType: 'Format',
    category: 'Category', shuttle: 'Shuttle type', chooseCategory: 'Choose category', chooseLevel: 'Choose level', chooseShuttle: 'Choose shuttle type',
    nylon: 'Nylon shuttle', feather: 'Feather shuttle', chooseFilters: 'Choose a category, level and shuttle type to see your division.', chosenDivision: 'Your doubles division',
    entry: 'Your entry', entryHint: 'Choose the doubles division that fits your pair.', playerDetails: 'Player details', playerHint: 'Tell us who is registering the team.', existingDetailsHint: 'Your details come from your ChallengeNow account.', accountStage: 'Your account', finish: 'Complete your registration', finishHint: 'Create your account to follow your entry, matches and results.', existingSwitch: 'Already have an account? Use it instead', newSwitch: 'New here? Fill in your details instead',
  }
  const labels: Record<string, string> = locale === 'sv'
    ? { MALE: 'Herrar', FEMALE: 'Damer', MIXED: 'Mixed', BEGINNER: 'Nybörjare', INTERMEDIATE: 'Medel', PRO: 'Avancerad', ELITE: 'Avancerad', INDIVIDUAL: 'Singel', DUO: 'Dubbel', SQUAD: 'Lag' }
    : { MALE: 'Men', FEMALE: 'Women', MIXED: 'Mixed', BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', PRO: 'Advanced', ELITE: 'Advanced', INDIVIDUAL: 'Singles', DUO: 'Doubles', SQUAD: 'Team' }
  const [accountChoice, setAccountChoice] = useState<'new' | 'existing' | null>(guidedDoubles ? 'new' : null)
  const [registrationStage, setRegistrationStage] = useState<'details' | 'account'>('details')
  const [level, setLevel] = useState('')
  const [gender, setGender] = useState('')
  const [shuttle, setShuttle] = useState('')
  const pending = useRef<{ payload: Record<string, unknown> } | null>(null)
  const [locked, setLocked] = useState(false)
  const availableDivisions = useMemo(
    () => registrationOpen ? divisions.filter(isAvailable) : [],
    [divisions, registrationOpen],
  )
  const guidedSelection = guidedDoubles && availableDivisions.length > 0 && availableDivisions.every(division => shuttleType(division.title))
  const [divisionId, setDivisionId] = useState(() => guidedDoubles ? '' : String(availableDivisions[0]?.id ?? ''))
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegistrationResult | null>(null)
  const idempotencyKey = useRef<string | null>(null)
  const filtered = availableDivisions.filter(division => (!level || division.skillLevel === level) && (!gender || division.targetGender === gender) && (!guidedSelection || !shuttle || shuttleType(division.title) === shuttle))
  const selected = guidedSelection
    ? gender && level && shuttle ? (filtered.find(division => String(division.id) === divisionId) ?? filtered[0]) : undefined
    : (filtered.find(division => String(division.id) === divisionId) ?? filtered[0])
  const doublesCategory: Record<string, string> = locale === 'sv'
    ? { MALE: 'Herrdubbel', FEMALE: 'Dam dubbel', MIXED: 'Mixeddubbel' }
    : { MALE: "Men's doubles", FEMALE: "Women's doubles", MIXED: 'Mixed doubles' }
  const levels = [...new Set(availableDivisions.map(division => division.skillLevel).filter(Boolean))] as string[]
  const genders = [...new Set(availableDivisions.map(division => division.targetGender).filter(Boolean))] as string[]
  const shuttles = [...new Set(availableDivisions.map(division => shuttleType(division.title)).filter(Boolean))]
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
    if (guidedSelection && registrationStage === 'details') {
      setRegistrationStage('account')
      setError(null)
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
        {result.receipt
          ? <ReceiptPayment receipt={result.receipt} fallbackMethods={paymentMethods} locale={locale} freeLabel={dict.common.free} />
          : paymentMethods.length > 0 && (selected?.price ?? fallbackPrice ?? 0) > 0 && <div className="rounded-2xl border border-border bg-[#f6faf8] p-5 sm:p-6">
            <h4 className="text-lg font-black">{locale === 'sv' ? 'Betalning' : 'Payment'}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{locale === 'sv'
              ? `Anmälningsavgiften är ${formatPrice(selected?.price ?? fallbackPrice, currency, dict.common.free)}. Fullständiga betalningsuppgifter kommer i bekräftelsemejlet.`
              : `The entry fee is ${formatPrice(selected?.price ?? fallbackPrice, currency, dict.common.free)}. Full payment details are in your confirmation email.`}</p>
            <PaymentMethodList methods={paymentMethods} className="mt-4 sm:grid-cols-2" />
          </div>}
        {selected && <a href={registrationUrl(target, selected.id)} className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white transition hover:bg-brand">{words.openApp}</a>}
      </div>
    )
  }

  if (availableDivisions.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.noAvailableDivisions}</p>
  }

  return (
    <form onSubmit={submit} className={`space-y-7 sm:space-y-8 ${guidedSelection ? 'mx-auto max-w-6xl' : ''}`}>
      {guidedSelection && <>
        <div className="border-t border-border pt-8">
          <h3 className="text-xl font-black tracking-tight text-ink"><span className="mr-2 text-brand">1.</span>{locale === 'sv' ? 'Välj din klass' : 'Choose your division'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{words.entryHint}</p>
        </div>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10">
        <fieldset disabled={submitting || locked} className="space-y-6">
          <legend className="sr-only">{words.select}</legend>
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-ink">{words.category}</legend>
            <div className="grid grid-cols-3 gap-2">
              {genders.map(value => <label key={value} className={`${choiceClass} justify-center text-center sm:justify-between sm:text-left`}>
                <input type="radio" name="entryCategory" value={value} checked={gender === value} onChange={() => { setGender(value); setDivisionId(''); idempotencyKey.current = null }} className="sr-only" />
                <span className={`break-words text-sm font-semibold sm:text-base ${gender === value ? 'text-white' : 'text-ink'}`}>{labels[value] ?? value}</span>
                {gender === value && <CheckCircle2 size={18} className="hidden shrink-0 text-white sm:block" aria-hidden="true" />}
              </label>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-ink">{words.level}</legend>
            <div className="grid grid-cols-3 gap-2">
              {levels.map(value => <label key={value} className={`${choiceClass} justify-center text-center sm:justify-between sm:text-left`}>
                <input type="radio" name="entryLevel" value={value} checked={level === value} onChange={() => { setLevel(value); setDivisionId(''); idempotencyKey.current = null }} className="sr-only" />
                <span className={`text-sm font-semibold sm:text-base ${level === value ? 'text-white' : 'text-ink'}`}>{labels[value] ?? value}</span>
                {level === value && <CheckCircle2 size={18} className="hidden shrink-0 text-white sm:block" aria-hidden="true" />}
              </label>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-ink">{words.shuttle}</legend>
            <div className="grid grid-cols-2 gap-2">
              {shuttles.map(value => {
                const pricedDivision = gender && level ? availableDivisions.find(division => division.targetGender === gender && division.skillLevel === level && shuttleType(division.title) === value) : undefined
                return <label key={value} className={`${choiceClass} flex-col items-start justify-center sm:flex-row sm:items-center sm:justify-between`}>
                  <input type="radio" name="entryShuttle" value={value} checked={shuttle === value} onChange={() => { setShuttle(value); setDivisionId(''); idempotencyKey.current = null }} className="sr-only" />
                  <span className={`text-sm font-semibold sm:text-base ${shuttle === value ? 'text-white' : 'text-ink'}`}>{value === 'nylon' ? words.nylon : words.feather}</span>
                  <span className={`flex shrink-0 items-center gap-2 text-sm font-bold ${shuttle === value ? 'text-white' : 'text-brand'}`}>
                    {pricedDivision && formatPrice(pricedDivision.price ?? fallbackPrice, currency, dict.common.free)}
                    {shuttle === value && <CheckCircle2 size={19} aria-hidden="true" />}
                  </span>
                </label>
              })}
            </div>
          </fieldset>
        </fieldset>
        <aside className="h-fit rounded-xl bg-[#ebf7f3] p-5 sm:p-6" aria-live="polite">
          <h4 className="text-lg font-black text-ink">{words.chosenDivision}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{locale === 'sv' ? 'Baserat på dina val.' : 'Based on your choices.'}</p>
        {selected ? <div className="mt-6" role="status">
          <div>
            <strong className="block text-base text-ink">{[
              doublesCategory[selected.targetGender ?? ''] ?? labels[selected.targetGender ?? ''],
              labels[selected.skillLevel ?? ''],
              shuttleType(selected.title) === 'nylon' ? words.nylon : words.feather,
            ].filter(Boolean).join(' · ')}</strong>
            {selected.capacity != null && <span className="mt-2 block text-xs text-muted-foreground">{copy.spotsLeft.replace('{0}', String(Math.max(0, selected.capacity - selected.joined)))}</span>}
          </div>
          <div className="mt-5 border-t border-border pt-4"><span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{locale === 'sv' ? 'Anmälningsavgift' : 'Entry fee'}</span><strong className="mt-1 block text-xl text-ink">{formatPrice(selected.price ?? fallbackPrice, currency, dict.common.free)}</strong></div>
        </div> : <p className="mt-6 text-sm leading-relaxed text-muted-foreground" role="status">{gender && level && shuttle ? words.noMatch : words.chooseFilters}</p>}
        {paymentMethods.length > 0 && <div className="mt-5 border-t border-border pt-4">
          <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{locale === 'sv' ? 'Så betalar du' : 'How to pay'}</span>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{locale === 'sv' ? 'Du får belopp och referens efter anmälan.' : 'You get the amount and reference after registering.'}</p>
          <PaymentMethodList methods={paymentMethods} className="mt-3" />
        </div>}
        </aside>
        </div>

        <div className="border-t border-border pt-8">
          <h3 className="text-xl font-black tracking-tight text-ink"><span className="mr-2 text-brand">2.</span>{words.playerDetails}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{accountChoice === 'existing' ? words.existingDetailsHint : (locale === 'sv' ? 'Ditt ChallengeNow-konto skapas när du anmäler dig.' : 'Your ChallengeNow account is created when you register.')}</p>
        </div>
        <fieldset id="player-registration-details" disabled={submitting || locked || accountChoice === 'existing'} className={accountChoice === 'new' ? 'space-y-5' : 'hidden'}>
          <legend className="sr-only">{copy.personHeading}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={copy.labels.firstName} name="firstName" autoComplete="given-name" />
            <Field label={copy.labels.lastName} name="lastName" autoComplete="family-name" />
            <Field label={copy.labels.email} name="email" type="email" autoComplete="email" />
            <Field label={copy.labels.phone} name="phoneNumber" type="tel" autoComplete="tel" />
          </div>
          <Field label={locale === 'sv' ? 'Namn på ert dubbelpar' : 'Name for your doubles pair'} name="teamName" autoComplete="organization" />
          {selected && (!selected.targetAudience || !selected.targetGender) && <div className="grid gap-4 sm:grid-cols-2">
            {!selected.targetAudience && <label className="grid gap-2 text-sm font-medium">{words.teamType}<select name="teamType" className={controlClass}>{['INDIVIDUAL', 'DUO', 'SQUAD'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
            {!selected.targetGender && <label className="grid gap-2 text-sm font-medium">{words.gender}<select name="genderType" className={controlClass}>{['MALE', 'FEMALE', 'MIXED'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>}
          </div>}
        </fieldset>

        {accountChoice === 'new' && registrationStage === 'details' && <button type="submit" disabled={!selected} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-black text-ink transition hover:bg-[#cde759] disabled:cursor-not-allowed disabled:opacity-50">{locale === 'sv' ? 'Fortsätt till konto' : 'Continue to account'}<ArrowRight size={18} aria-hidden="true" /></button>}
        <button type="button" aria-controls="player-registration-details" aria-expanded={accountChoice === 'new'} onClick={() => { setAccountChoice(accountChoice === 'existing' ? 'new' : 'existing'); setRegistrationStage('details'); setError(null) }} className="block w-fit cursor-pointer text-left text-sm font-semibold text-brand underline underline-offset-4 transition hover:text-ink">
          {accountChoice === 'existing' ? words.newSwitch : words.existingSwitch}
        </button>

        {accountChoice === 'existing' && selected && <a href={registrationUrl(target, selected.id)} className={`${actionClass} w-full`}>{words.openApp}</a>}
        {accountChoice === 'existing' && !selected && <p className="text-sm text-muted-foreground">{words.chooseFilters}</p>}
        {accountChoice === 'new' && registrationStage === 'account' && <>
          <div className="border-t border-border pt-7">
            <h3 className="text-xl font-black text-ink"><span className="mr-2 text-brand">3.</span>{locale === 'sv' ? 'Skapa ditt konto' : 'Create your account'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{locale === 'sv' ? 'Välj ett lösenord för att kunna följa din anmälan.' : 'Choose a password so you can follow your registration.'}</p>
          </div>
          <Field label={copy.labels.password} name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />
            <span>{copy.termsPrefix} <a href={`https://www.challengenow.se/${locale}/privacy-policy`} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4">{copy.termsLink}</a>.</span>
          </label>
          {error && <p className="text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting || !selected} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-base font-black text-ink transition hover:bg-[#cde759] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting && <LoaderCircle size={18} className="animate-spin" />}
            {submitting ? copy.submitting : copy.submit}
          </button>
          <button type="button" onClick={() => setRegistrationStage('details')} className="ml-4 text-sm font-semibold text-brand underline underline-offset-4">{locale === 'sv' ? 'Ändra uppgifter' : 'Edit details'}</button>
        </>}
      </>}
      {!guidedSelection && divisions.length > 1 && <fieldset disabled={submitting || locked} className="space-y-5 sm:space-y-6">
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
            <div className="border-b border-border bg-[#f7faf7] px-4 py-3.5 text-sm font-black uppercase tracking-widest text-brand sm:px-5 sm:py-4">
              {labels[group.format] || (locale === 'sv' ? 'Övriga klasser' : 'Other divisions')}
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {group.items.map((division, index) => <label key={division.id} className={`flex cursor-pointer items-start gap-3 bg-white p-4 transition hover:bg-brand-tint has-[:checked]:bg-brand-tint sm:gap-4 sm:p-5 ${group.items.length % 2 === 1 && index === group.items.length - 1 ? 'sm:col-span-2' : ''}`}>
                <input type="radio" name="division" value={division.id} checked={selected?.id === division.id}
                  onChange={() => { setDivisionId(String(division.id)); idempotencyKey.current = null }}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--brand)]" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-base text-ink">{division.title}</strong>
                  <span className="mt-1 block text-sm text-muted-foreground">{[division.targetGender, division.skillLevel].filter(Boolean).map(value => labels[value!] ?? value).join(' · ')}</span>
                  {division.capacity != null && <span className="mt-1 block text-xs text-muted-foreground">{copy.spotsLeft.replace('{0}', String(Math.max(0, division.capacity - division.joined)))}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-accent/60 px-3 py-1 text-sm font-bold text-ink">{formatPrice(division.price ?? fallbackPrice, currency, dict.common.free)}</span>
              </label>)}
            </div>
          </div>
        ))}
      </fieldset>}

      {!guidedSelection && <fieldset disabled={submitting || locked} className="border-t border-border pt-6 sm:pt-7">
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
      </fieldset>}

      {!guidedSelection && accountChoice && <>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {accountChoice === 'new' ? words.newHint : words.appHint}
        </p>

        {selected && !guidedSelection && <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-5 text-sm" aria-live="polite">
          <span className="text-muted-foreground">{locale === 'sv' ? 'Anmälningsavgift' : 'Entry fee'}</span>
          <span className="font-semibold">{formatPrice(selected.price ?? fallbackPrice, currency, dict.common.free)}
            {selected.capacity != null && <span className="ml-3 font-normal text-muted-foreground">{copy.spotsLeft.replace('{0}', String(Math.max(0, selected.capacity - selected.joined)))}</span>}
          </span>
        </div>}
        {selected && (selected.price ?? fallbackPrice ?? 0) > 0 && <PaymentMethodList methods={paymentMethods} className="sm:grid-cols-2" />}

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
            <Field label={guidedDoubles ? (locale === 'sv' ? 'Lagnamn för dubbel' : 'Doubles team name') : words.team} name="teamName" autoComplete="organization" />
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
