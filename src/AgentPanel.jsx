import { useState } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function AgentPanel({ customers, templates, apt, prompts, isAd, setSent }) {
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentResults, setAgentResults] = useState([]);
  const [agentDone, setAgentDone] = useState(false);
  const [agentTarget, setAgentTarget] = useState('all');
  const [agentLimit, setAgentLimit] = useState(5);

  const getGroup = id => ALL_GROUPS.find(g=>g.id===id)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류',tier:'?',tierLabel:'?',tierColor:'#64748b'};
  const applyAdPrefix = msg => isAd&&msg&&!msg.startsWith('(광고)')?'(광고) '+msg:msg;

  const runAgent = async () => {
    setAgentRunning(true); setAgentDone(false); setAgentLogs([]); setAgentResults([]);
    const targets = agentTarget==='all'
      ? customers.slice(0, agentLimit)
      : customers.filter(c=>String(c.groupId)===agentTarget).slice(0, agentLimit);
    const log = msg => setAgentLogs(prev=>[...prev,{time:new Date().toLocaleTimeString(),msg}]);
    log(`🚀 에이전트 시작 — ${targets.length}명 처리 예정`);
    const results = [];
    for(const c of targets){
      const g = getGroup(c.groupId);
      log(`👤 ${c.name} (${g.short}) 분석 중...`);
      const recIds = TEMPLATE_MAPPING[g.id]||[];
      const tmpl = templates.find(t=>t.id===recIds[0]);
      log(`📋 추천 템플릿: ${tmpl?.title||'기본 메시지'}`);
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`청약 분양 문자 메시지 작성. 고객: ${c.name}(${c.age}/${c.region}), 세그먼트: ${g.name}, 단지: ${apt.name} ${apt.date}. 말투: ${prompts.tone}. 100자 이내로 메시지만:`}]}),
        });
        const data = await res.json();
        const msg = data.content?.[0]?.text||tmpl?.content||'메시지 생성 실패';
        log(`✅ ${c.name} 메시지 생성 완료`);
        results.push({customer:c, group:g, message:msg, template:tmpl?.title||'AI생성'});
      } catch(e){
        log(`❌ ${c.name} 오류: ${e.message}`);
        results.push({customer:c, group:g, message:tmpl?.content||'', template:tmpl?.title||'기본', error:true});
      }
    }
    setAgentResults(results); setAgentDone(true); setAgentRunning(false);
    log(`🎉 완료! ${results.length}명 처리됨`);
  };

  const sendAllAgentResults = () => {
    agentResults.forEach(r=>{
      setSent(prev=>[{
        customer:r.customer, message:applyAdPrefix(r.message), group:r.group,
        apt:apt.name, time:new Date().toLocaleTimeString(),
        label:r.template, simulated:true,
      },...prev]);
    });
  };

  return (
    <div style={{maxWidth:900}}>
      <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))',border:'1px solid rgba(99,102,241,0.3)',borderRadius:14,padding:'18px 22px',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <span style={{fontSize:22}}>🤖</span>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#a5b4fc'}}>AI 에이전트 자동 실행</div>
            <div style={{fontSize:11,color:'#64748b',marginTop:2}}>고객 선택 → 템플릿 매칭 → 메시지 생성을 AI가 자동으로 처리해요</div>
          </div>
        </div>
        <div style={{display:'flex',gap:16,fontSize:11,color:'#64748b',flexWrap:'wrap'}}>
          <span>1️⃣ 세그먼트 자동 확인</span>
          <span>→</span>
          <span>2️⃣ 최적 템플릿 자동 선택</span>
          <span>→</span>
          <span>3️⃣ 개인화 메시지 자동 작성</span>
          <span>→</span>
          <span>4️⃣ 발송내역 저장</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:18}}>
        <div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'18px 20px',marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>⚙️ 실행 설정</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:7,fontWeight:500}}>대상 고객</div>
              <button onClick={()=>setAgentTarget('all')}
                style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'none',cursor:'pointer',marginBottom:5,textAlign:'left',fontSize:12,
                  background:agentTarget==='all'?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',
                  color:agentTarget==='all'?'#a5b4fc':'#94a3b8'}}>
                👥 전체 고객 ({customers.length}명)
              </button>
              {ALL_GROUPS.map(g=>{
                const cnt=customers.filter(c=>c.groupId===g.id).length;
                if(!cnt) return null;
                return(
                  <button key={g.id} onClick={()=>setAgentTarget(String(g.id))}
                    style={{width:'100%',padding:'6px 12px',borderRadius:7,border:'none',cursor:'pointer',marginBottom:4,textAlign:'left',fontSize:11,
                      background:agentTarget===String(g.id)?`${g.color}20`:'rgba(255,255,255,0.03)',
                      color:agentTarget===String(g.id)?g.color:'#64748b',
                      borderLeft:agentTarget===String(g.id)?`3px solid ${g.color}`:'3px solid transparent'}}>
                    {g.icon} {g.short} ({cnt}명)
                  </button>
                );
              })}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:7,fontWeight:500}}>최대 처리 인원</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[3,5,10,20,50].map(n=>(
                  <button key={n} onClick={()=>setAgentLimit(n)}
                    style={{padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,
                      background:agentLimit===n?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',
                      color:agentLimit===n?'#a5b4fc':'#64748b'}}>
                    {n}명
                  </button>
                ))}
              </div>
            </div>
            <div style={{background:'rgba(99,102,241,0.06)',borderRadius:9,padding:'10px 12px',marginBottom:16,fontSize:11}}>
              <div style={{color:'#a5b4fc',fontWeight:600,marginBottom:4}}>📌 현재 아파트</div>
              <div style={{color:'#94a3b8'}}>{apt.name}</div>
              <div style={{color:'#64748b'}}>{apt.date} · {apt.price}</div>
            </div>
            <button onClick={runAgent} disabled={agentRunning}
              style={{width:'100%',padding:'12px',borderRadius:10,border:'none',cursor:agentRunning?'not-allowed':'pointer',
                fontSize:13,fontWeight:700,
                background:agentRunning?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#6366f1,#a855f7)',
                color:'white',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {agentRunning?(
                <>
                  {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'white',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`,display:'inline-block'}}/>)}
                  <span>에이전트 실행 중...</span>
                </>
              ):'🚀 에이전트 시작'}
            </button>
            {agentDone&&agentResults.length>0&&(
              <button onClick={sendAllAgentResults}
                style={{width:'100%',padding:'10px',borderRadius:10,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,marginTop:8,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'white'}}>
                💬 전체 {agentResults.length}명 발송내역에 저장
              </button>
            )}
          </div>
        </div>

        <div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
            <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>
              📡 실행 로그
              {agentRunning&&<span style={{marginLeft:8,fontSize:10,color:'#f59e0b'}}>● 실행 중</span>}
              {agentDone&&<span style={{marginLeft:8,fontSize:10,color:'#10b981'}}>✅ 완료</span>}
            </div>
            <div style={{maxHeight:160,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
              {agentLogs.length===0&&<div style={{color:'#334155',fontSize:11,textAlign:'center',padding:'20px'}}>에이전트를 시작하면 로그가 표시됩니다</div>}
              {agentLogs.map((l,i)=>(
                <div key={i} style={{fontSize:11,color:'#94a3b8'}}>
                  <span style={{color:'#334155',marginRight:8}}>{l.time}</span>{l.msg}
                </div>
              ))}
            </div>
          </div>
          {agentResults.length>0&&(
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px'}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>📋 생성 결과 ({agentResults.length}건)</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
                {agentResults.map((r,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <span>{r.group.icon}</span>
                      <span style={{fontSize:12,fontWeight:600}}>{r.customer.name}</span>
                      <span style={{fontSize:10,color:r.group.color,background:`${r.group.color}15`,padding:'1px 7px',borderRadius:10}}>{r.group.short}</span>
                      <span style={{fontSize:10,color:'#475569',marginLeft:'auto'}}>📋 {r.template}</span>
                    </div>
                    <div style={{fontSize:11,color:'#94a3b8',lineHeight:1.7,background:'#0f172a',borderRadius:7,padding:'8px 10px'}}>{r.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
