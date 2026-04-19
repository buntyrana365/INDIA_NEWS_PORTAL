"""
Translation Service — translates article text using deep-translator (Google Translate).
"""

from deep_translator import GoogleTranslator


def translate_text(text: str, target_lang: str) -> str:
    """
    Translate a single text string to the target language.
    Falls back to original text if translation fails.
    """
    if not text or not text.strip():
        return text

    try:
        # deep-translator uses full language codes sometimes
        lang_map = {"hi": "hi", "mr": "mr", "en": "en"}
        target = lang_map.get(target_lang, target_lang)

        translated = GoogleTranslator(source="auto", target=target).translate(text)
        return translated if translated else text
    except Exception as e:
        print(f"[TranslateService] Translation failed: {e}")
        return text


def translate_articles(articles: list[dict], target_lang: str) -> list[dict]:
    """
    Translate title and description of each article to the target language.
    Modifies articles in-place and returns them.
    """
    if target_lang == "en":
        return articles  # No translation needed

    for article in articles:
        article["title"] = translate_text(article.get("title", ""), target_lang)
        article["description"] = translate_text(
            article.get("description", ""), target_lang
        )

    return articles
