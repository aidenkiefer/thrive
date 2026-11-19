import { Container } from '@/components/ui'

interface CtaBandProps {
  title: string
  children?: React.ReactNode
  actions: React.ReactNode
}

export function CtaBand({ title, children, actions }: CtaBandProps) {
  return (
    <section className="bg-brand-900 py-16 text-white md:py-20">
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
