"""Exercise the real export parser without writing parsed files or using a DB."""
import importlib.util
import json
from datetime import date
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("current_exports", root / "migration-files/parse-current-exports.py")
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)


def event(slug="test-weekly", start="2026-03-01T08:30:00-06:00", interval="7"):
    return {
        "slug": slug, "mec_start": start[:10], "start_datetime": start,
        "end_datetime": None, "repeat_type": "weekly", "repeat_interval": interval,
        "repeat_end": "never", "mec_end": None, "location": "Test location",
    }


def expand(row, today, horizon):
    rows, issues = parser.build_occurrences([row], today=date.fromisoformat(today), horizon_days=horizon)
    return {"starts": [item["start_datetime"] for item in rows], "issues": issues}


owner = parser.apply_owner_schedule(event("expresso-service", "2026-10-26T12:00:00-05:00"))
print(json.dumps({
    "spring": expand(event(), "2026-03-01", 14),
    "fall": expand(event(start="2026-10-25T08:30:00-05:00"), "2026-10-25", 14),
    "owner": {"typical_time": owner["typical_time"], "venue": owner["venue"], "source": owner["schedule_source"], **expand(owner, "2026-10-25", 21)},
    "invalid": expand(event(interval="0"), "2026-03-01", 14),
    "fortnightly": expand(event(interval="14"), "2026-03-01", 28),
    "labels": [parser.describe_recurrence("weekly", "7", date(2026, 11, 8), []), parser.describe_recurrence("weekly", "14", date(2026, 11, 8), [])],
}))
