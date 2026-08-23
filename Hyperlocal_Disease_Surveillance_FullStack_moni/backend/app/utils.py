from datetime import datetime


def current_week_number(dt: datetime = None) -> int:
    """ISO week number encoded as YYYYWW, e.g. 202632 for 2026 week 32."""
    dt = dt or datetime.utcnow()
    iso_year, iso_week, _ = dt.isocalendar()
    return iso_year * 100 + iso_week


def week_label(week_number: int) -> str:
    return f"Wk {week_number % 100}"
