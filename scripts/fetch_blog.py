# -*- coding: utf-8 -*-
"""
네이버 블로그 최신 글을 홈페이지용 파일(assets/data/blog.json)로 저장합니다.

이 파일은 GitHub 서버가 자동으로 실행합니다. 직접 실행하실 일은 없습니다.
블로그 주소를 바꾸셨다면 아래 BLOG_ID 만 수정하세요.
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from xml.etree import ElementTree

# ── 설정 ─────────────────────────────────────────────
BLOG_ID = "sungmo7519820"          # 네이버 블로그 아이디
MAX_POSTS = 6                       # 홈페이지에 보여줄 글 개수
OUT_PATH = "assets/data/blog.json"
# ────────────────────────────────────────────────────

RSS_URLS = [
    f"https://rss.blog.naver.com/{BLOG_ID}.xml",
    f"https://blog.rss.naver.com/{BLOG_ID}.xml",
]
KST = timezone(timedelta(hours=9))


def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; SeongmoDaycareBot/1.0)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read()


def strip_tags(html):
    text = re.sub(r"<[^>]+>", " ", html or "")
    text = (text.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"'))
    return re.sub(r"\s+", " ", text).strip()


def first_image(html):
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html or "", re.I)
    if not m:
        return ""
    src = m.group(1)
    if src.startswith("//"):
        src = "https:" + src
    # 네이버 썸네일 옵션(작게·흐리게)을 홈페이지용 크기로 바꿉니다.
    # 예) ?type=w80_blur → ?type=w773
    src = re.sub(r"\?type=[^&#]*", "?type=w773", src)
    return src


def parse_date(value):
    """RSS 날짜를 'YYYY.MM.DD' 형태로 바꿉니다."""
    if not value:
        return ""
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z",
                "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(value.strip(), fmt)
            if dt.tzinfo:
                dt = dt.astimezone(KST)
            return dt.strftime("%Y.%m.%d")
        except ValueError:
            continue
    m = re.search(r"(\d{4})[-.\s/]+(\d{1,2})[-.\s/]+(\d{1,2})", value)
    if m:
        return "%s.%02d.%02d" % (m.group(1), int(m.group(2)), int(m.group(3)))
    return ""


def collect():
    last_error = None
    for url in RSS_URLS:
        try:
            raw = fetch(url)
            root = ElementTree.fromstring(raw)
        except Exception as exc:          # 주소가 다르면 다음 주소로 시도
            last_error = exc
            continue

        posts = []
        for item in root.iter("item"):
            def get(tag):
                node = item.find(tag)
                return (node.text or "") if node is not None else ""

            title = strip_tags(get("title"))
            link = (get("link") or "").strip()
            if not title or not link:
                continue
            body = get("description")
            summary = strip_tags(body)
            posts.append({
                "title": title[:80],
                "link": link,
                "date": parse_date(get("pubDate")),
                "image": first_image(body),
                "summary": (summary[:90] + "…") if len(summary) > 90 else summary,
            })
            if len(posts) >= MAX_POSTS:
                break

        if posts:
            return posts
        last_error = RuntimeError("글을 하나도 찾지 못했습니다: " + url)

    raise last_error or RuntimeError("블로그를 불러오지 못했습니다")


def main():
    try:
        posts = collect()
    except Exception as exc:
        print("블로그를 불러오지 못했습니다:", exc)
        # 실패해도 기존 파일은 그대로 두어 홈페이지가 비어 보이지 않게 합니다
        if os.path.exists(OUT_PATH):
            print("이전에 저장된 글을 그대로 유지합니다.")
            return 0
        posts = []

    data = {
        "updated": datetime.now(KST).strftime("%Y.%m.%d %H:%M"),
        "blogUrl": f"https://blog.naver.com/{BLOG_ID}",
        "posts": posts,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"저장 완료: {OUT_PATH} (글 {len(posts)}개)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
