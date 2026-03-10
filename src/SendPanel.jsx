import { useState } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function SendPanel({ customers, templates, apt, prompts, isAd, sent, setSent, setTab }) {
  const [sendMode, setSendMode] = useState('individual');
  const [selected, setSelected] = useState(null);
  const [aiMode, setAiMode] = useState('template');
  const [selTemplate, setSelTemplate] = useState(null);
  const [aiMsg, setAiMsg] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [filterGroup, setFilterGroup] = useState(null);
  const [tmplSearch, setTmplSearch] = useState('');
  const [bulkMode, setBulkMode] = useState('template');
  const [bulkTmplSel, setBulkTmplSel] = useState(null);
  const [bulkAiMsg, setBulkAiMsg] = useState('');
  const [bulkEditMsg, setBulkEditMsg] = useState('');
  const [bulkAiLoading, setBulkAiLoading] = useState(false);
  const [bulkTmplSearch, setBulkTmplSearch] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkGroup, setBulkGroup] = useState(null);

  const groupCounts = ALL_GROUPS.reduce((acc,g)=>{acc[g.id]=customers.filter(c=>c.groupId===g.id).length;return acc;},{});
  const filteredCustomers = filterGroup ? customers.filter(c=>c.groupId===filterGroup) : customers;
  const getGroup = id => ALL_GROUPS.find(g=>g.id===id)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류',tier:'?',tierLabel:'?',tierColor:'#64748b'};
  const applyAdPrefix = msg => isAd&&msg&&!msg.startsWith('(광고)')?'(광고) '+msg:msg;

  const makeSolapiAuth = async () => {
    const apiKey=import.meta.env.VITE_SOLAPI_API_KEY||'';
    const apiSecret=import.meta.env.VITE_SOLAPI_API_SECRET||'';
    const date=new Date().toISOString();
    const salt=Math.random().toString(36).substring(2,12);
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',enc.encode(apiSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sig=await crypto.subtle.sign('HMAC',key,enc.encode(date+salt));
    const signature=Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
    return {apiKey,date,salt,signature};
  };

  const sendSMS = async (to, text) => {
    const sender=import.meta.env.VITE_SOLAPI_SENDER||'';
    const {apiKey,date,salt,signature}=await makeSolapiAuth();
    const res=await fetch('https://api.solapi.com/messages/v4/send',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`},
      body:JSON.stringify({message:{to:to.replace(/-/g,''),from:sender,text}}),
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.errorMessage||data.message||'발송 실패');
    return data;
  };

  const generateAI = async customer => {
    if(!customer) return;
    setLoading(true); setAiMsg(''); setEditMsg('');
    const g=getGroup(customer.groupId);

    // 추가 지시사항에서 구조/이름/링크 힌트 자동 파악
    const extra = prompts.extra||'';
    const wantsName   = extra.includes('이름') || extra.includes('name');
    const wantsLink   = extra.includes('링크') || extra.includes('link');
    const wantsStruct = extra.includes('서론') || extra.includes('구조') || extra.includes('본론');
    const link        = prompts.link||'https://상담링크.com';

    const structGuide = wantsStruct
      ? `\n메시지 구조: 서론(인사/관심 유도) → 본론(핵심 정보/혜택) → 결론(행동 유도) 3단 구성으로 작성`
      : '';
    const nameGuide   = wantsName
      ? `\n반드시 메시지 첫 문장에 "${customer.name}님"을 포함시킬 것`
      : `\n고객 이름(${customer.name}님)을 자연스럽게 1회 이상 포함시킬 것`;
    const linkGuide   = wantsLink
      ? `\n메시지 마지막에 상담 링크를 반드시 추가: ${link}`
      : '';

    const prompt = `당신은 청약 분양 전문 마케터입니다. 다음 고객에게 맞춤 문자 메시지를 작성해주세요.

[고객 정보]
- 이름: ${customer.name}
- 나이: ${customer.age} / 성별: ${customer.gender}
- 거주지역: ${customer.region}
- 세그먼트: ${g.name} (${g.desc})
- 청약 의사: ${customer.의사||'미확인'}
- 청약 자격: ${customer.자격||'미확인'}

[아파트 정보]
- 단지명: ${apt.name}
- 청약일: ${apt.date}
- 가격: ${apt.price}
- 위치: ${apt.location}

[작성 가이드]
- 말투: ${prompts.tone}
- 스타일: ${prompts.style}
- 길이: ${prompts.length}
- 추가 지시사항: ${extra||'없음'}
- 금지표현: ${prompts.forbidden||'없음'}${nameGuide}${structGuide}${linkGuide}

메시지만 작성하세요 (설명, 제목, 따옴표 없이 메시지 본문만):`;

    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const msg=data.content?.[0]?.text||'생성 실패';
      setAiMsg(msg); setEditMsg(msg);
    } catch(e){ setAiMsg('오류: '+e.message); }
    setLoading(false);
  };

  const generateBulkAI = async groupId => {
    setBulkAiLoading(true); setBulkAiMsg(''); setBulkEditMsg('');
    const g=groupId?getGroup(groupId):null;
    const extra = prompts.extra||'';
    const wantsLink   = extra.includes('링크') || extra.includes('link');
    const wantsStruct = extra.includes('서론') || extra.includes('구조') || extra.includes('본론');
    const link        = prompts.link||'https://상담링크.com';

    const structGuide = wantsStruct
      ? `\n메시지 구조: 서론(인사/관심 유도) → 본론(핵심 정보/혜택) → 결론(행동 유도) 3단 구성으로 작성`
      : '';
    const linkGuide   = wantsLink
      ? `\n메시지 마지막에 상담 링크를 반드시 추가: ${link}`
      : '';

    const prompt = `당신은 청약 분양 전문 마케터입니다.
${g?`[${g.name}] 세그먼트 고객들에게`:'전체 고객에게'} 보낼 단체 문자 메시지를 작성해주세요.

[아파트 정보]
- 단지명: ${apt.name}
- 청약일: ${apt.date}
- 가격: ${apt.price}
- 위치: ${apt.location}

[작성 가이드]
- 말투: ${prompts.tone}
- 스타일: ${prompts.style}
- 길이: ${prompts.length}
- 추가 지시사항: ${extra||'없음'}
- 금지표현: ${prompts.forbidden||'없음'}${g?`\n- 대상 특성: ${g.desc}`:''}${structGuide}${linkGuide}

메시지만 작성하세요 (설명, 제목, 따옴표 없이 메시지 본문만):`;
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const msg=data.content?.[0]?.text||'생성 실패';
      setBulkAiMsg(msg); setBulkEditMsg(msg);
    } catch(e){ setBulkAiMsg('오류: '+e.message); }
    setBulkAiLoading(false);
  };

  const sendKakao = async () => {
    if(!editMsg||!selected) return;
    setSending(true); setSendResult(null);
    const g=getGroup(selected.groupId);
    const finalMsg=applyAdPrefix(editMsg);
    const phone=selected.phone||'';
    try {
      if(phone&&phone.length>=10){ await sendSMS(phone,finalMsg); setSendResult({ok:true,msg:`✅ SMS 발송 완료 → ${phone}`}); }
      else { setSendResult({ok:true,msg:'✅ 시뮬레이션 완료 (전화번호 없음)'}); }
      setSent(prev=>[{customer:selected,message:finalMsg,group:g,apt:apt.name,time:new Date().toLocaleTimeString(),label:selTemplate?selTemplate.title:'AI 생성',simulated:!(phone&&phone.length>=10)},...prev]);
    } catch(e){ setSendResult({ok:false,msg:'❌ 발송 실패: '+e.message}); }
    setSending(false);
  };

  const sendBulk = async (targetCustomers, label, overrideMsg=null) => {
    setBulkSending(true); setBulkResult(null);
    let okCount=0,noPhone=0,failCount=0;
    for(const c of targetCustomers){
      const g=getGroup(c.groupId);
      const tmpl=templates.find(t=>t.id===(TEMPLATE_MAPPING[g.id]||[])[0]);
      const rawMsg=overrideMsg||(tmpl?tmpl.content:`[${apt.name}] ${c.name}님, ${apt.date} 청약 일정을 안내드립니다.`);
      const finalMsg=applyAdPrefix(rawMsg);
      const phone=c.phone||'';
      try {
        if(phone&&phone.length>=10){ await sendSMS(phone,finalMsg); okCount++; }
        else { noPhone++; }
        setSent(prev=>[{customer:c,message:finalMsg,group:g,apt:apt.name,time:new Date().toLocaleTimeString(),label:tmpl?tmpl.title:'기본템플릿',simulated:!(phone&&phone.length>=10)},...prev]);
      } catch(e){ failCount++; }
    }
    setBulkResult({ok:true,msg:`✅ ${label} ${targetCustomers.length}명 처리 완료 (실발송:${okCount}, 번호없음:${noPhone}, 실패:${failCount})`});
    setBulkSending(false);
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        {[
          {key:'individual',label:'👤 개별 발송',desc:'고객 1명씩 선택'},
          {key:'group',label:'👥 그룹별 발송',desc:'세그먼트 단위 일괄'},
          {key:'all',label:'📢 전체 발송',desc:`전체 ${customers.length}명`},
        ].map(m=>(
          <button key={m.key} onClick={()=>{setSendMode(m.key);setBulkResult(null);}}
            style={{flex:1,padding:'12px 16px',borderRadius:11,border:'none',cursor:'pointer',textAlign:'left',
              background:sendMode===m.key?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)',
              borderTop:sendMode===m.key?'2px solid #6366f1':'2px solid transparent'}}>
            <div style={{fontSize:13,fontWeight:700,color:sendMode===m.key?'#a5b4fc':'#94a3b8',marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:10,color:'#475569'}}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* 전체 발송 */}
      {sendMode==='all'&&(
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'22px 24px',maxWidth:900}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <div style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,padding:'8px 14px',flex:1,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>📌 {apt.name} · {apt.date}</span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setTab('prompts')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>프롬프트</button>
                <button onClick={()=>setTab('apt')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>아파트 수정</button>
              </div>
            </div>
          </div>
          <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:9,padding:'10px 14px',marginBottom:18}}>
            <div style={{fontSize:11,color:'#f59e0b',fontWeight:600,marginBottom:4}}>⚠️ 전체 {customers.length.toLocaleString()}명 발송</div>
            <div style={{fontSize:11,color:'#94a3b8'}}>실제 발송 연동 시 대량 비용 발생 가능. 발송 전 메시지 내용을 꼭 확인해주세요.</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:20}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
              {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id]||0;return cnt>0?(
                <div key={g.id} style={{background:`${g.color}10`,border:`1px solid ${g.color}25`,borderRadius:9,padding:'8px 6px',textAlign:'center'}}>
                  <div style={{fontSize:15}}>{g.icon}</div>
                  <div style={{fontSize:9,color:g.color,fontWeight:600,marginTop:3}}>{g.short}</div>
                  <div style={{fontSize:11,fontWeight:700,color:'#94a3b8'}}>{cnt.toLocaleString()}</div>
                </div>
              ):null;})}
            </div>
            <div style={{position:'sticky',top:60,alignSelf:'start'}}>
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                <button onClick={()=>{setBulkMode('template');setBulkAiMsg('');setBulkEditMsg('');}}
                  style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:bulkMode==='template'?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)',color:bulkMode==='template'?'#a5b4fc':'#64748b'}}>📋 템플릿 선택</button>
                <button onClick={()=>{setBulkMode('ai');generateBulkAI(null);}}
                  style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:bulkMode==='ai'?'rgba(168,85,247,0.25)':'rgba(255,255,255,0.05)',color:bulkMode==='ai'?'#c084fc':'#64748b'}}>✨ AI 자동생성</button>
              </div>
              {bulkMode==='template'&&(
                <div>
                  <input value={bulkTmplSearch} onChange={e=>setBulkTmplSearch(e.target.value)} placeholder="🔍 템플릿 검색..."
                    style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 12px',color:'#e2e8f0',fontSize:12,outline:'none',marginBottom:8}}/>
                  <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto',marginBottom:10}}>
                    {(bulkTmplSearch?templates.filter(t=>t.title.includes(bulkTmplSearch)):templates).map(t=>(
                      <div key={t.id} onClick={()=>{setBulkTmplSel(t);setBulkEditMsg(t.content);}}
                        style={{background:bulkTmplSel?.id===t.id?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)',border:`1px solid ${bulkTmplSel?.id===t.id?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:7,padding:'7px 11px',cursor:'pointer'}}>
                        <span style={{fontSize:11,color:bulkTmplSel?.id===t.id?'#a5b4fc':'#94a3b8'}}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bulkMode==='ai'&&(
                <div style={{marginBottom:10}}>
                  {bulkAiLoading?(
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'14px 0',color:'#a5b4fc',fontSize:12}}>
                      {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#6366f1',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
                      <span>Claude가 메시지 생성 중...</span>
                    </div>
                  ):bulkAiMsg&&<div style={{fontSize:11,color:'#10b981',marginBottom:6}}>✅ 생성 완료</div>}
                </div>
              )}
              {(bulkEditMsg||(bulkMode==='template'&&bulkTmplSel))&&!bulkAiLoading&&(
                <div>
                  {isAd&&<div style={{fontSize:10,color:'#f59e0b',marginBottom:4}}>⚠️ 광고 표기 ON — (광고) 자동 추가</div>}
                  <textarea value={bulkEditMsg} onChange={e=>setBulkEditMsg(e.target.value)}
                    style={{width:'100%',minHeight:110,background:'#111827',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:11,fontSize:12,lineHeight:1.7,color:'#e2e8f0',resize:'vertical',outline:'none',marginBottom:8}}/>
                  {bulkResult&&<div style={{padding:'8px 12px',borderRadius:8,marginBottom:8,fontSize:11,background:bulkResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:bulkResult.ok?'#10b981':'#f87171'}}>{bulkResult.msg}</div>}
                  <button onClick={()=>sendBulk(customers,'전체',bulkEditMsg||null)} disabled={bulkSending}
                    style={{width:'100%',padding:'11px',borderRadius:10,border:'none',cursor:bulkSending?'not-allowed':'pointer',fontSize:13,fontWeight:700,background:bulkSending?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#f59e0b,#d97706)',color:'white'}}>
                    {bulkSending?'발송 중...':'📢 전체 '+customers.length.toLocaleString()+'명 발송'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 그룹별 발송 */}
      {sendMode==='group'&&(
        <div style={{maxWidth:800}}>
          <div style={{fontSize:13,color:'#94a3b8',marginBottom:14}}>발송할 세그먼트를 선택하세요</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:16}}>
            {ALL_GROUPS.map(g=>{
              const cnt=groupCounts[g.id]||0; if(!cnt) return null;
              const isSel=bulkGroup===g.id;
              return(
                <div key={g.id} onClick={()=>setBulkGroup(isSel?null:g.id)}
                  style={{background:isSel?`${g.color}15`:'rgba(255,255,255,0.03)',border:isSel?`1px solid ${g.color}50`:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:22}}>{g.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:isSel?g.color:'#cbd5e1'}}>{g.name}</div>
                    <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{g.desc}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:g.color}}>{cnt.toLocaleString()}명</div>
                </div>
              );
            })}
          </div>
          {bulkGroup&&(()=>{
            const g=getGroup(bulkGroup);
            const targets=customers.filter(c=>c.groupId===bulkGroup);
            const recTmpl=templates.find(t=>t.id===(TEMPLATE_MAPPING[bulkGroup]||[])[0]);
            return(
              <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${g.color}30`,borderRadius:14,padding:'20px 22px'}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:g.color}}>{g.icon} {g.name} 그룹 발송</div>
                <div style={{fontSize:12,color:'#64748b',marginBottom:12}}>{targets.length}명 · 추천: {recTmpl?.title||'기본 메시지'}</div>
                {recTmpl&&<div style={{background:'rgba(255,255,255,0.04)',borderRadius:9,padding:'10px 13px',marginBottom:14,fontSize:11,color:'#94a3b8',lineHeight:1.7,maxHeight:80,overflowY:'auto'}}>{recTmpl.content.slice(0,200)}...</div>}
                {bulkResult&&<div style={{padding:'10px 14px',borderRadius:9,marginBottom:12,background:bulkResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:bulkResult.ok?'#10b981':'#f87171',fontSize:12}}>{bulkResult.msg}</div>}
                <button onClick={()=>sendBulk(targets,g.name)} disabled={bulkSending}
                  style={{width:'100%',padding:'12px',borderRadius:10,border:'none',cursor:bulkSending?'not-allowed':'pointer',fontSize:13,fontWeight:700,
                    background:bulkSending?'rgba(99,102,241,0.3)':`linear-gradient(135deg,${g.color},${g.color}cc)`,color:'white'}}>
                  {bulkSending?'발송 중...':`${g.icon} ${g.name} ${targets.length}명 발송`}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* 개별 발송 */}
      {sendMode==='individual'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 460px',gap:20}}>
          <div>
            <div style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,padding:'8px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>📌 {apt.name} · {apt.date}</span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setTab('prompts')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>프롬프트</button>
                <button onClick={()=>setTab('apt')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>아파트 수정</button>
              </div>
            </div>
            <div style={{display:'flex',gap:5,marginBottom:10,flexWrap:'wrap'}}>
              <button onClick={()=>setFilterGroup(null)} style={{padding:'3px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:10,background:!filterGroup?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',color:!filterGroup?'#a5b4fc':'#64748b'}}>전체</button>
              {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id];if(!cnt)return null;return(
                <button key={g.id} onClick={()=>setFilterGroup(filterGroup===g.id?null:g.id)}
                  style={{padding:'3px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:10,background:filterGroup===g.id?`${g.color}30`:'rgba(255,255,255,0.06)',color:filterGroup===g.id?g.color:'#64748b'}}>
                  {g.icon} {g.short} ({cnt})
                </button>
              );})}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:560,overflowY:'auto'}}>
              {filteredCustomers.map(c=>{
                const g=getGroup(c.groupId);
                return(
                  <div key={c.id} onClick={()=>{setSelected(c);setAiMsg('');setEditMsg('');setSelTemplate(null);setSendResult(null);}}
                    style={{background:selected?.id===c.id?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.03)',border:selected?.id===c.id?'1px solid rgba(99,102,241,0.4)':'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>{g.icon}</span>
                      <div>
                        <span style={{fontWeight:600,fontSize:12}}>{c.name}</span>
                        <span style={{fontSize:10,color:g.color,marginLeft:6}}>{g.short}</span>
                        <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{c.age} · {c.region}</div>
                      </div>
                    </div>
                    <span style={{fontSize:10,color:'#475569'}}>{c.phone?'📱':'—'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{position:'sticky',top:120,alignSelf:'start'}}>
            {selected?(
              <div>
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px',marginBottom:12}}>
                  {(()=>{const g=getGroup(selected.groupId);return(
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{g.icon}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{selected.name}</div>
                        <div style={{fontSize:11,color:g.color}}>{g.name}</div>
                        <div style={{fontSize:10,color:'#64748b'}}>{selected.age} · {selected.region}</div>
                      </div>
                    </div>
                  );})()}
                </div>
                <div style={{display:'flex',gap:6,marginBottom:12}}>
                  <button onClick={()=>setAiMode('template')} style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:aiMode==='template'?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)',color:aiMode==='template'?'#a5b4fc':'#64748b'}}>📋 템플릿 선택</button>
                  <button onClick={()=>{setAiMode('ai');generateAI(selected);}} style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:aiMode==='ai'?'rgba(168,85,247,0.25)':'rgba(255,255,255,0.05)',color:aiMode==='ai'?'#c084fc':'#64748b'}}>✨ AI 자동생성</button>
                </div>
                {aiMode==='template'&&(
                  <div>
                    <input value={tmplSearch} onChange={e=>setTmplSearch(e.target.value)} placeholder="🔍 템플릿 검색..."
                      style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 12px',color:'#e2e8f0',fontSize:12,outline:'none',marginBottom:8}}/>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:6}}>
                      추천: {(TEMPLATE_MAPPING[selected.groupId]||[]).map(id=>templates.find(t=>t.id===id)?.title).filter(Boolean).slice(0,2).join(', ')||'없음'}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto',marginBottom:10}}>
                      {(tmplSearch?templates.filter(t=>t.title.includes(tmplSearch)):templates).map(t=>(
                        <div key={t.id} onClick={()=>{setSelTemplate(t);setEditMsg(t.content);}}
                          style={{background:selTemplate?.id===t.id?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)',border:`1px solid ${selTemplate?.id===t.id?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:7,padding:'7px 11px',cursor:'pointer'}}>
                          <span style={{fontSize:11,color:selTemplate?.id===t.id?'#a5b4fc':'#94a3b8'}}>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiMode==='ai'&&loading&&(
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'16px 0',color:'#a5b4fc',fontSize:12}}>
                    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#6366f1',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
                    <span>Claude가 메시지 생성 중...</span>
                  </div>
                )}
                {editMsg&&(
                  <div>
                    {isAd&&<div style={{fontSize:10,color:'#f59e0b',marginBottom:4}}>⚠️ 광고 표기 ON — (광고) 자동 추가</div>}
                    <textarea value={editMsg} onChange={e=>setEditMsg(e.target.value)}
                      style={{width:'100%',minHeight:140,background:'#111827',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:12,fontSize:12,lineHeight:1.8,color:'#e2e8f0',resize:'vertical',outline:'none',marginBottom:10}}/>
                    {sendResult&&<div style={{padding:'10px 14px',borderRadius:9,marginBottom:10,fontSize:12,background:sendResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:sendResult.ok?'#10b981':'#f87171'}}>{sendResult.msg}</div>}
                    <button onClick={sendKakao} disabled={sending}
                      style={{width:'100%',padding:'12px',borderRadius:10,border:'none',cursor:sending?'not-allowed':'pointer',fontSize:13,fontWeight:700,background:sending?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#6366f1,#a855f7)',color:'white'}}>
                      {sending?'발송 중...':`💬 ${selected.name}님에게 발송`}
                    </button>
                  </div>
                )}
                {!editMsg&&aiMode==='template'&&(
                  <div style={{textAlign:'center',padding:'40px 20px',color:'#334155',fontSize:12}}>
                    ✦<br/>위에서 템플릿을 선택하거나<br/>AI 자동생성을 눌러주세요
                  </div>
                )}
              </div>
            ):(
              <div style={{textAlign:'center',padding:'60px 20px',color:'#334155',fontSize:12}}>
                ✦<br/>왼쪽에서 고객을 클릭하면<br/><span style={{color:'#6366f1',fontWeight:600}}>{apt.name}</span><br/>맞춤 템플릿을 추천해드립니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
