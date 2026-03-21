'use client';
import { useState, useEffect } from 'react';
import Modal, { MFooter, BtnGhost, BtnPrimary } from './Modal';

interface Props { open:boolean; onClose:()=>void; onSelect:(url:string)=>void; onClear:()=>void; }

const PER_PAGE = 9;
const W = 860, H = 540;

function picsumUrl(id: string | number) {
  return `https://picsum.photos/id/${id}/${W}/${H}`;
}

export default function BgModal({ open, onClose, onSelect, onClear }: Props) {
  const [page, setPage] = useState(1);
  const [imgs, setImgs] = useState<{id:string; thumb:string; full:string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) { setPage(1); load(1); } }, [open]);

  const load = async (pg: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://picsum.photos/v2/list?page=${pg}&limit=${PER_PAGE}`);
      const data = await res.json();
      setImgs(data.map((item: {id:string}) => ({
        id: item.id,
        thumb: `https://picsum.photos/id/${item.id}/400/225`,
        full: picsumUrl(item.id),
      })));
    } catch { /* network error — keep showing whatever was there */ }
    setLoading(false);
  };

  const goTo = (pg: number) => { setPage(pg); load(pg); };

  return (
    <Modal open={open} onClose={onClose} title={<><i className="fa-solid fa-earth-americas" style={{color:'var(--accent)'}}></i> App Background</>}>
      <div style={{fontSize:'.65rem',color:'var(--muted)',marginBottom:8}}>
        Browse photos — each image is permanent by ID
      </div>
      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180}}>
          <i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'1.2rem'}}></i>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,marginBottom:8}}>
          {imgs.map(img => (
            <ImgCell key={img.id} thumb={img.thumb} onSelect={() => onSelect(img.full)} />
          ))}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:10}}>
        <PageBtn disabled={page<=1} onClick={()=>goTo(page-1)}>← Prev</PageBtn>
        <span style={{fontSize:'.72rem',color:'var(--muted)'}}>Page {page}</span>
        <PageBtn onClick={()=>goTo(page+1)}>Next →</PageBtn>
      </div>
      <MFooter><BtnGhost onClick={onClear}>Clear</BtnGhost><BtnPrimary onClick={onClose}>Done</BtnPrimary></MFooter>
    </Modal>
  );
}

function ImgCell({ thumb, onSelect }: { thumb:string; onSelect:()=>void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onSelect}
      style={{aspectRatio:'16/9',borderRadius:7,overflow:'hidden',background:'var(--surface2)',cursor:'pointer',position:'relative',border:'2px solid transparent',transition:'all .18s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='scale(1.04)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='';}}
    >
      {!loaded && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'.72rem'}}></i></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:loaded?1:0,transition:'opacity .35s'}}
        onLoad={()=>setLoaded(true)} onError={e=>e.currentTarget.style.opacity='0'} />
    </div>
  );
}

function PageBtn({ children,onClick,disabled }: { children:React.ReactNode;onClick:()=>void;disabled?:boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:'.74rem',padding:'4px 12px',borderRadius:7,cursor:disabled?'default':'pointer',opacity:disabled?.3:1}}>{children}</button>;
}
