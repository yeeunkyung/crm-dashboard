export default function AgentPanel({ customers, templates, apt, prompts, isAd, setSent }) {
  // ... (기존 상태 유지)

  return (
    <div style={{ maxWidth: 900 }}>
      {/* 🤖 AI 에이전트 가이드 섹션 추가 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.7))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 24 }}>🤖</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a5b4fc' }}>AI 에이전트 메시지 생성 프로세스</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { id: 1, t: "고객 정보", d: "이름, 나이, 지역, 청약자격 등 데이터 추출", icon: "👤" },
            { id: 2, t: "세그먼트", d: "그룹별 구매 목적 및 니즈 분석 반영", icon: "🎯" },
            { id: 3, t: "프롬프트 설정", d: "브랜드 말투, 스타일, 금지표현 적용", icon: "✍️" },
            { id: 4, t: "아파트 정보", d: "단지명, 일자, 가격 등 핵심정보 결합", icon: "🏢" },
          ].map(item => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{item.t}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>{item.d}</div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(99,102,241,0.1)', borderRadius: 8, borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>
            💡 <strong>작동 원리:</strong> 위 4가지 핵심 데이터를 실시간으로 조합하여, 고객 개개인의 특성에 맞춘 독자적인 메시지를 생성합니다. 고객의 자격이나 지역이 다를 경우 AI가 이를 판단하여 문구의 강조점을 자동으로 변경합니다.
          </div>
        </div>
      </div>

      {/* 기존 실행 컨트롤 UI */}
      {/* ... */}
    </div>
  );
}
