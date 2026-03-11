import { useState } from "react";

const STATUS_META = {
  success: { label: '발송 성공', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
  fail:    { label: '발송 실패', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
  noPhone: { label: '번호 없음', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '📋' },
};

export default function SentHistory({ sent, setSent }) {
  const [filter, setFilter] = useState('all');   // all | success | fail | noPhone
  const [groupFilter, setGroupFilter] = useState('all');
  const [expandedMsg, setExpandedMsg] = useState(null);

  const filtered = sent.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (groupFilter !== 'all' && item.group?.id !== groupFilter) return false;
    return true;
  });

  // 날짜별 그룹핑
  const byDate = filtered.reduce((acc, item) => {
    const d = item.date || '날짜 없음';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  // 통계
  const total   = sent.length;
  const success = sent.filter(i => i.status === 'success').length;
  const fail    = sent.filter(i => i.status === 'fail').length;
  const noPhone = sent.filter(i => i.status === 'noPhone').length;

  // 그룹 목록 (발송된 그룹만)
  const groups = [...new Map(sent.map(i => [i.group?.id, i.group])).values()].filter(Boolean);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>📋 발송내역</div>
        {sent.length > 0 && (
          <button onClick={() => { if(window.confirm('전체 발송내역을 삭제할까요?')) setSent([]); }}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', padding: '4px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 11 }}>
            전체 삭제
          </button>
        )}
      </div>

      {sent.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#334155', fontSize: 13 }}>
          아직 발송 내역이 없어요
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: '전체 발송', value: total,   color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)',    key: 'all'     },
              { label: '발송 성공', value: success, color: '#10b981', bg: 'rgba(16,185,129,0.1)',   key: 'success' },
              { label: '발송 실패', value: fail,    color: '#f87171', bg: 'rgba(248,113,113,0.1)',  key: 'fail'    },
              { label: '번호 없음', value: noPhone, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   key: 'noPhone' },
            ].map(s => (
              <div key={s.key} onClick={() => setFilter(f => f === s.key ? 'all' : s.key)}
                style={{
                  background: filter === s.key ? s.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${filter === s.key ? s.color+'50' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                  {total > 0 ? Math.round(s.value / total * 100) + '%' : '0%'}
                </div>
              </div>
            ))}
          </div>

          {/* 그룹 필터 */}
          {groups.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <button onClick={() => setGroupFilter('all')}
                style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: groupFilter === 'all' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                  color: groupFilter === 'all' ? '#a5b4fc' : '#64748b' }}>
                전체 그룹
              </button>
              {groups.map(g => (
                <button key={g.id} onClick={() => setGroupFilter(f => f === g.id ? 'all' : g.id)}
                  style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: groupFilter === g.id ? `${g.color}25` : 'rgba(255,255,255,0.06)',
                    color: groupFilter === g.id ? g.color : '#64748b' }}>
                  {g.icon} {g.short}
                </button>
              ))}
            </div>
          )}

          {/* 날짜별 목록 */}
          {dates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#334155', fontSize: 12 }}>조건에 맞는 내역이 없어요</div>
          ) : (
            dates.map(date => (
              <div key={date} style={{ marginBottom: 24 }}>
                {/* 날짜 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc' }}>📅 {date}</div>
                  <div style={{ fontSize: 11, color: '#334155' }}>{byDate[date].length}건</div>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['success','fail','noPhone'].map(s => {
                      const cnt = byDate[date].filter(i => i.status === s).length;
                      if (!cnt) return null;
                      const m = STATUS_META[s];
                      return (
                        <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.color }}>
                          {m.icon} {m.label} {cnt}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 카드 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {byDate[date].map((item, i) => {
                    const sm = STATUS_META[item.status] || STATUS_META.noPhone;
                    const isExpanded = expandedMsg === `${date}-${i}`;
                    return (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${item.status === 'fail' ? 'rgba(248,113,113,0.2)' : item.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 11, overflow: 'hidden',
                      }}>
                        {/* 카드 상단 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                          {/* 상태 */}
                          <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 20, background: sm.bg, color: sm.color, fontWeight: 700, flexShrink: 0 }}>
                            {sm.icon} {sm.label}
                          </span>
                          {/* 고객명 */}
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{item.customer?.name}</span>
                          {/* 연락처 */}
                          {item.customer?.phone && (
                            <span style={{ fontSize: 10, color: '#475569' }}>{item.customer.phone}</span>
                          )}
                          {/* 그룹 */}
                          <span style={{ fontSize: 10, color: item.group?.color, background: `${item.group?.color}15`, padding: '1px 8px', borderRadius: 20 }}>
                            {item.group?.icon} {item.group?.short}
                          </span>
                          {/* 아파트 */}
                          <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '1px 8px', borderRadius: 20 }}>
                            📌 {item.apt}
                          </span>
                          {/* 템플릿명 */}
                          <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 8px', borderRadius: 20 }}>
                            {item.label}
                          </span>
                          {/* 시간 */}
                          <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>{item.time}</span>
                          {/* 메시지 토글 */}
                          <button onClick={() => setExpandedMsg(isExpanded ? null : `${date}-${i}`)}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', padding: '2px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>
                            {isExpanded ? '접기 ▲' : '내용 ▼'}
                          </button>
                        </div>
                        {/* 실패 사유 */}
                        {item.status === 'fail' && item.errorMsg && (
                          <div style={{ padding: '4px 14px 8px', fontSize: 11, color: '#f87171' }}>
                            ⚠️ 실패 사유: {item.errorMsg}
                          </div>
                        )}
                        {/* 메시지 내용 */}
                        {isExpanded && (
                          <div style={{ padding: '0 14px 12px' }}>
                            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 13px', fontSize: 11, color: '#94a3b8', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                              {item.message}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
