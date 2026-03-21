'use client';
import { useState, useEffect, useRef } from 'react';
import Modal, { MLabel, MFooter, BtnPrimary } from './Modal';
import { JList, Palette } from '@/lib/types';
import { PAL, flickrUrl } from '@/lib/utils';

interface Props {
  open: boolean;
  list: JList | null;
  onClose: () => void;
  onUpdate: (patch: Partial<JList>) => void;
}

const PAGE = 9;

export default function ListStyleModal({ open, list, onClose, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [imgs, setImgs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [allPals, setAllPals] = useState<Palette[]>(PAL);
  const [c1, setC1] = useState('#6f5fff');
  const [c2, setC2] = useState('#ff5fa0');
  const [cname, setCname] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) { setSearch(''); setPage(1); load('landscape', 1); }
  }, [open]);

  const load = (kw: string, pg: number) => {
    setLoading(true);
    const base = (pg-1)*PAGE;
    setImgs(Array.from({length:PAGE},(_,i)=>flickrUrl(kw,base+i,true)));
    setLoading(false);
  };

  const handleSearch = (v: string) => {
    setSearch(v); clearTimeout(timer.current);
    timer.current = setTimeout(()=>{setPage(1);load(v||'landscape',1);},500);
  };

  const addGradient = () => {
    const p: Palette = { c1, c2 };
    setAllPals(prev=>[...prev,p]);
    onUpdate({ palette:p, bannerUrl:null });
  };

  return (
    <Modal open={open} onClose={onClose} title={<><i className="fa-solid fa-palette" style={{color:'var(--pink)'}}></i> Customize List</>}>
      <MLabel>Color theme</MLabel>
      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
        {allPals.map((p,i)=>(
          <div key={i} title={`${p.c1}`} onClick={()=>onUpdate({palette:p,bannerUrl:null})}
            style={{width:30,height:30,borderRadius:7,cursor:'pointer',flexShrink:0,
              background:`linear-gradient(135deg,${p.c1},${p.c2})`,
              border:`2px solid ${list?.palette?.c1===p.c1?'#fff':'transparent'}`,
              transition:'all .2s',transform:list?.palette?.c1===p.c1?'scale(1.14)':'scale(1)',
            }}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.18)'}
            onMouseLeave={e=>e.currentTarget.style.transform=list?.palette?.c1===p.c1?'scale(1.14)':'scale(1)'}
          />
        ))}
      </div>

      {/* Custom gradient */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:12,marginBottom:14}}>
        <div style={{fontSize:'.72rem',color:'var(--muted)',marginBottom:8}}>✨ Custom Gradient</div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:'.7rem',color:'var(--muted)'}}>From</span>
            <input type="color" value={c1} onChange={e=>setC1(e.target.value)} style={{width:28,height:28,border:'none',borderRadius:6,cursor:'pointer',padding:0,background:'none'}} />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:'.7rem',color:'var(--muted)'}}>To</span>
            <input type="color" value={c2} onChange={e=>setC2(e.target.value)} style={{width:28,height:28,border:'none',borderRadius:6,cursor:'pointer',padding:0,background:'none'}} />
          </div>
          <div style={{flex:1,minWidth:40,height:26,borderRadius:6,background:`linear-gradient(135deg,${c1},${c2})`}} />
          <button onClick={addGradient} style={{background:`linear-gradient(135deg,${c1},${c2})`,border:'none',color:'#fff',fontSize:'.75rem',fontWeight:600,padding:'6px 12px',borderRadius:7,cursor:'pointer'}}>
            Apply
          </button>
        </div>
      </div>

      <MLabel>Banner — search any keyword</MLabel>
      <div style={{position:'relative',marginBottom:7}}>
        <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:'.76rem',pointerEvents:'none'}}></i>
        <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder="gaming, ocean, neon, cats, space…"
          style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--rsm)',color:'var(--text)',fontFamily:'DM Sans,sans-serif',fontSize:'.84rem',padding:'8px 10px 8px 32px',outline:'none'}}
        />
      </div>
      <div style={{fontSize:'.65rem',color:'var(--muted)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}>
        <i className="fa-solid fa-circle-info"></i> Powered by LoremFlickr
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5,marginBottom:8,minHeight:120}}>
        {loading ? (
          <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
            <i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)'}}></i>
          </div>
        ) : imgs.map((url,i)=>(
          <ImgCell key={i} url={url} onClick={()=>onUpdate({bannerUrl:url})} />
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:10}}>
        <PageBtn disabled={page<=1} onClick={()=>{const p=page-1;setPage(p);load(search||'landscape',p);}}>← Prev</PageBtn>
        <span style={{fontSize:'.72rem',color:'var(--muted)'}}>Page {page}</span>
        <PageBtn onClick={()=>{const p=page+1;setPage(p);load(search||'landscape',p);}}>Next →</PageBtn>
      </div>

      <MFooter><BtnPrimary onClick={onClose}>Done</BtnPrimary></MFooter>
    </Modal>
  );
}

function ImgCell({ url, onClick }: { url:string; onClick:()=>void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onClick} style={{aspectRatio:'16/9',borderRadius:7,overflow:'hidden',background:'var(--surface2)',cursor:'pointer',position:'relative',border:'2px solid transparent',transition:'all .18s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='scale(1.04)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='';}}
    >
      {!loaded && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-spinner" style={{animation:'spin .8s linear infinite',color:'var(--muted)',fontSize:'.72rem'}}></i></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:loaded?1:0,transition:'opacity .35s'}}
        onLoad={()=>setLoaded(true)} onError={e=>{e.currentTarget.src=`https://loremflickr.com/480/180/nature?random=${Math.random()*9999|0}`;}} />
    </div>
  );
}

function PageBtn({ children, onClick, disabled }: { children:React.ReactNode;onClick:()=>void;disabled?:boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{background:'var(--surface)',border:'1px solid var(--border)',color:disabled?'var(--muted)':'var(--text)',fontSize:'.74rem',padding:'4px 12px',borderRadius:7,cursor:disabled?'default':'pointer',opacity:disabled?.3:1,transition:'all .2s'}}>
      {children}
    </button>
  );
}
