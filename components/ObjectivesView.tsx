'use client';
import { useState, useEffect, useRef } from 'react';
import { Objective, ObjComponent } from '@/lib/types';
import { useObjectivesStore } from '@/lib/store';
import { PAL, uid } from '@/lib/utils';

const ACCENT_PAIRS = [
  ['#6f5fff','#ff5fa0'], ['#00c6ff','#7b2ff7'], ['#00d26a','#38f9d7'],
  ['#f7971e','#ffd200'], ['#f953c6','#b91d73'], ['#4facfe','#00f2fe'],
  ['#fa709a','#fee140'], ['#11998e','#38ef7d'], ['#667eea','#764ba2'],
  ['#fc4a1a','#f7b733'], ['#4e54c8','#8f94fb'], ['#ff6b6b','#ffa07a'],
];

export default function ObjectivesView() {
  const store = useObjectivesStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addObjOpen, setAddObjOpen] = useState(false);
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [editObjId, setEditObjId] = useState<string | null>(null);
  const [editCompId, setEditCompId] = useState<string | null>(null);
  const [hovComp, setHovComp] = useState<string | null>(null);

  const selected = store.objectives.find(o => o.id === selectedId) ?? null;

  // Auto-select first objective
  useEffect(() => {
    if (store.hydrated && !selectedId && store.objectives.length > 0)
      setSelectedId(store.objectives[0].id);
  }, [store.hydrated, store.objectives.length]);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, minHeight: 0 }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0,
        background: 'rgba(11,11,19,.72)', borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(18px)', borderRadius: '0 0 0 var(--radius)',
      }}>
        <div style={{ padding: '16px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '.82rem', letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--muted)' }}>
            Objectives
          </span>
          <button onClick={() => setAddObjOpen(true)} style={addBtn}>
            <i className="fa-solid fa-plus" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {store.objectives.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.74rem', padding: '20px 10px', lineHeight: 1.6 }}>
              No objectives yet.<br />Create one to get started.
            </div>
          )}
          {store.objectives.map(obj => {
            const pct = obj.components.length === 0 ? 0
              : Math.round(obj.components.filter(c => c.done).length / obj.components.length * 100);
            const isActive = selectedId === obj.id;
            return (
              <div key={obj.id} onClick={() => setSelectedId(obj.id)}
                style={{
                  position: 'relative', overflow: 'hidden', borderRadius: 11,
                  marginBottom: 5, padding: '10px 12px', cursor: 'pointer',
                  border: `1px solid ${isActive ? obj.color : 'var(--border)'}`,
                  background: isActive ? `rgba(${hexToRgb(obj.color)},.12)` : 'rgba(255,255,255,.03)',
                  transition: 'all .2s',
                  boxShadow: isActive ? `0 0 16px rgba(${hexToRgb(obj.color)},.25)` : 'none',
                }}
              >
                {/* Progress fill behind */}
                <div style={{
                  position: 'absolute', inset: 0, width: `${pct}%`,
                  background: `linear-gradient(90deg,rgba(${hexToRgb(obj.color)},.18),rgba(${hexToRgb(obj.color2)},.08))`,
                  transition: 'width .6s cubic-bezier(.4,0,.2,1)', pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{obj.title}</span>
                    <span style={{ fontSize: '.65rem', color: 'var(--muted)', flexShrink: 0, marginLeft: 6 }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>
                    {obj.components.length} component{obj.components.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main canvas ──────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {!selected ? (
          <EmptyState onAdd={() => setAddObjOpen(true)} />
        ) : (
          <BrainstormCanvas
            objective={selected}
            hovComp={hovComp}
            setHovComp={setHovComp}
            onToggleComp={(cid) => store.updateComponent(selected.id, cid, { done: !selected.components.find(c=>c.id===cid)?.done })}
            onEditComp={(cid) => setEditCompId(cid)}
            onDeleteComp={(cid) => store.deleteComponent(selected.id, cid)}
            onAddComp={() => setAddCompOpen(true)}
            onEditObj={() => setEditObjId(selected.id)}
            onDeleteObj={() => { store.deleteObjective(selected.id); setSelectedId(store.objectives.find(o=>o.id!==selected.id)?.id ?? null); }}
          />
        )}
      </main>

      {/* ── Modals ───────────────────────────────────────────── */}
      {addObjOpen && (
        <AddObjectiveModal
          onClose={() => setAddObjOpen(false)}
          onCreate={(title, desc, c1, c2) => {
            const id = store.addObjective(title, desc, c1, c2);
            setSelectedId(id);
            setAddObjOpen(false);
          }}
        />
      )}

      {addCompOpen && selected && (
        <AddComponentModal
          onClose={() => setAddCompOpen(false)}
          onCreate={(text) => { store.addComponent(selected.id, text); setAddCompOpen(false); }}
        />
      )}

      {editCompId && selected && (() => {
        const comp = selected.components.find(c => c.id === editCompId);
        if (!comp) return null;
        return (
          <EditComponentModal
            comp={comp}
            onClose={() => setEditCompId(null)}
            onSave={(patch) => { store.updateComponent(selected.id, editCompId, patch); setEditCompId(null); }}
          />
        );
      })()}

      {editObjId && (() => {
        const obj = store.objectives.find(o => o.id === editObjId);
        if (!obj) return null;
        return (
          <EditObjectiveModal
            obj={obj}
            onClose={() => setEditObjId(null)}
            onSave={(patch) => { store.updateObjective(editObjId, patch); setEditObjId(null); }}
          />
        );
      })()}
    </div>
  );
}

// ── Brainstorm Canvas ────────────────────────────────────────────────
function BrainstormCanvas({ objective: obj, hovComp, setHovComp, onToggleComp, onEditComp, onDeleteComp, onAddComp, onEditObj, onDeleteObj }: {
  objective: Objective;
  hovComp: string | null;
  setHovComp: (id: string | null) => void;
  onToggleComp: (id: string) => void;
  onEditComp: (id: string) => void;
  onDeleteComp: (id: string) => void;
  onAddComp: () => void;
  onEditObj: () => void;
  onDeleteObj: () => void;
}) {
  const done = obj.components.filter(c => c.done);
  const notDone = obj.components.filter(c => !c.done);
  const pct = obj.components.length === 0 ? 0
    : Math.round(done.length / obj.components.length * 100);

  // Position not-done components in a ring around the cloud
  const ringPositions = computeRing(notDone.length);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(${hexToRgb(obj.color)},.07) 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* SVG lines from cloud to each not-done component */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {ringPositions.map((pos, i) => (
          <line key={notDone[i]?.id}
            x1="50%" y1="50%"
            x2={`calc(50% + ${pos.x}px)`} y2={`calc(50% + ${pos.y}px)`}
            stroke={`rgba(${hexToRgb(obj.color)},.25)`} strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        ))}
      </svg>

      {/* Not-done components in ring */}
      {notDone.map((comp, i) => {
        const pos = ringPositions[i];
        if (!pos) return null;
        return (
          <ComponentNode key={comp.id} comp={comp} x={pos.x} y={pos.y}
            color={obj.color} color2={obj.color2} hovered={hovComp === comp.id}
            onHover={(h) => setHovComp(h ? comp.id : null)}
            onToggle={() => onToggleComp(comp.id)}
            onEdit={() => onEditComp(comp.id)}
            onDelete={() => onDeleteComp(comp.id)}
          />
        );
      })}

      {/* Center cloud — the objective brain */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <CloudShape color={obj.color} color2={obj.color2} pct={pct} title={obj.title}
          doneComponents={done} onEditObj={onEditObj} onDeleteObj={onDeleteObj}
          onAddComp={onAddComp}
        />
      </div>
    </div>
  );
}

// ── Cloud / Brain shape ──────────────────────────────────────────────
function CloudShape({ color, color2, pct, title, doneComponents, onEditObj, onDeleteObj, onAddComp }: {
  color: string; color2: string; pct: number; title: string;
  doneComponents: ObjComponent[];
  onEditObj: () => void; onDeleteObj: () => void; onAddComp: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: 'relative', width: 220, height: 180 }}>
      {/* Cloud SVG background */}
      <svg viewBox="0 0 220 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `drop-shadow(0 0 24px rgba(${hexToRgb(color)},.45))` }}>
        <defs>
          <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color2} stopOpacity="0.85" />
          </linearGradient>
          <clipPath id="cloudClip">
            <path d={CLOUD_PATH} />
          </clipPath>
        </defs>
        {/* Cloud fill */}
        <path d={CLOUD_PATH} fill="rgba(11,11,19,.82)" stroke={`url(#cg)`} strokeWidth="2.5" />
        {/* Progress fill — slides in from left */}
        <rect x="0" y="0" width={`${pct * 2.2}`} height="180" fill={`url(#cg)`} opacity="0.22" clipPath="url(#cloudClip)" style={{ transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>

      {/* Content inside cloud */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '24px 20px 20px' }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '.88rem', textAlign: 'center', lineHeight: 1.3, background: `linear-gradient(135deg,${color},${color2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {title}
        </div>
        <div style={{ fontSize: '.62rem', color: 'var(--muted)' }}>
          {pct}% complete · {doneComponents.length} done
        </div>

        {/* Done components as small pills inside cloud */}
        {doneComponents.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginTop: 2, maxWidth: 160 }}>
            {doneComponents.slice(0, 5).map(c => (
              <span key={c.id} style={{ fontSize: '.55rem', padding: '1px 6px', borderRadius: 20, background: `rgba(${hexToRgb(color)},.25)`, color: 'var(--text)', border: `1px solid rgba(${hexToRgb(color)},.4)`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 70 }}>✓ {c.text}</span>
            ))}
            {doneComponents.length > 5 && <span style={{ fontSize: '.55rem', color: 'var(--muted)' }}>+{doneComponents.length - 5}</span>}
          </div>
        )}
      </div>

      {/* Action buttons below cloud */}
      <div style={{ position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
        <button onClick={onAddComp} style={cloudBtn(`rgba(${hexToRgb(color)},.8)`)}>
          <i className="fa-solid fa-plus" style={{ fontSize: '.6rem' }} /> Add Component
        </button>
        <button onClick={() => setMenuOpen(v => !v)} style={cloudBtn('rgba(255,255,255,.12)')}>
          <i className="fa-solid fa-ellipsis" style={{ fontSize: '.6rem' }} />
        </button>
      </div>

      {menuOpen && (
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,18,28,.98)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, minWidth: 140, zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
          <MI icon="fa-pen" label="Edit Objective" onClick={() => { setMenuOpen(false); onEditObj(); }} />
          <MI icon="fa-trash" label="Delete" danger onClick={() => { setMenuOpen(false); onDeleteObj(); }} />
        </div>
      )}
    </div>
  );
}

// ── Component node (not-done, floating in ring) ──────────────────────
function ComponentNode({ comp, x, y, color, color2, hovered, onHover, onToggle, onEdit, onDelete }: {
  comp: ObjComponent; x: number; y: number; color: string; color2: string;
  hovered: boolean;
  onHover: (h: boolean) => void; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        animation: 'floatNode 3s ease-in-out infinite',
        animationDelay: `${(Math.abs(x + y) % 20) * 0.1}s`,
      }}
    >
      <div style={{
        background: hovered ? `rgba(${hexToRgb(color)},.18)` : 'rgba(11,11,19,.88)',
        border: `2px solid ${hovered ? color : 'rgba(255,255,255,.15)'}`,
        borderRadius: '50%',
        width: 110, height: 80,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: '8px 12px', cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        boxShadow: hovered ? `0 0 20px rgba(${hexToRgb(color)},.35)` : '0 4px 20px rgba(0,0,0,.4)',
        transition: 'all .25s',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '.72rem', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {comp.text}
        </div>
        {hovered && (
          <div style={{ display: 'flex', gap: 5, animation: 'fadeIn .15s' }}>
            <NBtn title="Mark done" onClick={onToggle} color={color}><i className="fa-solid fa-check" /></NBtn>
            <NBtn title="Edit" onClick={onEdit} color="rgba(255,255,255,.3)"><i className="fa-solid fa-pen" /></NBtn>
            <NBtn title="Delete" onClick={onDelete} color="#ff4d4d"><i className="fa-solid fa-trash" /></NBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function NBtn({ children, onClick, color, title }: { children: React.ReactNode; onClick: () => void; color: string; title?: string }) {
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick(); }} style={{ background: color, border: 'none', borderRadius: 5, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', color: '#fff' }}>
      {children}
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--muted)' }}>
      <div style={{ fontSize: '3rem', opacity: .2 }}>☁</div>
      <div style={{ fontSize: '.9rem', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>No objective selected</div>
      <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Create an objective to start mapping its components</div>
      <button onClick={onAdd} style={{ marginTop: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: '.8rem', padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: '0 0 20px rgba(111,95,255,.4)' }}>
        <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />New Objective
      </button>
    </div>
  );
}

// ── Add Objective Modal ──────────────────────────────────────────────
function AddObjectiveModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, desc: string, c1: string, c2: string) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [palIdx, setPalIdx] = useState(0);

  const submit = () => {
    if (!title.trim()) return;
    const [c1, c2] = ACCENT_PAIRS[palIdx];
    onCreate(title.trim(), desc.trim(), c1, c2);
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="New Objective" onClose={onClose}>
        <MLbl>Title</MLbl>
        <MInput value={title} onChange={setTitle} placeholder="e.g. Launch product v2" autoFocus onEnter={submit} />
        <MLbl>Description (optional)</MLbl>
        <MInput value={desc} onChange={setDesc} placeholder="What does completing this mean?" />
        <MLbl>Color</MLbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {ACCENT_PAIRS.map(([c1, c2], i) => (
            <div key={i} onClick={() => setPalIdx(i)} style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', background: `linear-gradient(135deg,${c1},${c2})`, border: `2px solid ${i === palIdx ? '#fff' : 'transparent'}`, transition: 'all .18s', transform: i === palIdx ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <GhostMBtn onClick={onClose}>Cancel</GhostMBtn>
          <PrimaryMBtn onClick={submit} color={ACCENT_PAIRS[palIdx][0]}>Create</PrimaryMBtn>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Add Component Modal ──────────────────────────────────────────────
function AddComponentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Add Component" onClose={onClose}>
        <MLbl>Component name</MLbl>
        <MInput value={text} onChange={setText} placeholder="e.g. Design mockups, Write tests…" autoFocus onEnter={() => text.trim() && onCreate(text.trim())} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <GhostMBtn onClick={onClose}>Cancel</GhostMBtn>
          <PrimaryMBtn onClick={() => text.trim() && onCreate(text.trim())}>Add</PrimaryMBtn>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Edit Component Modal ─────────────────────────────────────────────
function EditComponentModal({ comp, onClose, onSave }: { comp: ObjComponent; onClose: () => void; onSave: (patch: Partial<ObjComponent>) => void }) {
  const [text, setText] = useState(comp.text);
  const [notes, setNotes] = useState(comp.notes);
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Edit Component" onClose={onClose}>
        <MLbl>Name</MLbl>
        <MInput value={text} onChange={setText} autoFocus onEnter={() => onSave({ text: text.trim(), notes })} />
        <MLbl>Notes</MLbl>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '.83rem', padding: '8px 10px', outline: 'none', resize: 'vertical', minHeight: 72, marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <GhostMBtn onClick={onClose}>Cancel</GhostMBtn>
          <PrimaryMBtn onClick={() => onSave({ text: text.trim(), notes })}>Save</PrimaryMBtn>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Edit Objective Modal ─────────────────────────────────────────────
function EditObjectiveModal({ obj, onClose, onSave }: { obj: Objective; onClose: () => void; onSave: (patch: Partial<Objective>) => void }) {
  const [title, setTitle] = useState(obj.title);
  const [desc, setDesc] = useState(obj.description);
  const [palIdx, setPalIdx] = useState(() => ACCENT_PAIRS.findIndex(([c]) => c === obj.color) ?? 0);
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="Edit Objective" onClose={onClose}>
        <MLbl>Title</MLbl>
        <MInput value={title} onChange={setTitle} autoFocus onEnter={() => onSave({ title: title.trim(), description: desc, color: ACCENT_PAIRS[Math.max(0,palIdx)][0], color2: ACCENT_PAIRS[Math.max(0,palIdx)][1] })} />
        <MLbl>Description</MLbl>
        <MInput value={desc} onChange={setDesc} />
        <MLbl>Color</MLbl>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {ACCENT_PAIRS.map(([c1, c2], i) => (
            <div key={i} onClick={() => setPalIdx(i)} style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', background: `linear-gradient(135deg,${c1},${c2})`, border: `2px solid ${i === palIdx ? '#fff' : 'transparent'}`, transition: 'all .18s', transform: i === palIdx ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <GhostMBtn onClick={onClose}>Cancel</GhostMBtn>
          <PrimaryMBtn onClick={() => onSave({ title: title.trim(), description: desc, color: ACCENT_PAIRS[Math.max(0,palIdx)][0], color2: ACCENT_PAIRS[Math.max(0,palIdx)][1] })}>Save</PrimaryMBtn>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Shared modal primitives ──────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalBox({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ background: 'rgba(18,18,28,.98)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', minWidth: 340, maxWidth: 420, boxShadow: '0 30px 80px rgba(0,0,0,.7)', animation: 'modalIn .22s cubic-bezier(.34,1.56,.64,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '.92rem' }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
      </div>
      {children}
    </div>
  );
}

function MLbl({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .8 }}>{children}</div>;
}

function MInput({ value, onChange, placeholder, autoFocus, onEnter }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; onEnter?: () => void }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'DM Sans,sans-serif', fontSize: '.85rem', padding: '9px 12px', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
  );
}

function GhostMBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif', fontSize: '.8rem', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>{children}</button>;
}

function PrimaryMBtn({ children, onClick, color = 'var(--accent)' }: { children: React.ReactNode; onClick: () => void; color?: string }) {
  return <button onClick={onClick} style={{ background: color, border: 'none', color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: '.8rem', fontWeight: 600, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>{children}</button>;
}

function MI({ icon, label, danger, onClick }: { icon: string; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: '8px 12px', borderRadius: 7, fontSize: '.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: danger ? '#ff6b6b' : 'var(--text)' }}
      className="menu-item-hover">
      <i className={`fa-solid ${icon}`} style={{ width: 12 }} />{label}
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// Place n nodes in a ring — vary radius so it looks organic, not mechanical
function computeRing(n: number): { x: number; y: number }[] {
  if (n === 0) return [];
  const positions: { x: number; y: number }[] = [];
  const baseR = Math.min(200, 140 + n * 14);
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start from top
    // Slightly jitter each node outward/inward for organic feel
    const jitter = ((i * 37 + 13) % 40) - 20;
    const r = baseR + jitter;
    positions.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return positions;
}

// Rough cloud SVG path (centered ~110,90 in 220x180 viewport)
const CLOUD_PATH = `
  M 60,110 
  Q 55,80 75,72 Q 78,50 100,52 Q 105,30 125,35 Q 140,20 158,38
  Q 178,35 182,58 Q 200,62 196,85 Q 210,95 202,112
  Q 198,130 178,128 Q 168,145 148,138 Q 138,152 118,145
  Q 100,158 85,145 Q 65,148 58,130 Q 48,120 60,110 Z
`;

const addBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: 7,
  color: 'var(--muted)', width: 26, height: 26, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem',
  transition: 'all .2s',
};

const cloudBtn = (bg: string): React.CSSProperties => ({
  background: bg, border: 'none', borderRadius: 8, color: '#fff',
  fontFamily: 'DM Sans,sans-serif', fontSize: '.68rem', fontWeight: 600,
  padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
  backdropFilter: 'blur(8px)',
});
