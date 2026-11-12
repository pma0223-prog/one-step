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
  // 위쪽 탭: 안내 / 나의 준비 / 관련 기관
  function wdTabs(current) {
    var items = [['home', '안내', BASE], ['prep', '나의 준비', BASE + '/list'], ['help', '관련 기관', BASE + '/help']];
    return h('nav', { class: 'subtabs', 'aria-label': '웰다잉 메뉴' }, items.map(function (it) {
      return h('a', { href: it[2], 'aria-current': it[0] === current ? 'page' : false, text: it[1] });
    }));
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
      wdTabs('home'),
      OneStep.ui.photoHero('nature-1', ['지금부터 천천히,', '나의 속도로 생각해 봐요.']),
      h('nav', { class: 'menu-list', 'aria-label': '웰다잉 메뉴' }, [
        menuCard('today', '🌅', BASE + '/today', '오늘이 마지막이라면', '하고 싶은 마음을 오늘의 한 걸음으로'),
        menuCard('ask', '💭', BASE + '/ask/0', '생각 정리 질문', '한 번에 하나씩, 건너뛰어도 돼요'),
        menuCard('list', '📋', BASE + '/list', '정리하고 싶은 일', '내가 정한 일을 체크리스트로'),
        menuCard('discuss', '💬', BASE + '/discuss', '상의할 질문', '가족이나 전문가와 나눌 이야기'),
        menuCard('estate', '📑', BASE + '/info/estate', '재산과 상속', '유언·상속 절차, 어디서 확인하는지'),
        menuCard('funeral', '🌸', BASE + '/info/funeral', '장례와 추모', '장례 절차와 지원 제도 안내'),
        menuCard('help', '🏛️', BASE + '/help', '공식 기관과 도움', '공식 제도 안내와 마음이 힘들 때')
      ]),
      h('p', { class: 'quote', text: '“ 천천히 해도 괜찮아요. 오늘 한 걸음이면 충분해요. ”' }),      h('a', { class: 'text-link', href: BASE + '/answers', text: '내가 남긴 답 보기' }),
      backLinks(false)
    ]);
  }

  // ---------- 오늘이 마지막이라면 → 웰리빙 한 걸음 ----------
  // 질문 하나를 보여 주고, 고른 마음을 오늘 할 수 있는 작은 한 걸음으로 이어 준다.
  // 앱이 답을 정하지 않는다. 제안 문장은 내가 고쳐 쓸 수 있고, 쉬어가는 문이 항상 있다.

  var TODAY_OPTS = [
    { id: 'words', emoji: '💌', label: '전하고 싶은 말이 있어요', area: 'relation', area_name: '관계와 소통', step: '고마운 사람에게 안부 문자 한 줄 보내기' },
    { id: 'place', emoji: '🧭', label: '가고 싶은 곳이 있어요', area: 'dream', area_name: '꿈과 목표', step: '가고 싶은 곳을 한 군데 적어 보기' },
    { id: 'food', emoji: '🍚', label: '먹고 싶은 게 있어요', area: 'health', area_name: '건강 관리', step: '좋아하는 음식을 천천히 맛보며 먹기' },
    { id: 'tidy', emoji: '🗂️', label: '정리하고 싶은 게 있어요', area: 'money', area_name: '나의 자산 관리', step: '서랍이나 서류 한 칸만 정리하기' },
    { id: 'share', emoji: '🤲', label: '나누고 싶은 게 있어요', area: 'share', area_name: '나눔과 가치', step: '쓰지 않는 물건 하나 필요한 사람에게 주기' },
    { id: 'thanks', emoji: '🌱', label: '그냥 고마운 마음이 들어요', area: 'mind', area_name: '마음과 감사', step: '오늘 고마웠던 일 한 가지 적어 보기' }
  ];

  function todayOpt(id) {
    var found = null;
    TODAY_OPTS.forEach(function (o) { if (o.id === id) found = o; });
    return found;
  }

  function viewToday(optId) {
    var opt = todayOpt(optId);
    if (opt) return viewTodayStep(opt);
    var cards = TODAY_OPTS.map(function (o) {
      return h('li', {}, [
        h('a', { class: 'pick today-pick', href: BASE + '/today/' + o.id }, [
          h('span', { text: o.emoji + '  ' + o.label })
        ])
      ]);
    });
    show([
      h('h1', { tabindex: '-1', text: '오늘이 마지막이라면' }),
      h('p', { class: 'tagline', text: '정답 없이, 마음 가는 대로 골라 보세요.' }),
      wdTabs('home'),
      h('div', { class: 'panel' }, [
        h('p', { class: 'lead', text: '오늘이 마지막이라면, 누구에게 무슨 말을 하고 싶으세요?' }),
        h('p', { class: 'small', text: '떠오르는 마음을 하나 골라 보세요. 고른 마음을 오늘 할 수 있는 작은 한 걸음으로 이어 드려요.' })
      ]),
      h('ul', { class: 'pick-list' }, cards),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE, text: '지금은 생각하고 싶지 않아요' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/help', text: '마음이 힘들다면' })
      ]),
      h('p', { class: 'small', text: '천천히, 언제든 멈춰도 괜찮아요. 이 선택은 저장되지 않고, 담기를 눌러야만 계획에 남아요.' }),
      backLinks(true)
    ]);
  }

  function viewTodayStep(opt) {
    var input = h('input', { type: 'text', id: 't-step', maxlength: '80', value: opt.step });
    var msg = h('p', { class: 'small error', role: 'alert' });
    show([
      h('h1', { tabindex: '-1', text: opt.emoji + ' ' + opt.label }),
      h('p', { class: 'tagline', text: '그 마음을 오늘 할 수 있는 크기로 줄여 봐요.' }),
      h('form', { novalidate: true, on: { submit: function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) { msg.textContent = '한 줄만 적어 주세요.'; input.focus(); return; }
        var list = storage.get('plans', []);
        list.push({
          id: ui.newId(), areaId: opt.area, actionId: 'custom', value: '', text: text,
          date: ui.todayStr(), time: '', memo: '웰다잉 「오늘이 마지막이라면」에서 시작', status: 'planned', createdAt: new Date().toISOString()
        });
        if (storage.set('plans', list)) go('#/wellliving/plan');
        else msg.textContent = '저장하지 못했어요. 「내 데이터와 설정」에서 내보내기를 해 두세요.';
      } } }, [
        h('p', { text: '「' + opt.area_name + '」의 오늘 한 걸음으로 이런 건 어때요? 마음에 맞게 고쳐도 돼요.' }),
        h('label', { for: 't-step', text: '오늘의 한 걸음' }), input, msg,
        h('div', { class: 'row' }, [
          h('button', { type: 'submit', class: 'btn', text: '오늘의 계획에 담기' }),
          h('a', { class: 'btn btn-outline', href: BASE + '/today', text: '다른 마음 고르기' })
        ])
      ]),
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE, text: '담지 않고 나갈래요' })
      ]),
      h('p', { class: 'small', text: '담으면 웰리빙의 「나의 계획」에서 실천 결과와 느낌을 남길 수 있어요. 하지 못해도 괜찮아요.' })
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
      wdTabs('prep'),
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
      wdTabs('prep'),
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
      wdTabs('prep'),
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
      wdTabs('help'),
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

  // ---------- 정보 안내 (재산과 상속 / 장례와 추모) ----------
  // 정보만 보여 준다. 입력칸도 저장도 없고, 앱이 권하거나 판단하지 않는다.

  var INFO_CHECKED = '2026년 11월 10일';

  var INFO = {
    estate: {
      title: '재산과 상속',
      tagline: '정보만 안내해요. 앱에는 아무것도 적지 않아요.',
      hero: ['상속은 정해진 절차가 있어요.', '어디서 확인하는지만 알아 두세요.'],
      photo: 'nature-4',
      panels: [
        { h: '알아 두면 좋은 말', items: [
          '유언의 방식은 민법에 다섯 가지가 정해져 있어요. 자필증서, 녹음, 공정증서, 비밀증서, 구수증서예요.',
          '방식과 요건을 지키지 않으면 효력이 인정되지 않을 수 있어요. 작성 전에 전문가와 상의하는 것이 안전해요.',
          '상속을 포기하거나 한정승인을 하려면, 상속이 시작된 것을 안 날부터 3개월 안에 법원에 신청해야 해요.'
        ] },
        { h: '사망자의 재산·빚 조회', items: [
          '「안심상속 원스톱서비스」로 금융, 토지, 자동차, 세금, 연금 정보를 한 번에 조회할 수 있어요.',
          '정부24 누리집이나 가까운 주민센터에서 신청해요. 신청 자격과 기한은 안내가 바뀔 수 있으니 신청 전에 정부24에서 확인해 주세요.'
        ], links: [['정부24 누리집 (새 창)', 'https://www.gov.kr']] },
        { h: '어디에 물어볼 수 있나요', items: [
          '법률 상담: 대한법률구조공단 132',
          '세금 상담: 국세청 상담센터 126'
        ], calls: [['132', '132 전화 걸기'], ['126', '126 전화 걸기']] }
      ],
      note: '이 화면은 일반적인 안내예요. 개인의 상황에 맞는 판단은 변호사, 법무사, 세무사 같은 전문가에게 확인해 주세요.'
    },
    funeral: {
      title: '장례와 추모',
      tagline: '정보만 안내해요. 앱에는 아무것도 적지 않아요.',
      hero: ['장례는 갑자기 닥치는 일이라,', '미리 알아 두면 마음이 덜 급해요.'],
      photo: 'nature-5',
      panels: [
        { h: '알아 두면 좋은 말', items: [
          '사망신고는 사망 사실을 안 날부터 1개월 안에 하도록 정해져 있어요. 가까운 주민센터에서 할 수 있어요.',
          '장례식장, 화장시설, 봉안당, 자연장지의 시설과 가격 정보를 e하늘 장사정보시스템에서 볼 수 있어요.',
          '화장 예약도 e하늘에서 할 수 있어요.',
          '장례 방식은 매장, 화장 후 봉안, 자연장 등 여러 가지가 있고, 어느 것이 낫다는 정답은 없어요.'
        ], links: [['e하늘 장사정보시스템 (새 창)', 'https://15774129.go.kr/']], calls: [['15774129', '1577-4129 전화 걸기']] },
        { h: '장례 비용이 어려울 때', items: [
          '지역에 따라 장례를 지원하는 제도가 있어요. 대상과 내용은 지자체마다 달라서, 사는 곳의 시·군·구청이나 주민센터에 문의해야 정확해요.'
        ] },
        { h: '추모와 기억', items: [
          '남기고 싶은 이야기와 마음의 편지는 이 앱의 「마음의 유산」에 적어 둘 수 있어요.'
        ], inner: [['마음의 유산 열기', '#/legacy']] }
      ],
      note: '이 화면은 일반적인 안내예요. 비용과 지원 제도는 지역과 시기에 따라 달라요.'
    }
  };

  function viewInfo(key) {
    var d = INFO[key];
    if (!d) return viewHub();
    var nodes = [
      h('h1', { tabindex: '-1', text: d.title }),
      h('p', { class: 'tagline', text: d.tagline }),
      wdTabs('help'),
      OneStep.ui.photoHero(d.photo, d.hero)
    ];
    d.panels.forEach(function (p) {
      var kids = [h('h2', { text: p.h }), h('ul', { class: 'plain' }, p.items.map(function (x) { return h('li', { text: x }); }))];
      (p.links || []).forEach(function (l) { kids.push(h('p', {}, [externalLink(l[1], l[0])])); });
      var row = (p.calls || []).map(function (c) { return callButton(c[0], c[1]); });
      (p.inner || []).forEach(function (l) { row.push(h('a', { class: 'btn btn-outline', href: l[1], text: l[0] })); });
      if (row.length) kids.push(h('div', { class: 'row' }, row));
      nodes.push(h('div', { class: 'panel' }, kids));
    });
    nodes.push(h('p', { class: 'notice', text: d.note }));
    nodes.push(h('p', { class: 'small', text: INFO_CHECKED + '에 확인한 내용이에요. 제도와 전화번호는 바뀔 수 있으니 이용 전에 공식 사이트에서 다시 확인해 주세요.' }));
    nodes.push(backLinks(true));
    show(nodes);
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
      else if (a === 'today') viewToday(parts[1]);
      else if (a === 'ask') viewAsk(parts[1]);
      else if (a === 'answers') viewAnswers();
      else if (a === 'list') viewList();
      else if (a === 'discuss') viewDiscuss();
      else if (a === 'help') viewHelp();
      else if (a === 'info') viewInfo(parts[1]);
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
