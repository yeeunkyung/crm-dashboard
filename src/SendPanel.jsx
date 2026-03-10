import { useState } from "react";
import { ALL_GROUPS, TEMPLATE_MAPPING } from "./constants";

export default function SendPanel({ customers, templates, apt, isAd, setSent }) {
  const [sendMode, setSendMode] = useState('individual');
  const [selected, setSelected] = useState(null);
  const [editMsg, setEditMsg] = useState('');

  const getGroup = id => ALL_GROUPS.find(g => g.id === id) || { name: '미분류', color: '#64748b', icon: '❓' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {['individual', 'group', 'all'].map(m => (
          <button key={m} onClick={() => setSendMode(m)}
            style={{
              flex: 1, padding: '12px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: sendMode === m ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              color: sendMode === m ? '#a5b4fc' : '#94a3b8', fontSize: 13, fontWeight: 700
            }}>{m === 'individual' ? '👤 개별 발송' : m === 'group' ? '👥 그룹 발송' : '📢 전체 발송'}</button>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '22px' }}>
        <textarea 
          value={editMsg} 
          onChange={e => setEditMsg(e.target.value)}
          placeholder="메시지 내용을 입력하세요."
          style={{ width: '100%', minHeight: 200, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#e2e8f0', fontSize: 13, outline: 'none' }}
        />
      </div>
    </div>
  );
}
