import { useState, useEffect, useCallback } from "react";
import { TEMPLATES, DEFAULT_APT, DEFAULT_PROMPTS, SAMPLE, ALL_GROUPS, parseCSV, classifyGroup } from "./constants";
import Dashboard from "./Dashboard";
import AISendPanel from "./AISendPanel";
import AgentPanel from "./AgentPanel";
import SentHistory from "./SentHistory";

const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";
const LS_KEYS = {
  customers: 'crm_customers',
  sheetUrl:  'crm_sheet_url',
  apt:       'crm_apt',
  prompts:   'crm_prompts',
  sent:      'crm_sent',
  tab:       'crm_tab',
};

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const TABS = [
  {key:'data',      label:'📂 고객데이터'},
  {key:'overview',  label:'📊 세그먼트'},
  {key:'apt',       label:'🏢 아파트'},
  {key:'templates', label:'📝 템플릿 관리'},
  {key:'aisend',    label:'💬 AI 메시지발송'},
  {key:'sent',      label:'📋 발송내역'},
  {key:'agent',     label:'🤖 AI 에이전트', highlight: true},
];

// 구글 시트 fetch (최대 10000행)
async function fetchSheetCustomers(sheetUrl) {
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('잘못된 시트 URL');
  if (!GSHEET_API_KEY) throw new Error('VITE_GSHEET_API_KEY 미설정');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z10000?key=${GSHEET_API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.values || data.values.length < 2) throw new Error('시트에 데이터 없음');
  const normalizeHeader = h => h.trim().replace(/"/g,'').replace(/^\uFEFF/,'').replace(/^\*/,'');
  const headers = data.values[0].map(normalizeHeader);
  return data.values.slice(1).map((row, idx) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return {
      id: idx + 1,
      name: obj['고객 이름'] || obj['이름'] || obj['고객명'] || `고객${idx+1}`,
      age: obj['나이'] || '-',
      gender: obj['성별'] || '-',
      region: obj['나의 거주 지역'] || obj['나의거주지역'] || obj['지역'] || '-',
      phone: (obj['고객 연락처 (테스트 발송)'] || obj['연락처'] || '').replace(/-/g,''),
      groupId: classifyGroup(obj),
      memo: obj['비고'] || '',
      marketing: obj['마케팅 수신동의'] || '',
      자격: obj['청약 자격'] || obj['청약자격'] || '',
      목적: obj['구매목적'] || '',
      의사: obj['청약의사'] || '',
      분양: obj['분양 일정 인지'] || '',
    };
  }).filter(c => c.name);
}

export default function App() {
  const [tab, setTab] = useState(() => lsGet(LS_KEYS.tab, 'data'));
  const [apt, setAptState] = useState(() => lsGet(LS_KEYS.apt, DEFAULT_APT));
  const [prompts, setPromptsState] = useState(() => lsGet(LS_KEYS.prompts, DEFAULT_PROMPTS));
  const [customers, setCustomersState] = useState(() => lsGet(LS_KEYS.customers, SAMPLE));
  const [templates, setTemplates] = useState(TEMPLATES);
  const [sent, setSentState] = useState(() => lsGet(LS_KEYS.sent, []));
  const [tmplSource, setTmplSource] = useState('default');
  const [promptSaveStatus, setPromptSaveStatus] = useState('saved');
  const [autoFetching, setAutoFetching] = useState(false);
  const [autoFetchMsg, setAutoFetchMsg] = useState('');

  // localStorage 자동 동기화 래퍼
  const setCustomers = useCallback((v) => {
    setCustomersState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      lsSet(LS_KEYS.customers, next);
      return next;
    });
  }, []);
  const setApt = useCallback((v) => {
    setAptState(prev => { const next = typeof v==='function'?v(prev):v; lsSet(LS_KEYS.apt, next); return next; });
  }, []);
  const setPrompts = useCallback((v) => {
    setPromptsState(prev => { const next = typeof v==='function'?v(prev):v; lsSet(LS_KEYS.prompts, next); return next; });
  }, []);
  const setSent = useCallback((v) => {
    setSentState(prev => { const next = typeof v==='function'?v(prev):v; lsSet(LS_KEYS.sent, next); return next; });
  }, []);
  const handleSetTab = (t) => { setTab(t); lsSet(LS_KEYS.tab, t); };

  // 앱 시작 시 — 저장된 구글 시트 URL 있으면 자동 재불러오기
  useEffect(() => {
    const savedUrl = lsGet(LS_KEYS.sheetUrl, '');
    if (!savedUrl || !GSHEET_API_KEY) return;
    setAutoFetching(true);
    setAutoFetchMsg('🔄 구글 시트에서 고객 데이터 자동 불러오는 중...');
    fetchSheetCustomers(savedUrl)
      .then(rows => {
        setCustomers(rows);
        setAutoFetchMsg(`✅ ${rows.length.toLocaleString()}명 자동 로드 완료`);
        setTimeout(() => setAutoFetchMsg(''), 3000);
      })
      .catch(e => {
        setAutoFetchMsg(`⚠️ 자동 불러오기 실패 (localStorage 데이터 사용 중): ${e.message}`);
        setTimeout(() => setAutoFetchMsg(''), 5000);
      })
      .finally(() => setAutoFetching(false));
  }, []); // eslint-disable-line

  const groupCounts = ALL_GROUPS.reduce((acc,g)=>{
    acc[g.id]=customers.filter(c=>c.groupId===g.id).length;
    return acc;
  },{});
  const totalCount = customers.length;

  return (
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",background:'#0b0f1e',minHeight:'100vh',color:'#e2e8f0',fontSize:14}}>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}} *{box-sizing:border-box} textarea,input{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}`}</style>

      {/* ── 자동 fetch 상태 바 ── */}
      {autoFetchMsg && (
        <div style={{background: autoFetchMsg.startsWith('✅') ? 'rgba(16,185,129,0.12)' : autoFetchMsg.startsWith('⚠️') ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
          borderBottom: `1px solid ${autoFetchMsg.startsWith('✅') ? 'rgba(16,185,129,0.3)' : autoFetchMsg.startsWith('⚠️') ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`,
          padding: '7px 24px', fontSize: 12, color: autoFetchMsg.startsWith('✅') ? '#10b981' : autoFetchMsg.startsWith('⚠️') ? '#f59e0b' : '#a5b4fc',
          display: 'flex', alignItems: 'center', gap: 8}}>
          {autoFetching && <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'currentColor',animation:'pulse 1.2s ease-in-out infinite'}}/>}
          {autoFetchMsg}
        </div>
      )}

      {/* ── 헤더 ── */}
      <div style={{background:'linear-gradient(135deg,#0f172a,#1e1b4b 60%,#0f172a)',borderBottom:'1px solid rgba(99,102,241,0.25)',padding:'0 24px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:52}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>🏢</div>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>청약 CRM AI 메시지 센터</div>
              <div style={{fontSize:9,color:'#a5b4fc'}}>Claude AI · {templates.length}개 템플릿 · 솔라피 SMS</div>
            </div>
          </div>
          <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>handleSetTab(t.key)}
                style={{padding:'5px 10px',borderRadius:7,border:t.highlight?'1px solid rgba(251,191,36,0.5)':'none',cursor:'pointer',fontSize:11,fontWeight:500,
                  background:tab===t.key?(t.highlight?'rgba(251,191,36,0.3)':'rgba(99,102,241,0.35)'):(t.highlight?'rgba(251,191,36,0.1)':'transparent'),
                  color:tab===t.key?(t.highlight?'#fbbf24':'#a5b4fc'):(t.highlight?'#fbbf24':'#94a3b8')}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 5px #10b981'}}/>
            <span style={{fontSize:10,color:'#10b981'}}>{totalCount.toLocaleString()}명</span>
          </div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div style={{padding:'22px 24px',maxWidth:1400,margin:'0 auto'}}>

        {['data','overview','apt','templates'].includes(tab)&&(
          <Dashboard
            customers={customers} setCustomers={setCustomers}
            templates={templates} setTemplates={setTemplates}
            apt={apt} setApt={setApt}
            prompts={prompts} setPrompts={setPrompts}
            tab={tab} setTab={handleSetTab}
            groupCounts={groupCounts} totalCount={totalCount}
            tmplSource={tmplSource} setTmplSource={setTmplSource}
            promptSaveStatus={promptSaveStatus} setPromptSaveStatus={setPromptSaveStatus}
            lsSheetUrlKey={LS_KEYS.sheetUrl}
          />
        )}

        {tab==='aisend'&&(
          <AISendPanel
            customers={customers} templates={templates}
            apt={apt} prompts={prompts} setPrompts={setPrompts}
            setSent={setSent}
          />
        )}

        {tab==='agent'&&(
          <AgentPanel
            customers={customers} templates={templates}
            apt={apt} prompts={prompts}
            setSent={setSent}
          />
        )}

        {tab==='sent'&&(
          <SentHistory sent={sent} setSent={setSent} />
        )}
      </div>
    </div>
  );
}
