"""
India Flash News — Flask Backend
Serves the frontend and provides REST API endpoints for news search,
translation, and fallback sources.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from config import FLASK_PORT, FLASK_DEBUG, CORS_ORIGINS
from services.news_service import fetch_news
from services.google_news_service import fetch_top_headlines, fetch_district_news
from services.translate_service import translate_articles
from services.fallback_service import get_fallback_sources, get_all_sources

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), "..", "frontend"),
    static_url_path="",
)


CORS(app, origins=CORS_ORIGINS)

# Minimum articles before triggering fallback
FALLBACK_THRESHOLD = 3

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------


@app.route("/api/headlines", methods=["GET"])
def api_headlines():
    """
    GET /api/headlines?lang=en|hi|mr

    Returns top India news headlines for the hero section.
    """
    lang = request.args.get("lang", "en").strip().lower()
    if lang not in ("en", "hi", "mr"):
        lang = "en"

    try:
        articles = fetch_top_headlines(lang, max_results=10)

        # Translate if needed
        if articles and lang != "en":
            first_title = articles[0].get("title", "")
            if first_title.isascii():
                articles = translate_articles(articles, lang)

        return jsonify({
            "lang": lang,
            "articles": articles,
            "total": len(articles),
        })
    except Exception as e:
        print(f"[API] Error in /api/headlines: {e}")
        return jsonify({"articles": [], "total": 0, "error": str(e)})


@app.route("/api/news", methods=["GET"])
def api_news():
    """
    GET /api/news?district=...&lang=en|hi|mr

    Returns JSON with news articles. Uses Google News RSS (free, no key needed)
    as primary source, falls back to NewsAPI if available, then to trusted sources.
    """
    district = request.args.get("district", "").strip()
    lang = request.args.get("lang", "en").strip().lower()

    if not district:
        return jsonify({"error": "Missing 'district' parameter"}), 400

    if lang not in ("en", "hi", "mr"):
        lang = "en"

    try:
        # 1. Try Google News RSS first (free, no API key)
        articles = fetch_district_news(district, lang)

        # 2. If Google News didn't return enough, try NewsAPI as backup
        if len(articles) < FALLBACK_THRESHOLD:
            newsapi_articles = fetch_news(district, lang)
            if newsapi_articles:
                # Merge, avoiding duplicates by URL
                existing_urls = {a["url"] for a in articles}
                for a in newsapi_articles:
                    if a["url"] not in existing_urls:
                        articles.append(a)

        # 3. Translate if needed
        if articles and lang != "en":
            first_title = articles[0].get("title", "")
            if first_title.isascii():
                articles = translate_articles(articles, lang)

        # 4. Decide on fallback
        use_fallback = len(articles) < FALLBACK_THRESHOLD
        sources = []
        if use_fallback:
            sources = get_fallback_sources(district, lang)

        return jsonify({
            "district": district,
            "lang": lang,
            "articles": articles,
            "fallback": use_fallback,
            "sources": sources,
            "total": len(articles),
        })

    except Exception as e:
        print(f"[API] Error in /api/news: {e}")
        sources = get_fallback_sources(district, lang)
        return jsonify({
            "district": district,
            "lang": lang,
            "articles": [],
            "fallback": True,
            "sources": sources,
            "total": 0,
            "error": "Failed to fetch news. Showing trusted sources instead.",
        })


@app.route("/api/sources", methods=["GET"])
def api_sources():
    """
    GET /api/sources
    Returns all trusted Indian news sources.
    """
    district = request.args.get("district", "").strip()
    lang = request.args.get("lang", "en").strip().lower()

    if district:
        sources = get_fallback_sources(district, lang)
    else:
        sources = get_all_sources()

    return jsonify({"sources": sources})


# Serve static files locally (not on Vercel)
if not os.environ.get("VERCEL"):
    @app.route("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        return send_from_directory(app.static_folder, path)




# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"[*] India Flash News server starting on http://localhost:{FLASK_PORT}")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=FLASK_DEBUG)
