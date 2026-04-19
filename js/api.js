/**
 * API module — communicates with the Flask backend.
 */

const API_BASE = window.location.origin;

export async function fetchHeadlines(lang = 'en') {
  const url = `${API_BASE}/api/headlines?lang=${encodeURIComponent(lang)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function fetchNews(district, lang = 'en') {
  const url = `${API_BASE}/api/news?district=${encodeURIComponent(district)}&lang=${encodeURIComponent(lang)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function fetchSources(district = '', lang = 'en') {
  let url = `${API_BASE}/api/sources?lang=${encodeURIComponent(lang)}`;
  if (district) url += `&district=${encodeURIComponent(district)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}
