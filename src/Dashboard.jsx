import { useState, useRef } from "react";
import { SEGMENTS, ALL_GROUPS, SAMPLE, TEMPLATE_MAPPING, parseCSV, classifyGroup } from "./constants";

const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

function Field({label,value,onChange,placeholder}){
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:'#64748b',marginBottom:5,fontWeight:500}}>{label}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
    </div>
  );
}

export default function Dashboard({ customers, setCustomers, templates, apt, setApt, prompts, setPrompts, tab, setTab, setSelected, setSendMode, groupCounts, totalCount, promptSaveStatus, setPromptSaveStatus, tmplSource, setTmplSource, setTemplates }) {
  const [dataSource, setDataSource] = useState('sample');
  const [csvError, setCsvError] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [filterGroup, setFilterGroup] = useState(null);
  const [tmplSheetUrl, setTmplSheetUrl] = useState('');
  const [tmplSheetLoading, setTmplSheetLoading] = useState(false);
  const [tmplSheetError, setTmplSheetError] = useState('');

  const fileRef = useRef();
  const tmplFileRef = useRef();

  const filteredCustomers = filterGroup ? customers.filter(c=>c.groupId===filterGroup) : customers;

  const handleCSV = file => {
    if(!file) return;
    setCsvError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result);
        if(!parsed.length){setCsvError('데이터를 읽을 수 없어요.');return;}
        setCustomers(parsed); setDataSource('csv');
      } catch(err){ setCsvError('파일 오류: '+err.message); }
    };
    reader.readAsText(file,'UTF-8');
  };

  const loadSheet = async () => {
    if(!sheetUrl) return;
    setSheetLoading(true); setSheetError('');
    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match) throw new Error('잘못된 시트 URL 형식');
      if(!GSHEET_API_KEY) throw new Error('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z1000?key=${GSHEET_API_KEY}`);
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      if(!data.values||data.values.length<2) throw new Error('시트에 데이터가 없습니다.');
      const headers = data.values[0].map(h=>h.trim());
      const rows = data.values.slice(1).map((row,idx)=>{
        const obj={}; headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return {
          id:idx+1, name:obj['이름']||obj['고객명']||`고객${idx+1}`,
          age:obj['나이']||'-', gender:obj['성별']||'-',
          region:obj['나의거주지역']||obj['지역']||'-',
          phone:(obj['연락처']||'').replace(/-/g,''),
          groupId:classifyGroup(obj), memo:obj['비고']||'',
          자격:obj['청약자격']||'', 목적:obj['구매목적']||'', 의사:obj['청약의사']||'',
        };
      }).filter(c=>c.name);
      setCustomers(rows); setDataSource('sheet');
    } catch(e){ setSheetError('연동 실패: '+e.message); }
    setSheetLoading(false);
  };

  const handleTmplCSV = file => {
    if(!file) return; setTmplSheetError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result);
        if(!parsed.length){setTmplSheetError('데이터를 읽을 수 없어요.');return;}
        const rows = parsed.map((row,idx)=>({
          id:idx,
          title:row['템플릿 제목']||row['title']||`템플릿${idx+1}`,
          content:row['친구톡 내용']||row['대체문자 내용']||row['content']||'',
        })).filter(t=>t.title&&t.content);
        setTemplates(rows); setTmplSource('csv');
      } catch(err){ setTmplSheetError('파일 오류: '+err.message); }
    };
    reader.readAsText(file,'UTF-8');
  };

  const loadTmplSheet = async () => {
    if(!tmplSheetUrl) return;
    setTmplSheetLoading(true); setTmplSheetError('');
    try {
      const match = tmplSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match) throw new Error('잘못된 시트 URL 형식');
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z200?key=${GSHEET_API_KEY}`);
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      const headers = data.values[0].map(h=>h.trim());
      const rows = data.values.slice(1).map((row,idx)=>{
        const obj={}; headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return {id:idx, title:obj['템플릿 제목']||`템플릿${idx+1}`, content:obj['친구톡 내용']||obj['대체문자 내용']||''};
      }).filter(t=>t.title&&t.content);
      setTemplates(rows); setTmplSource('sheet');
    } catch(e){ setTmplSheetError('연동 실패: '+e.message); }
    setTmplSheetLoading(false);
  };

  if(tab==='data') return (
    <div style={{maxWidth:760}}>
      <div style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:12,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:13}}>
          <span style={{color:'#a5b4fc',fontWeight:600}}>현재 {totalCount.toLocaleString()}명 로드됨</span>
          <span style={{color:'#64748b',marginLeft:10,fontSize:12}}>{dataSource==='csv'?'📄 CSV 파일':dataSource==='sheet'?'🟢 구글 시트':'📋 샘플 데이터'}</span>
        </div>
        <button onClick={()=>{setCustomers(SAMPLE);setDataSource('sample');}} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>샘플로 초기화</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:'#94a3b8'}}>📄 CSV 파일 업로드</div>
          <button onClick={()=>fileRef.current.click()} style={{width:'100%',padding:'10px',borderRadius:9,border:'2px dashed rgba(99,102,241,0.3)',background:'transparent',color:'#6366f1',cursor:'pointer',fontSize:12}}>📁 파일 선택</button>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>handleCSV(e.target.files[0])}/>
          {csvError&&<div style={{fontSize:11,color:'#f87171',marginTop:6}}>{csvError}</div>}
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:'#94a3b8'}}>🟢 구글 시트 연동</div>
          <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="구글 시트 URL 붙여넣기"
            style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none',marginBottom:8}}/>
          <button onClick={loadSheet} disabled={sheetLoading} style={{width:'100%',padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,background:'rgba(16,185,129,0.2)',color:'#10b981'}}>
            {sheetLoading?'로딩 중...':'🔗 연동하기'}
          </button>
          {sheetError&&<div style={{fontSize:11,color:'#f87171',marginTop:6}}>{sheetError}</div>}
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <button onClick={()=>setFilterGroup(null)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:!filterGroup?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',color:!filterGroup?'#a5b4fc':'#64748b'}}>전체 ({totalCount})</button>
        {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id];if(!cnt)return null;return(
          <button key={g.id} onClick={()=>setFilterGroup(filterGroup===g.id?null:g.id)}
            style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:filterGroup===g.id?`${g.color}30`:'rgba(255,255,255,0.06)',color:filterGroup===g.id?g.color:'#64748b'}}>
            {g.icon} {g.short} ({cnt})
          </button>
        );})}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filteredCustomers.slice(0,50).map(c=>{
          const g=ALL_GROUPS.find(x=>x.id===c.groupId)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류'};
          return(
            <div key={c.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'11px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
              onClick={()=>{setSelected(c);setTab('send');setSendMode('individual');}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>{g.icon}</div>
                <div>
                  <span style={{fontWeight:600,fontSize:13}}>{c.name}</span>
                  <span style={{fontSize:11,color:g.color,marginLeft:8,background:`${g.color}15`,padding:'1px 7px',borderRadius:10}}>{g.short}</span>
                  <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{c.age} · {c.gender} · {c.region}</div>
                </div>
              </div>
              <span style={{fontSize:11,color:'#6366f1'}}>선택 →</span>
            </div>
          );
        })}
        {filteredCustomers.length>50&&<div style={{textAlign:'center',color:'#475569',fontSize:12,padding:'8px'}}>+{filteredCustomers.length-50}명 더 있음</div>}
      </div>
    </div>
  );

  if(tab==='overview') return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,marginBottom:24}}>
        {SEGMENTS.map(s=>(
          <div key={s.tier} style={{background:s.tierBg,border:`1px solid ${s.tierBorder}`,borderRadius:14,padding:'14px 16px'}}>
            <div style={{fontSize:11,color:s.tierColor,fontWeight:700,marginBottom:10}}>{s.tier}차 · {s.tierLabel}</div>
            {s.groups.map(g=>{
              const cnt=groupCounts[g.id]||0;
              return(
                <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span>{g.icon}</span>
                    <span style={{fontSize:11,color:'#94a3b8'}}>{g.short}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:g.color}}>{cnt.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
        {ALL_GROUPS.map(g=>{
          const cnt=groupCounts[g.id]||0; if(!cnt) return null;
          return(
            <div key={g.id} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${g.color}25`,borderRadius:12,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:20}}>{g.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:g.color}}>{g.name}</div>
                  <div style={{fontSize:10,color:'#64748b'}}>{g.desc}</div>
                </div>
                <div style={{marginLeft:'auto',fontSize:18,fontWeight:700,color:g.color}}>{cnt.toLocaleString()}</div>
              </div>
              <div style={{fontSize:10,color:'#475569'}}>추천 템플릿: {(TEMPLATE_MAPPING[g.id]||[]).map(id=>templates.find(t=>t.id===id)?.title).filter(Boolean).slice(0,2).join(', ')||'없음'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if(tab==='apt') return (
    <div style={{maxWidth:500}}>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'22px 24px'}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>🏢 현재 분양 아파트 설정</div>
        <Field label="단지명" value={apt.name} onChange={v=>setApt(p=>({...p,name:v}))} placeholder="래미안 원베일리 2차"/>
        <Field label="청약일" value={apt.date} onChange={v=>setApt(p=>({...p,date:v}))} placeholder="2026년 4월 15일"/>
        <Field label="가격대" value={apt.price} onChange={v=>setApt(p=>({...p,price:v}))} placeholder="15억~20억"/>
        <Field label="위치" value={apt.location} onChange={v=>setApt(p=>({...p,location:v}))} placeholder="서울 서초구"/>
      </div>
    </div>
  );

  if(tab==='templates') return (
    <div style={{maxWidth:760}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:'#94a3b8'}}>📄 CSV 업로드</div>
          {tmplSource!=='default'?(
            <div>
              <div style={{color:'#10b981',fontWeight:600,fontSize:12,marginBottom:4}}>{templates.length}개 템플릿 로드 완료</div>
              <button onClick={()=>tmplFileRef.current.click()} style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'5px 14px',borderRadius:7,cursor:'pointer',fontSize:11}}>다른 파일로 교체</button>
            </div>
          ):(
            <button onClick={()=>tmplFileRef.current.click()} style={{width:'100%',padding:'10px',borderRadius:9,border:'2px dashed rgba(99,102,241,0.3)',background:'transparent',color:'#6366f1',cursor:'pointer',fontSize:12}}>📁 파일 선택</button>
          )}
          <input ref={tmplFileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>handleTmplCSV(e.target.files[0])}/>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:'#94a3b8'}}>🟢 구글 시트 연동</div>
          <input value={tmplSheetUrl} onChange={e=>setTmplSheetUrl(e.target.value)} placeholder="구글 시트 URL"
            style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none',marginBottom:8}}/>
          <button onClick={loadTmplSheet} disabled={tmplSheetLoading} style={{width:'100%',padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,background:'rgba(16,185,129,0.2)',color:'#10b981'}}>
            {tmplSheetLoading?'로딩 중...':'🔗 연동하기'}
          </button>
          {tmplSheetError&&<div style={{fontSize:11,color:'#f87171',marginTop:6}}>{tmplSheetError}</div>}
        </div>
      </div>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 20px'}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:'#94a3b8'}}>현재 적용된 템플릿 목록 ({templates.length}개)</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
          {templates.map((t,i)=>(
            <div key={t.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,padding:'10px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:10,color:'#475569',background:'rgba(255,255,255,0.06)',padding:'1px 7px',borderRadius:10}}>#{i}</span>
                <span style={{fontSize:12,fontWeight:600,color:'#cbd5e1'}}>{t.title}</span>
              </div>
              <div style={{fontSize:11,color:'#475569',lineHeight:1.6}}>{t.content.slice(0,100)}{t.content.length>100?'...':''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if(tab==='prompts') return (
    <div style={{maxWidth:520}}>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'22px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div style={{fontSize:14,fontWeight:700}}>🤖 AI 메시지 생성 설정</div>
          <span style={{fontSize:11,color:promptSaveStatus==='saved'?'#10b981':'#f59e0b'}}>
            {promptSaveStatus==='saved'?'✅ 저장됨':'💾 저장 중...'}
          </span>
        </div>
        {[
          {key:'tone',label:'말투/톤',placeholder:'친근하고 전문적인'},
          {key:'style',label:'작성 스타일',placeholder:'간결하고 명확한'},
          {key:'length',label:'메시지 길이',placeholder:'100자 내외'},
          {key:'extra',label:'추가 지시사항',placeholder:'청약 일정과 자격 조건 강조'},
          {key:'forbidden',label:'금지 표현',placeholder:'과장 표현, 확정적 수익 언급'},
        ].map(f=>(
          <Field key={f.key} label={f.label} value={prompts[f.key]} placeholder={f.placeholder}
            onChange={v=>{setPromptSaveStatus('saving');setPrompts(p=>({...p,[f.key]:v}));setTimeout(()=>setPromptSaveStatus('saved'),800);}}/>
        ))}
      </div>
    </div>
  );

  return null;
}
