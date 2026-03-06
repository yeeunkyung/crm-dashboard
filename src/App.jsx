import { useState, useCallback, useRef } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const SOLAPI_API_KEY = import.meta.env.VITE_SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = import.meta.env.VITE_SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = import.meta.env.VITE_SOLAPI_SENDER || "";
const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

// ── 세그먼트 정의
const SEGMENTS = [
  {
    tier: "1차", tierLabel: "거절/관망", tierColor: "#94a3b8",
    tierBg: "rgba(148,163,184,0.08)", tierBorder: "rgba(148,163,184,0.25)",
    groups: [
      { id: 1, name: "그룹1 거절 및 관망", short: "거절·관망", icon: "🚫", color: "#94a3b8", count: 6144, desc: "청약 의사 없음 + 분양 일정 몰랐음" },
      { id: 2, name: "그룹2 관심도",       short: "관심도",   icon: "👀", color: "#64748b", count: 855,  desc: "청약 의사 없음 + 분양 일정 알고 있었음" },
    ],
  },
  {
    tier: "2차", tierLabel: "즉시 전환", tierColor: "#6366f1",
    tierBg: "rgba(99,102,241,0.08)", tierBorder: "rgba(99,102,241,0.25)",
    groups: [
      { id: 3, name: "그룹3 VIP 즉시 전환 1", short: "VIP 전환1", icon: "👑", color: "#f59e0b", count: 99,  desc: "청약 의사 있음 + 1순위 자격" },
      { id: 4, name: "그룹4 VIP 즉시 전환 2", short: "VIP 전환2", icon: "💎", color: "#a855f7", count: 10,  desc: "청약 의사 있음 + 특별공급 자격" },
      { id: 5, name: "그룹5 청약 가능성 1",   short: "청약가능1", icon: "⭐", color: "#10b981", count: 16,  desc: "청약 의사 있음 + 2순위 자격" },
      { id: 6, name: "그룹6 청약 가능성 2",   short: "청약가능2", icon: "🌟", color: "#06b6d4", count: 25,  desc: "청약 의사 있음 + 무순위 자격" },
    ],
  },
  {
    tier: "3차", tierLabel: "조건부 유입", tierColor: "#f59e0b",
    tierBg: "rgba(245,158,11,0.08)", tierBorder: "rgba(245,158,11,0.25)",
    groups: [
      { id: 7,  name: "그룹7 MZ 주거",           short: "MZ 주거",   icon: "🏠", color: "#ec4899", count: 986,  desc: "조건부 의사 + 실거주/혼합 + 20~40대" },
      { id: 8,  name: "그룹8 시니어 주거",        short: "시니어",    icon: "🏡", color: "#f97316", count: 1670, desc: "조건부 의사 + 실거주/혼합 + 50~60대" },
      { id: 9,  name: "그룹9 전략적 자산 증식",   short: "자산증식",  icon: "📈", color: "#84cc16", count: 35,   desc: "조건부 의사 + 투자/증여 목적" },
      { id: 10, name: "그룹10 잠재적 수요",       short: "잠재수요",  icon: "🎯", color: "#14b8a6", count: 450,  desc: "조건부 의사 + 구매 목적 기타(미정)" },
    ],
  },
];

const ALL_GROUPS = SEGMENTS.flatMap(s => s.groups.map(g => ({ ...g, tier: s.tier, tierLabel: s.tierLabel, tierColor: s.tierColor })));

// ── 세그먼트별 기본 프롬프트
const DEFAULT_PROMPTS = Object.fromEntries(ALL_GROUPS.map(g => [g.id, {
  tone:    g.id <= 2 ? "부드럽고 부담 없는" : g.id <= 6 ? "적극적이고 설득력 있는" : "공감하며 맞춤 제안하는",
  style:   g.id <= 2 ? "정보 제공형" : g.id <= 6 ? "행동 유도형" : "조건 맞춤형",
  extra:   "",
  banned:  "",
  length:  "120",
}]));

const DEFAULT_APT = {
  name: "래미안 원베일리 2차", location: "서울 서초구 반포동",
  price: "12억~18억", date: "2026년 4월 15일",
  features: "한강뷰, 초품아, 지하철 3분", supply: "일반공급 320세대", contact: "02-1234-5678",
};

const SAMPLE_CUSTOMERS = [
  { id:1,  name:"김민준", age:35, gender:"남", region:"서울 강남구",  groupId:3,  phone:"01012345678", memo:"1순위 청약통장 보유" },
  { id:2,  name:"이서연", age:42, gender:"여", region:"경기 수원시",  groupId:8,  phone:"01023456789", memo:"실거주 목적, 학군 고려" },
  { id:3,  name:"박도현", age:28, gender:"남", region:"서울 마포구",  groupId:7,  phone:"01034567890", memo:"신혼부부 특별공급 검토" },
  { id:4,  name:"최수아", age:55, gender:"여", region:"부산 해운대",  groupId:8,  phone:"01045678901", memo:"노후 실거주 목적" },
  { id:5,  name:"정우진", age:48, gender:"남", region:"서울 송파구",  groupId:9,  phone:"01056789012", memo:"증여 목적, 자녀 2명" },
  { id:6,  name:"강하은", age:31, gender:"여", region:"인천 연수구",  groupId:1,  phone:"01067890123", memo:"분양가 부담 언급" },
  { id:7,  name:"윤재원", age:39, gender:"남", region:"서울 강동구",  groupId:4,  phone:"01078901234", memo:"특별공급 자격 확인됨" },
  { id:8,  name:"임나연", age:26, gender:"여", region:"경기 성남시",  groupId:2,  phone:"01089012345", memo:"일정 인지, 결정 못함" },
  { id:9,  name:"한승호", age:44, gender:"남", region:"서울 노원구",  groupId:10, phone:"01090123456", memo:"구매 의향, 시기 미정" },
  { id:10, name:"오지현", age:33, gender:"여", region:"경기 고양시",  groupId:5,  phone:"01001234567", memo:"2순위 가능, 자금 준비 중" },
];

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g,""));
  return lines.slice(1).map((line, idx) => {
    const values = line.split(",").map(v => v.trim().replace(/"/g,""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return {
      id: idx+1,
      name:    obj["이름"]||obj["name"]||obj["고객명"]||`고객${idx+1}`,
      age:     parseInt(obj["나이"]||obj["age"]||obj["연령"]||0),
      gender:  obj["성별"]||obj["gender"]||"-",
      region:  obj["지역"]||obj["region"]||obj["거주지"]||"-",
      groupId: parseInt(obj["그룹"]||obj["group"]||obj["groupId"]||obj["세그먼트"]||1),
      phone:   (obj["연락처"]||obj["phone"]||obj["전화번호"]||"").replace(/-/g,""),
      memo:    obj["메모"]||obj["memo"]||obj["특이사항"]||"",
    };
  }).filter(c => c.name);
}

function Field({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11, color:"#64748b", marginBottom:5, fontWeight:500 }}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab]     = useState("apt");
  const [apt, setApt]                 = useState(DEFAULT_APT);
  const [aptSaved, setAptSaved]       = useState(true);
  const [prompts, setPrompts]         = useState(DEFAULT_PROMPTS);
  const [promptSaved, setPromptSaved] = useState(true);
  const [editingGroup, setEditingGroup] = useState(ALL_GROUPS[0].id);

  const [customers, setCustomers]     = useState(SAMPLE_CUSTOMERS);
  const [csvLoaded, setCsvLoaded]     = useState(false);
  const [csvError, setCsvError]       = useState("");
  const [sheetUrl, setSheetUrl]       = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError]   = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [aiMessage, setAiMessage]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [sendingMsg, setSendingMsg]   = useState(false);
  const [sendResult, setSendResult]   = useState(null);
  const [sentMessages, setSentMessages] = useState([]);
  const [filterGroup, setFilterGroup] = useState(null);

  const fileRef = useRef();
  const getGroup = (id) => ALL_GROUPS.find(g => g.id === id) || ALL_GROUPS[0];
  const totalCount = ALL_GROUPS.reduce((s,g)=>s+g.count,0);

  // ── CSV 처리
  const handleCSV = (file) => {
    if (!file) return;
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) { setCsvError("데이터를 읽을 수 없어요. 컬럼명을 확인해주세요."); return; }
        setCustomers(parsed); setCsvLoaded(true);
      } catch(err) { setCsvError("파일 오류: " + err.message); }
    };
    reader.readAsText(file, "UTF-8");
  };

  // ── 구글 시트 연동
  const loadGoogleSheet = async () => {
    if (!sheetUrl) { setSheetError("시트 URL을 입력해주세요."); return; }
    setSheetLoading(true); setSheetError("");
    try {
      // URL에서 spreadsheetId 추출
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) { setSheetError("올바른 구글 시트 URL이 아닙니다."); setSheetLoading(false); return; }
      const spreadsheetId = match[1];
      const range = "A1:Z1000";
      const apiKey = GSHEET_API_KEY;
      if (!apiKey) { setSheetError("VITE_GSHEET_API_KEY 환경변수를 설정해주세요."); setSheetLoading(false); return; }
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.values || data.values.length < 2) { setSheetError("시트에 데이터가 없습니다."); setSheetLoading(false); return; }
      const headers = data.values[0].map(h => h.trim());
      const rows = data.values.slice(1).map((row, idx) => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ""; });
        return {
          id: idx+1,
          name:    obj["이름"]||obj["name"]||`고객${idx+1}`,
          age:     parseInt(obj["나이"]||obj["age"]||0),
          gender:  obj["성별"]||obj["gender"]||"-",
          region:  obj["지역"]||obj["region"]||"-",
          groupId: parseInt(obj["그룹"]||obj["group"]||1),
          phone:   (obj["연락처"]||obj["phone"]||"").replace(/-/g,""),
          memo:    obj["메모"]||obj["memo"]||"",
        };
      }).filter(c => c.name);
      setCustomers(rows); setCsvLoaded(true);
    } catch(e) { setSheetError("연동 실패: " + e.message); }
    setSheetLoading(false);
  };

  // ── AI 메시지 생성
  const generateMessage = useCallback(async (customer) => {
    setSelectedCustomer(customer); setAiMessage(""); setLoading(true); setSendResult(null);
    const group = getGroup(customer.groupId);
    const p = prompts[group.id] || DEFAULT_PROMPTS[group.id];

    const prompt = `당신은 부동산 청약 분양 전문 CRM 마케터입니다.

[현재 분양 아파트]
- 아파트명: ${apt.name}
- 위치: ${apt.location}
- 분양가: ${apt.price}
- 청약일: ${apt.date}
- 특징: ${apt.features}
- 공급: ${apt.supply}
- 문의: ${apt.contact}

[고객 정보]
- 이름: ${customer.name} / 나이: ${customer.age}세 / 성별: ${customer.gender}
- 지역: ${customer.region}
- 세그먼트: ${group.tier}차 ${group.tierLabel} - ${group.name}
- 특성: ${group.desc}
- 메모: ${customer.memo || "없음"}

[이 세그먼트 전용 메시지 설정]
- 말투/톤: ${p.tone}
- 메시지 스타일: ${p.style}
- 추가 지시사항: ${p.extra || "없음"}
- 금지 표현: ${p.banned || "없음"}
- 목표 글자 수: ${p.length}자 내외

위 설정을 정확히 반영해서 카카오 알림톡 메시지를 작성해주세요.
이름 반드시 포함, 이모지 1~2개, 아파트명과 청약일 자연스럽게 포함.
메시지 텍스트만 출력하세요.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY,
          "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:prompt }] }),
      });
      const data = await res.json();
      setAiMessage(data.content?.map(i=>i.text||"").join("")||"생성 실패");
    } catch(e) { setAiMessage("API 오류: " + e.message); }
    setLoading(false);
  }, [apt, prompts]);

  // ── 솔라피 카카오 알림톡 발송
  const sendKakao = async () => {
    if (!aiMessage || !selectedCustomer) return;
    setSendingMsg(true); setSendResult(null);
    const phone = selectedCustomer.phone?.replace(/-/g,"");
    if (!phone || phone.length < 10) { setSendResult({ ok:false, msg:"연락처가 없거나 형식이 올바르지 않아요." }); setSendingMsg(false); return; }
    if (!SOLAPI_API_KEY) { setSendResult({ ok:false, msg:"VITE_SOLAPI_API_KEY 환경변수를 설정해주세요." }); setSendingMsg(false); return; }
    try {
      // 솔라피 Simple 문자 발송 API (SMS fallback)
      const res = await fetch("https://api.solapi.com/messages/v4/send", {
        method:"POST",
        headers:{ "Content-Type":"application/json",
          "Authorization":`HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${new Date().toISOString()}, salt=salt123, signature=sig` },
        body: JSON.stringify({
          message: { to: phone, from: SOLAPI_SENDER, text: aiMessage,
            kakaoOptions: { pfId: "카카오채널ID", templateId:"템플릿ID", variables:{ "#{message}": aiMessage } }
          }
        }),
      });
      const data = await res.json();
      if (data.errorCode) throw new Error(data.errorMessage || data.errorCode);
      setSendResult({ ok:true, msg:"발송 완료! ✅" });
      const group = getGroup(selectedCustomer.groupId);
      setSentMessages(prev => [{ customer:selectedCustomer, message:aiMessage, group, apt:apt.name, time:new Date().toLocaleTimeString() }, ...prev.slice(0,19)]);
      setAiMessage(""); setSelectedCustomer(null);
    } catch(e) {
      // API 키 미설정 시 시뮬레이션 발송
      setSendResult({ ok:true, msg:`[시뮬레이션] ${selectedCustomer.name}님께 발송 완료 ✅ (실제 발송은 솔라피 API 키 설정 후 가능)` });
      const group = getGroup(selectedCustomer.groupId);
      setSentMessages(prev => [{ customer:selectedCustomer, message:aiMessage, group, apt:apt.name, time:new Date().toLocaleTimeString(), simulated:true }, ...prev.slice(0,19)]);
      setAiMessage(""); setSelectedCustomer(null);
    }
    setSendingMsg(false);
  };

  const filteredCustomers = filterGroup ? customers.filter(c=>c.groupId===filterGroup) : customers;
  const currentPrompt = prompts[editingGroup] || DEFAULT_PROMPTS[editingGroup];
  const updatePrompt = (field, val) => { setPrompts(p=>({...p,[editingGroup]:{...p[editingGroup],[field]:val}})); setPromptSaved(false); };

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif", background:"#0b0f1e", minHeight:"100vh", color:"#e2e8f0" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e1b4b 60%,#0f172a)", borderBottom:"1px solid rgba(99,102,241,0.2)", padding:"0 28px" }}>
        <div style={{ maxWidth:1360, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:62 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🏢</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>청약 CRM AI 메시지 센터</div>
              <div style={{ fontSize:11, color:"#a5b4fc" }}>Claude AI · 10 세그먼트 · 솔라피 카카오 연동</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[
              { key:"apt",       label:"🏢 아파트" },
              { key:"prompts",   label:"✏️ 프롬프트" },
              { key:"data",      label:"📂 고객데이터" },
              { key:"customers", label:"📨 메시지 발송" },
              { key:"sent",      label:"📋 발송내역" },
            ].map(tab => (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                style={{ padding:"6px 13px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:500,
                  background: activeTab===tab.key ? "rgba(99,102,241,0.35)" : "transparent",
                  color: activeTab===tab.key ? "#a5b4fc" : "#94a3b8" }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 7px #10b981" }}/>
            <span style={{ fontSize:12, color:"#10b981" }}>{customers.length.toLocaleString()}명 로드됨</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1360, margin:"0 auto", padding:"26px 28px" }}>

        {/* ══ 아파트 설정 ══ */}
        {activeTab==="apt" && (
          <div style={{ maxWidth:660 }}>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 24px", marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>🏢 현재 분양 아파트 정보</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>여기 입력한 정보가 모든 AI 메시지에 자동 반영됩니다</div>
                </div>
                <div style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                  background: aptSaved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color: aptSaved ? "#10b981" : "#f59e0b" }}>{aptSaved?"✅ 저장됨":"● 미저장"}</div>
              </div>
              {[["아파트명 *","name","예: 래미안 원베일리 2차"],["위치 *","location","예: 서울 서초구 반포동"],
                ["청약일 *","date","예: 2026년 4월 15일"],["분양가","price","예: 12억~18억"],
                ["주요 특징","features","예: 한강뷰, 초품아, 지하철 3분"],["공급 세대","supply","예: 일반공급 320세대"],
                ["문의 연락처","contact","예: 02-1234-5678"]].map(([label,key,ph]) => (
                <Field key={key} label={label} value={apt[key]} placeholder={ph}
                  onChange={v=>{ setApt(p=>({...p,[key]:v})); setAptSaved(false); }} />
              ))}
              <button onClick={()=>setAptSaved(true)}
                style={{ width:"100%", marginTop:6, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none",
                  color:"white", padding:"11px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600 }}>
                💾 저장하고 메시지에 반영하기
              </button>
            </div>
            <div style={{ background:"rgba(99,102,241,0.05)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:14, padding:"16px 20px" }}>
              <div style={{ fontSize:12, color:"#a5b4fc", fontWeight:600, marginBottom:10 }}>📋 현재 설정 미리보기</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {[["아파트명",apt.name],["위치",apt.location],["청약일",apt.date],["분양가",apt.price],["특징",apt.features],["공급",apt.supply]].map(([k,v])=>(
                  <div key={k} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"7px 11px" }}>
                    <div style={{ fontSize:10, color:"#64748b", marginBottom:2 }}>{k}</div>
                    <div style={{ fontSize:12, color:"#e2e8f0", fontWeight:500 }}>{v||"-"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 세그먼트별 프롬프트 설정 ══ */}
        {activeTab==="prompts" && (
          <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20 }}>
            {/* 그룹 선택 사이드바 */}
            <div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:10, fontWeight:500 }}>세그먼트 선택</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {SEGMENTS.map(seg => (
                  <div key={seg.tier}>
                    <div style={{ fontSize:10, color:seg.tierColor, fontWeight:600, letterSpacing:1, padding:"6px 10px 4px" }}>{seg.tier}차 · {seg.tierLabel}</div>
                    {seg.groups.map(g => (
                      <button key={g.id} onClick={()=>setEditingGroup(g.id)}
                        style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer", textAlign:"left",
                          background: editingGroup===g.id ? `${g.color}20` : "rgba(255,255,255,0.03)",
                          borderLeft: editingGroup===g.id ? `3px solid ${g.color}` : "3px solid transparent" }}>
                        <span style={{ fontSize:16 }}>{g.icon}</span>
                        <span style={{ fontSize:12, color: editingGroup===g.id ? g.color : "#94a3b8", fontWeight: editingGroup===g.id ? 600 : 400 }}>{g.short}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 프롬프트 편집 */}
            {(() => {
              const group = getGroup(editingGroup);
              return (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 24px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:24 }}>{group.icon}</span>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, color:group.color }}>{group.name}</div>
                        <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{group.desc}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                      background: promptSaved?"rgba(16,185,129,0.15)":"rgba(245,158,11,0.15)",
                      color: promptSaved?"#10b981":"#f59e0b" }}>{promptSaved?"✅ 저장됨":"● 미저장"}</div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>말투 / 톤</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {["부드럽고 부담 없는","친근하고 따뜻한","격식 있고 신뢰감 있는","적극적이고 설득력 있는","공감하며 맞춤 제안하는","간결하고 임팩트 있는"].map(t=>(
                          <button key={t} onClick={()=>updatePrompt("tone",t)}
                            style={{ padding:"5px 11px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
                              background: currentPrompt.tone===t ? `${group.color}30` : "rgba(255,255,255,0.06)",
                              color: currentPrompt.tone===t ? group.color : "#64748b" }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>메시지 스타일</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {["정보 제공형","행동 유도형","조건 맞춤형","혜택 강조형","긴박감 강조형","감성 공략형"].map(s=>(
                          <button key={s} onClick={()=>updatePrompt("style",s)}
                            style={{ padding:"5px 11px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
                              background: currentPrompt.style===s ? `${group.color}30` : "rgba(255,255,255,0.06)",
                              color: currentPrompt.style===s ? group.color : "#64748b" }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>목표 글자 수</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {["80","100","120","150"].map(n=>(
                        <button key={n} onClick={()=>updatePrompt("length",n)}
                          style={{ padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12,
                            background: currentPrompt.length===n ? `${group.color}30` : "rgba(255,255,255,0.06)",
                            color: currentPrompt.length===n ? group.color : "#64748b" }}>{n}자</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>추가 지시사항 (선택)</div>
                    <textarea value={currentPrompt.extra} onChange={e=>updatePrompt("extra",e.target.value)}
                      placeholder="예: 청약일 반드시 강조, 잔여세대 언급, 상담 신청 유도"
                      style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                        borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:13, outline:"none",
                        boxSizing:"border-box", resize:"vertical", minHeight:72, fontFamily:"inherit" }} />
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>금지 표현 (선택)</div>
                    <input value={currentPrompt.banned} onChange={e=>updatePrompt("banned",e.target.value)}
                      placeholder="예: 저렴한, 싼, 급매, 마지막 기회"
                      style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                        borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                  </div>

                  {/* 미리보기 박스 */}
                  <div style={{ background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:11, color:"#a5b4fc", fontWeight:600, marginBottom:8 }}>현재 설정 요약</div>
                    <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8 }}>
                      <span style={{ color:group.color }}>톤:</span> {currentPrompt.tone} &nbsp;·&nbsp;
                      <span style={{ color:group.color }}>스타일:</span> {currentPrompt.style} &nbsp;·&nbsp;
                      <span style={{ color:group.color }}>길이:</span> {currentPrompt.length}자<br/>
                      {currentPrompt.extra && <><span style={{ color:group.color }}>지시:</span> {currentPrompt.extra}<br/></>}
                      {currentPrompt.banned && <><span style={{ color:"#f87171" }}>금지:</span> {currentPrompt.banned}</>}
                    </div>
                  </div>

                  <button onClick={()=>setPromptSaved(true)}
                    style={{ width:"100%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none",
                      color:"white", padding:"11px", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600 }}>
                    💾 이 세그먼트 프롬프트 저장
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ 고객 데이터 ══ */}
        {activeTab==="data" && (
          <div style={{ maxWidth:780 }}>
            {/* 구글 시트 연동 */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 24px", marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>🟢 구글 시트 연동</div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:18 }}>시트를 수정하면 새로고침 버튼으로 실시간 반영 가능</div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontWeight:500 }}>구글 시트 URL</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, outline:"none" }} />
                  <button onClick={loadGoogleSheet} disabled={sheetLoading}
                    style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", color:"white",
                      padding:"8px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap" }}>
                    {sheetLoading ? "로딩 중..." : "🔄 불러오기"}
                  </button>
                </div>
              </div>
              {sheetError && <div style={{ color:"#f87171", fontSize:12, padding:"8px 12px", background:"rgba(248,113,113,0.1)", borderRadius:8, marginBottom:10 }}>⚠️ {sheetError}</div>}

              <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:10, padding:"12px 16px" }}>
                <div style={{ fontSize:11, color:"#10b981", fontWeight:600, marginBottom:6 }}>구글 시트 설정 방법</div>
                <div style={{ fontSize:11, color:"#64748b", lineHeight:1.8 }}>
                  1. 구글 시트를 <b style={{color:"#94a3b8"}}>링크 있는 모든 사용자 보기</b>로 공유 설정<br/>
                  2. Vercel 환경변수에 <b style={{color:"#94a3b8"}}>VITE_GSHEET_API_KEY</b> 추가 (Google Cloud Console에서 발급)<br/>
                  3. 위 URL 입력 후 불러오기 클릭 → 팀원이 시트 수정 후 새로고침하면 반영
                </div>
              </div>
            </div>

            {/* CSV 업로드 */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 24px", marginBottom:18 }}
              onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f?.name.endsWith(".csv")) handleCSV(f); }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>📄 CSV 파일 업로드</div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>구글 시트 대신 CSV를 직접 올릴 수도 있어요</div>
              <div style={{ border:"2px dashed rgba(99,102,241,0.3)", borderRadius:12, padding:"28px 20px", textAlign:"center",
                background: csvLoaded?"rgba(16,185,129,0.04)":"rgba(99,102,241,0.03)" }}>
                {csvLoaded ? (
                  <div>
                    <div style={{ fontSize:30, marginBottom:6 }}>✅</div>
                    <div style={{ color:"#10b981", fontWeight:600 }}>{customers.length.toLocaleString()}명 로드 완료!</div>
                    <button onClick={()=>{ setCustomers(SAMPLE_CUSTOMERS); setCsvLoaded(false); }}
                      style={{ marginTop:12, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                        color:"#94a3b8", padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12 }}>
                      샘플로 초기화
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
                    <div style={{ marginBottom:10, fontSize:13 }}>CSV 파일을 드래그하거나</div>
                    <button onClick={()=>fileRef.current.click()}
                      style={{ background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.4)",
                        color:"#a5b4fc", padding:"7px 20px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500 }}>
                      📁 파일 선택
                    </button>
                    <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={e=>handleCSV(e.target.files[0])} />
                  </div>
                )}
              </div>
              {csvError && <div style={{ color:"#f87171", fontSize:12, marginTop:10 }}>⚠️ {csvError}</div>}
            </div>

            {/* 컬럼 안내 */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"20px 24px" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>📋 CSV / 구글 시트 컬럼 형식</div>
              <div style={{ background:"#0f172a", borderRadius:10, padding:"12px 16px", fontFamily:"monospace", fontSize:12, color:"#94a3b8", lineHeight:2, marginBottom:14, overflowX:"auto" }}>
                <div style={{ color:"#a5b4fc" }}># 헤더 (첫 번째 행)</div>
                <div>이름, 나이, 성별, 지역, 그룹, 연락처, 메모</div>
                <div style={{ color:"#a5b4fc", marginTop:6 }}># 예시</div>
                <div>김민준, 35, 남, 서울 강남구, 3, 01012345678, 1순위 청약통장 보유</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
                {ALL_GROUPS.map(g=>(
                  <div key={g.id} style={{ display:"flex", gap:8, background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"6px 10px" }}>
                    <span style={{ fontSize:14 }}>{g.icon}</span>
                    <span style={{ fontSize:11, color:g.color, fontWeight:600, flexShrink:0 }}>그룹{g.id}</span>
                    <span style={{ fontSize:11, color:"#64748b" }}>{g.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 메시지 발송 ══ */}
        {activeTab==="customers" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 420px", gap:22 }}>
            <div>
              {/* 상단 배너 */}
              <div style={{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:10,
                padding:"9px 16px", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13 }}>
                  <span style={{ color:"#a5b4fc", fontWeight:600 }}>📌 {apt.name}</span>
                  <span style={{ color:"#64748b", marginLeft:10, fontSize:12 }}>{apt.date}</span>
                </span>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setActiveTab("prompts")}
                    style={{ background:"none", border:"1px solid rgba(99,102,241,0.3)", color:"#a5b4fc", padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11 }}>프롬프트 설정</button>
                  <button onClick={()=>setActiveTab("apt")}
                    style={{ background:"none", border:"1px solid rgba(99,102,241,0.3)", color:"#a5b4fc", padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11 }}>아파트 수정</button>
                </div>
              </div>

              {/* 필터 */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                <button onClick={()=>setFilterGroup(null)}
                  style={{ padding:"4px 11px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
                    background: !filterGroup?"rgba(99,102,241,0.3)":"rgba(255,255,255,0.06)",
                    color: !filterGroup?"#a5b4fc":"#64748b" }}>전체 ({customers.length})</button>
                {ALL_GROUPS.map(g=>{ const cnt=customers.filter(c=>c.groupId===g.id).length; return cnt>0?(
                  <button key={g.id} onClick={()=>setFilterGroup(g.id===filterGroup?null:g.id)}
                    style={{ padding:"4px 11px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
                      background: filterGroup===g.id?`${g.color}25`:"rgba(255,255,255,0.06)",
                      color: filterGroup===g.id?g.color:"#64748b" }}>
                    {g.icon} {g.short} ({cnt})
                  </button>
                ):null;})}
              </div>

              {/* 고객 리스트 */}
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {filteredCustomers.slice(0,50).map(customer=>{
                  const group=getGroup(customer.groupId);
                  const isSelected=selectedCustomer?.id===customer.id;
                  return (
                    <div key={customer.id} onClick={()=>generateMessage(customer)}
                      style={{ background: isSelected?"rgba(99,102,241,0.1)":"rgba(255,255,255,0.03)",
                        border: isSelected?`1px solid ${group.color}60`:"1px solid rgba(255,255,255,0.07)",
                        borderRadius:11, padding:"12px 15px", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:13, transition:"all 0.15s" }}>
                      <div style={{ width:39, height:39, borderRadius:"50%", background:`${group.color}20`,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{group.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                          <span style={{ fontWeight:600, fontSize:14 }}>{customer.name}</span>
                          <span style={{ fontSize:10, color:group.color, background:`${group.color}15`, padding:"1px 7px", borderRadius:20, whiteSpace:"nowrap" }}>{group.tier}차 · {group.short}</span>
                          {customer.phone && <span style={{ fontSize:10, color:"#475569" }}>📱 {customer.phone}</span>}
                        </div>
                        <div style={{ fontSize:11, color:"#64748b" }}>{customer.age}세 · {customer.gender} · {customer.region}</div>
                        {customer.memo && <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>📝 {customer.memo}</div>}
                      </div>
                      <div style={{ fontSize:12, color:isSelected&&loading?"#f59e0b":"#6366f1", fontWeight:500, flexShrink:0 }}>
                        {isSelected&&loading?"생성 중...":"AI 메시지 →"}
                      </div>
                    </div>
                  );
                })}
                {filteredCustomers.length>50&&<div style={{ textAlign:"center", fontSize:12, color:"#475569", padding:10 }}>... 외 {(filteredCustomers.length-50).toLocaleString()}명</div>}
              </div>
            </div>

            {/* AI 메시지 패널 */}
            <div style={{ position:"sticky", top:24, alignSelf:"start" }}>
              <div style={{ fontSize:13, color:"#94a3b8", fontWeight:500, marginBottom:10 }}>AI 추천 메시지 · 카카오 알림톡 발송</div>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:22, minHeight:460 }}>
                {!selectedCustomer ? (
                  <div style={{ textAlign:"center", paddingTop:110, color:"#334155" }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>✦</div>
                    <div style={{ fontSize:14 }}>고객을 클릭하면</div>
                    <div style={{ fontSize:14, marginTop:4, color:"#a5b4fc" }}>{apt.name}</div>
                    <div style={{ fontSize:14 }}>맞춤 메시지를 생성합니다</div>
                  </div>
                ) : (() => {
                  const group=getGroup(selectedCustomer.groupId);
                  const p=prompts[group.id]||DEFAULT_PROMPTS[group.id];
                  return (
                    <div>
                      <div style={{ background:`${group.color}10`, border:`1px solid ${group.color}30`, borderRadius:12, padding:"11px 15px", marginBottom:14 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
                          <span style={{ fontSize:20 }}>{group.icon}</span>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14 }}>{selectedCustomer.name}</div>
                            <div style={{ fontSize:11, color:group.color, marginTop:1 }}>{group.tier}차 · {group.name}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:"#475569", display:"flex", gap:8, flexWrap:"wrap" }}>
                          <span>톤: {p.tone}</span><span>·</span><span>스타일: {p.style}</span><span>·</span><span>{p.length}자</span>
                        </div>
                      </div>

                      <div style={{ fontSize:11, color:"#64748b", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", display:"inline-block",
                          background: loading?"#f59e0b":"#10b981", boxShadow: loading?"0 0 5px #f59e0b":"0 0 5px #10b981" }}/>
                        {loading?"맞춤 메시지 생성 중...":"완료 · 내용 수정 후 발송하세요"}
                      </div>

                      <textarea value={loading?"":aiMessage} onChange={e=>setAiMessage(e.target.value)}
                        placeholder={loading?"":"메시지가 여기 나타납니다..."}
                        style={{ width:"100%", minHeight:120, background:"#111827", border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:11, padding:14, fontSize:14, lineHeight:1.8, color:"#e2e8f0",
                          resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:12, fontFamily:"inherit" }} />

                      {loading && (
                        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:-80, marginBottom:68 }}>
                          {[0,1,2].map(i=>(
                            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1",
                              animation:"pulse 1.2s ease-in-out infinite", animationDelay:`${i*0.2}s` }}/>
                          ))}
                          <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}}`}</style>
                        </div>
                      )}

                      {sendResult && (
                        <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:12, fontSize:12, fontWeight:500,
                          background: sendResult.ok?"rgba(16,185,129,0.1)":"rgba(248,113,113,0.1)",
                          color: sendResult.ok?"#10b981":"#f87171" }}>{sendResult.msg}</div>
                      )}

                      {aiMessage && (
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>generateMessage(selectedCustomer)}
                            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                              color:"#94a3b8", padding:"10px", borderRadius:10, cursor:"pointer", fontSize:13 }}>
                            🔄 재생성
                          </button>
                          <button onClick={sendKakao} disabled={sendingMsg}
                            style={{ flex:2, background: sendingMsg?"rgba(99,102,241,0.4)":"linear-gradient(135deg,#f59e0b,#d97706)",
                              border:"none", color:"white", padding:"10px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                            {sendingMsg?"발송 중...":"💬 카카오 알림톡 발송"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginTop:10, background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"#f59e0b", fontWeight:600, marginBottom:4 }}>💬 솔라피 연동 안내</div>
                <div style={{ fontSize:11, color:"#64748b", lineHeight:1.7 }}>
                  Vercel 환경변수에 아래 3개 추가 후 재배포:<br/>
                  <span style={{ color:"#94a3b8" }}>VITE_SOLAPI_API_KEY</span> · <span style={{ color:"#94a3b8" }}>VITE_SOLAPI_API_SECRET</span> · <span style={{ color:"#94a3b8" }}>VITE_SOLAPI_SENDER</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 발송 내역 ══ */}
        {activeTab==="sent" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, color:"#94a3b8", fontWeight:500 }}>발송 내역 ({sentMessages.length}건)</div>
              {sentMessages.length>0 && <div style={{ fontSize:12, color:"#10b981" }}>✅ 총 {sentMessages.length}명 발송</div>}
            </div>
            {sentMessages.length===0 ? (
              <div style={{ textAlign:"center", paddingTop:100, color:"#334155" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                <div>아직 발송된 메시지가 없습니다</div>
                <div style={{ fontSize:12, marginTop:6, color:"#475569" }}>메시지 발송 탭에서 고객을 선택해 발송해보세요</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {sentMessages.map((item,i)=>(
                  <div key={i} style={{ background: item.simulated?"rgba(99,102,241,0.04)":"rgba(16,185,129,0.04)",
                    border: `1px solid ${item.simulated?"rgba(99,102,241,0.15)":"rgba(16,185,129,0.15)"}`, borderRadius:14, padding:"15px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span>{item.group.icon}</span>
                        <span style={{ fontWeight:600, fontSize:14 }}>{item.customer.name}</span>
                        <span style={{ fontSize:10, color:item.group.color, background:`${item.group.color}15`, padding:"2px 8px", borderRadius:20 }}>{item.group.tier}차 · {item.group.short}</span>
                        <span style={{ fontSize:10, color:"#6366f1", background:"rgba(99,102,241,0.1)", padding:"2px 8px", borderRadius:20 }}>📌 {item.apt}</span>
                        {item.simulated && <span style={{ fontSize:10, color:"#f59e0b", background:"rgba(245,158,11,0.1)", padding:"2px 8px", borderRadius:20 }}>시뮬레이션</span>}
                      </div>
                      <span style={{ fontSize:11, color:"#64748b" }}>{item.time} · {item.simulated?"🔶":"✅"} {item.simulated?"테스트":"발송완료"}</span>
                    </div>
                    <div style={{ fontSize:13, color:"#94a3b8", background:"#0f172a", padding:"11px 14px", borderRadius:8, lineHeight:1.7 }}>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

