// 웰다잉: 삶의 마무리를 스스로 생각하는 공간. 질문은 건너뛸 수 있고 언제든 멈출 수 있다.
// 이 앱의 기록은 법적 효력이 있는 문서가 아니며, 공식 절차는 기관 안내로 연결한다.
(function () {
  var storage = OneStep.storage;
  var ui = OneStep.ui;
  var h = ui.h;
  var BASE = '#/welldying';

  var OFFICIAL_URL = 'https://lst.go.kr/addt/medicalintent.do';
  var OFFICIAL_TEL = '1855-0075';
  var CHECKED_ON = '2026년 11월 2일';

  var content = null;
  var loading = null;
  var root = null;

  function load() {
    if (content) return Promise.resolve(content);
    if (!loading) {
      loading = fetch('content/welldying.json?v=5')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { content = j; return j; })
        .catch(function (e) { loading = null; throw e; });
    }
    return loading;
  }

  // ---------- 저장 ----------

  function data() {
    var d = storage.get('reflections', {});
    d.answers = d.answers || {};
    d.checklist = d.checklist || [];
    d.discuss = d.discuss || { picked: [], custom: [] };
    d.discuss.picked = d.discuss.picked || [];
    d.discuss.custom = d.discuss.custom || [];
    return d;
  }

  function saveData(d, msgEl) {
    if (storage.set('reflections', d)) return true;
    if (msgEl) msgEl.textContent = '저장하지 못했어요. 「내 데이터와 설정」에서 내보내기를 해 두세요.';
    return false;
  }

  function introSeen() { return !!storage.get('settings', {}).welldyingIntro; }
  function markIntroSeen() {
    var s = storage.get('settings', {});
    s.welldyingIntro = true;
    storage.set('settings', s);
  }

  // ---------- 공통 조각 ----------

  // 화면을 다시 그릴 때마다 머리 영역(색 배경+아이콘)을 입힌다.
  function show(nodes) {
    root.textContent = '';
    nodes.forEach(function (n) { if (n) root.appendChild(n); });
    OneStep.ui.decorate(root, 'dying', 'dying');
  }

  // 제목에 포커스를 두고 맨 위로 올린다.
  function finish() {
    var heading = root.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  // 허브의 메뉴 줄: 작은 그림 + 제목 + 설명 + 화살표
  function menuCard(id, emoji, href, title, sub) {
    return h('a', { class: 'menu-card m-' + id, href: href }, [
      h('span', { class: 'menu-ico', 'aria-hidden': 'true', text: emoji }),
      h('span', { class: 'menu-text' }, [h('strong', { text: title }), h('small', { text: sub })]),
      h('span', { class: 'chev', 'aria-hidden': 'true', text: '›' })
    ]);
  }
  function backLinks(toHub) {
    return h('div', { class: 'row' }, [
      toHub ? h('a', { class: 'back', href: BASE, text: '← 웰다잉으로' }) : null,
      h('a', { class: 'back', href: '#/', text: '← 홈으로' })
    ]);
  }

  // 전화 걸기는 누르기 쉬운 큰 버튼으로 둔다.
  function callButton(number, label) {
    return h('a', { class: 'btn', href: 'tel:' + number, text: label });
  }

  function externalLink(href, text) {
    return h('a', { class: 'ext', href: href, target: '_blank', rel: 'noopener noreferrer', text: text });
  }

  // ---------- C1 안내 ----------

  function viewIntro() {
    show([
      h('h1', { tabindex: '-1', text: '웰다잉' }),
      h('p', { class: 'tagline', text: '내일을 준비하기' }),
      h('div', { class: 'panel' }, [
        h('p', { text: '삶에서 소중한 것과 앞으로의 돌봄에 대한 생각을, 내 속도로 정리하는 공간이에요.' }),
        h('ul', { class: 'plain' }, [
          h('li', { text: '정답도 점수도 없어요.' }),
          h('li', { text: '원하지 않는 질문은 건너뛰어도 돼요.' }),
          h('li', { text: '언제든 멈추고 나갈 수 있어요.' }),
          h('li', { text: '이곳의 기록은 법적 효력이 있는 문서가 아니에요.' })
        ])
      ]),
      h('div', { class: 'row' }, [
        h('button', { type: 'button', class: 'btn', text: '계속하기', on: { click: function () {
          markIntroSeen();
          viewHub();
          finish();
        } } }),
        h('a', { class: 'btn btn-outline', href: '#/', text: '지금은 나갈래요' })
      ])
    ]);
  }

  // ---------- 허브 ----------

  function viewHub() {
    show([
      h('h1', { tabindex: '-1', text: '웰다잉' }),
      h('p', { class: 'tagline', text: '내 속도로, 원하는 만큼만 해요.' }),
      h('div', { class: 'hero hero-dying' }, [
        h('span', { class: 'hero-art', 'aria-hidden': 'true', text: '🌱' }),
        h('p', { text: '지금부터 천천히, 나의 속도로 생각해 봐요.' })
      ]),
      h('nav', { class: 'menu-list', 'aria-label': '웰다잉 메뉴' }, [
        menuCard('ask', '💭', BASE + '/ask/0', '생각 정리 질문', '한 번에 하나씩, 건너뛰어도 돼요'),
        menuCard('list', '📋', BASE + '/list', '정리하고 싶은 일', '내가 정한 일을 체크리스트로'),
        menuCard('discuss', '💬', BASE + '/discuss', '상의할 질문', '가족이나 전문가와 나눌 이야기'),
        menuCard('help', '🏛️', BASE + '/help', '공식 기관과 도움', '공식 제도 안내와 마음이 힘들 때')
      ]),
      h('p', { class: 'quote', text: '“ 천천히 해도 괜찮아요. 오늘 한 걸음이면 충분해요. ”' }),      h('a', { class: 'text-link', href: BASE + '/answers', text: '내가 남긴 답 보기' }),
      backLinks(false)
    ]);
  }

  // ---------- C2 성찰 질문 ----------

  function viewAsk(indexStr) {
    var qs = content.questions;
    var i = parseInt(indexStr, 10);
    if (isNaN(i) || i < 0) i = 0;
    if (i >= qs.length) return viewAskDone();
    var q = qs[i];
    var d = data();
    var saved = d.answers[q.id] ? d.answers[q.id].text : '';
    var area = h('textarea', { id: 'a-text', rows: '5', maxlength: '1000', text: saved });
    var msg = h('p', { class: 'small error', role: 'alert' });
    var next = BASE + '/ask/' + (i + 1);

    show([
      h('h1', { tabindex: '-1', text: '생각 정리 질문' }),
      h('p', { class: 'small', text: (i + 1) + ' / ' + qs.length + ' · 답하고 싶지 않으면 건너뛰어도 돼요.' }),
      h('form', { novalidate: true, on: { submit: function (e) {
        e.preventDefault();
        var text = area.value.trim();
        var cur = data();
        if (text) cur.answers[q.id] = { text: text, updatedAt: new Date().toISOString() };
        else delete cur.answers[q.id];
        if (saveData(cur, msg)) go(next);
      } } }, [
        h('label', { for: 'a-text', text: q.text }),
        area,
        msg,
        h('div', { class: 'row' }, [
          h('button', { type: 'submit', class: 'btn', text: '저장하고 다음' }),
          h('a', { class: 'btn btn-outline', href: next, text: '건너뛰기' })
        ])
      ]),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE, text: '여기까지 할게요' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/help', text: '마음이 힘들다면' })
      ]),
      h('p', { class: 'small', text: '「여기까지 할게요」를 누르면 지금 쓰고 있는 글은 저장되지 않아요.' })
    ]);
  }

  function viewAskDone() {
    show([
      h('h1', { tabindex: '-1', text: '여기까지 왔어요' }),
      h('p', { text: '충분히 생각해 보셨어요. 남긴 답은 언제든 다시 보고 고치거나 지울 수 있어요.' }),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn', href: BASE + '/answers', text: '내가 남긴 답 보기' }),
        h('a', { class: 'btn btn-outline', href: BASE, text: '웰다잉으로' })
      ])
    ]);
  }

  function viewAnswers() {
    var d = data();
    var rows = [];
    content.questions.forEach(function (q, i) {
      var a = d.answers[q.id];
      if (!a) return;
      rows.push(answerItem(q, a, i));
    });
    show([
      h('h1', { tabindex: '-1', text: '내가 남긴 답' }),
      rows.length
        ? h('ul', { class: 'items' }, rows)
        : h('p', { class: 'placeholder', text: '아직 남긴 답이 없어요. 하고 싶을 때만 해도 괜찮아요.' }),
      h('a', { class: 'btn', href: BASE + '/ask/0', text: '질문 보러 가기' }),
      backLinks(true)
    ]);
  }

  function answerItem(q, a, index) {
    var li = h('li', { class: 'item' }, [
      h('p', { class: 'small', text: q.text }),
      h('p', { text: a.text }),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE + '/ask/' + index, text: '고치기' }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '삭제', on: { click: function () {
          var box = h('div', { class: 'confirm', role: 'alert' }, [
            h('p', { text: '이 답을 지울까요?' }),
            h('button', { type: 'button', class: 'btn', text: '그만두기', on: { click: viewAnswers } }),
            h('button', { type: 'button', class: 'btn btn-danger', text: '지우기', on: { click: function () {
              var d = data();
              delete d.answers[q.id];
              storage.set('reflections', d);
              viewAnswers();
            } } })
          ]);
          li.appendChild(box);
          box.querySelector('.btn').focus();
        } } })
      ])
    ]);
    return li;
  }

  // ---------- C3 정리하고 싶은 일 ----------

  function viewList() {
    var d = data();
    var input = h('input', { type: 'text', id: 'c-new', maxlength: '80', placeholder: '정리하고 싶은 일을 한 줄로' });
    var msg = h('p', { class: 'small error', role: 'alert' });

    function add(text) {
      var cur = data();
      cur.checklist.push({ id: ui.newId(), text: text, done: false });
      if (saveData(cur, msg)) { viewList(); var f = root.querySelector('#c-new'); if (f) f.focus(); }
    }

    var items = d.checklist.map(function (it) {
      var cb = h('input', { type: 'checkbox', id: 'c-' + it.id, on: { change: function () {
        var cur = data();
        cur.checklist.forEach(function (x) { if (x.id === it.id) x.done = cb.checked; });
        storage.set('reflections', cur);
      } } });
      cb.checked = !!it.done;
      return h('li', { class: 'check-row' }, [
        h('label', { class: 'check', for: 'c-' + it.id }, [cb, h('span', { text: it.text })]),
        h('button', { type: 'button', class: 'btn btn-outline small-btn', 'aria-label': '지우기: ' + it.text, text: '지우기', on: { click: function () {
          var cur = data();
          cur.checklist = cur.checklist.filter(function (x) { return x.id !== it.id; });
          storage.set('reflections', cur);
          viewList();
        } } })
      ]);
    });

    var have = {};
    d.checklist.forEach(function (x) { have[x.text] = true; });
    var sugg = content.checklist.filter(function (s) { return !have[s.text]; }).map(function (s) {
      return h('li', {}, [
        h('button', { type: 'button', class: 'pick', on: { click: function () { add(s.text); } } }, [
          h('span', { text: s.text }), h('small', { text: '목록에 담기' })
        ])
      ]);
    });

    show([
      h('h1', { tabindex: '-1', text: '정리하고 싶은 일' }),
      h('p', { class: 'tagline', text: '내가 정하고, 내 속도로 해요.' }),
      items.length ? h('ul', { class: 'items' }, items) : h('p', { class: 'placeholder', text: '아직 담은 일이 없어요.' }),
      h('form', { novalidate: true, on: { submit: function (e) {
        e.preventDefault();
        var t = input.value.trim();
        if (!t) { msg.textContent = '한 줄만 적어 주세요.'; input.focus(); return; }
        add(t);
      } } }, [
        h('label', { for: 'c-new', text: '직접 추가하기' }), input, msg,
        h('button', { type: 'submit', class: 'btn', text: '추가' })
      ]),
      sugg.length ? h('h2', { text: '이런 일도 있어요' }) : null,
      sugg.length ? h('ul', { class: 'pick-list' }, sugg) : null,
      h('p', { class: 'small', text: '계좌번호, 비밀번호, 서류 내용은 적지 않아도 돼요.' }),
      backLinks(true)
    ]);
  }

  // ---------- C4 상의할 질문 ----------

  function viewDiscuss() {
    var d = data();
    var picked = {};
    d.discuss.picked.forEach(function (id) { picked[id] = true; });
    var input = h('input', { type: 'text', id: 'd-new', maxlength: '120', placeholder: '나누고 싶은 질문을 한 줄로' });
    var msg = h('p', { class: 'small error', role: 'alert' });

    function toggle(id, on) {
      var cur = data();
      var set = cur.discuss.picked.filter(function (x) { return x !== id; });
      if (on) set.push(id);
      cur.discuss.picked = set;
      storage.set('reflections', cur);
    }

    var groups = {};
    var order = [];
    content.discuss.forEach(function (q) {
      if (!groups[q.who]) { groups[q.who] = []; order.push(q.who); }
      groups[q.who].push(q);
    });

    var body = [];
    order.forEach(function (who) {
      body.push(h('h2', { text: who }));
      body.push(h('ul', { class: 'items' }, groups[who].map(function (q) {
        var cb = h('input', { type: 'checkbox', id: 'p-' + q.id, on: { change: function () { toggle(q.id, cb.checked); } } });
        if (picked[q.id]) cb.checked = true;
        return h('li', { class: 'check-row' }, [h('label', { class: 'check', for: 'p-' + q.id }, [cb, h('span', { text: q.text })])]);
      })));
    });

    if (d.discuss.custom.length) {
      body.push(h('h2', { text: '내가 적은 질문' }));
      body.push(h('ul', { class: 'items' }, d.discuss.custom.map(function (c) {
        return h('li', { class: 'check-row' }, [
          h('span', { class: 'check-text', text: c.text }),
          h('button', { type: 'button', class: 'btn btn-outline small-btn', 'aria-label': '지우기: ' + c.text, text: '지우기', on: { click: function () {
            var cur = data();
            cur.discuss.custom = cur.discuss.custom.filter(function (x) { return x.id !== c.id; });
            storage.set('reflections', cur);
            viewDiscuss();
          } } })
        ]);
      })));
    }

    show([
      h('h1', { tabindex: '-1', text: '상의할 질문' }),
      h('p', { class: 'tagline', text: '이야기하고 싶은 질문에 체크해 두세요.' }),
      h('p', { class: 'small', text: '체크한 질문은 파일로 저장해서 상담이나 대화 때 들고 갈 수 있어요. 앱이 대신 연락하거나 보내지는 않아요.' })
    ].concat(body, [
      h('form', { novalidate: true, on: { submit: function (e) {
        e.preventDefault();
        var t = input.value.trim();
        if (!t) { msg.textContent = '한 줄만 적어 주세요.'; input.focus(); return; }
        var cur = data();
        cur.discuss.custom.push({ id: ui.newId(), text: t });
        if (saveData(cur, msg)) { viewDiscuss(); var f = root.querySelector('#d-new'); if (f) f.focus(); }
      } } }, [
        h('label', { for: 'd-new', text: '내 질문 추가하기' }), input, msg,
        h('button', { type: 'submit', class: 'btn', text: '추가' })
      ]),
      h('div', { class: 'row' }, [
        h('button', { type: 'button', class: 'btn btn-outline', text: '체크한 질문 파일로 저장', on: { click: exportDiscuss } })
      ]),
      h('p', { class: 'small', id: 'd-msg', role: 'status' }),
      backLinks(true)
    ]));
  }

  function exportDiscuss() {
    var d = data();
    var lines = [];
    content.discuss.forEach(function (q) {
      if (d.discuss.picked.indexOf(q.id) !== -1) lines.push('[' + q.who + '] ' + q.text);
    });
    d.discuss.custom.forEach(function (c) { lines.push('[내 질문] ' + c.text); });
    var msg = document.getElementById('d-msg');
    if (!lines.length) { msg.textContent = '체크한 질문이 아직 없어요.'; return; }
    ui.downloadFile('sangui-jilmun-' + ui.todayStr() + '.txt', '상의하고 싶은 질문\n\n' + lines.map(function (l) { return '- ' + l; }).join('\n') + '\n');
    msg.textContent = '파일을 저장했어요. 보관은 내가 직접 해 주세요.';
  }

  // ---------- C5 공식 기관과 도움 ----------

  function viewHelp() {
    show([
      h('h1', { tabindex: '-1', text: '공식 기관과 도움' }),
      h('div', { class: 'panel' }, [
        h('h2', { text: '연명의료에 대한 공식 안내' }),
        h('p', { text: '사전연명의료의향서는 공식 제도예요. 등록기관에서 설명을 듣고 본인이 직접 작성·등록해야 효력이 생겨요.' }),
        h('p', { class: 'notice', text: '이 앱에 남긴 답이나 목록은 그 문서가 아니고, 법적 효력도 없어요.' }),
        h('p', {}, [externalLink(OFFICIAL_URL, '국립연명의료관리기관 안내 보기 (새 창)')]),
        h('p', { text: '상담 문의 ' + OFFICIAL_TEL }),
        h('div', { class: 'row' }, [callButton(OFFICIAL_TEL.replace(/-/g, ''), OFFICIAL_TEL + ' 전화 걸기')])
      ]),
      h('div', { class: 'panel' }, [
        h('h2', { text: '마음이 힘들 때' }),
        h('p', { text: '혼자 견디지 않아도 괜찮아요. 전문 상담사와 이야기할 수 있어요.' }),
        h('p', { text: '자살예방 상담전화 109 (24시간, 무료)' }),
        h('div', { class: 'row' }, [callButton('109', '109 전화 걸기')]),
        h('p', { text: '지금 위험하거나 급한 상황이라면 119 또는 112에 바로 연락해 주세요.' }),
        h('div', { class: 'row' }, [callButton('119', '119 전화 걸기'), callButton('112', '112 전화 걸기')]),
        h('p', { class: 'small', text: '이 앱은 응급 상황에 대응할 수 없어요.' })
      ]),
      h('p', { class: 'small', text: CHECKED_ON + '에 공식 사이트에서 확인한 내용이에요. 전화번호와 제도는 바뀔 수 있으니 이용 전에 공식 사이트에서 다시 확인해 주세요.' }),
      backLinks(true)
    ]);
  }

  // ---------- 경로 분기 ----------

  function go(hash) { location.hash = hash; }

  function render(parts) {
    root = document.getElementById('wd-root');
    if (!content) {
      root.textContent = '';
      root.appendChild(h('p', { text: '불러오는 중이에요…' }));
    }
    load().then(function () {
      var a = parts[0];
      if (!a) { if (introSeen()) viewHub(); else viewIntro(); }
      else if (a === 'ask') viewAsk(parts[1]);
      else if (a === 'answers') viewAnswers();
      else if (a === 'list') viewList();
      else if (a === 'discuss') viewDiscuss();
      else if (a === 'help') viewHelp();
      else if (introSeen()) viewHub();
      else viewIntro();
      finish();
    }).catch(function () {
      root.textContent = '';
      root.appendChild(h('h1', { tabindex: '-1', text: '웰다잉' }));
      root.appendChild(h('p', { class: 'placeholder', text: '내용을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.' }));
      root.appendChild(h('a', { class: 'back', href: '#/', text: '← 홈으로' }));
    });
  }

  OneStep.views = OneStep.views || {};
  OneStep.views.welldying = render;
})();
