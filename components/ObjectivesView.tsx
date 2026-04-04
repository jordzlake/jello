'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Objective, ObjComponent } from '@/lib/types';
import { useObjectivesStore } from '@/lib/store';

const ACCENT_PAIRS = [
  ['#6f5fff','#ff5fa0'],['#00c6ff','#7b2ff7'],['#00d26a','#38f9d7'],
  ['#f7971e','#ffd200'],['#f953c6','#b91d73'],['#4facfe','#00f2fe'],
  ['#fa709a','#fee140'],['#11998e','#38ef7d'],['#667eea','#764ba2'],
  ['#fc4a1a','#f7b733'],['#4e54c8','#8f94fb'],['#ff6b6b','#ffa07a'],
];

// Pill background colour choices
const PILL_COLORS = [
  'rgba(111,95,255,.22)','rgba(0,210,106,.2)','rgba(255,95,160,.2)',
  'rgba(0,198,255,.2)','rgba(249,115,22,.2)','rgba(234,179,8,.2)',
  'rgba(168,85,247,.2)','rgba(20,184,166,.2)','rgba(239,68,68,.2)',
  'rgba(255,255,255,.08)',
];

function hexToRgb(hex: string) {
  if (!hex || hex.length < 7) return '111,111,111';
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ─────────────────────────────────────────────────────────────────────
export default function ObjectivesView() {
  const store = useObjectivesStore();
  const [selectedId,  setSelectedId]  = useState<string|null>(null);
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
            const total = obj.components.length;
            const done  = obj.components.filter(c => c.done).length;
            const pct   = total === 0 ? 0 : Math.round(done / total * 100);
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
                }}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:`linear-gradient(90deg,rgba(${hexToRgb(obj.color)},.22),rgba(${hexToRgb(obj.color2)},.1))`, transition:'width .7s cubic-bezier(.4,0,.2,1)', pointerEvents:'none' }}/>
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontWeight:700, fontSize:'.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{obj.title}</span>
                    <span style={{ fontSize:'.64rem', color:'var(--muted)', marginLeft:6, flexShrink:0 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize:'.68rem', color:'var(--muted)' }}>{done}/{total} components</div>
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
              onUpdateComp={(cid, patch) => store.updateComponent(selected.id, cid, patch)}
              onAddComp={() => setAddCompOpen(true)}
              onEditObj={() => setEditObjId(selected.id)}
              onDeleteObj={() => handleDeleteObj(selected.id)}
            />
        }
      </main>

      {/* ── Modals ──────────────────────────────────────────── */}
      {addObjOpen && (
        <AddObjModal onClose={() => setAddObjOpen(false)}
          onCreate={(title,desc,c1,c2) => { const id=store.addObjective(title,desc,c1,c2); setSelectedId(id); setAddObjOpen(false); }}/>
      )}
      {addCompOpen && selected && (
        <AddCompModal onClose={() => setAddCompOpen(false)}
          onCreate={(text) => { store.addComponent(selected.id, text); setAddCompOpen(false); }}/>
      )}
      {editCompId && selected && (() => {
        const comp = selected.components.find(c => c.id === editCompId);
        if (!comp) return null;
        return <EditCompModal comp={comp} onClose={() => setEditCompId(null)}
          onSave={(p) => { store.updateComponent(selected.id, editCompId, p); setEditCompId(null); }}/>;
      })()}
      {editObjId && (() => {
        const obj = store.objectives.find(o => o.id === editObjId);
        if (!obj) return null;
        return <EditObjModal obj={obj} onClose={() => setEditObjId(null)}
          onSave={(p) => { store.updateObjective(editObjId, p); setEditObjId(null); }}/>;
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Canvas — full layout: pills zone top, center card middle, done list
// ─────────────────────────────────────────────────────────────────────
function Canvas({ obj, onToggle, onEditComp, onDeleteComp, onUpdateComp, onAddComp, onEditObj, onDeleteObj }: {
  obj: Objective;
  onToggle: (id:string) => void;
  onEditComp: (id:string) => void;
  onDeleteComp: (id:string) => void;
  onUpdateComp: (id:string, patch:Partial<ObjComponent>) => void;
  onAddComp: () => void;
  onEditObj: () => void;
  onDeleteObj: () => void;
}) {
  const centerRef   = useRef<HTMLDivElement>(null);
  const [dragging,  setDragging]  = useState<string|null>(null);
  const [overCenter,setOverCenter]= useState(false);
  const [pulse,     setPulse]     = useState(false);
  const [flash,     setFlash]     = useState<string|null>(null); // comp id that just dropped

  const total  = obj.components.length;
  const done   = obj.components.filter(c => c.done);
  const notDone= obj.components.filter(c => !c.done);
  const pct    = total === 0 ? 0 : Math.round(done.length / total * 100);
  // Each component is worth 100/total %
  const stepPct = total === 0 ? 0 : Math.round(100 / total);

  const checkOver = useCallback((clientX: number, clientY: number) => {
    if (!centerRef.current) return false;
    const r = centerRef.current.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    setOverCenter(checkOver(clientX, clientY));
  }, [dragging, checkOver]);

  const handleDrop = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return;
    if (checkOver(clientX, clientY)) {
      // Animate
      setFlash(dragging);
      setPulse(true);
      onToggle(dragging);
      setTimeout(() => setPulse(false), 700);
      setTimeout(() => setFlash(null), 600);
    }
    setDragging(null);
    setOverCenter(false);
  }, [dragging, checkOver, onToggle]);

  return (
    <div
      style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}
      onMouseMove={e => handleMove(e.clientX, e.clientY)}
      onMouseUp={e => handleDrop(e.clientX, e.clientY)}
      onTouchMove={e => { e.preventDefault(); const t=e.touches[0]; handleMove(t.clientX, t.clientY); }}
      onTouchEnd={e => { const t=e.changedTouches[0]; handleDrop(t.clientX, t.clientY); }}
    >
      {/* Ambient glow */}
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 42%, rgba(${hexToRgb(obj.color)},.07) 0%, transparent 62%)`, pointerEvents:'none', zIndex:0 }}/>

      {/* ── Top zone: not-done pills ─────────────────────────── */}
      <div style={{ padding:'22px 28px 14px', zIndex:2, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:'.68rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:1.2, fontFamily:'Syne,sans-serif', fontWeight:700 }}>
            Components · drag into objective to complete
          </span>
          <button onClick={onAddComp} style={{ background:`rgba(${hexToRgb(obj.color)},.18)`, border:`1px solid rgba(${hexToRgb(obj.color)},.4)`, borderRadius:8, color:obj.color, fontFamily:'DM Sans,sans-serif', fontSize:'.72rem', fontWeight:700, padding:'5px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all .18s' }}
            onMouseEnter={e=>e.currentTarget.style.background=`rgba(${hexToRgb(obj.color)},.3)`}
            onMouseLeave={e=>e.currentTarget.style.background=`rgba(${hexToRgb(obj.color)},.18)`}>
            <i className="fa-solid fa-plus" style={{fontSize:'.6rem'}}/> Add Component
          </button>
        </div>

        {notDone.length === 0 && (
          <div style={{ fontSize:'.76rem', color:'var(--muted)', fontStyle:'italic', padding:'4px 0' }}>
            {total === 0 ? 'No components yet — add one above.' : '🎉 All components completed!'}
          </div>
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {notDone.map(comp => (
            <Pill
              key={comp.id}
              comp={comp}
              color={obj.color}
              color2={obj.color2}
              isDragging={dragging === comp.id}
              isFlashing={flash === comp.id}
              stepPct={stepPct}
              onDragStart={() => setDragging(comp.id)}
              onEdit={() => onEditComp(comp.id)}
              onDelete={() => onDeleteComp(comp.id)}
              onColorChange={(bg) => onUpdateComp(comp.id, { bgColor: bg } as any)}
            />
          ))}
        </div>
      </div>

      {/* ── Center card ─────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, position:'relative', paddingBottom:24 }}>
        <div ref={centerRef} style={{
          width: 300,
          borderRadius: 24,
          border: `2px solid ${overCenter ? '#fff' : obj.color}`,
          background: `linear-gradient(145deg,rgba(${hexToRgb(obj.color)},.16),rgba(${hexToRgb(obj.color2)},.09))`,
          backdropFilter: 'blur(22px)',
          boxShadow: pulse
            ? `0 0 0 8px rgba(${hexToRgb(obj.color)},.25), 0 0 80px rgba(${hexToRgb(obj.color)},.6)`
            : overCenter
            ? `0 0 0 4px ${obj.color}, 0 0 50px rgba(${hexToRgb(obj.color)},.5)`
            : `0 0 44px rgba(${hexToRgb(obj.color)},.28), inset 0 1px 0 rgba(255,255,255,.07)`,
          transition: 'box-shadow .3s, border-color .25s',
          position: 'relative', overflow: 'hidden',
        }}>

          {/* Pulse ring animation */}
          {pulse && (
            <div style={{ position:'absolute', inset:-2, borderRadius:26, border:`2px solid ${obj.color}`, animation:'objPulse .7s ease-out', pointerEvents:'none', zIndex:20 }}/>
          )}

          {/* Shimmer on hover */}
          {overCenter && (
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)', animation:'shimmer .9s linear infinite', pointerEvents:'none', zIndex:10 }}/>
          )}

          {/* Card header */}
          <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:'1.08rem', lineHeight:1.2, background:`linear-gradient(135deg,${obj.color},${obj.color2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:3 }}>
                  {obj.title}
                </div>
                {obj.description && (
                  <div style={{ fontSize:'.7rem', color:'var(--muted)', lineHeight:1.5 }}>{obj.description}</div>
                )}
              </div>
              <ObjMenu onEdit={onEditObj} onDelete={onDeleteObj} color={obj.color}/>
            </div>

            {/* Progress */}
            <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
              <ProgressRing pct={pct} color={obj.color} color2={obj.color2} size={46}/>
              <div>
                <div style={{ fontSize:'.82rem', fontWeight:700 }}>{pct}% complete</div>
                <div style={{ fontSize:'.65rem', color:'var(--muted)' }}>{done.length}/{total} · {stepPct}% per component</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop:10, height:5, background:'rgba(255,255,255,.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${obj.color},${obj.color2})`, borderRadius:3, transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
            </div>
          </div>

          {/* Done components — crossed-out draggable list */}
          <div style={{ padding:'12px 14px 16px', maxHeight:220, overflowY:'auto' }}>
            {done.length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', fontSize:'.72rem', color:'var(--muted)', fontStyle:'italic' }}>
                Drop components here to complete them
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {done.map(comp => (
                  <DoneItem
                    key={comp.id}
                    comp={comp}
                    color={obj.color}
                    isDragging={dragging === comp.id}
                    onDragStart={() => setDragging(comp.id)}
                    onDrop={(clientX, clientY) => {
                      // If dropped back outside center → un-complete
                      if (!checkOver(clientX, clientY)) {
                        onToggle(comp.id);
                      }
                      setDragging(null);
                      setOverCenter(false);
                    }}
                    onEdit={() => onEditComp(comp.id)}
                    onDelete={() => onDeleteComp(comp.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag instruction */}
      {notDone.length > 0 && !dragging && (
        <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:'.65rem', color:'var(--muted)', whiteSpace:'nowrap', background:'rgba(11,11,19,.7)', padding:'4px 14px', borderRadius:20, backdropFilter:'blur(8px)', pointerEvents:'none', zIndex:5 }}>
          Drag a pill onto the card · drag it back out to undo
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pill — not-done draggable component
// ─────────────────────────────────────────────────────────────────────
function Pill({ comp, color, color2, isDragging, isFlashing, stepPct, onDragStart, onEdit, onDelete, onColorChange }: {
  comp: ObjComponent; color:string; color2:string;
  isDragging:boolean; isFlashing:boolean; stepPct:number;
  onDragStart:()=>void; onEdit:()=>void; onDelete:()=>void; onColorChange:(bg:string)=>void;
}) {
  const [hov, setHov] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const bgColor = (comp as any).bgColor || 'rgba(255,255,255,.07)';

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,[data-nondrag]')) return;
    e.preventDefault();
    onDragStart();
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button,[data-nondrag]')) return;
    onDragStart();
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setColorOpen(false); }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 14px',
        borderRadius: 50,
        border: isDragging ? `2px solid ${color}` : `1.5px solid ${hov ? `rgba(${hexToRgb(color)},.55)` : 'rgba(255,255,255,.13)'}`,
        background: isDragging ? `rgba(${hexToRgb(color)},.28)` : bgColor,
        backdropFilter: 'blur(10px)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: isDragging
          ? `0 8px 32px rgba(${hexToRgb(color)},.5), 0 0 0 2px ${color}`
          : isFlashing
          ? `0 0 0 6px rgba(${hexToRgb(color)},.4)`
          : hov ? `0 4px 16px rgba(${hexToRgb(color)},.22)` : 'none',
        transform: isDragging ? 'scale(1.08) rotate(-2deg)' : isFlashing ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'all .22s cubic-bezier(.34,1.56,.64,1)',
        animation: isFlashing ? 'pillFlash .5s ease-out' : isDragging ? 'none' : 'floatNode 3.5s ease-in-out infinite',
        animationDelay: isDragging ? '0s' : `${((comp.text.length * 7) % 20) * 0.1}s`,
        zIndex: isDragging ? 100 : 1,
        maxWidth: 200,
      }}
    >
      {/* colour dot */}
      <div data-nondrag="1" onClick={() => setColorOpen(v=>!v)}
        style={{ width:10, height:10, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color2})`, flexShrink:0, cursor:'pointer', transition:'transform .15s' }}
        title="Change colour"/>

      <span style={{ fontSize:'.78rem', fontWeight:600, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
        {comp.text}
      </span>

      <span style={{ fontSize:'.6rem', color:`rgba(${hexToRgb(color)},1)`, fontWeight:700, flexShrink:0 }}>+{stepPct}%</span>

      {hov && !isDragging && (
        <div data-nondrag="1" style={{ display:'flex', gap:3, animation:'fadeIn .1s' }}>
          <PillBtn color="rgba(255,255,255,.15)" title="Edit" onClick={onEdit}><i className="fa-solid fa-pen" style={{fontSize:'.5rem'}}/></PillBtn>
          <PillBtn color="rgba(239,68,68,.3)" title="Delete" onClick={onDelete}><i className="fa-solid fa-trash" style={{fontSize:'.5rem'}}/></PillBtn>
        </div>
      )}

      {/* Colour picker popover */}
      {colorOpen && (
        <div data-nondrag="1" onClick={e=>e.stopPropagation()}
          style={{ position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:200, background:'rgba(16,16,26,.98)', border:'1px solid var(--border)', borderRadius:12, padding:8, boxShadow:'0 16px 48px rgba(0,0,0,.6)', display:'flex', flexWrap:'wrap', gap:5, width:136, animation:'menuIn .14s ease' }}>
          {PILL_COLORS.map((c,i) => (
            <div key={i} onClick={() => { onColorChange(c); setColorOpen(false); }}
              style={{ width:22, height:22, borderRadius:6, background:c, border:`2px solid ${c===bgColor?'#fff':'transparent'}`, cursor:'pointer', transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.18)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Done item inside center card — draggable back out
// ─────────────────────────────────────────────────────────────────────
function DoneItem({ comp, color, isDragging, onDragStart, onDrop, onEdit, onDelete }: {
  comp: ObjComponent; color:string; isDragging:boolean;
  onDragStart:()=>void;
  onDrop:(clientX:number,clientY:number)=>void;
  onEdit:()=>void; onDelete:()=>void;
}) {
  const [hov, setHov] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault(); onDragStart();
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onDragStart();
  };
  const handleMouseUp = (e: React.MouseEvent) => onDrop(e.clientX, e.clientY);
  const handleTouchEnd = (e: React.TouchEvent) => { const t=e.changedTouches[0]; onDrop(t.clientX, t.clientY); };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'6px 10px', borderRadius:10,
        background: hov ? 'rgba(255,255,255,.05)' : 'transparent',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition:'background .15s',
        userSelect:'none',
        opacity: isDragging ? 0.4 : 1,
      }}>
      <i className="fa-solid fa-check" style={{ fontSize:'.58rem', color, flexShrink:0 }}/>
      <span style={{ fontSize:'.74rem', flex:1, color:'var(--muted)', textDecoration:'line-through', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {comp.text}
      </span>
      {hov && (
        <div style={{ display:'flex', gap:4, animation:'fadeIn .1s' }}>
          <PillBtn color="rgba(255,255,255,.12)" title="Edit" onClick={onEdit}><i className="fa-solid fa-pen" style={{fontSize:'.48rem'}}/></PillBtn>
          <PillBtn color="rgba(239,68,68,.25)" title="Remove" onClick={onDelete}><i className="fa-solid fa-trash" style={{fontSize:'.48rem'}}/></PillBtn>
        </div>
      )}
      {hov && !isDragging && (
        <span style={{ fontSize:'.56rem', color:'var(--muted)', whiteSpace:'nowrap', marginLeft:2 }}>drag out to undo</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Objective menu (edit/delete)
// ─────────────────────────────────────────────────────────────────────
function ObjMenu({ onEdit, onDelete, color }: { onEdit:()=>void; onDelete:()=>void; color:string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <button onClick={() => setOpen(v=>!v)} style={iconBtn}><i className="fa-solid fa-ellipsis"/></button>
      {open && (
        <div onClick={()=>setOpen(false)} style={{ position:'absolute', right:0, top:'calc(100%+6px)', background:'rgba(14,14,22,.98)', border:'1px solid var(--border)', borderRadius:12, padding:4, minWidth:148, zIndex:50, boxShadow:'0 16px 48px rgba(0,0,0,.65)', animation:'menuIn .15s ease', marginTop:6 }}>
          <MI icon="fa-pen"   label="Edit Objective" onClick={onEdit}/>
          <MI icon="fa-trash" label="Delete"          danger onClick={onDelete}/>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Progress ring SVG
// ─────────────────────────────────────────────────────────────────────
function ProgressRing({ pct, color, color2, size }: { pct:number; color:string; color2:string; size:number }) {
  const r = (size-6)/2, circ = 2*Math.PI*r;
  const id = `rg${color.slice(1,5)}`;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color}/><stop offset="100%" stopColor={color2}/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${pct/100*circ} ${circ-pct/100*circ}`}
        strokeDashoffset={circ*0.25}
        style={{ transition:'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)' }}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontWeight={700} fill="var(--text)" fontFamily="DM Sans,sans-serif">{pct}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }:{ onAdd:()=>void }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, color:'var(--muted)' }}>
      <div style={{ fontSize:'2.6rem', opacity:.18 }}>◎</div>
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
  const submit = () => { if(!title.trim()) return; const [c1,c2]=ACCENT_PAIRS[pi]; onCreate(title.trim(),desc.trim(),c1,c2); };
  return (
    <Overlay onClose={onClose}><MBox title="New Objective" onClose={onClose}>
      <MLbl>Title</MLbl><MIn value={title} set={setTitle} ph="e.g. Launch product v2" af onEnt={submit}/>
      <MLbl>Description (optional)</MLbl><MIn value={desc} set={setDesc} ph="What does success look like?"/>
      <MLbl>Color</MLbl>
      <PalPicker pi={pi} setPi={setPi}/>
      <Row><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={submit} c={ACCENT_PAIRS[pi][0]}>Create</PBtn></Row>
    </MBox></Overlay>
  );
}

function AddCompModal({ onClose, onCreate }:{ onClose:()=>void; onCreate:(t:string)=>void }) {
  const [text,setText]=useState('');
  return (
    <Overlay onClose={onClose}><MBox title="Add Component" onClose={onClose}>
      <MLbl>Component name</MLbl><MIn value={text} set={setText} ph="e.g. Design mockups, Write tests…" af onEnt={()=>text.trim()&&onCreate(text.trim())}/>
      <Row><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>text.trim()&&onCreate(text.trim())}>Add</PBtn></Row>
    </MBox></Overlay>
  );
}

function EditCompModal({ comp, onClose, onSave }:{ comp:ObjComponent; onClose:()=>void; onSave:(p:Partial<ObjComponent>)=>void }) {
  const [text,setText]=useState(comp.text); const [notes,setNotes]=useState(comp.notes||'');
  return (
    <Overlay onClose={onClose}><MBox title="Edit Component" onClose={onClose}>
      <MLbl>Name</MLbl><MIn value={text} set={setText} af onEnt={()=>onSave({text:text.trim(),notes})}/>
      <MLbl>Notes</MLbl>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes…"
        style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.83rem',padding:'8px 10px',outline:'none',resize:'vertical',minHeight:68,marginBottom:14,boxSizing:'border-box'}}/>
      <Row><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>onSave({text:text.trim(),notes})}>Save</PBtn></Row>
    </MBox></Overlay>
  );
}

function EditObjModal({ obj, onClose, onSave }:{ obj:Objective; onClose:()=>void; onSave:(p:Partial<Objective>)=>void }) {
  const [title,setTitle]=useState(obj.title); const [desc,setDesc]=useState(obj.description);
  const [pi,setPi]=useState(()=>Math.max(0,ACCENT_PAIRS.findIndex(([c])=>c===obj.color)));
  return (
    <Overlay onClose={onClose}><MBox title="Edit Objective" onClose={onClose}>
      <MLbl>Title</MLbl><MIn value={title} set={setTitle} af/>
      <MLbl>Description</MLbl><MIn value={desc} set={setDesc}/>
      <MLbl>Color</MLbl>
      <PalPicker pi={pi} setPi={setPi}/>
      <Row><GBtn onClick={onClose}>Cancel</GBtn><PBtn onClick={()=>onSave({title:title.trim(),description:desc,color:ACCENT_PAIRS[pi][0],color2:ACCENT_PAIRS[pi][1]})} c={ACCENT_PAIRS[pi][0]}>Save</PBtn></Row>
    </MBox></Overlay>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────
function Overlay({ children,onClose }:{ children:React.ReactNode; onClose:()=>void }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.62)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}
function MBox({ title,children,onClose }:{ title:string;children:React.ReactNode;onClose:()=>void }) {
  return (
    <div style={{background:'rgba(16,16,26,.98)',border:'1px solid var(--border)',borderRadius:18,padding:'22px 24px',minWidth:340,maxWidth:420,boxShadow:'0 32px 80px rgba(0,0,0,.7)',animation:'modalIn .22s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'.92rem'}}>{title}</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:'.9rem'}}>✕</button>
      </div>{children}
    </div>
  );
}
function MLbl({ children }:{ children:React.ReactNode }) {
  return <div style={{fontSize:'.69rem',color:'var(--muted)',marginBottom:5,textTransform:'uppercase',letterSpacing:.9}}>{children}</div>;
}
function MIn({ value,set,ph,af,onEnt }:{ value:string;set:(v:string)=>void;ph?:string;af?:boolean;onEnt?:()=>void }) {
  return <input value={value} onChange={e=>set(e.target.value)} placeholder={ph} autoFocus={af} onKeyDown={e=>e.key==='Enter'&&onEnt?.()} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.85rem',padding:'9px 12px',outline:'none',marginBottom:14,boxSizing:'border-box'}}/>;
}
function PalPicker({ pi,setPi }:{ pi:number;setPi:(i:number)=>void }) {
  return (
    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
      {ACCENT_PAIRS.map(([c1,c2],i)=>(
        <div key={i} onClick={()=>setPi(i)} style={{width:28,height:28,borderRadius:7,cursor:'pointer',background:`linear-gradient(135deg,${c1},${c2})`,border:`2px solid ${i===pi?'#fff':'transparent'}`,transition:'all .18s',transform:i===pi?'scale(1.2)':'scale(1)'}}/>
      ))}
    </div>
  );
}
function Row({ children }:{ children:React.ReactNode }) {
  return <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>{children}</div>;
}
function GBtn({ children,onClick }:{ children:React.ReactNode;onClick:()=>void }) {
  return <button onClick={onClick} style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}>{children}</button>;
}
function PBtn({ children,onClick,c='var(--accent)' }:{ children:React.ReactNode;onClick:()=>void;c?:string }) {
  return <button onClick={onClick} style={{background:c,border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',fontWeight:600,padding:'8px 18px',borderRadius:8,cursor:'pointer'}}>{children}</button>;
}
function PillBtn({ children,onClick,color,title }:{ children:React.ReactNode;onClick:()=>void;color:string;title?:string }) {
  return <button title={title} onClick={e=>{e.stopPropagation();onClick();}} style={{background:color,border:'none',borderRadius:5,width:20,height:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0}}>{children}</button>;
}
function MI({ icon,label,danger,onClick }:{ icon:string;label:string;danger?:boolean;onClick:()=>void }) {
  return <div onClick={onClick} className="menu-item-hover" style={{padding:'8px 12px',borderRadius:7,fontSize:'.76rem',cursor:'pointer',display:'flex',alignItems:'center',gap:8,color:danger?'#ff6b6b':'var(--text)'}}><i className={`fa-solid ${icon}`} style={{width:12}}/>{label}</div>;
}

const iconBtn: React.CSSProperties = {
  background:'none',border:'1px solid var(--border)',borderRadius:7,color:'var(--muted)',
  width:26,height:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',
};
