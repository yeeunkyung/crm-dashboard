import { useState, useRef } from "react";
import { SEGMENTS, ALL_GROUPS, SAMPLE, TEMPLATE_MAPPING, parseCSV, classifyGroup } from "./constants";

const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

const REQUIRED_COLS = ['나이','성별','나의거주지역','청약자격','구매목적','청약의사'];

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

function UploadProgress({ status, fileName, count, error }) {
  if(status==='idle') return null;
  if(status==='error') return (
    <div style={{marginTop:10,padding:'10px 14px',background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:9}}>
      <div style={{fontSize:12,color:'#f87171',fontWeight:600,marginBottom:2}}>❌ 오류 발생</div>
      <div style={{fontSize:11,color:'#fca5a5',whiteSpace:'pre-line'}}>{error}</div>
    </div>
  );
  const steps = [{key:'reading',label:'파일 읽는 중'},{key:'done',label:'업로드 완료'}];
  return (
    <div style={{marginTop:10,padding:'12px 14px',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9}}>
      {fileName&&<div style={{fontSize:11,color:'#64748b',marginBottom:8}}>📄 {fileName}</div>}
      <div style={{display:'flex',alignItems:'center'}}>
        {steps.map((s,i)=>{
          const isDone = status==='done'||(status==='reading'&&i===0);
          const isActive = status===s.key;
          return (
            <div key={s.key} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
                  background:isDone?'rgba(16,185,129,0.2)':isActive?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',
                  border:`2px solid ${isDone?'#10b981':isActive?'#6366f1':'rgba(255,255,255,0.1)'}`,
                  color:isDone?'#10b981':isActive?'#a5b4fc':'#475569'}}>
                  {isDone?'✓':i+1}
                </div>
                <span style={{fontSize:11,color:isDone?'#10b981':isActive?'#a5b4fc':'#475569',fontWeight:isDone||isActive?600:400}}>
                  {isActive&&status==='reading'?'파일 읽는 중...':s.label}
                </span>
              </div>
              {i<steps.length-1&&(
                <div style={{flex:1,height:2,margin:'0 8px',background:isDone?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)',borderRadius:2}}/>
              )}
            </div>
          );
        })}
      </div>
      {status==='done'&&count&&(
        <div style={{marginTop:8,fontSize:12,color:'#10b981',fontWeight:600}}>✅ {count.toLocaleString()}명 로드 완료!</div>
      )}
    </div>
  );
}

export default function Dashboard({ customers, setCustomers, templates, apt, setApt, prompts, setPrompts, tab, setTab, setSelected, setSendMode, groupCounts, totalCount, promptSaveStatus, setPromptSaveStatus, tmplSource, setTmplSource, setTemplates }) {
  const [dataSource, setDataSource] = useState('sample');
  const [csvStatus, setCsvStatus] = useState('idle');
  const [csvError, setCsvError] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetStatus, setSheetStatus] = useState('idle');
  const [sheetError, setSheetError] = useState('');
  const [filterGroup, setFilterGroup] = useState(null);
  const [showColGuide, setShowColGuide] = useState(false);
  const [tmplSheetUrl, setTmplSheetUrl] = useState('');
  const [tmplSheetLoading, setTmplSheetLoading] = useState(false);
  const [tmplSheetError, setTmplSheetError] = useState('');

  const fileRef = useRef();
  const tmplFileRef = useRef();

  const filteredCustomers = filterGroup ? customers.filter(c=>c.groupId===filterGroup) : customers;
  const checkCols = headers => REQUIRED_COLS.filter(c=>!headers.includes(c));

  const handleCSV = file => {
    if(!file) return;
    setCsvError(''); setCsvStatus('reading'); setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const firstLine = e.target.result.split('\n')[0];
        const headers = firstLine.split(',').map(h=>h.trim().replace(/"/g,'').replace(/^\uFEFF/,''));
        const missing = checkCols(headers);
        if(missing.length>0){ setCsvError(`필수 컬럼 누락: ${missing.join(', ')}\n아래 컬럼 안내를 확인해주세요.`); setCsvStatus('error'); return; }
        const parsed = parseCSV(e.target.result);
        if(!parsed.length){ setCsvError('데이터를 읽을 수 없어요.'); setCsvStatus('error'); return; }
        setCustomers(parsed); setDataSource('csv'); setCsvStatus('done');
      } catch(err){ setCsvError('파일 오류: '+err.message); setCsvStatus('error'); }
    };
    reader.readAsText(file,'UTF-8');
  };

  const loadSheet = async () => {
    if(!sheetUrl) return;
    setSheetLoading(true); setSheetError(''); setSheetStatus('reading');
    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match) throw new Error('잘못된 시트 URL 형식');
      if(!GSHEET_API_KEY) throw new Error('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z1000?key=${GSHEET_API_KEY}`);
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      if(!data.values||data.values.length<2) throw new Error('시트에 데이터가 없습니다.');
      const headers = data.values[0].map(h=>h.trim());
      const missing = checkCols(headers);
      if(missing.length>0) throw new Error(`필수 컬럼 누락: ${missing.join(', ')}`);
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
      setCustomers(rows); setDataSource('sheet'); setSheetStatus('done');
    } catch(e){ setSheetError(e.message); setSheetStatus('error'); }
    setSheetLoading(false);
  };

  const handleTmplCSV = file => {
    if(!file) return; setTmplSheetError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result);
        if(!parsed.length){ setTmplSheetError('데이터를 읽을 수 없어요.'); return; }
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

  // ══════════════════════════════════════════
  // 고객 데이터 탭
  // ══════════════════════════════════════════
  if(tab==='data') return (
    <div style={{display:'grid',gridTemplateColumns:'420px 1fr',gap:20,maxWidth:1200}}>

      {/* ── 왼쪽: 데이터 불러오기 ── */}
      <div>
        {/* 상태 바 */}
        <div style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:12,padding:'11px 16px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <span style={{color:'#a5b4fc',fontWeight:600,fontSize:13}}>현재 {totalCount.toLocaleString()}명 로드됨</span>
            <span style={{color:'#64748b',marginLeft:10,fontSize:11}}>
              {dataSource==='csv'?'📄 CSV 파일':dataSource==='sheet'?'🟢 구글 시트':'📋 샘플 데이터'}
            </span>
          </div>
          <button onClick={()=>{setCustomers(SAMPLE);setDataSource('sample');setCsvStatus('idle');setSheetStatus('idle');}}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>
            샘플로 초기화
          </button>
        </div>

        {/* CSV 업로드 */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12,color:'#e2e8f0'}}>📄 CSV 파일 업로드</div>
          <div onClick={()=>fileRef.current.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();handleCSV(e.dataTransfer.files[0]);}}
            style={{border:`2px dashed ${csvStatus==='done'?'rgba(16,185,129,0.4)':csvStatus==='error'?'rgba(248,113,113,0.4)':'rgba(99,102,241,0.3)'}`,
              borderRadius:10,padding:'22px',textAlign:'center',cursor:'pointer',
              background:csvStatus==='done'?'rgba(16,185,129,0.05)':csvStatus==='error'?'rgba(248,113,113,0.05)':'rgba(99,102,241,0.03)'}}>
            <div style={{fontSize:26,marginBottom:6}}>{csvStatus==='done'?'✅':csvStatus==='error'?'❌':'📁'}</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:8}}>CSV 파일을 드래그하거나</div>
            <button style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.4)',color:'#a5b4fc',padding:'6px 16px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:600}}>
              📁 파일 선택
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>handleCSV(e.target.files[0])}/>
          <UploadProgress status={csvStatus} fileName={csvFileName} count={csvStatus==='done'?customers.length:null} error={csvError}/>

          {/* 컬럼 안내 토글 */}
          <div style={{marginTop:12}}>
            <button onClick={()=>setShowColGuide(v=>!v)}
              style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',color:'#94a3b8',fontSize:11}}>
              <span>📋 CSV 컬럼 설정 안내</span>
              <span style={{fontSize:10,color:'#475569'}}>{showColGuide?'▲ 닫기':'▼ 펼치기'}</span>
            </button>
            {showColGuide&&(
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,padding:'14px 16px',marginTop:6}}>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:'#f87171',fontWeight:700,marginBottom:7}}>🔴 필수 컬럼 (없으면 분류 불가)</div>
                  {[
                    {col:'나이',        vals:'20대 / 30대 / 40대 / 50대 / 60대 이상'},
                    {col:'성별',        vals:'남자 / 여자'},
                    {col:'나의거주지역', vals:'텍스트 (예: 동탄2, 경기 기타)'},
                    {col:'청약자격',    vals:'1순위 / 특별공급 / 2순위 / 무순위'},
                    {col:'구매목적',    vals:'실거주 / 투자 / 증여 / 기타'},
                    {col:'청약의사',    vals:'있다 / 없다 / 조건부'},
                  ].map(r=>(
                    <div key={r.col} style={{display:'flex',gap:8,marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:'#f87171',minWidth:90,flexShrink:0}}>{r.col}</span>
                      <span style={{fontSize:10,color:'#64748b',lineHeight:1.5}}>{r.vals}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:'#f59e0b',fontWeight:700,marginBottom:7}}>🟡 선택 컬럼 (있으면 더 정확)</div>
                  {[
                    {col:'이름',     vals:'고객 이름 (없으면 고객1, 고객2...)'},
                    {col:'연락처',   vals:'전화번호 (SMS 실발송 시 필수)'},
                    {col:'분양 일정',vals:'알고 있다 / 몰랐다 (그룹1/2 구분용)'},
                    {col:'비고',     vals:'메모'},
                  ].map(r=>(
                    <div key={r.col} style={{display:'flex',gap:8,marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:'#f59e0b',minWidth:90,flexShrink:0}}>{r.col}</span>
                      <span style={{fontSize:10,color:'#64748b',lineHeight:1.5}}>{r.vals}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'rgba(99,102,241,0.06)',borderRadius:7,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:'#6366f1',fontWeight:700,marginBottom:5}}>✅ 자동 분류 기준</div>
                  <div style={{fontSize:10,color:'#64748b',lineHeight:1.9}}>
                    청약의사 없다 → 그룹1·2 (분양일정 인지 여부로 구분)<br/>
                    청약의사 있다 + 1순위 → 그룹3 / 특별공급 → 그룹4<br/>
                    청약의사 있다 + 2순위 → 그룹5 / 무순위 → 그룹6<br/>
                    조건부 + 투자·증여 → 그룹9 / 기타 → 그룹10<br/>
                    조건부 + 실거주 + 20~40대 → 그룹7 / 50대+ → 그룹8
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 구글 시트 연동 */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:4,color:'#e2e8f0'}}>🟢 구글 시트 연동</div>
          <div style={{fontSize:11,color:'#475569',marginBottom:10}}>시트 수정 후 다시 불러오기 하면 실시간 반영</div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none'}}/>
            <button onClick={loadSheet} disabled={sheetLoading}
              style={{padding:'8px 14px',borderRadius:8,border:'none',cursor:sheetLoading?'not-allowed':'pointer',fontSize:12,fontWeight:600,
                background:sheetLoading?'rgba(99,102,241,0.15)':'rgba(16,185,129,0.2)',
                color:sheetLoading?'#64748b':'#10b981',flexShrink:0}}>
              {sheetLoading?'⏳ 불러오는 중':'🔗 불러오기'}
            </button>
          </div>
          <UploadProgress status={sheetStatus} fileName={sheetUrl?'구글 시트':''} count={sheetStatus==='done'?customers.length:null} error={sheetError}/>
          <div style={{marginTop:10,padding:'10px 12px',background:'rgba(255,255,255,0.02)',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{fontSize:11,color:'#6366f1',fontWeight:600,marginBottom:5}}>설정 방법</div>
            <div style={{fontSize:10,color:'#475569',lineHeight:1.9}}>
              1. 구글 시트 → 공유 → <span style={{color:'#94a3b8',fontWeight:600}}>링크 있는 모든 사용자 보기</span><br/>
              2. Vercel 환경변수에 <span style={{color:'#94a3b8',fontWeight:600}}>VITE_GSHEET_API_KEY</span> 추가<br/>
              3. 위 필수 컬럼명 그대로 사용할 것
            </div>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: 고객 목록 ── */}
      <div>
        <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:700,overflowY:'auto'}}>
          {filteredCustomers.slice(0,100).map(c=>{
            const g=ALL_GROUPS.find(x=>x.id===c.groupId)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류'};
            return(
              <div key={c.id}
                style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'11px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                onClick={()=>{setSelected(c);setTab('send');setSendMode('individual');}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{g.icon}</div>
                  <div>
                    <div>
                      <span style={{fontWeight:600,fontSize:13}}>{c.name}</span>
                      <span style={{fontSize:10,color:g.color,marginLeft:7,background:`${g.color}15`,padding:'1px 7px',borderRadius:10}}>{g.short}</span>
                    </div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{c.age} · {c.gender} · {c.region}</div>
                    {c.자격&&<div style={{fontSize:10,color:'#475569',marginTop:1}}>{c.자격} · {c.목적||'-'}</div>}
                  </div>
                </div>
                <span style={{fontSize:11,color:'#6366f1',flexShrink:0}}>선택 →</span>
              </div>
            );
          })}
          {filteredCustomers.length>100&&(
            <div style={{textAlign:'center',color:'#475569',fontSize:12,padding:'8px'}}>+{filteredCustomers.length-100}명 더 있음</div>
          )}
        </div>
      </div>
    </div>
  );

  if(tab==='overview') {
    // 1차/2차/3차 세그먼트만 상단 카드에 표시 (테스트 제외)
    const mainSegments = SEGMENTS.filter(s=>['1차','2차','3차','4차'].includes(s.tier));
    const tierTotals = mainSegments.map(s=>({
      ...s,
      total: s.groups.reduce((sum,g)=>sum+(groupCounts[g.id]||0),0),
    }));
    // 전체 비율 바용 (테스트 제외)
    const allMainGroups = ALL_GROUPS.filter(g=>g.id!==99);
    const grandTotal = allMainGroups.reduce((sum,g)=>sum+(groupCounts[g.id]||0),0)||1;
    return (
      <div>
        {/* ── 상단 3개 티어 카드 ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
          {tierTotals.map(s=>(
            <div key={s.tier} style={{background:s.tierBg,border:`1px solid ${s.tierBorder}`,borderRadius:16,padding:'18px 20px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,color:s.tierColor,fontWeight:700,marginBottom:4}}>{s.tier}차 분류</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#e2e8f0'}}>{s.tierLabel}</div>
                </div>
                <div style={{fontSize:22,fontWeight:800,color:s.tierColor}}>{s.total.toLocaleString()}명</div>
              </div>
              {s.groups.map(g=>{
                const cnt=groupCounts[g.id]||0;
                return(
                  <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{fontSize:14}}>{g.icon}</span>
                      <span style={{fontSize:11,color:'#cbd5e1'}}>{g.short}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:g.color}}>{cnt.toLocaleString()}명</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── 전체 세그먼트 비율 바 ── */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 20px',marginBottom:20}}>
          <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:12}}>
            전체 세그먼트 비율 · {grandTotal.toLocaleString()}명
          </div>
          {/* 비율 바 */}
          <div style={{display:'flex',borderRadius:8,overflow:'hidden',height:18,marginBottom:12}}>
            {allMainGroups.map(g=>{
              const cnt=groupCounts[g.id]||0;
              const pct=(cnt/grandTotal)*100;
              if(!pct) return null;
              return(
                <div key={g.id} title={`${g.short}: ${pct.toFixed(1)}%`}
                  style={{width:`${pct}%`,background:g.color,transition:'width 0.5s',minWidth:pct>0.5?2:0}}/>
              );
            })}
          </div>
          {/* 범례 */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px 16px'}}>
            {allMainGroups.map(g=>{
              const cnt=groupCounts[g.id]||0;
              const pct=((cnt/grandTotal)*100).toFixed(1);
              return(
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:g.color,flexShrink:0}}/>
                  <span style={{fontSize:10,color:'#64748b'}}>{g.short} {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 세그먼트 정의 그리드 ── */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'18px 20px'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#94a3b8',marginBottom:14}}>세그먼트 정의</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {ALL_GROUPS.filter(g=>g.id!==99).map(g=>{
              const cnt=groupCounts[g.id]||0;
              return(
                <div key={g.id} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${g.color}20`,borderRadius:12,padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:18}}>{g.icon}</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:g.color}}>{g.name}</div>
                        <div style={{fontSize:10,color:'#475569',marginTop:1}}>{g.desc}</div>
                      </div>
                    </div>
                    <span style={{fontSize:16,fontWeight:800,color:g.color,flexShrink:0,marginLeft:8}}>{cnt.toLocaleString()}명</span>
                  </div>
                  <div style={{fontSize:10,color:'#334155',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:7,marginTop:4}}>
                    추천 템플릿: {(TEMPLATE_MAPPING[g.id]||[]).map(id=>templates.find(t=>t.id===id)?.title).filter(Boolean).slice(0,2).join(', ')||'없음'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
    <PromptTab
      customers={customers} groupCounts={groupCounts} templates={templates}
      prompts={prompts} setPrompts={setPrompts}
      promptSaveStatus={promptSaveStatus} setPromptSaveStatus={setPromptSaveStatus}
    />
  );

  return null;
}

function PromptTab({ customers, groupCounts, templates, prompts, setPrompts, promptSaveStatus, setPromptSaveStatus }) {
  const [selGroup, setSelGroup] = useState(null);
  const TONE_OPTIONS = ['부드럽고 부담 없는','친근하고 따뜻한','격식 있고 신뢰감 있는','적극적이고 설득력 있는','공감하며 맞춤 제안하는','간결하고 임팩트 있는'];
  const STYLE_OPTIONS = ['정보 제공형','행동 유도형','조건 맞춤형','혜택 강조형','긴박감 강조형','감성 공략형'];
  const LENGTH_OPTIONS = ['80자','100자','120자','150자'];
  const save = patch => { setPromptSaveStatus('saving'); setPrompts(p=>({...p,...patch})); setTimeout(()=>setPromptSaveStatus('saved'),800); };
  const Tag = ({label,active,onClick}) => (
    <button onClick={onClick} style={{padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:active?600:400,background:active?'rgba(99,102,241,0.35)':'rgba(255,255,255,0.06)',color:active?'#a5b4fc':'#94a3b8'}}>{label}</button>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:0,maxWidth:1000,minHeight:560,borderRadius:14,overflow:'hidden',border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{background:'rgba(255,255,255,0.02)',borderRight:'1px solid rgba(255,255,255,0.08)',padding:'16px 0',overflowY:'auto'}}>
        <div style={{fontSize:10,color:'#475569',fontWeight:700,padding:'0 16px 10px',letterSpacing:1}}>세그먼트 선택</div>
        {SEGMENTS.map(s=>(
          <div key={s.tier}>
            <div style={{fontSize:10,color:s.tierColor,fontWeight:700,padding:'10px 16px 6px'}}>{s.tier}차 · {s.tierLabel}</div>
            {s.groups.map(g=>{
              const isSel=selGroup?.id===g.id;
              return(
                <div key={g.id} onClick={()=>setSelGroup(g)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',cursor:'pointer',background:isSel?`${g.color}18`:'transparent',borderLeft:isSel?`3px solid ${g.color}`:'3px solid transparent'}}>
                  <span style={{fontSize:15}}>{g.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:11,fontWeight:isSel?700:400,color:isSel?g.color:'#94a3b8'}}>{g.short}</div></div>
                  <span style={{fontSize:10,color:'#475569'}}>{groupCounts[g.id]||0}명</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{background:'rgba(255,255,255,0.02)',padding:'22px 26px',overflowY:'auto'}}>
        {selGroup ? (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:22}}>{selGroup.icon}</span>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:selGroup.color}}>{selGroup.name}</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{selGroup.desc} · {groupCounts[selGroup.id]||0}명</div>
                </div>
              </div>
              <div style={{padding:'6px 14px',borderRadius:9,background:promptSaveStatus==='saved'?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)',border:`1px solid ${promptSaveStatus==='saved'?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.3)'}`}}>
                <span style={{fontSize:11,color:promptSaveStatus==='saved'?'#10b981':'#f59e0b',fontWeight:600}}>{promptSaveStatus==='saved'?'✅ 저장완료':'💾 저장 중...'}</span>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'12px 16px',marginBottom:20}}>
              <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginBottom:8}}>■ 이 세그먼트 추천 템플릿</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                {(TEMPLATE_MAPPING[selGroup.id]||[]).map(id=>{const t=templates.find(x=>x.id===id);return t?(<span key={id} style={{padding:'5px 12px',borderRadius:8,fontSize:11,background:'rgba(99,102,241,0.12)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.25)'}}>{t.title}</span>):null;})}
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>말투 / 톤</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{TONE_OPTIONS.map(t=>(<Tag key={t} label={t} active={prompts.tone===t} onClick={()=>save({tone:t})}/>))}</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>메시지 스타일</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{STYLE_OPTIONS.map(s=>(<Tag key={s} label={s} active={prompts.style===s} onClick={()=>save({style:s})}/>))}</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>목표 글자 수</div>
              <div style={{display:'flex',gap:7}}>{LENGTH_OPTIONS.map(l=>(<Tag key={l} label={l} active={prompts.length===l} onClick={()=>save({length:l})}/>))}</div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:8}}>추가 지시사항</div>
              <textarea value={prompts.extra} onChange={e=>save({extra:e.target.value})} placeholder="예: 청약일 반드시 강조"
                style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'10px 14px',color:'#e2e8f0',fontSize:12,lineHeight:1.7,resize:'none',outline:'none',height:70}}/>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:8}}>금지 표현</div>
              <input value={prompts.forbidden} onChange={e=>save({forbidden:e.target.value})} placeholder="예: 저렴한, 싼"
                style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,padding:'10px 14px',color:'#e2e8f0',fontSize:12,outline:'none'}}/>
            </div>
            <button onClick={()=>save({})} style={{width:'100%',padding:'14px',borderRadius:11,border:'none',cursor:'pointer',fontSize:14,fontWeight:700,background:'linear-gradient(135deg,#6366f1,#a855f7)',color:'white'}}>✅ 저장완료</button>
          </>
        ) : (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:400,color:'#334155',textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:12}}>👈</div>
            <div style={{fontSize:14,fontWeight:600,color:'#475569',marginBottom:6}}>세그먼트를 선택해주세요</div>
            <div style={{fontSize:12,color:'#334155'}}>각 그룹별 AI 프롬프트를<br/>맞춤 설정할 수 있어요</div>
          </div>
        )}
      </div>
    </div>
  );
}
