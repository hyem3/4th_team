# ReseaMate – Research Map (Step 1: Explore)

연구 키워드·논문을 노드로 시각화하고, 탐색 경로(히스토리)와 저장 주제를 관리하는 Research Map 프로토타입.
빌드 없이 정적 파일로 동작하며 현재는 목업 데이터(`data/mock.json`)를 사용합니다.

## 구조
| 경로 | 설명 |
|---|---|
| `schema/research-map.schema.json` | 노드(keyword/paper), 엣지, 저장 주제, 히스토리 JSON Schema |
| `data/mock.json` | 스키마를 따르는 목업 데이터 (`visible:false` 노드는 + 클릭 시 나타남) |
| `js/app.js` | D3 force 그래프, 확장/저장/히스토리(뒤로·앞으로) 로직 |
| `scripts/openalex-probe.mjs` | OpenAlex 호출 → 키워드 추출 → 응답 형태 확인 → 스키마 변환 |

## 실행
```bash
npx serve .          # 또는 python3 -m http.server  (fetch 때문에 file:// 로는 안 열립니다)
node scripts/openalex-probe.mjs "sentiment analysis" --n 5   # Node 18+
```

## GitHub Pages 배포
Settings → Pages → Branch `main` / root 선택. 상태는 브라우저 `localStorage`에 저장됩니다 (`초기화` 버튼으로 삭제).

## OpenAlex 연동 방법 (다음 단계)
`js/app.js`의 `Store.expand(node)`와 `search(q)`의 TODO 두 곳만 교체하면 됩니다.
변환 함수는 `scripts/openalex-probe.mjs`의 `mapWork()`를 `js/api.js`로 옮겨 사용하세요.
