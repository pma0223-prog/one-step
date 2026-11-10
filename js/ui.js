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
  // ---------- 화면 아래 응원 문구와 자연 그림 ----------
  // 문구는 이 앱을 위해 새로 쓴 말이고, 그림은 직접 그린 SVG라서 따로 저작권을 확인할 것이 없다.
  var SCENES = {
    living: '<rect width="360" height="110" fill="#fff6dc"/><circle cx="290" cy="30" r="17" fill="#fbc84a"/><g stroke="#f7b733" stroke-width="3" stroke-linecap="round"><path d="M290 4v6M290 50v6M264 30h6M310 30h6M272 12l4 4M304 44l4 4M308 12l-4 4M276 44l-4 4"/></g><path d="M0 80c60-30 120-24 190-8s120 4 170-12v50H0z" fill="#9ed49a"/><path d="M0 95c70-18 140-12 210-2s100 0 150-8v25H0z" fill="#6fba7a"/><g fill="#f48fa0"><circle cx="60" cy="92" r="4"/><circle cx="96" cy="98" r="4"/><circle cx="250" cy="96" r="4"/></g><g fill="#fff"><circle cx="60" cy="92" r="1.6"/><circle cx="96" cy="98" r="1.6"/><circle cx="250" cy="96" r="1.6"/></g><path d="M40 52c4-6 10-6 14 0-4 4-10 4-14 0zM70 40c4-6 10-6 14 0-4 4-10 4-14 0z" fill="none" stroke="#7a8a9a" stroke-width="2"/>',
    dying: '<rect width="360" height="110" fill="#e4eefb"/><circle cx="70" cy="34" r="16" fill="#fff8e1"/><circle cx="64" cy="30" r="14" fill="#e4eefb"/><g fill="#fff"><circle cx="150" cy="24" r="2"/><circle cx="210" cy="40" r="1.6"/><circle cx="300" cy="22" r="2"/></g><path d="M0 70c50-20 100-22 160-6s130 8 200-12v58H0z" fill="#b9cdea"/><path d="M0 88c80-14 150-10 220 0s100 2 140-6v28H0z" fill="#8fb0dc"/><path d="M0 98c60 6 120-4 180 2s120 2 180-4v14H0z" fill="#cfe0f6" opacity=".7"/><path d="M280 60v-14M280 54c-6-2-9-6-9-11 6 0 9 4 9 11zM280 50c6-2 9-6 9-11-6 0-9 4-9 11z" stroke="#4d9a64" stroke-width="2" fill="#6cc080"/>',
    legacy: '<rect width="360" height="110" fill="#f7ecf8"/><path d="M0 84c70-20 130-14 200-2s110 2 160-8v36H0z" fill="#d9c5e8"/><path d="M0 98c80-10 160-6 230 0s90 0 130-4v16H0z" fill="#b9d9a8"/><path d="M180 100V58" stroke="#8a6a4a" stroke-width="7" stroke-linecap="round"/><path d="M180 78l-18-14M180 70l16-12" stroke="#8a6a4a" stroke-width="4" stroke-linecap="round"/><g fill="#f4a6b8"><circle cx="164" cy="44" r="16"/><circle cx="184" cy="34" r="18"/><circle cx="204" cy="46" r="15"/><circle cx="150" cy="58" r="11"/><circle cx="214" cy="60" r="11"/></g><g fill="#f9c9d4"><circle cx="176" cy="40" r="6"/><circle cx="196" cy="50" r="5"/></g><g fill="#f4a6b8"><circle cx="110" cy="70" r="2.5"/><circle cx="250" cy="82" r="2.5"/><circle cx="130" cy="92" r="2.5"/></g>'
  };
  // 자연 그림 파일 번호(images/nature-N.webp). 영역 분위기에 맞게 나눠 둔다.
  var PHOTOS = { living: [2, 3, 5, 4], dying: [1, 6], legacy: [4, 5, 1] };
  var QUOTES = {
    living: [
      '작은 한 걸음도 분명히 앞으로 가는 걸음이에요.',
      '오늘 할 수 있는 만큼이면 충분해요.',
      '쉬어 가는 날도 길 위에 있는 날이에요.',
      '꽃은 서두르지 않아도 제때 피어요.',
      '나를 돌보는 일은 가장 먼저 해도 좋은 일이에요.',
      '느려도 괜찮아요. 멈추지만 않으면 돼요.',
      '오늘의 작은 친절이 내일의 나를 웃게 해요.',
      '바람이 불어도 오늘의 걸음은 나만의 속도로 가요.',
      '맑은 날도 흐린 날도, 나는 계속 자라고 있어요.',
      '잠깐 하늘을 올려다보는 것도 훌륭한 실천이에요.'
    ],
    dying: [
      '천천히, 내 속도로. 서두를 이유는 없어요.',
      '생각을 적는 것만으로도 마음에 길이 생겨요.',
      '소중한 사람과 나누는 이야기는 모두 선물이에요.',
      '마음이 정리되면 하루가 한결 가벼워져요.',
      '힘들 땐 혼자 두지 말고 곁의 사람에게 기대어 봐요.',
      '고요한 물처럼, 마음도 가라앉으면 맑아져요.',
      '오늘 쉬어 가도 내일은 다시 환하게 밝아 와요.'
    ],
    legacy: [
      '살아온 시간은 그 자체로 귀한 이야기예요.',
      '고마운 마음은 적어 두면 오래 따뜻해요.',
      '작은 기억 하나가 누군가에게는 큰 힘이 돼요.',
      '전하는 말은 길지 않아도 마음은 충분히 닿아요.',
      '지나온 길마다 배운 것이 있어요.',
      '나무 그늘처럼, 내 이야기가 누군가의 쉼이 될 수 있어요.',
      '꽃길이 아니어도 걸어온 길은 모두 아름다워요.'
    ]
  };

  // 허브 위쪽의 사진 배너: 사진 위에 흰 막을 얹어 글씨가 또렷하게 보인다.
  function photoHero(name, lines) {
    var p = h('p', {});
    lines.forEach(function (line, i) {
      if (i) p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(line));
    });
    var box = h('div', { class: 'hero hero-photo' }, [p]);
    box.style.backgroundImage = 'url(images/' + name + '.webp?v=1)';
    return box;
  }
  function footer(theme, seedText) {
    var key = QUOTES[theme] ? theme : 'living';
    var list = QUOTES[key];
    var d = new Date();
    var day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    var sum = 0;
    String(seedText || '').split('').forEach(function (c) { sum += c.charCodeAt(0); });
    var box = h('aside', { class: 'nature-foot nf-' + key });
    var art = h('span', { class: 'nature-art', 'aria-hidden': 'true' });
    var pics = PHOTOS[key];
    var img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = 'images/nature-' + pics[(day + sum + 1) % pics.length] + '.webp?v=1';
    img.onerror = function () {
      art.textContent = '';
      art.innerHTML = '<svg viewBox="0 0 360 110" preserveAspectRatio="xMidYMid slice" focusable="false">' + SCENES[key] + '</svg>';
    };
    art.appendChild(img);
    box.appendChild(art);
    box.appendChild(h('p', { class: 'nature-quote', text: '“ ' + list[(day + sum) % list.length] + ' ”' }));
    return box;
  }
  // 세 영역(웰리빙·웰다잉·마음의 유산)은 그림 파일, 나머지는 도형 아이콘을 쓴다.
  var PICS = { living: 1, dying: 1, legacy: 1 };
  function icon(key, className) {
    var span = h('span', { class: (className || 'head-icon') + (PICS[key] ? ' pic' : ''), 'aria-hidden': 'true' });
    if (PICS[key]) { span.innerHTML = '<img src="images/icon-' + key + '.webp?v=1" alt="" decoding="async">'; return span; }
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
    if (!root.querySelector('.nature-foot')) root.appendChild(footer(theme, title.textContent));
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
    decorate: decorate, footer: footer, photoHero: photoHero, h: h, pad: pad, todayStr: todayStr, newId: newId, downloadFile: downloadFile };
})(window);
