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
    Translate title and description of each article in a single batch.
    This is significantly faster than translating one by one.
    """
    if not articles or target_lang == "en":
        return articles

    # Prepare texts for batch translation
    texts_to_translate = []
    for article in articles:
        # We use a unique separator that is unlikely to appear in news text
        texts_to_translate.append(article.get("title", ""))
        texts_to_translate.append(article.get("description", "") or " ")

    # Join with separator
    separator = " [SEP] "
    full_text = separator.join(texts_to_translate)

    try:
        translated_full = translate_text(full_text, target_lang)
        # Split back by separator
        translated_parts = translated_full.split("[SEP]")
        
        # Strip whitespace from parts
        translated_parts = [p.strip() for p in translated_parts]

        # Reassign to articles
        for i, article in enumerate(articles):
            # Each article has 2 parts: title and description
            title_idx = i * 2
            desc_idx = i * 2 + 1
            
            if title_idx < len(translated_parts):
                article["title"] = translated_parts[title_idx]
            if desc_idx < len(translated_parts):
                article["description"] = translated_parts[desc_idx]

    except Exception as e:
        print(f"[TranslateService] Batch translation failed: {e}")
        # Fallback to individual translation if batch fails for some reason
        for article in articles:
            article["title"] = translate_text(article.get("title", ""), target_lang)
            article["description"] = translate_text(article.get("description", ""), target_lang)

    return articles
