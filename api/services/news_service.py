"""
News Service — fetches articles from NewsAPI.org with in-memory caching.
"""

import time
import requests
from config import NEWS_API_KEY, NEWS_API_BASE_URL, CACHE_TTL_SECONDS


# Simple in-memory cache: key -> (timestamp, data)
_cache: dict[str, tuple[float, list]] = {}


def _build_query(district: str, lang: str) -> str:
    """Build optimized search query based on language."""
    lang_keywords = {
        "en": f'"{district}" news India',
        "hi": f'"{district}" समाचार',
        "mr": f'"{district}" बातम्या',
    }
    return lang_keywords.get(lang, f'"{district}" news India')


def _get_cache_key(district: str, lang: str) -> str:
    return f"{district.lower().strip()}:{lang}"


def fetch_news(district: str, lang: str = "en", page_size: int = 20) -> list[dict]:
    """
    Fetch news articles for a given district and language.
    Returns a list of article dicts. Uses cache to save API quota.
    """
    cache_key = _get_cache_key(district, lang)

    # Check cache
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL_SECONDS:
            return cached_data

    if not NEWS_API_KEY:
        return []

    query = _build_query(district, lang)

    # Map app language codes to NewsAPI language codes
    api_lang = lang if lang in ("en", "hi") else "en"

    params = {
        "q": query,
        "language": api_lang,
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY,
    }

    try:
        response = requests.get(NEWS_API_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "ok":
            return []

        articles = []
        for article in data.get("articles", []):
            # Skip removed/empty articles
            if article.get("title") == "[Removed]" or not article.get("title"):
                continue

            articles.append({
                "title": article.get("title", ""),
                "description": article.get("description", "") or "",
                "url": article.get("url", ""),
                "image": article.get("urlToImage", ""),
                "source": article.get("source", {}).get("name", "Unknown"),
                "publishedAt": article.get("publishedAt", ""),
                "author": article.get("author", ""),
            })

        # Update cache
        _cache[cache_key] = (time.time(), articles)
        return articles

    except requests.RequestException as e:
        print(f"[NewsService] Error fetching news: {e}")
        return []


def clear_cache():
    """Clear the entire cache."""
    _cache.clear()
