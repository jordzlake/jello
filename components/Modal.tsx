'use client';
import React from 'react';

interface ModalProps { open:boolean; onClose:()=>void; title:React.ReactNode; children:React.ReactNode; maxWidth?:number; }
export default function Modal({ open, onClose, title, children, maxWidth=500 }: ModalProps) {
  if (!open) return null;
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{
      position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.74)',
      backdropFilter:'blur(10px)',display:'flex',alignItems:'center',
      justifyContent:'center',padding:14,animation:'fadeIn .18s ease',
    }}>
      <div style={{
        background:'rgba(16,16,26,.98)',border:'1px solid var(--border)',
        borderRadius:20,padding:22,width:'100%',maxWidth,
        boxShadow:'0 30px 80px rgba(0,0,0,.65)',
        animation:'modalIn .28s cubic-bezier(.34,1.56,.64,1)',
        maxHeight:'92vh',overflowY:'auto',
      }}>
        <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:16,fontSize:'.98rem',display:'flex',alignItems:'center',gap:7}}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function MLabel({ children }: { children: React.ReactNode }) {
  return <label style={{display:'block',fontSize:'.72rem',color:'var(--muted)',marginBottom:4,marginTop:10}}>{children}</label>;
}

export function MInput({ id, type='text', placeholder, value, onChange, onKeyDown, style }: {
  id?:string;type?:string;placeholder?:string;value?:string;
  onChange?:(v:string)=>void;onKeyDown?:(e:React.KeyboardEvent)=>void;style?:React.CSSProperties;
}) {
  return (
    <input id={id} type={type} placeholder={placeholder} value={value ?? ''} autoComplete="off"
      onChange={e=>onChange?.(e.target.value)} onKeyDown={onKeyDown}
      style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',
        color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.84rem',padding:'8px 10px',outline:'none',
        transition:'border-color .2s',...style}}
      onFocus={e=>e.currentTarget.style.borderColor='var(--accent)'}
      onBlur={e=>e.currentTarget.style.borderColor='var(--border)'}
    />
  );
}

export function MFooter({ children }: { children: React.ReactNode }) {
  return <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>{children}</div>;
}

export function BtnGhost({ onClick, children, style }: { onClick:()=>void;children:React.ReactNode;style?:React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{
      border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',
      fontFamily:'DM Sans,sans-serif',fontSize:'.74rem',padding:'6px 11px',
      borderRadius:8,cursor:'pointer',transition:'all .2s',
      display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',...style,
    }}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.borderColor='var(--accent)';}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.borderColor='var(--border)';}}
    >{children}</button>
  );
}

export function BtnPrimary({ onClick, children }: { onClick:()=>void;children:React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background:'linear-gradient(135deg,#6f5fff,#ff5fa0)',border:'none',color:'#fff',
      fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',fontWeight:600,padding:'8px 15px',
      borderRadius:9,cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',gap:5,
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 20px rgba(111,95,255,.45)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
    >{children}</button>
  );
}

export function DQBtn({ children, onClick }: { children:React.ReactNode;onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',
      fontSize:'.68rem',padding:'3px 8px',borderRadius:20,cursor:'pointer',transition:'all .2s',
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';}}
    >{children}</button>
  );
}
