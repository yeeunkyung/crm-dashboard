import { useState } from "react";
import { SAMPLE, TEMPLATES, DEFAULT_APT } from "./constants";
import Dashboard from "./Dashboard";
import SendPanel from "./SendPanel";
import AgentPanel from "./AgentPanel";

export default function App() {
  const [tab, setTab] = useState('data');
  const [customers, setCustomers] = useState(SAMPLE);
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ background: '#0b0f1e', minHeight: '100vh', color: '#e2e8f0', padding: '20px' }}>
      {/* 탭 메뉴 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['data', 'send', 'agent'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', background: tab === t ? '#6366f1' : 'transparent', color: 'white', border: '1px solid #6366f1', borderRadius: 8, cursor: 'pointer' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      {tab === 'data' && <Dashboard customers={customers} setSelected={setSelected} setTab={setTab} />}
      {tab === 'send' && <SendPanel customers={customers} templates={TEMPLATES} apt={DEFAULT_APT} isAd={false} />}
      {tab === 'agent' && <AgentPanel customers={customers} templates={TEMPLATES} apt={DEFAULT_APT} isAd={false} />}
    </div>
  );
}
