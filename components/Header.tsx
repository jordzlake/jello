'use client';
import { useState, useEffect, useRef } from 'react';
import { GlobalState } from '@/lib/types';

export type ViewType = 'board' | 'calendar' | 'gantt';

interface Props {
  G: GlobalState;
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  onOpenBg: () => void;
  onOpenArchive: () => void;
  onSaveJson: () => void;
  onLoadJson: (file: File) => void;
  onSwitchDash: (id: string) => void;
  onNewDash: () => void;
  onRenameDash: (id: string) => void;
  onDeleteDash: (id: string) => void;
}

export default function Header({ G, view, onViewChange, onOpenBg, onOpenArchive, onSaveJson, onLoadJson, onSwitchDash, onNewDash, onRenameDash, onDeleteDash }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashIds = Object.keys(G.dashboards);

  return (
    <header style={{ position:'relative', zIndex:200, display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'rgba(11,11,19,.86)', borderBottom:'1px solid var(--border)', backdropFilter:'blur(24px)', flexWrap:'nowrap', overflow:'hidden' }}>
      {/* Logo */}
      <a href="#" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
        <svg style={{ width:32, height:32, animation:'logoGlow 3s ease-in-out infinite alternate', flexShrink:0 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <g fill="none">
            <path fill="#008463" d="M15.98 2a1 1 0 0 1 1 1v4.41a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1"/>
            <path fill="#ff81f5" d="m18.18 29.01l5.27-5.97c5.67-6.43 1.11-16.55-7.47-16.55S2.84 16.61 8.51 23.04l5.27 5.97a2.94 2.94 0 0 0 4.4 0"/>
            <path fill="#1c1c1c" d="M9.62 13.24c-.51 0-.93.42-.93.93v.93c0 .51.42.93.93.93s.93-.42.93-.93v-.93c0-.52-.42-.93-.93-.93m2.25 5.83c0-.51.42-.93.93-.93c.52 0 .93.42.93.93V20c0 .51-.42.93-.93.93s-.93-.42-.93-.93zm6.37 0c0-.51.42-.93.93-.93c.52 0 .93.42.93.93V20c0 .51-.42.93-.93.93s-.93-.42-.93-.93zm-3.18-4.9c0-.51.42-.93.93-.93s.93.41.93.93v.93c0 .51-.42.93-.93.93s-.93-.42-.93-.93zm.93 8.52c-.51 0-.93.42-.93.93v.93c0 .51.42.93.93.93s.93-.42.93-.93v-.93c0-.51-.42-.93-.93-.93m5.45-8.52c0-.51.42-.93.93-.93s.93.41.93.93v.93c0 .51-.42.93-.93.93s-.93-.42-.93-.93z"/>
            <path fill="#00d26a" d="M6.14 11.44h5.54a5.43 5.43 0 0 0 4.296-2.103a5.43 5.43 0 0 0 4.293 2.103h5.54c0-3-2.43-5.44-5.44-5.44h-8.79c-3 0-5.44 2.44-5.44 5.44"/>
          </g>
        </svg>
        {!isMobile && (
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.28rem', letterSpacing:'2.5px', textTransform:'uppercase', background:'linear-gradient(135deg,#00d26a 0%,#ff81f5 55%,#ffd26b 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Jello
          </span>
        )}
      </a>

      {/* Dashboard tabs — scrollable, only on non-mobile or when space exists */}
      {!isMobile && (
        <div style={{ display:'flex', alignItems:'center', gap:5, flex:1, minWidth:0, overflowX:'auto', padding:'2px 0' }}>
          {dashIds.map(id => (
            <button key={id}
              onClick={() => onSwitchDash(id)}
              onDoubleClick={() => onRenameDash(id)}
              style={{ border:'1px solid', borderColor:id===G.activeDash?'var(--accent)':'var(--border)', background:id===G.activeDash?'var(--accent)':'var(--surface)', color:id===G.activeDash?'#fff':'var(--muted)', fontFamily:'DM Sans,sans-serif', fontSize:'.75rem', padding:'5px 11px', borderRadius:7, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5, flexShrink:0, boxShadow:id===G.activeDash?'0 0 14px rgba(111,95,255,.4)':'none' }}
            >
              <span>{G.dashboards[id].name}</span>
              {dashIds.length > 1 && (
                <span onClick={e=>{e.stopPropagation();onDeleteDash(id);}} style={{ opacity:0, fontSize:'.58rem', cursor:'pointer', transition:'opacity .15s' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity='1';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity='0';}}
                >✕</span>
              )}
            </button>
          ))}
          <button onClick={onNewDash} style={{ border:'1px dashed rgba(255,255,255,.14)', background:'transparent', color:'var(--muted)', fontSize:'.75rem', padding:'5px 9px', borderRadius:7, cursor:'pointer', transition:'all .2s', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.14)';e.currentTarget.style.color='var(--muted)';}}
          >+</button>
        </div>
      )}

      {/* View toggle */}
      <div style={{ display:'flex', gap:2, background:'var(--surface)', borderRadius:10, padding:3, flexShrink:0 }}>
        {(['board','calendar','gantt'] as ViewType[]).map((v,i)=>{
          const icons = ['fa-table-columns','fa-regular fa-calendar','fa-bars-progress'];
          const labels = ['Board','Calendar','Gantt'];
          return (
            <button key={v} onClick={()=>onViewChange(v)} style={{ border:'none', background:view===v?'var(--accent)':'transparent', color:view===v?'#fff':'var(--muted)', fontFamily:'DM Sans,sans-serif', fontSize:'.74rem', fontWeight:500, padding:isMobile?'6px 9px':'6px 12px', borderRadius:7, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap', boxShadow:view===v?'0 0 16px rgba(111,95,255,.4)':'none', display:'flex', alignItems:'center', gap:4 }}>
              <i className={`fa-solid ${icons[i]}`}></i>
              {!isMobile && labels[i]}
            </button>
          );
        })}
      </div>

      {/* Desktop action buttons */}
      {!isMobile && (
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <GhostBtn onClick={onOpenBg}><i className="fa-solid fa-image"></i> BG</GhostBtn>
          <GhostBtn onClick={onOpenArchive}><i className="fa-solid fa-box-archive"></i> Archive</GhostBtn>
          <GhostBtn onClick={onSaveJson}><i className="fa-solid fa-download"></i> Save</GhostBtn>
          <GhostBtn onClick={()=>fileRef.current?.click()}><i className="fa-solid fa-upload"></i> Load</GhostBtn>
          <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){onLoadJson(f);e.target.value='';}}} />
        </div>
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <div ref={menuRef} style={{ position:'relative', flexShrink:0 }}>
          <button onClick={()=>setMenuOpen(!menuOpen)} aria-label="Menu"
            style={{ background:menuOpen?'var(--surface2)':'var(--surface)', border:`1px solid ${menuOpen?'var(--accent)':'var(--border)'}`, borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}
          >
            <HamIcon open={menuOpen} />
          </button>

          {menuOpen && (
            <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'rgba(18,18,28,.98)', border:'1px solid var(--border)', borderRadius:14, padding:8, minWidth:220, boxShadow:'0 20px 60px rgba(0,0,0,.6)', backdropFilter:'blur(20px)', animation:'menuIn .18s cubic-bezier(.34,1.56,.64,1)', zIndex:200 }}>
              {/* Dashboard switcher */}
              <div style={{padding:'4px 10px 6px',fontSize:'.62rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:1}}>Dashboards</div>
              {dashIds.map(id=>(
                <DI key={id} icon="fa-table-columns" label={G.dashboards[id].name} active={id===G.activeDash}
                  onClick={()=>{onSwitchDash(id);setMenuOpen(false);}} />
              ))}
              <DI icon="fa-plus" label="New Dashboard" onClick={()=>{onNewDash();setMenuOpen(false);}} />
              <Sep />

              {/* Actions */}
              <DI icon="fa-image" label="Background" onClick={()=>{onOpenBg();setMenuOpen(false);}} />
              <DI icon="fa-box-archive" label="Archive" onClick={()=>{onOpenArchive();setMenuOpen(false);}} />
              <DI icon="fa-download" label="Save JSON" onClick={()=>{onSaveJson();setMenuOpen(false);}} />
              <DI icon="fa-upload" label="Load JSON" onClick={()=>{fileRef.current?.click();setMenuOpen(false);}} />
              <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){onLoadJson(f);e.target.value='';}}} />
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function HamIcon({ open }: { open:boolean }) {
  const s: React.CSSProperties = { display:'block',width:16,height:2,background:'var(--text)',borderRadius:2,transition:'all .25s',position:'absolute' };
  return (
    <div style={{width:16,height:12,position:'relative'}}>
      {open ? (
        <><span style={{...s,transform:'rotate(45deg)',top:5}}/><span style={{...s,transform:'rotate(-45deg)',top:5}}/></>
      ) : (
        <><span style={{...s,top:0}}/><span style={{...s,width:12,top:5}}/><span style={{...s,top:10}}/></>
      )}
    </div>
  );
}

function DI({ icon, label, active, onClick }: { icon:string;label:string;active?:boolean;onClick:()=>void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:'9px 12px', borderRadius:9, fontSize:'.84rem', cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:10, color:'var(--text)', background:active?'var(--accent)':(hov?'var(--surface2)':'transparent'), fontWeight:active?600:400 }}
    >
      <i className={`fa-solid ${icon}`} style={{width:14,textAlign:'center',color:active?'#fff':'var(--muted)'}}></i>{label}
    </div>
  );
}

function Sep() { return <div style={{height:1,background:'var(--border)',margin:'6px 4px'}}/>; }

function GhostBtn({ onClick, children }: { onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:'.74rem', padding:'6px 11px', borderRadius:8, cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.borderColor='var(--accent)';}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.borderColor='var(--border)';}}
    >{children}</button>
  );
}


