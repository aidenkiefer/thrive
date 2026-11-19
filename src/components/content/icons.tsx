import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  }
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

export function CoffeeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3v3M12 3v3" />
    </svg>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 14.2c2.6.2 4.5 2.4 4.5 5.3" />
    </svg>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.8 5 3.2-5 3.2V8.8Z" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function ChildIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 21v-4a6 6 0 0 1 12 0v4" />
      <path d="M9 14.5 7 12M15 14.5l2-2.5" />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.8, ...props })}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg {...base({ fill: 'currentColor', stroke: 'none', ...props })}>
      <path d="M9.5 6C6.5 7 4 9.8 4 13.5V18h6v-6H7c0-2 1.2-3.4 3-4l-.5-2Zm9 0c-3 1-5.5 3.8-5.5 7.5V18h6v-6h-3c0-2 1.2-3.4 3-4l-.5-2Z" />
    </svg>
  )
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M2.5 9h19v-3h-19zM12 6v14" />
      <path d="M12 6c-1.5-3-5.5-3-5.5-.5S10 6 12 6Zm0 0c1.5-3 5.5-3 5.5-.5S14 6 12 6Z" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2, ...props })}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}
