import type { Dictionary } from '@/lib/i18n'
import { BarChart3, ClipboardCheck, ShieldCheck, UsersRound } from 'lucide-react'

export function PlatformSection({ dict }: { dict: Dictionary }) {
  const features = [
    { icon: BarChart3, title: dict.platform.resultsTitle, text: dict.platform.resultsText },
    { icon: ClipboardCheck, title: dict.platform.matchesTitle, text: dict.platform.matchesText },
    { icon: UsersRound, title: dict.platform.teamsTitle, text: dict.platform.teamsText },
  ]

  return (
    <section className="page-container py-10 sm:py-12">
      <div className="overflow-hidden rounded-[2rem] border border-brand/15 bg-white shadow-card">
        <div className="grid gap-8 border-b border-border bg-brand-tint px-6 py-9 sm:px-10 lg:grid-cols-[1fr_.8fr] lg:items-end lg:px-12">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand"><ShieldCheck size={16} />{dict.platform.eyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">{dict.platform.title}</h2>
          </div>
          <p className="max-w-xl leading-relaxed text-muted-foreground lg:justify-self-end">{dict.platform.description}</p>
        </div>
        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-6 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white"><Icon size={23} /></span>
              <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
