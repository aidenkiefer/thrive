import Link from 'next/link'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui'
import { Band } from './Band'
import { CardGrid, InfoCard } from './CardGrid'
import { CtaBand } from './CtaBand'
import { FeatureSplit } from './FeatureSplit'
import { MapEmbed } from './MapEmbed'
import { PendingNote } from './PendingNote'
import { PeopleGrid, PersonCard } from './PersonCard'
import { Photo } from './Photo'
import { PullQuote } from './PullQuote'
import { SectionIntro } from './SectionIntro'
import { Step, StepList } from './StepList'
import * as Icons from './icons'
import { NewsletterSignup } from '@/components/forms/NewsletterSignup'

function SmartLink({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    )
  }
  const external = href.startsWith('http')
  return (
    <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}

/**
 * Components available inside content/pages/*.mdx.
 * Pass to compileMDX({ components: mdxComponents }).
 */
export const mdxComponents = {
  a: SmartLink,
  Band,
  SectionIntro,
  FeatureSplit,
  Photo,
  StepList,
  Step,
  PullQuote,
  PersonCard,
  PeopleGrid,
  CardGrid,
  InfoCard,
  MapEmbed,
  PendingNote,
  CtaBand,
  Button,
  NewsletterSignup,
  ...Icons,
}
