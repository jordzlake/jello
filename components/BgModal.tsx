'use client';
import { useState, useEffect, useRef } from 'react';
import { cacheImage } from '@/lib/imageCache';
import Modal, { MFooter, BtnGhost, BtnPrimary } from './Modal';

interface Props { open:boolean; onClose:()=>void; onSelect:(url:string)=>void; onClear:()=>void; }

const PER_PAGE = 9;
const API_KEY = process.env.NEXT_PUBLIC_UNSPLASH_KEY || '';
interface UImg { id:string; thumb:string; full:string; }

export default function BgModal({ open, onClose, onSelect, onClear }: Props) {
  const [search, setSearch]     = useState('nature');
  const [page, setPage]         = useState(1);
  const [imgs, setImgs]         = useState<UImg[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [cachingId, setCachingId] = useState<string|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (open) { setPage(1); fetchImgs(search, 1); } }, [open]);

  const fetchImgs = async (q: string, pg: number) => {
    if (!API_KEY) { setError('Add NEXT_PUBLIC_UNSPLASH_KEY to your .env.local'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${pg}&per_page=${PER_PAGE}&orientation=landscape&client_id=${API_KEY}`);
      if (!res.ok) { setError(`Unsplash error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      setImgs((data.results||[]).map((p:any) => ({ id:p.id, thumb:p.urls.small, full:p.urls.regular })));
    } catch { setError('Network error — try again.'); }
    setLoading(false);
  };

  const handleSearch = (v:string) => {
    setSearch(v); clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); fetchImgs(v||'nature', 1); }, 500);
  };

  const goTo = (pg:number) => { setPage(pg); fetchImgs(search||'nature', pg); };

  const handleSelect = async (img: UImg) => {
    setSelectedId(img.id);
    setCachingId(img.id);
    const b64 = await cacheImage(img.full);
    setCachingId(null);
    onSelect(b64);
  };

  return (
    <Modal open={open} onClose={onClose} title={<><i className="fa-solid fa-earth-americas" style={{color:'var(--accent)'}}></i> App Background</>}>
      <div style={{position:'relative',marginBottom:8}}>
        <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:'.76rem',pointerEvents:'none'}}></i>
        <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="mountains, cyberpunk, ocean, space…"
          style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.84rem',padding:'8px 10px 8px 32px',outline:'none'}} />
      </div>
      <div style={{fontSize:'.65rem',color:'var(--muted)',marginBottom:8}}>Powered by Unsplash</div>
      {error && <div style={{color:'#ff6b6b',fontSize:'.75rem',marginBottom:8,padding:'8px 10px',background:'rgba(255,80,80,.08)',borderRadius:6}}>{error}</div>}
      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180}}>
          <i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'1.2rem'}}></i>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,marginBottom:8}}>
          {imgs.map(img => (
            <ImgCell key={img.id} thumb={img.thumb} selected={selectedId===img.id} caching={cachingId===img.id} onSelect={() => handleSelect(img)} />
          ))}
          {imgs.length===0 && !loading && !error && (
            <div style={{gridColumn:'1/-1',textAlign:'center',color:'var(--muted)',fontSize:'.78rem',padding:'40px 0'}}>No results for "{search}"</div>
          )}
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

function ImgCell({ thumb, selected, caching, onSelect }: { thumb:string; selected:boolean; caching:boolean; onSelect:()=>void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onSelect}
      style={{aspectRatio:'16/9',borderRadius:7,overflow:'hidden',background:'var(--surface2)',cursor:'pointer',
        position:'relative',border:`2px solid ${selected?'var(--accent)':'transparent'}`,
        transition:'all .18s',boxShadow:selected?'0 0 0 3px rgba(111,95,255,.4)':'none'}}
      onMouseEnter={e=>{if(!selected)e.currentTarget.style.borderColor='rgba(111,95,255,.5)';e.currentTarget.style.transform='scale(1.04)';}}
      onMouseLeave={e=>{if(!selected)e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='';}}
    >
      {!loaded && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'.72rem'}}></i></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:loaded?1:0,transition:'opacity .35s'}}
        onLoad={()=>setLoaded(true)} onError={e=>e.currentTarget.style.opacity='0'} />
      {caching && (
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'#fff',fontSize:'.8rem'}}/>
        </div>
      )}
      {selected && !caching && (
        <div style={{position:'absolute',top:5,right:5,width:20,height:20,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.4)'}}>
          <i className="fa-solid fa-check" style={{fontSize:'.55rem',color:'#fff'}}/>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children,onClick,disabled }: { children:React.ReactNode;onClick:()=>void;disabled?:boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:'.74rem',padding:'4px 12px',borderRadius:7,cursor:disabled?'default':'pointer',opacity:disabled?.3:1}}>{children}</button>;
}
