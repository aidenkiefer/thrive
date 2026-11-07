#!/usr/bin/env python3
"""Convert the November 2026 MEC JSON and sermon WXR into the seed JSON files.

Run from the repo root. This command reads local exports and writes parsed JSON;
it never connects to Supabase.
"""

import argparse
import importlib.util
import json
import re
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
legacy_spec = importlib.util.spec_from_file_location("legacy_export", ROOT / "parse-export.py")
legacy = importlib.util.module_from_spec(legacy_spec)
legacy_spec.loader.exec_module(legacy)


CHICAGO = ZoneInfo("America/Chicago")
WEEKDAY_PLURALS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"]

# Schedules the owner confirmed directly. They override the export's rule and
# are recorded in the parsed row (schedule_source) and the migration report.
OWNER_SCHEDULES = {
    "expresso-service": {
        "repeat_type": "weekly",
        "repeat_interval": "7",
        "repeat_end": "never",
        "isoweekday": 7,
        "hour": 8,
        "minute": 30,
        "typical_time": "8:30 AM",
        "venue": "Cafe",
        "source": "Owner, 2026-11-07: weekly, Sundays 8:30 AM America/Chicago, in the cafe",
    },
}


def describe_recurrence(repeat_type, interval, start_date, certain_weekdays):
    """Visitor-facing schedule text built only from the export's rule fields."""
    if repeat_type == "weekly":
        days = int(interval or 7)
        weekday = WEEKDAY_PLURALS[start_date.isoweekday() - 1]
        if days == 7:
            return weekday
        if days == 14:
            return f"Every other {weekday[:-1]}"
        if days % 7 == 0:
            return f"Every {days // 7} weeks on {weekday}"
        return f"Every {days} days"
    if repeat_type == "certain_weekdays":
        names = [WEEKDAY_PLURALS[int(d) - 1] for d in certain_weekdays if str(d).isdigit() and 1 <= int(d) <= 7]
        if names:
            return " and ".join(names)
    return "Selected dates"


def apply_owner_schedule(event):
    schedule = OWNER_SCHEDULES.get(event["slug"])
    if not schedule:
        return event
    anchor = date.fromisoformat(event["mec_start"])
    anchor += timedelta(days=(schedule["isoweekday"] - anchor.isoweekday()) % 7)
    start = datetime.combine(anchor, datetime.min.time(), CHICAGO).replace(hour=schedule["hour"], minute=schedule["minute"])
    end = None
    if event.get("end_datetime") and event.get("start_datetime"):
        duration = datetime.fromisoformat(event["end_datetime"]) - datetime.fromisoformat(event["start_datetime"])
        if timedelta(0) < duration <= timedelta(hours=12):
            end = start + duration
    return {
        **event,
        "repeat_type": schedule["repeat_type"],
        "repeat_interval": schedule["repeat_interval"],
        "repeat_end": schedule["repeat_end"],
        "mec_start": anchor.isoformat(),
        "start_datetime": start.isoformat(),
        "end_datetime": end.isoformat() if end else None,
        "typical_time": schedule["typical_time"],
        "venue": schedule["venue"],
        "recurrence_description": describe_recurrence(schedule["repeat_type"], schedule["repeat_interval"], anchor, []),
        "schedule_source": schedule["source"],
    }


def local_datetime(meta, prefix, zone):
    date = meta.get(f"mec_{prefix}_date")
    if not date:
        return None
    hour = int(meta.get(f"mec_{prefix}_time_hour") or 0)
    minute = int(meta.get(f"mec_{prefix}_time_minutes") or 0)
    ampm = (meta.get(f"mec_{prefix}_time_ampm") or "AM").upper()
    hour = hour % 12 + (12 if ampm == "PM" else 0)
    return datetime.strptime(date, "%Y-%m-%d").replace(
        hour=hour, minute=minute, tzinfo=ZoneInfo(zone)
    ).isoformat()


def values(field):
    return list(field.values()) if isinstance(field, dict) else field if isinstance(field, list) else []


def parse_events(path):
    records = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("MEC export must contain a JSON list")
    recurring, one_time, issues = [], [], []
    seen = set()
    for item in records:
        post, meta = item.get("post", {}), item.get("meta", {})
        if post.get("post_status") != "publish":
            issues.append({"type": "excluded_unpublished_event", "wp_id": item.get("ID")})
            continue
        slug = post.get("post_name") or legacy.slugify(item.get("title", ""))
        if slug in seen:
            raise ValueError(f"Duplicate event slug: {slug}")
        seen.add(slug)
        zone = item.get("TZO", {}).get("timezone") or "America/Chicago"
        try:
            start = local_datetime(meta, "start", zone)
            end = local_datetime(meta, "end", zone)
        except (ValueError, KeyError) as exc:
            issues.append({"type": "invalid_event_datetime", "slug": slug, "detail": str(exc)})
            start = end = None
        if not start:
            issues.append({"type": "missing_start_datetime", "slug": slug})
        description_html = post.get("post_content") or item.get("content") or ""
        description = legacy.strip_html_preserve_breaks(description_html)
        categories = [c.get("name") for c in values(item.get("categories")) if c.get("name")]
        locations = values(item.get("locations"))
        location = locations[0].get("name") if locations else None
        image = item.get("featured_image") or {}
        image_url = legacy.normalize_url(image.get("full") or image.get("medium") or "")
        external_url = legacy.normalize_url(meta.get("mec_more_info") or "")
        signup_urls = legacy.extract_churchsuite_urls(description_html)
        if external_url and "churchsuite.com" in external_url:
            signup_urls.insert(0, external_url)
        base = {
            "wp_id": str(item.get("ID") or post.get("ID") or ""),
            "slug": slug,
            "name": legacy.clean_text(post.get("post_title") or item.get("title")),
            "description": description or None,
            "short_summary": legacy.clean_text(description)[:200] or None,
            "category": categories[0] if categories else None,
            "categories": categories,
            "location": location.split(":", 1)[0].strip() if location else None,
            "venue": location.split(":", 1)[1].strip() if location and ":" in location else None,
            "featured_image_url": image_url or None,
            "churchsuite_form_url": signup_urls[0] if signup_urls else None,
            "external_url": external_url or None,
            "legacy_permalink": legacy.normalize_url(item.get("permalink") or ""),
            "published_at": (post.get("post_date_gmt") + "+00:00") if post.get("post_date_gmt") else post.get("post_date"),
            "seo_description": legacy.clean_text(description)[:160] or None,
            "is_past": str(meta.get("event_past")).lower() in ("1", "true"),
        }
        if external_url and "churchsuite.com" not in external_url:
            issues.append({"type": "external_action_url", "slug": slug, "url": external_url})
        if str(meta.get("mec_repeat_status")) == "1":
            repeat_type = meta.get("mec_repeat_type") or "unknown"
            interval = meta.get("mec_repeat_interval") or "1"
            certain_weekdays = (meta.get("mec_date") or {}).get("repeat", {}).get("certain_weekdays") or []
            mec_start = (item.get("mec") or {}).get("start")
            recurring.append(apply_owner_schedule({
                **base,
                "recurrence_description": describe_recurrence(
                    repeat_type, interval, date.fromisoformat(mec_start) if mec_start else None, certain_weekdays
                ) if mec_start or repeat_type != "weekly" else "Selected dates",
                "typical_time": (item.get("time") or {}).get("start"),
                "repeat_type": repeat_type,
                "repeat_interval": interval,
                "repeat_end": meta.get("mec_repeat_end") or "never",
                "advanced_days": meta.get("mec_advanced_days") or [],
                "certain_weekdays": certain_weekdays,
                "custom_days": meta.get("mec_in_days") or "",
                "mec_start": mec_start,
                "mec_end": (item.get("mec") or {}).get("end"),
                "start_datetime": start,
                "end_datetime": end,
            }))
        else:
            one_time.append({**base, "start_datetime": start, "end_datetime": end})
    return recurring, one_time, issues, len(records)


def build_occurrences(events, today=None, horizon_days=90):
    """Expand straightforward weekly rules; report complex MEC rules for review."""
    today = today or datetime.now(ZoneInfo("America/Chicago")).date()
    horizon = today + timedelta(days=horizon_days)
    rows, issues = [], []
    for event in events:
        slug = event["slug"]
        start = date.fromisoformat(event["mec_start"])
        if event["repeat_type"] == "custom_days":
            original = datetime.fromisoformat(event["start_datetime"])
            explicit = []
            pattern = r"(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2}):(\d{2}-\d{2}-[AP]M):(\d{2}-\d{2}-[AP]M)"
            for match in re.finditer(pattern, event.get("custom_days") or ""):
                day_start, day_end, time_start, time_end = match.groups()
                def parse_time(value):
                    return datetime.strptime(value, "%I-%M-%p").time()
                local_start = datetime.combine(date.fromisoformat(day_start), parse_time(time_start), ZoneInfo("America/Chicago"))
                local_end = datetime.combine(date.fromisoformat(day_end), parse_time(time_end), ZoneInfo("America/Chicago"))
                explicit.append((local_start, local_end))
            if event.get("custom_days") and len(explicit) != len(event["custom_days"].split(",")):
                issues.append({"type": "invalid_custom_days", "slug": slug})
                continue
            initial_end = datetime.fromisoformat(event["end_datetime"]) if event.get("end_datetime") else None
            explicit.append((original, initial_end))
            for local_start, local_end in explicit:
                if today <= local_start.date() <= horizon:
                    rows.append({"recurring_slug": slug, "start_datetime": local_start.isoformat(),
                                 "end_datetime": local_end.isoformat() if local_end else None,
                                 "location": event.get("location")})
            continue
        end_raw = event.get("mec_end")
        until = (date.fromisoformat(end_raw) if end_raw and end_raw != "0000-00-00" else horizon)
        if event.get("repeat_end") == "never":
            until = horizon
        until = min(until, horizon)
        if until < today:
            continue
        kind = event["repeat_type"]
        if kind == "weekly":
            step = int(event["repeat_interval"] or 7)
            if step < 1:
                issues.append({"type": "invalid_recurrence_interval", "slug": slug})
                continue
            days = []
            current = start
            while current <= until:
                if current >= today:
                    days.append(current)
                current += timedelta(days=step)
        elif kind == "certain_weekdays" and slug == "family-worship-service":
            if [str(x) for x in event["certain_weekdays"]] != ["7"]:
                issues.append({"type": "unsupported_recurrence", "slug": slug, "rule": kind})
                continue
            days = [today + timedelta(days=i) for i in range((until - today).days + 1)
                    if (today + timedelta(days=i)).isoweekday() == 7]
        else:
            issues.append({"type": "unsupported_recurrence", "slug": slug, "rule": kind})
            continue
        original_start = datetime.fromisoformat(event["start_datetime"])
        original_end = datetime.fromisoformat(event["end_datetime"]) if event.get("end_datetime") else None
        # Parsed offsets are for the original date. Resolve each new wall time in Chicago.
        timezone = ZoneInfo("America/Chicago")
        if original_end:
            end_time = original_end.timetz().replace(tzinfo=None)
        for day in days:
            local_start = datetime.combine(day, original_start.timetz().replace(tzinfo=None), timezone)
            local_end = datetime.combine(day, end_time, timezone) if original_end else None
            if local_end and local_end <= local_start:
                local_end += timedelta(days=1)
            rows.append({"recurring_slug": slug, "start_datetime": local_start.isoformat(),
                         "end_datetime": local_end.isoformat() if local_end else None,
                         "location": event.get("location")})
    return rows, issues


def chicago_timestamp(value):
    """WordPress post_date is site-local (Chicago) with no offset; attach the correct one."""
    if not value or re.search(r"(Z|[+-]\d{2}:?\d{2})$", value):
        return value
    return datetime.fromisoformat(value.replace(" ", "T")).replace(tzinfo=CHICAGO).isoformat()


def parse_sermons(path):
    sermons = legacy.parse_sermons(path)
    for row in sermons["sermons"]:
        row["published_at"] = chicago_timestamp(row.get("published_at"))
    return sermons


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--events", type=Path, default=ROOT / "mec-events-20261107UTC0059.json")
    parser.add_argument("--sermons", type=Path, default=ROOT / "thrivevineyardchurch.wordpress.2026-11-07.xml")
    parser.add_argument("--out", type=Path, default=ROOT / "parsed")
    args = parser.parse_args()
    recurring, one_time, event_issues, event_count = parse_events(args.events)
    occurrences, occurrence_issues = build_occurrences(recurring)
    sermons = parse_sermons(args.sermons)
    args.out.mkdir(parents=True, exist_ok=True)
    outputs = {
        "recurring_events.json": recurring,
        "one_time_events.json": one_time,
        "speakers.json": sermons["speakers"],
        "sermon_series.json": sermons["sermon_series"],
        "sermons.json": sermons["sermons"],
        "event_occurrences.json": occurrences,
    }
    for name, rows in outputs.items():
        (args.out / name).write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report = {
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source_files": [args.events.name, args.sermons.name],
        "events": {"source": event_count, "recurring": len(recurring), "one_time": len(one_time)},
        "sermons": sermons["stats"],
        "event_issues": event_issues,
        "occurrence_issues": occurrence_issues,
        "owner_schedules": [{"slug": e["slug"], "source": e["schedule_source"]} for e in recurring if e.get("schedule_source")],
        "occurrences": {"generated": len(occurrences), "source_events": len(set(x["recurring_slug"] for x in occurrences))},
        "sermon_issues": sermons["issues"],
        "event_issue_counts": dict(Counter(i["type"] for i in event_issues)),
        "sermon_issue_counts": dict(Counter(i["type"] for i in sermons["issues"])),
    }
    (args.out / "migration-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Parsed {len(recurring) + len(one_time)} events and {len(sermons['sermons'])} sermons into {args.out}")
    print("Review migration-report.json before seeding.")


if __name__ == "__main__":
    main()
