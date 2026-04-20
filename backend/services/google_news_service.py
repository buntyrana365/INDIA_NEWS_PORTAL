"""
Google News RSS Service — fetches real news from Google News RSS feeds.
No API key needed. Works for any district/keyword search.
"""

import time
from datetime import datetime
from ddgs import DDGS

# In-memory cache
_cache: dict[str, tuple[float, list]] = {}
CACHE_TTL = 600  # 10 minutes


def _parse_date(date_str):
    """Normalize date format to ISO."""
    if not date_str:
        return ""
    try:
        from dateutil import parser
        parsed = parser.parse(date_str)
        return parsed.isoformat()
    except Exception:
        return date_str


def fetch_google_news(query: str, lang: str = "en", max_results: int = 20) -> list[dict]:
    """Fetch news articles using DuckDuckGo News Search for reliable images."""
    cache_key = f"ddgs:{query.lower()}:{lang}"

    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            return cached_data

    # Map language codes to DuckDuckGo region/safesearch if needed
    region = "in-en"
    if lang == "hi":
        query = query + " news in hindi"
    elif lang == "mr":
        query = query + " news in marathi"

    try:
        # DDGS provides reliable image URLs natively in its news response
        with DDGS() as ddgs:
            # Using positional argument for query to handle version differences (keywords vs query)
            results = ddgs.news(query, region=region, safesearch="moderate", max_results=max_results)
            
            articles = []
            if results:
                for item in results:
                    image_url = item.get("image", "")
                    # DDGS format: { 'title': '...', 'body': '...', 'url': '...', 'image': '...', 'source': '...', 'date': '...' }
                    articles.append({
                        "title": item.get("title", ""),
                        "description": item.get("body", ""),
                        "url": item.get("url", ""),
                        "image": image_url if image_url else "",
                        "source": item.get("source", ""),
                        "publishedAt": _parse_date(item.get("date", "")),
                        "author": "",
                    })

        _cache[cache_key] = (time.time(), articles)
        return articles

    except Exception as e:
        print(f"[NewsService] Error fetching news from DDGS: {e}")
        return []


def fetch_top_headlines(lang: str = "en", max_results: int = 10) -> list[dict]:
    """Fetch top India headlines for the hero section."""
    queries = {
        "en": "India top news today",
        "hi": "भारत ताजा खबर आज",
        "mr": "भारत ताज्या बातम्या आज",
    }
    query = queries.get(lang, queries["en"])
    return fetch_google_news(query, lang, max_results)


def fetch_district_news(district: str, lang: str = "en", max_results: int = 20) -> list[dict]:
    """Fetch news for a specific Indian district."""
    lang_keywords = {
        "en": f"{district} India news latest",
        "hi": f"{district} समाचार ताजा खबर",
        "mr": f"{district} बातम्या ताज्या",
    }
    query = lang_keywords.get(lang, lang_keywords["en"])
    return fetch_google_news(query, lang, max_results)
