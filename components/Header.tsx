"use client";
import { useState, useEffect, useRef } from "react";
import { GlobalState } from "@/lib/types";
import Image from "next/image";

export type ViewType = "board" | "calendar" | "gantt" | "objectives";

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

export default function Header({
  G, view, onViewChange, onOpenBg, onOpenArchive,
  onSaveJson, onLoadJson, onSwitchDash, onNewDash,
  onRenameDash, onDeleteDash,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const dashIds  = Object.keys(G.dashboards);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const icons  = ["fa-table-columns","fa-regular fa-calendar","fa-bars-progress","fa-bullseye"];
  const labels = ["Board","Calendar","Gantt","Objectives"];
  const views  = ["board","calendar","gantt","objectives"] as ViewType[];

  return (
    <>
      {/* CSS-only responsive rules */}
      <style>{`
        .hdr-logo-text   { display: inline; }
        .hdr-dash-tabs   { display: flex; }
        .hdr-actions     { display: flex; }
        .hdr-hamburger   { display: none; }
        .hdr-view-label  { display: inline; }
        .hdr-view-btn    { padding: 6px 12px; }
        @media (max-width: 700px) {
          .hdr-logo-text  { display: none; }
          .hdr-dash-tabs  { display: none; }
          .hdr-actions    { display: none; }
          .hdr-hamburger  { display: flex; }
          .hdr-view-label { display: none; }
          .hdr-view-btn   { padding: 6px 9px; }
        }
      `}</style>

      <header style={{
        position:"relative", zIndex:200,
        display:"flex", alignItems:"center", gap:8,
        padding:"9px 18px",
        background:"rgba(11,11,19,.86)",
        borderBottom:"1px solid var(--border)",
        backdropFilter:"blur(24px)",
        flexWrap:"nowrap",
      }}>

        {/* Logo */}
        <a href="#" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
          <Image src="/icons/icon.svg" alt="Jello" width={32} height={32} />
          <span className="hdr-logo-text" style={{
            fontFamily:"Space Grotesk,sans-serif", fontWeight:800, fontSize:"1.28rem",
            letterSpacing:"2.5px", textTransform:"uppercase",
            background:"linear-gradient(135deg,#00d26a 0%,#ff81f5 55%,#ffd26b 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>Jello</span>
        </a>

        {/* Dashboard tabs — hidden on mobile via CSS */}
        <div className="hdr-dash-tabs" style={{
          alignItems:"center", gap:5, flex:1, minWidth:0, overflowX:"auto", padding:"2px 0",
        }}>
          {dashIds.map(id => (
            <button key={id} onClick={() => onSwitchDash(id)} onDoubleClick={() => onRenameDash(id)}
              style={{
                border:"1px solid", flexShrink:0,
                borderColor: id===G.activeDash ? "var(--accent)" : "var(--border)",
                background:  id===G.activeDash ? "var(--accent)" : "var(--surface)",
                color:       id===G.activeDash ? "#fff" : "var(--muted)",
                fontFamily:"DM Sans,sans-serif", fontSize:".75rem",
                padding:"5px 11px", borderRadius:7, cursor:"pointer", transition:"all .2s",
                whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5,
                boxShadow: id===G.activeDash ? "0 0 14px rgba(111,95,255,.4)" : "none",
              }}>
              <span>{G.dashboards[id].name}</span>
              {dashIds.length > 1 && (
                <span onClick={e => { e.stopPropagation(); onDeleteDash(id); }}
                  style={{ opacity:0, fontSize:".58rem", cursor:"pointer", transition:"opacity .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity="1"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity="0"}>✕</span>
              )}
            </button>
          ))}
          <button onClick={onNewDash}
            style={{ border:"1px dashed rgba(255,255,255,.14)", background:"transparent", color:"var(--muted)", fontSize:".75rem", padding:"5px 9px", borderRadius:7, cursor:"pointer", flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.14)"; e.currentTarget.style.color="var(--muted)"; }}>
            +
          </button>
        </div>

        {/* Right section */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, marginLeft:"auto" }}>

          {/* View toggle — always visible, labels hidden on mobile via CSS */}
          <div style={{ display:"flex", gap:2, background:"var(--surface)", borderRadius:10, padding:3, flexShrink:0 }}>
            {views.map((v, i) => (
              <button key={v} onClick={() => onViewChange(v)} className="hdr-view-btn"
                style={{
                  border:"none",
                  background: view===v ? "var(--accent)" : "transparent",
                  color:      view===v ? "#fff" : "var(--muted)",
                  fontFamily:"DM Sans,sans-serif", fontSize:".74rem", fontWeight:500,
                  borderRadius:7, cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap",
                  boxShadow: view===v ? "0 0 16px rgba(111,95,255,.4)" : "none",
                  display:"flex", alignItems:"center", gap:4,
                }}>
                <i className={`fa-solid ${icons[i]}`}/>
                <span className="hdr-view-label">{labels[i]}</span>
              </button>
            ))}
          </div>

          {/* Desktop action buttons — hidden on mobile via CSS */}
          <div className="hdr-actions" style={{ gap:6, flexShrink:0 }}>
            <GhostBtn onClick={onOpenBg}><i className="fa-solid fa-image"/> BG</GhostBtn>
            <GhostBtn onClick={onOpenArchive}><i className="fa-solid fa-box-archive"/> Archive</GhostBtn>
            <GhostBtn onClick={onSaveJson}><i className="fa-solid fa-download"/> Save</GhostBtn>
            <GhostBtn onClick={() => fileRef.current?.click()}><i className="fa-solid fa-upload"/> Load</GhostBtn>
            <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }}
              onChange={e => { const f=e.target.files?.[0]; if(f){onLoadJson(f);e.target.value="";} }}/>
          </div>

          {/* Hamburger — shown on mobile via CSS */}
          <div ref={menuRef} className="hdr-hamburger" style={{ position:"relative", flexShrink:0 }}>
            <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu"
              style={{
                background: menuOpen ? "var(--surface2)" : "var(--surface)",
                border:`1px solid ${menuOpen ? "var(--accent)" : "var(--border)"}`,
                borderRadius:8, width:34, height:34, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s",
              }}>
              <HamIcon open={menuOpen}/>
            </button>

            {menuOpen && (
              <div style={{
                position:"fixed", right:12, top:58,
                background:"rgba(18,18,28,.98)", border:"1px solid var(--border)",
                borderRadius:14, padding:8, minWidth:230,
                boxShadow:"0 20px 60px rgba(0,0,0,.7)", backdropFilter:"blur(20px)",
                animation:"menuIn .18s cubic-bezier(.34,1.56,.64,1)", zIndex:300,
              }}>
                {/* Dashboards */}
                <div style={{ padding:"4px 10px 6px", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:1 }}>
                  Dashboards
                </div>
                {dashIds.map(id => (
                  <DI key={id} icon="fa-table-columns" label={G.dashboards[id].name}
                    active={id===G.activeDash}
                    onClick={() => { onSwitchDash(id); setMenuOpen(false); }}/>
                ))}
                <DI icon="fa-plus" label="New Dashboard" onClick={() => { onNewDash(); setMenuOpen(false); }}/>
                <Sep/>

                {/* Views */}
                <div style={{ padding:"4px 10px 6px", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:1 }}>
                  Views
                </div>
                {views.map((v,i) => (
                  <DI key={v} icon={icons[i]} label={labels[i]} active={view===v}
                    onClick={() => { onViewChange(v); setMenuOpen(false); }}/>
                ))}
                <Sep/>

                {/* Actions */}
                <DI icon="fa-image"       label="Background" onClick={() => { onOpenBg();                    setMenuOpen(false); }}/>
                <DI icon="fa-box-archive" label="Archive"    onClick={() => { onOpenArchive();               setMenuOpen(false); }}/>
                <DI icon="fa-download"    label="Save JSON"  onClick={() => { onSaveJson();                  setMenuOpen(false); }}/>
                <label style={{ display:"block", cursor:"pointer" }}>
                  <input type="file" accept=".json" style={{ display:"none" }}
                    onChange={e => { const f=e.target.files?.[0]; if(f){onLoadJson(f);e.target.value="";setMenuOpen(false);} }}/>
                  <DI icon="fa-upload" label="Load JSON" onClick={() => {}}/>
                </label>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function HamIcon({ open }: { open: boolean }) {
  const s: React.CSSProperties = { display:"block", width:16, height:2, background:"var(--text)", borderRadius:2, transition:"all .25s", position:"absolute" };
  return (
    <div style={{ width:16, height:12, position:"relative" }}>
      {open ? (
        <><span style={{ ...s, transform:"rotate(45deg)", top:5 }}/><span style={{ ...s, transform:"rotate(-45deg)", top:5 }}/></>
      ) : (
        <><span style={{ ...s, top:0 }}/><span style={{ ...s, width:12, top:5 }}/><span style={{ ...s, top:10 }}/></>
      )}
    </div>
  );
}

function DI({ icon, label, active, onClick }: { icon:string; label:string; active?:boolean; onClick:()=>void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding:"9px 12px", borderRadius:9, fontSize:".84rem", cursor:"pointer",
        transition:"all .15s", display:"flex", alignItems:"center", gap:10, color:"var(--text)",
        background: active ? "var(--accent)" : hov ? "var(--surface2)" : "transparent",
        fontWeight: active ? 600 : 400,
      }}>
      <i className={`fa-solid ${icon}`} style={{ width:14, textAlign:"center", color: active ? "#fff" : "var(--muted)" }}/>
      {label}
    </div>
  );
}

function Sep() {
  return <div style={{ height:1, background:"var(--border)", margin:"6px 4px" }}/>;
}

function GhostBtn({ onClick, children }: { onClick:()=>void; children:React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text)", fontFamily:"DM Sans,sans-serif", fontSize:".74rem", padding:"6px 11px", borderRadius:8, cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}
      onMouseEnter={e => { e.currentTarget.style.background="var(--surface2)"; e.currentTarget.style.borderColor="var(--accent)"; }}
      onMouseLeave={e => { e.currentTarget.style.background="var(--surface)";  e.currentTarget.style.borderColor="var(--border)"; }}>
      {children}
    </button>
  );
}
