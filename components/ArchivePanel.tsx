'use client';
import { Dashboard } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

interface Props { open:boolean; D:Dashboard; onClose:()=>void; onRestoreList:(i:number)=>void; onRestoreTask:(i:number)=>void; onDeleteTask:(i:number)=>void; }

export default function ArchivePanel({ open, D, onClose, onRestoreList, onRestoreTask, onDeleteTask }: Props) {
  return (
    <div style={{
      position:'fixed',right:open?0:-430,top:0,width:400,maxWidth:'100vw',height:'100vh',
      background:'rgba(11,11,19,.97)',borderLeft:'1px solid var(--border)',
      backdropFilter:'blur(22px)',zIndex:500,
      transition:'right .4s cubic-bezier(.34,1.56,.64,1)',
      display:'flex',flexDirection:'column',boxShadow:'-20px 0 60px rgba(0,0,0,.5)',
    }}>
      <div style={{padding:'18px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'.92rem'}}>
          <i className="fa-solid fa-box-archive" style={{marginRight:6,color:'var(--muted)'}}></i>Archive
        </h3>
        <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'1rem'}}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 18px'}}>
        {D.archivedLists.length===0&&D.archivedTasks.length===0 ? (
          <p style={{color:'var(--muted)',fontSize:'.82rem',textAlign:'center',padding:'20px 0'}}>Nothing archived yet</p>
        ) : (
          <>
            {D.archivedLists.length>0 && (
              <Section title="Lists">
                {D.archivedLists.map((lst,i)=>(
                  <AItem key={lst.id}>
                    <span style={{fontSize:'.79rem',flex:1}}>{lst.title} <span style={{color:'var(--muted)'}}>({lst.tasks.length})</span></span>
                    <ABtn onClick={()=>onRestoreList(i)}>Restore</ABtn>
                  </AItem>
                ))}
              </Section>
            )}
            {D.archivedTasks.length>0 && (
              <Section title="Tasks">
                {D.archivedTasks.map((t,i)=>{
                  const ds=t.startDate||t.endDate?` · ${fmtDate(t.startDate||t.endDate)}`:'';
                  return (
                    <AItem key={t.id}>
                      <span style={{fontSize:'.79rem',flex:1,textDecoration:'line-through',color:'var(--muted)'}}>{t.text}{ds}</span>
                      <ABtn onClick={()=>onRestoreTask(i)}>Restore</ABtn>
                      <button onClick={()=>onDeleteTask(i)} style={{background:'none',border:'1px solid rgba(255,107,107,.25)',color:'#ff6b6b',fontSize:'.68rem',padding:'3px 7px',borderRadius:6,cursor:'pointer'}}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </AItem>
                  );
                })}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:18}}>
      <h4 style={{fontSize:'.68rem',textTransform:'uppercase',letterSpacing:1,color:'var(--muted)',marginBottom:8,paddingBottom:5,borderBottom:'1px solid var(--border)'}}>{title}</h4>
      {children}
    </div>
  );
}

function AItem({ children }: { children:React.ReactNode }) {
  return <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',padding:9,marginBottom:5,display:'flex',alignItems:'center',gap:7}}>{children}</div>;
}

function ABtn({ onClick, children }: { onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{background:'none',border:'1px solid var(--border)',color:'var(--muted)',fontSize:'.68rem',padding:'3px 8px',borderRadius:6,cursor:'pointer',whiteSpace:'nowrap'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';}}
    >{children}</button>
  );
}
