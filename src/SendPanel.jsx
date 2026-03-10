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
  const [bulkGroup, setBulkGroup] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);

  const getGroup = id => ALL_GROUPS.find(g => g.id === id) || { name: '미분류', color: '#64748b', icon: '❓', short: '미분류' };

  // 1. 광고 표기 자동 적용 로직 (요구사항 반영)
  useEffect(() => {
    if (editMsg || selTemplate) {
      const adTag = "(광고) ";
      let currentMsg = editMsg;
      
      if (isAd && !currentMsg.startsWith(adTag)) {
        setEditMsg(adTag + currentMsg);
      } else if (!isAd && currentMsg.startsWith(adTag)) {
        setEditMsg(currentMsg.replace(adTag, ""));
      }
    }
  }, [isAd]);

  const generateAI = async (customer) => {
    setLoading(true);
    // AI 생성 로직 (생략된 기존 로직 유지하되, 완료 후 setEditMsg 호출 시 isAd 체크)
    // 예시: const result = await fetchAI(...);
    // setEditMsg(isAd ? "(광고) " + result : result);
    setLoading(false);
  };

  const sendSMS = async (to, text) => { /* 기존 솔라피 발송 로직 */ };

  // 공통 설정 컴포넌트
  const ConfigBar = () => (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>📌 {apt.name} · {apt.date}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setTab('prompts')} style={{ background: 'none', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>프롬프트</button>
        <button onClick={() => setTab('apt')} style={{ background: 'none', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>아파트 수정</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[{ k: 'individual', l: '👤 개별 발송' }, { k: 'group', l: '👥 그룹별 발송' }, { k: 'all', l: '📢 전체 발송' }].map(m => (
          <button key={m.k} onClick={() => setSendMode(m.k)} style={{ flex: 1, padding: '12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: sendMode === m.k ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: sendMode === m.k ? '#a5b4fc' : '#94a3b8', fontSize: 13, fontWeight: 700 }}>{m.l}</button>
        ))}
      </div>

      <ConfigBar />

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          {/* 메시지 편집창 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              {sendMode === 'all' ? '📢 전체 고객 메시지' : sendMode === 'group' ? '👥 그룹 선택 메시지' : '👤 개별 고객 메시지'}
            </div>
            <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} 
              style={{ width: '100%', minHeight: 220, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, outline: 'none' }} />
            <button style={{ width: '100%', marginTop: 12, padding: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
              {sendMode === 'all' ? `전체 ${customers.length}명 발송` : '메시지 발송하기'}
            </button>
          </div>

          {/* AI 및 템플릿 도구 */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>MESSAGE TOOLS</div>
            <button onClick={() => setAiMode('ai')} style={{ width: '100%', padding: '10px', background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', borderRadius: 8, color: '#c084fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>✨ AI 자동생성</button>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>📋 템플릿 라이브러리</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => { setSelTemplate(t); setEditMsg(isAd ? "(광고) " + t.content : t.content); }}
                  style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11, color: '#94a3b8', cursor: 'pointer', border: '1px solid transparent' }}>{t.title}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
