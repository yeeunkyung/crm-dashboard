import { useState, useRef } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const GSHEET_API_KEY = import.meta.env.VITE_GSHEET_API_KEY || "";

const TEMPLATES = [
  {id:0,title:"[브랜드] 무순위 청약 안내(2차)",content:"[브랜드] 무순위 청약 안내\n \n무순위 청약일정을 안내 드리며, 풍성하고 정겨운 설 명절 보내시길 바랍니다.\n\n▶무순위 일정안내\n - 무순위 모집공고 : 02월 13일(금)\n - 무순위 청약접수 : 02월 23일(월)\n - 무순위 청약방법 : 하단 청약홈 홈페이지\n\n■ 무순위 청약자격\n - 무순위 모집공고일 현재 무주택 세대구성원\n - 청약통장 가입여부와 무관하게 신청 가능"},
  {id:1,title:"견본주택 운영안내",content:"[브랜드 견본주택 운영 안내]\n\n고객님의 성원에 힘입어 정당계약이 성황리에 마무리 되었습니다.\n견본주택 운영 관련하여 안내드리니 참고하시어 견본주택 방문에 착오 없으시길 바랍니다.\n\n▶ 일정 안내\n → 2월 13(금)~14(토) - 관람가능\n → 2월 15(일)~18(수) - 설연휴 휴관"},
  {id:2,title:"[브랜드] 문자 발송 테스트",content:"[브랜드] 문자 발송 테스트"},
  {id:3,title:"예비입주자 추첨 및 계약 안내",content:"[브랜드 예비입주자 추첨 및 계약 안내]\n\n★ 동·호수 추첨 이후 즉시 계약 체결을 진행하므로 계약금 입금과 관련한 사항은 사전에 준비해주시기 바랍니다.\n\n▶ 일정\n - 2026. 2. 12(목)\n - 입장 : 9시30분부터 10시까지 입장 마감"},
  {id:4,title:"무순위 계약 안내(당일)",content:"[브랜드]무순위 계약 안내\n\n▷금일은 무순위 계약일입니다.\n\n[무순위 계약 일정]\n- 계약 장소 : 브랜드 견본주택\n※ 계약 후 감사의 마음을 담은 사은품도 꼭 받아가세요!"},
  {id:5,title:"브랜드 무순위(2차) 정당계약 안내",content:"[브랜드 무순위(2차) 정당계약 안내]\n\n▶ 정당계약 일정 안내\n- 계약기간 : 2월 10일(화)~11일(수), 10:00 ~ 17:00\n- 계약장소 : 브랜드 견본주택"},
  {id:6,title:"브랜드 무순위(2차) 예비당첨자 추첨 및 계약 안내",content:"[브랜드 무순위(2차) 예비당첨자 추첨 및 계약 안내]\n\n▶ 일정 안내\n- 입장시간 : 09:30 ~ 10:00까지 입장\n- 계약시간 : 10:00 ~ 17:00"},
  {id:7,title:"브랜드 무순위(2차) 정당계약 안내",content:"[브랜드 무순위(2차) 정당계약 안내]\n\n2월 10일, 2월 11일은 브랜드 무순위(2차) 정당계약일 입니다."},
  {id:8,title:"무순위 계약 안내",content:"[브랜드] 무순위 계약 안내\n\n▷브랜드에 당첨을 축하드립니다.\n▷원활한 계약 진행을 위해 방문 예약제를 진행합니다."},
  {id:9,title:"계약 안내",content:"[브랜드 당첨자 계약 안내]\n\n▣ 정당계약 안내\n▪ 계약기간: 2월 8일(일) ~ 2월 10일(화)\n   오전 10:00 ~ 오후 4:00까지 입장"},
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
  {id:26,title:"예당 추첨 및 계약 안내(1차)",content:"[브랜드]예비입주자 동호추첨 및 계약 안내\n\n▶일반공급 동호추첨 및 계약일정\n - 입장시간 : 11:30 ~ 12:00까지 입장"},
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
  {id:44,title:"브랜드 무순위(2차)안내",content:"[브랜드 무순위(2차) 청약 안내]\n\n브랜드 무순위(2차) 일정을 안내드립니다.\n\n▶ 청약 일정\n- 모집공고 : 1월 17일(토)\n- 청약접수 : 1월 27일(화)"},
  {id:45,title:"당첨자 서류접수 안내",content:"[브랜드 당첨자 서류접수 안내]\n\n브랜드 당첨을 진심으로 축하드립니다.\n\n서류접수 기간은 1월 20일(화) ~ 1월 22일(목), 10:00 ~ 17:00 입니다."},
  {id:46,title:"예당 서류접수 안내",content:"[브랜드 예비당첨자 서류접수 안내]\n\n예비당첨자로 선정되신 것을 축하드립니다.\n\n서류접수 기간은 1월 23일(금) ~ 1월 24일(토), 10:00 ~ 17:00 입니다."},
  {id:47,title:"계약취소 세대 안내",content:"[브랜드 계약취소 세대 추가 계약 안내]\n\n계약취소 세대가 발생하여 추가 계약을 진행합니다.\n일정 및 자세한 내용은 브랜드 홈페이지를 참조하여 주시기 바랍니다."},
  {id:48,title:"브랜드 래미안 원베일리 안내",content:"[브랜드] 래미안 원베일리 안내\n\n래미안 원베일리 관련 안내드립니다."},
  {id:49,title:"잠재수요 초기 안내",content:"[브랜드] 안녕하세요!\n\n관심 가져주셔서 감사합니다. 브랜드 분양 관련 최신 정보를 안내드리겠습니다."},
];

const SEGMENTS = [
  {tier:"1차",tierLabel:"거절/관망",tierColor:"#94a3b8",tierBg:"rgba(148,163,184,0.08)",tierBorder:"rgba(148,163,184,0.25)",
    groups:[
      {id:1,name:"그룹1 거절 및 관망",short:"거절·관망",icon:"🚫",color:"#94a3b8",desc:"청약 의사 없음 + 분양 일정 몰랐음"},
      {id:2,name:"그룹2 관심도",short:"관심도",icon:"👀",color:"#64748b",desc:"청약 의사 없음 + 분양 일정 알고 있었음"},
    ]},
  {tier:"2차",tierLabel:"즉시 전환",tierColor:"#6366f1",tierBg:"rgba(99,102,241,0.08)",tierBorder:"rgba(99,102,241,0.25)",
    groups:[
      {id:3,name:"그룹3 VIP 즉시 전환 1",short:"VIP 전환1",icon:"👑",color:"#f59e0b",desc:"청약 의사 있음 + 1순위 자격"},
      {id:4,name:"그룹4 VIP 즉시 전환 2",short:"VIP 전환2",icon:"💎",color:"#a855f7",desc:"청약 의사 있음 + 특별공급 자격"},
      {id:5,name:"그룹5 청약 가능성 1",short:"청약가능1",icon:"⭐",color:"#10b981",desc:"청약 의사 있음 + 2순위 자격"},
      {id:6,name:"그룹6 청약 가능성 2",short:"청약가능2",icon:"🌟",color:"#06b6d4",desc:"청약 의사 있음 + 무순위 자격"},
    ]},
  {tier:"3차",tierLabel:"조건부 전환",tierColor:"#f59e0b",tierBg:"rgba(245,158,11,0.08)",tierBorder:"rgba(245,158,11,0.25)",
    groups:[
      {id:7,name:"그룹7 MZ 주거",short:"MZ 주거",icon:"🏠",color:"#f97316",desc:"조건부 의사 + 20~40대 + 실거주"},
      {id:8,name:"그룹8 시니어",short:"시니어",icon:"🏡",color:"#ec4899",desc:"조건부 의사 + 50대+ 또는 투자/증여"},
    ]},
  {tier:"4차",tierLabel:"잠재 전환",tierColor:"#10b981",tierBg:"rgba(16,185,129,0.08)",tierBorder:"rgba(16,185,129,0.25)",
    groups:[
      {id:9,name:"그룹9 자산증식",short:"자산증식",icon:"💰",color:"#84cc16",desc:"투자/증여 목적"},
      {id:10,name:"그룹10 잠재수요",short:"잠재수요",icon:"🌱",color:"#6ee7b7",desc:"기타 목적"},
    ]},
  {tier:"테스트",tierLabel:"테스트",tierColor:"#10b981",tierBg:"rgba(16,185,129,0.08)",tierBorder:"rgba(16,185,129,0.25)",
    groups:[
      {id:99,name:"🧪 테스트 그룹",short:"테스트",icon:"🧪",color:"#10b981",desc:"SMS 테스트용"},
    ]},
];

const ALL_GROUPS = SEGMENTS.flatMap(s => s.groups.map(g => ({...g, tier:s.tier, tierLabel:s.tierLabel, tierColor:s.tierColor})));

const TEMPLATE_MAPPING = {
  1:[0,22,14,24],2:[1,24,12,29],3:[30,35,5,36],4:[32,27,39,43],
  5:[28,25,26,3],6:[28,44,0,22],7:[35,38,49,1],8:[35,38,49,1],
  9:[17,40,20,18],10:[49,35,38,1],99:[2,35,49,0],
};

const DEFAULT_APT = {name:'래미안 원베일리 2차',date:'2026년 4월 15일',price:'15억~20억',location:'서울 서초구'};

const DEFAULT_PROMPTS = {
  tone:'친근하고 전문적인',style:'간결하고 명확한',length:'100자 내외',
  extra:'청약 일정과 자격 조건 강조',forbidden:'과장 표현, 확정적 수익 언급',
};

const SAMPLE = [
  {id:1,name:'고객1',age:'40대',gender:'남자',region:'오산 기타',groupId:3,phone:'01011112222',memo:'',자격:'1순위',목적:'실거주',의사:'있다'},
  {id:2,name:'고객2',age:'30대',gender:'여자',region:'세고1, 내심마동',groupId:7,phone:'01022223333',memo:'',자격:'특별공급',목적:'실거주',의사:'조건부'},
  {id:3,name:'고객3',age:'40대',gender:'여자',region:'경기 기타',groupId:7,phone:'01033334444',memo:'',자격:'1순위',목적:'실거주',의사:'조건부'},
  {id:4,name:'고객4',age:'30대',gender:'여자',region:'경기 기타',groupId:4,phone:'01044445555',memo:'',자격:'특별공급',목적:'실거주',의사:'있다'},
  {id:5,name:'고객5',age:'50대',gender:'여자',region:'동탄2',groupId:3,phone:'01055556666',memo:'',자격:'1순위',목적:'실거주',의사:'있다'},
  {id:99,name:'📱 테스트',age:'30대',gender:'남자',region:'테스트',groupId:99,phone:'',memo:'👈 본인 번호 입력 후 테스트'},
];

function classifyGroup(row) {
  const 의사=(row['청약의사']||'').trim();
  const 자격=(row['청약자격']||'').trim();
  const 목적=(row['구매목적']||'').trim();
  const 나이=(row['나이']||'').trim();
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

function parseCSV(text) {
  const lines=text.trim().split('\n').filter(l=>l.trim());
  if(lines.length<2) return [];
  const headers=lines[0].split(',').map(h=>h.trim().replace(/"/g,'').replace(/^\uFEFF/,''));
  return lines.slice(1).map((line,idx)=>{
    const values=[];let cur='',inQ=false;
    for(let c of line){
      if(c==='"') inQ=!inQ;
      else if(c===','&&!inQ){values.push(cur.trim());cur='';}
      else cur+=c;
    }
    values.push(cur.trim());
    const obj={};
    headers.forEach((h,i)=>{obj[h]=values[i]||'';});
    return {
      id:idx+1,
      name:obj['이름']||obj['name']||obj['고객명']||`고객${idx+1}`,
      age:obj['나이']||'-',gender:obj['성별']||'-',
      region:obj['나의거주지역']||obj['지역']||'-',
      phone:(obj['연락처']||obj['phone']||'').replace(/-/g,''),
      groupId:classifyGroup(obj),memo:obj['비고']||obj['메모']||'',
      자격:obj['청약자격']||'',목적:obj['구매목적']||'',의사:obj['청약의사']||'',
    };
  }).filter(c=>c.name);
}

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

export default function App(){
  const [tab,setTab]=useState('data');
  const [apt,setApt]=useState(DEFAULT_APT);
  const [prompts,setPrompts]=useState(DEFAULT_PROMPTS);
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
  const [sendMode,setSendMode]=useState('individual');
  const [agentRunning,setAgentRunning]=useState(false);
  const [agentLogs,setAgentLogs]=useState([]);
  const [agentResults,setAgentResults]=useState([]);
  const [agentDone,setAgentDone]=useState(false);
  const [agentTarget,setAgentTarget]=useState('all');
  const [agentLimit,setAgentLimit]=useState(5);
  const [templates,setTemplates]=useState(TEMPLATES);
  const [tmplSheetUrl,setTmplSheetUrl]=useState('');
  const [tmplSheetLoading,setTmplSheetLoading]=useState(false);
  const [tmplSheetError,setTmplSheetError]=useState('');
  const [tmplSource,setTmplSource]=useState('default');
  const [promptSaveStatus,setPromptSaveStatus]=useState('saved');
  const [bulkSending,setBulkSending]=useState(false);
  const [bulkResult,setBulkResult]=useState(null);
  const [bulkGroup,setBulkGroup]=useState(null);
  const [isAd,setIsAd]=useState(false);
  const [bulkMode,setBulkMode]=useState('template');
  const [bulkTmplSel,setBulkTmplSel]=useState(null);
  const [bulkAiMsg,setBulkAiMsg]=useState('');
  const [bulkEditMsg,setBulkEditMsg]=useState('');
  const [bulkAiLoading,setBulkAiLoading]=useState(false);
  const [bulkTmplSearch,setBulkTmplSearch]=useState('');
  const [testPhone,setTestPhone]=useState('');

  const fileRef=useRef();
  const tmplFileRef=useRef();

  const applyAdPrefix=(msg)=>isAd&&msg&&!msg.startsWith('(광고)')?'(광고) '+msg:msg;

  const getGroup=(id)=>ALL_GROUPS.find(g=>g.id===id)||{name:'미분류',color:'#64748b',icon:'❓',short:'미분류',tier:'?',tierLabel:'?',tierColor:'#64748b'};

  const groupCounts=ALL_GROUPS.reduce((acc,g)=>{
    acc[g.id]=customers.filter(c=>c.groupId===g.id).length;
    return acc;
  },{});

  const totalCount=customers.length;

  // ── 고객 CSV 로드
  const handleCSV=file=>{
    if(!file) return;
    setCsvError('');
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

  // ── 구글 시트 로드
  const loadSheet=async()=>{
    if(!sheetUrl) return;
    setSheetLoading(true);setSheetError('');
    try{
      const match=sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match) throw new Error('잘못된 시트 URL 형식');
      if(!GSHEET_API_KEY) throw new Error('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');
      const res=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z1000?key=${GSHEET_API_KEY}`);
      const data=await res.json();
      if(data.error) throw new Error(data.error.message);
      if(!data.values||data.values.length<2) throw new Error('시트에 데이터가 없습니다.');
      const headers=data.values[0].map(h=>h.trim());
      const rows=data.values.slice(1).map((row,idx)=>{
        const obj={};headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return {
          id:idx+1,name:obj['이름']||obj['고객명']||`고객${idx+1}`,
          age:obj['나이']||'-',gender:obj['성별']||'-',
          region:obj['나의거주지역']||obj['지역']||'-',
          phone:(obj['연락처']||'').replace(/-/g,''),
          groupId:classifyGroup(obj),memo:obj['비고']||'',
          자격:obj['청약자격']||'',목적:obj['구매목적']||'',의사:obj['청약의사']||'',
        };
      }).filter(c=>c.name);
      setCustomers(rows);setDataSource('sheet');
    }catch(e){setSheetError('연동 실패: '+e.message);}
    setSheetLoading(false);
  };

  // ── 템플릿 CSV 로드
  const handleTmplCSV=file=>{
    if(!file) return;setTmplSheetError('');
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const parsed=parseCSV(e.target.result);
        if(!parsed.length){setTmplSheetError('데이터를 읽을 수 없어요.');return;}
        const rows=parsed.map((row,idx)=>({
          id:idx,
          title:row['템플릿 제목']||row['title']||`템플릿${idx+1}`,
          content:row['친구톡 내용']||row['대체문자 내용']||row['content']||'',
        })).filter(t=>t.title&&t.content);
        setTemplates(rows);setTmplSource('csv');
      }catch(err){setTmplSheetError('파일 오류: '+err.message);}
    };
    reader.readAsText(file,'UTF-8');
  };

  // ── 템플릿 시트 로드
  const loadTmplSheet=async()=>{
    if(!tmplSheetUrl) return;
    setTmplSheetLoading(true);setTmplSheetError('');
    try{
      const match=tmplSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if(!match) throw new Error('잘못된 시트 URL 형식');
      if(!GSHEET_API_KEY) throw new Error('VITE_GSHEET_API_KEY 환경변수를 설정해주세요.');
      const res=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${match[1]}/values/A1:Z200?key=${GSHEET_API_KEY}`);
      const data=await res.json();
      if(data.error) throw new Error(data.error.message);
      if(!data.values||data.values.length<2) throw new Error('시트에 데이터가 없습니다.');
      const headers=data.values[0].map(h=>h.trim());
      const rows=data.values.slice(1).map((row,idx)=>{
        const obj={};headers.forEach((h,i)=>{obj[h]=row[i]||'';});
        return {
          id:idx,
          title:obj['템플릿 제목']||obj['title']||`템플릿${idx+1}`,
          content:obj['친구톡 내용']||obj['대체문자 내용']||obj['content']||'',
        };
      }).filter(t=>t.title&&t.content);
      setTemplates(rows);setTmplSource('sheet');
    }catch(e){setTmplSheetError('연동 실패: '+e.message);}
    setTmplSheetLoading(false);
  };

  // ── 솔라피 인증
  const makeSolapiAuth=async()=>{
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
      body:JSON.stringify({message:{to:to.replace(/-/g,''),from:sender,text}}),
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.errorMessage||data.message||'발송 실패');
    return data;
  };

  // ── 개별 발송
  const sendKakao=async()=>{
    if(!editMsg||!selected) return;
    setSending(true);setSendResult(null);
    const g=getGroup(selected.groupId);
    const finalMsg=applyAdPrefix(editMsg);
    const phone=selected.phone||'';
    try{
      if(phone&&phone.length>=10){
        await sendSMS(phone,finalMsg);
        setSendResult({ok:true,msg:`✅ SMS 발송 완료 → ${phone}`});
      } else {
        setSendResult({ok:true,msg:'✅ 시뮬레이션 완료 (전화번호 없음)'});
      }
      setSent(prev=>[{
        customer:selected,message:finalMsg,group:g,apt:apt.name,
        time:new Date().toLocaleTimeString(),
        label:selTemplate?selTemplate.title:'AI 생성',
        simulated:!(phone&&phone.length>=10),
      },...prev]);
    }catch(e){
      setSendResult({ok:false,msg:'❌ 발송 실패: '+e.message});
    }
    setSending(false);
  };

  // ── 그룹/전체 발송
  const sendBulk=async(targetCustomers,label,overrideMsg=null)=>{
    setBulkSending(true);setBulkResult(null);
    let okCount=0,noPhone=0,failCount=0;
    for(const c of targetCustomers){
      const g=getGroup(c.groupId);
      const recIds=(TEMPLATE_MAPPING[g.id]||[]).slice(0,1);
      const tmpl=templates.find(t=>t.id===recIds[0]);
      const rawMsg=overrideMsg||(tmpl?tmpl.content:`[${apt.name}] ${c.name}님, ${apt.date} 청약 일정을 안내드립니다.`);
      const finalMsg=applyAdPrefix(rawMsg);
      const phone=c.phone||'';
      try{
        if(phone&&phone.length>=10){
          await sendSMS(phone,finalMsg);
          okCount++;
        } else {
          noPhone++;
        }
        setSent(prev=>[{
          customer:c,message:finalMsg,group:g,apt:apt.name,
          time:new Date().toLocaleTimeString(),
          label:tmpl?tmpl.title:'기본템플릿',
          simulated:!(phone&&phone.length>=10),
        },...prev]);
      }catch(e){
        failCount++;
      }
    }
    setBulkResult({ok:true,msg:`✅ ${label} ${targetCustomers.length}명 처리 완료 (실발송:${okCount}, 번호없음:${noPhone}, 실패:${failCount})`});
    setBulkSending(false);
  };

  // ── AI 메시지 생성 (개별)
  const generateAI=async(customer)=>{
    if(!customer) return;
    setLoading(true);setAiMsg('');setEditMsg('');
    const g=getGroup(customer.groupId);
    const prompt=`당신은 청약 분양 전문 마케터입니다.
다음 고객에게 맞춤 문자 메시지를 작성해주세요.

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
- 강조사항: ${prompts.extra}
- 금지표현: ${prompts.forbidden}

메시지만 작성하세요 (설명 없이):`;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const msg=data.content?.[0]?.text||'생성 실패';
      setAiMsg(msg);setEditMsg(msg);
    }catch(e){setAiMsg('오류: '+e.message);}
    setLoading(false);
  };

  // ── 그룹/전체 AI 메시지 생성
  const generateBulkAI=async(groupId)=>{
    setBulkAiLoading(true);setBulkAiMsg('');setBulkEditMsg('');
    const g=groupId?getGroup(groupId):null;
    const prompt=`당신은 청약 분양 전문 마케터입니다.
${g?`[${g.name}] 세그먼트 고객들에게`:'전체 고객에게'} 보낼 단체 문자 메시지를 작성해주세요.

[아파트 정보]
- 단지명: ${apt.name}
- 청약일: ${apt.date}
- 가격: ${apt.price}

[작성 가이드]
- 말투: ${prompts.tone}
- 스타일: ${prompts.style}
- 길이: ${prompts.length}
- 강조사항: ${prompts.extra}
- 금지표현: ${prompts.forbidden}
${g?`- 대상 특성: ${g.desc}`:''}

메시지만 작성하세요:`;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:prompt}]}),
      });
      const data=await res.json();
      const msg=data.content?.[0]?.text||'생성 실패';
      setBulkAiMsg(msg);setBulkEditMsg(msg);
    }catch(e){setBulkAiMsg('오류: '+e.message);}
    setBulkAiLoading(false);
  };

  // ── AI 에이전트 실행
  const runAgent=async()=>{
    setAgentRunning(true);setAgentDone(false);setAgentLogs([]);setAgentResults([]);
    const targets=agentTarget==='all'
      ?customers.slice(0,agentLimit)
      :customers.filter(c=>String(c.groupId)===agentTarget).slice(0,agentLimit);
    const log=(msg)=>setAgentLogs(prev=>[...prev,{time:new Date().toLocaleTimeString(),msg}]);
    log(`🚀 에이전트 시작 — ${targets.length}명 처리 예정`);
    const results=[];
    for(const c of targets){
      const g=getGroup(c.groupId);
      log(`👤 ${c.name} (${g.short}) 분석 중...`);
      const recIds=TEMPLATE_MAPPING[g.id]||[];
      const tmpl=templates.find(t=>t.id===recIds[0]);
      log(`📋 추천 템플릿: ${tmpl?.title||'기본 메시지'}`);
      try{
        const res=await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,messages:[{role:'user',content:`청약 분양 문자 메시지 작성. 고객: ${c.name}(${c.age}/${c.region}), 세그먼트: ${g.name}, 단지: ${apt.name} ${apt.date}. 말투: ${prompts.tone}. 100자 이내로 메시지만:`}]}),
        });
        const data=await res.json();
        const msg=data.content?.[0]?.text||tmpl?.content||'메시지 생성 실패';
        log(`✅ ${c.name} 메시지 생성 완료`);
        results.push({customer:c,group:g,message:msg,template:tmpl?.title||'AI생성'});
      }catch(e){
        log(`❌ ${c.name} 오류: ${e.message}`);
        results.push({customer:c,group:g,message:tmpl?.content||'',template:tmpl?.title||'기본',error:true});
      }
    }
    setAgentResults(results);setAgentDone(true);setAgentRunning(false);
    log(`🎉 완료! ${results.length}명 처리됨`);
  };

  const sendAllAgentResults=()=>{
    agentResults.forEach(r=>{
      setSent(prev=>[{
        customer:r.customer,message:applyAdPrefix(r.message),group:r.group,
        apt:apt.name,time:new Date().toLocaleTimeString(),
        label:r.template,simulated:true,
      },...prev]);
    });
  };

  const TABS=[
    {key:'data',label:'📂 고객데이터'},
    {key:'overview',label:'📊 세그먼트'},
    {key:'apt',label:'🏢 아파트'},
    {key:'templates',label:'📝 템플릿 관리'},
    {key:'prompts',label:'🤖 AI 프롬프트'},
    {key:'send',label:'💬 메시지발송'},
    {key:'agent',label:'🤖 AI 에이전트'},
    {key:'sent',label:'📋 발송내역'},
  ];

  const filteredCustomers=filterGroup?customers.filter(c=>c.groupId===filterGroup):customers;

  return(
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",background:'#0b0f1e',minHeight:'100vh',color:'#e2e8f0',fontSize:14}}>
      <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0.7);opacity:0.3}40%{transform:scale(1.1);opacity:1}} *{box-sizing:border-box} textarea,input{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}`}</style>

      {/* 헤더 */}
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
                  color:tab===t.key?'#a5b4fc':'#94a3b8'}}>{t.label}</button>
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

      {/* SMS 테스트 배너 */}
      <div style={{background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.12))',borderBottom:'1px solid rgba(16,185,129,0.2)',padding:'8px 24px',display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:11,color:'#10b981',fontWeight:600,flexShrink:0}}>🧪 SMS 테스트 모드</span>
        <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="본인 번호 입력 (예: 01012345678)"
          style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:7,padding:'4px 12px',color:'#e2e8f0',fontSize:11,outline:'none',width:220}}/>
        <button onClick={async()=>{
          if(!testPhone||testPhone.length<10){alert('번호를 먼저 입력해주세요!');return;}
          const tc=customers.find(c=>c.groupId===99)||{...SAMPLE[SAMPLE.length-1],phone:testPhone};
          tc.phone=testPhone;
          await sendBulk([tc],'테스트');
        }} style={{background:'rgba(16,185,129,0.2)',border:'1px solid rgba(16,185,129,0.4)',color:'#10b981',padding:'4px 14px',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:600}}>
          📱 테스트 발송
        </button>
        <span style={{fontSize:10,color:'#475569'}}>테스트 그룹 템플릿으로 실제 SMS 발송</span>
      </div>

      <div style={{padding:'22px 24px',maxWidth:1400,margin:'0 auto'}}>

        {/* ══ 고객 데이터 ══ */}
        {tab==='data'&&(
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
              <button onClick={()=>setFilterGroup(null)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:!filterGroup?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)',color:!filterGroup?'#a5b4fc':'#64748b'}}>
                전체 ({totalCount})
              </button>
              {ALL_GROUPS.map(g=>{const cnt=groupCounts[g.id];if(!cnt)return null;return(
                <button key={g.id} onClick={()=>setFilterGroup(filterGroup===g.id?null:g.id)}
                  style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,background:filterGroup===g.id?`${g.color}30`:'rgba(255,255,255,0.06)',color:filterGroup===g.id?g.color:'#64748b'}}>
                  {g.icon} {g.short} ({cnt})
                </button>
              );})}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filteredCustomers.slice(0,50).map(c=>{
                const g=getGroup(c.groupId);
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
        )}

        {/* ══ 세그먼트 ══ */}
        {tab==='overview'&&(
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
                const cnt=groupCounts[g.id]||0;if(!cnt)return null;
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
        )}

        {/* ══ 아파트 ══ */}
        {tab==='apt'&&(
          <div style={{maxWidth:500}}>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'22px 24px'}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>🏢 현재 분양 아파트 설정</div>
              <Field label="단지명" value={apt.name} onChange={v=>setApt(p=>({...p,name:v}))} placeholder="래미안 원베일리 2차"/>
              <Field label="청약일" value={apt.date} onChange={v=>setApt(p=>({...p,date:v}))} placeholder="2026년 4월 15일"/>
              <Field label="가격대" value={apt.price} onChange={v=>setApt(p=>({...p,price:v}))} placeholder="15억~20억"/>
              <Field label="위치" value={apt.location} onChange={v=>setApt(p=>({...p,location:v}))} placeholder="서울 서초구"/>
            </div>
          </div>
        )}

        {/* ══ 템플릿 관리 ══ */}
        {tab==='templates'&&(
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
        )}

        {/* ══ AI 프롬프트 ══ */}
        {tab==='prompts'&&(
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
        )}

        {/* ══ 메시지 발송 ══ */}
        {tab==='send'&&(
          <div>
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
                            <span>Claude가 메시지 생성 중...</span>
                          </div>
                        ):bulkAiMsg&&<div style={{fontSize:11,color:'#10b981',marginBottom:6}}>✅ 생성 완료 · 아래에서 수정 가능</div>}
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
                    {!bulkEditMsg&&!(bulkMode==='template'&&bulkTmplSel)&&!bulkAiLoading&&(
                      <div style={{textAlign:'center',padding:'30px 20px',color:'#334155',fontSize:12}}>
                        {bulkMode==='template'?'왼쪽에서 템플릿을 선택해주세요':'AI 자동생성 버튼을 클릭해주세요'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 그룹별 발송 모드 */}
            {sendMode==='group'&&(
              <div style={{maxWidth:800}}>
                <div style={{fontSize:13,color:'#94a3b8',marginBottom:14}}>발송할 세그먼트를 선택하세요</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:16}}>
                  {ALL_GROUPS.map(g=>{
                    const cnt=groupCounts[g.id]||0;if(!cnt)return null;
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
               {bulkGroup && (
  (() => {
    const g = getGroup(bulkGroup);
    const targets = customers.filter(c => c.groupId === bulkGroup);
    const recTmpl = templates.find(
      t => t.id === (TEMPLATE_MAPPING[bulkGroup] || [])[0]
    );

    return (
      <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${g.color}30`,borderRadius:14,padding:'20px 22px'}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:g.color}}>
          {g.icon} {g.name} 그룹 발송
        </div>

        <div style={{fontSize:12,color:'#64748b',marginBottom:12}}>
          {targets.length}명 · 추천 템플릿: {recTmpl?.title || '기본 메시지'}
        </div>

        {recTmpl && (
          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:9,padding:'10px 13px',marginBottom:14,fontSize:11,color:'#94a3b8',lineHeight:1.7,maxHeight:80,overflowY:'auto'}}>
            {recTmpl.content.slice(0,200)}...
          </div>
        )}

        {bulkResult && (
          <div style={{padding:'10px 14px',borderRadius:9,marginBottom:12,background:bulkResult.ok?'rgba(16,185,129,0.1)':'rgba(248,113,113,0.1)',color:bulkResult.ok?'#10b981':'#f87171',fontSize:12}}>
            {bulkResult.msg}
          </div>
        )}

        <button
          onClick={()=>sendBulk(targets,g.name)}
          disabled={bulkSending}
          style={{
            width:'100%',
            padding:'12px',
            borderRadius:10,
            border:'none',
            cursor:bulkSending?'not-allowed':'pointer',
            fontSize:13,
            fontWeight:700,
            background:bulkSending?'rgba(99,102,241,0.3)':`linear-gradient(135deg,${g.color},${g.color}cc)`,
            color:'white'
          }}
        >
          {bulkSending ? '발송 중...' : `${g.icon} ${g.name} ${targets.length}명 발송`}
        </button>
      </div>
    );
  })()
)}
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

                {/* 오른쪽: 메시지 생성 */}
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
                              <div style={{fontSize:10,color:'#64748b'}}>{selected.age} · {selected.region} {selected.phone?'· 📱'+selected.phone:''}</div>
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
                            {(tmplSearch?templates.filter(t=>t.title.includes(tmplSearch)||t.content.includes(tmplSearch)):templates).map(t=>(
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
                          ✦<br/>왼쪽에서 고객을 클릭하면<br/><span style={{color:'#6366f1',fontWeight:600}}>{apt.name}</span><br/>맞춤 템플릿을 추천해드립니다<br/><br/><span style={{fontSize:10}}>를 50개 템플릿 · 세그먼트별 자동 매칭</span>
                        </div>
                      )}
                    </div>
                  ):(
                    <div style={{textAlign:'center',padding:'60px 20px',color:'#334155',fontSize:12}}>
                      ✦<br/>왼쪽에서 고객을 클릭하면<br/><span style={{color:'#6366f1',fontWeight:600}}>{apt.name}</span><br/>맞춤 템플릿을 추천해드립니다<br/><br/><span style={{fontSize:10}}>를 50개 템플릿 · 세그먼트별 자동 매칭</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ AI 에이전트 ══ */}
        {tab==='agent'&&(
          <div style={{maxWidth:900}}>
            {/* 안내 배너 */}
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
                      if(!cnt)return null;
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

              {/* 로그 + 결과 */}
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
        )}

        {/* ══ 발송내역 ══ */}
        {tab==='sent'&&(
          <div style={{maxWidth:720}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:600}}>📋 발송내역 ({sent.length}건)</div>
              {sent.length>0&&<button onClick={()=>setSent([])} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>전체 삭제</button>}
            </div>
            {sent.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'#334155',fontSize:13}}>아직 발송 내역이 없어요</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {sent.map((item,i)=>(
                  <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:16}}>{item.group.icon}</span>
                      <span style={{fontWeight:600,fontSize:13}}>{item.customer.name}</span>
                      <span style={{fontSize:10,color:item.group.color,background:`${item.group.color}15`,padding:'1px 7px',borderRadius:20}}>{item.group.tier}차 · {item.group.short}</span>
                      <span style={{fontSize:10,color:'#6366f1',background:'rgba(99,102,241,0.1)',padding:'1px 7px',borderRadius:20}}>📌 {item.apt}</span>
                      <span style={{fontSize:10,color:'#94a3b8',background:'rgba(255,255,255,0.06)',padding:'1px 7px',borderRadius:20}}>📋 {item.label}</span>
                      {item.simulated&&<span style={{fontSize:10,color:'#f59e0b',background:'rgba(245,158,11,0.1)',padding:'1px 7px',borderRadius:20}}>시뮬레이션</span>}
                      <span style={{fontSize:10,color:'#64748b',marginLeft:'auto'}}>{item.time}</span>
                    </div>
                    <div style={{fontSize:12,color:'#94a3b8',background:'#0f172a',padding:'10px 13px',borderRadius:8,lineHeight:1.7,whiteSpace:'pre-line'}}>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
    </div>
    </div>
    </div>
  );
}
