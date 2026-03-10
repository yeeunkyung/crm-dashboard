import { useState, useRef, useEffect } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

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
async function sendSMS(to, text) {
  const sender = import.meta.env.VITE_SOLAPI_SENDER || '';
  const { apiKey, date, salt, signature } = await makeSolapiAuth();
  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}` },
    body: JSON.stringify({ message: { to: to.replace(/-/g, ''), from: sender, text } }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage || data.message || '발송 실패');
  return data;
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

// ── 프롬프트 설정 패널 ────────────────────────────────
function PromptPanel({ prompts, setPrompts, saveStatus, setSaveStatus }) {
  const fields = [
    { key: 'tone',      label: '말투·톤',   placeholder: '예: 친근하고 전문적인' },
    { key: 'style',     label: '스타일',     placeholder: '예: 간결하고 명확한' },
    { key: 'length',    label: '길이',       placeholder: '예: 100자 내외' },
    { key: 'extra',     label: '추가 지시사항', placeholder: '예: 이름 포함, 링크 추가, 서론/본론/결론 구조' },
    { key: 'forbidden', label: '금지 표현',  placeholder: '예: 과장 표현, 확정적 수익 언급' },
    { key: 'link',      label: '상담 링크',  placeholder: 'https://...' },
  ];

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', marginBottom: 12 }}>🤖 AI 프롬프트 설정</div>
      {fields.map(f => (
        <div key={f.key} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{f.label}</div>
          <input
            value={prompts[f.key] || ''}
            onChange={e => { setPrompts(p => ({ ...p, [f.key]: e.target.value })); setSaveStatus('unsaved'); }}
            placeholder={f.placeholder}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '7px 11px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
          />
        </div>
      ))}
      <button
        onClick={() => setSaveStatus('saved')}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
          background: saveStatus === 'saved' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.25)',
          color: saveStatus === 'saved' ? '#10b981' : '#a5b4fc',
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

    const addLog = (msg, color) => setSendLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, color }]);
    addLog(`🚀 발송 시작 — ${selectedCustomers.length}명`, '#a5b4fc');

    for (const c of selectedCustomers) {
      const g = getGroup(c.groupId);
      const msgToSend = applyAdPrefix(finalMsg, isAd);
      try {
        if (c.phone && c.phone.length >= 10) {
          await sendSMS(c.phone, msgToSend);
          addLog(`✅ ${c.name} (${c.phone}) 발송 성공`, '#10b981');
        } else {
          addLog(`📋 ${c.name} 발송내역 저장 (번호 없음)`, '#f59e0b');
        }
        setSent(prev => [{
          customer: c, message: msgToSend, group: g,
          apt: apt.name, time: new Date().toLocaleTimeString(),
          label: msgSource === 'template' ? (selTemplate?.title || '템플릿') : 'AI 자동생성',
          simulated: !c.phone || c.phone.length < 10,
        }, ...prev]);
      } catch (e) {
        addLog(`❌ ${c.name} 실패: ${e.message}`, '#f87171');
      }
      // 0.3초 딜레이
      await new Promise(r => setTimeout(r, 300));
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

          {/* 아파트 정보 */}
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 11 }}>
            <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: 6 }}>📌 {apt.name}</div>
            <div style={{ color: '#64748b' }}>{apt.date} · {apt.price}</div>
            <div style={{ color: '#475569', marginTop: 2 }}>{apt.location}</div>
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
                  <input
                    value={tmplSearch}
                    onChange={e => setTmplSearch(e.target.value)}
                    placeholder="🔍 템플릿 검색..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 12px', color: '#e2e8f0', fontSize: 11, outline: 'none', marginBottom: 8 }}
                  />
                  {selectedCustomers.length > 0 && (() => {
                    const recIds = TEMPLATE_MAPPING[selectedCustomers[0].groupId] || [];
                    const recNames = recIds.map(id => templates.find(t => t.id === id)?.title).filter(Boolean).slice(0, 2);
                    if (!recNames.length) return null;
                    return (
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                        💡 추천: {recNames.join(', ')}
                      </div>
                    );
                  })()}
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
              {isAd && editMsg && (
                <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 4 }}>⚠️ 광고 표기 ON — (광고) 자동 추가됨</div>
              )}
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
              <div style={{ fontSize: 11, color: '#475569' }}>
                {selectedCustomers.length > 0 ? (
                  <span style={{ color: '#a5b4fc' }}>{selectedCustomers.length}명 대상</span>
                ) : '고객 미선택'}
                {editMsg && <span style={{ color: '#10b981', marginLeft: 8 }}>· 메시지 준비됨</span>}
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
                {applyAdPrefix(editMsg, isAd)}
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
