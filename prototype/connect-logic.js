
/*
 * ReseaMate - Step 2 Connection Logic
 * 실제 논문 + 시연용 연결 정보
 * 디자인 HTML/CSS와 독립적으로 작동
 */

(function (root) {
  "use strict";

  const MAIN_TOPIC = "Adaptive Understanding";

  // 1. 실제 출판 논문 데이터
  const PAPERS = {
    covid_knowledge: {
      id: "covid_knowledge",
      title: "Disparities in COVID-19 Information Sources and Knowledge in South Korea",
      authors: "Sou Hyun Jang",
      year: 2022,
      venue: "International Journal of Environmental Research and Public Health",
      doi: "10.3390/ijerph19095198",
      url: "https://doi.org/10.3390/ijerph19095198",
      relevance: "한국의 코로나19 정보원과 지식 수준 사이의 관계를 조사한 연구"
    },

    covid_misinformation: {
      id: "covid_misinformation",
      title: "Effects of COVID-19 Misinformation on Information Seeking, Avoidance, and Processing: A Multicountry Comparative Study",
      authors: "Hye Kyung Kim, Jisoo Ahn, Lucy Atkinson, Lee Ann Kahlor",
      year: 2020,
      venue: "Science Communication",
      doi: "10.1177/1075547020959670",
      url: "https://doi.org/10.1177/1075547020959670",
      relevance: "허위정보 노출이 정보 탐색과 정보 처리 방식에 미치는 영향을 비교한 연구"
    },

    algorithm_awareness: {
      id: "algorithm_awareness",
      title: "Reasoning about Invisible Algorithms in News Feeds",
      authors: "Motahhare Eslami et al.",
      year: 2015,
      venue: "CHI 2015",
      doi: "10.1145/2702123.2702556",
      url: "https://doi.org/10.1145/2702123.2702556",
      relevance: "뉴스피드 알고리즘을 인지한 뒤 사용자의 해석과 행동이 어떻게 달라지는지 조사"
    },

    algorithm_beliefs: {
      id: "algorithm_beliefs",
      title: "Understanding User Beliefs About Algorithmic Curation in the Facebook News Feed",
      authors: "Emilee Rader, Rebecca Gray",
      year: 2015,
      venue: "CHI 2015",
      doi: "10.1145/2702123.2702174",
      url: "https://doi.org/10.1145/2702123.2702174",
      relevance: "이용자가 알고리즘의 정보 선택 방식을 어떻게 이해하는지 연구"
    },

    novel_combinations: {
      id: "novel_combinations",
      title: "Atypical Combinations and Scientific Impact",
      authors: "Brian Uzzi, Satyam Mukherjee, Michael Stringer, Ben Jones",
      year: 2013,
      venue: "Science",
      doi: "10.1126/science.1240474",
      url: "https://doi.org/10.1126/science.1240474",
      relevance: "서로 다른 지식의 새로운 조합과 과학적 영향력의 관계를 분석"
    },

    gender_shades: {
      id: "gender_shades",
      title: "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification",
      authors: "Joy Buolamwini, Timnit Gebru",
      year: 2018,
      venue: "Proceedings of Machine Learning Research 81",
      doi: null,
      url: "https://proceedings.mlr.press/v81/buolamwini18a.html",
      relevance: "얼굴 분석 기술의 집단별 정확도 격차와 알고리즘 편향 문제를 연구"
    }
  };

  // 2. Visual Brief 기준 연결 주제
  const CONNECTIONS = [
    {
      id: "covid",
      label: "Covid-19",
      score: 42,
      scoreType: "visual-brief-demo",
      description: "감염병 위기에서 사람들은 정보원을 선택하고 정보의 신뢰성을 평가하며 상황에 대한 이해를 조정합니다.",
      keywords: ["정보 탐색", "허위정보", "위기 대응"],
      paperIds: ["covid_knowledge", "covid_misinformation"]
    },
    {
      id: "algorithm",
      label: "Algorithmic System",
      score: 85,
      scoreType: "visual-brief-demo",
      description: "사용자가 보이지 않는 알고리즘을 인식하고 그 작동 방식을 해석하는 과정에서 이해가 달라질 수 있습니다.",
      keywords: ["알고리즘 인식", "뉴스피드", "사용자 해석"],
      paperIds: ["algorithm_awareness", "algorithm_beliefs"]
    },
    {
      id: "beyond",
      label: "Beyond Existing Topics",
      score: null,
      scoreType: "not-defined",
      description: "익숙한 지식과 낯선 분야의 아이디어를 결합해 새로운 연구 질문을 발굴할 가능성을 탐색합니다.",
      keywords: ["학제 간 연구", "새로운 조합", "연구 주제 발굴"],
      paperIds: ["novel_combinations"]
    },
    {
      id: "social",
      label: "Recent Social Issue",
      score: null,
      scoreType: "not-defined",
      description: "알고리즘 편향 같은 사회적 문제를 이해하기 위해 기술적 결과와 사회적 맥락을 함께 검토합니다.",
      keywords: ["알고리즘 편향", "사회적 영향", "공정성"],
      paperIds: ["gender_shades"]
    }
  ];

  // 3. 내부 도우미 함수
  const clone = value => JSON.parse(JSON.stringify(value));

  const normalized = value =>
    String(value ?? "").trim().toLowerCase();

  function findTopic(value) {
    return CONNECTIONS.find(item =>
      normalized(item.id) === normalized(value) ||
      normalized(item.label) === normalized(value)
    );
  }

  // 4. 연결 가능한 주제 목록
  function listTopics() {
    return CONNECTIONS.map(item => ({
      id: item.id,
      label: item.label
    }));
  }

  // 5. 선택한 주제의 실제 논문 조회
  function getPapers(topic) {
    const match = findTopic(topic);

    if (!match) return [];

    return clone(
      match.paperIds
        .map(id => PAPERS[id])
        .filter(Boolean)
    );
  }

  // 6. 두 연구 주제의 연결 결과 조회
  function getConnection(mainTopic, subTopic) {
    if (normalized(mainTopic) !== normalized(MAIN_TOPIC)) {
      return null;
    }

    const match = findTopic(subTopic);

    if (!match) return null;

    return clone({
      mainTopic: MAIN_TOPIC,
      subTopic: match.label,
      id: match.id,
      score: match.score,
      scoreType: match.scoreType,
      scoreIsScientific: false,
      description: match.description,
      keywords: match.keywords,
      papers: getPapers(match.id)
    });
  }

  // 7. 전체 연결 관계 조회
  function listConnections() {
    return CONNECTIONS.map(item =>
      getConnection(MAIN_TOPIC, item.id)
    );
  }

  // 8. 디자인 담당자가 호출할 기능 공개
  root.ReseaMateConnect = Object.freeze({
    mainTopic: MAIN_TOPIC,
    listTopics,
    getPapers,
    getConnection,
    listConnections
  });

})(typeof window !== "undefined" ? window : globalThis);
