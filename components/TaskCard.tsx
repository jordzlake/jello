'use client';

// Parses URLs in text and returns an array of strings and anchor elements
function linkify(text: string): React.ReactNode[] {
  const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)])/g;
  const parts: React.ReactNode[] = [];
  let last = 0, match: RegExpExecArray | null;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const url = match[1];
    parts.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ color:'var(--accent)', textDecoration:'underline', wordBreak:'break-all' }}>
        {url}
      </a>
    );
    last = match.index + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
import { useRef } from 'react';
import { Task, Palette } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

interface Props {
  task: Task; li: number; ti: number; palette: Palette;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

// Detect touch device once at module load
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

// Global touch drag state shared across all TaskCards
let touchDragLi: number | null = null;
let touchDragTi: number | null = null;
let touchGhost: HTMLElement | null = null;

function removeTouchGhost() {
  if (touchGhost) { touchGhost.remove(); touchGhost = null; }
}

export default function TaskCard({ task: t, li, ti, palette, onToggle, onContextMenu }: Props) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEl = useRef<HTMLElement | null>(null);
  const today = new Date(); today.setHours(0,0,0,0);

  const endBadgeCls = () => {
    if (!t.endDate) return 'date';
    const due = new Date(t.endDate+'T00:00:00');
    if (!t.done && due < today) return 'overdue';
    if (!t.done && due.getTime()===today.getTime()) return 'today';
    return 'date';
  };

  const dur = t.startDate && t.endDate
    ? Math.max(1, Math.round((new Date(t.endDate+'T00:00:00').getTime()-new Date(t.startDate+'T00:00:00').getTime())/86400000)+1)
    : null;

  const prog = t.progress ?? 0;

  const badgeStyle = (type: 'date'|'overdue'|'today'|'time'|'dur'): React.CSSProperties => {
    const base: React.CSSProperties = { display:'inline-flex',alignItems:'center',gap:3,fontSize:'.62rem',padding:'2px 6px',borderRadius:20,border:'1px solid',width:'fit-content' };
    switch(type) {
      case 'overdue': return {...base,background:'rgba(255,80,80,.12)',color:'#ff6b6b',borderColor:'rgba(255,80,80,.2)'};
      case 'today':   return {...base,background:'rgba(255,200,80,.12)',color:'#ffc850',borderColor:'rgba(255,200,80,.2)'};
      case 'time':    return {...base,background:'rgba(0,210,106,.1)',color:'#00d26a',borderColor:'rgba(0,210,106,.2)'};
      case 'dur':     return {...base,background:'rgba(79,172,254,.1)',color:'#4facfe',borderColor:'rgba(79,172,254,.2)'};
      default:        return {...base,background:'rgba(111,95,255,.12)',color:'#a090ff',borderColor:'rgba(111,95,255,.2)'};
    }
  };

  return (
    <div
      draggable={!isTouchDevice}
      data-li={li} data-ti={ti}
      onDragStart={e => {
        if (isTouchDevice) { e.preventDefault(); return; }
        e.stopPropagation();
        e.dataTransfer.setData('taskLi', String(li));
        e.dataTransfer.setData('taskTi', String(ti));
        e.dataTransfer.setData('drag', 'task');
        e.dataTransfer.effectAllowed = 'move';
        (e.currentTarget as HTMLElement).classList.add('task-dragging');
      }}
      onDragEnd={e => (e.currentTarget as HTMLElement).classList.remove('task-dragging')}
      onContextMenu={onContextMenu}
      onTouchStart={e => {
        // Record start position — drag only begins once finger moves enough
        const touch = e.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        touchEl.current = e.currentTarget as HTMLElement;
      }}
      onTouchMove={e => {
        const touch = e.touches[0];
        // Activate drag once finger has moved 8px
        if (touchDragLi === null) {
          const dx = Math.abs(touch.clientX - touchStartX.current);
          const dy = Math.abs(touch.clientY - touchStartY.current);
          if (dx < 8 && dy < 8) return;
          const el = touchEl.current!;
          touchDragLi = li;
          touchDragTi = ti;
          document.body.classList.add('touch-dragging');
          removeTouchGhost();
          touchGhost = el.cloneNode(true) as HTMLElement;
          touchGhost.style.cssText = `position:fixed;z-index:9999;opacity:0.85;pointer-events:none;width:${el.offsetWidth}px;transform:scale(1.05);transition:none;box-shadow:0 8px 32px rgba(0,0,0,0.5);border-radius:8px;`;
          document.body.appendChild(touchGhost);
        }
        e.preventDefault();
        const el = touchEl.current!;
        if (touchGhost) {
          touchGhost.style.left = (touch.clientX - el.offsetWidth / 2) + 'px';
          touchGhost.style.top  = (touch.clientY - el.offsetHeight / 2) + 'px';
        }
        // Briefly hide ghost so elementFromPoint sees what's underneath
        if (touchGhost) touchGhost.style.display = 'none';
        const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        if (touchGhost) touchGhost.style.display = '';
        const targetList = elBelow?.closest('[data-li]') as HTMLElement | null;
        document.querySelectorAll('.touch-drop-target').forEach(el => el.classList.remove('touch-drop-target'));
        if (targetList) targetList.classList.add('touch-drop-target');
      }}
      onTouchEnd={e => {
        document.body.classList.remove('touch-dragging');
        document.querySelectorAll('.touch-drop-target').forEach(el => el.classList.remove('touch-drop-target'));
        if (touchDragLi === null) { removeTouchGhost(); return; }
        const savedFromLi = touchDragLi;
        const savedFromTi = touchDragTi;
        touchDragLi = null;
        touchDragTi = null;
        const touch = e.changedTouches[0];
        // Hide ghost before hit-testing so it doesn't block the element underneath
        if (touchGhost) touchGhost.style.display = 'none';
        const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        removeTouchGhost();
        const targetListEl = elBelow?.closest('[data-li]') as HTMLElement | null;
        const targetTaskEl = elBelow?.closest('[data-ti]') as HTMLElement | null;
        if (targetListEl) {
          const toLi = parseInt(targetListEl.dataset.li ?? '');
          const toTi = targetTaskEl ? parseInt(targetTaskEl.dataset.ti ?? '') : undefined;
          if (!isNaN(toLi)) {
            document.dispatchEvent(new CustomEvent('touch-move-task', {
              detail: { fromLi: savedFromLi, fromTi: savedFromTi, toLi, toTi }
            }));
          }
        }
      }}
      style={{
        background: t.done ? 'var(--done-bg)' : 'var(--surface)',
        border: `1px solid ${t.done ? 'rgba(255,255,255,.04)' : 'var(--border)'}`,
        borderRadius: 'var(--rsm)', padding:'10px 11px',
        display:'flex', flexDirection:'column', gap:7,
        cursor:'grab', transition:'all .2s',
        animation:'taskIn .28s cubic-bezier(.34,1.56,.64,1)',
        touchAction:'none', // prevents browser scroll hijack during drag
      }}
      onMouseEnter={e=>{if(!t.done){const el=e.currentTarget;el.style.background='var(--surface2)';el.style.borderColor='rgba(111,95,255,.3)';el.style.transform='translateY(-1px)';el.style.boxShadow='0 4px 16px rgba(0,0,0,.28)';}}}
      onMouseLeave={e=>{const el=e.currentTarget;el.style.background=t.done?'var(--done-bg)':'var(--surface)';el.style.borderColor=t.done?'rgba(255,255,255,.04)':'var(--border)';el.style.transform='';el.style.boxShadow='';}}
    >
      {/* Top row */}
      <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
        <div onClick={onToggle} style={{
          width:17,height:17,borderRadius:5,flexShrink:0,
          border: t.done?'none':'2px solid var(--border)',
          background:t.done?`linear-gradient(135deg,${palette.c1},${palette.c2})`:'transparent',
          cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all .22s',marginTop:1,
        }}>
          {t.done && <i className="fa-solid fa-check" style={{fontSize:'.56rem',color:'#fff'}}></i>}
        </div>
        {/* Task text — no truncation, full wrapping */}
        <div style={{
          fontSize:'.84rem',lineHeight:1.45,wordBreak:'break-word',flex:1,
          color:t.done?'var(--done-txt)':'var(--text)',
          textDecoration:t.done?'line-through':'none',
        }}>
          {linkify(t.text)}
        </div>
      </div>

      {/* Meta badges */}
      {(t.startDate||t.endDate||(t.startTime||t.endTime)||dur) ? (
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginLeft:25}}>
          {t.startDate && <span style={badgeStyle('date')}><i className="fa-solid fa-play" style={{fontSize:'.5rem'}}></i> {fmtDate(t.startDate)}</span>}
          {t.endDate && <span style={badgeStyle(endBadgeCls())}><i className="fa-regular fa-calendar"></i> {fmtDate(t.endDate)}</span>}
          {(t.startTime||t.endTime) && <span style={badgeStyle('time')}><i className="fa-regular fa-clock"></i> {t.startTime||''}{t.startTime&&t.endTime?'–':''}{t.endTime||''}</span>}
          {dur && <span style={badgeStyle('dur')}><i className="fa-solid fa-ruler"></i> {dur}d</span>}
        </div>
      ) : null}

      {/* Progress bar */}
      {(prog>0||t.startDate) ? (
        <div style={{marginLeft:25}}>
          <div style={{height:5,background:'rgba(255,255,255,.08)',borderRadius:3,overflow:'hidden',marginTop:2}}>
            <div style={{height:'100%',borderRadius:3,background:'linear-gradient(90deg,#6f5fff,#ff5fa0)',transition:'width .4s',width:`${prog}%`}} />
          </div>
          <div style={{fontSize:'.6rem',color:'var(--muted)',display:'flex',justifyContent:'space-between',marginTop:2}}>
            <span>Progress</span><span>{prog}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
