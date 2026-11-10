#!/usr/bin/env node
/**
 * OpenAlex 사전조사: 논문 검색 → 키워드 추출 → 응답 형태 확인 → 우리 스키마로 변환
 *
 * 사용법 (Node 18+):
 *   node scripts/openalex-probe.mjs "sentiment analysis" --n 5
 *   OPENALEX_MAILTO=you@example.com node scripts/openalex-probe.mjs "reinforcement learning"
 *
 * 결과:
 *   - 콘솔: 논문별 키워드/토픽, 필드 누락 현황, 키워드 빈도
 *   - scripts/out/sample-response.json : 원본 응답
 *   - scripts/out/mapped.json          : research-map 스키마(node/edge)로 변환한 결과
 */
import { mkdir, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const query = args[0] && !args[0].startsWith('--') ? args[0] : 'sentiment analysis';
const ni = args.indexOf('--n');
const n = ni >= 0 ? Number(args[ni + 1]) || 5 : 5;

// 필요한 필드만 요청 (응답 크기 감소). select는 최상위 필드만 지정 가능.
const FIELDS = 'id,doi,title,publication_year,cited_by_count,authorships,primary_location,keywords,topics';
const url = new URL('https://api.openalex.org/works');
url.search = new URLSearchParams({
  search: query,
  'per-page': String(n),
  select: FIELDS,
  ...(process.env.OPENALEX_MAILTO && { mailto: process.env.OPENALEX_MAILTO }), // polite pool
}).toString();

console.log('GET', url.toString(), '\n');
const res = await fetch(url);
if (!res.ok) {
  console.error('요청 실패:', res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
console.log(`총 검색 결과: ${data.meta?.count} 건 / 이번 응답: ${data.results.length} 건\n`);

/* ── 변환 로직: 나중에 js/api.js로 그대로 옮겨 쓸 부분 ── */
const slug = (s) => s.toLowerCase().trim().replace(/\s+/g, '-');
const tail = (u) => (u ? u.split('/').pop() : null);

export function mapWork(w) {
  // keywords가 비어있는 논문이 있어 topics로 대체
  const raw = w.keywords?.length ? w.keywords : w.topics || [];
  const keywords = raw.map((k) => ({ label: k.display_name, score: k.score }));
  const paper = {
    id: 'paper:' + tail(w.id),
    type: 'paper',
    label: w.title,
    visible: true,
    authors: (w.authorships || []).slice(0, 5).map((a) => a.author?.display_name).filter(Boolean),
    year: w.publication_year ?? null,
    venue: w.primary_location?.source?.display_name ?? null,
    citedBy: w.cited_by_count ?? null,
    doi: w.doi ?? null,
    openalexId: w.id,
  };
  return { paper, keywords };
}

const nodes = new Map();
const edges = [];
const freq = new Map();
const missing = { keywords: 0, topics: 0, venue: 0, authors: 0 };

for (const w of data.results) {
  if (!w.keywords?.length) missing.keywords++;
  if (!w.topics?.length) missing.topics++;
  if (!w.primary_location?.source) missing.venue++;
  if (!w.authorships?.length) missing.authors++;

  const { paper, keywords } = mapWork(w);
  nodes.set(paper.id, paper);
  console.log(`• ${w.title} (${w.publication_year})`);
  console.log(`  keywords: ${w.keywords?.map((k) => `${k.display_name}(${k.score?.toFixed(2)})`).join(', ') || '(없음)'}`);
  console.log(`  topics  : ${w.topics?.slice(0, 3).map((t) => t.display_name).join(', ') || '(없음)'}\n`);

  for (const k of keywords) {
    const id = 'kw:' + slug(k.label);
    if (!nodes.has(id)) nodes.set(id, { id, type: 'keyword', label: k.label, visible: true, source: 'openalex', score: k.score });
    edges.push({ id: `${paper.id}->${id}`, source: paper.id, target: id, type: 'paper-keyword', weight: k.score ?? 0.5 });
    freq.set(k.label, (freq.get(k.label) || 0) + 1);
  }
}

console.log('── 필드 누락 현황 (총', data.results.length, '건 중) ──');
console.table(missing);
console.log('── 키워드 빈도 TOP 10 (다음 확장 후보) ──');
console.table([...freq].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([keyword, count]) => ({ keyword, count })));

await mkdir(new URL('./out/', import.meta.url), { recursive: true });
await writeFile(new URL('./out/sample-response.json', import.meta.url), JSON.stringify(data, null, 2));
await writeFile(new URL('./out/mapped.json', import.meta.url), JSON.stringify({ nodes: [...nodes.values()], edges }, null, 2));
console.log('\n저장 완료: scripts/out/sample-response.json, scripts/out/mapped.json');
