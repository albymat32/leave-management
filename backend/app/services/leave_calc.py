from datetime import date, timedelta


def calc_total_days(start: date, end: date, excluded: list[date] | None) -> tuple[int, list[str]]:
    if start > end:
        raise ValueError("start_date_after_end_date")

    excluded = excluded or []
    excluded_set = set(excluded)

    # Keep only excluded dates that are within the inclusive range
    in_range = []
    d = start
    while d <= end:
        if d in excluded_set:
            in_range.append(d)
        d += timedelta(days=1)

    days = (end - start).days + 1
    total = days - len(in_range)
    if total < 0:
        total = 0

    # Store as YYYY-MM-DD strings
    excluded_str = [x.isoformat() for x in sorted(in_range)]
    return total, excluded_str