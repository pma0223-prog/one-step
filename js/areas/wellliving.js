// 웰리빙: 여섯 가지 영역 → 작은 실천 선택 → 계획 → 경험 기록
// 하위 화면은 #/wellliving/... 주소로 나뉜다. 사용자가 쓴 글은 textContent로만 넣는다.
(function () {
  var storage = OneStep.storage;
  var BASE = '#/wellliving';
  var PAGE = 3;

  var STATUS = [
    { id: 'done', label: '완료' },
    { id: 'partial', label: '일부 해봄' },
    { id: 'hold', label: '보류' },
    { id: 'skipped', label: '하지 않기로 함' }
  ];

  var ICONS = {
    health: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    money: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    mind: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    relation: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5.5"/>',
    dream: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    share: '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M12 10v10M3 7h18v3H3zM12 7c-3 0-4-4-1.5-4C12 3 12 7 12 7zM12 7c3 0 4-4 1.5-4C12 3 12 7 12 7z"/>'
  };

  var content = null;
  var loading = null;
  var offsets = {};
  var root = null;

  // ---------- 도우미 ----------

  var h = OneStep.ui.h;
  var todayStr = OneStep.ui.todayStr;
  var newId = OneStep.ui.newId;

  function icon(id) {
    var span = h('span', { class: 'card-icon', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 24 24">' + (ICONS[id] || '') + '</svg>';
    return span;
  }

  function go(hash) { location.hash = hash; }
  function dateLabel(s) {
    var p = (s || '').split('-');
    return p.length === 3 ? Number(p[1]) + '월 ' + Number(p[2]) + '일' : '';
  }

  function plans() { return storage.get('plans', []); }
  function records() { return storage.get('records', []); }

  function areaById(id) {
    if (!content) return null;
    for (var i = 0; i < content.areas.length; i++) if (content.areas[i].id === id) return content.areas[i];
    return null;
  }
  function areaName(id) { var a = areaById(id); return a ? a.name : ''; }

  function load() {
    if (content) return Promise.resolve(content);
    if (!loading) {
      loading = fetch('content/actions.json?v=6')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { content = j; return j; })
        .catch(function (e) { loading = null; throw e; });
    }
    return loading;
  }

  function subtabs(current) {
    var items = [
      ['home', '추천', BASE],
      ['plan', '나의 계획', BASE + '/plan'],
      ['records', '경험 기록', BASE + '/records']
    ];
    return h('nav', { class: 'subtabs', 'aria-label': '웰리빙 메뉴' }, items.map(function (it) {
      return h('a', { href: it[2], 'aria-current': it[0] === current ? 'page' : false, text: it[1] });
    }));
  }

  function header(title, sub) {
    return [h('h1', { tabindex: '-1', text: title }), sub ? h('p', { class: 'tagline', text: sub }) : null];
  }

  function show(nodes) {
    root.textContent = '';
    nodes.forEach(function (n) { if (n) root.appendChild(n); });
  }

  function saveOrWarn(key, value, msgEl) {
    if (storage.set(key, value)) return true;
    msgEl.textContent = '저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요. 「내 데이터와 설정」에서 내보내기를 해 두세요.';
    return false;
  }

  // ---------- B1 웰리빙 홈 ----------

  function viewHome() {
    var grid = h('nav', { class: 'areas grid6', 'aria-label': '생활 영역' }, content.areas.map(function (a) {
      return h('a', { class: 'card area-card a-' + a.id, href: BASE + '/area/' + a.id }, [
        icon(a.id),
        h('span', { class: 'card-text' }, [h('strong', { text: a.name }), h('small', { text: a.desc })])
      ]);
    }));
    show([
      header('웰리빙', '오늘을 잘 살기')[0],
      header('웰리빙', '오늘을 잘 살기')[1],
      subtabs('home'),
      h('p', { class: 'hint', text: '마음이 가는 영역을 골라 보세요. 오늘은 쉬어도 괜찮아요.' }),
      grid,
      h('a', { class: 'back', href: '#/', text: '← 홈으로' })
    ]);
  }

  // ---------- B2 실천 선택 ----------

  function viewArea(areaId) {
    var area = areaById(areaId);
    if (!area) return go(BASE);
    var start = offsets[areaId] || 0;
    var shown = [];
    for (var i = 0; i < Math.min(PAGE, area.items.length); i++) shown.push(area.items[(start + i) % area.items.length]);

    var list = h('ul', { class: 'pick-list' }, shown.map(function (it) {
      return h('li', {}, [
        h('a', { class: 'pick', href: BASE + '/set/' + area.id + '/' + it.id }, [
          h('span', { text: it.text }),
          h('small', { text: '고르기' })
        ])
      ]);
    }));

    var more = area.items.length > PAGE
      ? h('button', { type: 'button', class: 'btn btn-outline', text: '다른 제안 보기', on: { click: function () {
          offsets[areaId] = (start + PAGE) % area.items.length;
          viewArea(areaId);
          var first = root.querySelector('.pick');
          if (first) first.focus();
        } } })
      : null;

    show([
      h('h1', { tabindex: '-1', text: area.name }),
      h('p', { class: 'tagline', text: '오늘 해 볼 작은 일을 골라 보세요.' }),
      list,
      h('div', { class: 'row' }, [
        more,
        h('a', { class: 'btn btn-outline', href: BASE + '/set/' + area.id + '/custom', text: '직접 입력' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/rest', text: '오늘은 쉬기' })
      ]),
      h('a', { class: 'back', href: BASE, text: '← 웰리빙으로' })
    ]);
  }

  function viewRest() {
    show([
      h('h1', { tabindex: '-1', text: '오늘은 쉬어요' }),
      h('p', { text: '쉬는 것도 오늘의 좋은 선택이에요. 아무것도 남기지 않아도 괜찮아요.' }),
      h('a', { class: 'btn', href: BASE, text: '웰리빙으로 돌아가기' }),
      h('a', { class: 'back', href: '#/', text: '← 홈으로' })
    ]);
  }

  // ---------- B3 실천 설정 ----------

  function viewSet(areaId, actionId) {
    var area = areaById(areaId);
    if (!area) return go(BASE);
    var action = null;
    area.items.forEach(function (it) { if (it.id === actionId) action = it; });
    if (!action && actionId !== 'custom') return go(BASE + '/area/' + areaId);

    var textInput = h('input', { type: 'text', id: 'f-text', maxlength: '80', value: action ? action.text : '', placeholder: '예: 저녁 먹고 10분 걷기' });
    var date = h('input', { type: 'date', id: 'f-date', value: todayStr() });
    var time = h('input', { type: 'time', id: 'f-time' });
    var memo = h('textarea', { id: 'f-memo', rows: '3', maxlength: '300', placeholder: '하고 싶은 방식이나 떠오른 생각 (비워 둬도 돼요)' });
    var msg = h('p', { class: 'small error', role: 'alert' });

    var smaller = null;
    if (action) {
      var small = false;
      smaller = h('button', { type: 'button', class: 'btn btn-outline', text: '더 작게 만들기', on: { click: function () {
        small = !small;
        textInput.value = small ? action.small : action.text;
        smaller.textContent = small ? '처음 제안으로' : '더 작게 만들기';
      } } });
    }

    var hint = areaId === 'money'
      ? h('p', { class: 'small', text: '금액, 계좌번호, 비밀번호는 적지 않아도 돼요. 할 일만 적어 주세요.' })
      : null;

    var form = h('form', { novalidate: true, on: { submit: function (e) {
      e.preventDefault();
      var text = textInput.value.trim();
      if (!text) { msg.textContent = '할 일을 한 줄 적어 주세요.'; textInput.focus(); return; }
      var list = plans();
      list.push({
        id: newId(), areaId: areaId, text: text,
        date: date.value || todayStr(), time: time.value || '',
        memo: memo.value.trim(), status: 'planned', createdAt: new Date().toISOString()
      });
      if (saveOrWarn('plans', list, msg)) go(BASE + '/plan');
    } } }, [
      h('label', { for: 'f-text', text: '할 일' }), textInput,
      smaller ? h('p', { class: 'small', text: '부담스러우면 더 작게 줄여도 돼요. 내용은 직접 고칠 수 있어요.' }) : null,
      smaller,
      h('label', { for: 'f-date', text: '날짜' }), date,
      h('label', { for: 'f-time', text: '시간 (선택)' }), time,
      h('label', { for: 'f-memo', text: '메모 (선택)' }), memo,
      hint,
      msg,
      h('div', { class: 'row' }, [
        h('button', { type: 'submit', class: 'btn', text: '계획에 담기' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/area/' + areaId, text: '나중에' })
      ])
    ]);

    show([h('h1', { tabindex: '-1', text: area.name }), h('p', { class: 'tagline', text: '내 방식으로 고쳐서 담아요.' }), form]);
  }

  // ---------- B4 나의 계획 ----------

  function planItem(p) {
    var statusRow = h('div', { class: 'chips', role: 'group', 'aria-label': '결과 선택' }, STATUS.map(function (s) {
      return h('button', { type: 'button', class: 'chip', 'data-status': s.id, 'aria-pressed': p.status === s.id ? 'true' : 'false', text: s.label, on: { click: function () {
        var list = plans();
        list.forEach(function (x) { if (x.id === p.id) x.status = (x.status === s.id ? 'planned' : s.id); });
        storage.set('plans', list);
        viewPlan();
        var again = root.querySelector('[data-plan="' + p.id + '"] [data-status="' + s.id + '"]');
        if (again) again.focus();
      } } });
    }));

    var when = dateLabel(p.date) + (p.time ? ' ' + p.time : '');
    return h('li', { class: 'item', 'data-plan': p.id }, [
      h('p', { class: 'item-title', text: p.text }),
      h('p', { class: 'small', text: areaName(p.areaId) + ' · ' + when }),
      p.memo ? h('p', { class: 'small', text: p.memo }) : null,
      statusRow,
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE + '/record/' + p.id, text: '기록하기' }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '삭제', on: { click: function () { confirmRemovePlan(p); } } })
      ])
    ]);
  }

  function confirmRemovePlan(p) {
    var li = root.querySelector('[data-plan="' + p.id + '"]');
    var box = h('div', { class: 'confirm', role: 'alert' }, [
      h('p', { text: '이 계획을 지울까요?' }),
      h('button', { type: 'button', class: 'btn', text: '그만두기', on: { click: function () { viewPlan(); } } }),
      h('button', { type: 'button', class: 'btn btn-danger', text: '지우기', on: { click: function () {
        storage.set('plans', plans().filter(function (x) { return x.id !== p.id; }));
        viewPlan();
      } } })
    ]);
    li.appendChild(box);
    box.querySelector('.btn').focus();
  }

  function viewPlan() {
    var today = todayStr();
    var all = plans().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
    var groups = [
      ['오늘', all.filter(function (p) { return p.date === today; })],
      ['앞으로', all.filter(function (p) { return p.date > today; })],
      ['지난 계획', all.filter(function (p) { return p.date < today; })]
    ];
    var body = [];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      body.push(h('h2', { text: g[0] }));
      body.push(h('ul', { class: 'items' }, g[1].map(planItem)));
    });
    if (!all.length) body.push(h('p', { class: 'placeholder', text: '아직 담은 계획이 없어요. 「추천」에서 마음이 가는 일을 골라 보세요.' }));

    show([].concat(header('나의 계획', '결과는 내가 정해요. 하지 않기로 해도 괜찮아요.'), [subtabs('plan')], body,
      [h('a', { class: 'btn', href: BASE, text: '실천 고르러 가기' })]));
  }

  // ---------- B5 경험 기록 ----------

  function viewRecord(planId, editId) {
    var existing = null;
    if (editId) {
      records().forEach(function (r) { if (r.id === editId) existing = r; });
      if (!existing) return go(BASE + '/records');
    }
    var plan = null;
    var linkId = existing ? existing.planId : planId;
    if (linkId && linkId !== 'none') plans().forEach(function (p) { if (p.id === linkId) plan = p; });

    var did = h('textarea', { id: 'r-did', rows: '3', maxlength: '500', text: existing ? existing.did : '' });
    var feel = h('textarea', { id: 'r-feel', rows: '3', maxlength: '500', text: existing ? existing.feel : '' });
    var next = h('textarea', { id: 'r-next', rows: '3', maxlength: '500', text: existing ? existing.next : '' });
    var date = h('input', { type: 'date', id: 'r-date', value: existing ? existing.date : todayStr() });
    var msg = h('p', { class: 'small error', role: 'alert' });

    var form = h('form', { novalidate: true, on: { submit: function (e) {
      e.preventDefault();
      var a = did.value.trim(), b = feel.value.trim(), c = next.value.trim();
      if (!a && !b && !c) { msg.textContent = '한 줄만 적어도 괜찮아요. 적고 싶지 않다면 「건너뛰기」를 눌러 주세요.'; did.focus(); return; }
      var list = records();
      if (existing) {
        list.forEach(function (r) {
          if (r.id === existing.id) { r.did = a; r.feel = b; r.next = c; r.date = date.value || todayStr(); }
        });
      } else {
        list.push({
          id: newId(), planId: plan ? plan.id : '', areaId: plan ? plan.areaId : '',
          did: a, feel: b, next: c, date: date.value || todayStr(), createdAt: new Date().toISOString()
        });
      }
      if (saveOrWarn('records', list, msg)) go(BASE + '/records');
    } } }, [
      plan ? h('p', { class: 'context', text: '「' + plan.text + '」' }) : null,
      h('p', { class: 'small', text: '한 문장만 적어도, 비워 둬도 괜찮아요. 다른 사람 이름은 별칭으로 적어도 좋아요.' }),
      h('label', { for: 'r-did', text: '무엇을 해보았나요?' }), did,
      h('label', { for: 'r-feel', text: '어떤 느낌이 들었나요?' }), feel,
      h('label', { for: 'r-next', text: '다음에는 어떻게 하고 싶나요?' }), next,
      h('label', { for: 'r-date', text: '날짜' }), date,
      msg,
      h('div', { class: 'row' }, [
        h('button', { type: 'submit', class: 'btn', text: '저장' }),
        h('a', { class: 'btn btn-outline', href: existing ? BASE + '/records' : BASE + '/plan', text: '건너뛰기' })
      ])
    ]);

    show([h('h1', { tabindex: '-1', text: existing ? '기록 고치기' : '경험 남기기' }), form]);
  }

  // ---------- B7 남긴 경험 ----------

  function viewRecords() {
    var all = records().sort(function (a, b) { return (b.date + b.createdAt).localeCompare(a.date + a.createdAt); });
    var body = all.length
      ? [h('ul', { class: 'items' }, all.map(recordItem))]
      : [h('p', { class: 'placeholder', text: '아직 남긴 경험이 없어요. 기록은 하고 싶을 때만 남겨도 돼요.' })];

    show([].concat(header('남긴 경험', '내가 해 본 일과 느낌이에요.'), [subtabs('records')], body,
      [h('a', { class: 'btn', href: BASE + '/record/none', text: '경험 남기기' })]));
  }

  function recordItem(r) {
    var parts = [];
    if (r.did) parts.push(['해본 일', r.did]);
    if (r.feel) parts.push(['느낌', r.feel]);
    if (r.next) parts.push(['다음에는', r.next]);
    var li = h('li', { class: 'item', 'data-record': r.id }, [
      h('p', { class: 'small', text: dateLabel(r.date) + (r.areaId ? ' · ' + areaName(r.areaId) : '') })
    ].concat(parts.map(function (p) {
      return h('p', {}, [h('strong', { text: p[0] + ' ' }), p[1]]);
    })).concat([
      h('div', { class: 'row' }, [
        h('a', { class: 'btn btn-outline', href: BASE + '/record/edit/' + r.id, text: '고치기' }),
        h('a', { class: 'btn btn-outline', href: '#/legacy/import/' + r.id, text: '유산에 보관' }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '삭제', on: { click: function () {
          var box = h('div', { class: 'confirm', role: 'alert' }, [
            h('p', { text: '이 기록을 지울까요?' }),
            h('button', { type: 'button', class: 'btn', text: '그만두기', on: { click: viewRecords } }),
            h('button', { type: 'button', class: 'btn btn-danger', text: '지우기', on: { click: function () {
              storage.set('records', records().filter(function (x) { return x.id !== r.id; }));
              viewRecords();
            } } })
          ]);
          li.appendChild(box);
          box.querySelector('.btn').focus();
        } } })
      ])
    ]));
    return li;
  }

  // ---------- 경로 분기 ----------

  function render(parts) {
    root = document.getElementById('wl-root');
    if (!content) {
      root.textContent = '';
      root.appendChild(h('p', { text: '불러오는 중이에요…' }));
    }
    load().then(function () {
      var a = parts[0];
      if (!a) viewHome();
      else if (a === 'area') viewArea(parts[1]);
      else if (a === 'rest') viewRest();
      else if (a === 'set') viewSet(parts[1], parts[2]);
      else if (a === 'plan') viewPlan();
      else if (a === 'records') viewRecords();
      else if (a === 'record' && parts[1] === 'edit') viewRecord(null, parts[2]);
      else if (a === 'record') viewRecord(parts[1], null);
      else viewHome();
      var heading = root.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }).catch(function () {
      root.textContent = '';
      root.appendChild(h('h1', { tabindex: '-1', text: '웰리빙' }));
      root.appendChild(h('p', { class: 'placeholder', text: '내용을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.' }));
      root.appendChild(h('a', { class: 'back', href: '#/', text: '← 홈으로' }));
    });
  }

  OneStep.views = OneStep.views || {};
  OneStep.views.wellliving = render;
})();
