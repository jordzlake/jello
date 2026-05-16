'use client';
import { useState, useEffect } from 'react';
import { JList } from '@/lib/types';
import { PAL } from '@/lib/utils';

// ── Iconify SVG icons fetched inline via API ──────────────────────────
// Each milestone maps to an Iconify icon ID + label
const MILESTONES: { pct: number; icon: string; label: string; color: string }[] = [
  { pct: 5,   icon: 'noto:snail',                         label: 'Just started!',       color: '#94a3b8' },
  { pct: 10,  icon: 'noto:turtle',                        label: 'Slow & steady',       color: '#94a3b8' },
  { pct: 15,  icon: 'noto:seedling',                      label: 'Growing…',            color: '#86efac' },
  { pct: 20,  icon: 'noto:baby-chick',                    label: 'Getting there!',      color: '#86efac' },
  { pct: 25,  icon: 'noto:hatching-chick',                label: 'One quarter done!',   color: '#6ee7b7' },
  { pct: 30,  icon: 'noto:joystick',                      label: 'Warming up',          color: '#6ee7b7' },
  { pct: 35,  icon: 'noto:running-shoe',                  label: 'Picking up pace',     color: '#67e8f9' },
  { pct: 40,  icon: 'noto:person-running',                label: 'On the move!',        color: '#67e8f9' },
  { pct: 45,  icon: 'noto:flexed-biceps',                 label: 'Feeling strong',      color: '#38bdf8' },
  { pct: 50,  icon: 'noto:trophy',                        label: 'Halfway there! 🎯',  color: '#fbbf24' },
  { pct: 55,  icon: 'noto:fire',                          label: 'On fire!',            color: '#fb923c' },
  { pct: 60,  icon: 'noto:rocket',                        label: 'Rocket mode!',        color: '#f87171' },
  { pct: 65,  icon: 'noto:star',                          label: 'Shining bright',      color: '#a78bfa' },
  { pct: 70,  icon: 'noto:racing-car',                    label: 'Full speed ahead',    color: '#818cf8' },
  { pct: 75,  icon: 'noto:lightning',                     label: 'Lightning fast!',     color: '#60a5fa' },
  { pct: 80,  icon: 'noto:crown',                         label: 'Almost royalty',      color: '#34d399' },
  { pct: 85,  icon: 'noto:sparkles',                      label: 'Sparkling!',          color: '#4ade80' },
  { pct: 90,  icon: 'noto:rabbit',                        label: 'Speed of a hare!',    color: '#a3e635' },
  { pct: 95,  icon: 'noto:hammer-and-wrench',             label: 'Final touches!',      color: '#fde047' },
  { pct: 100, icon: 'noto:party-popper',                  label: 'COMPLETE! 🎉',       color: '#f0abfc' },
];

function getMilestone(pct: number) {
  if (pct === 0) return null;
  // find highest milestone at or below pct
  let best = MILESTONES[0];
  for (const m of MILESTONES) {
    if (m.pct <= pct) best = m;
  }
  return best;
}

// Iconify REST API — loads SVG on demand
function IconifyIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const [svg, setSvg] = useState<string>('');
  useEffect(() => {
    const [prefix, name] = icon.split(':');
    fetch(`https://api.iconify.design/${prefix}/${name}.svg?width=${size}&height=${size}`)
      .then(r => r.text())
      .then(text => { if (text.startsWith('<svg')) setSvg(text); })
      .catch(() => {});
  }, [icon, size]);
  if (!svg) return <span style={{ display:'inline-block', width:size, height:size }}/>; 
  return <span dangerouslySetInnerHTML={{ __html: svg }} style={{ display:'inline-flex', alignItems:'center', lineHeight:0, width:size, height:size }} />;
}

interface Props {
  lists: JList[];
}

export default function ProgressTray({ lists }: Props) {
  const [open, setOpen] = useState(false);

  const listData = lists.map((lst, i) => {
    const total = lst.tasks.length;
    const done  = lst.tasks.filter(t => t.done).length;
    const pct   = total === 0 ? 0 : Math.round(done / total * 100);
    const pal   = lst.palette || PAL[i % PAL.length];
    const milestone = getMilestone(pct);
    return { title: lst.title, total, done, pct, pal, milestone };
  }).filter(l => l.total > 0); // only lists with tasks

  const overallTotal = listData.reduce((s, l) => s + l.total, 0);
  const overallDone  = listData.reduce((s, l) => s + l.done,  0);
  const overallPct   = overallTotal === 0 ? 0 : Math.round(overallDone / overallTotal * 100);
  const overallMilestone = getMilestone(overallPct);

  return (
    <>
      {/* ── Tab trigger ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Progress tracker"
        style={{
          position: 'fixed',
          right: open ? 284 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 300,
          background: 'linear-gradient(135deg,#6f5fff,#ff5fa0)',
          border: 'none',
          borderRadius: open ? '8px 0 0 8px' : '8px 0 0 8px',
          width: 28,
          padding: '18px 0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          boxShadow: open ? 'none' : '-3px 0 18px rgba(111,95,255,.45)',
          transition: 'right .3s cubic-bezier(.4,0,.2,1)',
          writingMode: 'vertical-rl',
        }}
      >
        <span style={{ fontSize: '.6rem', fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
          Progress
        </span>
        <i className={`fa-solid fa-chevron-${open ? 'right' : 'left'}`} style={{ color: '#fff', fontSize: '.65rem', marginTop: 4 }}/>
      </button>

      {/* ── Backdrop (mobile) ────────────────────────────── */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:298, background:'rgba(0,0,0,.35)', backdropFilter:'blur(2px)' }}/>
      )}

      {/* ── Tray panel ───────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        right: open ? 0 : -284,
        top: 0,
        bottom: 0,
        width: 284,
        zIndex: 299,
        background: 'rgba(11,11,19,.95)',
        borderLeft: '1px solid var(--border)',
        backdropFilter: 'blur(22px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'right .3s cubic-bezier(.4,0,.2,1)',
        overflowY: 'auto',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,.6)' : 'none',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'.82rem', letterSpacing:1.2, textTransform:'uppercase', background:'linear-gradient(135deg,#6f5fff,#ff5fa0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Progress
            </span>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'.85rem' }}>✕</button>
          </div>

          {/* Overall progress */}
          <div style={{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:'.72rem', color:'var(--muted)', fontWeight:600 }}>Overall</span>
              <span style={{ fontSize:'.72rem', fontWeight:800, color:'var(--text)' }}>{overallPct}%</span>
            </div>
            <div style={{ height:8, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
              <div style={{ height:'100%', width:`${overallPct}%`, background:'linear-gradient(90deg,#6f5fff,#ff5fa0)', borderRadius:4, transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
            {overallMilestone && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <IconifyIcon icon={overallMilestone.icon} size={18}/>
                <span style={{ fontSize:'.65rem', color:overallMilestone.color, fontWeight:600 }}>{overallMilestone.label}</span>
              </div>
            )}
            <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:4 }}>{overallDone} of {overallTotal} tasks done</div>
          </div>
        </div>

        {/* Per-list progress */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px 20px' }}>
          {listData.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--muted)', fontSize:'.76rem', paddingTop:30 }}>
              Add tasks to lists to track progress
            </div>
          ) : (
            listData.map((lst, i) => (
              <ListProgress key={i} {...lst} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ListProgress({ title, total, done, pct, pal, milestone }: {
  title:string; total:number; done:number; pct:number;
  pal:{ c1:string; c2:string }; milestone: typeof MILESTONES[0] | null;
}) {
  return (
    <div style={{
      marginBottom: 14,
      background: `rgba(255,255,255,.03)`,
      borderRadius: 12,
      padding: '11px 12px',
      border: `1px solid rgba(255,255,255,.06)`,
      borderLeft: `3px solid ${pal.c1}`,
    }}>
      {/* Title + pct */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7, gap:6 }}>
        <span style={{ fontSize:'.78rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
          {title}
        </span>
        <span style={{ fontSize:'.72rem', fontWeight:800, color:pal.c1, flexShrink:0 }}>{pct}%</span>
      </div>

      {/* Bar + icon */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, height:7, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg,${pal.c1},${pal.c2})`,
            borderRadius: 4,
            transition: 'width .8s cubic-bezier(.4,0,.2,1)',
            boxShadow: pct > 0 ? `0 0 8px ${pal.c1}66` : 'none',
          }}/>
        </div>
        {milestone
          ? <IconifyIcon icon={milestone.icon} size={20}/>
          : <span style={{ width:20, height:20, display:'inline-block' }}/>
        }
      </div>

      {/* Sub label */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:'.6rem', color:'var(--muted)' }}>{done}/{total} tasks</span>
        {milestone && (
          <span style={{ fontSize:'.6rem', color:milestone.color, fontWeight:600 }}>
            {milestone.label}
          </span>
        )}
      </div>

      {/* Task breakdown mini list */}
      <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:4 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < done ? `linear-gradient(135deg,${pal.c1},${pal.c2})` : 'rgba(255,255,255,.12)',
            transition: 'background .3s',
            boxShadow: i < done ? `0 0 4px ${pal.c1}88` : 'none',
          }}/>
        ))}
      </div>
    </div>
  );
}
