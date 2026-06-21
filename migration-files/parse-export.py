#!/usr/bin/env python3
"""
Parse WordPress migration XML exports into Supabase-ready JSON.

Usage:
  python3 migration-files/parse-export.py

Outputs to migration-files/parsed/
"""

from __future__ import annotations

import html
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "parsed"


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(value)
    text = re.sub(r"&#13;\s*", "\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def strip_html_preserve_breaks(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(value)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p>", "\n\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_url(url: str) -> str:
    if not url:
        return ""
    url = url.strip()
    url = url.replace("http://thrivevineyard.com", "https://thrivevineyard.com")
    url = url.replace("rrthrivevine.wpenginepowered.com", "thrivevineyard.com")
    url = url.replace("rrtrinityhill.wpenginepowered.com", "thrivevineyard.com")
    if url.startswith("//"):
        url = "https:" + url
    return url


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = html.unescape(slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "item"


def extract_youtube_url(raw: str) -> str:
    if not raw:
        return ""
    m = re.search(r"src=[\"']([^\"']+)[\"']", raw)
    if m:
        return normalize_url(m.group(1))
    if "youtube.com" in raw or "youtu.be" in raw:
        return normalize_url(raw)
    return ""


def extract_churchsuite_urls(raw: str) -> list[str]:
    if not raw:
        return []
    urls = re.findall(r"https?://[^\"'\s>]+churchsuite\.com[^\"'\s>]*", raw, re.I)
    return [normalize_url(u) for u in urls]


def parse_ampm_datetime(date: str, hour: str, minutes: str, ampm: str) -> str | None:
    if not date:
        return None
    try:
        h = int(hour or 0)
        m = int(minutes or 0)
        ap = (ampm or "AM").upper()
        if ap == "PM" and h != 12:
            h += 12
        if ap == "AM" and h == 12:
            h = 0
        return f"{date}T{h:02d}:{m:02d}:00-05:00"
    except ValueError:
        return f"{date}T12:00:00-05:00"


def text_el(el: ET.Element | None, tag: str, default: str = "") -> str:
    if el is None:
        return default
    node = el.find(tag)
    if node is None or node.text is None:
        return default
    return node.text.strip()


def meta_map(item: ET.Element) -> dict[str, str]:
    meta = item.find("meta")
    if meta is None:
        return {}
    return {
        child.tag: (child.text or "").strip()
        for child in meta
        if child.tag and not list(child)
    }


def named_items(item: ET.Element, parent_tag: str) -> list[dict[str, str]]:
    parent = item.find(parent_tag)
    if parent is None:
        return []
    rows = []
    for x in parent.findall("item"):
        row = {"id": text_el(x, "id"), "name": text_el(x, "name")}
        for extra in ("address", "tel", "url"):
            val = text_el(x, extra)
            if val:
                row[extra] = val
        rows.append(row)
    return rows


def recurrence_description(meta: dict[str, str], adv_days: list[str]) -> str:
    if meta.get("mec_repeat_status") != "1":
        return ""
    repeat_type = meta.get("mec_repeat_type") or "unknown"
    if adv_days:
        return f"{repeat_type}: {', '.join(adv_days)}"
    interval = meta.get("mec_repeat_interval") or "1"
    return f"Every {interval} {repeat_type}"


def parse_events() -> dict[str, Any]:
    root = ET.parse(ROOT / "events.xml").getroot()
    recurring: list[dict[str, Any]] = []
    one_time: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []

    for item in root.findall("item"):
        meta = meta_map(item)
        post = item.find("post")
        slug = text_el(post, "post_name") if post is not None else slugify(text_el(item, "title"))
        title = text_el(item, "title")
        description_html = text_el(post, "post_content") if post is not None else text_el(item, "content")
        description = strip_html_preserve_breaks(description_html)
        categories = [c["name"] for c in named_items(item, "categories")]
        tags = [t["name"] for t in named_items(item, "tags")]
        locations = named_items(item, "locations")
        location = locations[0]["name"] if locations else "Thrive Vineyard Church"
        location_address = locations[0].get("address") if locations else None

        featured = item.find("featured_image")
        image_url = normalize_url(text_el(featured, "full") or text_el(featured, "medium")) if featured is not None else ""

        churchsuite_urls = extract_churchsuite_urls(description_html)
        start_dt = parse_ampm_datetime(
            meta.get("mec_start_date", ""),
            meta.get("mec_start_time_hour", ""),
            meta.get("mec_start_time_minutes", ""),
            meta.get("mec_start_time_ampm", ""),
        )
        end_dt = parse_ampm_datetime(
            meta.get("mec_end_date", ""),
            meta.get("mec_end_time_hour", ""),
            meta.get("mec_end_time_minutes", ""),
            meta.get("mec_end_time_ampm", ""),
        )

        base = {
            "wp_id": text_el(item, "ID"),
            "slug": slug,
            "name": title,
            "description": description,
            "short_summary": clean_text(description)[:200] or None,
            "category": categories[0] if categories else None,
            "categories": categories,
            "tags": tags,
            "location": location,
            "location_address": location_address or None,
            "featured_image_url": image_url or None,
            "churchsuite_form_url": churchsuite_urls[0] if churchsuite_urls else None,
            "legacy_permalink": normalize_url(text_el(item, "permalink")),
            "published_at": text_el(post, "post_date") if post is not None else None,
            "is_past": meta.get("event_past") == "1",
            "seo_title": None,
            "seo_description": clean_text(description)[:160] or None,
        }

        if len(churchsuite_urls) > 1:
            issues.append({"type": "multiple_churchsuite_urls", "slug": slug, "urls": churchsuite_urls})

        if meta.get("mec_repeat_status") == "1":
            adv_days = []
            adv_parent = item.find("meta/mec_advanced_days")
            if adv_parent is not None:
                adv_days = [text_el(d, ".") or (d.text or "").strip() for d in adv_parent.findall("item")]

            rec = {
                **base,
                "recurrence_description": recurrence_description(meta, adv_days),
                "typical_time": text_el(item.find("time"), "start") if item.find("time") is not None else None,
                "repeat_type": meta.get("mec_repeat_type"),
                "repeat_interval": meta.get("mec_repeat_interval"),
                "advanced_days": adv_days,
                "mec_start": text_el(item.find("mec"), "start"),
                "mec_end": text_el(item.find("mec"), "end"),
            }
            recurring.append(rec)
        else:
            if not start_dt:
                issues.append({"type": "missing_start_datetime", "slug": slug})
            one = {
                **base,
                "start_datetime": start_dt,
                "end_datetime": end_dt,
            }
            one_time.append(one)

    return {
        "recurring_events": recurring,
        "one_time_events": one_time,
        "issues": issues,
        "stats": {
            "total": len(recurring) + len(one_time),
            "recurring": len(recurring),
            "one_time": len(one_time),
            "with_churchsuite": sum(1 for e in recurring + one_time if e.get("churchsuite_form_url")),
            "past": sum(1 for e in recurring + one_time if e.get("is_past")),
            "upcoming": sum(1 for e in recurring + one_time if not e.get("is_past")),
        },
    }


def get_meta_from_chunk(chunk: str) -> dict[str, str]:
    meta: dict[str, str] = {}
    for m in re.finditer(
        r"<wp:meta_key>(?:<!\[CDATA\[([^\]]+)\]\]>|([^<]+))</wp:meta_key>\s*"
        r"<wp:meta_value>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))</wp:meta_value>",
        chunk,
    ):
        key = m.group(1) or m.group(2) or ""
        val = m.group(3) if m.group(3) is not None else (m.group(4) or "")
        meta[key.strip()] = val.strip()
    return meta


def get_cdata(tag: str, chunk: str) -> str:
    m = re.search(rf"<{tag}><!\[CDATA\[([\s\S]*?)\]\]></{tag}>", chunk)
    if m:
        return m.group(1).strip()
    m = re.search(rf"<{tag}>([^<]*)</{tag}>", chunk)
    return m.group(1).strip() if m else ""


def get_categories(chunk: str) -> dict[str, list[dict[str, str]]]:
    taxonomies: dict[str, list[dict[str, str]]] = {}
    for m in re.finditer(
        r'<category domain="([^"]+)" nicename="([^"]+)"><!\[CDATA\[([^\]]*)\]\]></category>',
        chunk,
    ):
        domain, nicename, name = m.group(1), m.group(2), m.group(3)
        taxonomies.setdefault(domain, []).append({"slug": nicename, "name": name})
    return taxonomies


def parse_sermons() -> dict[str, Any]:
    raw = (ROOT / "sermons.xml").read_text(encoding="utf-8")
    raw = re.sub(r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)", "&amp;", raw)
    chunks = raw.split("<item>")[1:]
    sermon_chunks = [c.split("</item>")[0] for c in chunks if "wpfc_sermon" in c.split("</item>")[0]]

    speakers: dict[str, dict[str, str]] = {}
    series_map: dict[str, dict[str, str]] = {}
    sermons: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []

    for chunk in sermon_chunks:
        meta = get_meta_from_chunk(chunk)
        tax = get_categories(chunk)
        slug = get_cdata("wp:post_name", chunk)
        title = get_cdata("title", chunk)
        status = get_cdata("wp:status", chunk)
        if status and status != "publish":
            continue

        description = strip_html_preserve_breaks(get_cdata("content:encoded", chunk) or get_cdata("wp:post_content", chunk))
        preached_at = get_cdata("wp:post_date", chunk)[:10]
        link = normalize_url(get_cdata("link", chunk))

        preacher_terms = tax.get("wpfc_preacher", [])
        series_terms = tax.get("wpfc_sermon_series", [])
        book_terms = tax.get("wpfc_bible_book", [])
        topic_terms = tax.get("wpfc_sermon_topics", [])
        service_terms = tax.get("wpfc_service_type", [])

        speaker_slug = preacher_terms[0]["slug"] if preacher_terms else slugify(title.split("-")[-1].strip())
        speaker_name = preacher_terms[0]["name"] if preacher_terms else "Unknown"

        if preacher_terms:
            for p in preacher_terms:
                speakers[p["slug"]] = {"slug": p["slug"], "name": p["name"]}

        series_slug = series_terms[0]["slug"] if series_terms else None
        if series_terms:
            for s in series_terms:
                series_map[s["slug"]] = {"slug": s["slug"], "title": s["name"]}

        youtube_url = extract_youtube_url(meta.get("sermon_video", ""))
        audio_url = normalize_url(meta.get("sermon_audio", ""))

        scripture = [b["name"] for b in book_terms]

        if slug == "sample-sermon":
            continue

        if not youtube_url and not audio_url:
            issues.append({"type": "missing_media", "slug": slug, "title": title})
        if audio_url and "wpengine" in audio_url:
            issues.append({"type": "stale_audio_host", "slug": slug, "url": audio_url})

        sermons.append(
            {
                "wp_id": get_cdata("wp:post_id", chunk),
                "slug": slug,
                "title": title,
                "description": description or None,
                "speaker_slug": speaker_slug,
                "speaker_name": speaker_name,
                "series_slug": series_slug,
                "scripture_references": scripture or None,
                "topics": [t["name"] for t in topic_terms] or None,
                "service_type": service_terms[0]["name"] if service_terms else "Sunday Service",
                "audio_url": audio_url or None,
                "youtube_url": youtube_url or None,
                "video_url": youtube_url or None,
                "thumbnail_url": None,
                "preached_at": preached_at,
                "location": "Thrive Vineyard Church",
                "legacy_permalink": link,
                "published_at": get_cdata("wp:post_date", chunk) or None,
                "seo_description": clean_text(description)[:160] or None,
            }
        )

    sermons.sort(key=lambda s: s["preached_at"] or "", reverse=True)

    return {
        "speakers": sorted(speakers.values(), key=lambda s: s["name"]),
        "sermon_series": sorted(series_map.values(), key=lambda s: s["title"]),
        "sermons": sermons,
        "issues": issues,
        "stats": {
            "total": len(sermons),
            "speakers": len(speakers),
            "series": len(series_map),
            "with_youtube": sum(1 for s in sermons if s.get("youtube_url")),
            "with_audio": sum(1 for s in sermons if s.get("audio_url")),
            "with_scripture": sum(1 for s in sermons if s.get("scripture_references")),
            "with_topics": sum(1 for s in sermons if s.get("topics")),
        },
    }


def write_json(name: str, data: Any) -> None:
    path = OUT / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT.parent)}")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    print("Parsing events.xml...")
    events = parse_events()
    print("Parsing sermons.xml...")
    sermons = parse_sermons()

    write_json("recurring_events.json", events["recurring_events"])
    write_json("one_time_events.json", events["one_time_events"])
    write_json("speakers.json", sermons["speakers"])
    write_json("sermon_series.json", sermons["sermon_series"])
    write_json("sermons.json", sermons["sermons"])

    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_files": ["events.xml", "sermons.xml"],
        "events": events["stats"],
        "sermons": sermons["stats"],
        "event_issues": events["issues"],
        "sermon_issues": sermons["issues"][:50],
        "sermon_issue_counts": dict(Counter(i["type"] for i in sermons["issues"])),
        "event_issue_counts": dict(Counter(i["type"] for i in events["issues"])),
        "top_event_categories": dict(Counter(e.get("category") for e in events["recurring_events"] + events["one_time_events"]).most_common(15)),
        "recurring_event_slugs": [e["slug"] for e in events["recurring_events"]],
    }
    write_json("migration-report.json", report)
    print("\nDone.")


if __name__ == "__main__":
    main()
