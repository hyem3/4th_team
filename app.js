(() => {
  const KEY = 'reseamate:v1';
  const S = { map: null, nodes: [], edges: [], saved: [], history: [], cursor: -1, selected: null };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = (id) => S.nodes.find((n) => n.id === id);
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const ACTION = { search: '검색', expand: '확장', visit: '방문', save: '저장' };

  /* ───────── 데이터 계층: 나중에 OpenAlex 호출로 교체할 지점 ───────── */
  const neighborIds = (id) =>
    S.edges.filter((e) => e.source === id || e.target === id).map((e) => (e.source === id ? e.target : e.source));
  const hasHidden = (n) => neighborIds(n.id).some((id) => byId(id) && !byId(id).visible);

  const Store = {
    async load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch {}
      if (!d) d = await (await fetch('data/mock.json')).json();
      Object.assign(S, { map: d.map, nodes: d.nodes, edges: d.edges, saved: d.savedTopics, history: d.history, cursor: d.historyCursor });
      S.selected = S.history[S.cursor]?.nodeId ?? d.map.rootNodeId;
    },
    persist() {
      const nodes = S.nodes.map(({ vx, vy, fx, fy, index, ...n }) => ({ ...n, x: n.x && Math.round(n.x), y: n.y && Math.round(n.y) }));
      try {
        localStorage.setItem(KEY, JSON.stringify({ version: 1, map: S.map, nodes, edges: S.edges, savedTopics: S.saved, history: S.history, historyCursor: S.cursor }));
      } catch {}
    },
    // TODO: OpenAlex 연동 시 이 함수만 교체 (node 클릭 → 논문 검색 → 키워드 추출 → 노드/엣지 추가)
    async expand(node) {
      const hidden = neighborIds(node.id).map(byId).filter((n) => n && !n.visible);
      hidden.forEach((n) => { n.visible = true; n.x = (node.x || 0) + (Math.random() - .5) * 60; n.y = (node.y || 0) + (Math.random() - .5) * 60; });
      return hidden;
    },
  };

  /* ───────── 노드 크기/텍스트 ───────── */
  const isPaper = (d) => d.type === 'paper';
  const W = (d) => (isPaper(d) ? 200 : Math.max(64, d.label.length * 13 + 28));
  const H = (d) => (isPaper(d) ? 52 : 36);
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const sub = (d) => `${(d.authors?.[0] || '').split(' ').pop()} et al., ${d.venue ? d.venue + ' ' : ''}${d.year ?? ''}`;

  /* ───────── 지도 렌더링 (D3) ───────── */
  const svg = d3.select('#map');
  const g = svg.append('g');
  const gl = g.append('g');
  const gn = g.append('g');
  const box = () => $('#map').getBoundingClientRect();
  const home = () => d3.zoomIdentity.translate(box().width / 2, box().height / 2);
  const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e) => g.attr('transform', e.transform));
  svg.call(zoom).on('dblclick.zoom', null);

  const sim = d3.forceSimulation()
    .force('link', d3.forceLink().id((d) => d.id).distance((l) => (l.type === 'paper-keyword' ? 130 : 100)))
    .force('charge', d3.forceManyBody().strength(-420))
    .force('collide', d3.forceCollide((d) => W(d) / 2 + 10))
    .on('tick', () => {
      gl.selectAll('line').attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      gn.selectAll('g.node').attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

  const drag = d3.drag()
    .on('start', (e, d) => { if (!e.active) sim.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = d.fy = null; Store.persist(); });

  function draw() {
    const nodes = S.nodes.filter((n) => n.visible);
    const ids = new Set(nodes.map((n) => n.id));
    const links = S.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ ...e }));

    gl.selectAll('line').data(links, (d) => d.id).join('line').attr('class', (d) => 'edge ' + d.type);

    gn.selectAll('g.node').data(nodes, (d) => d.id).join((enter) => {
      const n = enter.append('g').attr('class', (d) => 'node ' + d.type).call(drag)
        .on('click', (e, d) => { if (!e.defaultPrevented) select(d.id, 'visit'); });
      n.append('rect').attr('width', W).attr('height', H).attr('x', (d) => -W(d) / 2).attr('y', (d) => -H(d) / 2).attr('rx', (d) => (isPaper(d) ? 8 : 18));
      const t = n.append('text').attr('text-anchor', 'middle');
      t.append('tspan').attr('x', 0).attr('dy', (d) => (isPaper(d) ? '-0.2em' : '0.35em')).text((d) => (isPaper(d) ? clip(d.label, 30) : d.label));
      t.filter(isPaper).append('tspan').attr('class', 'sub').attr('x', 0).attr('dy', '1.5em').text(sub);
      const p = n.append('g').attr('class', 'plus').on('click', (e, d) => { e.stopPropagation(); expand(d); });
      p.append('circle').attr('r', 10);
      p.append('text').attr('text-anchor', 'middle').attr('dy', '.35em').text('+');
      return n;
    });

    paint();
    sim.nodes(nodes);
    sim.force('link').links(links);
    sim.alpha(.6).restart();
  }

  // 시뮬레이션 재시작 없이 상태(선택/저장/+버튼)만 갱신
  function paint() {
    gn.selectAll('g.node')
      .classed('selected', (d) => d.id === S.selected)
      .classed('saved', (d) => S.saved.some((s) => s.nodeId === d.id));
    gn.selectAll('.plus').attr('transform', (d) => `translate(${W(d) / 2},0)`).style('display', (d) => (hasHidden(d) ? null : 'none'));
  }

  /* ───────── 동작: 선택 / 확장 / 저장 / 히스토리 ───────── */
  function record(nodeId, action) {
    const last = S.history[S.cursor];
    if (last && last.nodeId === nodeId && last.action === action) return;
    S.history = S.history.slice(0, S.cursor + 1); // 뒤로 간 상태에서 새 이동 → 앞쪽 기록 삭제 (브라우저 방식)
    S.history.push({ id: uid('h'), nodeId, action, at: new Date().toISOString() });
    S.cursor = S.history.length - 1;
  }

  function select(id, action = 'visit') {
    S.selected = id;
    if (action) record(id, action);
    paint(); panels(); Store.persist();
  }

  async function expand(node) {
    const added = await Store.expand(node);
    if (!added.length) return;
    record(node.id, 'expand');
    S.selected = node.id;
    draw(); panels(); Store.persist();
  }

  function toggleSave(id) {
    const i = S.saved.findIndex((s) => s.nodeId === id);
    if (i >= 0) S.saved.splice(i, 1);
    else { const n = byId(id); S.saved.push({ id: uid('s'), nodeId: id, label: n.label, savedAt: new Date().toISOString() }); record(id, 'save'); }
    paint(); panels(); Store.persist();
  }

  function focus(id) {
    const n = byId(id);
    if (n && n.x != null) svg.transition().duration(500).call(zoom.translateTo, n.x, n.y);
  }

  function jump(i) {
    if (i < 0 || i >= S.history.length) return;
    S.cursor = i;
    const n = byId(S.history[i].nodeId);
    if (!n) return;
    if (!n.visible) { n.visible = true; draw(); }
    S.selected = n.id;
    paint(); panels(); focus(n.id); Store.persist();
  }

  function search(q) {
    q = q.trim();
    if (!q) return;
    let n = S.nodes.find((x) => x.type === 'keyword' && x.label.toLowerCase() === q.toLowerCase());
    if (n) {
      if (!n.visible) { n.visible = true; draw(); }
      select(n.id, 'search'); setTimeout(() => focus(n.id), 400);
      return;
    }
    // TODO: OpenAlex 연동 시 여기서 논문 검색 후 키워드 노드 생성
    const anchor = byId(S.selected)?.type === 'keyword' ? byId(S.selected) : byId(S.map.rootNodeId);
    n = { id: 'kw:' + q.toLowerCase().replace(/\s+/g, '-'), type: 'keyword', label: q, visible: true, source: 'user', x: (anchor.x || 0) + 40, y: (anchor.y || 0) + 40 };
    S.nodes.push(n);
    S.edges.push({ id: uid('e'), source: anchor.id, target: n.id, type: 'keyword-keyword', weight: 0.5, relation: 'user' });
    record(n.id, 'search'); S.selected = n.id;
    draw(); panels(); Store.persist();
  }

  /* ───────── 우측 패널 ───────── */
  function panels() {
    const n = byId(S.selected);
    const d = $('#detail');
    if (!n) d.innerHTML = '<span class="muted">노드를 클릭하세요</span>';
    else if (isPaper(n)) {
      d.innerHTML = `<h4>${esc(n.label)}</h4><p>${esc((n.authors || []).join(', '))}<br>${esc(n.venue || '')} ${n.year ?? ''}</p>` +
        (n.doi ? `<a href="${esc(n.doi)}" target="_blank" rel="noopener">DOI 열기 ↗</a>` : '');
    } else {
      const saved = S.saved.some((s) => s.nodeId === n.id);
      d.innerHTML = `<h4>${esc(n.label)}</h4><p>키워드 · 연결 ${neighborIds(n.id).length}개</p><button id="save">${saved ? '저장 해제' : '주제로 저장'}</button>`;
      $('#save').onclick = () => toggleSave(n.id);
    }

    const sv = $('#saved');
    sv.innerHTML = S.saved.length ? '' : '<li class="muted">저장된 주제가 없습니다</li>';
    S.saved.forEach((s) => {
      const li = document.createElement('li');
      li.className = 'chip';
      li.innerHTML = `<span>🔖 ${esc(s.label)}</span><button title="삭제">×</button>`;
      li.onclick = () => { const t = byId(s.nodeId); if (t) { t.visible = true; draw(); select(t.id, 'visit'); focus(t.id); } };
      li.querySelector('button').onclick = (e) => { e.stopPropagation(); toggleSave(s.nodeId); };
      sv.append(li);
    });

    const hs = $('#history');
    hs.innerHTML = '';
    S.history.forEach((h, i) => {
      const li = document.createElement('li');
      li.className = i === S.cursor ? 'current' : '';
      li.innerHTML = `<small>${ACTION[h.action]}</small>${esc(byId(h.nodeId)?.label ?? h.nodeId)}`;
      li.onclick = () => jump(i);
      hs.append(li);
    });
    hs.querySelector('.current')?.scrollIntoView({ block: 'nearest' });

    $('#back').disabled = S.cursor <= 0;
    $('#fwd').disabled = S.cursor >= S.history.length - 1;
  }

  /* ───────── 초기화 ───────── */
  $('#search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { search(e.target.value); e.target.value = ''; } });
  $('#back').onclick = () => jump(S.cursor - 1);
  $('#fwd').onclick = () => jump(S.cursor + 1);
  $('#fit').onclick = () => svg.transition().duration(400).call(zoom.transform, home());
  $('#reset').onclick = () => { if (confirm('탐색 기록을 초기화할까요?')) { localStorage.removeItem(KEY); location.reload(); } };

  Store.load().then(() => {
    svg.call(zoom.transform, home());
    sim.force('center', d3.forceCenter(0, 0));
    draw(); panels();
  }).catch((e) => { $('#detail').textContent = '데이터를 불러오지 못했습니다: ' + e.message + ' (로컬 서버로 실행하세요)'; });
})();
