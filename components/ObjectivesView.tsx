'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Objective, ObjComponent } from '@/lib/types';
import { useObjectivesStore } from '@/lib/store';

const ACCENT_PAIRS = [
  ['#6f5fff','#ff5fa0'], ['#00c6ff','#7b2ff7'], ['#00d26a','#38f9d7'],
  ['#f7971e','#ffd200'], ['#f953c6','#b91d73'], ['#4facfe','#00f2fe'],
  ['#fa709a','#fee140'], ['#11998e','#38ef7d'], ['#667eea','#764ba2'],
  ['#fc4a1a','#f7b733'], ['#4e54c8','#8f94fb'], ['#ff6b6b','#ffa07a'],
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─────────────────────────────────────────────────────────────────────
export default function ObjectivesView() {
  const store = useObjectivesStore();
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [addObjOpen,  setAddObjOpen]  = useState(false);
  const [editObjId,   setEditObjId]   = useState<string|null>(null);
  const [editCompId,  setEditCompId]  = useState<string|null>(null);
  const [addCompOpen, setAddCompOpen] = useState(false);

  const selected = store.objectives.find(o => o.id === selectedId) ?? null;

  useEffect(() => {
    if (store.hydrated && !selectedId && store.objectives.length > 0)
      setSelectedId(store.objectives[0].id);
  }, [store.hydrated, store.objectives.length]);

  const handleDeleteObj = (id: string) => {
    store.deleteObjective(id);
    setSelectedId(store.objectives.find(o => o.id !== id)?.id ?? null);
  };

  return (
    <div style={{ display:'flex', height:'100%', minHeight:0, overflow:'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width:260, flexShrink:0, display:'flex', flexDirection:'column',
        background:'rgba(11,11,19,.78)', borderRight:'1px solid var(--border)',
        backdropFilter:'blur(18px)',
      }}>
        <div style={{ padding:'16px 14px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'.78rem', letterSpacing:1.4, textTransform:'uppercase', color:'var(--muted)' }}>
            Objectives
          </span>
          <button onClick={() => setAddObjOpen(true)} style={iconBtn}>
            <i className="fa-solid fa-plus"/>
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 8px 16px' }}>
          {store.objectives.length === 0 && (
            <p style={{ textAlign:'center', color:'var(--muted)', fontSize:'.74rem', padding:'20px 10px', lineHeight:1.7 }}>
              No objectives yet.<br/>Create one to get started.
            </p>
          )}
          {store.objectives.map(obj => {
            const pct = obj.components.length === 0 ? 0
              : Math.round(obj.components.filter(c=>c.done).length / obj.components.length * 100);
            const active = selectedId === obj.id;
            return (
              <div key={obj.id} onClick={() => setSelectedId(obj.id)}
                style={{
                  position:'relative', overflow:'hidden', borderRadius:12,
                  marginBottom:6, padding:'11px 13px', cursor:'pointer',
                  border:`1px solid ${active ? obj.color : 'var(--border)'}`,
                  background: active ? `rgba(${hexToRgb(obj.color)},.13)` : 'rgba(255,255,255,.025)',
                  transition:'all .22s',
                  boxShadow: active ? `0 0 18px rgba(${hexToRgb(obj.color)},.22)` : 'none',
                }}
              >
                {/* progress bar bg */}
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0,
                  width:`${pct}%`,
                  background:`linear-gradient(90deg,rgba(${hexToRgb(obj.color)},.22),rgba(${hexToRgb(obj.color2)},.1))`,
                  transition:'width .7s cubic-bezier(.4,0,.2,1)',
                  pointerEvents:'none',
                }}/>
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontWeight:700, fontSize:'.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{obj.title}</span>
                    <span style={{ fontSize:'.64rem', color:'var(--muted)', marginLeft:6, flexShrink:0 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize:'.68rem', color:'var(--muted)' }}>
                    {obj.components.filter(c=>c.done).length}/{obj.components.length} components
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <main style={{ flex:1, position:'relative', overflow:'hidden', minHeight:0 }}>
        {!selected
          ? <EmptyState onAdd={() => setAddObjOpen(true)} />
          : <Canvas
              key={selected.id}
              obj={selected}
              onToggle={(cid) => store.updateComponent(selected.id, cid, { done: !selected.components.find(c=>c.id===cid)?.done })}
              onEditComp={(cid) => setEditCompId(cid)}
              onDeleteComp={(cid) => store.deleteComponent(selected.id, cid)}
              onAddComp={() => setAddCompOpen(true)}
              onEditObj={() => setEditObjId(selected.id)}
              onDeleteObj={() => handleDeleteObj(selected.id)}
            />
        }
      </main>

      {/* ── Modals ──────────────────────────────────────────── */}
      {addObjOpen && (
        <AddObjModal onClose={() => setAddObjOpen(false)}
          onCreate={(title,desc,c1,c2) => { const id=store.addObjective(title,desc,c1,c2); setSelectedId(id); setAddObjOpen(false); }} />
      )}
      {addCompOpen && selected && (
        <AddCompModal onClose={() => setAddCompOpen(false)}
          onCreate={(text) => { store.addComponent(selected.id, text); setAddCompOpen(false); }} />
      )}
      {editCompId && selected && (() => {
        const comp = selected.components.find(c=>c.id===editCompId);
        if (!comp) return null;
        return <EditCompModal comp={comp} onClose={() => setEditCompId(null)}
          onSave={(p) => { store.updateComponent(selected.id, editCompId, p); setEditCompId(null); }} />;
      })()}
      {editObjId && (() => {
        const obj = store.objectives.find(o=>o.id===editObjId);
        if (!obj) return null;
        return <EditObjModal obj={obj} onClose={() => setEditObjId(null)}
          onSave={(p) => { store.updateObjective(editObjId, p); setEditObjId(null); }} />;
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Canvas — center card + orbiting component cards + SVG lines
// ─────────────────────────────────────────────────────────────────────
function Canvas({ obj, onToggle, onEditComp, onDeleteComp, onAddComp, onEditObj, onDeleteObj }: {
  obj: Objective;
  onToggle: (id:string)=>void;
  onEditComp: (id:string)=>void;
  onDeleteComp: (id:string)=>void;
  onAddComp: ()=>void;
  onEditObj: ()=>void;
  onDeleteObj: ()=>void;
}) {
  const canvasRef   = useRef<HTMLDivElement>(null);
  const centerRef   = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w:800, h:600 });
  const [centerRect, setCenterRect] = useState({ x:0, y:0, w:0, h:0 });
  // Track drag state
  const [dragging, setDragging] = useState<string|null>(null);
  const [dropGlow, setDropGlow] = useState(false);
  const [justDropped, setJustDropped] = useState<string|null>(null);

  const pct = obj.components.length === 0 ? 0
    : Math.round(obj.components.filter(c=>c.done).length / obj.components.length * 100);

  const done    = obj.components.filter(c=>c.done);
  const notDone = obj.components.filter(c=>!c.done);

  // Measure canvas
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w:el.offsetWidth, h:el.offsetHeight }));
    ro.observe(el);
    setSize({ w:el.offsetWidth, h:el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // Measure center card
  useEffect(() => {
    const el = centerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const pr = canvasRef.current!.getBoundingClientRect();
    setCenterRect({ x:r.left-pr.left, y:r.top-pr.top, w:r.width, h:r.height });
  }, [size, obj.components.length]);

  const cx = size.w / 2;
  const cy = size.h / 2;

  // Arrange not-done components in rings
  const positions = computePositions(notDone.length, cx, cy, size.w, size.h);

  // ── Drag handlers ──────────────────────────────────────────
  const startDrag = useCallback((id: string) => setDragging(id), []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !centerRef.current || !canvasRef.current) return;
    const cr = centerRef.current.getBoundingClientRect();
    const over = e.clientX > cr.left && e.clientX < cr.right && e.clientY > cr.top && e.clientY < cr.bottom;
    setDropGlow(over);
  }, [dragging]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragging || !centerRef.current) { setDragging(null); setDropGlow(false); return; }
    const cr = centerRef.current.getBoundingClientRect();
    const over = e.clientX > cr.left && e.clientX < cr.right && e.clientY > cr.top && e.clientY < cr.bottom;
    if (over) { setJustDropped(dragging); onToggle(dragging); setTimeout(() => setJustDropped(null), 700); }
    setDragging(null); setDropGlow(false);
  }, [dragging, onToggle]);

  // Touch drag
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || !centerRef.current) return;
    const t = e.touches[0];
    const cr = centerRef.current.getBoundingClientRect();
    setDropGlow(t.clientX>cr.left && t.clientX<cr.right && t.clientY>cr.top && t.clientY<cr.bottom);
  }, [dragging]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragging || !centerRef.current) { setDragging(null); setDropGlow(false); return; }
    const t = e.changedTouches[0];
    const cr = centerRef.current.getBoundingClientRect();
    if (t.clientX>cr.left && t.clientX<cr.right && t.clientY>cr.top && t.clientY<cr.bottom) {
      setJustDropped(dragging); onToggle(dragging); setTimeout(() => setJustDropped(null), 700);
    }
    setDragging(null); setDropGlow(false);
  }, [dragging, onToggle]);

  return (
    <div ref={canvasRef} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ width:'100%', height:'100%', position:'relative', userSelect: dragging ? 'none' : 'auto',
        cursor: dragging ? 'grabbing' : 'default',
      }}>

      {/* Ambient radial glow */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 50%, rgba(${hexToRgb(obj.color)},.07) 0%, transparent 65%)`, pointerEvents:'none' }}/>

      {/* SVG connector lines */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1, overflow:'visible' }}>
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <circle cx="3" cy="3" r="1.5" fill={`rgba(${hexToRgb(obj.color)},.5)`}/>
          </marker>
        </defs>
        {notDone.map((comp, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const isDrag = dragging === comp.id;
          return (
            <line key={comp.id}
              x1={cx} y1={cy}
              x2={pos.x} y2={pos.y}
              stroke={isDrag ? obj.color : `rgba(${hexToRgb(obj.color)},.2)`}
              strokeWidth={isDrag ? 2 : 1.5}
              strokeDasharray={isDrag ? "6 3" : "5 5"}
              markerEnd="url(#arr)"
              style={{ transition:'stroke .2s, stroke-width .2s' }}
            />
          );
        })}
      </svg>

      {/* Not-done component cards */}
      {notDone.map((comp, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <CompCard key={comp.id} comp={comp} pos={pos}
            color={obj.color} color2={obj.color2}
            isDragging={dragging === comp.id}
            onDragStart={() => startDrag(comp.id)}
            onEdit={() => onEditComp(comp.id)}
            onDelete={() => onDeleteComp(comp.id)}
            hint={notDone.length <= 3 && i === 0}
          />
        );
      })}

      {/* Center objective card */}
      <div ref={centerRef} style={{
        position:'absolute',
        left:'50%', top:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:10,
        width: Math.min(260, size.w * 0.32),
        minWidth: 200,
      }}>
        <CenterCard obj={obj} pct={pct} doneComps={done}
          dropGlow={dropGlow}
          onAddComp={onAddComp} onEditObj={onEditObj} onDeleteObj={onDeleteObj}
        />
      </div>

      {/* Hint label */}
      {notDone.length > 0 && (
        <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', fontSize:'.68rem', color:'var(--muted)', pointerEvents:'none', whiteSpace:'nowrap', background:'rgba(11,11,19,.6)', padding:'4px 12px', borderRadius:20, backdropFilter:'blur(8px)' }}>
          Drag a component onto the objective to complete it
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Center Card
// ─────────────────────────────────────────────────────────────────────
function CenterCard({ obj, pct, doneComps, dropGlow, onAddComp, onEditObj, onDeleteObj }: {
  obj: Objective; pct: number; doneComps: ObjComponent[];
  dropGlow: boolean; onAddComp:()=>void; onEditObj:()=>void; onDeleteObj:()=>void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{
      borderRadius: 22,
      border: `2px solid ${dropGlow ? '#fff' : obj.color}`,
      background: `linear-gradient(145deg, rgba(${hexToRgb(obj.color)},.18), rgba(${hexToRgb(obj.color2)},.10))`,
      backdropFilter:'blur(20px)',
      boxShadow: dropGlow
        ? `0 0 0 4px ${obj.color}, 0 0 60px rgba(${hexToRgb(obj.color)},.7)`
        : `0 0 40px rgba(${hexToRgb(obj.color)},.35), inset 0 1px 0 rgba(255,255,255,.08)`,
      padding:'22px 20px 18px',
      transition:'box-shadow .25s, border-color .25s',
      position:'relative', overflow:'hidden',
    }}>
      {/* Animated shimmer bar when drop target */}
      {dropGlow && (
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)`, animation:'shimmer 1s linear infinite', pointerEvents:'none' }}/>
      )}

      {/* Progress fill */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,.07)', borderRadius:'0 0 22px 22px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${obj.color},${obj.color2})`, transition:'width .8s cubic-bezier(.4,0,.2,1)', borderRadius:3 }}/>
      </div>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'1.05rem', lineHeight:1.2, background:`linear-gradient(135deg,${obj.color},${obj.color2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:4 }}>
            {obj.title}
          </div>
          {obj.description && (
            <div style={{ fontSize:'.7rem', color:'var(--muted)', lineHeight:1.5 }}>{obj.description}</div>
          )}
        </div>
        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={() => setMenuOpen(v=>!v)} style={{ ...iconBtn, background:'rgba(255,255,255,.06)' }}>
            <i className="fa-solid fa-ellipsis"/>
          </button>
          {menuOpen && (
            <div onClick={()=>setMenuOpen(false)} style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'rgba(14,14,22,.98)', border:'1px solid var(--border)', borderRadius:12, padding:4, minWidth:150, zIndex:50, boxShadow:'0 16px 48px rgba(0,0,0,.6)', animation:'menuIn .15s ease' }}>
              <MI icon="fa-pen"   label="Edit"   onClick={onEditObj}/>
              <MI icon="fa-trash" label="Delete" danger onClick={onDeleteObj}/>
            </div>
          )}
        </div>
      </div>

      {/* Progress ring + % */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <ProgressRing pct={pct} color={obj.color} color2={obj.color2} size={42}/>
        <div>
          <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--text)' }}>{pct}% complete</div>
          <div style={{ fontSize:'.65rem', color:'var(--muted)' }}>{doneComps.length} of {obj.components.length} done</div>
        </div>
      </div>

      {/* Done component pills */}
      {doneComps.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
          {doneComps.slice(0,6).map(c => (
            <span key={c.id} style={{ fontSize:'.6rem', padding:'2px 8px', borderRadius:20, background:`rgba(${hexToRgb(obj.color)},.2)`, border:`1px solid rgba(${hexToRgb(obj.color)},.35)`, color:'var(--text)', display:'flex', alignItems:'center', gap:3 }}>
              <i className="fa-solid fa-check" style={{ fontSize:'.5rem', color:obj.color }}/> {c.text}
            </span>
          ))}
          {doneComps.length > 6 && <span style={{ fontSize:'.6rem', color:'var(--muted)', alignSelf:'center' }}>+{doneComps.length-6} more</span>}
        </div>
      )}

      <button onClick={onAddComp} style={{
        width:'100%', padding:'7px', borderRadius:10, border:`1px dashed rgba(${hexToRgb(obj.color)},.45)`,
        background:`rgba(${hexToRgb(obj.color)},.06)`, color:obj.color,
        fontFamily:'DM Sans,sans-serif', fontSize:'.74rem', fontWeight:600, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all .2s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.background=`rgba(${hexToRgb(obj.color)},.16)`;}}
        onMouseLeave={e=>{e.currentTarget.style.background=`rgba(${hexToRgb(obj.color)},.06)`;}}
      >
        <i className="fa-solid fa-plus" style={{ fontSize:'.65rem' }}/> Add Component
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Component card — draggable, orbiting
// ─────────────────────────────────────────────────────────────────────
function CompCard({ comp, pos, color, color2, isDragging, onDragStart, onEdit, onDelete, hint }: {
  comp: ObjComponent; pos:{x:number;y:number};
  color:string; color2:string; isDragging:boolean;
  onDragStart:()=>void; onEdit:()=>void; onDelete:()=>void; hint?:boolean;
}) {
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    onDragStart();
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onDragStart();
  };

  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setMenuOpen(false);}}
      onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
      style={{
        position:'absolute',
        left: pos.x, top: pos.y,
        transform:'translate(-50%,-50%)',
        width: 130,
        zIndex: isDragging ? 50 : hov ? 20 : 5,
        cursor: isDragging ? 'grabbing' : 'grab',
        animation: isDragging ? 'none' : 'floatNode 3.5s ease-in-out infinite',
        animationDelay:`${((pos.x + pos.y) % 20) * 0.12}s`,
        transition: isDragging ? 'none' : 'box-shadow .2s',
      }}
    >
      <div style={{
        borderRadius: 16,
        border: `1.5px solid ${isDragging ? color : hov ? `rgba(${hexToRgb(color)},.7)` : 'rgba(255,255,255,.12)'}`,
        background: isDragging
          ? `linear-gradient(145deg,rgba(${hexToRgb(color)},.28),rgba(${hexToRgb(color2)},.18))`
          : `rgba(11,11,19,.88)`,
        backdropFilter:'blur(14px)',
        boxShadow: isDragging
          ? `0 8px 40px rgba(${hexToRgb(color)},.55), 0 0 0 2px ${color}`
          : hov ? `0 6px 24px rgba(${hexToRgb(color)},.28)` : '0 4px 16px rgba(0,0,0,.4)',
        padding:'11px 12px',
        transition:'background .2s, border-color .2s, box-shadow .2s',
        position:'relative', overflow:'hidden',
      }}>
        {/* left accent bar */}
        <div style={{ position:'absolute', left:0, top:8, bottom:8, width:3, borderRadius:2, background:`linear-gradient(180deg,${color},${color2})` }}/>

        <div style={{ paddingLeft:8 }}>
          <div style={{ fontSize:'.76rem', fontWeight:600, lineHeight:1.35, marginBottom: hov ? 6 : 0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {comp.text}
          </div>
          {comp.notes && !hov && (
            <div style={{ fontSize:'.62rem', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{comp.notes}</div>
          )}
          {hov && !isDragging && (
            <div style={{ display:'flex', gap:4, animation:'fadeIn .15s' }}>
              <NBtn color={color}   title="Mark done" onClick={onEdit}><i className="fa-solid fa-check" style={{fontSize:'.55rem'}}/></NBtn>
              <NBtn color="rgba(255,255,255,.18)" title="Edit" onClick={onEdit}><i className="fa-solid fa-pen" style={{fontSize:'.55rem'}}/></NBtn>
              <NBtn color="#ff4d4d" title="Delete" onClick={onDelete}><i className="fa-solid fa-trash" style={{fontSize:'.55rem'}}/></NBtn>
            </div>
          )}
        </div>

        {isDragging && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.15)', borderRadius:16 }}>
            <i className="fa-solid fa-arrow-up" style={{ color:color, fontSize:'.7rem', animation:'bounce .6s ease-in-out infinite' }}/>
          </div>
        )}
      </div>

      {/* Drag hint */}
      {hint && !isDragging && !hov && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', fontSize:'.6rem', color:'var(--muted)', whiteSpace:'nowrap', background:'rgba(11,11,19,.8)', padding:'2px 8px', borderRadius:10, pointerEvents:'none' }}>
          drag to complete
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SVG progress ring
// ─────────────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, color2, size }: { pct:number; color:string; color2:string; size:number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <defs>
        <linearGradient id={`rg-${color.slice(1)}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color}/>
          <stop offset="100%" stopColor={color2}/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={`url(#rg-${color.slice(1)})`} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition:'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fontSize={size < 44 ? 9 : 11} fontWeight={700} fill="var(--text)" fontFamily="DM Sans,sans-serif">{pct}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Position algorithm — spread cards in inner + outer rings
// ─────────────────────────────────────────────────────────────────────
function computePositions(n: number, cx:number, cy:number, w:number, h:number) {
  if (n === 0) return [];
  // Use two rings if more than 6
  const maxR = Math.min(w, h) * 0.36;
  const minR = Math.min(w, h) * 0.22;
  const positions: {x:number;y:number}[] = [];
  if (n <= 6) {
    for (let i=0; i<n; i++) {
      const angle = (2*Math.PI*i/n) - Math.PI/2;
      const jitter = ((i*41+7)%30) - 15;
      const r = (minR + maxR) / 2 + jitter;
      positions.push({ x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r });
    }
  } else {
    const inner = Math.ceil(n/2), outer = n - inner;
    for (let i=0; i<inner; i++) {
      const angle = (2*Math.PI*i/inner) - Math.PI/2;
      positions.push({ x: cx + Math.cos(angle)*minR, y: cy + Math.sin(angle)*minR });
    }
    for (let i=0; i<outer; i++) {
      const angle = (2*Math.PI*i/outer) - Math.PI/3;
      const jitter = ((i*53+11)%24) - 12;
      positions.push({ x: cx + Math.cos(angle)*(maxR+jitter), y: cy + Math.sin(angle)*(maxR+jitter) });
    }
  }
  return positions;
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }:{ onAdd:()=>void }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, color:'var(--muted)' }}>
      <div style={{ fontSize:'2.8rem', opacity:.18, lineHeight:1 }}>◎</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'.95rem', color:'var(--text)' }}>No objective selected</div>
      <div style={{ fontSize:'.78rem' }}>Pick one from the sidebar or create a new one</div>
      <button onClick={onAdd} style={{ marginTop:6, background:'var(--accent)', border:'none', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:'.8rem', padding:'9px 22px', borderRadius:11, cursor:'pointer', fontWeight:600, boxShadow:'0 0 22px rgba(111,95,255,.4)' }}>
        <i className="fa-solid fa-plus" style={{marginRight:6}}/>New Objective
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────
function AddObjModal({ onClose, onCreate }:{ onClose:()=>void; onCreate:(t:string,d:string,c1:string,c2:string)=>void }) {
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState(''); const [pi,setPi]=useState(0);
  const submit = () => { if (!title.trim()) return; const [c1,c2]=ACCENT_PAIRS[pi]; onCreate(title.trim(),desc.trim(),c1,c2); };
  return (
    <Overlay onClose={onClose}><ModalBox title="New Objective" onClose={onClose}>
      <MLbl>Title</MLbl><MIn value={title} set={setTitle} ph="e.g. Launch product v2" af onEnt={submit}/>
      <MLbl>Description (optional)</MLbl><MIn value={desc} set={setDesc} ph="What does success look like?"/>
      <MLbl>Color</MLbl>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
        {ACCENT_PAIRS.map(([c1,c2],i)=>(<div key={i} onClick={()=>setPi(i)} style={{width:28,height:28,borderRadius:7,cursor:'pointer',background:`linear-gradient(135deg,${c1},${c2})`,border:`2px solid ${i===pi?'#fff':'transparent'}`,transition:'all .18s',transform:i===pi?'scale(1.2)':'scale(1)'}}/>))}
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={submit} c={ACCENT_PAIRS[pi][0]}>Create</PBtn></div>
    </ModalBox></Overlay>
  );
}

function AddCompModal({ onClose, onCreate }:{ onClose:()=>void; onCreate:(t:string)=>void }) {
  const [text,setText]=useState('');
  return (
    <Overlay onClose={onClose}><ModalBox title="Add Component" onClose={onClose}>
      <MLbl>Component name</MLbl><MIn value={text} set={setText} ph="e.g. Design mockups, Write tests…" af onEnt={()=>text.trim()&&onCreate(text.trim())}/>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>text.trim()&&onCreate(text.trim())}>Add</PBtn></div>
    </ModalBox></Overlay>
  );
}

function EditCompModal({ comp, onClose, onSave }:{ comp:ObjComponent; onClose:()=>void; onSave:(p:Partial<ObjComponent>)=>void }) {
  const [text,setText]=useState(comp.text); const [notes,setNotes]=useState(comp.notes);
  return (
    <Overlay onClose={onClose}><ModalBox title="Edit Component" onClose={onClose}>
      <MLbl>Name</MLbl><MIn value={text} set={setText} af onEnt={()=>onSave({text:text.trim(),notes})}/>
      <MLbl>Notes</MLbl>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes…"
        style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.83rem',padding:'8px 10px',outline:'none',resize:'vertical',minHeight:68,marginBottom:14,boxSizing:'border-box'}}/>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>onSave({text:text.trim(),notes})}>Save</PBtn></div>
    </ModalBox></Overlay>
  );
}

function EditObjModal({ obj, onClose, onSave }:{ obj:Objective; onClose:()=>void; onSave:(p:Partial<Objective>)=>void }) {
  const [title,setTitle]=useState(obj.title); const [desc,setDesc]=useState(obj.description);
  const [pi,setPi]=useState(()=>Math.max(0,ACCENT_PAIRS.findIndex(([c])=>c===obj.color)));
  return (
    <Overlay onClose={onClose}><ModalBox title="Edit Objective" onClose={onClose}>
      <MLbl>Title</MLbl><MIn value={title} set={setTitle} af/>
      <MLbl>Description</MLbl><MIn value={desc} set={setDesc}/>
      <MLbl>Color</MLbl>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
        {ACCENT_PAIRS.map(([c1,c2],i)=>(<div key={i} onClick={()=>setPi(i)} style={{width:28,height:28,borderRadius:7,cursor:'pointer',background:`linear-gradient(135deg,${c1},${c2})`,border:`2px solid ${i===pi?'#fff':'transparent'}`,transition:'all .18s',transform:i===pi?'scale(1.2)':'scale(1)'}}/>))}
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>onSave({title:title.trim(),description:desc,color:ACCENT_PAIRS[pi][0],color2:ACCENT_PAIRS[pi][1]})} c={ACCENT_PAIRS[pi][0]}>Save</PBtn></div>
    </ModalBox></Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tiny shared primitives
// ─────────────────────────────────────────────────────────────────────
function Overlay({ children,onClose }:{ children:React.ReactNode; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.62)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}
function ModalBox({ title,children,onClose }:{ title:string; children:React.ReactNode; onClose:()=>void }) {
  return (
    <div style={{background:'rgba(16,16,26,.98)',border:'1px solid var(--border)',borderRadius:18,padding:'22px 24px',minWidth:340,maxWidth:420,boxShadow:'0 32px 80px rgba(0,0,0,.7)',animation:'modalIn .22s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'.92rem'}}>{title}</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'.9rem'}}>✕</button>
      </div>
      {children}
    </div>
  );
}
function MLbl({ children }:{ children:React.ReactNode }) {
  return <div style={{fontSize:'.69rem',color:'var(--muted)',marginBottom:5,textTransform:'uppercase',letterSpacing:.9}}>{children}</div>;
}
function MIn({ value,set,ph,af,onEnt }:{ value:string; set:(v:string)=>void; ph?:string; af?:boolean; onEnt?:()=>void }) {
  return <input value={value} onChange={e=>set(e.target.value)} placeholder={ph} autoFocus={af} onKeyDown={e=>e.key==='Enter'&&onEnt?.()} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.85rem',padding:'9px 12px',outline:'none',marginBottom:14,boxSizing:'border-box'}}/>;
}
function GBtn({ children,onClick }:{ children:React.ReactNode; onClick:()=>void }) {
  return <button onClick={onClick} style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}>{children}</button>;
}
function PBtn({ children,onClick,c='var(--accent)' }:{ children:React.ReactNode; onClick:()=>void; c?:string }) {
  return <button onClick={onClick} style={{background:c,border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',fontWeight:600,padding:'8px 18px',borderRadius:8,cursor:'pointer'}}>{children}</button>;
}
function NBtn({ children,onClick,color,title }:{ children:React.ReactNode; onClick:()=>void; color:string; title?:string }) {
  return <button title={title} onClick={e=>{e.stopPropagation();onClick();}} style={{background:color,border:'none',borderRadius:5,width:22,height:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{children}</button>;
}
function MI({ icon,label,danger,onClick }:{ icon:string; label:string; danger?:boolean; onClick:()=>void }) {
  return <div onClick={onClick} className="menu-item-hover" style={{padding:'8px 12px',borderRadius:7,fontSize:'.76rem',cursor:'pointer',display:'flex',alignItems:'center',gap:8,color:danger?'#ff6b6b':'var(--text)'}}><i className={`fa-solid ${icon}`} style={{width:12}}/>{label}</div>;
}

const iconBtn: React.CSSProperties = {
  background:'none', border:'1px solid var(--border)', borderRadius:7,
  color:'var(--muted)', width:26, height:26, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem',
};
