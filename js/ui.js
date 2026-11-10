// 화면 조각을 만드는 공용 도우미. 사용자가 쓴 글은 textContent로만 넣어 코드로 해석되지 않게 한다.
(function (global) {
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (v === true) el.setAttribute(k, '');
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function downloadFile(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // 홈 화면과 같은 색 아이콘(48×48). 화면 머리와 메뉴 카드에서 함께 쓴다.
  var ICONS = {
    health: '<path d="M24 41S7 31 7 19a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22z" fill="#ef5b5b"/><path d="M10 24h8l3-6 5 12 3-6h9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    money: '<path d="M8 33v5c0 3 7 5 16 5s16-2 16-5v-5z" fill="#e69a1e"/><ellipse cx="24" cy="33" rx="16" ry="5" fill="#f7c24a"/><path d="M8 24v5c0 3 7 5 16 5s16-2 16-5v-5z" fill="#e69a1e"/><ellipse cx="24" cy="24" rx="16" ry="5" fill="#f7c24a"/><path d="M8 15v5c0 3 7 5 16 5s16-2 16-5v-5z" fill="#e69a1e"/><ellipse cx="24" cy="15" rx="16" ry="5" fill="#fad565"/>',
    mind: '<path d="M24 43V26" stroke="#2f8a4a" stroke-width="3.2" stroke-linecap="round"/><path d="M24 28c0-10 7-16 18-16 0 10-7 16-18 16z" fill="#43a35a"/><path d="M24 32c0-8-5-12-15-12 0 8 5 12 15 12z" fill="#6cc080"/>',
    relation: '<circle cx="10" cy="19" r="5" fill="#8f9ae8"/><path d="M1 38c0-7 4-11 9-11 2 0 3.5.5 5 1.5-2 2.5-3 5.5-3 9.5z" fill="#8f9ae8"/><circle cx="38" cy="19" r="5" fill="#8f9ae8"/><path d="M47 38c0-7-4-11-9-11-2 0-3.5.5-5 1.5 2 2.5 3 5.5 3 9.5z" fill="#8f9ae8"/><circle cx="24" cy="15" r="7" fill="#6b63d6"/><path d="M11 40c0-8 5-14 13-14s13 6 13 14z" fill="#6b63d6"/>',
    dream: '<circle cx="24" cy="25" r="18" fill="#8d5bd0"/><circle cx="24" cy="25" r="13" fill="#fff"/><circle cx="24" cy="25" r="9" fill="#a875e0"/><circle cx="24" cy="25" r="4.5" fill="#fff"/><path d="M25 24L41 7" stroke="#e8a33a" stroke-width="3" stroke-linecap="round"/><path d="M36 6h6v6" stroke="#e8a33a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    share: '<path d="M24 22S13 16 13 9a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1c0 7-11 13-11 13z" fill="#ef5b5b"/><path d="M3 32h9l10 3h8c2 0 3 2 1 3.5L22 40l-8-1H3z" fill="#f2a65a"/><path d="M12 32l8-3c3-1 5 1 9 1l12-5c2-1 4 1 2 3l-14 11H22" fill="#f6bb7a"/>',
    living: '<circle cx="24" cy="24" r="9" fill="#f8c33a"/><g stroke="#f0a020" stroke-width="3" stroke-linecap="round"><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/></g>',
    dying: '<path d="M24 5l15 6v11c0 10-7 17-15 21-8-4-15-11-15-21V11z" fill="#3b82d6"/><path d="M16 24l6 6 11-12" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    legacy: '<path d="M5 10h15a4 4 0 0 1 4 4v26a4 4 0 0 0-4-4H5z" fill="#f48fa0"/><path d="M43 10H28a4 4 0 0 0-4 4v26a4 4 0 0 1 4-4h15z" fill="#e8667c"/><path d="M24 27s-5-3-5-6.5a3 3 0 0 1 5-1.5 3 3 0 0 1 5 1.5C29 24 24 27 24 27z" fill="#fff"/>',
    ask: '<path d="M8 10a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-9 8v-8h-1a4 4 0 0 1-4-4z" fill="#5b8fd9"/><path d="M17 15h14M17 22h9" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    list: '<rect x="9" y="6" width="30" height="36" rx="5" fill="#5fae92"/><path d="M16 17l3 3 5-6M16 29l3 3 5-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 18h6M28 30h6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    help: '<circle cx="24" cy="24" r="18" fill="#f2a65a"/><path d="M24 22v11" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="15" r="2.6" fill="#fff"/>',
    settings: '<g fill="#7f9a86"><rect x="21" y="3" width="6" height="9" rx="2"/><rect x="21" y="36" width="6" height="9" rx="2"/><rect x="3" y="21" width="9" height="6" rx="2"/><rect x="36" y="21" width="9" height="6" rx="2"/><g transform="rotate(45 24 24)"><rect x="21" y="3" width="6" height="9" rx="2"/><rect x="21" y="36" width="6" height="9" rx="2"/><rect x="3" y="21" width="9" height="6" rx="2"/><rect x="36" y="21" width="9" height="6" rx="2"/></g><circle cx="24" cy="24" r="14"/></g><circle cx="24" cy="24" r="6" fill="#fff"/>'
  };

  // 화면 제목별 작은 그림과 따뜻한 한마디(배너). 장식이라 화면 읽기 프로그램은 건너뛴다.
  var HEROES = {
    '웰리빙': ['☀️', '마음이 가는 곳에서 가볍게 시작해 보세요.'],
    '나의 계획': ['🗓️', '오늘 해 볼 일들이에요. 못 해도 괜찮아요.'],
    '남긴 경험': ['📔', '해 본 일과 느낀 점이 차곡차곡 쌓여요.'],
    '돌아보기': ['🔍', '잘했는지가 아니라, 나에게 맞았는지만 살펴봐요.'],
    '돌아보기를 남겼어요': ['🎉', '여기까지 해 본 것만으로도 충분해요.'],
    '오늘은 쉬어요': ['🛌', '쉬는 것도 오늘의 좋은 선택이에요.'],
    '생각 정리 질문': ['💭', '답하고 싶은 것만, 짧게 적어도 괜찮아요.'],
    '여기까지 왔어요': ['🌼', '천천히 잘 해 오셨어요.'],
    '내가 남긴 답': ['📝', '내가 적어 둔 생각들이에요.'],
    '정리하고 싶은 일': ['📋', '하고 싶은 일만 골라 체크해 보세요.'],
    '상의할 질문': ['💬', '가까운 사람과 나누고 싶은 이야기를 골라 보세요.'],
    '공식 기관과 도움': ['🏛️', '필요할 때 도움받을 곳을 모아 두었어요.'],
    '기록 가져오기': ['📥', '내가 고른 기록만 복사해 와요.'],
    '초안 만들기': ['✏️', '남긴 기록을 모아 글로 정리해 드려요.'],
    '초안': ['📜', '마음에 들게 고쳐서 쓰세요.'],
    '파일로 내보내기': ['📦', '내 기록을 파일로 간직해요.'],
    '내 데이터와 설정': ['🧺', '글자 크기, 알림, 파일 보관을 여기서 정해요.']
  };
  function icon(key, className) {
    var span = h('span', { class: className || 'head-icon', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 48 48">' + (ICONS[key] || '') + '</svg>';
    return span;
  }

  // 화면의 첫 제목(h1)과 그 아래 한 줄 설명을, 색 배경과 아이콘이 있는 머리 영역으로 감싼다.
  // 제목 요소는 그대로 옮기므로 키보드 포커스와 화면 읽기 순서는 바뀌지 않는다.
  function decorate(root, iconKey, theme) {
    var title = root.querySelector('h1');
    if (!title || title.parentElement.className.indexOf('page-head-text') !== -1) return;
    var next = title.nextElementSibling;
    var sub = next && next.classList.contains('tagline') ? next : null;
    var head = h('div', { class: 'page-head th-' + theme });
    var text = h('div', { class: 'page-head-text' });
    title.parentNode.insertBefore(head, title);
    head.appendChild(icon(iconKey));
    text.appendChild(title);
    if (sub) text.appendChild(sub);
    head.appendChild(text);
    var hero = HEROES[title.textContent];
    if (hero && !root.querySelector('.hero')) {
      var b = h('div', { class: 'hero hero-' + theme }, [h('span', { class: 'hero-art', 'aria-hidden': 'true', text: hero[0] }), h('p', { text: hero[1] })]);
      var after = head.nextElementSibling && head.nextElementSibling.classList.contains('subtabs') ? head.nextElementSibling : head;
      after.parentNode.insertBefore(b, after.nextSibling);
    }
  }

  global.OneStep = global.OneStep || {};
  global.OneStep.ui = {
    icon: icon,
    decorate: decorate, h: h, pad: pad, todayStr: todayStr, newId: newId, downloadFile: downloadFile };
})(window);
