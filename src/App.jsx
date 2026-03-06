import { useState, useCallback, useRef } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const SOLAPI_API_KEY = import.meta.env.VITE_SOLAPI_API_KEY || "";
const SOLAPI_SENDER = import.meta.env.VITE_SOLAPI_SENDER || "";
const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

const SEGMENTS = [
  { tier:"1차", tierLabel:"거절/관망", tierColor:"#94a3b8", tierBg:"rgba(148,163,184,0.08)", tierBorder:"rgba(148,163,184,0.25)",
    groups:[
      { id:1, name:"그룹1 거절 및 관망", short:"거절·관망", icon:"🚫", color:"#94a3b8", desc:"청약 의사 없음 + 분양 일정 몰랐음" },
      { id:2, name:"그룹2 관심도",       short:"관심도",   icon:"👀", color:"#64748b", desc:"청약 의사 없음 + 분양 일정 알고 있었음" },
    ]},
  { tier:"2차", tierLabel:"즉시 전환", tierColor:"#6366f1", tierBg:"rgba(99,102,241,0.08)", tierBorder:"rgba(99,102,241,0.25)",
    groups:[
      { id:3, name:"그룹3 VIP 즉시 전환 1", short:"VIP 전환1", icon:"👑", color:"#f59e0b", desc:"청약 의사 있음 + 1순위 자격" },
      { id:4, name:"그룹4 VIP 즉시 전환 2", short:"VIP 전환2", icon:"💎", color:"#a855f7", desc:"청약 의사 있음 + 특별공급 자격" },
      { id:5, name:"그룹5 청약 가능성 1",   short:"청약가능1", icon:"⭐", color:"#10b981", desc:"청약 의사 있음 + 2순위 자격" },
      { id:6, name:"그룹6 청약 가능성 2",   short:"청약가능2", icon:"🌟", color:"#06b6d4", desc:"청약 의사 있음 + 무순위 자격" },
    ]},
  { tier:"3차", tierLabel:"조건부 유입", tierColor:"#f59e0b", tierBg:"rgba(245,158,11,0.08)", tierBorder:"rgba(245,158,11,0.25)",
    groups:[
      { id:7,  name:"그룹7 MZ 주거",       short:"MZ 주거",  icon:"🏠", color:"#ec4899", desc:"조건부 의사 + 실거주/혼합 + 20~40대" },
      { id:8,  name:"그룹8 시니어 주거",    short:"시니어",   icon:"🏡", color:"#f97316", desc:"조건부 의사 + 실거주/혼합 + 50~60대" },
      { id:9,  name:"그룹9 자산 증식",      short:"자산증식", icon:"📈", color:"#84cc16", desc:"조건부 의사 + 투자/증여 목적" },
      { id:10, name:"그룹10 잠재 수요",     short:"잠재수요", icon:"🎯", color:"#14b8a6", desc:"조건부 의사 + 구매 목적 기타(미정)" },
    ]},
];

const ALL_GROUPS = SEGMENTS.flatMap(s => s.groups.map(g => ({ ...g, tier:s.tier, tierLabel:s.tierLabel, tierColor:s.tierColor })));

// ── 실제 CSV 컬럼 기반 자동 세그먼트 분류
function classifyGroup(row) {
  const 의사 = (row['청약의사'] || '').trim();
  const 자격 = (row['청약자격'] || '').trim();
  const 목적 = (row['구매목적'] || '').trim();
  const 나이 = (row['나이'] || '').trim();
  const 분양일정 = (row['분양 일정'] || '').trim();

  if (의사 === '없다') {
    return (분양일정.includes('모른') || 분양일정.includes('몰랐')) ? 1 : 2;
  } else if (의사 === '있다') {
    if (자격.includes('1순위')) return 3;
    if (자격.includes('특별공급')) return 4;
    if (자격.includes('2순위')) return 5;
    return 6;
  } else { // 조건부
    if (목적 === '투자' || 목적 === '증여') return 9;
    if (목적 === '기타') return 10;
    return ['20대','30대','40대'].includes(나이) ? 7 : 8;
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').replace(/^\uFEFF/,''));
  return lines.slice(1).map((line, idx) => {
    // 따옴표 안 쉼표 처리
    const values = [];
    let cur = '', inQ = false;
    for (let c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h,i) => { obj[h] = values[i] || ''; });
    const groupId = classifyGroup(obj);
    return {
      id: idx+1,
      name:    obj['이름']||obj['name']||obj['고객명']||`고객${idx+1}`,
      age:     obj['나이']||obj['age']||'-',
      gender:  obj['성별']||obj['gender']||'-',
      region:  obj['나의거주지역']||obj['지역']||obj['region']||'-',
      phone:   (obj['연락처']||obj['phone']||obj['전화번호']||'').replace(/-/g,''),
      memo:    obj['비고']||obj['메모']||obj['memo']||'',
      groupId,
      자격: obj['청약자격']||'',
      목적: obj['구매목적']||'',
      의사: obj['청약의사']||'',
      _raw: obj,
    };
  }).filter(c => c.name);
}

const DEFAULT_PROMPTS = Object.fromEntries(ALL_GROUPS.map(g => [g.id, {
  tone:   g.id<=2 ? '부드럽고 부담 없는' : g.id<=6 ? '적극적이고 설득력 있는' : '공감하며 맞춤 제안하는',
  style:  g.id<=2 ? '정보 제공형' : g.id<=6 ? '행동 유도형' : '조건 맞춤형',
  extra:'', banned:'', length:'120',
}]));

const DEFAULT_APT = {
  name:'래미안 원베일리 2차', location:'서울 서초구 반포동',
  price:'12억~18억', date:'2026년 4월 15일',
  features:'한강뷰, 초품아, 지하철 3분', supply:'일반공급 320세대', contact:'02-1234-5678',
};

const SAMPLE = [
  { id:1, name:'김민준', age:'30대', gender:'남자', region:'서울 강남구', groupId:3, phone:'01012345678', memo:'', 자격:'1순위', 목적:'실거주', 의사:'있다' },
  { id:2, name:'이서연', age:'40대', gender:'여자', region:'경기 수원시', groupId:8, phone:'01023456789', memo:'', 자격:'1순위', 목적:'실거주', 의사:'조건부' },
  { id:3, name:'박도현', age:'20대', gender:'남자', region:'서울 마포구', groupId:7, phone:'01034567890', memo:'', 자격:'특별공급(신혼부부)', 목적:'실거주', 의사:'조건부' },
  { id:4, name:'최수아', age:'50대', gender:'여자', region:'부산 해운대', groupId:8, phone:'01045678901', memo:'', 자격:'1순위', 목적:'실거주', 의사:'조건부' },
  { id:5, name:'정우진', age:'40대', gender:'남자', region:'서울 송파구', groupId:9, phone:'01056789012', memo:'', 자격:'1순위', 목적:'증여', 의사:'조건부' },
];

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:500 }}>{label}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
    </div>
  );
}

export default function App() {
  const [tab, setTab]           = useState('overview');
  const [apt, setApt]           = useState(DEFAULT_APT);
  const [aptSaved, setAptSaved] = useState(true);
  const [prompts, setPrompts]   = useState(DEFAULT_PROMPTS);
  const [promptSaved, setPromptSaved] = useState(true);
  const [editGroup, setEditGroup] = useState(3);
  const [customers, setCustomers] = useState(SAMPLE);
  const [dataSource, setDataSource] = useState('sample'); // sample | csv | sheet
  const [csvError, setCsvError] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [selected, setSelected] = useState(null);
  const [aiMsg, setAiMsg]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sent, setSent]         = useState([]);
  const [filterGroup, setFilterGroup] = useState(null);
  const fileRef = useRef();

  const getGroup = id => ALL_GROUPS.find(g => g.id === id) || ALL_GROUPS[0];

  // 세그먼트별 실제 카운트
  const groupCounts = Object.fromEntries(ALL_GROUPS.map(g => [g.id, customers.filter(c => c.groupId === g.id).length]));
  const totalCount  = customers.length;

  const handleCSV = file => {
    if (!file) return;
    setCsvError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) { setCsvError('데이터를 읽을 수 없어요.'); return; }
        setCustomers(parsed); setDataSource('csv');
      } catch(err) { setCsvError('파일 오류: ' + err.message); }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const loadSheet = async () => {
    if (!sheetUrl) { setSheetError('URL을 입력해주세요.'); return; }
    setSheetLoading(true); setSheetError('');
    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) { setSheetError('올바른 구글 시트 URL이 아닙니다.'); setSheetLoading(false); return; }
      if (!GSHEET_API_KEY) { setSheetError('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.'); setSheetLoading(false); return; }
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z5000?key=${GSHEET_API_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.values || data.values.length < 2) { setSheetError('시트에 데이터가 없습니다.'); setSheetLoading(false); return; }
      const headers = data.values[0].map(h => h.trim());
      const rows = data.values.slice(1).map((row, idx) => {
        const obj = {};
        headers.forEach((h,i) => { obj[h] = row[i]||''; });
        const groupId = classifyGroup(obj);
        return { id:idx+1, name:obj['이름']||obj['name']||`고객${idx+1}`, age:obj['나이']||'-',
          gender:obj['성별']||'-', region:obj['나의거주지역']||obj['지역']||'-',
          phone:(obj['연락처']||obj['phone']||'').replace(/-/g,''),
          memo:obj['비고']||obj['메모']||'', groupId,
          자격:obj['청약자격']||'', 목적:obj['구매목적']||'', 의사:obj['청약의사']||'' };
      }).filter(c => c.name);
      setCustomers(rows); setDataSource('sheet');
    } catch(e) { setSheetError('연동 실패: ' + e.message); }
    setSheetLoading(false);
  };

  const generate = useCallback(async customer => {
    setSelected(customer); setAiMsg(''); setLoading(true); setSendResult(null);
    const g = getGroup(customer.groupId);
    const p = prompts[g.id] || DEFAULT_PROMPTS[g.id];
    const prompt = `당신은 부동산 청약 분양 전문 CRM 마케터입니다.

[현재 분양 아파트]
아파트명: ${apt.name} / 위치: ${apt.location} / 분양가: ${apt.price}
청약일: ${apt.date} / 특징: ${apt.features} / 공급: ${apt.supply}

[고객 정보]
이름: ${customer.name} / 나이: ${customer.age} / 성별: ${customer.gender}
지역: ${customer.region}
세그먼트: ${g.tier}차 ${g.tierLabel} - ${g.name}
청약의사: ${customer.의사} / 청약자격: ${customer.자격} / 구매목적: ${customer.목적}
메모: ${customer.memo||'없음'}

[이 세그먼트 전용 설정]
말투/톤: ${p.tone} / 스타일: ${p.style} / 길이: ${p.length}자 내외
추가지시: ${p.extra||'없음'} / 금지표현: ${p.banned||'없음'}

위 설정을 반영해서 카카오 알림톡 메시지를 작성해주세요.
이름 포함, 이모지 1~2개, 아파트명·청약일 자연스럽게 포함. 메시지만 출력하세요.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key':ANTHROPIC_API_KEY,
          'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
          messages:[{ role:'user', content:prompt }] }),
      });
      const data = await res.json();
      setAiMsg(data.content?.map(i=>i.text||'').join('')||'생성 실패');
    } catch(e) { setAiMsg('API 오류: '+e.message); }
    setLoading(false);
  }, [apt, prompts]);

  const sendKakao = async () => {
    if (!aiMsg || !selected) return;
    setSending(true); setSendResult(null);
    const phone = selected.phone?.replace(/-/g,'');
    if (!phone || phone.length < 10) { setSendResult({ok:false,msg:'연락처가 없거나 형식이 올바르지 않아요.'}); setSending(false); return; }
    try {
      if (SOLAPI_API_KEY) {
        const res = await fetch('https://api.solapi.com/messages/v4/send', {
          method:'POST',
          headers:{ 'Content-Type':'application/json',
            'Authorization':`HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${new Date().toISOString()}, salt=salt123, signature=sig` },
          body: JSON.stringify({ message:{ to:phone, from:SOLAPI_SENDER, text:aiMsg } }),
        });
        const data = await res.json();
        if (data.errorCode) throw new Error(data.errorMessage);
        setSendResult({ok:true,msg:'💬 카카오 알림톡 발송 완료!'});
      } else {
        setSendResult({ok:true,msg:`[시뮬레이션] ${selected.name}님께 발송 완료 ✅`});
      }
      const g = getGroup(selected.groupId);
      setSent(prev => [{ customer:selected, message:aiMsg, group:g, apt:apt.name, time:new Date().toLocaleTimeString(), simulated:!SOLAPI_API_KEY }, ...prev.slice(0,29)]);
      setAiMsg(''); setSelected(null);
    } catch(e) { setSendResult({ok:false,msg:'발송 오류: '+e.message}); }
    setSending(false);
  };

  const updatePrompt = (f,v) => { setPrompts(p=>({...p,[editGroup]:{...p[editGroup],[f]:v}})); setPromptSaved(false); };
  const cp = prompts[editGroup]||DEFAULT_PROMPTS[editGroup];
  const filtered = filterGroup ? customers.filter(c=>c.groupId===filterGroup) : customers;

  const TABS = [
    {key:'overview',label:'📊 세그먼트'},
    {key:'apt',     label:'🏢 아파트'},
    {key:'prompts', label:'✏️ 프롬프트'},
    {key:'data',    label:'📂 고객데이터'},
    {key:'send',    label:'💬 메시지 발송'},
    {key:'sent',    label:'📋 발송내역'},
  ];

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif", background:'#0b0f1e', minHeight:'100vh', color:'#e2e8f0', fontSize:14 }}>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}} *{box-sizing:border-box} textarea,input{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}`}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b 60%,#0f172a)', borderBottom:'1px solid rgba(99,102,241,0.25)', padding:'0 24px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:58 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>청약 CRM AI 메시지 센터</div>
              <div style={{ fontSize:10, color:'#a5b4fc' }}>Claude AI · 10 세그먼트 · 자동 분류</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:3 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{ padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                  background: tab===t.key?'rgba(99,102,241,0.35)':'transparent',
                  color: tab===t.key?'#a5b4fc':'#94a3b8' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981' }}/>
            <span style={{ fontSize:11, color:'#10b981' }}>{totalCount.toLocaleString()}명
              <span style={{ color:'#475569', marginLeft:6 }}>{dataSource==='csv'?'CSV':'sheet'==='sheet'?'구글시트':'샘플'}</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding:'22px 24px', maxWidth:1300, margin:'0 auto' }}>

        {/* ══ 세그먼트 현황 ══ */}
        {tab==='overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              {SEGMENTS.map(seg => (
                <div key={seg.tier} style={{ background:seg.tierBg, border:`1px solid ${seg.tierBorder}`, borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:10, color:seg.tierColor, fontWeight:700, letterSpacing:1 }}>{seg.tier}차 분류</div>
                      <div style={{ fontSize:16, fontWeight:700 }}>{seg.tierLabel}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:seg.tierColor }}>
                      {seg.groups.reduce((s,g)=>s+(groupCounts[g.id]||0),0).toLocaleString()}명
                    </div>
                  </div>
                  {seg.groups.map(g => (
                    <div key={g.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      background:'rgba(255,255,255,0.04)', borderRadius:7, padding:'6px 10px', marginBottom:5 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span>{g.icon}</span>
                        <span style={{ fontSize:11, color:'#cbd5e1' }}>{g.name}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:g.color }}>{(groupCounts[g.id]||0).toLocaleString()}명</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 비율 바 */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 22px', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:10, fontWeight:500 }}>전체 세그먼트 비율 · {totalCount.toLocaleString()}명</div>
              <div style={{ display:'flex', height:18, borderRadius:9, overflow:'hidden', gap:2 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} style={{ width:`${((groupCounts[g.id]||0)/totalCount*100).toFixed(1)}%`, background:g.color, minWidth:groupCounts[g.id]?2:0 }}
                    title={`${g.name}: ${groupCounts[g.id]||0}명`} />
                ))}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 12px', marginTop:10 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:7, height:7, borderRadius:2, background:g.color }}/>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>{g.short} {totalCount?((groupCounts[g.id]||0)/totalCount*100).toFixed(1):0}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 22px' }}>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginBottom:12 }}>세그먼트 정의</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:7 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} style={{ display:'flex', gap:9, background:'rgba(255,255,255,0.03)', borderRadius:9, padding:'9px 12px', border:`1px solid ${g.color}18` }}>
                    <span style={{ fontSize:17 }}>{g.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:g.color, marginBottom:2 }}>{g.name}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>{g.desc}</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#475569', flexShrink:0 }}>{(groupCounts[g.id]||0).toLocaleString()}명</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 아파트 설정 ══ */}
        {tab==='apt' && (
          <div style={{ maxWidth:620 }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 22px', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>🏢 현재 분양 아파트 정보</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>여기 입력한 정보가 모든 AI 메시지에 자동 반영됩니다</div>
                </div>
                <div style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:aptSaved?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)', color:aptSaved?'#10b981':'#f59e0b' }}>{aptSaved?'✅ 저장됨':'● 미저장'}</div>
              </div>
              {[['아파트명 *','name','예: 래미안 원베일리 2차'],['위치 *','location','예: 서울 서초구 반포동'],
                ['청약일 *','date','예: 2026년 4월 15일'],['분양가','price','예: 12억~18억'],
                ['주요 특징','features','예: 한강뷰, 초품아'],['공급 세대','supply','예: 일반공급 320세대'],
                ['문의 연락처','contact','예: 02-1234-5678']].map(([label,key,ph]) => (
                <Field key={key} label={label} value={apt[key]} placeholder={ph} onChange={v=>{ setApt(p=>({...p,[key]:v})); setAptSaved(false); }} />
              ))}
              <button onClick={()=>setAptSaved(true)}
                style={{ width:'100%', marginTop:6, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'white', padding:'11px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                💾 저장하고 메시지에 반영하기
              </button>
            </div>
          </div>
        )}

        {/* ══ 프롬프트 ══ */}
        {tab==='prompts' && (
          <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:18 }}>
            <div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:500 }}>세그먼트 선택</div>
              {SEGMENTS.map(seg => (
                <div key={seg.tier}>
                  <div style={{ fontSize:10, color:seg.tierColor, fontWeight:700, letterSpacing:1, padding:'5px 8px 3px' }}>{seg.tier}차 · {seg.tierLabel}</div>
                  {seg.groups.map(g => (
                    <button key={g.id} onClick={()=>setEditGroup(g.id)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:7, padding:'8px 11px', borderRadius:9, border:'none', cursor:'pointer', textAlign:'left', marginBottom:3,
                        background:editGroup===g.id?`${g.color}20`:'rgba(255,255,255,0.03)',
                        borderLeft:editGroup===g.id?`3px solid ${g.color}`:'3px solid transparent' }}>
                      <span style={{ fontSize:15 }}>{g.icon}</span>
                      <div>
                        <span style={{ fontSize:11, color:editGroup===g.id?g.color:'#94a3b8', fontWeight:editGroup===g.id?600:400 }}>{g.short}</span>
                        <span style={{ fontSize:10, color:'#475569', marginLeft:6 }}>{(groupCounts[g.id]||0)}명</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {(() => {
              const g = getGroup(editGroup);
              return (
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ fontSize:22 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:g.color }}>{g.name}</div>
                        <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{g.desc} · {groupCounts[g.id]||0}명</div>
                      </div>
                    </div>
                    <div style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:promptSaved?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)', color:promptSaved?'#10b981':'#f59e0b' }}>{promptSaved?'✅ 저장됨':'● 미저장'}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontWeight:500 }}>말투 / 톤</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {['부드럽고 부담 없는','친근하고 따뜻한','격식 있고 신뢰감 있는','적극적이고 설득력 있는','공감하며 맞춤 제안하는','간결하고 임팩트 있는'].map(t=>(
                          <button key={t} onClick={()=>updatePrompt('tone',t)} style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, background:cp.tone===t?`${g.color}30`:'rgba(255,255,255,0.06)', color:cp.tone===t?g.color:'#64748b' }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:6, fontWeight:500 }}>메시지 스타일</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {['정보 제공형','행동 유도형','조건 맞춤형','혜택 강조형','긴박감 강조형','감성 공략형'].map(s=>(
                          <button key={s} onClick={()=>updatePrompt('style',s)} style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, background:cp.style===s?`${g.color}30`:'rgba(255,255,255,0.06)', color:cp.style===s?g.color:'#64748b' }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:500 }}>목표 글자 수</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {['80','100','120','150'].map(n=>(
                        <button key={n} onClick={()=>updatePrompt('length',n)} style={{ padding:'4px 14px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, background:cp.length===n?`${g.color}30`:'rgba(255,255,255,0.06)', color:cp.length===n?g.color:'#64748b' }}>{n}자</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:500 }}>추가 지시사항</div>
                    <textarea value={cp.extra} onChange={e=>updatePrompt('extra',e.target.value)} placeholder="예: 청약일 반드시 강조, 잔여세대 언급"
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:12, outline:'none', resize:'vertical', minHeight:60 }} />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:5, fontWeight:500 }}>금지 표현</div>
                    <input value={cp.banned} onChange={e=>updatePrompt('banned',e.target.value)} placeholder="예: 저렴한, 싼, 마지막 기회"
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:12, outline:'none' }} />
                  </div>
                  <button onClick={()=>setPromptSaved(true)}
                    style={{ width:'100%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'white', padding:'10px', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    💾 저장
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ 고객 데이터 ══ */}
        {tab==='data' && (
          <div style={{ maxWidth:760 }}>
            {/* 현재 상태 */}
            <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, padding:'12px 18px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13 }}>
                <span style={{ color:'#a5b4fc', fontWeight:600 }}>현재 {totalCount.toLocaleString()}명 로드됨</span>
                <span style={{ color:'#64748b', marginLeft:10, fontSize:12 }}>{dataSource==='csv'?'📄 CSV 파일':dataSource==='sheet'?'🟢 구글 시트':'📋 샘플 데이터'}</span>
              </div>
              {dataSource!=='sample' && <button onClick={()=>{ setCustomers(SAMPLE); setDataSource('sample'); }} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', padding:'4px 12px', borderRadius:7, cursor:'pointer', fontSize:11 }}>샘플로 초기화</button>}
            </div>

            {/* 구글 시트 */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 22px', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>🟢 구글 시트 연동</div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>시트 수정 후 새로고침 버튼 클릭하면 실시간 반영</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."
                  style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:12, outline:'none' }} />
                <button onClick={loadSheet} disabled={sheetLoading}
                  style={{ background:'linear-gradient(135deg,#10b981,#059669)', border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                  {sheetLoading?'로딩 중...':'🔄 불러오기'}
                </button>
              </div>
              {sheetError && <div style={{ color:'#f87171', fontSize:12, padding:'8px 12px', background:'rgba(248,113,113,0.1)', borderRadius:8, marginBottom:8 }}>⚠️ {sheetError}</div>}
              <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:9, padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:'#10b981', fontWeight:600, marginBottom:4 }}>설정 방법</div>
                <div style={{ fontSize:11, color:'#64748b', lineHeight:1.8 }}>
                  1. 구글 시트 → 공유 → <b style={{color:'#94a3b8'}}>링크 있는 모든 사용자 보기</b><br/>
                  2. Vercel 환경변수에 <b style={{color:'#94a3b8'}}>VITE_GSHEET_API_KEY</b> 추가<br/>
                  3. 컬럼명: 참여일시, 수집그룹, 나이, 성별, 나의거주지역, 청약자격, 구매목적, 청약의사, 분양 일정
                </div>
              </div>
            </div>

            {/* CSV 업로드 */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 22px' }}
              onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f?.name.endsWith('.csv')) handleCSV(f); }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>📄 CSV 파일 업로드</div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>실제 고객 CSV를 올리면 자동으로 10개 세그먼트로 분류해요</div>
              <div style={{ border:'2px dashed rgba(99,102,241,0.3)', borderRadius:12, padding:'28px 20px', textAlign:'center', background:dataSource==='csv'?'rgba(16,185,129,0.04)':'rgba(99,102,241,0.03)' }}>
                {dataSource==='csv' ? (
                  <div>
                    <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
                    <div style={{ color:'#10b981', fontWeight:600, marginBottom:4 }}>{totalCount.toLocaleString()}명 로드 완료!</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>세그먼트별 자동 분류 완료</div>
                    <button onClick={()=>fileRef.current.click()} style={{ marginTop:10, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'5px 14px', borderRadius:7, cursor:'pointer', fontSize:11 }}>다른 파일 올리기</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:30, marginBottom:8 }}>📂</div>
                    <div style={{ marginBottom:10, fontSize:13 }}>CSV 파일을 드래그하거나</div>
                    <button onClick={()=>fileRef.current.click()} style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)', color:'#a5b4fc', padding:'7px 20px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>📁 파일 선택</button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>handleCSV(e.target.files[0])} />
              </div>
              {csvError && <div style={{ color:'#f87171', fontSize:12, marginTop:8 }}>⚠️ {csvError}</div>}
              <div style={{ marginTop:14, background:'rgba(99,102,241,0.05)', borderRadius:9, padding:'10px 14px' }}>
                <div style={{ fontSize:11, color:'#a5b4fc', fontWeight:600, marginBottom:4 }}>✅ 자동 분류 기준 (기존 CSV 그대로 사용 가능!)</div>
                <div style={{ fontSize:11, color:'#64748b', lineHeight:1.8 }}>
                  청약의사 없다 → 그룹1·2 / 청약의사 있다 → 그룹3·4·5·6 (자격 기준)<br/>
                  조건부 + 투자/증여 → 그룹9 / 조건부 + 기타 → 그룹10<br/>
                  조건부 + 실거주 + 20~40대 → 그룹7 / 50~60대 → 그룹8
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 메시지 발송 ══ */}
        {tab==='send' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:20 }}>
            <div>
              <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:9, padding:'8px 14px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12 }}>
                  <span style={{ color:'#a5b4fc', fontWeight:600 }}>📌 {apt.name}</span>
                  <span style={{ color:'#64748b', marginLeft:10, fontSize:11 }}>{apt.date}</span>
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setTab('prompts')} style={{ background:'none', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'3px 9px', borderRadius:6, cursor:'pointer', fontSize:10 }}>프롬프트</button>
                  <button onClick={()=>setTab('apt')} style={{ background:'none', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'3px 9px', borderRadius:6, cursor:'pointer', fontSize:10 }}>아파트 수정</button>
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                <button onClick={()=>setFilterGroup(null)} style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:10, background:!filterGroup?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)', color:!filterGroup?'#a5b4fc':'#64748b' }}>전체 ({customers.length})</button>
                {ALL_GROUPS.map(g=>{ const cnt=groupCounts[g.id]||0; return cnt>0?(
                  <button key={g.id} onClick={()=>setFilterGroup(g.id===filterGroup?null:g.id)} style={{ padding:'4px 10px', borderRadius:20, border:'none', cursor:'pointer', fontSize:10, background:filterGroup===g.id?`${g.color}25`:'rgba(255,255,255,0.06)', color:filterGroup===g.id?g.color:'#64748b' }}>
                    {g.icon} {g.short} ({cnt})
                  </button>
                ):null;})}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {filtered.slice(0,50).map(c=>{
                  const g=getGroup(c.groupId); const isSel=selected?.id===c.id;
                  return (
                    <div key={c.id} onClick={()=>generate(c)}
                      style={{ background:isSel?'rgba(99,102,241,0.1)':'rgba(255,255,255,0.03)', border:isSel?`1px solid ${g.color}60`:'1px solid rgba(255,255,255,0.07)',
                        borderRadius:10, padding:'11px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:11 }}>
                      <div style={{ width:37, height:37, borderRadius:'50%', background:`${g.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{g.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                          <span style={{ fontWeight:600, fontSize:13 }}>{c.name}</span>
                          <span style={{ fontSize:10, color:g.color, background:`${g.color}15`, padding:'1px 7px', borderRadius:20 }}>{g.tier}차 · {g.short}</span>
                          {c.phone && <span style={{ fontSize:10, color:'#475569' }}>📱 {c.phone}</span>}
                        </div>
                        <div style={{ fontSize:11, color:'#64748b' }}>{c.age} · {c.gender} · {c.region}</div>
                        {(c.자격||c.목적) && <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{c.자격} · {c.목적}</div>}
                      </div>
                      <div style={{ fontSize:11, color:isSel&&loading?'#f59e0b':'#6366f1', fontWeight:500, flexShrink:0 }}>{isSel&&loading?'생성 중...':'AI 메시지 →'}</div>
                    </div>
                  );
                })}
                {filtered.length>50 && <div style={{ textAlign:'center', fontSize:11, color:'#475569', padding:10 }}>... 외 {(filtered.length-50).toLocaleString()}명 더 있음</div>}
              </div>
            </div>

            <div style={{ position:'sticky', top:80, alignSelf:'start' }}>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginBottom:8 }}>AI 추천 메시지 · 카카오 알림톡</div>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, minHeight:400 }}>
                {!selected ? (
                  <div style={{ textAlign:'center', paddingTop:90, color:'#334155' }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>✦</div>
                    <div style={{ fontSize:13 }}>고객을 클릭하면</div>
                    <div style={{ fontSize:13, color:'#a5b4fc', marginTop:4 }}>{apt.name}</div>
                    <div style={{ fontSize:13 }}>맞춤 메시지를 생성합니다</div>
                  </div>
                ) : (() => {
                  const g=getGroup(selected.groupId); const p=prompts[g.id]||DEFAULT_PROMPTS[g.id];
                  return (
                    <div>
                      <div style={{ background:`${g.color}10`, border:`1px solid ${g.color}30`, borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:18 }}>{g.icon}</span>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13 }}>{selected.name}</div>
                            <div style={{ fontSize:10, color:g.color }}>{g.tier}차 · {g.name}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:'#475569' }}>톤: {p.tone} · {p.style} · {p.length}자</div>
                      </div>
                      <div style={{ fontSize:10, color:'#64748b', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', display:'inline-block', background:loading?'#f59e0b':'#10b981', boxShadow:loading?'0 0 5px #f59e0b':'0 0 5px #10b981' }}/>
                        {loading?'Claude가 맞춤 메시지 생성 중...':'생성 완료 · 수정 후 발송'}
                      </div>
                      <div style={{ position:'relative' }}>
                        <textarea value={loading?'':aiMsg} onChange={e=>setAiMsg(e.target.value)} placeholder={loading?'':'메시지가 여기 나타납니다...'}
                          style={{ width:'100%', minHeight:110, background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:13, fontSize:13, lineHeight:1.8, color:'#e2e8f0', resize:'vertical', outline:'none', marginBottom:12 }} />
                        {loading && <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', display:'flex', gap:6 }}>
                          {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1', animation:'pulse 1.2s ease-in-out infinite', animationDelay:`${i*0.2}s` }}/>)}
                        </div>}
                      </div>
                      {sendResult && <div style={{ padding:'8px 12px', borderRadius:8, marginBottom:10, fontSize:12, fontWeight:500, background:sendResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)', color:sendResult.ok?'#10b981':'#f87171' }}>{sendResult.msg}</div>}
                      {aiMsg && (
                        <div style={{ display:'flex', gap:7 }}>
                          <button onClick={()=>generate(selected)} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', padding:'9px', borderRadius:9, cursor:'pointer', fontSize:12 }}>🔄 재생성</button>
                          <button onClick={sendKakao} disabled={sending} style={{ flex:2, background:sending?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', color:'white', padding:'9px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                            {sending?'발송 중...':'💬 카카오 알림톡 발송'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ══ 발송 내역 ══ */}
        {tab==='sent' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>발송 내역 ({sent.length}건)</div>
              {sent.length>0 && <div style={{ fontSize:11, color:'#10b981' }}>✅ 총 {sent.length}명 발송</div>}
            </div>
            {sent.length===0 ? (
              <div style={{ textAlign:'center', paddingTop:100, color:'#334155' }}>
                <div style={{ fontSize:34, marginBottom:10 }}>📭</div>
                <div>아직 발송된 메시지가 없습니다</div>
              </div>
            ) : sent.map((item,i) => (
              <div key={i} style={{ background:item.simulated?'rgba(99,102,241,0.04)':'rgba(16,185,129,0.04)', border:`1px solid ${item.simulated?'rgba(99,102,241,0.15)':'rgba(16,185,129,0.15)'}`, borderRadius:12, padding:'14px 18px', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span>{item.group.icon}</span>
                    <span style={{ fontWeight:600, fontSize:13 }}>{item.customer.name}</span>
                    <span style={{ fontSize:10, color:item.group.color, background:`${item.group.color}15`, padding:'1px 7px', borderRadius:20 }}>{item.group.tier}차 · {item.group.short}</span>
                    <span style={{ fontSize:10, color:'#6366f1', background:'rgba(99,102,241,0.1)', padding:'1px 7px', borderRadius:20 }}>📌 {item.apt}</span>
                    {item.simulated && <span style={{ fontSize:10, color:'#f59e0b', background:'rgba(245,158,11,0.1)', padding:'1px 7px', borderRadius:20 }}>시뮬레이션</span>}
                  </div>
                  <span style={{ fontSize:10, color:'#64748b' }}>{item.time}</span>
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', background:'#0f172a', padding:'10px 13px', borderRadius:8, lineHeight:1.7 }}>{item.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
