import { useState } from "react";
import { TEMPLATES, DEFAULT_APT, DEFAULT_PROMPTS, SAMPLE, ALL_GROUPS } from "./constants";
import Dashboard from "./Dashboard";
import AISendPanel from "./AISendPanel";
import AgentPanel from "./AgentPanel";
import SentHistory from "./SentHistory";

const TABS = [
  {key:'data',      label:'📂 고객데이터'},
  {key:'overview',  label:'📊 세그먼트'},
  {key:'apt',       label:'🏢 아파트'},
  {key:'templates', label:'📝 템플릿 관리'},
  {key:'aisend',    label:'💬 AI 메시지발송'},
  {key:'agent',     label:'🤖 AI 에이전트'},
  {key:'sent',      label:'📋 발송내역'},
];

export default function App() {
  const [tab, setTab] = useState('data');
  const [apt, setApt] = useState(DEFAULT_APT);
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [customers, setCustomers] = useState(SAMPLE);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [sent, setSent] = useState([]);
  const [tmplSource, setTmplSource] = useState('default');
  const [promptSaveStatus, setPromptSaveStatus] = useState('saved');

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
            tab={tab} setTab={setTab}
            groupCounts={groupCounts} totalCount={totalCount}
            tmplSource={tmplSource} setTmplSource={setTmplSource}
            promptSaveStatus={promptSaveStatus} setPromptSaveStatus={setPromptSaveStatus}
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
