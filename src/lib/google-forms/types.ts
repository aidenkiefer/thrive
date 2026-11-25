/**
 * Google Forms launch tooling: shared types (issue #151, contract C1).
 *
 * Three local files drive the operator CLI:
 *   - templates (config/google-forms/templates/<key>.v<n>.json): reusable, versioned question sets
 *   - launch file (config/google-forms/launch.json): which canonical entity gets which template,
 *     with owner-supplied title/description
 *   - manifest (config/google-forms/manifest.json): what the CLI created in Google (C1 contract)
 *
 * Pure types only. No Next, Supabase or Node imports, so public code can import the C1 types.
 */

export const TEMPLATE_KINDS = ['event', 'group'] as const
export type TemplateKind = (typeof TEMPLATE_KINDS)[number]

/** Entity namespaces. `sandbox:` is for the owner-assisted live check and never links publicly. */
export const ENTITY_TYPES = ['event', 'group', 'sandbox'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const QUESTION_TYPES = ['shortText', 'paragraph', 'radio', 'checkbox', 'dropdown'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Values of the Forms API FormSettings.emailCollectionType we allow templates to choose. */
export const EMAIL_COLLECTION_TYPES = ['DO_NOT_COLLECT', 'VERIFIED', 'RESPONDER_INPUT'] as const
export type EmailCollectionType = (typeof EMAIL_COLLECTION_TYPES)[number]

export interface TemplateQuestion {
  key: string
  title: string
  description?: string
  type: QuestionType
  required: boolean
  /** Only for radio / checkbox / dropdown. */
  options?: string[]
}

export interface TemplateApproval {
  status: 'draft' | 'approved'
  /** A role such as "owner"; never a fabricated name. Required when approved. */
  approvedBy: string | null
  /** YYYY-MM-DD. Required when approved. */
  approvedOn: string | null
  notes?: string
}

export interface FormTemplate {
  templateKey: string
  templateVersion: number
  kind: TemplateKind
  approval: TemplateApproval
  settings: { emailCollectionType: EmailCollectionType }
  questions: TemplateQuestion[]
}

export interface LaunchEntry {
  /** `<event|group|sandbox>:<slug>`; the canonical entity this form belongs to. */
  entityKey: string
  templateKey: string
  templateVersion: number
  /** Owner-supplied respondent-facing title. */
  title: string
  /** Owner-supplied respondent-facing description. Optional. */
  description?: string
  /** When true the CLI publishes the form (accepting responses) after configuring it. */
  publish: boolean
}

export interface LaunchFile {
  launchVersion: 1
  forms: LaunchEntry[]
}

/**
 * Management state of a recorded form.
 *   planned    listed for launch, nothing created yet (formId null)
 *   creating   a create call was sent but its result was not recorded; never auto-retried
 *   created    the form exists in Google (unpublished) but template content is not applied yet
 *   configured template content applied; not published
 *   published  published and accepting responses; responderUrl recorded
 */
export const PUBLICATION_STATES = ['planned', 'creating', 'created', 'configured', 'published'] as const
export type PublicationState = (typeof PUBLICATION_STATES)[number]

/** Contract C1: one recorded form. No credentials, editor URLs or response data, ever. */
export interface ManifestEntry {
  entityKey: string
  templateKey: string
  templateVersion: number
  formId: string | null
  /** Public hosted respondent URL (docs.google.com/forms/d/e/.../viewform). Only set when published. */
  responderUrl: string | null
  publicationState: PublicationState
  /** Hash of the applied title/description/settings/questions; detects template drift. */
  contentHash: string | null
  /** Opaque Forms revision after the CLI's last content write; detects edits made in Google. */
  revisionId: string | null
  /** ISO timestamp of the last CLI write to this entry. */
  updatedAt: string | null
}

export interface Manifest {
  manifestVersion: 1
  /** True only on example/test manifests. The CLI refuses to execute against a fixture manifest. */
  fixture?: boolean
  forms: ManifestEntry[]
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] }
