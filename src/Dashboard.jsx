import { useState } from "react";
import { ALL_GROUPS } from "./constants";

export default function Dashboard({ customers, setSelected, setTab }) {
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
        {customers.map(c => {
          const g = ALL_GROUPS.find(group => group.id === c.groupId) || { color: '#64748b', icon: '❓', short: '미분류' };
          return (
            <div key={c.id} onClick={() => { setSelected(c); setTab('send'); }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>
                    {c.name} <span style={{ fontSize: 10, color: g.color, background: `${g.color}15`, padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>{g.short}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{c.age} · {c.region} · {c.자격 || '자격 미정'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{c.의사 === '있다' ? '✅ 참여의사' : '❓ 미정'}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{c.phone || '번호 없음'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
