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

  function renderNews(data) {
    if (!newsBlock || !newsList) return;
    var posts = (data && data.posts) || [];
    if (!posts.length) { newsBlock.hidden = true; return; }

    newsList.innerHTML = posts.map(function (p) {
      var thumb = p.image
        ? '<div class="news__thumb"><img src="' + escapeHtml(p.image) + '" alt="" loading="lazy" ' +
          'referrerpolicy="no-referrer" decoding="async" ' +
          'onerror="this.remove();this.parentNode.className=\'news__thumb news__thumb--empty\'"></div>'
        : '<div class="news__thumb news__thumb--empty"></div>';
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

  /* ---------- 8) 올해 연도 자동 표시 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
