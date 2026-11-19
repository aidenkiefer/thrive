-- =============================================================================
-- Batch A for #101: owner answers of 2026-11-19, run once, before the seed.
--
-- 1. Unpublish the stale Express(o) "pause" announcement.
-- 2. Groups mirror the "Find A Group" cards on https://thrivevineyard.com/groups/
--    (read 2026-11-19). Text is copied as published there, contacts included
--    (owner). Alpha is not a card there: unpublished. Outreach joy-drop and
--    pack-the-pantry have no source: unpublished until staff write them.
-- 3. Unpublish the stale one-time youth row (it would hide the recurring one).
-- 4. The 8 past family-worship-service occurrences stay.
--
-- Unpublish = published_at null; no row is deleted. Category is left as is on
-- existing rows and null on new ones (staff set it in the CMS).
-- =============================================================================

begin;

update announcements set published_at = null
  where title = 'Express(o) Service Renovation Pause' and published_at is not null;

update one_time_events set published_at = null
  where slug = 'thrive-youth-thursday-nights' and published_at is not null;

update groups set published_at = null
  where slug = 'alpha' and published_at is not null;

update outreach set published_at = null
  where slug in ('joy-drop', 'pack-the-pantry') and published_at is not null;

update groups set
  name = 'Contend Prayer Group',
  description = $t$Join us in a night of prayer, lifting up and contending for what's on the heart of God. Welcoming the Holy Spirit, his direction and gifts. There will also be food and a time of worship. Child care is not provided, however children are welcome with supervision!$t$,
  short_summary = $t$Join us in a night of prayer, lifting up and contending for what's on the heart of God.$t$,
  meeting_schedule = 'Fridays at 7:00 PM'
  where slug = 'contend-prayer-group';

update groups set
  name = 'Married''s Small Group',
  description = $t$Join the Chandlers (and gracious hosts, the Popescus) every Friday evening—6:00pm for snacks and fellowship, hard start at 6:30pm—to unpack the previous Sunday's sermon and pray for one another. Childcare provided! Please reach out to Luke at luke.chandler@gmail.com$t$,
  short_summary = $t$Join the Chandlers every Friday evening to unpack the previous Sunday's sermon and pray for one another. Childcare provided!$t$,
  meeting_schedule = 'Fridays, 6:00–7:30 PM',
  contact_email = 'luke.chandler@gmail.com'
  where slug = 'marrieds-small-group';

insert into groups (slug, name, description, short_summary, meeting_schedule, contact_phone, published_at) values
  ('youth-group', 'Youth Group',
   $t$Come hang out, eat some great food, and have real conversations about life, faith, and meaning at Youth Alpha. No pressure. No judgment. Just a space to ask questions, share your thoughts, and explore what you believe. Bring your friends, bring your questions, and find some answers. If you're in middle or high school, feel free to join us in sitting in the front two rows on the right side during Sunday Service!$t$,
   $t$Come hang out, eat some great food, and have real conversations about life, faith, and meaning. No pressure. No judgment.$t$,
   '2nd and 4th Thursdays, 6:30–8:00 PM', null, now()),
  ('spiritual-warfare', 'Spiritual Warfare',
   $t$Join Thrive for a powerful time of training and equipping in Spiritual Warfare and Deliverance prayer. Together, we'll dive into Defeating Dark Angels by Charles H. Kraft and grow in both understanding and practice. For more information, contact Erin at 630-391-2804$t$,
   $t$Join Thrive for a powerful time of training and equipping in Spiritual Warfare and Deliverance prayer.$t$,
   '1st and 3rd Thursdays, 6:30–8:30 PM', '630-391-2804', now()),
  ('discovery-womens-bible-study', 'Discovery! Women''s Bible Study',
   $t$God is doing something more in you - discover it! Join this weekly women's group with brunch, bible study & prayer, for a time of fellowship, exploration, and encouragement! Join us Wednesdays September 2nd through December 16th!$t$,
   $t$God is doing something more in you - discover it! A weekly women's group with brunch, bible study & prayer.$t$,
   'Wednesdays, September 2 – December 16', null, now())
  on conflict (slug) do nothing;

commit;

-- Verification (expect: 0, 0, published groups = the 5 slugs below, outreach 0):
-- select count(*) from announcements where title = 'Express(o) Service Renovation Pause' and published_at is not null;
-- select count(*) from one_time_events where slug = 'thrive-youth-thursday-nights' and published_at is not null;
-- select slug from groups where published_at is not null order by slug;
--   contend-prayer-group, discovery-womens-bible-study, marrieds-small-group, spiritual-warfare, youth-group
-- select count(*) from outreach where slug in ('joy-drop', 'pack-the-pantry') and published_at is not null;
