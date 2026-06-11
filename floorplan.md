# Thrive Vineyard Website Architecture & Migration Plan

## Vision

The new Thrive Vineyard website should not be a traditional collection of disconnected pages.

Instead, it should function as a centralized content platform where every ministry, group, recurring event, sermon series, outreach initiative, campaign, and announcement exists as a single canonical entity.

The website should generate multiple views of the same information rather than requiring staff to update the same details in multiple places.

---

# Core Architectural Principle

## Canonical Ministry Entities

Every church activity should exist only once in the system.

Examples:

* Small Groups
* Holy Spirit Night
* Youth Alpha
* LEGO Club (P.L.U.G.)
* Outreach Events
* Sermon Series
* Seasonal Campaigns
* Ministry Teams

Instead of creating separate content for:

* Event calendar
* Group listings
* Homepage announcements
* Landing pages
* Google Ads destinations

all of those areas should reference the same underlying entity.

Example:

```text
Holy Spirit Night
├── Event Calendar View
├── Homepage Announcement
├── Groups Page Card
├── SEO Landing Page
├── Google Ads Landing Page
├── Signup Form
├── Contact Information
└── Media Archive
```

Every display location references the same source of truth.

Updating one record updates everything.

---

# Entity Structure

Each entity should support:

## Identity

* Name
* Slug
* Category
* Description
* Short Summary

## Scheduling

* Next Occurrence
* Previous Occurrence
* Recurrence Rules
* Start Date
* End Date
* Time
* Location

## Contact Information

* Leader
* Email
* Phone
* Ministry Owner

## Media

* Featured Image
* Gallery
* Videos
* Livestream Links
* Podcast Episodes

## Forms

* Registration Form
* ChurchSuite Form
* External Signup Links

## SEO

* SEO Title
* Meta Description
* Open Graph Image

## Relationships

* Related Ministries
* Related Events
* Related Sermon Series
* Related Announcements

---

# Example: Holy Spirit Night

Single entity record:

```text
Name:
Holy Spirit Night

Description:
Monthly worship and prayer gathering.

Next Occurrence:
July 12, 2026

Contact:
Pastor Name

Signup Form:
ChurchSuite Form

Media:
Past recordings and worship playlists
```

Generated automatically into:

* Event Calendar
* Homepage Feature
* Events Page
* Ministry Listing
* Landing Page
* Search Results
* Google Ads Destination

No duplicated content.

---

# Website Strategy

## This Is a Migration Project

The goal is not merely redesigning the website.

The goal is:

* Preserve SEO authority
* Eliminate duplicate content
* Simplify ministry management
* Create reusable content structures
* Improve discoverability
* Reduce maintenance workload

---

# AI Documentation Structure

Create a `/docs` directory that serves as the source of truth for AI-assisted development.

```text
/docs
  00-project-brief.md
  01-current-site-audit.md
  02-content-inventory.md
  03-information-architecture.md
  04-seo-url-migration-map.md
  05-content-models.md
  06-integrations.md
  07-design-system.md
  08-ai-agent-rules.md
```

---

# AI Agent Rules

AI agents should follow these rules:

* Never invent ministry information.
* Never invent event dates.
* Never invent staff information.
* Preserve SEO URLs whenever possible.
* Add redirects when URLs change.
* Use documented content models.
* Reuse existing components before creating new ones.
* Treat documentation as the source of truth.

---

# Discovery Phase

Before development begins:

## WordPress Export

Attempt full export from:

```text
WordPress
→ Tools
→ Export
→ All Content
```

Gather:

* Pages
* Posts
* Media
* Categories
* Tags

---

## Plugin Investigation

Research export capabilities for:

### Sermon System

Need:

* Sermons
* Series
* Speakers
* Scripture References
* Media Links

### Event Calendar

Need:

* Events
* Recurrence Rules
* Locations

### Cornerstone

Need:

* Page Content
* Layout Structure

### SEO Plugin

Need:

* Meta Titles
* Descriptions
* Redirects

---

# Site Audit

Create a complete crawl of the existing website.

Track:

```text
URL
Title
Meta Description
H1
Content Type
Status Code
Internal Links
Redirect Target
Migration Action
Priority
```

Possible actions:

* Keep
* Rewrite
* Merge
* Redirect
* Retire

---

# Content Model Design

Recommended content types:

```text
Page
Announcement
Event
Recurring Event
Group
Ministry
Outreach Initiative
Sermon
Sermon Series
Speaker
Staff Member
Resource
Landing Page
```

Important distinction:

```text
Recurring Event
    ↓
Specific Occurrence
```

Example:

```text
Holy Spirit Night
    ↓
June 2026 Occurrence
    ↓
July 2026 Occurrence
```

The recurring event remains the canonical record.

Occurrences are generated from it.

---

# Recommended Technical Architecture

## Frontend

* Next.js App Router
* TypeScript
* Responsive-first design
* SEO-first implementation

## Content Layer

Preferred options:

### Option A

MDX + Structured Content Files

Benefits:

* Fast
* Git-controlled
* AI-friendly

### Option B

Headless CMS

Examples:

* Sanity
* Payload
* Directus

Benefits:

* Non-technical editing

### Recommended Approach

Hybrid model:

```text
Static Pages → MDX

Events → Structured Data

Groups → Structured Data

Announcements → Structured Data

ChurchSuite → External Integration
```

---

# Site Floorplan

## Primary Navigation

```text
Plan a Visit
Watch & Listen
Events
Groups
Kids & Youth
Outreach
About
Give
```

---

# Homepage Structure

```text
Hero Section

Service Times

Plan Your Visit

Current Featured Announcement

Upcoming Events

Latest Sermon

Kids & Youth

Groups

Outreach Opportunities

Newsletter Signup

Footer
```

---

# Future Goals

The final system should allow church staff to:

* Create an event once
* Display it everywhere automatically
* Reuse content across the entire site
* Generate landing pages automatically
* Improve SEO consistency
* Reduce manual maintenance
* Support Google Ads campaigns without creating duplicate pages

The website should function as a centralized ministry information platform rather than a collection of manually maintained pages.

