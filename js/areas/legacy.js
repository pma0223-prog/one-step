// 마음의 유산: 경험과 깨달음을 내가 고른 방식으로 쌓는 개인 기록 공간.
// 다른 영역의 기록은 내가 고른 것만 복사해 오고, 자동 공개·자동 전송은 하지 않는다.
// 초안은 AI가 아니라 내가 쓴 글을 문장 틀에 담는 방식이며, 새 내용을 보태지 않는다.
(function () {
  var storage = OneStep.storage;
  var ui = OneStep.ui;
  var h = ui.h;
  var BASE = '#/legacy';
  var root = null;
  var questions = null;
  var loading = null;

  var TABS = [
    ['story', '나의 이야기', BASE],
    ['kept', '소중한 기록', BASE + '/kept'],
    ['letter', '전하고 싶은 말', BASE + '/letters']
  ];

  // ---------- 저장 ----------

  function entries() {
    var d = storage.get('legacy', {});
    return d.entries || [];
  }

  function saveEntries(list, msgEl) {
    if (storage.set('legacy', { entries: list })) return true;
    if (msgEl) msgEl.textContent = '저장하지 못했어요. 「내 데이터와 설정」에서 내보내기를 해 두세요.';
    return false;
  }

  function byType(type) {
    return entries().filter(function (e) { return e.type === type; })
      .sort(function (a, b) { return (b.date + b.createdAt).localeCompare(a.date + a.createdAt); });
  }

  function findEntry(id) {
    var found = null;
    entries().forEach(function (e) { if (e.id === id) found = e; });
    return found;
  }

  function loadQuestions() {
    if (questions) return Promise.resolve(questions);
    if (!loading) {
      loading = fetch('content/welldying.json?v=6')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { questions = j.questions; return questions; })
        .catch(function () { questions = []; return questions; });
    }
    return loading;
  }

  function questionText(id) {
    var t = '';
    (questions || []).forEach(function (q) { if (q.id === id) t = q.text; });
    return t;
  }

  // ---------- 글 만들기(문장 틀) ----------

  function dateLabel(s) {
    var p = (s || '').split('-');
    return p.length === 3 ? p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일' : '';
  }

  function entryLines(e) {
    if (e.type === 'story') {
      return [['해 본 일', e.experience], ['그때의 느낌', e.feeling], ['배운 점', e.learned], ['전하고 싶은 마음', e.message]]
        .filter(function (p) { return p[1]; })
        .map(function (p) { return p[0] + ': ' + p[1]; });
    }
    if (e.type === 'kept') return [(e.title ? e.title + '\n' : '') + e.text];
    return [(e.to ? e.to + '에게\n' : '') + e.body];
  }

  function entryText(e) {
    return '[' + dateLabel(e.date) + ']\n' + entryLines(e).join('\n');
  }

  function compose(list, tone, to, extra) {
    var polite = tone !== 'casual';
    var out = [];
    out.push(to ? to + '에게' : (polite ? '소중한 분께' : '소중한 사람에게'));
    out.push('');
    out.push(polite ? '제가 살아오며 마음에 남긴 이야기를 적어 봅니다.' : '내가 살아오며 마음에 남긴 이야기를 적어 봐.');
    list.forEach(function (e) { out.push(''); out.push(entryText(e)); });
    if (extra) { out.push(''); out.push('전하고 싶은 마음: ' + extra); }
    out.push('');
    out.push(polite ? '여기까지 읽어 주셔서 고맙습니다.' : '여기까지 읽어 줘서 고마워.');
    return out.join('\n');
  }

  // ---------- 공통 조각 ----------

  // 화면을 다시 그릴 때마다 머리 영역(색 배경+아이콘)을 입힌다.
  function show(nodes) {
    root.textContent = '';
    nodes.forEach(function (n) { if (n) root.appendChild(n); });
    OneStep.ui.decorate(root, 'legacy', 'legacy');
  }

  function tabs(current) {
    return h('nav', { class: 'subtabs', 'aria-label': '마음의 유산 메뉴' }, TABS.map(function (t) {
      return h('a', { href: t[2], 'aria-current': t[0] === current ? 'page' : false, text: t[1] });
    }));
  }

  function backLinks(toHub) {
    return h('div', { class: 'row' }, [
      toHub ? h('a', { class: 'back', href: BASE, text: '← 마음의 유산으로' }) : null,
      h('a', { class: 'back', href: '#/', text: '← 홈으로' })
    ]);
  }

  function removeBox(li, label, onYes, onNo) {
    var box = h('div', { class: 'confirm', role: 'alert' }, [
      h('p', { text: label }),
      h('button', { type: 'button', class: 'btn', text: '그만두기', on: { click: onNo } }),
      h('button', { type: 'button', class: 'btn btn-danger', text: '지우기', on: { click: onYes } })
    ]);
    li.appendChild(box);
    box.querySelector('.btn').focus();
  }

  function entryItem(e, editHref, rerender) {
    var lines = entryLines(e);
    var li = h('li', { class: 'item' }, [
      h('p', { class: 'small', text: dateLabel(e.date) + (e.type === 'kept' ? ' · ' + e.origin : '') }),
      h('p', { class: 'pre', text: lines.join('\n') }),
      h('div', { class: 'row' }, [
        editHref ? h('a', { class: 'btn btn-outline', href: editHref, text: '고치기' }) : null,
        h('button', { type: 'button', class: 'btn btn-outline', text: '삭제', on: { click: function () {
          removeBox(li, '이 기록을 지울까요?', function () {
            saveEntries(entries().filter(function (x) { return x.id !== e.id; }));
            rerender();
          }, rerender);
        } } })
      ])
    ]);
    return li;
  }

  // ---------- D1 유산 홈 (세 탭) ----------

  function viewTab(type) {
    var list = byType(type);
    var cfg = {
      story: { sub: '살면서 해 본 경험과 깨달음을 남겨요.', empty: '아직 쓴 이야기가 없어요. 성공한 일뿐 아니라 망설임이나 달라진 생각도 괜찮아요.', add: ['이야기 쓰기', BASE + '/story/new'], edit: function (e) { return BASE + '/story/' + e.id; } },
      kept: { sub: '웰리빙과 웰다잉에서 내가 고른 기록이에요.', empty: '아직 가져온 기록이 없어요. 가져오기는 내가 고른 것만 복사해 와요.', add: ['웰리빙·웰다잉에서 가져오기', BASE + '/import'], edit: null },
      letter: { sub: '소중한 사람에게 전하고 싶은 말을 적어 둬요.', empty: '아직 적은 말이 없어요. 보내지 않고 간직만 해도 괜찮아요.', add: ['전하고 싶은 말 쓰기', BASE + '/letter/new'], edit: function (e) { return BASE + '/letter/' + e.id; } }
    }[type];
    function rerender() { viewTab(type); }

    show([
      h('h1', { tabindex: '-1', text: '마음의 유산' }),
      h('p', { class: 'tagline', text: cfg.sub }),
      tabs(type),
      list.length
        ? h('ul', { class: 'items' }, list.map(function (e) { return entryItem(e, cfg.edit ? cfg.edit(e) : null, rerender); }))
        : h('p', { class: 'placeholder', text: cfg.empty }),
      h('div', { class: 'row' }, [h('a', { class: 'btn', href: cfg.add[1], text: cfg.add[0] })]),
      h('div', { class: 'panel' }, [
        h('h2', { text: '모아서 정리하기' }),
        h('p', { class: 'small', text: '기록은 내가 정하기 전에는 어디에도 보내지 않아요.' }),
        h('div', { class: 'row' }, [
          h('a', { class: 'btn btn-outline', href: BASE + '/draft', text: '초안 만들기' }),
          h('a', { class: 'btn btn-outline', href: BASE + '/export', text: '파일로 내보내기' })
        ])
      ]),
      backLinks(false)
    ]);
  }

  // ---------- D2 이야기 쓰기 ----------

  function viewStory(id) {
    var existing = id === 'new' ? null : findEntry(id);
    if (id !== 'new' && !existing) return go(BASE);
    var f = function (key) { return existing ? existing[key] || '' : ''; };
    var exp = h('textarea', { id: 's-exp', rows: '3', maxlength: '800', text: f('experience') });
    var feel = h('textarea', { id: 's-feel', rows: '3', maxlength: '800', text: f('feeling') });
    var learn = h('textarea', { id: 's-learn', rows: '3', maxlength: '800', text: f('learned') });
    var msgBox = h('textarea', { id: 's-msg', rows: '3', maxlength: '800', text: f('message') });
    var date = h('input', { type: 'date', id: 's-date', value: existing ? existing.date : ui.todayStr() });
    var err = h('p', { class: 'small error', role: 'alert' });

    show([
      h('h1', { tabindex: '-1', text: existing ? '이야기 고치기' : '이야기 쓰기' }),
      h('p', { class: 'small', text: '한 칸만 적어도 괜찮아요. 잘 안 된 일, 망설였던 일, 달라진 생각도 소중한 이야기예요. 다른 사람 이름은 별칭으로 적어도 좋아요.' }),
      h('form', { novalidate: true, on: { submit: function (ev) {
        ev.preventDefault();
        var vals = { experience: exp.value.trim(), feeling: feel.value.trim(), learned: learn.value.trim(), message: msgBox.value.trim() };
        if (!vals.experience && !vals.feeling && !vals.learned && !vals.message) {
          err.textContent = '한 줄만 적어 주세요. 적고 싶지 않다면 「그만두기」를 눌러 주세요.';
          exp.focus();
          return;
        }
        var list = entries();
        if (existing) {
          list.forEach(function (x) { if (x.id === existing.id) { Object.keys(vals).forEach(function (k) { x[k] = vals[k]; }); x.date = date.value || ui.todayStr(); } });
        } else {
          list.push({ id: ui.newId(), type: 'story', date: date.value || ui.todayStr(), experience: vals.experience, feeling: vals.feeling, learned: vals.learned, message: vals.message, createdAt: new Date().toISOString() });
        }
        if (saveEntries(list, err)) go(BASE);
      } } }, [
        h('label', { for: 's-exp', text: '어떤 경험을 했나요?' }), exp,
        h('label', { for: 's-feel', text: '그때 어떤 느낌이었나요?' }), feel,
        h('label', { for: 's-learn', text: '무엇을 배우거나 깨달았나요?' }), learn,
        h('label', { for: 's-msg', text: '전하고 싶은 마음 (선택)' }), msgBox,
        h('label', { for: 's-date', text: '날짜' }), date,
        err,
        h('div', { class: 'row' }, [
          h('button', { type: 'submit', class: 'btn', text: '저장' }),
          h('a', { class: 'btn btn-outline', href: BASE, text: '그만두기' })
        ])
      ])
    ]);
  }

  // ---------- D4 전하고 싶은 말 ----------

  function viewLetter(id) {
    var existing = id === 'new' ? null : findEntry(id);
    if (id !== 'new' && !existing) return go(BASE + '/letters');
    var to = h('input', { type: 'text', id: 'l-to', maxlength: '30', value: existing ? existing.to || '' : '', placeholder: '예: 큰딸, 오랜 친구' });
    var body = h('textarea', { id: 'l-body', rows: '8', maxlength: '2000', text: existing ? existing.body : '' });
    var err = h('p', { class: 'small error', role: 'alert' });

    show([
      h('h1', { tabindex: '-1', text: existing ? '전하고 싶은 말 고치기' : '전하고 싶은 말' }),
      h('p', { class: 'small', text: '받는 사람은 별칭으로 적어도 돼요. 연락처는 적지 않아도 되고, 이 앱이 대신 보내지 않아요.' }),
      h('form', { novalidate: true, on: { submit: function (ev) {
        ev.preventDefault();
        var text = body.value.trim();
        if (!text) { err.textContent = '전하고 싶은 말을 적어 주세요.'; body.focus(); return; }
        var list = entries();
        if (existing) {
          list.forEach(function (x) { if (x.id === existing.id) { x.to = to.value.trim(); x.body = text; } });
        } else {
          list.push({ id: ui.newId(), type: 'letter', date: ui.todayStr(), to: to.value.trim(), body: text, createdAt: new Date().toISOString() });
        }
        if (saveEntries(list, err)) go(BASE + '/letters');
      } } }, [
        h('label', { for: 'l-to', text: '받는 사람 (별칭, 선택)' }), to,
        h('label', { for: 'l-body', text: '전하고 싶은 말' }), body,
        err,
        h('div', { class: 'row' }, [
          h('button', { type: 'submit', class: 'btn', text: '저장' }),
          h('a', { class: 'btn btn-outline', href: BASE + '/letters', text: '그만두기' })
        ])
      ])
    ]);
  }

  // ---------- D3 가져오기 ----------

  function importCandidates() {
    var kept = {};
    entries().forEach(function (e) { if (e.src) kept[e.src] = true; });
    var out = [];
    storage.get('records', []).forEach(function (r) {
      var lines = [];
      if (r.did) lines.push('해 본 일: ' + r.did);
      if (r.feel) lines.push('느낌: ' + r.feel);
      if (r.next) lines.push('다음에는: ' + r.next);
      if (!lines.length) return;
      out.push({ src: 'rec:' + r.id, origin: '웰리빙 경험', title: '', text: lines.join('\n'), date: r.date, group: '웰리빙 경험 기록', imported: !!kept['rec:' + r.id] });
    });
    var answers = (storage.get('reflections', {}).answers) || {};
    Object.keys(answers).forEach(function (qid) {
      var a = answers[qid];
      if (!a || !a.text) return;
      out.push({ src: 'ans:' + qid, origin: '웰다잉 답', title: questionText(qid), text: a.text, date: (a.updatedAt || '').slice(0, 10) || ui.todayStr(), group: '웰다잉 생각 정리', imported: !!kept['ans:' + qid] });
    });
    return out;
  }

  function viewImport(preselect) {
    var cands = importCandidates();
    var checks = [];
    var err = h('p', { class: 'small error', role: 'alert' });

    function groupBlock(name) {
      var rows = cands.filter(function (c) { return c.group === name; });
      if (!rows.length) return [];
      return [h('h2', { text: name }), h('ul', { class: 'items' }, rows.map(function (c, i) {
        var cid = 'im-' + c.src.replace(':', '-');
        var cb = h('input', { type: 'checkbox', id: cid, 'data-src': c.src });
        if (c.imported) { cb.disabled = true; cb.checked = true; }
        else if (preselect && c.src === 'rec:' + preselect) cb.checked = true;
        checks.push({ cb: cb, c: c });
        return h('li', { class: 'check-row' }, [
          h('label', { class: 'check', for: cid }, [cb, h('span', { class: 'pre' }, [
            c.title ? h('strong', { text: c.title + '\n' }) : null,
            c.text,
            c.imported ? '\n(이미 가져왔어요)' : ''
          ])])
        ]);
      }))];
    }

    var body = [].concat(groupBlock('웰리빙 경험 기록'), groupBlock('웰다잉 생각 정리'));
    if (!cands.length) body = [h('p', { class: 'placeholder', text: '가져올 기록이 아직 없어요. 웰리빙에서 경험을 남기거나 웰다잉에서 답을 남기면 여기서 고를 수 있어요.' })];

    show([
      h('h1', { tabindex: '-1', text: '기록 가져오기' }),
      h('p', { class: 'tagline', text: '내가 고른 것만 복사해 와요.' }),
      h('p', { class: 'small', text: '원래 기록은 그대로 남아 있어요. 가져온 뒤에는 따로 보관돼요.' })
    ].concat(body, [
      err,
      cands.length ? h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn', text: '고른 것 가져오기', on: { click: function () {
        var chosen = checks.filter(function (x) { return !x.c.imported && x.cb.checked; });
        if (!chosen.length) { err.textContent = '가져올 기록을 먼저 골라 주세요.'; return; }
        var list = entries();
        chosen.forEach(function (x) {
          list.push({ id: ui.newId(), type: 'kept', src: x.c.src, origin: x.c.origin, title: x.c.title, text: x.c.text, date: x.c.date, createdAt: new Date().toISOString() });
        });
        if (saveEntries(list, err)) go(BASE + '/kept');
      } } })]) : null,
      backLinks(true)
    ]));
  }

  // ---------- D5 초안 만들기 ----------

  function entryPicker(list, idPrefix) {
    var boxes = [];
    var ul = h('ul', { class: 'items' }, list.map(function (e) {
      var cb = h('input', { type: 'checkbox', id: idPrefix + e.id });
      boxes.push({ cb: cb, e: e });
      return h('li', { class: 'check-row' }, [
        h('label', { class: 'check', for: idPrefix + e.id }, [cb, h('span', { class: 'pre', text: dateLabel(e.date) + '\n' + entryLines(e).join('\n') })])
      ]);
    }));
    return { ul: ul, chosen: function () { return boxes.filter(function (b) { return b.cb.checked; }).map(function (b) { return b.e; }); } };
  }

  function viewDraft() {
    var all = entries().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!all.length) {
      show([
        h('h1', { tabindex: '-1', text: '초안 만들기' }),
        h('p', { class: 'placeholder', text: '초안에 쓸 기록이 아직 없어요. 이야기를 쓰거나 기록을 가져온 뒤에 만들 수 있어요.' }),
        backLinks(true)
      ]);
      return;
    }
    var picker = entryPicker(all, 'dr-');
    var to = h('input', { type: 'text', id: 'dr-to', maxlength: '30', placeholder: '예: 큰딸, 오랜 친구 (비워 둬도 돼요)' });
    var extra = h('input', { type: 'text', id: 'dr-extra', maxlength: '200', placeholder: '고른 기록에 없다면 여기에 적어 보세요 (선택)' });
    var toneWrap = h('div', { class: 'choice', role: 'radiogroup', 'aria-label': '말투' }, [
      h('label', {}, [h('input', { type: 'radio', name: 'tone', value: 'polite', checked: 'checked' }), ' 존댓말']),
      h('label', {}, [h('input', { type: 'radio', name: 'tone', value: 'casual' }), ' 편한 말투'])
    ]);
    var err = h('p', { class: 'small error', role: 'alert' });

    show([
      h('h1', { tabindex: '-1', text: '초안 만들기' }),
      h('p', { class: 'small', text: '내가 쓴 글을 그대로 모아 문장 틀에 담아요. 새로운 내용은 더하지 않아요. 만든 뒤에는 내가 읽고 고쳐 쓰는 글이에요. 유언장이나 법적 문서가 아니에요.' }),
      h('h2', { text: '1. 사용할 기록 고르기' }),
      picker.ul,
      h('h2', { text: '2. 받는 사람과 말투' }),
      h('label', { for: 'dr-to', text: '받는 사람 (별칭, 선택)' }), to,
      h('p', { class: 'small', text: '말투' }), toneWrap,
      h('label', { for: 'dr-extra', text: '전하고 싶은 마음 한 줄 (선택)' }), extra,
      err,
      h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn', text: '초안 만들기', on: { click: function () {
        var chosen = picker.chosen();
        if (!chosen.length) { err.textContent = '사용할 기록을 하나 이상 골라 주세요.'; return; }
        var tone = root.querySelector('input[name="tone"]:checked').value;
        var hasMsg = chosen.some(function (e) { return e.type === 'story' && e.message; });
        if (!hasMsg && !extra.value.trim()) {
          if (!window.confirm('고른 기록에 「전하고 싶은 마음」이 없어요. 한 줄 적지 않고 이대로 만들까요?')) { extra.focus(); return; }
        }
        viewDraftResult(chosen, tone, to.value.trim(), extra.value.trim());
      } } })]),
      backLinks(true)
    ]);
  }

  function viewDraftResult(chosen, tone, to, extra) {
    var area = h('textarea', { id: 'dr-text', rows: '14', maxlength: '8000', text: compose(chosen, tone, to, extra) });
    var msg = h('p', { class: 'small', role: 'status' });
    show([
      h('h1', { tabindex: '-1', text: '초안' }),
      h('p', { class: 'small', text: '아래 글은 내가 쓴 내용을 틀에 담은 거예요. 읽어 보고 마음대로 고쳐 쓰세요. 저장하기 전에는 어디에도 남지 않아요.' }),
      h('label', { for: 'dr-text', text: '초안' }), area,
      msg,
      h('div', { class: 'row' }, [
        h('button', { type: 'button', class: 'btn', text: '전하고 싶은 말로 저장', on: { click: function () {
          var text = area.value.trim();
          if (!text) { msg.textContent = '내용이 비어 있어요.'; return; }
          var list = entries();
          list.push({ id: ui.newId(), type: 'letter', date: ui.todayStr(), to: to, body: text, createdAt: new Date().toISOString() });
          if (saveEntries(list, msg)) go(BASE + '/letters');
        } } }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '파일로 저장', on: { click: function () {
          ui.downloadFile('maeum-yusan-choan-' + ui.todayStr() + '.txt', area.value + '\n');
          msg.textContent = '파일을 저장했어요. 전달은 내가 직접 해 주세요.';
        } } }),
        h('button', { type: 'button', class: 'btn btn-outline', text: '다시 고르기', on: { click: viewDraft } })
      ])
    ]);
    OneStep.ui.decorate(root, 'legacy', 'legacy');
    var heading = root.querySelector('h1');
    if (heading) heading.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  // ---------- D6 내보내기 ----------

  function viewExport() {
    var all = entries().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!all.length) {
      show([
        h('h1', { tabindex: '-1', text: '파일로 내보내기' }),
        h('p', { class: 'placeholder', text: '내보낼 기록이 아직 없어요.' }),
        backLinks(true)
      ]);
      return;
    }
    var picker = entryPicker(all, 'ex-');
    var msg = h('p', { class: 'small', role: 'status' });
    show([
      h('h1', { tabindex: '-1', text: '파일로 내보내기' }),
      h('p', { class: 'small', text: '고른 기록을 글 파일 하나로 저장해요. 파일에는 내 기록이 그대로 들어 있어요. 전달할지, 누구에게 줄지는 내가 정해요.' }),
      picker.ul,
      msg,
      h('div', { class: 'row' }, [h('button', { type: 'button', class: 'btn', text: '고른 기록 파일로 저장', on: { click: function () {
        var chosen = picker.chosen();
        if (!chosen.length) { msg.textContent = '내보낼 기록을 하나 이상 골라 주세요.'; return; }
        ui.downloadFile('maeum-yusan-' + ui.todayStr() + '.txt', '마음의 유산\n\n' + chosen.map(entryText).join('\n\n') + '\n');
        msg.textContent = '파일을 저장했어요. 내려받은 파일은 내가 직접 보관하고 전달해 주세요.';
      } } })]),
      backLinks(true)
    ]);
  }

  // ---------- 경로 분기 ----------

  function go(hash) { location.hash = hash; }

  function render(parts) {
    root = document.getElementById('lg-root');
    loadQuestions().then(function () {
      var a = parts[0];
      if (!a) viewTab('story');
      else if (a === 'kept') viewTab('kept');
      else if (a === 'letters') viewTab('letter');
      else if (a === 'story') viewStory(parts[1] || 'new');
      else if (a === 'letter') viewLetter(parts[1] || 'new');
      else if (a === 'import') viewImport(parts[1]);
      else if (a === 'draft') viewDraft();
      else if (a === 'export') viewExport();
      else viewTab('story');
      OneStep.ui.decorate(root, 'legacy', 'legacy');
      var heading = root.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    });
  }

  OneStep.views = OneStep.views || {};
  OneStep.views.legacy = render;
})();
