import { useState, useCallback } from "react";

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
      { id: 7,  name: "그룹7 MZ 주거",         short: "MZ 주거",  icon: "🏠", color: "#ec4899", count: 986,  desc: "조건부 의사 + 실거주/혼합 + 20~40대" },
      { id: 8,  name: "그룹8 시니어 주거",      short: "시니어",   icon: "🏡", color: "#f97316", count: 1670, desc: "조건부 의사 + 실거주/혼합 + 50~60대" },
      { id: 9,  name: "그룹9 자산 증식",        short: "자산증식", icon: "📈", color: "#84cc16", count: 35,   desc: "조건부 의사 + 투자/증여 목적" },
      { id: 10, name: "그룹10 잠재 수요",       short: "잠재수요", icon: "🎯", color: "#14b8a6", count: 450,  desc: "조건부 의사 + 구매 목적 기타(미정)" },
    ],
  },
];

const ALL_GROUPS = SEGMENTS.flatMap(s => s.groups.map(g => ({ ...g, tier: s.tier, tierLabel: s.tierLabel, tierColor: s.tierColor })));

const DEFAULT_PROMPTS = Object.fromEntries(ALL_GROUPS.map(g => [g.id, {
  tone:  g.id <= 2 ? "부드럽고 부담 없는" : g.id <= 6 ? "적극적이고 설득력 있는" : "공감하며 맞춤 제안하는",
  style: g.id <= 2 ? "정보 제공형" : g.id <= 6 ? "행동 유도형" : "조건 맞춤형",
  extra: "", banned: "", length: "120",
}]));

const DEFAULT_APT = {
  name: "래미안 원베일리 2차", location: "서울 서초구 반포동",
  price: "12억~18억", date: "2026년 4월 15일",
  features: "한강뷰, 초품아, 지하철 3분", supply: "일반공급 320세대", contact: "02-1234-5678",
};

const CUSTOMERS = [
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

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab]       = useState("overview");
  const [apt, setApt]                   = useState(DEFAULT_APT);
  const [aptSaved, setAptSaved]         = useState(true);
  const [prompts, setPrompts]           = useState(DEFAULT_PROMPTS);
  const [promptSaved, setPromptSaved]   = useState(true);
  const [editingGroup, setEditingGroup] = useState(3);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [aiMessage, setAiMessage]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [sentMessages, setSentMessages] = useState([]);
  const [filterGroup, setFilterGroup]   = useState(null);
  const [sendDone, setSendDone]         = useState(false);

  const getGroup = id => ALL_GROUPS.find(g => g.id === id) || ALL_GROUPS[0];
  const totalCount = ALL_GROUPS.reduce((s, g) => s + g.count, 0);
  const filteredCustomers = filterGroup ? CUSTOMERS.filter(c => c.groupId === filterGroup) : CUSTOMERS;

  const generateMessage = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    setAiMessage("");
    setLoading(true);
    setSendDone(false);
    const group = getGroup(customer.groupId);
    const p = prompts[group.id] || DEFAULT_PROMPTS[group.id];

    const prompt = `당신은 부동산 청약 분양 전문 CRM 마케터입니다.

[현재 분양 아파트]
- 아파트명: ${apt.name} / 위치: ${apt.location}
- 분양가: ${apt.price} / 청약일: ${apt.date}
- 특징: ${apt.features} / 공급: ${apt.supply}

[고객 정보]
- 이름: ${customer.name} / 나이: ${customer.age}세 / 성별: ${customer.gender}
- 지역: ${customer.region}
- 세그먼트: ${group.tier}차 ${group.tierLabel} - ${group.name}
- 특성: ${group.desc}
- 메모: ${customer.memo || "없음"}

[이 세그먼트 전용 메시지 설정]
- 말투/톤: ${p.tone}
- 스타일: ${p.style}
- 추가 지시: ${p.extra || "없음"}
- 금지 표현: ${p.banned || "없음"}
- 목표 글자 수: ${p.length}자 내외

위 설정을 반영해서 카카오 알림톡 메시지를 작성해주세요.
이름 포함, 이모지 1~2개, 아파트명·청약일 자연스럽게 포함.
메시지 텍스트만 출력하세요.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      setAiMessage(data.content?.map(i => i.text || "").join("") || "생성 실패");
    } catch (e) {
      setAiMessage("오류: " + e.message);
    }
    setLoading(false);
  }, [apt, prompts]);

  const handleSend = () => {
    if (!aiMessage || !selectedCustomer) return;
    const group = getGroup(selectedCustomer.groupId);
    setSentMessages(prev => [{ customer: selectedCustomer, message: aiMessage, group, apt: apt.name, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
    setSendDone(true);
    setTimeout(() => { setAiMessage(""); setSelectedCustomer(null); setSendDone(false); }, 1500);
  };

  const updatePrompt = (field, val) => {
    setPrompts(p => ({ ...p, [editingGroup]: { ...p[editingGroup], [field]: val } }));
    setPromptSaved(false);
  };

  const tabs = [
    { key: "overview",   label: "📊 세그먼트" },
    { key: "apt",        label: "🏢 아파트 설정" },
    { key: "prompts",    label: "✏️ 프롬프트" },
    { key: "customers",  label: "💬 메시지 발송" },
    { key: "sent",       label: "📋 발송 내역" },
  ];

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: "#0b0f1e", minHeight: "100vh", color: "#e2e8f0", fontSize: 14 }}>
      <style>{`
        @keyframes pulse { 0%,80%,100%{transform:scale(0.7);opacity:0.3} 40%{transform:scale(1.1);opacity:1} }
        button:hover { opacity: 0.85; }
        * { box-sizing: border-box; }
        textarea, input { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b 60%,#0f172a)", borderBottom: "1px solid rgba(99,102,241,0.25)", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏢</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>청약 CRM AI 메시지 센터</div>
              <div style={{ fontSize: 10, color: "#a5b4fc" }}>Claude AI · 10 세그먼트 · 카카오 알림톡</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                  background: activeTab === t.key ? "rgba(99,102,241,0.35)" : "transparent",
                  color: activeTab === t.key ? "#a5b4fc" : "#94a3b8", transition: "all 0.15s" }}>{t.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span style={{ fontSize: 11, color: "#10b981" }}>{totalCount.toLocaleString()}명</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 24px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ══ 세그먼트 현황 ══ */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
              {SEGMENTS.map(seg => (
                <div key={seg.tier} style={{ background: seg.tierBg, border: `1px solid ${seg.tierBorder}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: seg.tierColor, fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>{seg.tier}차 분류</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{seg.tierLabel}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: seg.tierColor }}>{seg.groups.reduce((s,g)=>s+g.count,0).toLocaleString()}명</div>
                  </div>
                  {seg.groups.map(g => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "6px 10px", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{g.icon}</span>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>{g.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.count.toLocaleString()}명</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 비율 바 */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 22px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, fontWeight: 500 }}>전체 세그먼트 비율</div>
              <div style={{ display: "flex", height: 18, borderRadius: 9, overflow: "hidden", gap: 2 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} title={`${g.name}: ${g.count}명`}
                    style={{ width: `${(g.count/totalCount*100).toFixed(1)}%`, background: g.color, transition: "all 0.3s" }} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: g.color }} />
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{g.short} {(g.count/totalCount*100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 세그먼트 상세 */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 14 }}>세그먼트 정의 및 타겟팅 로직</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 7 }}>
                {ALL_GROUPS.map(g => (
                  <div key={g.id} style={{ display: "flex", gap: 9, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "9px 12px", border: `1px solid ${g.color}18` }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{g.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: g.color, marginBottom: 2 }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{g.desc}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0 }}>{g.count.toLocaleString()}명</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 아파트 설정 ══ */}
        {activeTab === "apt" && (
          <div style={{ maxWidth: 620 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>🏢 현재 분양 아파트 정보</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>여기 입력한 정보가 모든 AI 메시지에 자동 반영됩니다</div>
                </div>
                <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20,
                  background: aptSaved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color: aptSaved ? "#10b981" : "#f59e0b" }}>{aptSaved ? "✅ 저장됨" : "● 미저장"}</div>
              </div>
              {[["아파트명 *","name","예: 래미안 원베일리 2차"],["위치 *","location","예: 서울 서초구 반포동"],
                ["청약일 *","date","예: 2026년 4월 15일"],["분양가","price","예: 12억~18억"],
                ["주요 특징","features","예: 한강뷰, 초품아"],["공급 세대","supply","예: 일반공급 320세대"],
                ["문의 연락처","contact","예: 02-1234-5678"]].map(([label, key, ph]) => (
                <Field key={key} label={label} value={apt[key]} placeholder={ph}
                  onChange={v => { setApt(p => ({ ...p, [key]: v })); setAptSaved(false); }} />
              ))}
              <button onClick={() => setAptSaved(true)}
                style={{ width: "100%", marginTop: 6, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
                  color: "white", padding: "11px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                💾 저장하고 메시지에 반영하기
              </button>
            </div>
            <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, marginBottom: 8 }}>📋 현재 설정</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["아파트명",apt.name],["위치",apt.location],["청약일",apt.date],["분양가",apt.price],["특징",apt.features],["공급",apt.supply]].map(([k,v]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "6px 10px" }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{v||"-"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 프롬프트 설정 ══ */}
        {activeTab === "prompts" && (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>세그먼트 선택</div>
              {SEGMENTS.map(seg => (
                <div key={seg.tier}>
                  <div style={{ fontSize: 10, color: seg.tierColor, fontWeight: 700, letterSpacing: 1, padding: "5px 8px 3px" }}>{seg.tier}차 · {seg.tierLabel}</div>
                  {seg.groups.map(g => (
                    <button key={g.id} onClick={() => setEditingGroup(g.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 3,
                        background: editingGroup === g.id ? `${g.color}20` : "rgba(255,255,255,0.03)",
                        borderLeft: editingGroup === g.id ? `3px solid ${g.color}` : "3px solid transparent" }}>
                      <span style={{ fontSize: 15 }}>{g.icon}</span>
                      <span style={{ fontSize: 11, color: editingGroup === g.id ? g.color : "#94a3b8", fontWeight: editingGroup === g.id ? 600 : 400 }}>{g.short}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {(() => {
              const group = getGroup(editingGroup);
              const p = prompts[editingGroup] || DEFAULT_PROMPTS[editingGroup];
              return (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontSize: 22 }}>{group.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: group.color }}>{group.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{group.desc}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20,
                      background: promptSaved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color: promptSaved ? "#10b981" : "#f59e0b" }}>{promptSaved ? "✅ 저장됨" : "● 미저장"}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>말투 / 톤</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {["부드럽고 부담 없는","친근하고 따뜻한","격식 있고 신뢰감 있는","적극적이고 설득력 있는","공감하며 맞춤 제안하는","간결하고 임팩트 있는"].map(t => (
                          <button key={t} onClick={() => updatePrompt("tone", t)}
                            style={{ padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11,
                              background: p.tone === t ? `${group.color}30` : "rgba(255,255,255,0.06)",
                              color: p.tone === t ? group.color : "#64748b" }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>메시지 스타일</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {["정보 제공형","행동 유도형","조건 맞춤형","혜택 강조형","긴박감 강조형","감성 공략형"].map(s => (
                          <button key={s} onClick={() => updatePrompt("style", s)}
                            style={{ padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11,
                              background: p.style === s ? `${group.color}30` : "rgba(255,255,255,0.06)",
                              color: p.style === s ? group.color : "#64748b" }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>목표 글자 수</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["80","100","120","150"].map(n => (
                        <button key={n} onClick={() => updatePrompt("length", n)}
                          style={{ padding: "4px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12,
                            background: p.length === n ? `${group.color}30` : "rgba(255,255,255,0.06)",
                            color: p.length === n ? group.color : "#64748b" }}>{n}자</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>추가 지시사항</div>
                    <textarea value={p.extra} onChange={e => updatePrompt("extra", e.target.value)}
                      placeholder="예: 청약일 반드시 강조, 잔여세대 언급, 상담 신청 유도"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 12, outline: "none", resize: "vertical", minHeight: 60 }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>금지 표현</div>
                    <input value={p.banned} onChange={e => updatePrompt("banned", e.target.value)}
                      placeholder="예: 저렴한, 싼, 마지막 기회"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
                  </div>

                  <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, marginBottom: 5 }}>현재 설정 요약</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>
                      <span style={{ color: group.color }}>톤:</span> {p.tone} &nbsp;·&nbsp;
                      <span style={{ color: group.color }}>스타일:</span> {p.style} &nbsp;·&nbsp;
                      <span style={{ color: group.color }}>길이:</span> {p.length}자
                      {p.extra && <><br/><span style={{ color: group.color }}>지시:</span> {p.extra}</>}
                      {p.banned && <><br/><span style={{ color: "#f87171" }}>금지:</span> {p.banned}</>}
                    </div>
                  </div>

                  <button onClick={() => setPromptSaved(true)}
                    style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
                      color: "white", padding: "10px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    💾 이 세그먼트 프롬프트 저장
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ 메시지 발송 ══ */}
        {activeTab === "customers" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
            <div>
              <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 9,
                padding: "8px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12 }}>
                  <span style={{ color: "#a5b4fc", fontWeight: 600 }}>📌 {apt.name}</span>
                  <span style={{ color: "#64748b", marginLeft: 10, fontSize: 11 }}>{apt.date}</span>
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setActiveTab("prompts")} style={{ background: "none", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 6, cursor: "pointer", fontSize: 10 }}>프롬프트 설정</button>
                  <button onClick={() => setActiveTab("apt")} style={{ background: "none", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 6, cursor: "pointer", fontSize: 10 }}>아파트 수정</button>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                <button onClick={() => setFilterGroup(null)}
                  style={{ padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 10,
                    background: !filterGroup ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                    color: !filterGroup ? "#a5b4fc" : "#64748b" }}>전체 ({CUSTOMERS.length})</button>
                {ALL_GROUPS.map(g => { const cnt = CUSTOMERS.filter(c => c.groupId === g.id).length; return cnt > 0 ? (
                  <button key={g.id} onClick={() => setFilterGroup(g.id === filterGroup ? null : g.id)}
                    style={{ padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 10,
                      background: filterGroup === g.id ? `${g.color}25` : "rgba(255,255,255,0.06)",
                      color: filterGroup === g.id ? g.color : "#64748b" }}>
                    {g.icon} {g.short} ({cnt})
                  </button>
                ) : null; })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredCustomers.map(customer => {
                  const group = getGroup(customer.groupId);
                  const isSelected = selectedCustomer?.id === customer.id;
                  return (
                    <div key={customer.id} onClick={() => generateMessage(customer)}
                      style={{ background: isSelected ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                        border: isSelected ? `1px solid ${group.color}60` : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10, padding: "11px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 11, transition: "all 0.15s" }}>
                      <div style={{ width: 37, height: 37, borderRadius: "50%", background: `${group.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{group.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{customer.name}</span>
                          <span style={{ fontSize: 10, color: group.color, background: `${group.color}15`, padding: "1px 7px", borderRadius: 20 }}>{group.tier}차 · {group.short}</span>
                          <span style={{ fontSize: 10, color: "#475569" }}>📱 {customer.phone}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{customer.age}세 · {customer.gender} · {customer.region}</div>
                        {customer.memo && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>📝 {customer.memo}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: isSelected && loading ? "#f59e0b" : "#6366f1", fontWeight: 500, flexShrink: 0 }}>
                        {isSelected && loading ? "생성 중..." : "AI 메시지 →"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI 메시지 패널 */}
            <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 8 }}>AI 추천 메시지 · 카카오 알림톡</div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, minHeight: 420 }}>
                {!selectedCustomer ? (
                  <div style={{ textAlign: "center", paddingTop: 90, color: "#334155" }}>
                    <div style={{ fontSize: 34, marginBottom: 10 }}>✦</div>
                    <div style={{ fontSize: 13 }}>고객을 클릭하면</div>
                    <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 4 }}>{apt.name}</div>
                    <div style={{ fontSize: 13 }}>맞춤 메시지를 생성합니다</div>
                  </div>
                ) : (() => {
                  const group = getGroup(selectedCustomer.groupId);
                  const p = prompts[group.id] || DEFAULT_PROMPTS[group.id];
                  return (
                    <div>
                      <div style={{ background: `${group.color}10`, border: `1px solid ${group.color}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 19 }}>{group.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedCustomer.name}</div>
                            <div style={{ fontSize: 10, color: group.color, marginTop: 1 }}>{group.tier}차 · {group.name}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>톤: {p.tone} · 스타일: {p.style} · {p.length}자</div>
                      </div>

                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block",
                          background: loading ? "#f59e0b" : "#10b981", boxShadow: loading ? "0 0 5px #f59e0b" : "0 0 5px #10b981" }} />
                        {loading ? "Claude가 맞춤 메시지 생성 중..." : "생성 완료 · 수정 후 발송하세요"}
                      </div>

                      <div style={{ position: "relative" }}>
                        <textarea value={loading ? "" : aiMessage} onChange={e => setAiMessage(e.target.value)}
                          placeholder={loading ? "" : "메시지가 여기 나타납니다..."}
                          style={{ width: "100%", minHeight: 110, background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10, padding: 13, fontSize: 13, lineHeight: 1.8, color: "#e2e8f0",
                            resize: "vertical", outline: "none", marginBottom: 12 }} />
                        {loading && (
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", gap: 6 }}>
                            {[0,1,2].map(i => (
                              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1",
                                animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {sendDone && (
                        <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 500,
                          background: "rgba(16,185,129,0.1)", color: "#10b981", textAlign: "center" }}>
                          ✅ {selectedCustomer?.name}님께 카카오 알림톡 발송 완료!
                        </div>
                      )}

                      {aiMessage && !sendDone && (
                        <div style={{ display: "flex", gap: 7 }}>
                          <button onClick={() => generateMessage(selectedCustomer)}
                            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                              color: "#94a3b8", padding: "9px", borderRadius: 9, cursor: "pointer", fontSize: 12 }}>
                            🔄 재생성
                          </button>
                          <button onClick={handleSend}
                            style={{ flex: 2, background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none",
                              color: "white", padding: "9px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            💬 카카오 알림톡 발송
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
        {activeTab === "sent" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>발송 내역 ({sentMessages.length}건)</div>
              {sentMessages.length > 0 && <div style={{ fontSize: 11, color: "#10b981" }}>✅ 총 {sentMessages.length}명 발송 완료</div>}
            </div>
            {sentMessages.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 100, color: "#334155" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div>아직 발송된 메시지가 없습니다</div>
                <div style={{ fontSize: 11, marginTop: 6, color: "#475569" }}>메시지 발송 탭에서 고객을 선택해 발송해보세요</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {sentMessages.map((item, i) => (
                  <div key={i} style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span>{item.group.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.customer.name}</span>
                        <span style={{ fontSize: 10, color: item.group.color, background: `${item.group.color}15`, padding: "1px 7px", borderRadius: 20 }}>{item.group.tier}차 · {item.group.short}</span>
                        <span style={{ fontSize: 10, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 7px", borderRadius: 20 }}>📌 {item.apt}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{item.time} · 💬 발송완료</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", background: "#0f172a", padding: "10px 13px", borderRadius: 8, lineHeight: 1.7 }}>{item.message}</div>
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
