import { useState, useCallback, useRef } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

const TEMPLATES = [
  {id:0,title:"[브랜드] 무순위 청약 안내(2차)",content:"[브랜드] 무순위 청약 안내\n \n무순위 청약일정을 안내 드리며, 풍성하고 정겨운 설 명절 보내시길 바랍니다.\n\n▶무순위 일정안내\n - 무순위 모집공고 : 02월 13일(금)\n - 무순위 청약접수 : 02월 23일(월)\n - 무순위 청약방법 : 하단 청약홈 홈페이지\n\n■ 무순위 청약자격\n - 무순위 모집공고일 현재 무주택 세대구성원\n - 청약통장 가입여부와 무관하게 신청 가능"},
  {id:1,title:"견본주택 운영안내",content:"[브랜드 견본주택 운영 안내]\n\n고객님의 성원에 힘입어 정당계약이 성황리에 마무리 되었습니다.\n견본주택 운영 관련하여 안내드리니 참고하시어 견본주택 방문에 착오 없으시길 바랍니다.\n\n▶ 일정 안내\n → 2월 13(금)~14(토) - 관람가능\n → 2월 15(일)~18(수) - 설연휴 휴관"},
  {id:2,title:"[브랜드] 문자 발송 테스트",content:"[브랜드] 문자 발송 테스트"},
  {id:3,title:"예비입주자 추첨 및 계약 안내",content:"[브랜드 예비입주자 추첨 및 계약 안내]\n\n★ 동·호수 추첨 이후 즉시 계약 체결을 진행하므로 계약금 입금과 관련한 사항은 사전에 준비해주시기 바랍니다.\n\n▶ 일정\n - 2026. 2. 12(목)\n - 입장 : 9시30분부터 10시까지 입장 마감"},
  {id:4,title:"무순위 계약 안내(당일)",content:"[브랜드]무순위 계약 안내\n\n▷금일은 무순위 계약일입니다.\n\n[무순위 계약 일정]\n- 계약 장소 : 브랜드 견본주택\n※ 계약 후 감사의 마음을 담은 사은품도 꼭 받아가세요!"},
  {id:5,title:"브랜드 무순위(2차) 정당계약 안내",content:"[브랜드 무순위(2차) 정당계약 안내]\n\n▶ 정당계약 일정 안내\n- 계약기간 : 2월 10일(화)~11일(수), 10:00 ~ 17:00\n- 계약장소 : 브랜드 견본주택"},
  {id:6,title:"브랜드 무순위(2차) 예비당첨자 추첨 및 계약 안내",content:"[브랜드 무순위(2차) 예비당첨자 추첨 및 계약 안내]\n\n▶ 일정 안내\n- 입장시간 : 09:30 입장 ~ 10:00 입장마감\n- 계약시간 : 10:00 ~ 17:00"},
  {id:7,title:"브랜드 무순위(2차) 정당계약 안내",content:"[브랜드 무순위(2차) 정당계약 안내]\n\n2월 10일, 2월 11일은 브랜드 무순위(2차) 정당계약일 입니다."},
  {id:8,title:"무순위 계약 안내",content:"[브랜드] 무순위 계약 안내\n\n▷브랜드에 당첨을 축하드립니다.\n▷원활한 계약 진행을 위해 방문 예약제를 진행합니다."},
  {id:9,title:"계약 안내",content:"[브랜드 당첨자 계약 안내]\n\n▣ 정당계약 안내\n■ 계약기간: 2월 8일(일) ~ 2월 10일(화)\n   오전 10:00 ~ 오후 4:00까지 입장"},
  {id:10,title:"무순위 서류접수 안내",content:"[브랜드] 무순위 서류접수 안내\n\n▷브랜드 당첨을 축하드립니다.\n▷당첨자 자격 확인을 위한 서류접수 일정을 안내드립니다."},
  {id:11,title:"브랜드_플러스옵션 계약서 지참 안내",content:"[브랜드 플러스옵션 계약서 지참 안내]\n\n플러스옵션 계약서 관련 내부 검토 결과, 계약서 상에 옵션 항목 일부 누락으로 계약서 교체가 필요한 세대로 확인되었습니다."},
  {id:12,title:"브랜드_견본주택 폐관 안내",content:"[브랜드 견본주택 폐관 안내]\n\n▶ 견본주택 폐관 일정 : 26.02.06(금) 이후\n- 견본주택 관람은 불가하며, 분양관련 제반업무만 진행됩니다."},
  {id:13,title:"브랜드_공동명의 전자계약 및 중도금 대출 신청 안내",content:"[브랜드 배우자 공동명의 전자계약 및 중도금 대출 신청 안내]\n\n▶ 배우자 공동명의 전자계약 및 중도금 대출 신청 일정 : 2026.02.05(목) ~ 06(금), 10:00 ~ 16:00\n▶ 장소 : 브랜드 견본주택 3층"},
  {id:14,title:"무순위 청약 안내",content:"[브랜드] 무순위 청약 안내\n\n★금일은 브랜드 무순위 청약일 입니다.\n\n▶무순위 일정 안내\n - 무순위 청약일 : 02.02(월)\n - 당첨자 발표 : 02.05(목)"},
  {id:15,title:"예비 입주자 서류접수 안내",content:"[브랜드 예비 입주자 서류접수 안내]\n\n브랜드의 예비 입주자 당첨을 진심으로 축하드립니다.\n\n예비 입주자 서류접수 기간은 2월 5일(목)까지 서류 접수 가능합니다."},
  {id:16,title:"서류접수 안내",content:"[브랜드 당첨자 서류접수 안내]\n\n브랜드의 당첨자로 선정되신 것을 진심으로 축하드립니다.\n\n당첨자 서류접수 기간은 오는 2월 3일(화)까지 입니다."},
  {id:17,title:"[브랜드] 부동산 MGM안내",content:"[브랜드] 마곡 바로 옆, 1억원대 즉시 입주!\n\n★실시간 잔여세대 급감! 선착순 계약중!★\n\n■ 부동산MGM 안내\n- 추천고객이 정계약 완료시 해당 중개업소에 수수료 지급\n- 지급 수수료 : 세대당 500만원(전 타입)"},
  {id:18,title:"브랜드 단지내 상가 공개 입찰 고지 1/31",content:"브랜드 단지내 상가\n고객님, 안녕하십니까?\n'브랜드 단지내 상가' 공개 입찰이 1월 31일 진행될 예정입니다.\n\n▣ 특장점\n① 우수한 입지의 항아리 상권\n② 전 호실 1억원대 합리적인 분양가"},
  {id:19,title:"브랜드 단지내 상가 입찰고지 1/31",content:"[브랜드 단지내 상가]\n고객님, 안녕하십니까?\n'브랜드 단지내 상가' 공개 입찰이 1월 31일 진행될 예정입니다.\n\n▣ 특장점\n① 안정적인 배후 수요\n② 합리적인 2~3억원대 분양가"},
  {id:20,title:"브랜드 단지내 상가 공개 입찰 예정 1/31",content:"브랜드 단지내 상가\n'브랜드 단지내 상가' 공개 입찰 예정입니다.\n\n▣ 공급 방식 : 내정가 공개 경쟁 입찰\n▣ 입찰 일정 : 2026년 1월 31일 오전 10:00"},
  {id:21,title:"무효자 서류제출 안내",content:"[브랜드] 무효자 서류제출 안내\n\n세대내 중복청약한 경우 혼인관계임을 확인하여 무효처리하여 통장 재사용이 가능함을 알려 드립니다."},
  {id:22,title:"무순위 청약일정 안내",content:"[브랜드] 무순위 청약일정 안내\n\n브랜드 무순위 일정을 안내 드립니다.\n\n▶무순위 일정안내\n - 무순위 모집공고 : '26.01.28(수)\n - 무순위 청약접수 : '26.02.02(월)"},
  {id:23,title:"당첨자 발표 안내",content:"[브랜드 당첨자 서류접수 안내]\n\n브랜드의 당첨자로 선정되신 것을 진심으로 축하드리며, 당첨자 서류접수 일정을 아래와 같이 안내해 드립니다."},
  {id:24,title:"관람안내",content:"[브랜드]\n\n■ 일반 관람 불가 안내\n브랜드는 1월 28일(수)부터 당첨자 서류접수 진행으로 인해 일반관람을 제한 하오니 이점 양지하시어 착오 없으시길 바랍니다."},
  {id:25,title:"예당 추첨 및 계약 안내(2차)",content:"[브랜드]예비입주자 동호추첨 및 계약 안내\n\n▷브랜드의 예비 당첨을 축하드립니다.\n\n▶일반공급 동호추첨 및 계약일정\n - 입장시간 : 13:30 ~ 14:00까지 입장"},
  {id:26,title:"예당 추첨 및 계약 안내(1차)",content:"[브랜드]예비입주자 동호추첨 및 계약 안내\n\n▷브랜드의 예비 당첨을 축하드립니다.\n\n▶일반공급 동호추첨 및 계약일정\n - 입장시간 : 11:30 ~ 12:00까지 입장"},
  {id:27,title:"예비입주자 동호추첨 및 계약안내(특공)",content:"[브랜드]예비입주자 동호추첨 및 계약 안내\n\n▶특별공급 동호추첨 및 계약일정\n - 입장시간 : 09:30 ~ 10:00까지 입장"},
  {id:28,title:"2순위 청약 안내",content:"[브랜드 2순위 청약안내]\n\n'브랜드' 청약할 수 있는 마지막 기회!\n오늘은 2순위 청약일입니다.\n\n▶ 2순위 청약 Check Point\n- 청약 통장 보유 기간 상관없이 청약 가능"},
  {id:29,title:"브랜드 강마루 색상선택 접수결과",content:"[건설 브랜드]\n브랜드 강마루 색상선택 접수결과를 다음과 같이 안내드립니다."},
  {id:30,title:"1순위 청약 안내",content:"[브랜드 청약안내]\n\n오늘은 '브랜드' 1순위 청약일입니다.\n\n▶ 1순위 청약 Check Point\n- 만19세 이상 세대주, 세대원 누구나 청약가능\n- 유주택자도 청약가능\n- 재당첨제한 상관없이 청약 가능"},
  {id:31,title:"브랜드_중도금대출 안내",content:"[브랜드 중도금 대출 신청 및 사전 방문 예약 안내]\n\n배우자 공동명의 전자계약 및 중도금 대출 신청을 진행하고자 하오니, 필히 사전 방문 예약 후 견본주택을 방문해 주시기 바랍니다."},
  {id:32,title:"특별공급 안내",content:"[브랜드 청약안내]\n\n오늘은 '브랜드' 특별공급 청약일입니다.\n\n▶ 특별공급 청약 안내\n▷ 접수대상 : 기관추천, 다자녀가구, 신혼부부, 노부모부양, 생애최초"},
  {id:33,title:"정당계약1일차(부적격제외)",content:"[브랜드]당첨자 계약 안내\n\n▷오늘은 정당계약 1일차입니다.\n\n- 계약 기간 : 1/19일(월) ~ 1/21일(수)\n- 계약 장소 : 브랜드 견본주택"},
  {id:34,title:"정당계약안내(필수서류)",content:"[브랜드] 당첨자 계약 안내\n\n▷브랜드에 당첨을 축하드리며, 원활한 계약 진행을 위해 방문 예약제를 진행하오니 양지 바랍니다."},
  {id:35,title:"브랜드 오픈",content:"[브랜드 GRAND OPENING]\n\n◆\"브랜드 견본주택\" 개관 ◆\n\n■ 일정 안내\n- 견본주택 개관 : 1/16(금) 오전 10시\n- 특별공급 : 1/20(화)\n- 1순위 : 1/21(수)\n- 2순위 : 1/22(목)"},
  {id:36,title:"정당계약 예약안내",content:"[브랜드] 당첨자 계약 안내\n\n▷브랜드에 당첨을 축하드리며, 원활한 계약 진행을 위해 방문 예약제를 진행하오니 양지 바랍니다.\n\n[방문 예약 안내]\n - 방문 예약 방법 : 당사 홈페이지 예약 접수"},
  {id:37,title:"브랜드 무순위 계약 안내",content:"[브랜드 무순위 계약 안내]\n\n오늘은 브랜드 무순위 계약일 입니다.\n\n▶ 계약 일정 안내\n - 계약기간 : 1월 16일(금), 10:00 ~ 17:00"},
  {id:38,title:"브랜드 오픈고지",content:"[브랜드 GRAND OPENING]\n\n◆\"브랜드 견본주택\" 개관 ◆\n\n■ Hello 2026, 웰컴 이벤트\n- \"Lucky 타임 이벤트\"\n- \"Fly 에어볼을 잡아라!\"\n- \"Smile 네컷\""},
  {id:39,title:"브랜드 플러스옵션 추가/변경 계약",content:"[브랜드 플러스옵션 추가/변경 계약 안내]\n\n▷ 플러스옵션 추가/변경 계약 일정 : 2026.01.15(목) ~ 01.17(토), 10:00 ~ 17:00"},
  {id:40,title:"브랜드 부동산 MGM 안내",content:"브랜드\n★부동산 MGM 서류 제출 안내★\n\n▶기간 : 1월 12일(월)~1월 19일(월)\n▶장소 : 브랜드 견본주택\n▶운영시간: 10:00~17:00"},
  {id:41,title:"미접수부적격안내(예당)",content:"[브랜드] 서류 미접수자 및 부적격 소명 안내\n\n귀하는 예비입주자로 선정되셨으나, 자격 확인을 위한 서류를 제출하지 않으셨기에 안내드립니다."},
  {id:42,title:"미접수부적격안내(정당)",content:"[브랜드] 서류 미접수자 및 부적격 소명 안내\n\n귀하는 당첨자로 선정되셨으나, 자격 확인을 위한 서류를 제출하지 않으셨기에 안내드립니다."},
  {id:43,title:"브랜드 배우자 공동명의",content:"[브랜드 배우자 공동명의 서류 접수 안내]\n\n▷ 배우자 공동명의 서류 접수 일정 : 2026.01.15(목) ~ 01.17(토), 10:00 ~ 17:00\n▷ 장소 : 브랜드 견본주택 3층"},
  {id:44,title:"(광고) 브랜드 무순위 청약 안내",content:"(광고) 브랜드 무순위 청약 안내\n\n오늘은 브랜드 무순위 청약접수일입니다.\n\n◈ 무순위 청약 Check Point\n- 수도권 거주자 (경기·서울·인천 거주자 청약 가능)\n- 무주택세대구성원"},
  {id:45,title:"MGM 안내",content:"■브랜드 협력중개업소 MGM안내\n\n▶ 중개업소등록\n기간 : 2026년 1월 12일(월) 10:00 ~ 2026년 1월 19일(월) 17:00 까지\n방법 : MGM 홈페이지 회원가입 후 고객 정보 등록"},
  {id:46,title:"옵션안내문 84A",content:"샘플"},
  {id:47,title:"서류접수 안내(정당)",content:"[브랜드] 서류접수 안내\n\n▷ 브랜드 당첨을 축하드립니다.\n▷ 오늘부터 서류접수을 진행합니다. 서류 미제출 시 계약체결이 불가합니다.\n\n- 서류접수 기간 : 1/10일(토) ~ 1/13일(화) / 10시~17시"},
  {id:48,title:"서류접수 안내(예비)",content:"[브랜드] 서류접수 안내\n\n▷ 브랜드 예비당첨을 축하드립니다.\n▷ 오늘부터 서류접수을 진행합니다. 서류 미제출 시 계약체결이 불가합니다."},
  {id:49,title:"Grand Opening",content:"[브랜드 1월 16일 GRAND OPENING]\n\n오산이 바라던 새로운 도시의 시작!\n\n▶1월 16일(금) 오전 10:00 \"브랜드 견본주택\" 개관◀\n\n■ Hello 2026, 웰컴 이벤트\n다양한 이벤트와 푸짐한 경품이 행운의 주인공을 기다립니다."},
];

const TEMPLATE_MAPPING = {
  1:[35,38,49,24,17], 2:[17,45,35,38,24],
  3:[30,33,34,47,35], 4:[32,27,28,15,16],
  5:[28,26,25,15,48], 6:[44,0,14,22,4],
  7:[35,49,38,24,1],  8:[35,49,13,43,24],
  9:[18,19,20,17,45], 10:[14,0,35,24,22],
  99:[35,49,0,2,38],
};

const SEGMENTS = [
  { tier:"1차", tierLabel:"거절/관망", tierColor:"#94a3b8", tierBg:"rgba(148,163,184,0.08)", tierBorder:"rgba(148,163,184,0.25)",
    groups:[
      {id:1,name:"그룹1 거절 및 관망",short:"거절·관망",icon:"🚫",color:"#94a3b8",desc:"청약 의사 없음 + 분양 일정 몰랐음"},
      {id:2,name:"그룹2 관심도",short:"관심도",icon:"👀",color:"#64748b",desc:"청약 의사 없음 + 분양 일정 알고 있었음"},
    ]},
  { tier:"2차", tierLabel:"즉시 전환", tierColor:"#6366f1", tierBg:"rgba(99,102,241,0.08)", tierBorder:"rgba(99,102,241,0.25)",
    groups:[
      {id:3,name:"그룹3 VIP 즉시 전환 1",short:"VIP 전환1",icon:"👑",color:"#f59e0b",desc:"청약 의사 있음 + 1순위 자격"},
      {id:4,name:"그룹4 VIP 즉시 전환 2",short:"VIP 전환2",icon:"💎",color:"#a855f7",desc:"청약 의사 있음 + 특별공급 자격"},
      {id:5,name:"그룹5 청약 가능성 1",short:"청약가능1",icon:"⭐",color:"#10b981",desc:"청약 의사 있음 + 2순위 자격"},
      {id:6,name:"그룹6 청약 가능성 2",short:"청약가능2",icon:"🌟",color:"#06b6d4",desc:"청약 의사 있음 + 무순위 자격"},
    ]},
  { tier:"3차", tierLabel:"조건부 유입", tierColor:"#f59e0b", tierBg:"rgba(245,158,11,0.08)", tierBorder:"rgba(245,158,11,0.25)",
    groups:[
      {id:7,name:"그룹7 MZ 주거",short:"MZ 주거",icon:"🏠",color:"#ec4899",desc:"조건부 의사 + 실거주/혼합 + 20~40대"},
      {id:8,name:"그룹8 시니어 주거",short:"시니어",icon:"🏡",color:"#f97316",desc:"조건부 의사 + 실거주/혼합 + 50~60대"},
      {id:9,name:"그룹9 자산 증식",short:"자산증식",icon:"📈",color:"#84cc16",desc:"조건부 의사 + 투자/증여 목적"},
      {id:10,name:"그룹10 잠재 수요",short:"잠재수요",icon:"🎯",color:"#14b8a6",desc:"조건부 의사 + 구매 목적 기타(미정)"},
    ]},
  { tier:"테스트", tierLabel:"SMS 테스트", tierColor:"#10b981", tierBg:"rgba(16,185,129,0.08)", tierBorder:"rgba(16,185,129,0.25)",
    groups:[
      {id:99,name:"🧪 테스트 그룹",short:"테스트",icon:"🧪",color:"#10b981",desc:"실제 SMS 발송 테스트용 — 본인 번호로 확인"},
    ]},
];
const ALL_GROUPS = SEGMENTS.flatMap(s=>s.groups.map(g=>({...g,tier:s.tier,tierLabel:s.tierLabel,tierColor:s.tierColor})));

function classifyGroup(row){
  const 의사=(row['청약의사']||'').trim(), 자격=(row['청약자격']||'').trim();
  const 목적=(row['구매목적']||'').trim(), 나이=(row['나이']||'').trim();
  const 분양=(row['분양 일정']||'').trim();
  if(의사==='없다') return (분양.includes('모른')||분양.includes('몰랐'))?1:2;
  if(의사==='있다'){
    if(자격.includes('1순위')) return 3;
    if(자격.includes('특별공급')) return 4;
    if(자격.includes('2순위')) return 5;
    return 6;
  }
  if(목적==='투자'||목적==='증여') return 9;
  if(목적==='기타') return 10;
  return ['20대','30대','40대'].includes(나이)?7:8;
}

function parseCSV(text){
  const lines=text.trim().split('\n').filter(l=>l.trim());
  if(lines.length<2) return [];
  const headers=lines[0].split(',').map(h=>h.trim().replace(/"/g,'').replace(/^\uFEFF/,''));
  return lines.slice(1).map((line,idx)=>{
    const values=[]; let cur='',inQ=false;
    for(let c of line){ if(c==='"') inQ=!inQ; else if(c===','&&!inQ){values.push(cur.trim());cur='';}else cur+=c; }
    values.push(cur.trim());
    const obj={}; headers.forEach((h,i)=>{obj[h]=values[i]||'';});
    return{id:idx+1,name:obj['이름']||obj['name']||obj['고객명']||`고객${idx+1}`,
      age:obj['나이']||'-',gender:obj['성별']||'-',region:obj['나의거주지역']||obj['지역']||'-',
      phone:(obj['연락처']||obj['phone']||'').replace(/-/g,''),
      memo:obj['비고']||obj['메모']||'',groupId:classifyGroup(obj),
      자격:obj['청약자격']||'',목적:obj['구매목적']||'',의사:obj['청약의사']||''};
  }).filter(c=>c.name);
}

const DEFAULT_PROMPTS=Object.fromEntries(ALL_GROUPS.map(g=>[g.id,{
  tone:g.id<=2?'부드럽고 부담 없는':g.id<=6?'적극적이고 설득력 있는':'공감하며 맞춤 제안하는',
  style:g.id<=2?'정보 제공형':g.id<=6?'행동 유도형':'조건 맞춤형',
  extra:'',banned:'',length:'120',
}]));

const DEFAULT_APT={name:'래미안 원베일리 2차',location:'서울 서초구 반포동',
  price:'12억~18억',date:'2026년 4월 15일',features:'한강뷰, 초품아, 지하철 3분',
  supply:'일반공급 320세대',contact:'02-1234-5678'};

const SAMPLE=[
  {id:1,name:'김민준',age:'30대',gender:'남자',region:'서울 강남구',groupId:3,phone:'01012345678',memo:'',자격:'1순위',목적:'실거주',의사:'있다'},
  {id:2,name:'이서연',age:'40대',gender:'여자',region:'경기 수원시',groupId:8,phone:'01023456789',memo:'',자격:'1순위',목적:'실거주',의사:'조건부'},
  {id:3,name:'박도현',age:'20대',gender:'남자',region:'서울 마포구',groupId:7,phone:'01034567890',memo:'',자격:'특별공급(신혼부부)',목적:'실거주',의사:'조건부'},
  {id:4,name:'최수아',age:'50대',gender:'여자',region:'부산 해운대',groupId:8,phone:'01045678901',memo:'',자격:'1순위',목적:'실거주',의사:'조건부'},
  {id:5,name:'정우진',age:'40대',gender:'남자',region:'서울 송파구',groupId:9,phone:'01056789012',memo:'',자격:'1순위',목적:'증여',의사:'조건부'},
  {id:99,name:'📱 테스트',age:'30대',gender:'남자',region:'테스트',groupId:99,phone:'',memo:'👈 본인 번호 입력 후 테스트',자격:'테스트',목적:'테스트',의사:'테스트'},
];

function Field({label,value,onChange,placeholder}){
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:'#64748b',marginBottom:5,fontWeight:500}}>{label}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
    </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  );
}

export default function App(){
  const [tab,setTab]=useState('data');
  const [apt,setApt]=useState(DEFAULT_APT);
  const [prompts,setPrompts]=useState(DEFAULT_PROMPTS);
  const [editGroup,setEditGroup]=useState(3);
  const [customers,setCustomers]=useState(SAMPLE);
  const [dataSource,setDataSource]=useState('sample');
  const [csvError,setCsvError]=useState('');
  const [sheetUrl,setSheetUrl]=useState('');
  const [sheetLoading,setSheetLoading]=useState(false);
  const [sheetError,setSheetError]=useState('');
  const [selected,setSelected]=useState(null);
  const [aiMode,setAiMode]=useState('template');
  const [selTemplate,setSelTemplate]=useState(null);
  const [aiMsg,setAiMsg]=useState('');
  const [editMsg,setEditMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(false);
  const [sendResult,setSendResult]=useState(null);
  const [sent,setSent]=useState([]);
  const [filterGroup,setFilterGroup]=useState(null);
  const [tmplSearch,setTmplSearch]=useState('');
  const fileRef=useRef();
  const tmplFileRef=useRef();

  // ── AI 에이전트 상태
  const [agentRunning,setAgentRunning]=useState(false);
  const [agentLogs,setAgentLogs]=useState([]);
  const [agentResults,setAgentResults]=useState([]);
  const [agentDone,setAgentDone]=useState(false);
  const [agentTarget,setAgentTarget]=useState('all');
  const [agentLimit,setAgentLimit]=useState(5);

  // ── 템플릿 관리 상태
  const [templates,setTemplates]=useState(TEMPLATES);
  const [tmplSheetUrl,setTmplSheetUrl]=useState('');
  const [tmplSheetLoading,setTmplSheetLoading]=useState(false);
  const [tmplSheetError,setTmplSheetError]=useState('');
  const [tmplSource,setTmplSource]=useState('default'); // 'default' | 'sheet' | 'csv'
  const [tmplSaveStatus,setTmplSaveStatus]=useState('idle'); // 'idle'|'saving'|'saved'|'error'

  // ── 저장 상태 (개선)
  const [aptSaveStatus,setAptSaveStatus]=useState('saved'); // 'saved'|'saving'|'unsaved'
  const [promptSaveStatus,setPromptSaveStatus]=useState('saved');

  // ── 그룹 발송 상태
  const [sendMode,setSendMode]=useState('individual'); // 'individual'|'group'|'all'
  const [bulkSending,setBulkSending]=useState(false);
  const [bulkResult,setBulkResult]=useState(null);
  const [bulkGroup,setBulkGroup]=useState(null);

  const getGroup=id=>ALL_GROUPS.find(g=>g.id===id)||ALL_GROUPS[0];
  const groupCounts=Object.fromEntries(ALL_GROUPS.map(g=>[g.id,customers.filter(c=>c.groupId===g.id).length]));
  const totalCount=customers.length;

  const handleCSV=file=>{
    if(!file) return; setCsvError('');
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const parsed=parseCSV(e.target.result);
        if(!parsed.length){setCsvError('데이터를 읽을 수 없어요.');return;}
        setCustomers(parsed);setDataSource('csv');
      }catch(err){setCsvError('파일 오류: '+err.message);}
    };
    reader.readAsText(file,'UTF-8');
  };

  const loadSheet=async()=>{
    if(!sheetUrl){setSheetError('URL을 입력해주세요.');return;}
    setSheetLoading(true);setSheetError('');
    try{
      const match=sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match){setSheetError('올바른 구글 시트 URL이 아닙니다.');setSheetLoading(false);return;}
      if(!GSHEET_API_KEY){setSheetError('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');setSheetLoading(false);return;}
      const url=`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z5000?key=${GSHEET_API_KEY}`;
      const res=await fetch(url); const data=await res.json();
      if(!data.values||data.values.length<2){setSheetError('시트에 데이터가 없습니다.');setSheetLoading(false);return;}
      const headers=data.values[0].map(h=>h.trim());
      const rows=data.values.slice(1).map((row,idx)=>{
        const obj={}; headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return{id:idx+1,name:obj['이름']||obj['name']||`고객${idx+1}`,age:obj['나이']||'-',
          gender:obj['성별']||'-',region:obj['나의거주지역']||obj['지역']||'-',
          phone:(obj['연락처']||obj['phone']||'').replace(/-/g,''),
          memo:obj['비고']||obj['메모']||'',groupId:classifyGroup(obj),
          자격:obj['청약자격']||'',목적:obj['구매목적']||'',의사:obj['청약의사']||''};
      }).filter(c=>c.name);
      setCustomers(rows);setDataSource('sheet');
    }catch(e){setSheetError('연동 실패: '+e.message);}
    setSheetLoading(false);
  };

  const generateAI=useCallback(async customer=>{
    setLoading(true);setAiMsg('');setEditMsg('');setSelTemplate(null);
    const g=getGroup(customer.groupId);
    const p=prompts[g.id]||DEFAULT_PROMPTS[g.id];
    const recTemplates=(TEMPLATE_MAPPING[g.id]||[]).slice(0,3).map(id=>TEMPLATES.find(t=>t.id===id)).filter(Boolean);
    const examples=recTemplates.map((t,i)=>`예시${i+1} [${t.title}]:\n${t.content.slice(0,150)}`).join('\n\n');
    const prompt=`당신은 부동산 청약 분양 전문 CRM 마케터입니다.

[현재 분양 아파트]
아파트명: ${apt.name} / 위치: ${apt.location} / 분양가: ${apt.price}
청약일: ${apt.date} / 특징: ${apt.features} / 공급: ${apt.supply}

[고객 정보]
이름: ${customer.name} / 나이: ${customer.age} / 성별: ${customer.gender} / 지역: ${customer.region}
세그먼트: ${g.tier}차 ${g.tierLabel} - ${g.name}
청약의사: ${customer.의사} / 청약자격: ${customer.자격} / 구매목적: ${customer.목적}

[세그먼트 설정]
말투: ${p.tone} / 스타일: ${p.style} / 길이: ${p.length}자 내외
추가지시: ${p.extra||'없음'} / 금지표현: ${p.banned||'없음'}

[참고 템플릿 예시]
${examples}

위 설정과 템플릿 스타일을 참고하여 ${apt.name} 맞춤 카카오 알림톡 메시지를 작성해주세요.
이름 포함, 이모지 1~2개, 아파트명·청약일 자연스럽게 포함. 메시지만 출력하세요.`;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,
          'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,
          messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const msg=data.content?.map(i=>i.text||'').join('')||'생성 실패';
      setAiMsg(msg);setEditMsg(msg);
    }catch(e){setAiMsg('API 오류: '+e.message);setEditMsg('API 오류: '+e.message);}
    setLoading(false);
  },[apt,prompts]);

  const pickTemplate=t=>{setSelTemplate(t);setEditMsg(t.content);setAiMsg('');};

  const handleCustomerClick=c=>{
    setSelected(c);setAiMsg('');setEditMsg('');setSelTemplate(null);setSendResult(null);setAiMode('template');
  };

  // ── 솔라피 HMAC 인증 헬퍼
  const makeSolapiAuth=async()=>{
    const apiKey=import.meta.env.VITE_SOLAPI_API_KEY||'';
    const apiSecret=import.meta.env.VITE_SOLAPI_API_SECRET||'';
    const date=new Date().toISOString();
    const salt=Math.random().toString(36).substring(2,22);
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',enc.encode(apiSecret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sig=await crypto.subtle.sign('HMAC',key,enc.encode(date+salt));
    const signature=Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
    return {apiKey,date,salt,signature};
  };

  // ── 솔라피 SMS 실제 발송
  const sendSMS=async(to,text)=>{
    const sender=import.meta.env.VITE_SOLAPI_SENDER||'';
    const {apiKey,date,salt,signature}=await makeSolapiAuth();
    const res=await fetch('https://api.solapi.com/messages/v4/send',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body:JSON.stringify({
        message:{
          to:to.replace(/-/g,''),
          from:sender,
          text:text,
        }
      }),
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.errorMessage||data.message||'발송 실패');
    return data;
  };

  const sendKakao=async()=>{
    if(!editMsg||!selected) return;
    setSending(true);setSendResult(null);
    const g=getGroup(selected.groupId);
    const finalMsg=applyAdPrefix(editMsg);
    const phone=selected.phone||'';
    try{
      if(phone){
        await sendSMS(phone,finalMsg);
        setSendResult({ok:true,msg:`✅ ${selected.name}님 (${phone}) SMS 발송 완료!`});
      }else{
        setSendResult({ok:true,msg:`[시뮬레이션] ${selected.name}님 - 번호 없음, 발송내역만 저장`});
      }
      setSent(prev=>[{customer:selected,message:finalMsg,group:g,apt:apt.name,
        time:new Date().toLocaleTimeString(),label:selTemplate?selTemplate.title:'AI생성',
        simulated:!phone},...prev.slice(0,29)]);
      setEditMsg('');setAiMsg('');setSelected(null);setSelTemplate(null);
    }catch(e){
      setSendResult({ok:false,msg:'❌ 발송 실패: '+e.message});
    }
    setSending(false);
  };

  // ── AI 에이전트 실행 (Claude Tool Use - 단일 툴 방식)
  const runAgent=useCallback(async()=>{
    setAgentRunning(true);setAgentDone(false);setAgentLogs([]);setAgentResults([]);

    const addLog=(icon,text,type='info')=>setAgentLogs(prev=>[...prev,{icon,text,type,time:new Date().toLocaleTimeString()}]);

    const targets = agentTarget==='all'
      ? customers.slice(0,agentLimit)
      : customers.filter(c=>c.groupId===Number(agentTarget)).slice(0,agentLimit);

    if(!targets.length){ addLog('⚠️','처리할 고객이 없습니다','error'); setAgentRunning(false); return; }

    addLog('🚀',`에이전트 시작 — 대상 ${targets.length}명`);
    addLog('🏢',`아파트: ${apt.name} / 청약일: ${apt.date}`);

    // 툴 하나로 단순화 — 분석+메시지 한번에
    const tools=[{
      name:'process_customer',
      description:'고객을 분석하고 맞춤 메시지를 한번에 생성한다',
      input_schema:{
        type:'object',
        properties:{
          customer_name:{type:'string',description:'고객 이름'},
          group_name:{type:'string',description:'세그먼트명 (예: 그룹3 VIP 즉시 전환 1)'},
          template_title:{type:'string',description:'선택한 템플릿 제목'},
          message:{type:'string',description:'완성된 카카오 알림톡 메시지 (이름 포함, 이모지 1~2개, 아파트명·청약일 포함, 120자 내외)'},
          strategy:{type:'string',description:'이 메시지 전략 한 줄 요약'},
        },
        required:['customer_name','group_name','template_title','message','strategy'],
      }
    }];

    const results=[];

    for(let i=0;i<targets.length;i++){
      const c=targets[i];
      const g=getGroup(c.groupId);
      const p=prompts[g.id]||DEFAULT_PROMPTS[g.id];
      const recTemplates=(TEMPLATE_MAPPING[g.id]||[]).slice(0,3).map(id=>TEMPLATES.find(t=>t.id===id)).filter(Boolean);
      const templateList=recTemplates.map(t=>`[${t.title}]: ${t.content.slice(0,100)}`).join('\n');

      addLog('👤',`(${i+1}/${targets.length}) ${c.name} 분석 중... [${g.short}]`);

      const prompt=`당신은 부동산 청약 CRM AI 에이전트입니다.
아래 고객을 분석하고 process_customer 툴을 호출하여 결과를 반환하세요.

[고객 정보]
이름: ${c.name} / 나이: ${c.age} / 성별: ${c.gender} / 지역: ${c.region}
세그먼트: ${g.name} / 청약의사: ${c.의사} / 자격: ${c.자격} / 목적: ${c.목적}

[현재 분양 아파트]
아파트명: ${apt.name} / 위치: ${apt.location} / 분양가: ${apt.price}
청약일: ${apt.date} / 특징: ${apt.features}

[이 세그먼트 추천 템플릿]
${templateList}

[메시지 작성 규칙]
- 말투: ${p.tone} / 스타일: ${p.style} / 길이: ${p.length}자 내외
- 고객 이름 반드시 포함
- 이모지 1~2개
- 아파트명(${apt.name})과 청약일(${apt.date}) 자연스럽게 포함
${p.banned?`- 금지 표현: ${p.banned}`:''}

반드시 process_customer 툴을 호출하세요.`;

      try{
        const res=await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,
            'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({
            model:'claude-sonnet-4-20250514',
            max_tokens:1000,
            tools,
            tool_choice:{type:'any'},
            messages:[{role:'user',content:prompt}],
          }),
        });

        const data=await res.json();

        if(data.error){
          addLog('❌',`  API 에러: ${data.error.type} — ${data.error.message}`,'error');
          continue;
        }

        // tool_use 블록에서 바로 추출
        const toolUse=data.content?.find(b=>b.type==='tool_use'&&b.name==='process_customer');

        if(toolUse?.input?.message){
          const {message,template_title,strategy}=toolUse.input;
          results.push({customer:c,group:g,message,templateTitle:template_title||'AI생성',time:new Date().toLocaleTimeString()});
          addLog('✅',`  ✓ [${template_title}] — ${strategy||'완료'}`,'success');
        } else {
          // 툴 호출 실패 시 텍스트 응답 fallback
          const txt=data.content?.find(b=>b.type==='text')?.text||'';
          if(txt){
            results.push({customer:c,group:g,message:txt,templateTitle:'AI생성',time:new Date().toLocaleTimeString()});
            addLog('✅',`  ✓ ${c.name}님 완료 (텍스트 방식)`,'success');
          } else {
            addLog('⚠️',`  → ${c.name} 응답 없음 (stop_reason: ${data.stop_reason})`,'error');
          }
        }
      }catch(e){
        addLog('❌',`  → ${c.name} 오류: ${e.message}`,'error');
      }

      if(i<targets.length-1) await new Promise(r=>setTimeout(r,200));
    }

    setAgentResults(results);
    addLog('🎉',`에이전트 완료! 총 ${results.length}명 메시지 생성됨`,'done');
    setAgentDone(true);
    setAgentRunning(false);
  },[customers,apt,prompts,agentTarget,agentLimit]);

  // 에이전트 결과 전체 발송
  const sendAllAgentResults=()=>{
    agentResults.forEach(r=>{
      setSent(prev=>[{customer:r.customer,message:r.message,group:r.group,apt:apt.name,
        time:r.time,label:r.templateTitle,simulated:true},...prev]);
    });
    setTab('sent');
  };

  const updatePrompt=(f,v)=>{setPrompts(p=>({...p,[editGroup]:{...p[editGroup],[f]:v}}));setPromptSaveStatus('unsaved');};
  const cp=prompts[editGroup]||DEFAULT_PROMPTS[editGroup];
  const filtered=filterGroup?customers.filter(c=>c.groupId===filterGroup):customers;
  const searchedTemplates=tmplSearch?templates.filter(t=>t.title.includes(tmplSearch)||t.content.includes(tmplSearch)):templates;

  // ── 저장 핸들러 (상태 표시 포함)
  const saveApt=()=>{
    setAptSaveStatus('saving');
    setTimeout(()=>setAptSaveStatus('saved'),600);
  };
  const savePrompt=()=>{
    setPromptSaveStatus('saving');
    setTimeout(()=>setPromptSaveStatus('saved'),600);
  };

  // ── 저장 상태 라벨
  const SaveBadge=({status})=>{
    const map={
      saved:{bg:'rgba(16,185,129,0.15)',color:'#10b981',text:'✅ 저장완료'},
      saving:{bg:'rgba(99,102,241,0.15)',color:'#a5b4fc',text:'⏳ 저장 중...'},
      unsaved:{bg:'rgba(245,158,11,0.15)',color:'#f59e0b',text:'● 미저장'},
      error:{bg:'rgba(248,113,113,0.15)',color:'#f87171',text:'❌ 저장실패'},
      idle:{bg:'rgba(100,116,139,0.15)',color:'#64748b',text:'— 대기 중'},
    };
    const s=map[status]||map.idle;
    return <div style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:s.bg,color:s.color}}>{s.text}</div>;
  };

  // ── 템플릿 구글시트 로드
  const loadTmplSheet=async()=>{
    if(!tmplSheetUrl){setTmplSheetError('URL을 입력해주세요.');return;}
    setTmplSheetLoading(true);setTmplSheetError('');setTmplSaveStatus('saving');
    try{
      const match=tmplSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match){setTmplSheetError('올바른 구글 시트 URL이 아닙니다.');setTmplSheetLoading(false);setTmplSaveStatus('error');return;}
      if(!GSHEET_API_KEY){setTmplSheetError('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');setTmplSheetLoading(false);setTmplSaveStatus('error');return;}
      const url=`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z200?key=${GSHEET_API_KEY}`;
      const res=await fetch(url); const data=await res.json();
      if(!data.values||data.values.length<2){setTmplSheetError('시트에 데이터가 없습니다.');setTmplSheetLoading(false);setTmplSaveStatus('error');return;}
      const headers=data.values[0].map(h=>h.trim());
      const rows=data.values.slice(1).map((row,idx)=>{
        const obj={}; headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return{
          id:idx,
          title:obj['템플릿 제목']||obj['title']||`템플릿${idx+1}`,
          content:obj['친구톡 내용']||obj['대체문자 내용']||obj['content']||'',
        };
      }).filter(t=>t.title&&t.content);
      setTemplates(rows);setTmplSource('sheet');setTmplSaveStatus('saved');
    }catch(e){setTmplSheetError('연동 실패: '+e.message);setTmplSaveStatus('error');}
    setTmplSheetLoading(false);
  };

  // ── 템플릿 CSV 로드
  const handleTmplCSV=file=>{
    if(!file) return; setTmplSheetError('');setTmplSaveStatus('saving');
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const parsed=parseCSV(e.target.result);
        if(!parsed.length){setTmplSheetError('데이터를 읽을 수 없어요.');setTmplSaveStatus('error');return;}
        const rows=parsed.map((row,idx)=>({
          id:idx,
          title:row['템플릿 제목']||row['title']||`템플릿${idx+1}`,
          content:row['친구톡 내용']||row['대체문자 내용']||row['content']||'',
        })).filter(t=>t.title&&t.content);
        setTemplates(rows);setTmplSource('csv');setTmplSaveStatus('saved');
      }catch(err){setTmplSheetError('파일 오류: '+err.message);setTmplSaveStatus('error');}
    };
    reader.readAsText(file,'UTF-8');
  };

  // ── 광고 표기 상태
  const [isAd,setIsAd]=useState(false);
  // 광고 prefix 적용 헬퍼
  const applyAdPrefix=(msg)=>isAd&&msg&&!msg.startsWith('(광고)')?'(광고) '+msg:msg;

  // ── 그룹/전체 발송용 공용 패널 상태
  const [bulkMode,setBulkMode]=useState('template'); // 'template'|'ai'
  const [bulkTmplSel,setBulkTmplSel]=useState(null);
  const [bulkAiMsg,setBulkAiMsg]=useState('');
  const [bulkEditMsg,setBulkEditMsg]=useState('');
  const [bulkAiLoading,setBulkAiLoading]=useState(false);
  const [bulkTmplSearch,setBulkTmplSearch]=useState('');
  const [testPhone,setTestPhone]=useState('');

  const generateBulkAI=useCallback(async(targetGroup)=>{
    setBulkAiLoading(true);setBulkAiMsg('');setBulkEditMsg('');
    const g=targetGroup?getGroup(targetGroup):null;
    const p=g?(prompts[g.id]||DEFAULT_PROMPTS[g.id]):DEFAULT_PROMPTS[3];
    const recIds=g?(TEMPLATE_MAPPING[g.id]||[]):(TEMPLATE_MAPPING[3]||[]);
    const recTmpls=recIds.slice(0,3).map(id=>templates.find(t=>t.id===id)||TEMPLATES.find(t=>t.id===id)).filter(Boolean);
    const examples=recTmpls.map((t,i)=>`예시${i+1} [${t.title}]:\n${t.content.slice(0,120)}`).join('\n\n');
    const groupDesc=g?`세그먼트: ${g.tier}차 ${g.tierLabel} - ${g.name}\n말투: ${p.tone} / 스타일: ${p.style} / 길이: ${p.length}자 내외\n추가지시: ${p.extra||'없음'} / 금지표현: ${p.banned||'없음'}`:'전체 고객 대상 일반 안내 메시지';
    const prompt=`당신은 부동산 청약 분양 전문 CRM 마케터입니다.\n\n[분양 아파트]\n아파트명: ${apt.name} / 위치: ${apt.location} / 분양가: ${apt.price}\n청약일: ${apt.date} / 특징: ${apt.features}\n\n[대상]\n${groupDesc}\n\n[참고 템플릿]\n${examples}\n\n위 정보를 바탕으로 카카오 알림톡 메시지를 작성해주세요. 이모지 1~2개, 아파트명·청약일 포함. 메시지만 출력하세요.`;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      const data=await res.json();
      const msg=data.content?.map(i=>i.text||'').join('')||'생성 실패';
      setBulkAiMsg(msg);setBulkEditMsg(msg);
    }catch(e){setBulkAiMsg('API 오류: '+e.message);setBulkEditMsg('');}
    setBulkAiLoading(false);
  },[apt,prompts,templates]);

  // ── 그룹/전체 발송
  const sendBulk=async(targetCustomers,label,overrideMsg)=>{
    setBulkSending(true);setBulkResult(null);
    let successCount=0, simCount=0, failCount=0;
    for(const c of targetCustomers){
      const g=getGroup(c.groupId);
      const recIds=(TEMPLATE_MAPPING[g.id]||[]).slice(0,1);
      const tmpl=templates.find(t=>t.id===recIds[0])||TEMPLATES.find(t=>t.id===recIds[0]);
      let msg=overrideMsg||(tmpl?tmpl.content:`[${apt.name}] ${c.name}님, ${apt.date} 청약 일정을 안내드립니다.`);
      msg=applyAdPrefix(msg);
      const phone=c.phone||'';
      let simulated=true;
      try{
        if(phone){
          await sendSMS(phone,msg);
          successCount++;
          simulated=false;
        }else{
          simCount++;
        }
      }catch(e){
        failCount++;
      }
      setSent(prev=>[{customer:c,message:msg,group:g,apt:apt.name,
        time:new Date().toLocaleTimeString(),label:overrideMsg?'직접입력':(tmpl?tmpl.title:'기본템플릿'),simulated},...prev]);
    }
    const msg2=`✅ ${label} 완료 — 실제발송 ${successCount}명 / 번호없음 ${simCount}명${failCount>0?' / 실패 '+failCount+'명':''}`;
    setBulkResult({ok:true,msg:msg2});
    setBulkSending(false);
  };

  const TABS=[
    {key:'data',label:'📂 고객데이터'},
    {key:'overview',label:'📊 세그먼트'},
    {key:'apt',label:'🏢 아파트'},
    {key:'templates',label:'📝 템플릿 관리'},
    {key:'prompts',label:'🤖 AI 프롬프트'},
    {key:'send',label:'💬 메시지 발송'},
    {key:'agent',label:'🤖 AI 에이전트'},
    {key:'sent',label:'📋 발송내역'},
  ];

  const s=(style)=>({...style});

  return(
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",background:'#0b0f1e',minHeight:'100vh',color:'#e2e8f0',fontSize:14,display:'flex'}}>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}} *{box-sizing:border-box} textarea,input{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}`}</style>

      {/* ── 사이드바 ── */}
      <div style={{width:200,minHeight:'100vh',background:'#0d1117',borderRight:'1px solid rgba(99,102,241,0.15)',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0}}>
        {/* 로고 */}
        <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(99,102,241,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#6366f1,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🏢</div>
            <div>
              <div style={{fontWeight:700,fontSize:12,lineHeight:1.3}}>청약 CRM</div>
              <div style={{fontSize:9,color:'#6366f1',marginTop:1}}>AI 메시지 센터</div>
            </div>
          </div>
          <div style={{marginTop:10,fontSize:10,color:'#475569'}}>{totalCount.toLocaleString()}명 · {dataSource==='csv'?'CSV':dataSource==='sheet'?'구글시트':'샘플'}</div>
        </div>
        {/* 탭 메뉴 */}
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:9,border:'none',cursor:'pointer',textAlign:'left',marginBottom:2,
                background:tab===t.key?'rgba(99,102,241,0.2)':'transparent',
                borderLeft:tab===t.key?'3px solid #6366f1':'3px solid transparent',
                color:tab===t.key?'#a5b4fc':'#64748b',fontSize:12,fontWeight:tab===t.key?600:400}}>
              {t.label}
            </button>
          ))}
        </nav>
        {/* 상태 */}
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(99,102,241,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 5px #10b981'}}/>
            <span style={{fontSize:10,color:'#10b981'}}>Claude API 연결됨</span>
          </div>
          <div style={{fontSize:9,color:'#334155'}}>{templates.length}개 템플릿 로드됨</div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div style={{flex:1,minHeight:'100vh',overflowY:'auto'}}>
        {/* 상단 바 */}
        <div style={{background:'linear-gradient(135deg,#0f172a,#1e1b4b 60%,#0f172a)',borderBottom:'1px solid rgba(99,102,241,0.2)',padding:'0 24px',position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:50}}>
            <div style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{TABS.find(t=>t.key===tab)?.label}</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {/* 광고 토글 - 발송 관련 탭에서만 표시 */}
              {(tab==='send'||tab==='agent')&&(
                <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.05)',border:`1px solid ${isAd?'rgba(245,158,11,0.4)':'rgba(255,255,255,0.1)'}`,borderRadius:8,padding:'5px 11px',cursor:'pointer'}}
                  onClick={()=>setIsAd(v=>!v)}>
                  <div style={{width:28,height:15,borderRadius:10,background:isAd?'#f59e0b':'#334155',position:'relative',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{position:'absolute',top:2,left:isAd?14:2,width:11,height:11,borderRadius:'50%',background:'white',transition:'left 0.2s'}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:isAd?'#f59e0b':'#64748b'}}>{isAd?'(광고) ON':'광고 표기'}</span>
                </div>
              )}
              <div style={{fontSize:11,color:'#64748b'}}>{apt.name} · {apt.date}</div>
            </div>
          </div>
        </div>

      <div style={{padding:'22px 24px'}}>
        {/* ══ 고객 데이터 ══ */}
        {tab==='data'&&(
          <div style={{maxWidth:760}}>
            <div style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:12,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:13}}>
                <span style={{color:'#a5b4fc',fontWeight:600}}>현재 {totalCount.toLocaleString()}명 로드됨</span>
                <span style={{color:'#64748b',marginLeft:10,fontSize:12}}>{dataSource==='csv'?'📄 CSV 파일':dataSource==='sheet'?'🟢 구글 시트':'📋 샘플 데이터'}</span>
              </div>
              {dataSource!=='sample'&&<button onClick={()=>{setCustomers(SAMPLE);setDataSource('sample');}} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>샘플로 초기화</button>}
            </div>

            {/* 구글 시트 */}
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px',marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>🟢 구글 시트 연동</div>
              <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>시트 수정 후 새로고침 버튼 클릭하면 실시간 반영</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."
                  style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none'}}/>
                <button onClick={loadSheet} disabled={sheetLoading}
                  style={{background:'linear-gradient(135deg,#10b981,#059669)',border:'none',color:'white',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>
                  {sheetLoading?'로딩 중...':'🔄 불러오기'}
                </button>
              </div>
              {sheetError&&<div style={{color:'#f87171',fontSize:12,padding:'8px 12px',background:'rgba(248,113,113,0.1)',borderRadius:8,marginBottom:8}}>⚠️ {sheetError}</div>}
              <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:9,padding:'10px 14px'}}>
                <div style={{fontSize:11,color:'#10b981',fontWeight:600,marginBottom:4}}>설정 방법</div>
                <div style={{fontSize:11,color:'#64748b',lineHeight:1.8}}>
                  1. 구글 시트 → 공유 → <b style={{color:'#94a3b8'}}>링크 있는 모든 사용자 보기</b><br/>
                  2. Vercel 환경변수에 <b style={{color:'#94a3b8'}}>VITE_GSHEET_API_KEY</b> 추가<br/>
                  3. 컬럼명: 나이, 성별, 나의거주지역, 청약자격, 구매목적, 청약의사, 분양 일정
                </div>
              </div>
            </div>

            {/* CSV 업로드 */}
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px'}}
              onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv'))handleCSV(f);}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>📄 CSV 파일 업로드</div>
              <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>실제 고객 CSV를 올리면 자동으로 10개 세그먼트로 분류해요</div>
              <div style={{border:'2px dashed rgba(99,102,241,0.3)',borderRadius:12,padding:'28px 20px',textAlign:'center',background:dataSource==='csv'?'rgba(16,185,129,0.04)':'rgba(99,102,241,0.03)'}}>
                {dataSource==='csv'?(
                  <div>
                    <div style={{fontSize:28,marginBottom:6}}>✅</div>
                    <div style={{color:'#10b981',fontWeight:600,marginBottom:4}}>{totalCount.toLocaleString()}명 로드 완료!</div>
                    <div style={{fontSize:11,color:'#64748b'}}>세그먼트별 자동 분류 완료</div>
                    <button onClick={()=>fileRef.current.click()} style={{marginTop:10,background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'5px 14px',borderRadius:7,cursor:'pointer',fontSize:11}}>다른 파일 올리기</button>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:30,marginBottom:8}}>📂</div>
                    <div style={{marginBottom:10,fontSize:13}}>CSV 파일을 드래그하거나</div>
                    <button onClick={()=>fileRef.current.click()} style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.4)',color:'#a5b4fc',padding:'7px 20px',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500}}>📁 파일 선택</button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>handleCSV(e.target.files[0])}/>
              </div>
              {csvError&&<div style={{color:'#f87171',fontSize:12,marginTop:8}}>⚠️ {csvError}</div>}
              <div style={{marginTop:14,background:'rgba(99,102,241,0.05)',borderRadius:9,padding:'10px 14px'}}>
                <div style={{fontSize:11,color:'#a5b4fc',fontWeight:600,marginBottom:4}}>✅ 자동 분류 기준</div>
                <div style={{fontSize:11,color:'#64748b',lineHeight:1.8}}>
                  청약의사 없다 → 그룹1·2 / 청약의사 있다 → 그룹3·4·5·6 (자격 기준)<br/>
                  조건부 + 투자/증여 → 그룹9 / 조건부 + 기타 → 그룹10<br/>
                  조건부 + 실거주 + 20~40대 → 그룹7 / 50~60대 → 그룹8
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 세그먼트 ══ */}
        {tab==='overview'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {SEGMENTS.map(seg=>(
                <div key={seg.tier} style={{background:seg.tierBg,border:`1px solid ${seg.tierBorder}`,borderRadius:14,padding:'18px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <div style={{fontSize:10,color:seg.tierColor,fontWeight:700,letterSpacing:1}}>{seg.tier}차 분류</div>
                      <div style={{fontSize:16,fontWeight:700}}>{seg.tierLabel}</div>
                    </div>
                    <div style={{fontSize:22,fontWeight:800,color:seg.tierColor}}>
                      {seg.groups.reduce((s,g)=>s+(groupCounts[g.id]||0),0).toLocaleString()}명
                    </div>
                  </div>
                  {seg.groups.map(g=>(
                    <div key={g.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'6px 10px',marginBottom:5}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span>{g.icon}</span>
                        <span style={{fontSize:11,color:'#cbd5e1'}}>{g.name}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:g.color}}>{(groupCounts[g.id]||0).toLocaleString()}명</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'18px 22px',marginBottom:16}}>
              <div style={{fontSize:12,color:'#94a3b8',marginBottom:10,fontWeight:500}}>전체 세그먼트 비율 · {totalCount.toLocaleString()}명</div>
              <div style={{display:'flex',height:18,borderRadius:9,overflow:'hidden',gap:2}}>
                {ALL_GROUPS.map(g=>(
                  <div key={g.id} style={{width:`${((groupCounts[g.id]||0)/Math.max(totalCount,1)*100).toFixed(1)}%`,background:g.color,minWidth:groupCounts[g.id]?2:0}} title={`${g.name}: ${groupCounts[g.id]||0}명`}/>
                ))}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',marginTop:10}}>
                {ALL_GROUPS.map(g=>(
                  <div key={g.id} style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:7,height:7,borderRadius:2,background:g.color}}/>
                    <span style={{fontSize:10,color:'#94a3b8'}}>{g.short} {totalCount?((groupCounts[g.id]||0)/totalCount*100).toFixed(1):0}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'18px 22px'}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:500,marginBottom:12}}>세그먼트 정의</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:7}}>
                {ALL_GROUPS.map(g=>(
                  <div key={g.id} style={{display:'flex',gap:9,background:'rgba(255,255,255,0.03)',borderRadius:9,padding:'9px 12px',border:`1px solid ${g.color}18`}}>
                    <span style={{fontSize:17}}>{g.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:g.color,marginBottom:2}}>{g.name}</div>
                      <div style={{fontSize:10,color:'#64748b'}}>{g.desc}</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:'#475569',flexShrink:0}}>{(groupCounts[g.id]||0).toLocaleString()}명</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 프롬프트 ══ */}
        {tab==='prompts'&&(
          <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:18}}>
            <div>
              <div style={{fontSize:11,color:'#64748b',marginBottom:8,fontWeight:500}}>세그먼트 선택</div>
              {SEGMENTS.map(seg=>(
                <div key={seg.tier}>
                  <div style={{fontSize:10,color:seg.tierColor,fontWeight:700,letterSpacing:1,padding:'5px 8px 3px'}}>{seg.tier}차 · {seg.tierLabel}</div>
                  {seg.groups.map(g=>(
                    <button key={g.id} onClick={()=>setEditGroup(g.id)}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:7,padding:'8px 11px',borderRadius:9,border:'none',cursor:'pointer',textAlign:'left',marginBottom:3,
                        background:editGroup===g.id?`${g.color}20`:'rgba(255,255,255,0.03)',
                        borderLeft:editGroup===g.id?`3px solid ${g.color}`:'3px solid transparent'}}>
                      <span style={{fontSize:15}}>{g.icon}</span>
                      <div>
                        <span style={{fontSize:11,color:editGroup===g.id?g.color:'#94a3b8',fontWeight:editGroup===g.id?600:400}}>{g.short}</span>
                        <span style={{fontSize:10,color:'#475569',marginLeft:6}}>{groupCounts[g.id]||0}명</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {(()=>{
              const g=getGroup(editGroup);
              return(
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:9}}>
                      <span style={{fontSize:22}}>{g.icon}</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:g.color}}>{g.name}</div>
                        <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{g.desc} · {groupCounts[g.id]||0}명</div>
                      </div>
                    </div>
                    <div style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:promptSaveStatus==='saved'?'rgba(16,185,129,0.15)':promptSaveStatus==='saving'?'rgba(99,102,241,0.15)':'rgba(245,158,11,0.15)',color:promptSaveStatus==='saved'?'#10b981':promptSaveStatus==='saving'?'#a5b4fc':'#f59e0b'}}>{promptSaveStatus==='saved'?'✅ 저장완료':promptSaveStatus==='saving'?'⏳ 저장 중...':'● 미저장'}</div>
                  </div>
                  <div style={{marginBottom:16,background:'rgba(99,102,241,0.05)',borderRadius:9,padding:'10px 14px'}}>
                    <div style={{fontSize:11,color:'#a5b4fc',fontWeight:600,marginBottom:6}}>📋 이 세그먼트 추천 템플릿</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {(TEMPLATE_MAPPING[editGroup]||[]).slice(0,3).map(id=>{
                        const t=TEMPLATES.find(t=>t.id===id);
                        return t?<div key={id} style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:7,padding:'4px 10px',fontSize:11,color:'#a5b4fc'}}>{t.title}</div>:null;
                      })}
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,color:'#64748b',marginBottom:6,fontWeight:500}}>말투 / 톤</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {['부드럽고 부담 없는','친근하고 따뜻한','격식 있고 신뢰감 있는','적극적이고 설득력 있는','공감하며 맞춤 제안하는','간결하고 임팩트 있는'].map(t=>(
                          <button key={t} onClick={()=>updatePrompt('tone',t)} style={{padding:'4px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:cp.tone===t?`${g.color}30`:'rgba(255,255,255,0.06)',color:cp.tone===t?g.color:'#64748b'}}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:'#64748b',marginBottom:6,fontWeight:500}}>메시지 스타일</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {['정보 제공형','행동 유도형','조건 맞춤형','혜택 강조형','긴박감 강조형','감성 공략형'].map(s=>(
                          <button key={s} onClick={()=>updatePrompt('style',s)} style={{padding:'4px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:cp.style===s?`${g.color}30`:'rgba(255,255,255,0.06)',color:cp.style===s?g.color:'#64748b'}}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:5,fontWeight:500}}>목표 글자 수</div>
                    <div style={{display:'flex',gap:6}}>
                      {['80','100','120','150'].map(n=>(
                        <button key={n} onClick={()=>updatePrompt('length',n)} style={{padding:'4px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,background:cp.length===n?`${g.color}30`:'rgba(255,255,255,0.06)',color:cp.length===n?g.color:'#64748b'}}>{n}자</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:5,fontWeight:500}}>추가 지시사항</div>
                    <textarea value={cp.extra} onChange={e=>updatePrompt('extra',e.target.value)} placeholder="예: 청약일 반드시 강조"
                      style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none',resize:'vertical',minHeight:50}}/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:5,fontWeight:500}}>금지 표현</div>
                    <input value={cp.banned} onChange={e=>updatePrompt('banned',e.target.value)} placeholder="예: 저렴한, 싼"
                      style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:12,outline:'none'}}/>
                  </div>
                  <button onClick={savePrompt}
                    style={{width:'100%',background:promptSaveStatus==='saving'?'rgba(99,102,241,0.5)':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',padding:'10px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600}}>
                    {promptSaveStatus==='saving'?'⏳ 저장 중...':promptSaveStatus==='saved'?'✅ 저장완료':'💾 저장'}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ 아파트 ══ */}
        {tab==='apt'&&(
          <div style={{maxWidth:620}}>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>🏢 현재 분양 아파트 정보</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:3}}>여기 입력한 정보가 모든 AI 메시지에 자동 반영됩니다</div>
                </div>
                <div style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:aptSaveStatus==='saved'?'rgba(16,185,129,0.15)':aptSaveStatus==='saving'?'rgba(99,102,241,0.15)':'rgba(245,158,11,0.15)',color:aptSaveStatus==='saved'?'#10b981':aptSaveStatus==='saving'?'#a5b4fc':'#f59e0b'}}>{aptSaveStatus==='saved'?'✅ 저장완료':aptSaveStatus==='saving'?'⏳ 저장 중...':'● 미저장'}</div>
              </div>
              {[['아파트명 *','name','예: 래미안 원베일리 2차'],['위치 *','location','예: 서울 서초구 반포동'],
                ['청약일 *','date','예: 2026년 4월 15일'],['분양가','price','예: 12억~18억'],
                ['주요 특징','features','예: 한강뷰, 초품아'],['공급 세대','supply','예: 일반공급 320세대'],
                ['문의 연락처','contact','예: 02-1234-5678']].map(([label,key,ph])=>(
                <Field key={key} label={label} value={apt[key]} placeholder={ph} onChange={v=>{setApt(p=>({...p,[key]:v}));setAptSaveStatus('unsaved');}}/>
              ))}
              <button onClick={saveApt}
                style={{width:'100%',marginTop:6,background:aptSaveStatus==='saving'?'rgba(99,102,241,0.5)':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'white',padding:'11px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:600}}>
                {aptSaveStatus==='saving'?'⏳ 저장 중...':aptSaveStatus==='saved'?'✅ 저장완료':'💾 저장하고 메시지에 반영하기'}
              </button>
            </div>
          </div>
        )}

        {/* ══ 템플릿 관리 ══ */}
        {tab==='templates'&&(
          <div style={{maxWidth:900}}>
            {/* 현황 배너 */}
            <div style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:12,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <span style={{color:'#a5b4fc',fontWeight:600}}>현재 {templates.length}개 템플릿 로드됨</span>
                <span style={{color:'#64748b',marginLeft:10,fontSize:12}}>{tmplSource==='sheet'?'🟢 구글 시트':tmplSource==='csv'?'📄 CSV':'📋 기본 템플릿'}</span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{fontSize:10,padding:'3px 9px',borderRadius:20,background:tmplSaveStatus==='saved'?'rgba(16,185,129,0.15)':tmplSaveStatus==='saving'?'rgba(99,102,241,0.15)':tmplSaveStatus==='error'?'rgba(248,113,113,0.15)':'rgba(100,116,139,0.15)',color:tmplSaveStatus==='saved'?'#10b981':tmplSaveStatus==='saving'?'#a5b4fc':tmplSaveStatus==='error'?'#f87171':'#64748b'}}>{tmplSaveStatus==='saved'?'✅ 불러오기 완료':tmplSaveStatus==='saving'?'⏳ 불러오는 중...':tmplSaveStatus==='error'?'❌ 불러오기 실패':'— 기본값 사용 중'}</div>
                {tmplSource!=='default'&&<button onClick={()=>{setTemplates(TEMPLATES);setTmplSource('default');setTmplSaveStatus('idle');}} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>기본으로 초기화</button>}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:18}}>
              {/* 구글 시트 연동 */}
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px'}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>🟢 구글 시트로 업데이트</div>
                <div style={{fontSize:11,color:'#64748b',marginBottom:14}}>팀원이 시트를 수정하면 버튼 클릭으로 바로 반영돼요</div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  <input value={tmplSheetUrl} onChange={e=>setTmplSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..."
                    style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 12px',color:'#e2e8f0',fontSize:11,outline:'none'}}/>
                  <button onClick={loadTmplSheet} disabled={tmplSheetLoading}
                    style={{background:'linear-gradient(135deg,#10b981,#059669)',border:'none',color:'white',padding:'8px 14px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>
                    {tmplSheetLoading?'로딩 중...':'🔄 불러오기'}
                  </button>
                </div>
                {tmplSheetError&&<div style={{color:'#f87171',fontSize:11,padding:'7px 12px',background:'rgba(248,113,113,0.1)',borderRadius:7,marginBottom:8}}>⚠️ {tmplSheetError}</div>}
                <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:9,padding:'10px 14px'}}>
                  <div style={{fontSize:11,color:'#10b981',fontWeight:600,marginBottom:4}}>구글 시트 컬럼 형식</div>
                  <div style={{fontSize:11,color:'#64748b',lineHeight:1.8}}>
                    A열: <b style={{color:'#94a3b8'}}>템플릿 제목</b><br/>
                    B열: <b style={{color:'#94a3b8'}}>친구톡 내용</b> (또는 대체문자 내용)<br/>
                    1행은 헤더 (컬럼명) 입력
                  </div>
                </div>
              </div>

              {/* CSV 업로드 */}
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 22px'}}
                onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.name.endsWith('.csv'))handleTmplCSV(f);}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>📄 CSV 파일로 업데이트</div>
                <div style={{fontSize:11,color:'#64748b',marginBottom:14}}>템플릿 CSV를 업로드하면 전체 교체돼요</div>
                <div style={{border:'2px dashed rgba(99,102,241,0.3)',borderRadius:12,padding:'24px 20px',textAlign:'center',background:tmplSource==='csv'?'rgba(16,185,129,0.04)':'rgba(99,102,241,0.03)'}}>
                  {tmplSource==='csv'?(
                    <div>
                      <div style={{fontSize:24,marginBottom:6}}>✅</div>
                      <div style={{color:'#10b981',fontWeight:600,fontSize:12,marginBottom:4}}>{templates.length}개 템플릿 로드 완료</div>
                      <button onClick={()=>tmplFileRef.current.click()} style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'5px 14px',borderRadius:7,cursor:'pointer',fontSize:11}}>다른 파일로 교체</button>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:26,marginBottom:8}}>📂</div>
                      <button onClick={()=>tmplFileRef.current.click()} style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.4)',color:'#a5b4fc',padding:'7px 18px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:500}}>📁 파일 선택</button>
                    </div>
                  )}
                  <input ref={tmplFileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>handleTmplCSV(e.target.files[0])}/>
                </div>
              </div>
            </div>

            {/* 현재 템플릿 목록 */}
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
        )}

        {/* ══ 메시지 발송 ══ */}
        {tab==='send'&&(
          <div>
            {/* SMS 테스트 배너 */}
            {(()=>{
              return(
                <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <span style={{fontSize:16}}>🧪</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#10b981',marginBottom:2}}>SMS 테스트 모드</div>
                    <div style={{fontSize:11,color:'#64748b'}}>본인 번호로 실제 문자 발송 테스트 가능해요</div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input
                      value={testPhone} onChange={e=>setTestPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,padding:'6px 12px',color:'#e2e8f0',fontSize:12,outline:'none',width:140}}
                    />
                    <button onClick={async()=>{
                      if(!testPhone){alert('번호를 입력해주세요!');return;}
                      try{
                        await sendSMS(testPhone,'[청약 CRM 테스트]\n안녕하세요! 솔라피 SMS 연동 테스트 메시지입니다 ✅\n정상적으로 수신되셨나요?');
                        alert('✅ 테스트 문자 발송 성공!\n잠시 후 수신 확인해보세요.');
                      }catch(e){alert('❌ 발송 실패: '+e.message);}
                    }} style={{background:'linear-gradient(135deg,#10b981,#059669)',border:'none',color:'white',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>
                      📱 테스트 발송
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 발송 모드 선택 */}
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

            {/* 전체 발송 모드 */}
            {sendMode==='all'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 420px',gap:20}}>
                {/* 왼쪽: 아파트 정보 + 세그먼트 현황 */}
                <div>
                  <div style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>📌 {apt.name} · {apt.date}</span>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setTab('prompts')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>프롬프트</button>
                      <button onClick={()=>setTab('apt')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>아파트 수정</button>
                    </div>
                  </div>
                  <div style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:10,padding:'12px 16px',marginBottom:14}}>
                    <div style={{fontSize:11,color:'#f59e0b',fontWeight:600,marginBottom:4}}>⚠️ 전체 {customers.length.toLocaleString()}명 발송</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>실제 발송 연동 시 대량 비용 발생 가능. 발송 전 메시지 내용을 꼭 확인해주세요.</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
                    {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id]||0;return cnt>0?(
                      <div key={g.id} style={{background:`${g.color}10`,border:`1px solid ${g.color}25`,borderRadius:9,padding:'8px 6px',textAlign:'center'}}>
                        <div style={{fontSize:15}}>{g.icon}</div>
                        <div style={{fontSize:9,color:g.color,fontWeight:600,marginTop:3}}>{g.short}</div>
                        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8'}}>{cnt.toLocaleString()}</div>
                      </div>
                    ):null;})}
                  </div>
                </div>
                {/* 오른쪽: 템플릿/AI 선택 패널 */}
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
                      <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:220,overflowY:'auto',marginBottom:10}}>
                        {(bulkTmplSearch?templates.filter(t=>t.title.includes(bulkTmplSearch)||t.content.includes(bulkTmplSearch)):templates).map(t=>(
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
                          <span>Claude가 전체 발송용 메시지 생성 중...</span>
                        </div>
                      ):bulkAiMsg&&<div style={{fontSize:11,color:'#10b981',marginBottom:6}}>✅ 생성 완료 · 아래에서 수정 가능</div>}
                    </div>
                  )}
                  {(bulkEditMsg||(bulkMode==='template'&&bulkTmplSel))&&!bulkAiLoading&&(
                    <div>
                      {isAd&&<div style={{fontSize:10,color:'#f59e0b',marginBottom:4}}>⚠️ 광고 표기 ON — 메시지 앞에 (광고) 자동 추가</div>}
                      <textarea value={bulkEditMsg} onChange={e=>setBulkEditMsg(e.target.value)}
                        style={{width:'100%',minHeight:110,background:'#111827',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:11,fontSize:12,lineHeight:1.7,color:'#e2e8f0',resize:'vertical',outline:'none',marginBottom:8}}/>
                      {bulkResult&&<div style={{padding:'8px 12px',borderRadius:8,marginBottom:8,fontSize:11,background:bulkResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:bulkResult.ok?'#10b981':'#f87171'}}>{bulkResult.msg}</div>}
                      <button onClick={()=>sendBulk(customers,'전체',bulkEditMsg||null)} disabled={bulkSending}
                        style={{width:'100%',padding:'11px',borderRadius:10,border:'none',cursor:bulkSending?'not-allowed':'pointer',fontSize:13,fontWeight:700,background:bulkSending?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#f59e0b,#d97706)',color:'white'}}>
                        {bulkSending?'발송 중...':'📢 전체 '+customers.length.toLocaleString()+'명 발송'}
                      </button>
                    </div>
                  )}
                  {!bulkEditMsg&&!(bulkMode==='template'&&bulkTmplSel)&&!bulkAiLoading&&(
                    <div style={{textAlign:'center',padding:'30px 20px',color:'#334155',fontSize:12}}>
                      {bulkMode==='template'?'왼쪽에서 템플릿을 선택해주세요':'AI 자동생성 버튼을 클릭해주세요'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 그룹별 발송 모드 */}
            {sendMode==='group'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 420px',gap:20}}>
                {/* 왼쪽: 그룹 선택 */}
                <div>
                  <div style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,color:'#a5b4fc',fontWeight:600}}>📌 {apt.name} · {apt.date}</span>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setTab('prompts')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>프롬프트</button>
                      <button onClick={()=>setTab('apt')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>아파트 수정</button>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:'#94a3b8',marginBottom:10}}>발송할 세그먼트 선택</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                    {ALL_GROUPS.map(g=>{
                      const cnt=groupCounts[g.id]||0; if(!cnt) return null;
                      const isSel=bulkGroup===g.id;
                      return(
                        <div key={g.id} onClick={()=>{setBulkGroup(isSel?null:g.id);setBulkEditMsg('');setBulkTmplSel(null);setBulkAiMsg('');setBulkResult(null);}}
                          style={{background:isSel?`${g.color}15`:'rgba(255,255,255,0.03)',border:isSel?`1px solid ${g.color}50`:'1px solid rgba(255,255,255,0.08)',borderRadius:11,padding:'12px 14px',cursor:'pointer'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                            <span style={{fontSize:18}}>{g.icon}</span>
                            <span style={{fontSize:11,fontWeight:600,color:isSel?g.color:'#cbd5e1'}}>{g.name}</span>
                          </div>
                          <div style={{fontSize:10,color:'#64748b'}}>{g.desc}</div>
                          <div style={{fontSize:13,fontWeight:700,color:g.color,marginTop:5}}>{cnt.toLocaleString()}명</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* 오른쪽: 템플릿/AI 패널 */}
                <div style={{position:'sticky',top:60,alignSelf:'start'}}>
                  {!bulkGroup?(
                    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:30,textAlign:'center',color:'#334155',fontSize:12}}>
                      왼쪽에서 세그먼트를 선택해주세요
                    </div>
                  ):(()=>{
                    const g=getGroup(bulkGroup);
                    const targets=customers.filter(c=>c.groupId===bulkGroup);
                    return(
                      <div>
                        <div style={{background:`${g.color}10`,border:`1px solid ${g.color}30`,borderRadius:11,padding:'10px 14px',marginBottom:10}}>
                          <div style={{fontSize:12,fontWeight:700,color:g.color}}>{g.icon} {g.name} · {targets.length}명</div>
                          <div style={{fontSize:10,color:'#64748b',marginTop:2}}>{g.desc}</div>
                        </div>
                        <div style={{display:'flex',gap:6,marginBottom:10}}>
                          <button onClick={()=>{setBulkMode('template');setBulkAiMsg('');setBulkEditMsg('');}}
                            style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:bulkMode==='template'?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)',color:bulkMode==='template'?'#a5b4fc':'#64748b'}}>📋 템플릿</button>
                          <button onClick={()=>{setBulkMode('ai');generateBulkAI(bulkGroup);}}
                            style={{flex:1,padding:'8px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:bulkMode==='ai'?'rgba(168,85,247,0.25)':'rgba(255,255,255,0.05)',color:bulkMode==='ai'?'#c084fc':'#64748b'}}>✨ AI 생성</button>
                        </div>
                        {bulkMode==='template'&&(
                          <div>
                            <div style={{fontSize:11,color:g.color,fontWeight:600,marginBottom:6}}>⭐ {g.short} 추천 3개</div>
                            <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:8,maxHeight:130,overflowY:'auto'}}>
                              {(TEMPLATE_MAPPING[bulkGroup]||[]).slice(0,3).map(id=>{
                                const t=templates.find(x=>x.id===id)||TEMPLATES.find(x=>x.id===id);
                                return t?(
                                  <div key={id} onClick={()=>{setBulkTmplSel(t);setBulkEditMsg(t.content);}}
                                    style={{background:bulkTmplSel?.id===t.id?`${g.color}20`:'rgba(255,255,255,0.04)',border:`1px solid ${bulkTmplSel?.id===t.id?g.color:'rgba(255,255,255,0.08)'}`,borderRadius:8,padding:'8px 11px',cursor:'pointer'}}>
                                    <div style={{fontSize:11,fontWeight:600,color:bulkTmplSel?.id===t.id?g.color:'#cbd5e1',marginBottom:3}}>{t.title}</div>
                                    <div style={{fontSize:10,color:'#475569'}}>{t.content.slice(0,50)}...</div>
                                  </div>
                                ):null;
                              })}
                            </div>
                            <input value={bulkTmplSearch} onChange={e=>setBulkTmplSearch(e.target.value)} placeholder="🔍 전체 템플릿 검색..."
                              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,padding:'6px 11px',color:'#e2e8f0',fontSize:11,outline:'none',marginBottom:6}}/>
                            {bulkTmplSearch&&(
                              <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:100,overflowY:'auto',marginBottom:8}}>
                                {templates.filter(t=>t.title.includes(bulkTmplSearch)||t.content.includes(bulkTmplSearch)).map(t=>(
                                  <div key={t.id} onClick={()=>{setBulkTmplSel(t);setBulkEditMsg(t.content);}}
                                    style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6,padding:'5px 10px',cursor:'pointer'}}>
                                    <span style={{fontSize:11,color:'#94a3b8'}}>{t.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {bulkMode==='ai'&&(
                          <div style={{marginBottom:8}}>
                            {bulkAiLoading?(
                              <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0',color:'#a5b4fc',fontSize:12}}>
                                {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#6366f1',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
                                <span>{g.name} 맞춤 메시지 생성 중...</span>
                              </div>
                            ):bulkAiMsg&&(
                              <div style={{display:'flex',gap:7,marginBottom:6}}>
                                <div style={{fontSize:11,color:'#10b981',flex:1}}>✅ 생성 완료</div>
                                <button onClick={()=>generateBulkAI(bulkGroup)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>🔄 재생성</button>
                              </div>
                            )}
                          </div>
                        )}
                        {(bulkEditMsg||(bulkMode==='template'&&bulkTmplSel))&&!bulkAiLoading&&(
                          <div>
                            {isAd&&<div style={{fontSize:10,color:'#f59e0b',marginBottom:4}}>⚠️ 광고 표기 ON — 메시지 앞에 (광고) 자동 추가</div>}
                            <textarea value={bulkEditMsg} onChange={e=>setBulkEditMsg(e.target.value)}
                              style={{width:'100%',minHeight:100,background:'#111827',border:'1px solid rgba(255,255,255,0.08)',borderRadius:9,padding:11,fontSize:12,lineHeight:1.7,color:'#e2e8f0',resize:'vertical',outline:'none',marginBottom:8}}/>
                            {bulkResult&&<div style={{padding:'7px 11px',borderRadius:7,marginBottom:8,fontSize:11,background:bulkResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:bulkResult.ok?'#10b981':'#f87171'}}>{bulkResult.msg}</div>}
                            <button onClick={()=>sendBulk(targets,g.name,bulkEditMsg||null)} disabled={bulkSending}
                              style={{width:'100%',padding:'11px',borderRadius:10,border:'none',cursor:bulkSending?'not-allowed':'pointer',fontSize:13,fontWeight:700,background:bulkSending?'rgba(99,102,241,0.3)':`linear-gradient(135deg,${g.color},${g.color}cc)`,color:'white'}}>
                              {bulkSending?'발송 중...':`${g.icon} ${g.name} ${targets.length}명 발송`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 개별 발송 모드 */}
            {sendMode==='individual'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 460px',gap:20}}>
            {/* 고객 목록 */}
            <div>
              <div style={{background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:9,padding:'8px 14px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:12}}>
                  <span style={{color:'#a5b4fc',fontWeight:600}}>📌 {apt.name}</span>
                  <span style={{color:'#64748b',marginLeft:10,fontSize:11}}>{apt.date}</span>
                </span>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>setTab('prompts')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>프롬프트</button>
                  <button onClick={()=>setTab('apt')} style={{background:'none',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc',padding:'3px 9px',borderRadius:6,cursor:'pointer',fontSize:10}}>아파트 수정</button>
                </div>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
                <button onClick={()=>setFilterGroup(null)} style={{padding:'4px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:10,background:!filterGroup?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',color:!filterGroup?'#a5b4fc':'#64748b'}}>전체 ({customers.length})</button>
                {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id]||0;return cnt>0?(
                  <button key={g.id} onClick={()=>setFilterGroup(g.id===filterGroup?null:g.id)} style={{padding:'4px 10px',borderRadius:20,border:'none',cursor:'pointer',fontSize:10,background:filterGroup===g.id?`${g.color}25`:'rgba(255,255,255,0.06)',color:filterGroup===g.id?g.color:'#64748b'}}>
                    {g.icon} {g.short} ({cnt})
                  </button>
                ):null;})}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {filtered.slice(0,50).map(c=>{
                  const g=getGroup(c.groupId); const isSel=selected?.id===c.id;
                  return(
                    <div key={c.id} onClick={()=>handleCustomerClick(c)}
                      style={{background:isSel?'rgba(99,102,241,0.1)':'rgba(255,255,255,0.03)',border:isSel?`1px solid ${g.color}60`:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'11px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:11}}>
                      <div style={{width:37,height:37,borderRadius:'50%',background:`${g.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{g.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                          <span style={{fontWeight:600,fontSize:13}}>{c.name}</span>
                          <span style={{fontSize:10,color:g.color,background:`${g.color}15`,padding:'1px 7px',borderRadius:20}}>{g.tier}차 · {g.short}</span>
                          {c.phone&&<span style={{fontSize:10,color:'#475569'}}>📱 {c.phone}</span>}
                        </div>
                        <div style={{fontSize:11,color:'#64748b'}}>{c.age} · {c.gender} · {c.region}</div>
                        {(c.자격||c.목적)&&<div style={{fontSize:10,color:'#475569',marginTop:2}}>{c.자격} · {c.목적}</div>}
                      </div>
                      <div style={{fontSize:11,color:'#6366f1',fontWeight:500,flexShrink:0}}>선택 →</div>
                    </div>
                  );
                })}
                {filtered.length>50&&<div style={{textAlign:'center',fontSize:11,color:'#475569',padding:10}}>... 외 {(filtered.length-50).toLocaleString()}명 더 있음</div>}
              </div>
            </div>

            {/* 오른쪽 패널 */}
            <div style={{position:'sticky',top:80,alignSelf:'start'}}>
              {!selected?(
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:20,textAlign:'center',paddingTop:80}}>
                  <div style={{fontSize:32,marginBottom:10}}>✦</div>
                  <div style={{fontSize:13,color:'#475569'}}>왼쪽에서 고객을 클릭하면</div>
                  <div style={{fontSize:13,color:'#a5b4fc',marginTop:4}}>{apt.name}</div>
                  <div style={{fontSize:13,color:'#475569'}}>맞춤 템플릿을 추천해드립니다</div>
                  <div style={{marginTop:16,fontSize:11,color:'#334155'}}>총 {templates.length}개 템플릿 · 세그먼트별 자동 매칭</div>
                </div>
              ):(()=>{
                const g=getGroup(selected.groupId);
                const recIds=TEMPLATE_MAPPING[g.id]||[];
                const recTemplates=recIds.slice(0,3).map(id=>templates.find(t=>t.id===id)||TEMPLATES.find(t=>t.id===id)).filter(Boolean);
                return(
                  <div>
                    {/* 고객 카드 */}
                    <div style={{background:`${g.color}10`,border:`1px solid ${g.color}30`,borderRadius:12,padding:'11px 15px',marginBottom:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:18}}>{g.icon}</span>
                        <span style={{fontWeight:700,fontSize:13}}>{selected.name}</span>
                        <span style={{fontSize:10,color:g.color,marginLeft:4}}>{g.tier}차 · {g.name}</span>
                      </div>
                      <div style={{fontSize:10,color:'#475569'}}>{selected.age} · {selected.gender} · {selected.region} · {selected.자격}</div>
                    </div>

                    {/* 모드 버튼 */}
                    <div style={{display:'flex',gap:6,marginBottom:12}}>
                      <button onClick={()=>{setAiMode('template');setAiMsg('');setEditMsg(selTemplate?.content||'');}}
                        style={{flex:1,padding:'9px',borderRadius:9,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                          background:aiMode==='template'?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)',
                          color:aiMode==='template'?'#a5b4fc':'#64748b'}}>
                        📋 템플릿 선택
                      </button>
                      <button onClick={()=>{setAiMode('ai');generateAI(selected);}}
                        style={{flex:1,padding:'9px',borderRadius:9,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                          background:aiMode==='ai'?'rgba(168,85,247,0.25)':'rgba(255,255,255,0.05)',
                          color:aiMode==='ai'?'#c084fc':'#64748b'}}>
                        ✨ AI 자동생성
                      </button>
                    </div>

                    {/* 템플릿 모드 */}
                    {aiMode==='template'&&(
                      <div>
                        <div style={{marginBottom:10}}>
                          <input value={tmplSearch} onChange={e=>setTmplSearch(e.target.value)} placeholder="🔍 템플릿 검색..."
                            style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 12px',color:'#e2e8f0',fontSize:12,outline:'none'}}/>
                        </div>
                        {!tmplSearch&&(
                          <div style={{marginBottom:12}}>
                            <div style={{fontSize:11,color:g.color,fontWeight:600,marginBottom:7}}>⭐ {g.short} 추천 템플릿 (3개)</div>
                            <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:200,overflowY:'auto'}}>
                              {recTemplates.map(t=>(
                                <div key={t.id} onClick={()=>pickTemplate(t)}
                                  style={{background:selTemplate?.id===t.id?`${g.color}20`:'rgba(255,255,255,0.04)',
                                    border:`1px solid ${selTemplate?.id===t.id?g.color:'rgba(255,255,255,0.08)'}`,
                                    borderRadius:9,padding:'9px 12px',cursor:'pointer'}}>
                                  <div style={{fontSize:11,fontWeight:600,color:selTemplate?.id===t.id?g.color:'#cbd5e1',marginBottom:4}}>{t.title}</div>
                                  <div style={{fontSize:10,color:'#475569',lineHeight:1.5}}>{t.content.slice(0,70)}...</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <div style={{fontSize:11,color:'#475569',marginBottom:6}}>{tmplSearch?`검색결과 (${searchedTemplates.length}개)`:`전체 ${templates.length}개 템플릿`}</div>
                          <div style={{display:'flex',flexDirection:'column',gap:3,maxHeight:170,overflowY:'auto'}}>
                            {searchedTemplates.map(t=>(
                              <div key={t.id} onClick={()=>pickTemplate(t)}
                                style={{background:selTemplate?.id===t.id?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.03)',
                                  border:`1px solid ${selTemplate?.id===t.id?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.06)'}`,
                                  borderRadius:7,padding:'6px 11px',cursor:'pointer'}}>
                                <span style={{fontSize:11,color:selTemplate?.id===t.id?'#a5b4fc':'#94a3b8'}}>{t.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI 모드 */}
                    {aiMode==='ai'&&(
                      <div>
                        {loading?(
                          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:'20px 0',color:'#f59e0b',fontSize:12}}>
                            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#6366f1',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`}}/>)}
                            <span style={{marginLeft:8}}>Claude가 템플릿 참고하여 생성 중...</span>
                          </div>
                        ):(
                          <div style={{fontSize:11,color:'#10b981',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
                            <span style={{width:6,height:6,borderRadius:'50%',display:'inline-block',background:'#10b981',boxShadow:'0 0 5px #10b981'}}/>
                            생성 완료 · 수정 후 발송 가능
                          </div>
                        )}
                      </div>
                    )}

                    {/* 메시지 편집창 */}
                    {(editMsg||selTemplate)&&!loading&&(
                      <div style={{marginTop:10}}>
                        <div style={{fontSize:11,color:'#64748b',marginBottom:5}}>
                          {aiMode==='ai'?'✨ AI 생성 메시지':selTemplate?`📋 ${selTemplate.title}`:''} · 수정 후 발송
                        </div>
                        {isAd&&<div style={{fontSize:10,color:'#f59e0b',marginBottom:5}}>⚠️ 광고 표기 ON — 발송 시 (광고) 자동 추가</div>}
                        <textarea value={editMsg} onChange={e=>setEditMsg(e.target.value)}
                          style={{width:'100%',minHeight:130,background:'#111827',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:13,fontSize:12,lineHeight:1.8,color:'#e2e8f0',resize:'vertical',outline:'none',marginBottom:10}}/>
                        {sendResult&&<div style={{padding:'8px 12px',borderRadius:8,marginBottom:10,fontSize:12,fontWeight:500,background:sendResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:sendResult.ok?'#10b981':'#f87171'}}>{sendResult.msg}</div>}
                        <div style={{display:'flex',gap:7}}>
                          {aiMode==='ai'&&<button onClick={()=>generateAI(selected)} style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',padding:'9px',borderRadius:9,cursor:'pointer',fontSize:12}}>🔄 재생성</button>}
                          <button onClick={sendKakao} disabled={sending||!editMsg}
                            style={{flex:2,background:sending||!editMsg?'rgba(99,102,241,0.3)':'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'white',padding:'9px',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:600}}>
                            {sending?'발송 중...':'💬 카카오 알림톡 발송'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
            )}
          </div>
        )}

        {/* ══ AI 에이전트 ══ */}
        {tab==='agent'&&(
          <div style={{maxWidth:960}}>
            {/* ── 프로세스 & 입력 정보 설명 ── */}
            <div style={{marginBottom:20}}>
              {/* 적용 프로세스 */}
              <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12))',border:'1px solid rgba(99,102,241,0.3)',borderRadius:14,padding:'16px 20px',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:18}}>🤖</span>
                  <div style={{fontSize:14,fontWeight:700,color:'#a5b4fc'}}>AI 에이전트 적용 프로세스</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  {[
                    {step:'1',label:'대상 고객 선택',icon:'👥'},
                    {step:'2',label:'세그먼트 자동 확인',icon:'🔍'},
                    {step:'3',label:'추천 템플릿 매칭',icon:'📋'},
                    {step:'4',label:'개인화 메시지 생성',icon:'✍️'},
                    {step:'5',label:'발송내역 저장',icon:'💾'},
                  ].map((s,i,arr)=>(
                    <div key={s.step} style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(99,102,241,0.15)',borderRadius:8,padding:'6px 12px'}}>
                        <span style={{fontSize:13}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:9,color:'#6366f1',fontWeight:700}}>STEP {s.step}</div>
                          <div style={{fontSize:11,color:'#e2e8f0',fontWeight:500}}>{s.label}</div>
                        </div>
                      </div>
                      {i<arr.length-1&&<span style={{color:'#334155',fontSize:14}}>→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 입력되는 정보 4가지 */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {[
                  {num:'1',icon:'👤',title:'고객 정보',color:'#06b6d4',items:['이름','나이·성별','거주 지역','청약 자격','구매 목적']},
                  {num:'2',icon:'🎯',title:'세그먼트',color:'#6366f1',items:['1~10차 그룹 분류','거절/관망/즉시전환','조건부 유입','그룹별 특성 반영','자동 판별']},
                  {num:'3',icon:'✏️',title:'프롬프트 설정',color:'#a855f7',items:['말투·톤','메시지 스타일','목표 글자 수','추가 지시사항','금지 표현']},
                  {num:'4',icon:'🏢',title:'아파트 정보',color:'#f59e0b',items:['아파트명','청약일','분양가','위치·특징','공급 세대']},
                ].map(info=>(
                  <div key={info.num} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${info.color}25`,borderRadius:11,padding:'12px 14px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                      <div style={{width:24,height:24,borderRadius:6,background:`${info.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>{info.icon}</div>
                      <div>
                        <div style={{fontSize:9,color:info.color,fontWeight:700}}>입력 {info.num}</div>
                        <div style={{fontSize:11,fontWeight:600,color:'#e2e8f0'}}>{info.title}</div>
                      </div>
                    </div>
                    {info.items.map(item=>(
                      <div key={item} style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                        <div style={{width:4,height:4,borderRadius:'50%',background:info.color,flexShrink:0}}/>
                        <span style={{fontSize:10,color:'#64748b'}}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:9,padding:'8px 14px',fontSize:11,color:'#10b981'}}>
                💡 같은 세그먼트라도 고객마다 이름·자격·지역이 다르면 메시지가 조금씩 달라져요. 세그먼트별 추천 템플릿 3개를 스타일 참고용으로 활용해 Claude가 개인화 메시지를 생성합니다.
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:18}}>
              {/* 설정 패널 */}
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
                    <div style={{fontSize:11,color:'#64748b',marginBottom:7,fontWeight:500}}>최대 처리 인원 (API 비용 조절)</div>
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

                  {/* 현재 아파트 */}
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
                        <span style={{display:'flex',gap:4}}>
                          {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'white',animation:'pulse 1.2s ease-in-out infinite',animationDelay:`${i*0.2}s`,display:'inline-block'}}/>)}
                        </span>
                        에이전트 실행 중...
                      </>
                    ):'🚀 에이전트 시작'}
                  </button>

                  {agentDone&&agentResults.length>0&&(
                    <button onClick={sendAllAgentResults}
                      style={{width:'100%',padding:'10px',borderRadius:10,border:'none',cursor:'pointer',
                        fontSize:12,fontWeight:600,marginTop:8,
                        background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'white'}}>
                      💬 전체 {agentResults.length}명 발송내역에 저장
                    </button>
                  )}
                </div>
              </div>

              {/* 로그 + 결과 */}
              <div>
                {/* 실행 로그 */}
                <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px',marginBottom:14}}>
                  <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:10}}>
                    📡 실행 로그
                    {agentRunning&&<span style={{marginLeft:8,fontSize:10,color:'#f59e0b',animation:'pulse 1s infinite'}}>● 실행 중</span>}
                    {agentDone&&<span style={{marginLeft:8,fontSize:10,color:'#10b981'}}>✅ 완료</span>}
                  </div>
                  <div style={{background:'#0a0e1a',borderRadius:9,padding:'12px 14px',minHeight:180,maxHeight:280,overflowY:'auto',fontFamily:'monospace',fontSize:11}}>
                    {agentLogs.length===0?(
                      <div style={{color:'#334155',textAlign:'center',paddingTop:60}}>에이전트 시작 버튼을 누르면 로그가 표시돼요</div>
                    ):agentLogs.map((log,i)=>(
                      <div key={i} style={{marginBottom:5,color:log.type==='error'?'#f87171':log.type==='success'?'#10b981':log.type==='done'?'#a5b4fc':'#94a3b8',lineHeight:1.6}}>
                        <span style={{color:'#475569',marginRight:8}}>{log.time}</span>
                        <span>{log.icon}</span>
                        <span style={{marginLeft:5}}>{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 생성된 메시지 결과 */}
                {agentResults.length>0&&(
                  <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'16px 18px'}}>
                    <div style={{fontSize:12,color:'#94a3b8',fontWeight:600,marginBottom:12}}>
                      ✨ 생성된 메시지 ({agentResults.length}건)
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:400,overflowY:'auto'}}>
                      {agentResults.map((r,i)=>(
                        <div key={i} style={{background:'rgba(16,185,129,0.04)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:11,padding:'12px 14px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8,flexWrap:'wrap'}}>
                            <span>{r.group.icon}</span>
                            <span style={{fontWeight:600,fontSize:12}}>{r.customer.name}</span>
                            <span style={{fontSize:10,color:r.group.color,background:`${r.group.color}15`,padding:'1px 7px',borderRadius:20}}>{r.group.short}</span>
                            <span style={{fontSize:10,color:'#64748b',background:'rgba(255,255,255,0.06)',padding:'1px 7px',borderRadius:20}}>📋 {r.templateTitle}</span>
                            <span style={{fontSize:10,color:'#475569',marginLeft:'auto'}}>{r.time}</span>
                          </div>
                          <div style={{fontSize:12,color:'#cbd5e1',background:'#0f172a',padding:'10px 12px',borderRadius:8,lineHeight:1.7,whiteSpace:'pre-line'}}>{r.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ 발송 내역 ══ */}
        {tab==='sent'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:12,color:'#94a3b8',fontWeight:500}}>발송 내역 ({sent.length}건)</div>
              {sent.length>0&&<div style={{fontSize:11,color:'#10b981'}}>✅ 총 {sent.length}명 발송</div>}
            </div>
            {sent.length===0?(
              <div style={{textAlign:'center',paddingTop:100,color:'#334155'}}>
                <div style={{fontSize:34,marginBottom:10}}>📭</div>
                <div>아직 발송된 메시지가 없습니다</div>
              </div>
            ):sent.map((item,i)=>(
              <div key={i} style={{background:'rgba(99,102,241,0.04)',border:'1px solid rgba(99,102,241,0.15)',borderRadius:12,padding:'14px 18px',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                    <span>{item.group.icon}</span>
                    <span style={{fontWeight:600,fontSize:13}}>{item.customer.name}</span>
                    <span style={{fontSize:10,color:item.group.color,background:`${item.group.color}15`,padding:'1px 7px',borderRadius:20}}>{item.group.tier}차 · {item.group.short}</span>
                    <span style={{fontSize:10,color:'#6366f1',background:'rgba(99,102,241,0.1)',padding:'1px 7px',borderRadius:20}}>📌 {item.apt}</span>
                    <span style={{fontSize:10,color:'#94a3b8',background:'rgba(255,255,255,0.06)',padding:'1px 7px',borderRadius:20}}>📋 {item.label}</span>
                    {item.simulated&&<span style={{fontSize:10,color:'#f59e0b',background:'rgba(245,158,11,0.1)',padding:'1px 7px',borderRadius:20}}>시뮬레이션</span>}
                  </div>
                  <span style={{fontSize:10,color:'#64748b'}}>{item.time}</span>
                </div>
                <div style={{fontSize:12,color:'#94a3b8',background:'#0f172a',padding:'10px 13px',borderRadius:8,lineHeight:1.7,whiteSpace:'pre-line'}}>{item.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  </div>
  );
}
