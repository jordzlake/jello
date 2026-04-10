"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Objective, ObjComponent } from "@/lib/types";
import { useObjectivesStore } from "@/lib/store";

const ACCENT_PAIRS = [
  ["#6f5fff", "#ff5fa0"],
  ["#00c6ff", "#7b2ff7"],
  ["#00d26a", "#38f9d7"],
  ["#f7971e", "#ffd200"],
  ["#f953c6", "#b91d73"],
  ["#4facfe", "#00f2fe"],
  ["#fa709a", "#fee140"],
  ["#11998e", "#38ef7d"],
  ["#667eea", "#764ba2"],
  ["#fc4a1a", "#f7b733"],
  ["#4e54c8", "#8f94fb"],
  ["#ff6b6b", "#ffa07a"],
];
const PILL_COLORS = [
  "rgba(111,95,255,.25)",
  "rgba(0,210,106,.22)",
  "rgba(255,95,160,.22)",
  "rgba(0,198,255,.22)",
  "rgba(249,115,22,.22)",
  "rgba(234,179,8,.22)",
  "rgba(168,85,247,.22)",
  "rgba(20,184,166,.22)",
  "rgba(239,68,68,.22)",
  "rgba(255,255,255,.09)",
  "rgba(255,255,255,.04)",
  "rgba(30,30,50,.8)",
];

function rgb(hex: string) {
  if (!hex || hex.length < 7) return "111,111,111";
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

// ── Image cache (localStorage base64) ────────────────────────────────
const IC_PREFIX = "jello_ic_";
function icKey(url: string) {
  let h = 0;
  for (let i = 0; i < url.length; i++)
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return IC_PREFIX + Math.abs(h).toString(36);
}
function getCachedImage(url: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(icKey(url));
  } catch {
    return null;
  }
}
async function cacheImage(url: string): Promise<string> {
  const cached = getCachedImage(url);
  if (cached) return cached;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => {
        const data = fr.result as string;
        try {
          // Evict oldest if over 30 entries
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(IC_PREFIX)) keys.push(k);
          }
          if (keys.length >= 30)
            keys.slice(0, 10).forEach((k) => localStorage.removeItem(k));
          localStorage.setItem(icKey(url), data);
        } catch {}
        resolve(data);
      };
      fr.onerror = () => resolve(url);
      fr.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}
export function resolveImage(url: string | null | undefined): string {
  if (!url) return "";
  return getCachedImage(url) ?? url;
}

// ─────────────────────────────────────────────────────────────────────
export default function ObjectivesView() {
  const store = useObjectivesStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addObjOpen, setAddObjOpen] = useState(false);
  const [editObjId, setEditObjId] = useState<string | null>(null);
  const [editCompId, setEditCompId] = useState<string | null>(null);
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false); // mobile sidebar toggle
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selected = store.objectives.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    if (store.hydrated && !selectedId && store.objectives.length > 0)
      setSelectedId(store.objectives[0].id);
  }, [store.hydrated, store.objectives.length]);

  const handleDeleteObj = (id: string) => {
    store.deleteObjective(id);
    setSelectedId(store.objectives.find((o) => o.id !== id)?.id ?? null);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Mobile sidebar overlay ─────────────────────────── */}
      {isMobile && sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 90,
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          width: isMobile ? 240 : 260,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "rgba(11,11,19,.88)",
          borderRight: "1px solid var(--border)",
          backdropFilter: "blur(18px)",
          // Mobile: slide in/out
          position: isMobile ? "fixed" : "relative",
          top: isMobile ? 0 : undefined,
          left: isMobile ? (sideOpen ? 0 : -260) : undefined,
          bottom: isMobile ? 0 : undefined,
          zIndex: isMobile ? 95 : 1,
          transition: "left .28s cubic-bezier(.4,0,.2,1)",
          height: isMobile ? "100%" : "100%",
        }}
      >
        <div
          style={{
            padding: "16px 14px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 800,
              fontSize: ".78rem",
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Objectives
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={() => setAddObjOpen(true)} style={iconBtn}>
              <i className="fa-solid fa-plus" />
            </button>
            {isMobile && (
              <button onClick={() => setSideOpen(false)} style={iconBtn}>
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
          {store.objectives.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: ".74rem",
                padding: "20px 10px",
                lineHeight: 1.7,
              }}
            >
              No objectives yet.
              <br />
              Create one to get started.
            </p>
          )}
          {store.objectives.map((obj) => {
            const total = obj.components.length;
            const doneN = obj.components.filter((c) => c.done).length;
            const pct = total === 0 ? 0 : Math.round((doneN / total) * 100);
            const active = selectedId === obj.id;
            return (
              <div
                key={obj.id}
                onClick={() => {
                  setSelectedId(obj.id);
                  if (isMobile) setSideOpen(false);
                }}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 12,
                  marginBottom: 6,
                  padding: "11px 13px",
                  cursor: "pointer",
                  border: `1px solid ${active ? obj.color : "var(--border)"}`,
                  background: active
                    ? `rgba(${rgb(obj.color)},.13)`
                    : "rgba(255,255,255,.025)",
                  transition: "all .22s",
                  boxShadow: active
                    ? `0 0 18px rgba(${rgb(obj.color)},.22)`
                    : "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg,rgba(${rgb(obj.color)},.22),rgba(${rgb(obj.color2)},.1))`,
                    transition: "width .7s cubic-bezier(.4,0,.2,1)",
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: ".82rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {obj.title}
                    </span>
                    <span
                      style={{
                        fontSize: ".64rem",
                        color: "var(--muted)",
                        marginLeft: 6,
                        flexShrink: 0,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div style={{ fontSize: ".68rem", color: "var(--muted)" }}>
                    {doneN}/{total} components
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <div
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--border)",
              background: "rgba(11,11,19,.7)",
              flexShrink: 0,
            }}
          >
            <button onClick={() => setSideOpen(true)} style={iconBtn}>
              <i className="fa-solid fa-bars" />
            </button>
            <span
              style={{
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: ".82rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {selected ? selected.title : "Objectives"}
            </span>
          </div>
        )}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {!selected ? (
            <EmptyState
              onAdd={() => {
                setAddObjOpen(true);
              }}
            />
          ) : (
            <MindMap
              key={selected.id}
              obj={selected}
              isMobile={isMobile}
              onToggle={(cid) =>
                store.updateComponent(selected.id, cid, {
                  done: !selected.components.find((c) => c.id === cid)?.done,
                })
              }
              onEditComp={(cid) => setEditCompId(cid)}
              onDeleteComp={(cid) => store.deleteComponent(selected.id, cid)}
              onUpdateComp={(cid, patch) =>
                store.updateComponent(selected.id, cid, patch)
              }
              onAddComp={() => setAddCompOpen(true)}
              onEditObj={() => setEditObjId(selected.id)}
              onDeleteObj={() => handleDeleteObj(selected.id)}
            />
          )}
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────── */}
      {addObjOpen && (
        <AddObjModal
          onClose={() => setAddObjOpen(false)}
          onCreate={(title, desc, c1, c2) => {
            const id = store.addObjective(title, desc, c1, c2);
            setSelectedId(id);
            setAddObjOpen(false);
          }}
        />
      )}
      {addCompOpen && selected && (
        <AddCompModal
          onClose={() => setAddCompOpen(false)}
          onCreate={(text, notes) => {
            store.addComponent(selected.id, text);
            setAddCompOpen(false);
          }}
        />
      )}
      {editCompId &&
        selected &&
        (() => {
          const comp = selected.components.find((c) => c.id === editCompId);
          if (!comp) return null;
          return (
            <EditCompModal
              comp={comp}
              onClose={() => setEditCompId(null)}
              onSave={(p) => {
                store.updateComponent(selected.id, editCompId, p);
                setEditCompId(null);
              }}
            />
          );
        })()}
      {editObjId &&
        (() => {
          const obj = store.objectives.find((o) => o.id === editObjId);
          if (!obj) return null;
          return (
            <EditObjModal
              obj={obj}
              onClose={() => setEditObjId(null)}
              onSave={(p) => {
                store.updateObjective(editObjId, p);
                setEditObjId(null);
              }}
            />
          );
        })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mind Map — scrollable column layout: notDone pills → center card → done list
// SVG lines connect pills to center card
// ─────────────────────────────────────────────────────────────────────
function MindMap({
  obj,
  isMobile,
  onToggle,
  onEditComp,
  onDeleteComp,
  onUpdateComp,
  onAddComp,
  onEditObj,
  onDeleteObj,
}: {
  obj: Objective;
  isMobile: boolean;
  onToggle: (id: string) => void;
  onEditComp: (id: string) => void;
  onDeleteComp: (id: string) => void;
  onUpdateComp: (id: string, patch: Partial<ObjComponent>) => void;
  onAddComp: () => void;
  onEditObj: () => void;
  onDeleteObj: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [overCenter, setOverCenter] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [lines, setLines] = useState<
    { id: string; x1: number; y1: number; x2: number; y2: number }[]
  >([]);

  const total = obj.components.length;
  const done = obj.components.filter((c) => c.done);
  const notDone = obj.components.filter((c) => !c.done);
  const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);
  const stepPct = total === 0 ? 0 : Math.round(100 / total);

  // Recompute SVG lines whenever layout changes
  const recomputeLines = useCallback(() => {
    if (!containerRef.current || !centerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const cc = centerRef.current.getBoundingClientRect();
    const cx = cc.left - cr.left + cc.width / 2;
    const cy = cc.top - cr.top + cc.height / 2;
    const newLines: typeof lines = [];
    pillRefs.current.forEach((el, id) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      newLines.push({
        id,
        x1: r.left - cr.left + r.width / 2,
        y1: r.top - cr.top + r.height / 2,
        x2: cx,
        y2: cy,
      });
    });
    setLines(newLines);
  }, []);

  useEffect(() => {
    recomputeLines();
    const ro = new ResizeObserver(recomputeLines);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recomputeLines, obj.components.length]);

  // Check if dragged item is over center card
  const isOverCenter = useCallback((x: number, y: number) => {
    if (!centerRef.current) return false;
    const r = centerRef.current.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }, []);

  // Global pointer move / up handlers
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId) return;
      setDragPos({ x: e.clientX, y: e.clientY });
      setOverCenter(isOverCenter(e.clientX, e.clientY));
    },
    [draggingId, isOverCenter],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId) return;
      if (isOverCenter(e.clientX, e.clientY)) {
        const id = draggingId;
        setPulse(true);
        setJustDone(id);
        onToggle(id);
        setTimeout(() => setPulse(false), 700);
        setTimeout(() => setJustDone(null), 800);
      }
      setDraggingId(null);
      setOverCenter(false);
    },
    [draggingId, isOverCenter, onToggle],
  );

  const startDrag = useCallback(
    (id: string, clientX: number, clientY: number) => {
      setDraggingId(id);
      setDragPos({ x: clientX, y: clientY });
      setDragStart({ x: clientX, y: clientY });
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        position: "relative",
        touchAction: draggingId ? "none" : "auto",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(${rgb(obj.color)},.07) 0%, transparent 60%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* SVG connector lines */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient
            id={`lg-${obj.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={obj.color} />
            <stop offset="100%" stopColor={obj.color2} />
          </linearGradient>
        </defs>
        {lines.map((l) => (
          <line
            key={l.id}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={`url(#lg-${obj.id})`}
            strokeWidth={draggingId === l.id ? 2.5 : 1.5}
            strokeOpacity={draggingId === l.id ? 0.9 : 0.25}
            strokeDasharray={draggingId === l.id ? "6 3" : "5 5"}
            style={{ transition: "stroke-opacity .2s, stroke-width .2s" }}
          />
        ))}
      </svg>

      {/* Scrollable column */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "16px 12px 32px" : "24px 24px 40px",
          gap: 0,
          minHeight: "100%",
        }}
      >
        {/* ── Not-done pills ───────────────────────────────── */}
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: ".65rem",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: 1.1,
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
              }}
            >
              Components · {notDone.length} pending
            </span>
          </div>
        </div>

        {/* ── Add component + Center card ──────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            width: "100%",
            maxWidth: 340,
            marginTop: isMobile ? 16 : 24,
          }}
        >
          {/* Add component button sits right above the card */}
          <button
            onClick={onAddComp}
            style={{
              background: `rgba(${rgb(obj.color)},.16)`,
              border: `1px dashed rgba(${rgb(obj.color)},.5)`,
              borderRadius: 10,
              color: obj.color,
              fontFamily: "DM Sans,sans-serif",
              fontSize: ".76rem",
              fontWeight: 700,
              padding: "7px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all .2s",
              width: "100%",
              justifyContent: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `rgba(${rgb(obj.color)},.28)`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = `rgba(${rgb(obj.color)},.16)`)
            }
          >
            <i className="fa-solid fa-plus" style={{ fontSize: ".65rem" }} />{" "}
            Add Component
          </button>

          {/* Center objective card */}
          <div
            ref={centerRef}
            style={{
              width: "100%",
              borderRadius: 22,
              border: `2px solid ${overCenter ? "#fff" : obj.color}`,
              background: `linear-gradient(145deg,rgba(${rgb(obj.color)},.17),rgba(${rgb(obj.color2)},.09))`,
              backdropFilter: "blur(22px)",
              boxShadow: pulse
                ? `0 0 0 10px rgba(${rgb(obj.color)},.22), 0 0 80px rgba(${rgb(obj.color)},.55)`
                : overCenter
                  ? `0 0 0 5px ${obj.color}, 0 0 55px rgba(${rgb(obj.color)},.5)`
                  : `0 0 44px rgba(${rgb(obj.color)},.28), inset 0 1px 0 rgba(255,255,255,.07)`,
              transition: "box-shadow .28s, border-color .22s",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {pulse && (
              <div
                style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: 24,
                  border: `2.5px solid ${obj.color}`,
                  animation: "objPulse .7s ease-out",
                  pointerEvents: "none",
                  zIndex: 20,
                }}
              />
            )}
            {overCenter && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)",
                  animation: "shimmer .85s linear infinite",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
            )}

            {/* Header */}
            <div
              style={{
                padding: "18px 18px 12px",
                borderBottom: "1px solid rgba(255,255,255,.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "Syne,sans-serif",
                      fontWeight: 900,
                      fontSize: isMobile ? ".95rem" : "1.05rem",
                      lineHeight: 1.22,
                      background: `linear-gradient(135deg,${obj.color},${obj.color2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      marginBottom: 3,
                    }}
                  >
                    {obj.title}
                  </div>
                  {obj.description && (
                    <div
                      style={{
                        fontSize: ".7rem",
                        color: "var(--muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {obj.description}
                    </div>
                  )}
                </div>
                <ObjMenu onEdit={onEditObj} onDelete={onDeleteObj} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ProgressRing
                  pct={pct}
                  color={obj.color}
                  color2={obj.color2}
                  size={44}
                />
                <div>
                  <div style={{ fontSize: ".8rem", fontWeight: 700 }}>
                    {pct}% complete
                  </div>
                  <div style={{ fontSize: ".63rem", color: "var(--muted)" }}>
                    {done.length}/{total} · +{stepPct}% each
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 10,
                  height: 4,
                  background: "rgba(255,255,255,.07)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: `linear-gradient(90deg,${obj.color},${obj.color2})`,
                    borderRadius: 2,
                    transition: "width .8s cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </div>
            </div>

            {/* Done list */}
            <div
              style={{
                padding: "10px 14px 14px",
                maxHeight: isMobile ? 180 : 240,
                overflowY: "auto",
              }}
            >
              {done.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "14px 0",
                    fontSize: ".72rem",
                    color: "var(--muted)",
                    fontStyle: "italic",
                  }}
                >
                  Drag component pills here to complete them
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  {done.map((comp) => (
                    <DoneRow
                      key={comp.id}
                      comp={comp}
                      color={obj.color}
                      isDragging={draggingId === comp.id}
                      onStartDrag={(id, x, y) => {
                        startDrag(id, x, y);
                      }}
                      onDrop={(x, y) => {
                        if (!isOverCenter(x, y)) onToggle(comp.id);
                        setDraggingId(null);
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

        {/* ── Hint ─────────────────────────────────────────── */}
        {notDone.length > 0 && (
          <div
            style={{
              margin: 20,
              fontSize: ".64rem",
              color: "var(--muted)",
              background: "rgba(11,11,19,.65)",
              padding: "4px 14px",
              borderRadius: 20,
              backdropFilter: "blur(8px)",
              textAlign: "center",
            }}
          >
            Drag a pill onto the objective card to complete it · drag back out
            to undo
          </div>
        )}

        {notDone.length === 0 ? (
          <div
            style={{
              fontSize: ".76rem",
              color: "var(--muted)",
              fontStyle: "italic",
              padding: "4px 0 8px",
            }}
          >
            {total === 0 ? "No components yet." : "🎉 All done!"}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              paddingBottom: 8,
            }}
          >
            {notDone.map((comp) => (
              <PillNode
                key={comp.id}
                comp={comp}
                color={obj.color}
                color2={obj.color2}
                stepPct={stepPct}
                isDragging={draggingId === comp.id}
                isJustDone={justDone === comp.id}
                pillRef={(el) => {
                  if (el) pillRefs.current.set(comp.id, el);
                  else pillRefs.current.delete(comp.id);
                }}
                onStartDrag={startDrag}
                onEdit={() => onEditComp(comp.id)}
                onDelete={() => onDeleteComp(comp.id)}
                onColorChange={(bg) =>
                  onUpdateComp(comp.id, { bgColor: bg } as any)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating ghost while dragging ────────────────── */}
      {draggingId &&
        (() => {
          const comp = obj.components.find((c) => c.id === draggingId);
          if (!comp) return null;
          return (
            <div
              style={{
                position: "fixed",
                pointerEvents: "none",
                zIndex: 9999,
                left: dragPos.x,
                top: dragPos.y,
                transform: "translate(-50%,-50%) scale(1.1) rotate(-2deg)",
                transition: "transform .1s",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 16px",
                  borderRadius: 50,
                  background:
                    (comp as any).bgColor || `rgba(${rgb(obj.color)},.35)`,
                  border: `2px solid ${obj.color}`,
                  boxShadow: `0 12px 40px rgba(${rgb(obj.color)},.6), 0 0 0 3px ${obj.color}`,
                  backdropFilter: "blur(16px)",
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg,${obj.color},${obj.color2})`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: ".8rem", fontWeight: 700 }}>
                  {comp.text}
                </span>
                {comp.notes && (
                  <span
                    style={{
                      fontSize: ".65rem",
                      color: "var(--muted)",
                      maxWidth: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {comp.notes}
                  </span>
                )}
                <span
                  style={{
                    fontSize: ".65rem",
                    color: obj.color,
                    fontWeight: 800,
                  }}
                >
                  +{stepPct}%
                </span>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pill node — not-done, draggable with pointer capture
// ─────────────────────────────────────────────────────────────────────
function PillNode({
  comp,
  color,
  color2,
  stepPct,
  isDragging,
  isJustDone,
  pillRef,
  onStartDrag,
  onEdit,
  onDelete,
  onColorChange,
}: {
  comp: ObjComponent;
  color: string;
  color2: string;
  stepPct: number;
  isDragging: boolean;
  isJustDone: boolean;
  pillRef: (el: HTMLDivElement | null) => void;
  onStartDrag: (id: string, x: number, y: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onColorChange: (bg: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const bgColor = (comp as any).bgColor || "rgba(255,255,255,.08)";

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-nd]")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onStartDrag(comp.id, e.clientX, e.clientY);
  };

  return (
    <div
      ref={(el) => {
        (elRef as any).current = el;
        pillRef(el);
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => {
        setHov(false);
        setColorOpen(false);
      }}
      onPointerDown={handlePointerDown}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 15px",
        borderRadius: 50,
        border: `1.5px solid ${hov ? `rgba(${rgb(color)},.6)` : "rgba(255,255,255,.13)"}`,
        background: bgColor,
        backdropFilter: "blur(12px)",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        opacity: isDragging ? 0.25 : 1,
        boxShadow: isJustDone
          ? `0 0 0 8px rgba(${rgb(color)},.35)`
          : hov
            ? `0 4px 18px rgba(${rgb(color)},.25)`
            : "none",
        transform: isJustDone ? "scale(1.08)" : "scale(1)",
        transition: isDragging
          ? "opacity .15s"
          : "all .22s cubic-bezier(.34,1.56,.64,1)",
        maxWidth: 220,
      }}
    >
      {/* Color dot */}
      <div
        data-nd="1"
        onClick={() => setColorOpen((v) => !v)}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: `linear-gradient(135deg,${color},${color2})`,
          flexShrink: 0,
          cursor: "pointer",
        }}
        title="Change colour"
      />

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span
          style={{
            fontSize: ".78rem",
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {comp.text}
        </span>
        {comp.notes && (
          <span
            style={{
              fontSize: ".62rem",
              color: "var(--muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 120,
            }}
          >
            {comp.notes}
          </span>
        )}
      </div>

      <span
        style={{ fontSize: ".6rem", color, fontWeight: 800, flexShrink: 0 }}
      >
        +{stepPct}%
      </span>

      {hov && (
        <div data-nd="1" style={{ display: "flex", gap: 3 }}>
          <PillBtn c="rgba(255,255,255,.15)" title="Edit" onClick={onEdit}>
            <i className="fa-solid fa-pen" style={{ fontSize: ".5rem" }} />
          </PillBtn>
          <PillBtn c="rgba(239,68,68,.3)" title="Delete" onClick={onDelete}>
            <i className="fa-solid fa-trash" style={{ fontSize: ".5rem" }} />
          </PillBtn>
        </div>
      )}

      {/* Colour picker */}
      {colorOpen && (
        <div
          data-nd="1"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 200,
            background: "rgba(14,14,22,.98)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            width: 148,
            boxShadow: "0 16px 48px rgba(0,0,0,.65)",
            animation: "menuIn .14s ease",
          }}
        >
          {PILL_COLORS.map((c, i) => (
            <div
              key={i}
              onClick={() => {
                onColorChange(c);
                setColorOpen(false);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: c,
                border: `2px solid ${c === bgColor ? "#fff" : "transparent"}`,
                cursor: "pointer",
                transition: "transform .12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Done row inside center card
// ─────────────────────────────────────────────────────────────────────
function DoneRow({
  comp,
  color,
  isDragging,
  onStartDrag,
  onDrop,
  onEdit,
  onDelete,
}: {
  comp: ObjComponent;
  color: string;
  isDragging: boolean;
  onStartDrag: (id: string, x: number, y: number) => void;
  onDrop: (x: number, y: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onStartDrag(comp.id, e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) =>
    onDrop(e.clientX, e.clientY);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 10px",
        borderRadius: 9,
        background: hov ? "rgba(255,255,255,.05)" : "transparent",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        opacity: isDragging ? 0.35 : 1,
        transition: "background .15s, opacity .15s",
      }}
    >
      <i
        className="fa-solid fa-check"
        style={{ fontSize: ".56rem", color, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: ".74rem",
            color: "var(--muted)",
            textDecoration: "line-through",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {comp.text}
        </div>
        {comp.notes && (
          <div
            style={{
              fontSize: ".6rem",
              color: "var(--muted)",
              opacity: 0.6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {comp.notes}
          </div>
        )}
      </div>
      {hov && (
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <span
            style={{
              fontSize: ".54rem",
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            drag out
          </span>
          <PillBtn c="rgba(255,255,255,.12)" title="Edit" onClick={onEdit}>
            <i className="fa-solid fa-pen" style={{ fontSize: ".46rem" }} />
          </PillBtn>
          <PillBtn c="rgba(239,68,68,.25)" title="Delete" onClick={onDelete}>
            <i className="fa-solid fa-trash" style={{ fontSize: ".46rem" }} />
          </PillBtn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Objective menu
// ─────────────────────────────────────────────────────────────────────
function ObjMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen((v) => !v)} style={iconBtn}>
        <i className="fa-solid fa-ellipsis" />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "rgba(14,14,22,.98)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 4,
            minWidth: 148,
            zIndex: 50,
            boxShadow: "0 16px 48px rgba(0,0,0,.65)",
            animation: "menuIn .15s ease",
          }}
        >
          <MI icon="fa-pen" label="Edit Objective" onClick={onEdit} />
          <MI icon="fa-trash" label="Delete" danger onClick={onDelete} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Progress ring
// ─────────────────────────────────────────────────────────────────────
function ProgressRing({
  pct,
  color,
  color2,
  size,
}: {
  pct: number;
  color: string;
  color2: string;
  size: number;
}) {
  const r = (size - 5) / 2,
    circ = 2 * Math.PI * r,
    id = `pr${color.slice(1, 5)}`;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,.07)"
        strokeWidth={4.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circ} ${circ - (pct / 100) * circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontWeight={700}
        fill="var(--text)"
        fontFamily="DM Sans,sans-serif"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: "var(--muted)",
        padding: 24,
      }}
    >
      <div style={{ fontSize: "2.4rem", opacity: 0.18 }}>◎</div>
      <div
        style={{
          fontFamily: "Syne,sans-serif",
          fontWeight: 800,
          fontSize: ".95rem",
          color: "var(--text)",
          textAlign: "center",
        }}
      >
        No objective selected
      </div>
      <div style={{ fontSize: ".78rem", textAlign: "center" }}>
        Pick one from the sidebar or create a new one
      </div>
      <button
        onClick={onAdd}
        style={{
          marginTop: 6,
          background: "var(--accent)",
          border: "none",
          color: "#fff",
          fontFamily: "DM Sans,sans-serif",
          fontSize: ".8rem",
          padding: "9px 22px",
          borderRadius: 11,
          cursor: "pointer",
          fontWeight: 600,
          boxShadow: "0 0 22px rgba(111,95,255,.4)",
        }}
      >
        <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />
        New Objective
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────
function AddObjModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: string, d: string, c1: string, c2: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [pi, setPi] = useState(0);
  const go = () => {
    if (!title.trim()) return;
    const [c1, c2] = ACCENT_PAIRS[pi];
    onCreate(title.trim(), desc.trim(), c1, c2);
  };
  return (
    <Ov onClose={onClose}>
      <MB title="New Objective" onClose={onClose}>
        <Lb>Title</Lb>
        <In
          value={title}
          set={setTitle}
          ph="e.g. Launch product v2"
          af
          onEnt={go}
        />
        <Lb>Description (optional)</Lb>
        <In value={desc} set={setDesc} ph="What does success look like?" />
        <Lb>Color</Lb>
        <Pal pi={pi} setPi={setPi} />
        <Rw>
          <Gb onClick={onClose}>Cancel</Gb>
          <Pb onClick={go} c={ACCENT_PAIRS[pi][0]}>
            Create
          </Pb>
        </Rw>
      </MB>
    </Ov>
  );
}
function AddCompModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: string, n: string) => void;
}) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const go = () => text.trim() && onCreate(text.trim(), notes.trim());
  return (
    <Ov onClose={onClose}>
      <MB title="Add Component" onClose={onClose}>
        <Lb>Name</Lb>
        <In value={text} set={setText} ph="e.g. Design mockups" af onEnt={go} />
        <Lb>Description (optional)</Lb>
        <In value={notes} set={setNotes} ph="Brief description…" />
        <Rw>
          <Gb onClick={onClose}>Cancel</Gb>
          <Pb onClick={go}>Add</Pb>
        </Rw>
      </MB>
    </Ov>
  );
}
function EditCompModal({
  comp,
  onClose,
  onSave,
}: {
  comp: ObjComponent;
  onClose: () => void;
  onSave: (p: Partial<ObjComponent>) => void;
}) {
  const [text, setText] = useState(comp.text);
  const [notes, setNotes] = useState(comp.notes || "");
  return (
    <Ov onClose={onClose}>
      <MB title="Edit Component" onClose={onClose}>
        <Lb>Name</Lb>
        <In
          value={text}
          set={setText}
          af
          onEnt={() => onSave({ text: text.trim(), notes })}
        />
        <Lb>Description</Lb>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Brief description…"
          style={{
            width: "100%",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            fontFamily: "DM Sans,sans-serif",
            fontSize: ".83rem",
            padding: "8px 10px",
            outline: "none",
            resize: "vertical",
            minHeight: 68,
            marginBottom: 14,
            boxSizing: "border-box",
          }}
        />
        <Rw>
          <Gb onClick={onClose}>Cancel</Gb>
          <Pb onClick={() => onSave({ text: text.trim(), notes })}>Save</Pb>
        </Rw>
      </MB>
    </Ov>
  );
}
function EditObjModal({
  obj,
  onClose,
  onSave,
}: {
  obj: Objective;
  onClose: () => void;
  onSave: (p: Partial<Objective>) => void;
}) {
  const [title, setTitle] = useState(obj.title);
  const [desc, setDesc] = useState(obj.description);
  const [pi, setPi] = useState(() =>
    Math.max(
      0,
      ACCENT_PAIRS.findIndex(([c]) => c === obj.color),
    ),
  );
  return (
    <Ov onClose={onClose}>
      <MB title="Edit Objective" onClose={onClose}>
        <Lb>Title</Lb>
        <In value={title} set={setTitle} af />
        <Lb>Description</Lb>
        <In value={desc} set={setDesc} />
        <Lb>Color</Lb>
        <Pal pi={pi} setPi={setPi} />
        <Rw>
          <Gb onClick={onClose}>Cancel</Gb>
          <Pb
            onClick={() =>
              onSave({
                title: title.trim(),
                description: desc,
                color: ACCENT_PAIRS[pi][0],
                color2: ACCENT_PAIRS[pi][1],
              })
            }
            c={ACCENT_PAIRS[pi][0]}
          >
            Save
          </Pb>
        </Rw>
      </MB>
    </Ov>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────
function Ov({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420 }}
      >
        {children}
      </div>
    </div>
  );
}
function MB({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: "rgba(16,16,26,.98)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "22px 20px",
        boxShadow: "0 32px 80px rgba(0,0,0,.7)",
        animation: "modalIn .22s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 800,
            fontSize: ".92rem",
          }}
        >
          {title}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: ".9rem",
          }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
function Lb({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: ".69rem",
        color: "var(--muted)",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: 0.9,
      }}
    >
      {children}
    </div>
  );
}
function In({
  value,
  set,
  ph,
  af,
  onEnt,
}: {
  value: string;
  set: (v: string) => void;
  ph?: string;
  af?: boolean;
  onEnt?: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={ph}
      autoFocus={af}
      onKeyDown={(e) => e.key === "Enter" && onEnt?.()}
      style={{
        width: "100%",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        color: "var(--text)",
        fontFamily: "DM Sans,sans-serif",
        fontSize: ".85rem",
        padding: "9px 12px",
        outline: "none",
        marginBottom: 14,
        boxSizing: "border-box",
      }}
    />
  );
}
function Pal({ pi, setPi }: { pi: number; setPi: (i: number) => void }) {
  return (
    <div
      style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}
    >
      {ACCENT_PAIRS.map(([c1, c2], i) => (
        <div
          key={i}
          onClick={() => setPi(i)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            cursor: "pointer",
            background: `linear-gradient(135deg,${c1},${c2})`,
            border: `2px solid ${i === pi ? "#fff" : "transparent"}`,
            transition: "all .18s",
            transform: i === pi ? "scale(1.2)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}
function Rw({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      {children}
    </div>
  );
}
function Gb({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--muted)",
        fontFamily: "DM Sans,sans-serif",
        fontSize: ".8rem",
        padding: "8px 16px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
function Pb({
  children,
  onClick,
  c = "var(--accent)",
}: {
  children: React.ReactNode;
  onClick: () => void;
  c?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: c,
        border: "none",
        color: "#fff",
        fontFamily: "DM Sans,sans-serif",
        fontSize: ".8rem",
        fontWeight: 600,
        padding: "8px 18px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
function PillBtn({
  children,
  onClick,
  c,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  c: string;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: c,
        border: "none",
        borderRadius: 5,
        width: 20,
        height: 20,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
function MI({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="menu-item-hover"
      style={{
        padding: "8px 12px",
        borderRadius: 7,
        fontSize: ".76rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: danger ? "#ff6b6b" : "var(--text)",
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ width: 12 }} />
      {label}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 7,
  color: "var(--muted)",
  width: 26,
  height: 26,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: ".7rem",
};
