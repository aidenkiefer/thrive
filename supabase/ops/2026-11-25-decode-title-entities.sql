-- =============================================================================
-- Decode WordPress HTML entities left in sermon and series text by the import.
--
-- Public pages render these literally, e.g. "Harvest &amp; Hope - Kevin Kiefer".
-- Read-only audit, 2026-11-25:
--   sermons.title             25 rows (only &amp; and &#039; occur)
--   sermon_series.title/desc   1 row
--   sermons.description, seo_title, seo_description, events, groups: 0 rows
--   publication_events: 0 rows, so no affected row was edited by staff
--
-- Text replacement only: slugs, published_at and every other column stay as
-- they are, and no row is inserted or deleted. Idempotent: a second run
-- matches 0 rows. Apply only under rule 3 of docs/ops/supabase-live-project.md.
-- =============================================================================

begin;

update public.sermons
set title = replace(replace(title, '&amp;', '&'), '&#039;', '''')
where title ~ '&(amp|#039);';
-- expect: UPDATE 25

update public.sermon_series
set title       = replace(replace(title, '&amp;', '&'), '&#039;', ''''),
    description = replace(replace(description, '&amp;', '&'), '&#039;', '''')
where title || coalesce(description, '') ~ '&(amp|#039);';
-- expect: UPDATE 1

commit;

-- Verification (expect 0 | 0):
-- select (select count(*) from public.sermons where title ~ '&[a-z#0-9]+;') as sermons,
--        (select count(*) from public.sermon_series where title || coalesce(description, '') ~ '&[a-z#0-9]+;') as series;
