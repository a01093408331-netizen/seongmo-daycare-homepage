/* =========================================================
   성모영아전담어린이집 홈페이지 스크립트
   ---------------------------------------------------------
   1) 모바일 메뉴 열기/닫기
   2) 스크롤 시 헤더 그림자 + 현재 메뉴 표시
   3) 스크롤할 때 자연스러운 등장 효과
   4) 맨 위로 버튼
   5) 상담 신청 폼 (메일 프로그램으로 연결)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1) 모바일 메뉴 ---------- */
  var menuBtn   = document.getElementById('menuBtn');
  var menuClose = document.getElementById('menuClose');
  var mobileNav = document.getElementById('mobileNav');
  var lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    mobileNav.hidden = false;
    // 화면에 그린 뒤 애니메이션이 동작하도록 한 프레임 뒤에 클래스 추가
    requestAnimationFrame(function () { mobileNav.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', '메뉴 닫기');
    document.body.style.overflow = 'hidden';
    if (menuClose) menuClose.focus();
  }

  function closeMenu() {
    if (!mobileNav || mobileNav.hidden) return;
    mobileNav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', '메뉴 열기');
    document.body.style.overflow = '';
    window.setTimeout(function () { mobileNav.hidden = true; }, 320);
    if (lastFocus) lastFocus.focus();
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      if (mobileNav.hidden) { openMenu(); } else { closeMenu(); }
    });
    if (menuClose) menuClose.addEventListener('click', closeMenu);

    // 메뉴 항목을 누르면 자동으로 닫기
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    // 어두운 배경(패널 바깥) 클릭 시 닫기
    mobileNav.addEventListener('click', function (e) {
      if (e.target === mobileNav) closeMenu();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- 2) 헤더 & 현재 보고 있는 메뉴 표시 ---------- */
  var header   = document.getElementById('header');
  var toTop    = document.getElementById('toTop');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.gnb a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (toTop)  toTop.classList.toggle('is-show', y > 500);

    // 현재 위치에 해당하는 메뉴에 표시
    var offset = y + (header ? header.offsetHeight : 0) + 40;
    var currentId = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= offset) currentId = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + currentId);
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();

  /* ---------- 3) 스크롤 등장 효과 ---------- */
  var revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);   // 한 번만 실행 (성능)
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealItems.forEach(function (el) { io.observe(el); });
  } else {
    // 오래된 브라우저에서는 그냥 바로 보이게
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 4) 맨 위로 버튼 ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 5) 상담 신청 폼 ---------- */
  /* 상담 신청을 받을 메일 주소 */
  var RECEIVE_EMAIL = 'sungmo720@naver.com';

  var form = document.getElementById('contactForm');
  var help = document.getElementById('formHelp');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name  = form.name.value.trim();
      var phone = form.phone.value.trim();
      var agree = form.agree.checked;

      // 간단한 확인
      function markError(input, on) {
        input.classList.toggle('is-error', on);
      }
      markError(form.name, !name);
      markError(form.phone, !phone);

      if (!name || !phone) {
        showHelp('보호자 성함과 연락처를 입력해 주세요.', 'is-error');
        (!name ? form.name : form.phone).focus();
        return;
      }
      if (!agree) {
        showHelp('개인정보 수집·이용에 동의해 주세요.', 'is-error');
        form.agree.focus();
        return;
      }

      // 메일 내용 만들기
      var lines = [
        '[성모영아전담어린이집 입소상담 신청]',
        '',
        '보호자 성함 : ' + name,
        '연락처 : ' + phone,
        '아이 생년월일 : ' + (form.birth.value.trim() || '-'),
        '희망 반 : ' + form.age.value,
        '희망 입소 시기 : ' + (form.when.value.trim() || '-'),
        '',
        '문의 내용',
        (form.message.value.trim() || '-'),
        '',
        '(개인정보 수집·이용 동의 완료)'
      ];

      var mailto = 'mailto:' + RECEIVE_EMAIL +
        '?subject=' + encodeURIComponent('[입소상담] ' + name + ' 보호자님') +
        '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = mailto;
      showHelp('메일 프로그램이 열립니다. 열리지 않으면 전화로 문의해 주세요.', 'is-ok');
    });

    // 다시 입력하면 오류 표시 해제
    form.querySelectorAll('input, textarea').forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('is-error'); });
    });
  }

  function showHelp(text, cls) {
    if (!help) return;
    help.textContent = text;
    help.classList.remove('is-error', 'is-ok');
    if (cls) help.classList.add(cls);
  }

  /* ---------- 6) 블로그 최신 소식 자동 표시 ----------
     assets/data/blog.json 은 GitHub 이 30분마다 자동으로 갱신합니다.
     글이 없으면 이 영역은 조용히 숨겨져서 홈페이지가 비어 보이지 않습니다. */
  var newsBlock = document.getElementById('newsBlock');
  var newsList  = document.getElementById('newsList');

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 블로그 사진 주소 후보 만들기
     네이버 사진 주소는 끝의 ?type= 값에 따라 크기가 달라집니다.
     큰 사진 → 중간 사진 → 원본 순서로 차례대로 시도해 봅니다. */
  function thumbCandidates(p) {
    var list = [];
    function add(u) {
      if (u && list.indexOf(u) === -1) list.push(u);
    }
    var base = p.image || p.imageAlt || '';
    if (!base) return list;
    add(base);
    if (/\?type=/.test(base)) {
      add(base.replace(/\?type=[^&#]*/, '?type=w773'));
      add(base.replace(/\?type=[^&#]*/, '?type=w210'));
      add(base.replace(/\?type=[^&#]*/, ''));
    }
    add(p.imageAlt);
    return list;
  }

  /* 후보 주소를 차례로 시도하고, 모두 실패하면 잎사귀 그림으로 대체합니다.
     사진 서버가 응답도 오류도 주지 않고 멈춰 있는 경우가 있어서,
     4초 안에 안 나오면 실패로 보고 다음 주소로 넘어갑니다. */
  var THUMB_WAIT = 4000;

  function attachThumb(img, candidates) {
    var i = 0;
    var timer = null;
    var step = 0;                                   // 몇 번째 시도인지 (늦은 응답 무시용)
    var visible = false;                            // 화면에 들어왔는지
    var done = false;

    function clearTimer() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function finish() { done = true; clearTimer(); }

    function giveUp() {
      finish();
      var box = img.parentNode;                     // 지우기 전에 먼저 찾아둡니다
      if (box) box.className = 'news__thumb news__thumb--empty';
      img.remove();
    }

    /* 사진은 화면에 들어올 때 비로소 불러오기 시작합니다(절약).
       그래서 화면 밖에 있는 동안에는 시간을 재지 않습니다. */
    function arm() {
      if (done || !visible || timer) return;
      var mine = step;
      timer = window.setTimeout(function () { timer = null; tryNext(mine); }, THUMB_WAIT);
    }

    function tryNext(from) {
      if (done || from !== step) return;            // 지나간 시도의 뒤늦은 응답은 무시
      clearTimer();
      step += 1;
      if (i >= candidates.length) { giveUp(); return; }
      img.src = candidates[i];
      i += 1;
      arm();
    }

    img.addEventListener('load', finish);
    img.addEventListener('error', function () { tryNext(step); });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { visible = true; io.disconnect(); arm(); }
        });
      }, { rootMargin: '250px' });
      io.observe(img);
    } else {
      visible = true;
    }

    tryNext(0);
  }

  function renderNews(data) {
    if (!newsBlock || !newsList) return;
    var posts = (data && data.posts) || [];
    if (!posts.length) { newsBlock.hidden = true; return; }

    var chains = [];
    newsList.innerHTML = posts.map(function (p) {
      var cands = thumbCandidates(p);
      var thumb;
      if (cands.length) {
        chains.push(cands);
        thumb = '<div class="news__thumb"><img alt="" loading="lazy" ' +
                'referrerpolicy="no-referrer" decoding="async" ' +
                'data-thumb="' + (chains.length - 1) + '"></div>';
      } else {
        thumb = '<div class="news__thumb news__thumb--empty"></div>';
      }
      return '<li class="news__item">' +
        '<a href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">' +
          thumb +
          '<div class="news__body">' +
            (p.date ? '<span class="news__date">' + escapeHtml(p.date) + '</span>' : '') +
            '<span class="news__title">' + escapeHtml(p.title) + '</span>' +
            (p.summary ? '<p class="news__desc">' + escapeHtml(p.summary) + '</p>' : '') +
          '</div>' +
        '</a></li>';
    }).join('');

    // 사진 불러오기 시작 (실패하면 다음 주소로 자동 재시도)
    newsList.querySelectorAll('img[data-thumb]').forEach(function (img) {
      attachThumb(img, chains[Number(img.getAttribute('data-thumb'))]);
    });

    var up = document.getElementById('newsUpdated');
    if (up && data.updated) up.textContent = '마지막 확인 : ' + data.updated;

    newsBlock.hidden = false;
    newsBlock.classList.add('is-visible');
  }

  if (newsBlock && window.fetch) {
    fetch('assets/data/blog.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(renderNews)
      .catch(function () { /* 파일을 못 읽어도 홈페이지는 그대로 동작합니다 */ });
  }

  /* ---------- 7) 인스타그램 소식 ----------
     assets/data/insta.json 에 게시물 주소를 넣으면 이 자리에 나타납니다.
     비어 있으면 '인스타그램 바로가기' 안내가 그대로 보입니다. */
  var instaGrid = document.getElementById('instaGrid');
  var instaGo   = document.getElementById('instaGo');

  /* 인스타그램 주소에서 게시물 번호만 뽑아냅니다 (p / reel / tv 모두 가능) */
  function instaEmbedUrl(url) {
    var m = String(url || '').match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    return m ? 'https://www.instagram.com/p/' + m[1] + '/embed/' : '';
  }

  /* 사진이 있는 게시물은 우리 홈페이지 디자인의 사진 카드로 보여줍니다 */
  function instaCard(p) {
    return '<a class="insta__card" href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">' +
      '<span class="insta__photo"><img alt="" loading="lazy" decoding="async" ' +
        'referrerpolicy="no-referrer" src="' + escapeHtml(p.image) + '"></span>' +
      '<span class="insta__caption">' +
        (p.date ? '<em>' + escapeHtml(p.date) + '</em>' : '') +
        escapeHtml(p.caption || '인스타그램에서 보기') +
      '</span></a>';
  }

  function renderInsta(data) {
    if (!instaGrid) return;
    var posts = (data && data.posts) || [];

    // ① 사진 정보까지 들어 있는 경우 → 사진 카드 6개
    var cards = posts.filter(function (p) {
      return p && typeof p === 'object' && p.image && p.link;
    }).slice(0, 6);

    if (cards.length) {
      instaGrid.className = 'insta__grid insta__grid--cards';
      instaGrid.innerHTML = cards.map(instaCard).join('');
      // 사진을 못 불러오면 그 카드만 조용히 숨깁니다
      instaGrid.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('error', function () {
          var card = img.closest('.insta__card');
          if (card) card.hidden = true;
          if (!instaGrid.querySelector('.insta__card:not([hidden])')) {
            instaGrid.hidden = true;
            if (instaGo) instaGo.hidden = false;
          }
        });
      });
      instaGrid.hidden = false;
      if (instaGo) instaGo.hidden = true;
      return;
    }

    // ② 게시물 주소만 적어 둔 경우 → 인스타그램 공식 보기창 3개
    var urls = posts.map(function (p) {
      return instaEmbedUrl(typeof p === 'string' ? p : (p && p.link));
    }).filter(Boolean).slice(0, 3);
    if (!urls.length) return;                 // 그대로 안내 화면 유지

    instaGrid.innerHTML = urls.map(function (u) {
      return '<div class="insta__cell"><iframe src="' + u + '" loading="lazy" ' +
             'title="인스타그램 게시물" scrolling="no" allowtransparency="true"></iframe></div>';
    }).join('');
    instaGrid.hidden = false;
    if (instaGo) instaGo.hidden = true;
  }

  if (instaGrid && window.fetch) {
    fetch('assets/data/insta.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(renderInsta)
      .catch(function () { /* 파일이 없어도 홈페이지는 그대로 동작합니다 */ });
  }

  /* ---------- 8) 올해 연도 자동 표시 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
