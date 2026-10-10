import { Layers3, UsersRound, BarChart3, Feather } from 'lucide-react'
import type { Activity, Cup } from '@/lib/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { CUP_ID } from '@/lib/brand'

const genderNames: Record<string, { en: string; sv: string }> = {
  MALE: { en: 'Men', sv: 'Herrar' },
  FEMALE: { en: 'Women', sv: 'Damer' },
  MIXED: { en: 'Mixed', sv: 'Mixed' },
  OPEN: { en: 'Open', sv: 'Öppen' },
}
const levelNames: Record<string, { en: string; sv: string }> = {
  BEGINNER: { en: 'Beginner', sv: 'Nybörjare' },
  INTERMEDIATE: { en: 'Intermediate', sv: 'Medel' },
  ADVANCED: { en: 'Advanced', sv: 'Avancerad' },
  ELITE: { en: 'Advanced', sv: 'Avancerad' },
  PRO: { en: 'Advanced', sv: 'Avancerad' },
}

export function CupInformation({ cup, locale }: {
  cup: Cup; activities?: Activity[]; locale: Locale; dict: Dictionary
}) {
  const genders = [...new Set(cup.divisions.map(division => genderNames[division.targetGender || '']?.[locale]).filter(Boolean))]
  const levels = [...new Set(cup.divisions.map(division => levelNames[division.skillLevel || '']?.[locale]).filter(Boolean))]
  const shuttles = [...new Set(cup.divisions.map(division => division.title.match(/\b(nylon|feather)\b/i)?.[1]?.toLowerCase()).filter(Boolean))]
  const isGaruda = cup.id === CUP_ID
  // Garuda Open markets all classes as doubles; some feather divisions currently use SQUAD internally.
  const doubles = isGaruda || (cup.divisions.length > 0 && cup.divisions.every(division => division.targetAudience === 'DUO'))
  const facts = [
    { icon: UsersRound, title: locale === 'sv' ? 'Spelform' : 'Format', detail: doubles ? (locale === 'sv' ? 'Dubbel för två spelare' : 'Doubles for two players') : `${cup.divisions.length} ${locale === 'sv' ? 'klasser' : 'divisions'}` },
    { icon: Layers3, title: locale === 'sv' ? 'Kategorier' : 'Categories', detail: genders.join(' · ') || (locale === 'sv' ? 'Se klasserna nedan' : 'See divisions below') },
    { icon: BarChart3, title: locale === 'sv' ? 'Nivåer' : 'Skill levels', detail: levels.join(' · ') || (locale === 'sv' ? 'Se klasserna nedan' : 'See divisions below') },
    { icon: Feather, title: locale === 'sv' ? 'Bolltyp' : 'Shuttle type', detail: shuttles.length ? shuttles.map(value => value === 'nylon' ? (locale === 'sv' ? 'Nylon' : 'Nylon') : (locale === 'sv' ? 'Fjäder' : 'Feather')).join(' · ') : (locale === 'sv' ? 'Beror på klass' : 'Varies by division') },
  ]

  return <section id="cup-information" aria-labelledby="cup-information-heading" className="scroll-mt-24 border-y border-border bg-[#eaf7f3] py-8 sm:py-10">
    <div className="page-container">
      <h2 id="cup-information-heading" className="text-2xl font-black tracking-tight text-ink">{locale === 'sv' ? 'Innan du anmäler dig' : 'Before you register'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{isGaruda
        ? (locale === 'sv' ? 'Det här hjälper dig att välja rätt dubbelklass.' : 'What you need to choose the right doubles division.')
        : (locale === 'sv' ? 'Välj den klass som passar dig.' : 'Choose the division that fits you.')}</p>
      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {facts.map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-start gap-3">
          <Icon size={25} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
          <div><h3 className="text-sm font-bold text-ink">{title}</h3><p className="mt-1 text-sm leading-snug text-muted-foreground">{detail}</p></div>
        </div>)}
      </div>
    </div>
  </section>
}
