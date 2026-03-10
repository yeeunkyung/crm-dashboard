import { useState } from "react";

export default function AgentPanel({ customers, templates, apt, isAd }) {
  return (
    <div style={{ maxWidth: 600, padding: 20, textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: 40, marginBottom: 20 }}>🤖</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>AI 에이전트가 준비되었습니다.</div>
      <p style={{ fontSize: 13 }}>조건에 맞는 고객에게 자동으로 메시지를 생성하고 발송합니다.</p>
      <button style={{ marginTop: 20, padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
        에이전트 실행하기
      </button>
    </div>
  );
}
