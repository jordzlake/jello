'use client';
import { useState, useEffect, useRef } from 'react';
import Modal, { MFooter, BtnGhost, BtnPrimary } from './Modal';
import { flickrUrl } from '@/lib/utils';

interface Props { open:boolean; onClose:()=>void; onSelect:(url:string)=>void; onClear:()=>void; }
const PAGE=9;

export default function BgModal({ open, onClose, onSelect, onClear }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [imgs, setImgs] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(()=>{if(open){setSearch('');setPage(1);load('nature',1);}}, [open]);

  const load = (kw:string,pg:number)=>{
    const base=(pg-1)*PAGE, seed=Math.floor(Date.now()/60000%10000)*PAGE;
    setImgs(Array.from({length:PAGE},(_,i)=>flickrUrl(kw,base+i+seed,false)));
  };
  const handleSearch = (v:string)=>{setSearch(v);clearTimeout(timer.current);timer.current=setTimeout(()=>{setPage(1);load(v||'nature',1);},500);};

  return (
    <Modal open={open} onClose={onClose} title={<><i className="fa-solid fa-earth-americas" style={{color:'var(--accent)'}}></i> App Background</>}>
      <div style={{position:'relative',marginBottom:7}}>
        <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:'.76rem',pointerEvents:'none'}}></i>
        <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="mountains, cyberpunk, abstract, city night…"
          style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.84rem',padding:'8px 10px 8px 32px',outline:'none'}} />
      </div>
      <div style={{fontSize:'.65rem',color:'var(--muted)',marginBottom:8}}>Powered by LoremFlickr</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,marginBottom:8}}>
        {imgs.map((url,i)=>(
          <BgImgCell key={i} url={url} onClick={()=>onSelect(url)} />
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:10}}>
        <PageBtn disabled={page<=1} onClick={()=>{const p=page-1;setPage(p);load(search||'nature',p);}}>← Prev</PageBtn>
        <span style={{fontSize:'.72rem',color:'var(--muted)'}}>Page {page}</span>
        <PageBtn onClick={()=>{const p=page+1;setPage(p);load(search||'nature',p);}}>Next →</PageBtn>
      </div>
      <MFooter><BtnGhost onClick={onClear}>Clear</BtnGhost><BtnPrimary onClick={onClose}>Done</BtnPrimary></MFooter>
    </Modal>
  );
}

function BgImgCell({ url, onClick }: { url:string;onClick:()=>void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onClick} style={{aspectRatio:'16/9',borderRadius:7,overflow:'hidden',background:'var(--surface2)',cursor:'pointer',position:'relative',border:'2px solid transparent',transition:'all .18s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='scale(1.04)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='';}}
    >
      {!loaded && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'.72rem'}}></i></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:loaded?1:0,transition:'opacity .35s'}}
        onLoad={()=>setLoaded(true)} onError={e=>e.currentTarget.style.opacity='0'} />
    </div>
  );
}
function PageBtn({ children,onClick,disabled }: { children:React.ReactNode;onClick:()=>void;disabled?:boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:'.74rem',padding:'4px 12px',borderRadius:7,cursor:disabled?'default':'pointer',opacity:disabled?.3:1}}>{children}</button>;
}
