
/*
 * ReseaMate - Step 2 Connect Logic
 *
 * 기능 전용 코드
 * 디자인(HTML/CSS)과 독립적으로 동작합니다.
 *
 * 현재 외부 API를 사용하지 않습니다.
 * 점수와 설명은 시연용 데이터입니다.
 */

// 1. 시연용 연구 주제 데이터
const CONNECT_DATA = {
  AI: {
    label: "Artificial Intelligence",
    connections: {
      Psychology: {
        label: "심리학",
        weight: 0.78,
        keywords: ["인지 모델", "의사결정", "학습"],
        description:
          "인공지능 모델과 인간의 인지, 학습, 의사결정 과정은 연구 주제로 연결될 수 있습니다.",
        papers: []
      },

      Sociology: {
        label: "사회학",
        weight: 0.85,
        keywords: ["알고리즘", "사회적 불평등", "노동"],
        description:
          "AI 기술이 사회구조와 노동시장에 미치는 영향을 연구할 수 있습니다.",
        papers: []
      },

      Education: {
        label: "교육학",
        weight: 0.72,
        keywords: ["개인화 학습", "AI 튜터", "교육"],
        description:
          "AI를 활용한 개인화 학습과 교육 성과를 연결하여 연구할 수 있습니다.",
        papers: []
      },

      Law: {
        label: "법학",
        weight: 0.65,
        keywords: ["AI 규제", "책임성", "개인정보"],
        description:
          "AI 시스템의 법적 책임과 알고리즘 규제 문제를 연구할 수 있습니다.",
        papers: []
      }
    }
  }
};


// 2. 메인 연구 주제 목록 반환
function getMainTopics() {
  return Object.keys(CONNECT_DATA).map(id => ({
    id: id,
    label: CONNECT_DATA[id].label
  }));
}


// 3. 세부 연결 주제 목록 반환
function getSubTopics(mainTopic) {
  const main = CONNECT_DATA[mainTopic];

  if (!main) {
    return [];
  }

  return Object.entries(main.connections).map(
    ([id, connection]) => ({
      id: id,
      label: connection.label
    })
  );
}


// 4. 두 연구 주제의 연결 정보 조회
function findConnection(mainTopic, subTopic) {
  const main = CONNECT_DATA[mainTopic];

  if (!main) {
    return null;
  }

  const connection = main.connections[subTopic];

  if (!connection) {
    return null;
  }

  return {
    mainTopic: mainTopic,
    subTopic: subTopic,
    ...connection
  };
}


// 5. 연결 점수(%) 반환
function getConnectionScore(connection) {
  if (!connection) {
    return 0;
  }

  const weight = Number(connection.weight);

  if (!Number.isFinite(weight)) {
    return 0;
  }

  return Math.round(
    Math.max(0, Math.min(1, weight)) * 100
  );
}


// 6. 연결 근거 논문 목록 반환
function getRelatedPapers(connection) {
  if (!connection) {
    return [];
  }

  return connection.papers || [];
}


// 7. 그래프용 노드와 연결선 반환
function getConnectionGraph(mainTopic) {
  const main = CONNECT_DATA[mainTopic];

  if (!main) {
    return {
      nodes: [],
      edges: []
    };
  }

  const nodes = [
    {
      id: mainTopic,
      label: main.label,
      type: "main"
    }
  ];

  const edges = [];

  Object.entries(main.connections).forEach(
    ([id, connection]) => {

      nodes.push({
        id: id,
        label: connection.label,
        type: "sub"
      });

      edges.push({
        source: mainTopic,
        target: id,
        weight: connection.weight,
        relation: "related_to"
      });

    }
  );

  return {
    nodes: nodes,
    edges: edges
  };
}


// 8. 연결 결과를 한 번에 반환
function getConnectResult(mainTopic, subTopic) {
  const connection = findConnection(
    mainTopic,
    subTopic
  );

  if (!connection) {
    return null;
  }

  return {
    mainTopic: mainTopic,
    subTopic: subTopic,
    label: connection.label,
    score: getConnectionScore(connection),
    description: connection.description,
    keywords: connection.keywords,
    papers: getRelatedPapers(connection)
  };
}


// 9. 다른 JavaScript 파일에서 사용할 수 있도록 공개
window.ReseaMateConnect = {
  getMainTopics,
  getSubTopics,
  findConnection,
  getConnectionScore,
  getRelatedPapers,
  getConnectionGraph,
  getConnectResult
};
