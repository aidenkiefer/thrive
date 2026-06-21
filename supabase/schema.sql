-- Thrive Vineyard — Supabase Schema
-- Source of truth: docs/05-content-models.md
-- Apply via Supabase dashboard SQL editor or `supabase db push`
-- After applying: npx supabase gen types typescript --local > src/lib/supabase/types.ts

-- =============================================================================
-- SERMON SYSTEM
-- =============================================================================

create table if not exists speakers (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  title           text,
  bio             text,
  photo_url       text,
  email           text,
  created_at      timestamptz default now()
);

create table if not exists sermon_series (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  thumbnail_url   text,
  start_date      date,
  end_date        date,
  -- SEO
  seo_title       text,
  seo_description text,
  og_image_url    text,
  published_at    timestamptz,
  created_at      timestamptz default now()
);

create table if not exists sermons (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  title                 text not null,
  description           text,
  speaker_id            uuid references speakers(id),
  series_id             uuid references sermon_series(id),
  scripture_references  text[],
  audio_url             text,
  video_url             text,
  youtube_url           text,
  thumbnail_url         text,
  duration_seconds      int,
  preached_at           date not null,
  location              text,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists sermons_preached_at_idx on sermons(preached_at desc);
create index if not exists sermons_published_at_idx on sermons(published_at);

-- =============================================================================
-- EVENTS
-- =============================================================================

create table if not exists recurring_events (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,
  name                    text not null,
  description             text,
  short_summary           text,
  category                text,
  recurrence_description  text,   -- Human-readable: "First Saturday of the month"
  typical_time            text,   -- Human-readable: "7:00 PM"
  location                text,
  leader                  text,
  contact_email           text,
  contact_phone           text,
  featured_image_url      text,
  gallery_urls            text[],
  video_urls              text[],
  churchsuite_form_url    text,
  -- SEO
  seo_title               text,
  seo_description         text,
  og_image_url            text,
  published_at            timestamptz,
  created_at              timestamptz default now()
);

create table if not exists event_occurrences (
  id                  uuid primary key default gen_random_uuid(),
  recurring_event_id  uuid not null references recurring_events(id) on delete cascade,
  start_datetime      timestamptz not null,
  end_datetime        timestamptz,
  location            text,   -- Overrides recurring_event.location if set
  notes               text,
  cancelled           boolean default false,
  created_at          timestamptz default now()
);

create index if not exists event_occurrences_start_datetime_idx on event_occurrences(start_datetime);
create index if not exists event_occurrences_recurring_event_id_idx on event_occurrences(recurring_event_id);

create table if not exists one_time_events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  category              text,
  start_datetime        timestamptz not null,
  end_datetime          timestamptz,
  location              text,
  leader                text,
  contact_email         text,
  featured_image_url    text,
  churchsuite_form_url  text,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists one_time_events_start_datetime_idx on one_time_events(start_datetime);

-- =============================================================================
-- GROUPS & MINISTRIES
-- =============================================================================

create table if not exists groups (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  category              text,   -- 'small-group', 'connect-group', 'youth', etc.
  meeting_schedule      text,   -- Human-readable: "Tuesdays at 7 PM"
  location              text,
  leader                text,
  contact_email         text,
  contact_phone         text,
  featured_image_url    text,
  churchsuite_form_url  text,
  is_open               boolean default true,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create table if not exists ministries (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  description         text,
  short_summary       text,
  leader              text,
  contact_email       text,
  featured_image_url  text,
  -- SEO
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  published_at        timestamptz,
  created_at          timestamptz default now()
);

-- =============================================================================
-- ANNOUNCEMENTS
-- =============================================================================

create table if not exists announcements (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  body                  text,
  cta_text              text,
  cta_url               text,
  featured_image_url    text,
  is_homepage_feature   boolean default false,
  expires_at            timestamptz,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

create index if not exists announcements_homepage_idx on announcements(is_homepage_feature, expires_at, published_at);

-- =============================================================================
-- STAFF
-- =============================================================================

create table if not exists staff (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  title           text,
  bio             text,
  photo_url       text,
  email           text,
  phone           text,
  display_order   int,
  created_at      timestamptz default now()
);

create index if not exists staff_display_order_idx on staff(display_order);

-- =============================================================================
-- LANDING PAGES (Google Ads campaigns)
-- =============================================================================

create table if not exists landing_pages (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,   -- Root-level URL: /[slug]
  title               text not null,          -- Internal name
  hero_heading        text,
  hero_subheading     text,
  hero_image_url      text,
  body_content        text,                   -- Rich text / markdown
  cta_text            text,
  cta_url             text,
  -- Link to a canonical entity (optional — pulls description, image, form URL)
  linked_entity_type  text check (linked_entity_type in ('recurring_event', 'one_time_event', 'group', 'ministry')),
  linked_entity_id    uuid,
  -- SEO
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  published_at        timestamptz,
  created_at          timestamptz default now()
);

-- =============================================================================
-- OUTREACH
-- =============================================================================

create table if not exists outreach (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  name                  text not null,
  description           text,
  short_summary         text,
  featured_image_url    text,
  contact_email         text,
  volunteer_signup_url  text,
  churchsuite_form_url  text,
  is_ongoing            boolean default false,
  start_date            date,
  end_date              date,
  -- SEO
  seo_title             text,
  seo_description       text,
  og_image_url          text,
  published_at          timestamptz,
  created_at            timestamptz default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Public: read published records only
-- Admin: full access via service role key (bypasses RLS)
-- =============================================================================

alter table speakers enable row level security;
alter table sermon_series enable row level security;
alter table sermons enable row level security;
alter table recurring_events enable row level security;
alter table event_occurrences enable row level security;
alter table one_time_events enable row level security;
alter table groups enable row level security;
alter table ministries enable row level security;
alter table announcements enable row level security;
alter table staff enable row level security;
alter table landing_pages enable row level security;
alter table outreach enable row level security;

-- Public read: only published records (published_at IS NOT NULL)
-- Speakers and staff have no published_at — always readable

create policy "public_read_speakers" on speakers for select using (true);
create policy "public_read_staff" on staff for select using (true);

create policy "public_read_sermon_series" on sermon_series for select using (published_at is not null);
create policy "public_read_sermons" on sermons for select using (published_at is not null);
create policy "public_read_recurring_events" on recurring_events for select using (published_at is not null);
create policy "public_read_event_occurrences" on event_occurrences for select using (cancelled = false);
create policy "public_read_one_time_events" on one_time_events for select using (published_at is not null);
create policy "public_read_groups" on groups for select using (published_at is not null);
create policy "public_read_ministries" on ministries for select using (published_at is not null);
create policy "public_read_announcements" on announcements for select using (
  published_at is not null
  and (expires_at is null or expires_at > now())
);
create policy "public_read_landing_pages" on landing_pages for select using (published_at is not null);
create policy "public_read_outreach" on outreach for select using (published_at is not null);

-- =============================================================================
-- SCHEMA PATCH: Sprint 01 additions
-- Apply after initial schema creation.
-- After applying: npx supabase gen types typescript --local > src/lib/supabase/types.ts
-- =============================================================================

alter table sermons add column if not exists topics text[];
alter table sermons add column if not exists service_type text default 'Sunday Service';
alter table recurring_events add column if not exists venue text;
alter table one_time_events add column if not exists venue text;
