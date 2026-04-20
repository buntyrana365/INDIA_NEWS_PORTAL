/**
 * Storage helpers — localStorage wrapper for recent searches and bookmarks.
 */

const STORAGE_KEYS = {
  RECENT: 'flashnews_recent_searches',
  BOOKMARKS: 'flashnews_bookmarks',
  LANG: 'flashnews_language',
};

const MAX_RECENT = 10;

export function saveRecentSearch(district) {
  const d = district.trim();
  if (!d) return;
  const list = getRecentSearches().filter(s => s.toLowerCase() !== d.toLowerCase());
  list.unshift(d);
  if (list.length > MAX_RECENT) list.length = MAX_RECENT;
  localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(list));
}

export function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT)) || []; }
  catch { return []; }
}

export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) || []; }
  catch { return []; }
}

export function setBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

export function addBookmark(article) {
  const bm = getBookmarks();
  if (bm.some(b => b.url === article.url)) return false;
  bm.unshift(article);
  setBookmarks(bm);
  return true;
}

export function removeBookmark(url) {
  const bm = getBookmarks().filter(b => b.url !== url);
  setBookmarks(bm);
}

export function isBookmarked(url) {
  return getBookmarks().some(b => b.url === url);
}

export function getSavedLang() {
  return localStorage.getItem(STORAGE_KEYS.LANG) || 'en';
}

export function saveLang(lang) {
  localStorage.setItem(STORAGE_KEYS.LANG, lang);
}
