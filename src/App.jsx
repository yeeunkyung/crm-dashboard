import { useState } from "react";
import { TEMPLATES, DEFAULT_APT, DEFAULT_PROMPTS, SAMPLE, ALL_GROUPS } from "./constants";
import Dashboard from "./Dashboard";
import SendPanel from "./SendPanel";
import AgentPanel from "./AgentPanel";
import SentHistory from "./SentHistory";

const TABS = [
  {key:'data',    label:'📂 고객데이터'},
  {key:'overview',label:'📊 세그먼트'},
  {key:'apt',     label:'🏢 아파트'},
  {key:'templates',label:'📝 템플릿 관리'},
  {key:'prompts', label:'🤖 AI 프롬프트'},
  {key:'send',    label:'💬 메시지발송'},
  {key:'agent',   label:'🤖 AI 에이전트'},
  {key:'sent',    label:'📋 발송내역'},
];

export default function App() {
  const [tab, setTab] = useState('data');
  const [apt, setApt] = useState(DEFAULT_APT);
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [customers, setCustomers] = useState(SAMPLE);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [sent, setSent] = useState([]);
  const [isAd, setIsAd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sendMode, setSendMode] = useState('individual');
  const [tmplSource, setTmplSource] = useState('default');
  const [promptSaveStatus, setPromptSaveStatus] = useState('saved');
  const [testPhone, setTestPhone] = useState('');

  const groupCounts = ALL_GROUPS.reduce((acc,g)=>{
    acc[g.id]=customers.filter(c=>c.groupId===g.id).length;
    return acc;
  },{});
  const totalCount = customers.length;

  return (
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",background:'#0b0f1e',minHeight:'100vh',color:'#e2e8f0',fontSize:14}}>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}} *{box-sizing:border-box} textarea,input{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}`}</style>

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
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:11,fontWeight:500,
                  background:tab===t.key?'rgba(99,102,241,0.35)':'transparent',
                  color:tab===t.key?'#a5b4fc':'#94a3b8'}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {(tab==='send'||tab==='agent')&&(
              <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.05)',border:`1px solid ${isAd?'rgba(245,158,11,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:8,padding:'4px 10px',cursor:'pointer'}}
                onClick={()=>setIsAd(v=>!v)}>
                <div style={{width:26,height:14,borderRadius:10,background:isAd?'#f59e0b':'#334155',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:2,left:isAd?13:2,width:10,height:10,borderRadius:'50%',background:'white',transition:'left 0.2s'}}/>
                </div>
                <span style={{fontSize:10,fontWeight:600,color:isAd?'#f59e0b':'#64748b'}}>{isAd?'(광고)ON':'광고표기'}</span>
              </div>
            )}
            <div style={{width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 5px #10b981'}}/>
            <span style={{fontSize:10,color:'#10b981'}}>{totalCount.toLocaleString()}명</span>
          </div>
        </div>
      </div>

      {/* ── SMS 테스트 배너 ── */}
      <div style={{background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.12))',borderBottom:'1px solid rgba(16,185,129,0.2)',padding:'8px 24px',display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:11,color:'#10b981',fontWeight:600,flexShrink:0}}>🧪 SMS 테스트 모드</span>
        <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="본인 번호 입력 (예: 01012345678)"
          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:7,padding:'4px 12px',color:'#e2e8f0',fontSize:11,outline:'none',width:220}}/>
        <button onClick={async()=>{
          if(!testPhone||testPhone.length<10){alert('번호를 먼저 입력해주세요!');return;}
          const testCustomer={...SAMPLE[SAMPLE.length-1],phone:testPhone};
          const apiKey=import.meta.env.VITE_SOLAPI_API_KEY||'';
          const apiSecret=import.meta.env.VITE_SOLAPI_API_SECRET||'';
          const sender=import.meta.env.VITE_SOLAPI_SENDER||'';
          const date=new Date().toISOString();
          const salt=Math.random().toString(36).substring(2,12);
          const enc=new TextEncoder();
          const key=await crypto.subtle.importKey('raw',enc.encode(apiSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
          const sig=await crypto.subtle.sign('HMAC',key,enc.encode(date+salt));
          const signature=Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
          try {
            const res=await fetch('https://api.solapi.com/messages/v4/send',{
              method:'POST',
              headers:{'Content-Type':'application/json','Authorization':`HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`},
              body:JSON.stringify({message:{to:testPhone.replace(/-/g,''),from:sender,text:'[청약 CRM] 테스트 메시지입니다 ✅'}}),
            });
            const data=await res.json();
            if(!res.ok) throw new Error(data.errorMessage||'발송 실패');
            alert('✅ 테스트 SMS 발송 성공!');
          } catch(e){ alert('❌ 실패: '+e.message); }
        }} style={{background:'rgba(16,185,129,0.2)',border:'1px solid rgba(16,185,129,0.4)',color:'#10b981',padding:'4px 14px',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:600}}>
          📱 테스트 발송
        </button>
        <span style={{fontSize:10,color:'#475569'}}>테스트 그룹 템플릿으로 실제 SMS 발송</span>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div style={{padding:'22px 24px',maxWidth:1400,margin:'0 auto'}}>

        {/* 대시보드 및 설정 탭들 */}
        {['data','overview','apt','templates','prompts'].includes(tab)&&(
          <Dashboard
            customers={customers} setCustomers={setCustomers}
            templates={templates} setTemplates={setTemplates}
            apt={apt} setApt={setApt}
            prompts={prompts} setPrompts={setPrompts}
            tab={tab} setTab={setTab}
            setSelected={setSelected} setSendMode={setSendMode}
            groupCounts={groupCounts} totalCount={totalCount}
            promptSaveStatus={promptSaveStatus} setPromptSaveStatus={setPromptSaveStatus}
            tmplSource={tmplSource} setTmplSource={setTmplSource}
          />
        )}

        {/* 메시지 발송 */}
        {tab==='send'&&(
          <SendPanel
            customers={customers} templates={templates}
            apt={apt} prompts={prompts}
            isAd={isAd} sent={sent} setSent={setSent}
            setTab={setTab}
          />
        )}

        {/* AI 에이전트 */}
        {tab==='agent'&&(
          <AgentPanel
            customers={customers} templates={templates}
            apt={apt} prompts={prompts}
            isAd={isAd} setSent={setSent}
          />
        )}

        {/* 발송내역 */}
        {tab==='sent'&&(
          <SentHistory sent={sent} setSent={setSent} />
        )}
      </div>
    </div>
  );
}
