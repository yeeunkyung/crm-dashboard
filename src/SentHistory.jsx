import { useState } from "react";

export default function SentHistory({ sent, setSent }) {
  return (
    <div style={{maxWidth:720}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600}}>📋 발송내역 ({sent.length}건)</div>
        {sent.length>0&&(
          <button onClick={()=>setSent([])} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',padding:'4px 12px',borderRadius:7,cursor:'pointer',fontSize:11}}>
            전체 삭제
          </button>
        )}
      </div>
      {sent.length===0?(
        <div style={{textAlign:'center',padding:'60px 20px',color:'#334155',fontSize:13}}>
          아직 발송 내역이 없어요
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {sent.map((item,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
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
  );
}
