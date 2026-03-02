'use client';
import { useEffect, useRef } from 'react';

interface Props {
  x: number; y: number; visible: boolean;
  onEdit: () => void; onDate: () => void; onToggle: () => void;
  onArchive: () => void; onDelete: () => void; onClose: () => void;
}

export default function ContextMenu({ x, y, visible, onEdit, onDate, onToggle, onArchive, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    if (visible) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  const cx = Math.min(x, window.innerWidth - 185);
  const cy = Math.min(y, window.innerHeight - 175);

  return (
    <div ref={ref} style={{ position:'fixed', left:cx, top:cy, zIndex:9999, background:'rgba(16,16,26,.97)', border:'1px solid var(--border)', borderRadius:12, padding:5, minWidth:172, boxShadow:'0 20px 60px rgba(0,0,0,.6)', backdropFilter:'blur(20px)', animation:'menuIn .15s ease' }}>
      <CMI icon="fa-pen" label="Edit Task" onClick={onEdit} />
      <CMI icon="fa-regular fa-calendar" label="Edit Dates" onClick={onDate} />
      <CMI icon="fa-check" label="Toggle Done" onClick={onToggle} />
      <div style={{height:1,background:'var(--border)',margin:'4px 0'}}/>
      <CMI icon="fa-box-archive" label="Archive" danger onClick={onArchive} />
      <CMI icon="fa-trash" label="Delete" danger onClick={onDelete} />
    </div>
  );
}

function CMI({ icon, label, danger, onClick }: { icon:string;label:string;danger?:boolean;onClick:()=>void }) {
  return (
    <div onClick={onClick} style={{ padding:'7px 11px', borderRadius:8, fontSize:'.78rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:danger?'#ff6b6b':'var(--text)', transition:'all .15s' }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=danger?'rgba(255,107,107,.1)':'var(--surface2)'}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
    >
      <i className={icon.startsWith('fa-regular')?icon:`fa-solid ${icon}`} style={{width:13,textAlign:'center',color:danger?'#ff6b6b':'var(--muted)'}}></i>
      {label}
    </div>
  );
}
