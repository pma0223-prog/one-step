// 웰리빙: 여섯 가지 영역 → 작은 실천 선택 → 계획 → 경험 기록
// 하위 화면은 #/wellliving/... 주소로 나뉜다. 사용자가 쓴 글은 textContent로만 넣는다.
(function () {
  var storage = OneStep.storage;
  var BASE = '#/wellliving';
  var PAGE = 5;

  var STATUS = [
    { id: 'done', label: '완료' },
    { id: 'partial', label: '일부 해봄' },
    { id: 'hold', label: '보류' },
    { id: 'skipped', label: '하지 않기로 함' }
  ];

  // 자기점검: 점수나 합계 없이, 해 본 일이 나에게 맞았는지만 살핀다.
  var CHECK_FEEL = [
    { id: 'good', label: '편안했어요' },
    { id: 'ok', label: '보통이었어요' },
    { id: 'hard', label: '조금 힘들었어요' }
  ];
  var CHECK_SIZE = [
    { id: 'fit', label: '딱 맞았어요' },
    { id: 'smaller', label: '더 작게 하고 싶어요' },
    { id: 'bigger', label: '더 해 봐도 괜찮아요' }
  ];
  var CHECK_NEXT = [
    { id: 'again', label: '또 해 보고 싶어요' },
    { id: 'change', label: '다른 걸로 바꿔 보고 싶어요' },
    { id: 'rest', label: '잠시 쉬고 싶어요' }
  ];

  function labelOf(list, id) {
    var found = '';
    list.forEach(function (o) { if (o.id === id) found = o.label; });
    return found;
  }

  var ICONS = {
    health: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    money: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    mind: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    relation: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5.5"/>',
    dream: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    share: '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M12 10v10M3 7h18v3H3zM12 7c-3 0-4-4-1.5-4C12 3 12 7 12 7zM12 7c3 0 4-4 1.5-4C12 3 12 7 12 7z"/>'
  };

  // 실천마다 붙는 작은 그림. 장식이라 화면 읽기 프로그램은 건너뛴다.
  var EMOJI = {
    h1: '🚶', h2: '🧘', h3: '💧', h4: '📝', h5: '🌙', h6: '🪟',
    g1: '⭐', g2: '🔍', g3: '🪜', g4: '🧸', g5: '🎯',
    d1: '🌷', d2: '🙂', d3: '🛁', d4: '🌬️', d5: '✨',
    m1: '🔎', m2: '🛍️', m3: '📄', m4: '👛', m5: '🍀',
    r1: '💌', r2: '💬', r3: '🤝', r4: '📒', r5: '☕',
    s1: '♻️', s2: '🎁', s3: '👋', s4: '🌿', s5: '🎨', s6: '🚪', s7: '💛', s8: '👂', s9: '🤙', s10: '⚖️', s11: '🚲', s12: '🏡', s13: '🌱'
  };
  var VALUE_EMOJI = { care: '🤲', fair: '⚖️', env: '🌍', community: '🏘️' };
  var AREA_EMOJI = { health: '💪', dream: '🌈', mind: '🌿', money: '🐷', relation: '💕', share: '🎁' };
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
      ['home', '추천 실천', BASE],
      ['plan', '나의 계획', BASE + '/plan'],
      ['records', '기록', BASE + '/records']
    ];
    return h('nav', { class: 'subtabs', 'aria-label': '웰리빙 메뉴' }, items.map(function (it) {
      return h('a', { href: it[2], 'aria-current': it[0] === current ? 'page' : false, text: it[1] });
    }));
  }

  function header(title, sub) {
    return [h('h1', { tabindex: '-1', text: title }), sub ? h('p', { class: 'tagline', text: sub }) : null];
  }

  // 화면을 다시 그릴 때마다 머리 영역(색 배경+아이콘)을 입힌다.
  var currentHead = 'living';

  function show(nodes) {
    root.textContent = '';
    nodes.forEach(function (n) { if (n) root.appendChild(n); });
    root.setAttribute('data-theme', currentHead);
    OneStep.ui.decorate(root, currentHead, currentHead);
  }

  function saveOrWarn(key, value, msgEl) {
    if (storage.set(key, value)) return true;
    msgEl.textContent = '저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요. 「내 데이터와 설정」에서 내보내기를 해 두세요.';
    return false;
  }

  // ---------- B1 웰리빙 홈 ----------

  function viewHome() {
    var grid = h('nav', { class: 'big-grid', 'aria-label': '생활 영역' }, content.areas.map(function (a) {
      return h('a', { class: 'big b-' + a.id, href: BASE + '/area/' + a.id }, [
        OneStep.ui.icon(a.id, 'big-icon'),
        h('span', { text: a.name }),
        h('small', { text: a.desc })
      ]);
    }));
    show([
      header('웰리빙', '오늘을 잘 살기')[0],
      header('웰리빙', '오늘을 잘 살기')[1],
      subtabs('home'),
      h('p', { class: 'hint', text: '마음이 가는 곳에서 가볍게 시작해 보아요.' }),
      grid,
      h('a', { class: 'back', href: '#/', text: '← 홈으로' })
    ]);
  }

  // ---------- B2 실천 선택 ----------

  // 내가 고른 가치와 보기 방식은 이 기기에만 저장한다.
  function wlPrefs() {
    var p = storage.get('settings', {}).wl || {};
    return { values: p.values || {}, light: !!p.light };
  }

  function saveWlPrefs(p) {
    var s = storage.get('settings', {});
    s.wl = p;
    storage.set('settings', s);
  }

  function findValue(area, id) {
    var found = null;
    (area.values || []).forEach(function (v) { if (v.id === id) found = v; });
    return found;
  }

  // 영역에서 고른 가치의 이름. 가치가 없는 영역이나 '모두 보기'이면 빈 글자.
  function valueLabelFor(areaId) {
    var area = areaById(areaId);
    if (!area || !area.values) return '';
    var chosen = wlPrefs().values[areaId];
    if (!chosen || chosen === 'all') return '';
    if (chosen.indexOf('custom:') === 0) return chosen.slice(7);
    var v = findValue(area, chosen);
    return v ? v.name : '';
  }

  var customOpen = false;

  function viewArea(areaId) {
    var area = areaById(areaId);
    if (!area) return go(BASE);
    var prefs = wlPrefs();
    var hasValues = !!(area.values && area.values.length);
    var chosen = hasValues ? prefs.values[areaId] : 'all';
    var pool = area.items;
    if (hasValues && chosen && chosen !== 'all' && chosen.indexOf('custom:') !== 0) {
      var v = findValue(area, chosen);
      if (v) pool = area.items.filter(function (it) { return it.value === v.id; });
      else chosen = undefined;
    }
    var showList = !hasValues || !!chosen;

    function setValue(value, focusSel) {
      prefs.values[areaId] = value;
      saveWlPrefs(prefs);
      offsets[areaId] = 0;
      customOpen = false;
      viewArea(areaId);
      var el = root.querySelector(focusSel);
      if (el) el.focus();
    }

    var nodes = [h('h1', { tabindex: '-1', text: area.name }), h('p', { class: 'tagline', text: hasValues ? '소중히 여기는 가치부터 골라 보세요.' : '오늘 해 볼 작은 일을 골라 보세요.' }), subtabs('home')];

    if (hasValues) {
      var isCustom = !!chosen && chosen.indexOf('custom:') === 0;
      var chips = area.values.map(function (val) {
        return h('button', { type: 'button', class: 'chip', 'data-value': val.id, 'aria-pressed': chosen === val.id ? 'true' : 'false', on: { click: function () {
          setValue(val.id, '[data-value="' + val.id + '"]');
        } } }, [h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: VALUE_EMOJI[val.id] || '💛' }), h('span', { text: val.name })]);
      });
      chips.push(h('button', { type: 'button', class: 'chip', 'data-value': 'custom', 'aria-pressed': isCustom ? 'true' : 'false', on: { click: function () {
        customOpen = true;
        viewArea(areaId);
        var f = root.querySelector('#v-custom');
        if (f) f.focus();
      } } }, [h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: '✏️' }), h('span', { text: '내가 적기' })]));
      chips.push(h('button', { type: 'button', class: 'chip', 'data-value': 'all', 'aria-pressed': chosen === 'all' ? 'true' : 'false', on: { click: function () {
        setValue('all', '[data-value="all"]');
      } } }, [h('span', { class: 'chip-emoji', 'aria-hidden': 'true', text: '🌈' }), h('span', { text: '모두 보기' })]));

      var picker = [h('h2', { text: '1. 소중히 여기는 가치' }), h('div', { class: 'chips', role: 'group', 'aria-label': '가치 선택' }, chips)];
      if (customOpen || isCustom) {
        var input = h('input', { type: 'text', id: 'v-custom', maxlength: '20', value: isCustom ? chosen.slice(7) : '', placeholder: '예: 정직, 감사' });
        var err = h('p', { class: 'small error', role: 'alert' });
        picker.push(h('form', { novalidate: true, on: { submit: function (e) {
          e.preventDefault();
          var text = input.value.trim();
          if (!text) { err.textContent = '가치를 한 단어로 적어 주세요.'; input.focus(); return; }
          setValue('custom:' + text, '.pick');
        } } }, [
          h('label', { for: 'v-custom', text: '내가 소중히 여기는 가치' }), input, err,
          h('button', { type: 'submit', class: 'btn btn-outline', text: '이 가치로 보기' })
        ]));
      }
      nodes.push(h('div', { class: 'panel' }, picker));
    }

    if (showList) {
      var key = areaId + '|' + chosen;
      var start = (offsets[areaId] || 0) % Math.max(pool.length, 1);
      var shown = [];
      for (var i = 0; i < Math.min(PAGE, pool.length); i++) shown.push(pool[(start + i) % pool.length]);

      var label = valueLabelFor(areaId);
      var head = hasValues
        ? '2. ' + (label ? '「' + label + '」에 어울리는 작은 실천' : '작은 실천')
        : null;
      if (head) nodes.push(h('h2', { text: head }));

      var msg = h('p', { class: 'small error', role: 'alert' });
      var rows = shown.map(function (it, idx) {
        var cb = h('input', { type: 'checkbox', id: 'pk-' + idx, value: it.id });
        return h('li', {}, [
          h('label', { class: 'pick-row', for: 'pk-' + idx }, [
            h('span', { class: 'row-icon b-' + area.id, 'aria-hidden': 'true', text: EMOJI[it.id] || '🌼' }),
            h('span', { class: 'row-text', text: prefs.light ? it.small : it.text }),
            cb
          ])
        ]);
      });

      function checkedItems() {
        var ids = [].slice.call(root.querySelectorAll('.pick-row input:checked')).map(function (c) { return c.value; });
        return shown.filter(function (it) { return ids.indexOf(it.id) !== -1; });
      }

      var addBtn = h('button', { type: 'button', class: 'btn btn-big', text: '선택한 실천을 오늘의 계획에 담기', on: { click: function () {
        var picked = checkedItems();
        if (!picked.length) { msg.textContent = '담고 싶은 실천을 먼저 골라 주세요. 오늘은 쉬어도 괜찮아요.'; return; }
        var list = plans();
        picked.forEach(function (it) {
          list.push({
            id: newId(), areaId: areaId, actionId: it.id, value: valueLabelFor(areaId), text: prefs.light ? it.small : it.text,
            date: todayStr(), time: '', memo: '', status: 'planned', createdAt: new Date().toISOString()
          });
        });
        if (saveOrWarn('plans', list, msg)) go(BASE + '/plan');
      } } });

      var detailBtn = h('button', { type: 'button', class: 'btn btn-outline', text: '시간·메모를 정해서 담기', on: { click: function () {
        var picked = checkedItems();
        if (!picked.length) { msg.textContent = '담고 싶은 실천을 먼저 골라 주세요.'; return; }
        go(BASE + '/set/' + area.id + '/' + picked[0].id + (prefs.light ? '/small' : ''));
      } } });

      var more = pool.length > PAGE
        ? h('button', { type: 'button', class: 'btn btn-outline', text: '다른 제안 보기', on: { click: function () {
            offsets[areaId] = (start + PAGE) % pool.length;
            viewArea(areaId);
            var first = root.querySelector('.pick-row input');
            if (first) first.focus();
          } } })
        : null;
      var light = h('button', { type: 'button', class: 'chip', 'aria-pressed': prefs.light ? 'true' : 'false', text: '오늘은 가볍게 보기', on: { click: function () {
        prefs.light = !prefs.light;
        saveWlPrefs(prefs);
        viewArea(areaId);
        var again = root.querySelector('[data-light]');
        if (again) again.focus();
      } } });
      light.setAttribute('data-light', '1');

      nodes.push(h('section', { class: 'card-today' }, [
        h('h2', { text: (AREA_EMOJI[areaId] || '🌼') + ' 오늘의 작은 실천' }),
        h('p', { class: 'lead', text: hasValues && label ? '「' + label + '」에 어울리는 일부터 시작해 보세요.' : '지금 할 수 있는 작은 일부터 시작해 보세요.' }),
        h('ul', { class: 'pick-rows' }, rows),
        h('div', { class: 'chips' }, [light])
      ]));
      nodes.push(msg);
      nodes.push(addBtn);
      nodes.push(h('div', { class: 'row' }, [
        detailBtn, more,
        h('a', { class: 'btn btn-outline', href: BASE + '/set/' + area.id + '/custom', text: '직접 입력' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/rest', text: '오늘은 쉬기' })
      ]));
      nodes.push(h('a', { class: 'tip-card', href: BASE + '/plan' }, [
        OneStep.ui.icon(area.id, 'row-icon b-' + area.id),
        h('span', { class: 'tip-text' }, [
          h('strong', { text: '작게 시작해도 충분해요 🌱' }),
          h('small', { text: '고른 실천은 「나의 계획」에서 언제든 확인해요' })
        ]),
        h('span', { class: 'chev', 'aria-hidden': 'true', text: '›' })
      ]));    } else {
      nodes.push(h('p', { class: 'placeholder', text: '가치를 하나 고르면, 그 가치에 어울리는 작은 실천을 보여 드려요. 정하기 어렵다면 「모두 보기」를 눌러도 돼요.' }));
      nodes.push(h('div', { class: 'row' }, [h('a', { class: 'btn btn-outline', href: BASE + '/rest', text: '오늘은 쉬기' })]));
    }

    nodes.push(h('a', { class: 'back', href: BASE, text: '← 웰리빙으로' }));
    show(nodes);
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

  function viewSet(areaId, actionId, mode) {
    var area = areaById(areaId);
    if (!area) return go(BASE);
    var action = null;
    area.items.forEach(function (it) { if (it.id === actionId) action = it; });
    if (!action && actionId !== 'custom') return go(BASE + '/area/' + areaId);

    var startSmall = !!action && mode === 'small';
    var textInput = h('input', { type: 'text', id: 'f-text', maxlength: '80', value: action ? (startSmall ? action.small : action.text) : '', placeholder: '예: 저녁 먹고 10분 걷기' });
    var date = h('input', { type: 'date', id: 'f-date', value: todayStr() });
    var time = h('input', { type: 'time', id: 'f-time' });
    var memo = h('textarea', { id: 'f-memo', rows: '3', maxlength: '300', placeholder: '하고 싶은 방식이나 떠오른 생각 (비워 둬도 돼요)' });
    var msg = h('p', { class: 'small error', role: 'alert' });

    var smaller = null;
    if (action) {
      var small = startSmall;
      smaller = h('button', { type: 'button', class: 'btn btn-outline', text: small ? '처음 제안으로' : '더 작게 만들기', on: { click: function () {
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
        id: newId(), areaId: areaId, actionId: action ? action.id : 'custom', value: valueLabelFor(areaId), text: text,
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
    var canCheck = p.status === 'done' || p.status === 'partial';
    return h('li', { class: 'item', 'data-plan': p.id }, [
      h('p', { class: 'item-title', text: p.text }),
      h('p', { class: 'small', text: areaName(p.areaId) + (p.value ? ' · ' + p.value : '') + ' · ' + when }),
      p.memo ? h('p', { class: 'small', text: p.memo }) : null,
      statusRow,
      p.check ? h('p', { class: 'check-summary', text: '돌아보기: ' + checkSummary(p.check) }) : null,
      h('div', { class: 'row' }, [
        canCheck ? h('a', { class: 'btn', href: BASE + '/check/' + p.id, text: p.check ? '돌아보기 고치기' : '돌아보기' }) : null,
        h('a', { class: 'btn btn-outline', href: BASE + '/record/' + p.id, text: '기록하기' }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '삭제', on: { click: function () { confirmRemovePlan(p); } } })
      ])
    ]);
  }

  function checkSummary(c) {
    return [labelOf(CHECK_FEEL, c.feel), labelOf(CHECK_SIZE, c.size), labelOf(CHECK_NEXT, c.next), c.note]
      .filter(Boolean).join(' · ');
  }

  // ---------- 자기점검: 해 본 일이 나에게 맞았는지 돌아보기 ----------

  function choiceGroup(name, legend, options, current) {
    var wrap = h('fieldset', { class: 'fieldset' }, [h('legend', { text: legend })].concat(options.map(function (o) {
      var input = h('input', { type: 'radio', name: name, value: o.id });
      if (current === o.id) input.checked = true;
      return h('label', { class: 'choice-row' }, [input, h('span', { text: o.label })]);
    })));
    return {
      node: wrap,
      value: function () {
        var c = wrap.querySelector('input:checked');
        return c ? c.value : '';
      }
    };
  }

  function findPlan(id) {
    var found = null;
    plans().forEach(function (p) { if (p.id === id) found = p; });
    return found;
  }

  function viewCheck(planId) {
    var plan = findPlan(planId);
    if (!plan) return go(BASE + '/plan');
    var c = plan.check || {};
    var g1 = choiceGroup('c-feel', '해 보니 어땠나요?', CHECK_FEEL, c.feel);
    var g2 = choiceGroup('c-size', '이 크기가 나에게 맞았나요?', CHECK_SIZE, c.size);
    var g3 = choiceGroup('c-next', '다음에는 어떻게 할까요?', CHECK_NEXT, c.next);
    var note = h('textarea', { id: 'c-note', rows: '2', maxlength: '200', text: c.note || '' });
    var msg = h('p', { class: 'small error', role: 'alert' });

    var form = h('form', { novalidate: true, on: { submit: function (e) {
      e.preventDefault();
      var vals = { feel: g1.value(), size: g2.value(), next: g3.value(), note: note.value.trim() };
      if (!vals.feel && !vals.size && !vals.next && !vals.note) {
        msg.textContent = '하나만 골라도 괜찮아요. 하고 싶지 않다면 「건너뛰기」를 눌러 주세요.';
        return;
      }
      var list = plans();
      list.forEach(function (x) {
        if (x.id === plan.id) { x.check = { feel: vals.feel, size: vals.size, next: vals.next, note: vals.note, at: new Date().toISOString() }; }
      });
      if (saveOrWarn('plans', list, msg)) go(BASE + '/checked/' + plan.id);
    } } }, [
      h('p', { class: 'context', text: '「' + plan.text + '」' }),
      h('p', { class: 'small', text: '맞고 틀린 답은 없어요. 해 본 일이 나에게 어땠는지만 가볍게 살펴봐요. 고르고 싶은 것만 골라도 돼요.' }),
      g1.node, g2.node, g3.node,
      h('label', { for: 'c-note', text: '한 줄 메모 (선택)' }), note,
      msg,
      h('div', { class: 'row' }, [
        h('button', { type: 'submit', class: 'btn', text: '저장' }),
        h('a', { class: 'btn btn-outline', href: BASE + '/plan', text: '건너뛰기' })
      ])
    ]);

    show([h('h1', { tabindex: '-1', text: '돌아보기' }), form]);
  }

  // 점검 결과에 따라 다음 걸음을 제안한다. 점수나 평가는 하지 않는다.
  function viewCheckDone(planId) {
    var plan = findPlan(planId);
    if (!plan || !plan.check) return go(BASE + '/plan');
    var c = plan.check;
    var actionKnown = plan.actionId && plan.actionId !== 'custom';
    var setBase = BASE + '/set/' + plan.areaId + '/' + (actionKnown ? plan.actionId : 'custom');
    var steps = [];

    if (c.size === 'smaller') {
      steps.push(h('a', { class: 'btn', href: actionKnown ? setBase + '/small' : setBase, text: '더 작게 다시 담기' }));
    }
    if (c.next === 'again' || c.size === 'bigger') {
      steps.push(h('a', { class: 'btn', href: setBase, text: '같은 일 다시 담기' }));
    }
    if (c.next === 'change') {
      steps.push(h('a', { class: 'btn', href: BASE + '/area/' + plan.areaId, text: '다른 제안 보기' }));
    }

    var tips = [];
    if (c.next === 'rest') tips.push('쉬는 것도 좋은 선택이에요. 준비가 되면 그때 다시 시작해요.');
    if (c.feel === 'hard' && c.size !== 'smaller') tips.push('조금 힘들었다면 일의 크기를 더 줄여 보는 것도 방법이에요.');
    if (!steps.length && !tips.length) tips.push('돌아본 것만으로도 충분해요.');

    show([].concat(
      header('돌아보기를 남겼어요', plan.text),
      [h('p', { class: 'check-summary', text: checkSummary(c) })],
      tips.map(function (t) { return h('p', { text: t }); }),
      steps.length ? [h('h2', { text: '이어서 해 볼까요?' }), h('div', { class: 'row' }, steps)] : [],
      [h('div', { class: 'row' }, [h('a', { class: 'btn btn-outline', href: BASE + '/plan', text: '나의 계획으로' })])]
    ));
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

    show([].concat(header('남긴 경험', '내가 해 본 일과 느낌이에요.'), [subtabs('records')], weeklyReview(), body,
      [h('a', { class: 'btn', href: BASE + '/record/none', text: '경험 남기기' })]));
  }

  // 이번 주 돌아보기: 횟수·비율·그래프 없이, 해 본 일을 느낌별로 묶어 글로만 보여 준다.
  function weeklyReview() {
    var from = new Date();
    from.setDate(from.getDate() - 6);
    var fromStr = from.getFullYear() + '-' + OneStep.ui.pad(from.getMonth() + 1) + '-' + OneStep.ui.pad(from.getDate());
    var checked = plans().filter(function (p) { return p.check && p.date >= fromStr; });

    var box = [h('h2', { text: '이번 주 돌아보기' })];
    if (!checked.length) {
      box.push(h('p', { class: 'small', text: '실천을 해 보고 「나의 계획」에서 「돌아보기」를 남기면 여기에서 한눈에 볼 수 있어요.' }));
      return [h('div', { class: 'panel' }, box)];
    }

    CHECK_FEEL.forEach(function (f) {
      var group = checked.filter(function (p) { return p.check.feel === f.id; });
      if (!group.length) return;
      box.push(h('p', { class: 'review-label', text: f.label }));
      box.push(h('ul', { class: 'plain' }, group.map(function (p) { return h('li', { text: p.text }); })));
    });

    var tips = [];
    if (checked.some(function (p) { return p.check.feel === 'hard' || p.check.size === 'smaller'; })) {
      tips.push('조금 버거웠던 일은 더 작게 줄여서 다시 담아 보세요.');
    }
    if (checked.some(function (p) { return p.check.next === 'rest'; })) {
      tips.push('쉬고 싶다고 한 일이 있어요. 쉬어 가도 괜찮아요.');
    }
    if (checked.some(function (p) { return p.check.size === 'bigger'; })) {
      tips.push('더 해 봐도 괜찮다고 한 일은 조금 키워 보는 것도 좋아요.');
    }
    tips.forEach(function (t) { box.push(h('p', { class: 'small', text: t })); });
    return [h('div', { class: 'panel' }, box)];
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

  // 화면 머리의 아이콘과 색: 특정 영역의 화면이면 그 영역의 것, 아니면 웰리빙 것
  function headFor(parts) {
    var id = null;
    var a = parts[0];
    if (a === 'area' || a === 'set') id = parts[1];
    else if (a === 'check' || a === 'checked' || (a === 'record' && parts[1] !== 'edit' && parts[1] !== 'none')) {
      var p = findPlan(parts[1]);
      id = p ? p.areaId : null;
    }
    return id && areaById(id) ? id : 'living';
  }

  function render(parts) {
    root = document.getElementById('wl-root');
    if (!content) {
      root.textContent = '';
      root.appendChild(h('p', { text: '불러오는 중이에요…' }));
    }
    load().then(function () {
      var a = parts[0];
      currentHead = headFor(parts);
      if (!a) viewHome();
      else if (a === 'area') viewArea(parts[1]);
      else if (a === 'rest') viewRest();
      else if (a === 'set') viewSet(parts[1], parts[2], parts[3]);
      else if (a === 'plan') viewPlan();
      else if (a === 'check') viewCheck(parts[1]);
      else if (a === 'checked') viewCheckDone(parts[1]);
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
