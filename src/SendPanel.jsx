import { useState, useEffect } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function SendPanel({ customers, templates, apt, prompts, isAd, sent, setSent, setTab }) {
  const [sendMode, setSendMode] = useState('individual');
  const [selected, setSelected] = useState(null);
  const [aiMode, setAiMode] = useState('template');
  const [selTemplate, setSelTemplate] = useState(null);
  const [editMsg, setEditMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [filterGroup, setFilterGroup] = useState(null);
  const [tmplSearch, setTmplSearch] = useState('');
  
  // 그룹/전체 발송용 상태
  const [bulkGroup, setBulkGroup] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);

  // 광고 표기 자동 적용 로직
  useEffect(() => {
    if (editMsg) {
      const adTag = "(광고) ";
      if (isAd && !editMsg.startsWith(adTag)) {
        setEditMsg(adTag + editMsg);
      } else if (!isAd && editMsg.startsWith(adTag)) {
        setEditMsg(editMsg.replace(adTag, ""));
      }
    }
  }, [isAd]);

  const getGroup = id => ALL_GROUPS.find(g=>g.id===id)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류'};

  // 공통 UI 컴포넌트: 아파트 정보 및 AI 설정 섹션
  const ConfigSection = () => (
    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>🏢 {apt.name}</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>{apt.date} · {apt.location}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setTab('prompts')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>🤖 프롬프트</button>
        <button onClick={() => setTab('apt')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>🏢 정보 수정</button>
      </div>
    </div>
  );

  // 공통 UI 컴포넌트: 템플릿/AI 선택 섹션
  const MessageToolSection = (targetCustomer = null) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button onClick={() => setAiMode('template')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: aiMode === 'template' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)', color: aiMode === 'template' ? '#a5b4fc' : '#64748b' }}>📋 템플릿 선택</button>
        <button onClick={() => { setAiMode('ai'); generateAI(targetCustomer); }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: aiMode === 'ai' ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)', color: aiMode === 'ai' ? '#c084fc' : '#64748b' }}>✨ AI 자동생성</button>
      </div>
      {aiMode === 'template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8 }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => { setSelTemplate(t); setEditMsg(isAd ? "(광고) " + t.content : t.content); }}
              style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, background: selTemplate?.id === t.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: selTemplate?.id === t.id ? '#a5b4fc' : '#94a3b8' }}>
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ... (generateAI 및 sendBulk 로직은 기존 유지하며 isAd 반영)

  return (
    <div>
      {/* 상단 탭 (개별/그룹/전체) UI 유지 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['individual', 'group', 'all'].map(mode => (
          <button key={mode} onClick={() => setSendMode(mode)} style={{ /* 기존 스타일 */ }}>{mode === 'individual' ? '👤 개별' : mode === 'group' ? '👥 그룹' : '📢 전체'}</button>
        ))}
      </div>

      <ConfigSection />

      {sendMode === 'all' && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 15 }}>📢 전체 {customers.length}명에게 발송</div>
          {MessageToolSection(null)}
          <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} style={{ width: '100%', minHeight: 150, background: '#111827', color: '#e2e8f0', padding: 12, borderRadius: 8, border: '1px solid #334155' }} />
          <button onClick={() => sendBulk(customers, '전체')} style={{ width: '100%', marginTop: 10, padding: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700 }}>전체 발송 시작</button>
        </div>
      )}

      {/* ... (group, individual 모드에도 MessageToolSection 적용) */}
    </div>
  );
}
