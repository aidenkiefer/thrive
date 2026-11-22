import Image from 'next/image'
import { Container } from '@/components/ui'

interface CtaBandProps {
  title: string
  children?: React.ReactNode
  actions: React.ReactNode
}

export function CtaBand({ title, children, actions }: CtaBandProps) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 py-16 text-white md:py-24">
      <div aria-hidden="true" className="absolute left-1/2 top-0 -z-10 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-400/20 blur-3xl" />
      <Image
        src="/images/brand/thrive-mark.webp"
        alt=""
        width={512}
        height={512}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-72 w-72 opacity-[0.05]"
      />
      <Container>
        <div className="reveal mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
          {children ? (
            // MDX wraps the lead in its own <p>. A <p> here nests them, and the
            // browser rewrites that before hydration (React error 418).
            <div className="mt-4 text-lg leading-relaxed text-white/80 [&_p]:m-0">{children}</div>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </Container>
    </section>
  )
}
