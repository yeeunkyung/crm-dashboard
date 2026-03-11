import { useState, useRef, useEffect } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// ── 그룹별 고정 추천 메시지 (CSV 기반) ───────────────
const GROUP_FIXED_MESSAGES = {
  1: {
    title: '관심 제로 그룹 — 고정 메시지',
    content: `안녕하세요, $고객이름$님.
청약은 복잡한 이야기보다, 설레는 내 집 마련의 시작이 되어야 합니다.
"놓치지 마세요. 유성복합터미널과 트램 2호선이 가져올 유성구의 미래 가치가 곧 현실이 됩니다."

✔ 상대동/도안신도시 주거 벨트의 중심지로 떠오르는 이 지역의 생활 환경 분석
✔ 카이스트 및 연구단지 배후 수요가 보장하는 탄탄한 미래 자산 가치
✔ 유성구의 새로운 랜드마크가 될 브랜드 네임벨류와 차별화된 입지 분석

👉 대전 유성구의 숨겨진 가치, 전문가 분석 전체 보기`,
  },
  2: {
    title: '관심 가능 그룹 — 고정 메시지',
    content: `안녕하세요, $고객이름$님.

자금 계획이 명확해지면, 불안함은 확신으로 바뀝니다.

"망설이는 사이 사라지는 분양가 상한제의 기회, 숫자로 증명해 드립니다."
✔ 실입주금 부담을 대폭 낮춘 대출 규제 완화 적용 시뮬레이션 및 혜택
✔ 주변 시세 대비 저렴한 분양가 6억 선의 합리적 공급가와 시세 차익 분석
✔ 발코니 확장 무상 혜택 등 초기 비용 절감을 위한 핵심 체크리스트

👉 대전 유성구의 숨겨진 가치, 전문가 분석 전체 보기`,
  },
  3: {
    title: '즉시 청약 가능 (1순위) — 고정 메시지',
    content: `(광고) [OO아파트 청약 안내]
안녕하세요 고객님. 지난 설문에서 '청약 의사 있음'을 선택해 주신 고객님께 안내드립니다.

현재 고객님은 청약 1순위 자격 가능 고객군으로 확인되어 청약 준비 시 도움이 될 정보를 안내드립니다.
이번 {단지명}은 {역세권 정보}과 {생활 인프라}를 갖춘 단지로 총 {세대수}세대 규모로 공급 예정입니다.

청약 검토 시 확인하면 좋은 핵심 정보입니다.
분양가 수준
{분양가 정보 또는 시세 비교}

예상 자금 계획
{예상 실입주금 또는 대출 가능 구조}

청약 자격 체크포인트
{1순위 조건 또는 세대 조건}

청약 전 내 자격과 예상 자금 계획을 확인해 두면 실제 청약 전략을 세우는 데 도움이 됩니다.

👉 청약 가능 여부와 예상 실입주금 지금 확인하기
{상담 링크}

본 안내는 설문 응답 기반으로 발송되는 안내 메시지입니다.
더 이상 안내를 원치 않으시면 '중지'라고 회신해 주세요.
회신 시 동일 유형 안내 메시지는 발송되지 않습니다.`,
  },
  4: {
    title: '즉시 청약 가능 (특별공급) — 고정 메시지',
    content: `(광고) [OO아파트 특별공급 안내]

특별공급은 일반 청약보다 경쟁률이 낮은 경우가 많아 실거주 목적 고객에게 좋은 기회가 될 수 있습니다.
안녕하세요 고객님.
지난 OO 설문에서 '청약 의사 있음'을 선택해 주신 고객님께 안내드립니다.

고객님은 현재 신혼부부·생애최초·다자녀 등 특별공급 대상 가능 고객군으로 확인되어
청약 준비 시 참고하실 수 있는 정보를 안내드립니다.

이번 OO아파트는 △△역 인근 입지와 생활 인프라를 갖춘 단지로
총 ○○세대 규모로 공급 예정입니다.

특별공급 검토 시 확인하면 좋은 핵심 정보입니다.

• 특별공급 장점
자격 요건 충족 시 일반 청약 대비 당첨 가능성이 상대적으로 높은 기회

• 가족 중심 설계
최근 분양 단지는 실거주 중심 평면 구조와 수납 공간 설계가 강화되는 추세

• 생활 인프라
△△역 접근성과 학교·생활 편의시설 이용이 가능한 입지

특별공급은 유형별 자격 조건과 제출 서류가 달라 사전 확인이 중요합니다.

👉 특별공급 가능 여부와 신청 전략 확인하기
(링크)

본 안내는 설문 응답 기반으로 발송되는 안내 메시지입니다.
더 이상 안내를 원치 않으시면 '중지'라고 회신해 주세요.
회신 시 동일 유형 안내 메시지는 발송되지 않습니다.`,
  },
  5: {
    title: '청약 가능 고객 (2순위) — 고정 메시지',
    content: `(광고) [OO아파트 청약 안내]
2순위에서도 실제 당첨 사례가 발생하는 경우가 있습니다.

안녕하세요 고객님.
지난 설문에서 '청약 의사 있음'을 선택해 주신 고객님께 안내드립니다.

고객님은 현재 청약 2순위 자격 대상 가능 고객군으로 확인되어
청약 준비 시 참고하실 수 있는 정보를 안내드립니다.

이번 {단지명}은 {역세권 정보}과 {생활 인프라}를 갖춘 단지로
총 {세대수}세대 규모로 공급 예정입니다.

청약 검토 시 참고되는 핵심 정보입니다.

• 평형별 경쟁률
{평형별 경쟁률 또는 예상 경쟁률 정보}

• 공급 물량
{평형별 공급 세대수 또는 잔여 동호수 정보}

• 예상 자금 계획
{예상 실입주금 또는 대출 가능 구조}

• 실제 2순위 사례
일부 평형은 경쟁률에 따라 2순위 당첨이 발생하는 경우도 있습니다

청약 전 경쟁률과 자금 계획을 확인하면 청약 전략을 세우는 데 도움이 됩니다.

👉 2순위 청약 가능 전략 확인하기
{상담 링크}

본 안내는 설문 응답 기반으로 발송되는 안내 메시지입니다.
더 이상 안내를 원치 않으시면 '중지'라고 회신해 주세요.
회신 시 동일 유형 안내 메시지는 발송되지 않습니다.`,
  },
  6: {
    title: '무순위 가능 고객 — 고정 메시지',
    content: `(광고) [OO아파트 무순위 청약 안내]
무순위 청약은 잔여세대 발생 시 일정이 갑자기 열리는 경우가 많습니다.

안녕하세요 고객님.
지난 설문에서 '청약 의사 있음'을 선택해 주신 고객님께 안내드립니다.

고객님은 현재 무순위 청약 참여 가능 고객군으로 확인되어
잔여세대 및 무순위 청약 관련 정보를 안내드립니다.

이번 {단지명}은 {역세권 정보}과 {생활 인프라}를 갖춘 단지로
총 {세대수}세대 규모로 공급된 단지입니다.

무순위 청약 검토 시 확인하면 좋은 핵심 정보입니다.

• 브랜드 가치
{브랜드 정보 또는 시공사 정보}

• 가격 경쟁력
{분양가 또는 주변 시세 비교}

• 무순위 청약 특징
잔여세대 발생 시 청약통장 없이 신청 가능한 경우도 있음

• 공급 물량 희소성
{잔여 세대수 또는 공급 물량 정보}

무순위 청약은 일정이 짧고 공급 물량이 제한적인 경우가 많아
사전 일정 확인이 중요합니다.

👉 무순위 청약 일정과 참여 방법 확인하기
{상담 링크}

본 안내는 설문 응답 기반으로 발송되는 안내 메시지입니다.
더 이상 안내를 원치 않으시면 '중지'라고 회신해 주세요.
회신 시 동일 유형 안내 메시지는 발송되지 않습니다.`,
  },
  7: {
    title: 'MZ 주거 그룹 — 고정 메시지',
    content: `[분석 리포트]
$고객 이름$님, 설문 해주신 내용을 기반으로 맞춤 분석 정보입니다 🏠
    **래미안 원베일리 2차** 신혼부부 특공 분석
    📍 서울 서초구 반포동 | 청약일: 4/15
   
    ■ $고객 이름$님, 맞춤 핵심 포인트
    ▶ 안전마진: 주변 구축아파트 전세가 수준 분양가
    ▶ 워라밸: 지하철 3분 거리 직주근접 완성
    ▶ 미래가치: 한강뷰 프리미엄 + 초품아 희소성
    
    ■ 신혼부부 특공 1:1 맞춤 상담
    - 개인별 자금 스케줄링 컨설팅
    - 실거주 최적 평형대 추천
    - 대출한도 및 금리 시뮬레이션
    
    ▼ VR 투어 & 무료 상담 신청
    [링크]
    
    ※정보제공 동의고객 발송
    ※수신거부 시 '중지' 회신`,
  },
  8: {
    title: '시니어 주거 그룹 — 고정 메시지',
    content: `[분석 리포트] 📋
    $고객정보$님, 설문 해주신 내용을 기반으로 래미안 원베일리 2차 맞춤 분석 정보입니다.
    
    ■ 핵심 가치 3가지
    1️⃣ 브랜드 파워: 삼성물산 래미안의 1군 건설사 프리미엄으로 장기 자산가치 안정성 확보
    2️⃣ 메디컬 호재: 서울대병원·삼성서울병원 등 상급종합병원 접근성으로 생활 안심 환경
    3️⃣ 대단지 규모: 320세대 규모의 반포동 신축으로 지역 랜드마크화 및 활발한 거래량 기대
    
    ▶ 청약일정: 2026년 4월 15일
    ▶ 1순위 자격 보유로 유리한 조건
    
    지정은행 연계 상담을 통해 자금 스케줄링과 장기 보유 전략을 맞춤 설계해드립니다.
    ※ 본 안내는 요청하신 정보 제공 동의에 따라 발송되었습니다. 거부는 '중지' 회신.`,
  },
  9: {
    title: '전략 자산 증식 그룹 — 고정 메시지',
    content: `[분석리포트]
$고객$님, 설문 해주신 내용을 기반으로
지난번 확인하신 OO 아파트 맞춤 분석 정보입니다.

투자 목적 관점에서 데이터 기반 상승 요인 중심으로 정리했습니다.

■ 핵심 가치 3가지

1️⃣ 상승률 모멘텀
인근 대장주 단지 대비 평당가 격차가 존재하는 구간으로
입주 시점 키맞추기 가격 상승 가능성이 기대됩니다.

2️⃣ 기업·산업 수요 기반
주변 산업단지 및 기업 수요 유입으로
실거주 + 임대 수요가 동시에 형성되는 구조입니다.

3️⃣ 광역 교통망 확장성
현재 운영 중인 교통망과 더불어
향후 광역 교통 확장 계획에 따라 생활권 확장이 예상됩니다.

▶ 청약일정: OO년 OO월 OO일
▶ 1순위 자격 보유 시 전략적 진입 가능 구간

▶ 입주 시점 예상 시세 범위
▶ 전세가율 기반 투자금 구조
▶ 보유 전략 vs 단기 엑시트 시뮬레이션
등 데이터 기반 수익 분석 리포트를 제공해드립니다.

※ 본 안내는 요청하신 정보 제공 동의에 따라 발송되었습니다.
거부는 '중지' 회신.`,
  },
  10: {
    title: '잠재적 줍줍 수요 그룹 — 고정 메시지',
    content: `[분석 리포트] 📋
$고객$님, 설문 해주신 내용을 기반으로
지난번 확인하신 OO 아파트 정보를 처음 분양을 알아보시는 분 관점에서 정리했습니다.

처음 청약을 준비하실 때 가장 많이 확인하시는 기본 조건 중심으로 안내드립니다.

■ 핵심 가치 3가지
1️⃣ 가격 경쟁력 (안전 진입 구간)
주변 구축 단지 대비 가격 경쟁력이 형성된 분양 구조로
초기 진입 부담이 비교적 낮은 편입니다.

2️⃣ 생활 인프라 형성
대형마트, 병원, 공원 등
기존 생활 인프라가 형성되어 있어 거주 편의성이 높은 입지입니다.

3️⃣ 도보권 교육 환경
단지 주변 초·중·고 교육시설이 위치해 있어
향후 실거주 안정성 측면에서도 장점이 있습니다.

▶ 청약일정: OO년 OO월 OO일
▶ 청약 통장 보유 시 기본 자격 확인 가능

상담 시
▶청약 자격 여부 확인
▶예상 실입주금
▶대출 가능 금액
▶청약 절차 안내
까지 처음 분양을 준비하시는 분 기준으로 단계별 안내해드립니다.

※ 본 안내는 요청하신 정보 제공 동의에 따라 발송되었습니다.
거부는 '중지' 회신.`,
  },
};

// ── 헬퍼 ──────────────────────────────────────────────
const getGroup = id => ALL_GROUPS.find(g => g.id === id) || {
  name: '미분류', color: '#64748b', icon: '❓', short: '미분류',
  tier: '?', tierLabel: '?', tierColor: '#64748b'
};
const applyAdPrefix = (msg, isAd) =>
  isAd && msg && !msg.startsWith('(광고)') ? '(광고) ' + msg : msg;

// ── Solapi SMS ────────────────────────────────────────
async function makeSolapiAuth() {
  const apiKey    = import.meta.env.VITE_SOLAPI_API_KEY    || '';
  const apiSecret = import.meta.env.VITE_SOLAPI_API_SECRET || '';
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 12);
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey('raw', enc.encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig  = await crypto.subtle.sign('HMAC', key, enc.encode(date + salt));
  const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { apiKey, date, salt, signature };
}
// 발송 요청 — messageId 반환
async function sendSMS(to, text) {
  const sender = import.meta.env.VITE_SOLAPI_SENDER || '';
  const { apiKey, date, salt, signature } = await makeSolapiAuth();
  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to: to.replace(/-/g, ''), from: sender, text } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage || data.message || `HTTP ${res.status}`);
  if (data.failedMessageList?.length > 0) {
    const f = data.failedMessageList[0];
    throw new Error(`${f.errorCode || ''}: ${f.errorMessage || '발송 실패'}`);
  }
  const messageId = data.messageId || data.messages?.[0]?.messageId || null;
  return { messageId };
}

// 실제 상태 조회 — 최대 10초 폴링 (Solapi는 비동기로 상태 확정)
async function checkSMSStatus(messageId) {
  if (!messageId) return null;
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const { apiKey, date, salt, signature } = await makeSolapiAuth();
      const res = await fetch(`https://api.solapi.com/messages/v4/list?messageId=${messageId}`, {
        headers: { 'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` },
      });
      const data = await res.json();
      const msg = data.messageList?.[0];
      if (!msg) continue;
      const s = msg.statusCode || msg.status || '';
      if (s === 'COMPLETE') return { realStatus: 'success', errorCode: '', errorMsg: '' };
      if (s === 'FAILED' || s === 'CANCEL') return { realStatus: 'fail', errorCode: msg.errorCode || s, errorMsg: msg.errorMessage || '전송 실패' };
    } catch { /* 계속 */ }
  }
  return null; // 10초 내 확정 안 됨
}

// ── AI 메시지 생성 ────────────────────────────────────
async function generateAIMessage(customer, apt, prompts) {
  const g = getGroup(customer.groupId);
  const extra = prompts.extra || '';
  const wantsName   = extra.includes('이름') || extra.includes('name');
  const wantsLink   = extra.includes('링크') || extra.includes('link');
  const wantsStruct = extra.includes('서론') || extra.includes('구조') || extra.includes('본론');
  const link        = prompts.link || 'https://상담링크.com';
  const structGuide = wantsStruct ? `\n메시지 구조: 서론(인사) → 본론(핵심정보/혜택) → 결론(행동유도) 3단 구성으로 작성` : '';
  const nameGuide   = wantsName
    ? `\n반드시 첫 문장에 "${customer.name}님"을 포함`
    : `\n고객 이름(${customer.name}님)을 자연스럽게 1회 이상 포함`;
  const linkGuide   = wantsLink ? `\n마지막에 상담 링크 반드시 추가: ${link}` : '';

  const prompt = `당신은 청약 분양 전문 마케터입니다. 다음 고객에게 맞춤 문자 메시지를 작성해주세요.

[고객 정보]
- 이름: ${customer.name} / 나이: ${customer.age} / 성별: ${customer.gender}
- 거주지역: ${customer.region}
- 세그먼트: ${g.name} (${g.desc || ''})
- 청약 의사: ${customer.의사 || '미확인'} / 청약 자격: ${customer.자격 || '미확인'}

[아파트 정보]
- 단지명: ${apt.name} / 청약일: ${apt.date} / 가격: ${apt.price} / 위치: ${apt.location}

[작성 가이드]
- 말투: ${prompts.tone} / 스타일: ${prompts.style} / 길이: ${prompts.length}
- 추가 지시사항: ${extra || '없음'}
- 금지표현: ${prompts.forbidden || '없음'}${nameGuide}${structGuide}${linkGuide}

메시지만 작성하세요 (설명, 제목, 따옴표 없이 메시지 본문만):`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '생성 실패';
}

// ── 세그먼트 선택 체크박스 컴포넌트 ─────────────────
function SegmentSelector({ customers, selectedIds, onChange }) {
  const groupCounts = ALL_GROUPS.reduce((acc, g) => {
    acc[g.id] = customers.filter(c => c.groupId === g.id).length;
    return acc;
  }, {});

  const allIds = customers.map(c => c.id);
  const allChecked = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  const someChecked = allIds.some(id => selectedIds.includes(id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) onChange([]);
    else onChange(allIds);
  };

  const toggleGroup = (gid) => {
    const groupCustomerIds = customers.filter(c => c.groupId === gid).map(c => c.id);
    const allGroupSelected = groupCustomerIds.every(id => selectedIds.includes(id));
    if (allGroupSelected) onChange(selectedIds.filter(id => !groupCustomerIds.includes(id)));
    else onChange([...new Set([...selectedIds, ...groupCustomerIds])]);
  };

  const toggleOne = (cid) => {
    if (selectedIds.includes(cid)) onChange(selectedIds.filter(id => id !== cid));
    else onChange([...selectedIds, cid]);
  };

  const [expandedGroup, setExpandedGroup] = useState(null);

  return (
    <div>
      {/* 전체 선택 */}
      <div
        onClick={toggleAll}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: allChecked ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${allChecked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, cursor: 'pointer', marginBottom: 8,
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: 4,
          background: allChecked ? '#6366f1' : someChecked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
          border: `2px solid ${allChecked || someChecked ? '#6366f1' : '#475569'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {allChecked && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>}
          {someChecked && <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>−</span>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: allChecked ? '#a5b4fc' : '#94a3b8' }}>
          👥 전체 고객 ({customers.length}명)
        </span>
        <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>
          {selectedIds.length}명 선택됨
        </span>
      </div>

      {/* 그룹별 */}
      {ALL_GROUPS.map(g => {
        const cnt = groupCounts[g.id] || 0;
        if (!cnt) return null;
        const groupCustomerIds = customers.filter(c => c.groupId === g.id).map(c => c.id);
        const groupSelectedCnt = groupCustomerIds.filter(id => selectedIds.includes(id)).length;
        const allGroupSel = groupSelectedCnt === groupCustomerIds.length;
        const someGroupSel = groupSelectedCnt > 0 && !allGroupSel;
        const isExpanded = expandedGroup === g.id;
        const groupCustomers = customers.filter(c => c.groupId === g.id);

        return (
          <div key={g.id} style={{ marginBottom: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: allGroupSel ? `${g.color}18` : someGroupSel ? `${g.color}0d` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${allGroupSel ? `${g.color}50` : someGroupSel ? `${g.color}30` : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 9, cursor: 'pointer',
            }}>
              <div
                onClick={() => toggleGroup(g.id)}
                style={{
                  width: 15, height: 15, borderRadius: 3,
                  background: allGroupSel ? g.color : someGroupSel ? `${g.color}50` : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${allGroupSel || someGroupSel ? g.color : '#475569'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {allGroupSel && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>✓</span>}
                {someGroupSel && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>−</span>}
              </div>
              <span style={{ fontSize: 13 }}>{g.icon}</span>
              <div onClick={() => toggleGroup(g.id)} style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: allGroupSel ? g.color : '#94a3b8' }}>{g.short}</span>
                <span style={{ fontSize: 10, color: '#475569', marginLeft: 6 }}>{cnt}명</span>
                {groupSelectedCnt > 0 && (
                  <span style={{ fontSize: 10, color: g.color, marginLeft: 6 }}>({groupSelectedCnt}명 선택)</span>
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); setExpandedGroup(isExpanded ? null : g.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 11, padding: '2px 6px' }}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>

            {/* 개인 목록 */}
            {isExpanded && (
              <div style={{ paddingLeft: 12, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupCustomers.map(c => {
                  const isSel = selectedIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleOne(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                        background: isSel ? `${g.color}12` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSel ? `${g.color}35` : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 7, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 13, height: 13, borderRadius: 3,
                        background: isSel ? g.color : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${isSel ? g.color : '#475569'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isSel && <span style={{ color: 'white', fontSize: 8, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSel ? g.color : '#94a3b8' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: '#475569' }}>{c.age} · {c.region}</span>
                      <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>{c.phone ? '📱' : '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 칩 선택 헬퍼 ─────────────────────────────────────
function ChipGroup({ chips, value, onSelect, color = '#6366f1', colorBg = 'rgba(99,102,241,0.18)', multi = false }) {
  const isActive = (chip) => {
    if (!value) return false;
    if (multi) return value.includes(chip);
    return value === chip;
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
      {chips.map(chip => {
        const active = isActive(chip);
        return (
          <button
            key={chip}
            onClick={() => {
              if (multi) {
                const arr = value ? value.split(', ').map(s => s.trim()).filter(Boolean) : [];
                const next = arr.includes(chip) ? arr.filter(s => s !== chip) : [...arr, chip];
                onSelect(next.join(', '));
              } else {
                onSelect(active ? '' : chip);
              }
            }}
            style={{
              padding: '4px 11px', borderRadius: 20, border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
              background: active ? colorBg : 'rgba(255,255,255,0.03)',
              color: active ? color : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: active ? 600 : 400,
              transition: 'all 0.12s',
            }}
          >{chip}</button>
        );
      })}
    </div>
  );
}

// ── 프롬프트 설정 패널 ────────────────────────────────
function PromptPanel({ prompts, setPrompts, saveStatus, setSaveStatus }) {
  const update = (key, val) => { setPrompts(p => ({ ...p, [key]: val })); setSaveStatus('unsaved'); };

  const TONE_CHIPS = ['부드럽고 부담 없는', '친근하고 따뜻한', '격식 있고 신뢰감 있는', '적극적이고 설득력 있는', '공감하며 맞춤 제안하는', '간결하고 임팩트 있는'];
  const STYLE_CHIPS = ['정보 제공형', '행동 유도형', '조건 맞춤형', '혜택 강조형', '긴박감 강조형', '감성 공략형'];
  const LENGTH_CHIPS = ['80자', '100자', '120자', '150자'];
  const EXTRA_CHIPS = ['이름 넣어줘', '링크 끝에 붙여줘', '서론/본론/결론 구조로', '청약 일정 강조', '자격 조건 강조', '혜택 위주로'];
  const FORBIDDEN_CHIPS = ['과장 표현 금지', '확정 수익 언급 금지', '경쟁 부추기는 표현 금지', '부동산 투기 조장 금지'];

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 14 }}>🤖 AI 프롬프트 설정</div>

      {/* 말투 / 톤 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>말투 / 톤</div>
        <ChipGroup chips={TONE_CHIPS} value={prompts.tone} onSelect={v => update('tone', v)} color="#a5b4fc" colorBg="rgba(99,102,241,0.18)" />
        <input
          value={prompts.tone || ''}
          onChange={e => update('tone', e.target.value)}
          placeholder="직접 입력..."
          style={{ marginTop: 7, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      {/* 메시지 스타일 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>메시지 스타일</div>
        <ChipGroup chips={STYLE_CHIPS} value={prompts.style} onSelect={v => update('style', v)} color="#c084fc" colorBg="rgba(168,85,247,0.18)" />
        <input
          value={prompts.style || ''}
          onChange={e => update('style', e.target.value)}
          placeholder="직접 입력..."
          style={{ marginTop: 7, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      {/* 목표 글자 수 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>목표 글자 수</div>
        <ChipGroup chips={LENGTH_CHIPS} value={prompts.length} onSelect={v => update('length', v + ' 내외')} color="#34d399" colorBg="rgba(16,185,129,0.15)" />
        <input
          value={prompts.length || ''}
          onChange={e => update('length', e.target.value)}
          placeholder="직접 입력 (예: 120자 이내)..."
          style={{ marginTop: 7, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      {/* 추가 지시사항 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>추가 지시사항 <span style={{ color: '#475569', fontWeight: 400 }}>(복수 선택 가능)</span></div>
        <ChipGroup chips={EXTRA_CHIPS} value={prompts.extra} onSelect={v => update('extra', v)} color="#f59e0b" colorBg="rgba(245,158,11,0.15)" multi />
        <input
          value={prompts.extra || ''}
          onChange={e => update('extra', e.target.value)}
          placeholder="직접 입력..."
          style={{ marginTop: 7, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      {/* 금지 표현 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>금지 표현</div>
        <ChipGroup chips={FORBIDDEN_CHIPS} value={prompts.forbidden} onSelect={v => update('forbidden', v)} color="#f87171" colorBg="rgba(248,113,113,0.12)" multi />
        <input
          value={prompts.forbidden || ''}
          onChange={e => update('forbidden', e.target.value)}
          placeholder="직접 입력..."
          style={{ marginTop: 7, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      {/* 상담 링크 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>상담 링크</div>
        <input
          value={prompts.link || ''}
          onChange={e => update('link', e.target.value)}
          placeholder="https://..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
        />
      </div>

      <button
        onClick={() => setSaveStatus('saved')}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
          background: saveStatus === 'saved' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.25)',
          color: saveStatus === 'saved' ? '#10b981' : '#a5b4fc',
          transition: 'all 0.15s',
        }}
      >
        {saveStatus === 'saved' ? '✅ 저장됨' : '💾 저장하기'}
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function AISendPanel({ customers, templates, apt, prompts, setPrompts, isAd, setSent }) {
  // 세그먼트 선택
  const [selectedIds, setSelectedIds] = useState([]);

  // 메시지 소스
  const [msgSource, setMsgSource] = useState('template'); // 'template' | 'ai'

  // 템플릿 선택
  const [selTemplate, setSelTemplate] = useState(null);
  const [tmplSearch, setTmplSearch] = useState('');
  const [editMsg, setEditMsg] = useState('');

  // AI 생성
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [aiPreviewCustomer, setAiPreviewCustomer] = useState(null); // AI 미리보기 기준 고객

  // 발송
  const [sending, setSending] = useState(false);
  const [sendLog, setSendLog] = useState([]);
  const [sendDone, setSendDone] = useState(false);
  const [promptSaveStatus, setPromptSaveStatus] = useState('saved');
  const [localIsAd, setLocalIsAd] = useState(isAd); // 광고 표기 — 발송 실행 영역에서 관리

  const logRef = useRef(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [sendLog]);

  const selectedCustomers = customers.filter(c => selectedIds.includes(c.id));

  // 템플릿 선택 시 editMsg 동기화
  const handleSelectTemplate = t => {
    setSelTemplate(t);
    setEditMsg(t.content);
  };

  // AI 메시지 생성 (첫 번째 선택 고객 기준 미리보기)
  const handleGenerateAI = async () => {
    const preview = selectedCustomers[0] || customers[0];
    if (!preview) { alert('고객을 먼저 선택해주세요'); return; }
    setAiPreviewCustomer(preview);
    setAiLoading(true); setAiMsg(''); setEditMsg('');
    try {
      const msg = await generateAIMessage(preview, apt, prompts);
      setAiMsg(msg); setEditMsg(msg);
    } catch (e) { setAiMsg('오류: ' + e.message); }
    setAiLoading(false);
  };

  // 발송 실행
  const handleSend = async () => {
    const finalMsg = editMsg.trim();
    if (!finalMsg) { alert('메시지를 먼저 작성해주세요'); return; }
    if (selectedCustomers.length === 0) { alert('고객을 선택해주세요'); return; }
    setSending(true); setSendDone(false); setSendLog([]);

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
    const timeStr = now.toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'});
    const fullDatetime = `${dateStr} ${timeStr}`;

    const addLog = (msg, color) => setSendLog(prev => [...prev, { time: timeStr, msg, color }]);
    addLog(`🚀 발송 시작 — ${selectedCustomers.length}명`, '#a5b4fc');

    for (const c of selectedCustomers) {
      const g = getGroup(c.groupId);
      const msgToSend = applyAdPrefix(finalMsg, localIsAd);
      let status = 'noPhone';
      let errorMsg = '';
      let messageId = null;

      if (!c.phone || c.phone.length < 10) {
        addLog(`📋 ${c.name} 내역 저장 (번호 없음)`, '#f59e0b');
        status = 'noPhone';
      } else {
        try {
          addLog(`📤 ${c.name} (${c.phone}) 발송 요청 중...`, '#94a3b8');
          const res = await sendSMS(c.phone, msgToSend);
          messageId = res.messageId;
          addLog(`⏳ ${c.name} 발송 요청 완료 — 실제 전달 상태 확인 중...`, '#f59e0b');
          // 폴링으로 실제 상태 확인
          const checked = await checkSMSStatus(messageId);
          if (checked) {
            status = checked.realStatus;
            errorMsg = checked.errorMsg ? `${checked.errorCode} ${checked.errorMsg}` : '';
            if (status === 'success') {
              addLog(`✅ ${c.name} 실제 발송 성공 확인`, '#10b981');
            } else {
              addLog(`❌ ${c.name} 발송 실패 — ${errorMsg}`, '#f87171');
            }
          } else {
            // 10초 내 확정 안 된 경우 → pending
            status = 'pending';
            addLog(`⏳ ${c.name} 발송 확인 중 (Solapi 대시보드 최종 확인 권장)`, '#f59e0b');
          }
        } catch (e) {
          status = 'fail';
          errorMsg = e.message;
          addLog(`❌ ${c.name} 실패: ${e.message}`, '#f87171');
        }
      }

      setSent(prev => [{
        customer: c, message: msgToSend, group: g,
        apt: apt.name,
        date: dateStr, time: timeStr, datetime: fullDatetime,
        label: msgSource === 'template' ? (selTemplate?.title || '템플릿') : 'AI 자동생성',
        status,
        errorMsg,
        messageId,
      }, ...prev]);
      await new Promise(r => setTimeout(r, 200));
    }

    addLog(`🎉 완료! ${selectedCustomers.length}명 처리`, '#10b981');
    setSending(false); setSendDone(true);
  };

  const filteredTemplates = tmplSearch
    ? templates.filter(t => t.title.toLowerCase().includes(tmplSearch.toLowerCase()))
    : templates;

  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{`
        .aisend-tab { transition: all 0.15s; }
        .aisend-tab:hover { opacity: 0.85; }
        .chk-row:hover { filter: brightness(1.1); }
        .tmpl-item:hover { background: rgba(99,102,241,0.12) !important; }
      `}</style>

      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>💬 AI 메시지 발송</div>
        <div style={{ fontSize: 12, color: '#475569' }}>세그먼트 선택 → 메시지 작성 → 발송</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── 왼쪽: 세그먼트 선택 ── */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>
              📋 발송 대상 선택
              {selectedCustomers.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                  {selectedCustomers.length}명 선택
                </span>
              )}
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              <SegmentSelector customers={customers} selectedIds={selectedIds} onChange={setSelectedIds} />
            </div>
          </div>

          {/* 아파트 정보 + 발신번호 */}
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 11 }}>
            <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>📌 {apt.name}</div>
            <div style={{ color: '#64748b' }}>{apt.date} · {apt.price}</div>
            <div style={{ color: '#475569', marginTop: 2, marginBottom: 10 }}>{apt.location}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>📞 발신번호</div>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 7, padding: '6px 10px', fontSize: 11,
                color: import.meta.env.VITE_SOLAPI_SENDER ? '#10b981' : '#f87171',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{import.meta.env.VITE_SOLAPI_SENDER ? '✅' : '⚠️'}</span>
                <span style={{ fontWeight: 600 }}>
                  {import.meta.env.VITE_SOLAPI_SENDER || '미설정 — Vercel 환경변수 확인 필요'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 메시지 작성 + 발송 ── */}
        <div>
          {/* 상단 2컬럼: 프롬프트 + 메시지 작성 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* AI 프롬프트 설정 */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
              <PromptPanel prompts={prompts} setPrompts={setPrompts} saveStatus={promptSaveStatus} setSaveStatus={setPromptSaveStatus} />
            </div>

            {/* 메시지 작성 */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>✏️ 메시지 작성</div>

              {/* 소스 탭 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button className="aisend-tab" onClick={() => setMsgSource('template')}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: msgSource === 'template' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                    color: msgSource === 'template' ? '#a5b4fc' : '#64748b' }}>
                  📋 템플릿 선택
                </button>
                <button className="aisend-tab" onClick={() => setMsgSource('ai')}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: msgSource === 'ai' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)',
                    color: msgSource === 'ai' ? '#c084fc' : '#64748b' }}>
                  ✨ AI 자동생성
                </button>
              </div>

              {/* 템플릿 선택 */}
              {msgSource === 'template' && (
                <div>
                  {/* 그룹별 고정 추천 메시지 (CSV 기반) */}
                  {selectedCustomers.length > 0 && (() => {
                    const uniqueGroups = [...new Set(selectedCustomers.map(c => c.groupId))];
                    const fixedRecs = uniqueGroups
                      .filter(gid => GROUP_FIXED_MESSAGES[gid])
                      .map(gid => ({ gid, g: getGroup(gid), fm: GROUP_FIXED_MESSAGES[gid] }));
                    if (!fixedRecs.length) return null;
                    return (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>⭐ 그룹 고정 추천 메시지</span>
                          <span style={{ color: '#475569', fontWeight: 400 }}>({fixedRecs.length}개 그룹)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {fixedRecs.map(({ gid, g, fm }) => {
                            const isSelected = selTemplate?.id === `fixed_${gid}`;
                            return (
                              <div
                                key={gid}
                                className="tmpl-item"
                                onClick={() => handleSelectTemplate({ id: `fixed_${gid}`, title: fm.title, content: fm.content })}
                                style={{
                                  background: isSelected ? `${g.color}18` : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${isSelected ? `${g.color}60` : `${g.color}25`}`,
                                  borderRadius: 9, padding: '9px 12px', cursor: 'pointer',
                                  borderLeft: `3px solid ${g.color}`,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <span style={{ fontSize: 13 }}>{g.icon}</span>
                                  <span style={{ fontSize: 11, color: g.color, fontWeight: 700 }}>{g.short}</span>
                                  <span style={{ fontSize: 9, color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 10 }}>고정 메시지</span>
                                  {isSelected && <span style={{ fontSize: 9, color: g.color, marginLeft: 'auto', fontWeight: 700 }}>✓ 선택됨</span>}
                                </div>
                                <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {fm.content.slice(0, 80)}...
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 7 }}>📋 전체 템플릿에서 선택</div>
                      </div>
                    );
                  })()}

                  <input
                    value={tmplSearch}
                    onChange={e => setTmplSearch(e.target.value)}
                    placeholder="🔍 템플릿 검색..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 12px', color: '#e2e8f0', fontSize: 11, outline: 'none', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
                    {filteredTemplates.map(t => (
                      <div
                        key={t.id}
                        className="tmpl-item"
                        onClick={() => handleSelectTemplate(t)}
                        style={{
                          background: selTemplate?.id === t.id ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selTemplate?.id === t.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 7, padding: '7px 11px', cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 11, color: selTemplate?.id === t.id ? '#a5b4fc' : '#94a3b8' }}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 자동생성 */}
              {msgSource === 'ai' && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                    {selectedCustomers.length > 0
                      ? `✦ 첫 번째 선택 고객(${selectedCustomers[0].name})을 기준으로 미리보기 생성`
                      : '✦ 고객을 먼저 선택하면 맞춤 메시지를 생성해요'}
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    style={{
                      width: '100%', padding: '9px', borderRadius: 9, border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 700,
                      background: aiLoading ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8,
                    }}
                  >
                    {aiLoading ? (
                      <>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`, display: 'inline-block' }} />
                        ))}
                        <span>Claude 생성 중...</span>
                      </>
                    ) : '✨ AI 메시지 생성'}
                  </button>
                  {aiPreviewCustomer && aiMsg && (
                    <div style={{ fontSize: 10, color: '#a855f7', marginBottom: 4 }}>
                      📎 {aiPreviewCustomer.name} 기준 미리보기 · 발송 시 동일 메시지 전송
                    </div>
                  )}
                </div>
              )}

              {/* 메시지 편집 영역 */}
              <textarea
                value={editMsg}
                onChange={e => setEditMsg(e.target.value)}
                placeholder={msgSource === 'template' ? '왼쪽에서 템플릿을 선택하세요' : 'AI 생성 버튼을 눌러 메시지를 만들어보세요'}
                style={{
                  width: '100%', minHeight: 160, background: '#0f172a',
                  border: `1px solid ${editMsg ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 9, padding: 12, fontSize: 12, lineHeight: 1.8,
                  color: '#e2e8f0', resize: 'vertical', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#334155', marginTop: 4 }}>
                <span>{editMsg.length}자</span>
                {editMsg.length > 90 && <span style={{ color: '#f59e0b' }}>⚠️ 90자 초과 — LMS 요금 적용</span>}
              </div>
            </div>
          </div>

          {/* 발송 실행 패널 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>🚀 발송 실행</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* 광고 표기 토글 — 발송 실행 옆 */}
                <div
                  onClick={() => setLocalIsAd(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: localIsAd ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${localIsAd ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 26, height: 14, borderRadius: 10, background: localIsAd ? '#f59e0b' : '#334155', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: localIsAd ? 13 : 2, width: 10, height: 10, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: localIsAd ? '#f59e0b' : '#64748b' }}>{localIsAd ? '(광고) ON' : '광고표기'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  {selectedCustomers.length > 0 ? (
                    <span style={{ color: '#a5b4fc' }}>{selectedCustomers.length}명 대상</span>
                  ) : '고객 미선택'}
                  {editMsg && <span style={{ color: '#10b981', marginLeft: 8 }}>· 메시지 준비됨</span>}
                </div>
              </div>
            </div>

            {/* 선택된 고객 미리보기 */}
            {selectedCustomers.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {selectedCustomers.slice(0, 10).map(c => {
                  const g = getGroup(c.groupId);
                  return (
                    <div key={c.id} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: `${g.color}15`, color: g.color, border: `1px solid ${g.color}30` }}>
                      {g.icon} {c.name}
                    </div>
                  );
                })}
                {selectedCustomers.length > 10 && (
                  <div style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                    +{selectedCustomers.length - 10}명 더
                  </div>
                )}
              </div>
            )}

            {/* 메시지 미리보기 */}
            {editMsg && (
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 11, color: '#94a3b8', lineHeight: 1.8, maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-line' }}>
                {localIsAd && <span style={{ color: '#f59e0b', fontWeight: 600 }}>(광고) </span>}{editMsg}
              </div>
            )}

            {/* 발송 버튼 */}
            <button
              onClick={handleSend}
              disabled={sending || !editMsg || selectedCustomers.length === 0}
              style={{
                width: '100%', padding: '13px', borderRadius: 11, border: 'none',
                cursor: (sending || !editMsg || selectedCustomers.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 800,
                background: sending ? 'rgba(99,102,241,0.3)' : (!editMsg || selectedCustomers.length === 0) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
                color: (!editMsg || selectedCustomers.length === 0) ? '#334155' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {sending ? (
                <>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`, display: 'inline-block' }} />
                  ))}
                  <span>발송 중...</span>
                </>
              ) : selectedCustomers.length === 0 ? '고객을 선택해주세요' : !editMsg ? '메시지를 작성해주세요'
                : `💬 ${selectedCustomers.length}명에게 발송`}
            </button>

            {/* 발송 로그 */}
            {sendLog.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📡 발송 로그
                  {sending && <span style={{ fontSize: 10, color: '#f59e0b' }}>● 진행 중</span>}
                  {sendDone && <span style={{ fontSize: 10, color: '#10b981' }}>✅ 완료</span>}
                </div>
                <div ref={logRef} style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {sendLog.map((l, i) => (
                    <div key={i} style={{ fontSize: 11, color: l.color || '#94a3b8' }}>
                      <span style={{ color: '#334155', marginRight: 8 }}>{l.time}</span>{l.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
