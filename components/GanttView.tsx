'use client';
import { useState, useEffect } from 'react';
import { Dashboard } from '@/lib/types';
import { PAL, fmtDateFull } from '@/lib/utils';

interface Props {
  D: Dashboard;
  onSetZoom: (z:'week'|'month'|'quarter') => void;
  onNav: (dir:number) => void;
  onGoToday: () => void;
  onOpenDate: (li:number, ti:number) => void;
}

const ZOOM_DAYS = { week:14, month:30, quarter:90 };

export default function GanttView({ D, onSetZoom, onNav, onGoToday, onOpenDate }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const zoom    = D.ganttZoom || 'week';
  const days    = ZOOM_DAYS[zoom];
  const offset  = D.ganttOffset || 0;
  const mspd    = 86400000;

  // Cell widths — tighter on mobile
  const CELL_W = isMobile
    ? { week: 32, month: 18, quarter: 9 }
    : { week: 52, month: 26, quarter: 14 };
  const NAME_W = isMobile ? 110 : 200;
  const cellW  = CELL_W[zoom];

  // UTC dates to avoid DST
  const todayUTC = new Date();
  const today    = new Date(Date.UTC(todayUTC.getFullYear(), todayUTC.getMonth(), todayUTC.getDate()));
  const startDay = new Date(today); startDay.setUTCDate(startDay.getUTCDate() + offset);
  const endDay   = new Date(startDay); endDay.setUTCDate(endDay.getUTCDate() + days - 1);

  const colDates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay); d.setUTCDate(d.getUTCDate() + i); colDates.push(d);
  }

  const allTasks: any[] = [];
  D.lists.forEach((lst, li) => lst.tasks.forEach((t, ti) => {
    if (t.startDate || t.endDate) allTasks.push({ ...t, li, ti, pal: lst.palette || PAL[li % PAL.length] });
  }));

  type Grp = { title: string; pal: typeof PAL[0]; tasks: any[] };
  const groups: Record<number, Grp> = {};
  D.lists.forEach((lst, li) => {
    const lt = allTasks.filter(t => t.li === li);
    if (lt.length) groups[li] = { title: lst.title, pal: lst.palette || PAL[li % PAL.length], tasks: lt };
  });

  const gridW = cellW * days;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>

      {/* ── Header controls ─────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap', flexShrink:0 }}>
        {!isMobile && (
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.2rem', background:'linear-gradient(135deg,#00d26a,#ff81f5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginRight:4, whiteSpace:'nowrap' }}>
            <i className="fa-solid fa-bars-progress" style={{ fontSize:'.9rem', marginRight:7, color:'#00d26a' }}/>Gantt Chart
          </div>
        )}

        {/* Zoom buttons */}
        <div style={{ display:'flex', gap:3 }}>
          {(['week','month','quarter'] as const).map(z => (
            <button key={z} onClick={() => onSetZoom(z)}
              style={{ border:'1px solid', borderColor: zoom===z ? 'var(--accent)' : 'var(--border)', background:'var(--surface)', color: zoom===z ? 'var(--accent)' : 'var(--muted)', fontSize:'.72rem', padding:'4px 10px', borderRadius:7, cursor:'pointer', transition:'all .2s' }}>
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>

        {/* Nav */}
        <button onClick={() => onNav(-1)} style={navBtn}><i className="fa-solid fa-chevron-left"/></button>
        <span style={{ fontSize:'.72rem', color:'var(--muted)', whiteSpace:'nowrap' }}>
          {fmtDateFull(new Date(startDay.getUTCFullYear(), startDay.getUTCMonth(), startDay.getUTCDate()))}
          {!isMobile && ` — ${fmtDateFull(new Date(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate()))}`}
        </span>
        <button onClick={() => onNav(1)}    style={navBtn}><i className="fa-solid fa-chevron-right"/></button>
        <button onClick={onGoToday}         style={navBtn}><i className="fa-solid fa-circle-dot"/></button>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'auto', borderRadius:14, border:'1px solid var(--border)', minHeight:0 }}>
        {!allTasks.length ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:'.88rem' }}>
            <i className="fa-solid fa-bars-progress" style={{ fontSize:'2rem', marginBottom:12, display:'block', opacity:.3 }}/>
            No tasks with dates yet.<br/>Add start/end dates to tasks to see them here.
          </div>
        ) : (
          <table style={{ borderCollapse:'collapse', tableLayout:'fixed', width: NAME_W + gridW, minWidth:'100%' }}>
            <colgroup>
              <col style={{ width: NAME_W }}/>
              {colDates.map((_, i) => <col key={i} style={{ width: cellW }}/>)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thBase, textAlign:'left', paddingLeft:10, position:'sticky', left:0, zIndex:20, background:'rgba(14,14,22,.97)', fontSize: isMobile ? '.6rem' : '.66rem' }}>
                  Task
                </th>
                {colDates.map((d, i) => {
                  const isT = d.getTime() === today.getTime();
                  const day = d.getUTCDay();
                  const date = d.getUTCDate();
                  const isWeekend = day === 0 || day === 6;
                  const lbl = zoom === 'week'
                    ? isMobile
                      ? `${['S','M','T','W','T','F','S'][day]}${date}`
                      : `${['Su','Mo','Tu','We','Th','Fr','Sa'][day]} ${date}`
                    : (date === 1
                        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + (isMobile ? '' : ' ')
                        : '') + date;
                  return (
                    <th key={i} style={{
                      ...thBase,
                      background: isT ? 'rgba(111,95,255,.22)' : 'rgba(14,14,22,.97)',
                      color: isT ? 'var(--accent)' : isWeekend ? 'rgba(255,255,255,.25)' : 'var(--muted)',
                      fontSize: isMobile ? '.5rem' : zoom === 'week' ? '.66rem' : '.58rem',
                      boxShadow: isT ? 'inset 0 -2px 0 var(--accent)' : 'none',
                    }}>
                      {lbl}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.values(groups).map((grp: Grp, gi) => [
                <tr key={`g${gi}`}>
                  <td colSpan={days + 1} style={{ background:`linear-gradient(90deg,${grp.pal.c1}22,transparent)`, padding:`6px ${isMobile?8:14}px`, fontFamily:'Syne,sans-serif', fontWeight:700, fontSize: isMobile ? '.72rem' : '.8rem', borderBottom:`1px solid var(--border)`, borderTop:`1px solid var(--border)` }}>
                    {grp.title}
                  </td>
                </tr>,
                ...grp.tasks.map((t: any, ri: number) => {
                  const [sy, sm, sd] = (t.startDate || t.endDate).split('-').map(Number);
                  const [ey, em, ed] = (t.endDate   || t.startDate).split('-').map(Number);
                  const tStart  = new Date(Date.UTC(sy, sm-1, sd));
                  const tEnd    = new Date(Date.UTC(ey, em-1, ed));
                  const inView  = tEnd >= startDay && tStart <= endDay;
                  const startMs = startDay.getTime();
                  const leftCol  = Math.max(0,    Math.floor((tStart.getTime() - startMs) / mspd));
                  const rightCol = Math.min(days,  Math.ceil((tEnd.getTime()   - startMs) / mspd) + 1);
                  const leftPx   = leftCol  * cellW;
                  const widthPx  = Math.max((rightCol - leftCol) * cellW, 4);
                  const ol = tStart < startDay, or = tEnd > endDay;
                  const br = `${ol?0:5}px ${or?0:5}px ${or?0:5}px ${ol?0:5}px`;
                  const prog = t.progress || 0;
                  const todayOff  = Math.floor((today.getTime() - startMs) / mspd) * cellW;
                  const showToday = today >= startDay && today <= endDay;
                  const rowH      = isMobile ? 30 : 36;
                  const barH      = isMobile ? 16 : 22;
                  const barTop    = (rowH - barH) / 2;

                  return (
                    <tr key={`t${gi}-${ri}`}
                      style={{ background:'rgba(11,11,19,.7)', borderBottom:'1px solid rgba(255,255,255,.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,18,28,.85)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,11,19,.7)'}
                    >
                      {/* Sticky task name cell */}
                      <td onClick={() => onOpenDate(t.li, t.ti)} title={t.text}
                        style={{
                          padding: isMobile ? '5px 8px' : '7px 14px',
                          fontSize: isMobile ? '.7rem' : '.8rem',
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                          width: NAME_W, maxWidth: NAME_W,
                          position:'sticky', left:0,
                          background:'rgba(11,11,19,.92)',
                          borderRight:'1px solid var(--border)',
                          cursor:'pointer', zIndex:5,
                          color: t.done ? 'var(--done-txt)' : 'inherit',
                          textDecoration: t.done ? 'line-through' : 'none',
                          verticalAlign:'middle',
                          height: rowH,
                        }}>
                        {t.done ? '✓ ' : ''}{t.text}
                      </td>

                      {/* Timeline cell */}
                      <td colSpan={days} style={{ padding:0, position:'relative', height:rowH, verticalAlign:'middle' }}>
                        {showToday && (
                          <div style={{ position:'absolute', top:0, bottom:0, left:todayOff, width:1, background:'rgba(255,95,160,.5)', zIndex:4, pointerEvents:'none' }}/>
                        )}
                        {inView && (
                          <div onClick={() => onOpenDate(t.li, t.ti)}
                            style={{
                              position:'absolute', top:barTop, left:leftPx,
                              width:widthPx, height:barH, borderRadius:br,
                              background:`linear-gradient(90deg,${t.pal.c1},${t.pal.c2})`,
                              opacity: t.done ? .45 : 1,
                              overflow:'hidden', cursor:'pointer',
                              transition:'filter .18s',
                              boxShadow:`0 2px 8px rgba(0,0,0,.3)`,
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter='brightness(1.18)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter=''}
                          >
                            {/* Progress fill */}
                            <div style={{ position:'absolute', inset:0, width:`${prog}%`, background:'rgba(255,255,255,.25)', borderRadius:'inherit' }}/>
                            {/* Label — only if bar wide enough */}
                            {widthPx > (isMobile ? 28 : 40) && (
                              <div style={{ position:'absolute', left:6, right:4, top:0, bottom:0, display:'flex', alignItems:'center', fontSize: isMobile ? '.52rem' : '.62rem', color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', gap:3, zIndex:2 }}>
                                {t.text}
                                {prog > 0 && !isMobile && (
                                  <span style={{ fontSize:'.54rem', padding:'1px 4px', borderRadius:4, background:'rgba(0,0,0,.3)', flexShrink:0 }}>{prog}%</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ])}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thBase: React.CSSProperties = {
  padding: '7px 4px',
  fontSize: '.66rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: .6,
  color: 'var(--muted)', textAlign: 'center',
  borderBottom: '1px solid var(--border)',
  position: 'sticky', top: 0, zIndex: 10,
  whiteSpace: 'nowrap',
};

const navBtn: React.CSSProperties = {
  background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)',
  width:32, height:32, borderRadius:9, cursor:'pointer', fontSize:'.88rem',
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
};
