"""
Fallback Service — provides trusted Indian news source links when no
district-level news is found from the API.
"""

import json
import os
import urllib.parse

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_sources_cache: list[dict] | None = None


def _load_sources() -> list[dict]:
    """Load trusted sources from JSON file (cached after first read)."""
    global _sources_cache
    if _sources_cache is not None:
        return _sources_cache

    path = os.path.join(_DATA_DIR, "trusted_sources.json")
    with open(path, "r", encoding="utf-8") as f:
        _sources_cache = json.load(f)
    return _sources_cache


def get_all_sources() -> list[dict]:
    """Return all trusted sources."""
    return _load_sources()


def get_fallback_sources(district: str, lang: str = "en") -> list[dict]:
    """
    Generate fallback source cards with search links for the given district.
    Each source gets a Google search URL and a Google News URL.
    """
    sources = _load_sources()
    lang_labels = {"en": "English", "hi": "Hindi", "mr": "Marathi"}
    lang_label = lang_labels.get(lang, "English")

    fallback_cards = []
    for src in sources:
        # Pick description by language
        if lang == "hi":
            desc = src.get("description_hi", src["description"])
        elif lang == "mr":
            desc = src.get("description_mr", src["description"])
        else:
            desc = src["description"]

        # Build search URLs
        google_query = urllib.parse.quote_plus(
            f"{district} news {src['name']}"
        )
        google_news_query = urllib.parse.quote_plus(
            f"{district} news {lang_label}"
        )

        fallback_cards.append({
            "id": src["id"],
            "name": src["name"],
            "description": desc,
            "logo": src["logo"],
            "website": src["website"],
            "color": src.get("color", "#333"),
            "languages": src["languages"],
            "searchUrl": f"https://www.google.com/search?q={google_query}",
            "googleNewsUrl": f"https://news.google.com/search?q={google_news_query}",
        })

    return fallback_cards
