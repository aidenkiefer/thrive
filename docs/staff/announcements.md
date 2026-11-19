# Staff guide: announcements and service notices

Use an **announcement** to tell visitors about a closure, a schedule change, or other timely news. It appears as a banner near the top of the homepage.

> Status: written from a code review on 2026-11-18. The "timing" items below still need a check on a configured Preview site (see the last section). Decision recorded by the owner on 2026-11-18: the behavior described here is accepted for the MVP.

## How it works

- **Only one announcement shows at a time.** If several are eligible, the one that was **published most recently** wins. There is no priority setting.
- An announcement is shown only when **all** of these are true:
  - **Published** is on.
  - **Feature on homepage** is on. A published announcement that is not featured is never shown to visitors.
  - It has **not expired** (its expiry time is empty or still in the future).
- **Expiry:** after the expiry time, the announcement stops showing. If another featured, unexpired announcement exists, that one shows instead. If none exists, the banner disappears.
- **Publishing is immediate.** There is no way to schedule an announcement for later. Publish it when you want it to appear.
- Editing an announcement that is already published keeps its original publish time. Editing an old announcement does **not** move it above a newer one.

## To post a closure or schedule-change notice

1. Go to **Admin → Announcements** and create a new announcement.
2. Write a clear **title** and **body** (for example, what changed and which service it affects). Only add text you have confirmed with the pastors.
3. Optional: add button text **and** a button link together. Both or neither.
4. Set an **expiry** so the notice goes away on its own. Publishing requires a future expiry.
5. Turn on **Feature on homepage** and **Published**, then save.
6. **Before you publish, unfeature any older announcement** you do not want to compete with. A newer featured announcement will hide an older one, and a closure notice that is older than another featured item will not show.
7. Open the homepage and confirm the banner looks right.

## Expiry time format

Enter the expiry as a date and time **with the Chicago offset**, for example `2026-12-01T00:00:00-06:00`.

- Central Standard Time (about early November to mid March): `-06:00`
- Central Daylight Time (about mid March to early November): `-05:00`
- The form rejects an offset that does not match Chicago time on that date.
- When you open an existing announcement, the expiry may be shown in UTC. Treat it as a stored value; re-enter it with the Chicago offset if you change it.

## Known limits (accepted for now)

- No priority or "urgent" flag, so staff must unfeature competing announcements by hand.
- No scheduled start time.
- The homepage banner shows the title, body, and button. It does **not** show the announcement's image, even though the form has an image field.
- Announcements are not connected to a specific event or occurrence. To cancel one event date, use the event tools and, if you also want a banner, post an announcement separately.

## Still to verify on a configured Preview site

These cannot be confirmed from the code alone:

- How quickly a newly published or expired announcement appears or disappears (the homepage may refresh about once a minute, or on every visit).
- That expiry removes the banner at the expected time, including around the daylight-saving changes.
- What visitors see with two featured announcements at once.

Tracked on the GitHub Project ticket "Verify announcements for service changes".
