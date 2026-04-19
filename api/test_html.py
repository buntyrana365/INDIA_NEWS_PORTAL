import urllib.request
import json
from bs4 import BeautifulSoup

html = urllib.request.urlopen(urllib.request.Request('https://news.google.com/search?q=Mumbai&hl=en-IN&gl=IN&ceid=IN:en', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')
articles = []
for article in soup.find_all('article')[:5]:
    a = article.find('a', class_='JtKRv')
    title = a.text if a else 'No Title'
    img_tag = article.find('img')
    img = img_tag['src'] if img_tag and 'src' in img_tag.attrs else ''
    if img.startswith('/'):
        img = 'https://news.google.com' + img
    articles.append({'title': title, 'image': img})
print(json.dumps(articles, indent=2))
