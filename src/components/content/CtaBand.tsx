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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
          {children ? <p className="mt-4 text-lg leading-relaxed text-white/80">{children}</p> : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </Container>
    </section>
  )
}
