import { useState } from "react";
import { ALL_GROUPS } from "./constants";

export default function AgentPanel({ customers, templates, apt, prompts, isAd, setSent }) {
  return (
    <div style={{ maxWidth: 900 }}>
      {/* 🤖 AI 에이전트 작동 프로세스 및 정보 설명 (요구사항 반영) */}
      <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 16, padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a5b4fc' }}>AI 에이전트 메시지 생성 프로세스</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { t: "1. 고객 정보", d: "이름, 나이, 지역, 청격자격 등", i: "👤" },
            { t: "2. 세그먼트", d: "그룹별 니즈 및 타겟팅 포인트", i: "🎯" },
            { t: "3. 프롬프트 설정", d: "말투, 스타일, 금지표현 가이드", i: "✍️" },
            { t: "4. 아파트 정보", d: "단지명, 일자, 분양가 등 핵심데이터", i: "🏢" }
          ].map((item, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>{item.i}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#f1f5f9', marginBottom: 4 }}>{item.t}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>{item.d}</div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 18, padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 10, borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>
            💡 <strong>안내:</strong> 고객마다 이름, 자격, 거주지역이 다르기 때문에 동일한 아파트 정보라도 메시지가 조금씩 다르게 개인화되어 자동 생성됩니다.
          </div>
        </div>
      </div>
      
      {/* 하단 기존 에이전트 실행 UI 코드 위치 */}
    </div>
  );
}
