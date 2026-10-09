# -*- coding: utf-8 -*-
"""
인스타그램 최신 게시물을 홈페이지용 파일(assets/data/insta.json)로 저장합니다.

이 파일은 GitHub 서버가 자동으로 실행합니다. 직접 실행하실 일은 없습니다.

인스타그램은 블로그와 달리 글 목록을 그냥 내주지 않기 때문에,
behold.so 라는 중계 서비스가 만들어 주는 주소에서 받아옵니다.
그 주소는 GitHub 저장소의 비밀값(Secrets)에 BEHOLD_FEED_URL 이라는 이름으로 넣어 둡니다.
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

# ── 설정 ─────────────────────────────────────────────
MAX_POSTS = 6                       # 홈페이지에 보여줄 게시물 개수
PROFILE_URL = "https://www.instagram.com/sungmo7519820/"
OUT_PATH = "assets/data/insta.json"

# behold.so 에서 만든 피드 주소입니다.
# 읽기 전용이라 이 주소로는 게시물을 보는 것만 가능하고,
# 인스타그램 계정에는 아무 영향을 줄 수 없습니다.
# 피드를 새로 만드셨다면 이 주소만 바꾸시면 됩니다.
DEFAULT_FEED_URL = "https://feeds.behold.so/URPuOo6Sh5ZIehk2y905"
# ────────────────────────────────────────────────────

KST = timezone(timedelta(hours=9))


def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; SeongmoDaycareBot/1.0)",
            "Accept": "application/json, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.loads(res.read().decode("utf-8"))


def pick(d, *names):
    """서비스마다 이름이 조금씩 달라서, 가능한 이름을 차례로 찾아봅니다."""
    for n in names:
        v = d.get(n)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def image_of(post):
    """게시물에서 사진 주소를 찾습니다.

    behold 가 만들어 주는 정사각형 사진(sizes)을 가장 먼저 씁니다.
    인스타그램이 직접 주는 주소는 며칠 뒤 만료되어 사진이 깨지기 때문입니다.
    """
    sizes = post.get("sizes")
    if isinstance(sizes, dict):
        for key in ("medium", "large", "small", "full"):
            item = sizes.get(key)
            if isinstance(item, dict):
                got = pick(item, "mediaUrl", "media_url", "url", "src")
                if got:
                    return got
            elif isinstance(item, str) and item.strip():
                return item.strip()

    kind = pick(post, "mediaType", "media_type").upper()
    if kind == "VIDEO":
        # 동영상 파일은 사진으로 보여줄 수 없으므로 미리보기 사진만 씁니다
        return pick(post, "thumbnailUrl", "thumbnail_url")
    return pick(post, "mediaUrl", "media_url", "thumbnailUrl", "thumbnail_url")


def clean_caption(text):
    """글의 첫 문단만 뽑아 한 줄로 만듭니다 (해시태그 제외)."""
    text = re.sub(r"#\S+", " ", text or "")          # 해시태그는 빼고 보여줍니다
    first = ""
    for block in re.split(r"\n\s*\n", text):         # 빈 줄 기준으로 문단 나누기
        block = re.sub(r"\s+", " ", block).strip()
        if block:
            first = block
            break
    return (first[:80] + "…") if len(first) > 80 else first


def date_of(post):
    raw = pick(post, "timestamp", "taken_at", "takenAt", "created_time")
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return ""
    if dt.tzinfo:
        dt = dt.astimezone(KST)
    return dt.strftime("%Y.%m.%d")


LOGO_DIR = "assets/img"
LOGO_NAMES = ("logo-auto.png", "logo-auto.webp", "logo-auto.jpg")


def save_logo(url):
    """인스타그램 프로필 사진(어린이집 로고)을 한 번만 내려받습니다.

    이미 파일이 있으면 그대로 둡니다. 더 좋은 로고를 직접 올리셨을 때
    자동으로 덮어쓰지 않기 위해서입니다.
    """
    if not url:
        return
    if any(os.path.exists(os.path.join(LOGO_DIR, n)) for n in LOGO_NAMES):
        return
    ext = ".webp" if ".webp" in url.lower() else (".jpg" if ".jpg" in url.lower() else ".png")
    logo_path = os.path.join(LOGO_DIR, "logo-auto" + ext)
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (compatible; SeongmoDaycareBot/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=20) as res:
            raw = res.read()
        os.makedirs(LOGO_DIR, exist_ok=True)
        with open(logo_path, "wb") as f:
            f.write(raw)
        print("로고를 저장했습니다:", logo_path)
    except Exception as exc:              # 로고를 못 받아도 홈페이지는 그대로 동작합니다
        print("로고를 내려받지 못했습니다:", exc)


def collect(feed_url):
    data = fetch(feed_url)
    if isinstance(data, dict):
        save_logo(pick(data, "profilePictureUrl", "profile_picture_url"))
    raw = data if isinstance(data, list) else (data.get("posts") or data.get("data") or [])

    posts = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        link = pick(item, "permalink", "link", "url")
        image = image_of(item)
        if not link or not image:
            continue
        posts.append({
            "link": link,
            "image": image,
            "caption": clean_caption(pick(item, "prunedCaption", "caption", "text")),
            "date": date_of(item),
        })
        if len(posts) >= MAX_POSTS:
            break
    return posts


def main():
    feed_url = (os.environ.get("BEHOLD_FEED_URL") or "").strip() or DEFAULT_FEED_URL
    if not feed_url:
        print("피드 주소가 없어 인스타그램 가져오기를 건너뜁니다.")
        return 0

    try:
        posts = collect(feed_url)
    except Exception as exc:
        print("인스타그램을 불러오지 못했습니다:", exc)
        # 실패해도 기존 파일은 그대로 두어 홈페이지가 비어 보이지 않게 합니다
        if os.path.exists(OUT_PATH):
            print("이전에 저장된 게시물을 그대로 유지합니다.")
            return 0
        posts = []

    if not posts and os.path.exists(OUT_PATH):
        print("새로 가져온 게시물이 없어 기존 파일을 유지합니다.")
        return 0

    data = {
        "안내": "이 파일은 GitHub 이 자동으로 갱신합니다. 직접 고치지 않으셔도 됩니다.",
        "updated": datetime.now(KST).strftime("%Y.%m.%d %H:%M"),
        "profileUrl": PROFILE_URL,
        "posts": posts,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"저장 완료: {OUT_PATH} (게시물 {len(posts)}개)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
