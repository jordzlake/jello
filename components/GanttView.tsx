'use client';
import { Dashboard } from '@/lib/types';
import { PAL, fmtDateFull } from '@/lib/utils';

interface Props { D: Dashboard; onSetZoom:(z:'week'|'month'|'quarter')=>void; onNav:(dir:number)=>void; onGoToday:()=>void; onOpenDate:(li:number,ti:number)=>void; }
const ZOOM_DAYS = { week:14, month:30, quarter:90 };
const CELL_W = { week:52, month:26, quarter:14 };

export default function GanttView({ D, onSetZoom, onNav, onGoToday, onOpenDate }: Props) {
  const zoom = D.ganttZoom || 'week';
  const days = ZOOM_DAYS[zoom];
  const cellW = CELL_W[zoom];
  const offset = D.ganttOffset || 0;

  // Use UTC midnight throughout to avoid DST skew
  const todayUTC = new Date(); 
  const today = new Date(Date.UTC(todayUTC.getFullYear(), todayUTC.getMonth(), todayUTC.getDate()));
  const startDay = new Date(today); startDay.setUTCDate(startDay.getUTCDate()+offset);
  const endDay = new Date(startDay); endDay.setUTCDate(endDay.getUTCDate()+days-1);

  const colDates: Date[] = [];
  for(let i=0;i<days;i++){const d=new Date(startDay);d.setUTCDate(d.getUTCDate()+i);colDates.push(d);}

  const allTasks: any[]=[];
  D.lists.forEach((lst,li)=>lst.tasks.forEach((t,ti)=>{
    if(t.startDate||t.endDate) allTasks.push({...t,li,ti,pal:lst.palette||PAL[li%PAL.length]});
  }));

  type Grp = { title:string; pal:typeof PAL[0]; tasks:any[] };
  const groups: Record<number,Grp> = {};
  D.lists.forEach((lst,li)=>{
    const lt = allTasks.filter(t=>t.li===li);
    if(lt.length) groups[li]={title:lst.title,pal:lst.palette||PAL[li%PAL.length],tasks:lt};
  });

  const gridW = cellW*days;
  const mspd = 86400000;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:'1.35rem',background:'linear-gradient(135deg,#00d26a,#ff81f5)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          <i className="fa-solid fa-bars-progress" style={{fontSize:'1rem',marginRight:8,color:'#00d26a'}}></i>Gantt Chart
        </div>
        <div style={{display:'flex',gap:3}}>
          {(['week','month','quarter'] as const).map(z=>(
            <button key={z} onClick={()=>onSetZoom(z)}
              style={{border:'1px solid var(--border)',background:'var(--surface)',color:zoom===z?'var(--accent)':'var(--muted)',fontSize:'.72rem',padding:'4px 10px',borderRadius:7,cursor:'pointer',transition:'all .2s',borderColor:zoom===z?'var(--accent)':'var(--border)'}}>
              {z.charAt(0).toUpperCase()+z.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={()=>onNav(-1)} style={navBtn}><i className="fa-solid fa-chevron-left"></i></button>
        <span style={{fontSize:'.78rem',color:'var(--muted)',whiteSpace:'nowrap'}}>{fmtDateFull(new Date(startDay.getUTCFullYear(),startDay.getUTCMonth(),startDay.getUTCDate()))} — {fmtDateFull(new Date(endDay.getUTCFullYear(),endDay.getUTCMonth(),endDay.getUTCDate()))}</span>
        <button onClick={()=>onNav(1)} style={navBtn}><i className="fa-solid fa-chevron-right"></i></button>
        <button onClick={onGoToday} style={navBtn}><i className="fa-solid fa-circle-dot"></i></button>
      </div>

      <div style={{overflowX:'auto',borderRadius:14,border:'1px solid var(--border)'}}>
        {!allTasks.length ? (
          <div style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:'.88rem'}}>
            <i className="fa-solid fa-bars-progress" style={{fontSize:'2rem',marginBottom:12,display:'block',opacity:.3}}></i>
            No tasks with dates yet.<br/>Add start/end dates to tasks to see them here.
          </div>
        ) : (
          <table style={{minWidth:'100%',borderCollapse:'collapse',tableLayout:'fixed',width:200+gridW}}>
            <colgroup>
              <col style={{width:200}}/>
              {colDates.map((_,i)=><col key={i} style={{width:cellW}}/>)}
            </colgroup>
            <thead>
              <tr>
                <th style={{...thStyle,textAlign:'left',paddingLeft:14,position:'sticky',left:0,zIndex:20,background:'rgba(18,18,28,.95)'}}>Task</th>
                {colDates.map((d,i)=>{
                  const isT = d.getTime()===today.getTime();
                  const lbl = zoom==='week'
                    ? `${['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()]} ${d.getDate()}`
                    : (d.getDate()===1?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' ':'')+d.getDate();
                  return <th key={i} style={{...thStyle,background:isT?'rgba(111,95,255,.22)':'rgba(18,18,28,.95)',color:isT?'var(--accent)':'var(--muted)',whiteSpace:'nowrap',fontSize:zoom==='week'?'.66rem':'.58rem'}}>{lbl}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {Object.values(groups).map((grp:Grp,gi)=>[
                <tr key={`g${gi}`}>
                  <td colSpan={days+1} style={{background:`linear-gradient(90deg,${grp.pal.c1}28,transparent)`,padding:'7px 14px',fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:'.8rem',borderBottom:'1px solid var(--border)'}}>
                    {grp.title}
                  </td>
                </tr>,
                ...grp.tasks.map((t:any,ri:number)=>{
                  // Parse as UTC to avoid DST shifting the date
                  const [sy,sm,sd] = (t.startDate||t.endDate).split('-').map(Number);
                  const [ey,em,ed] = (t.endDate||t.startDate).split('-').map(Number);
                  const tStart = new Date(Date.UTC(sy,sm-1,sd));
                  const tEnd   = new Date(Date.UTC(ey,em-1,ed));
                  const inView = tEnd>=startDay && tStart<=endDay;
                  const startMs = startDay.getTime();
                  // Use floor/ceil so fractional ms from any timezone edge never truncates a column
                  const leftCol  = Math.max(0,    Math.floor((tStart.getTime()-startMs)/mspd));
                  const rightCol = Math.min(days,  Math.ceil((tEnd.getTime()  -startMs)/mspd)+1);
                  const leftPx  = leftCol  * cellW;
                  const widthPx = Math.max((rightCol - leftCol) * cellW, 6);
                  const ol = tStart<startDay, or = tEnd>endDay;
                  const br = `${ol?0:6}px ${or?0:6}px ${or?0:6}px ${ol?0:6}px`;
                  const prog = t.progress||0;
                  const todayOff = Math.floor((today.getTime()-startMs)/mspd)*cellW;
                  const showTodayLine = today>=startDay && today<=endDay;
                  return (
                    <tr key={`t${gi}-${ri}`} style={{background:'rgba(11,11,19,.7)',borderBottom:'1px solid rgba(255,255,255,.04)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(18,18,28,.8)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(11,11,19,.7)'}
                    >
                      <td onClick={()=>onOpenDate(t.li,t.ti)} title={t.text}
                        style={{padding:'8px 14px',fontSize:'.8rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:200,maxWidth:200,position:'sticky',left:0,background:'rgba(11,11,19,.85)',borderRight:'1px solid var(--border)',cursor:'pointer',zIndex:5,color:t.done?'var(--done-txt)':'inherit',textDecoration:t.done?'line-through':'none',verticalAlign:'middle'}}
                      >
                        {t.done?'✓ ':''}{t.text}
                        {t.startTime&&<div style={{fontSize:'.58rem',color:'var(--muted)'}}>{t.startTime}{t.endTime?'–'+t.endTime:''}</div>}
                      </td>
                      <td colSpan={days} style={{padding:0,position:'relative',height:36,verticalAlign:'middle'}}>
                        {showTodayLine && <div style={{position:'absolute',top:0,bottom:0,left:todayOff,width:2,background:'rgba(255,95,160,.55)',zIndex:4,pointerEvents:'none'}}/>}
                        {inView && (
                          <div onClick={()=>onOpenDate(t.li,t.ti)} title={`${t.text} · ${prog}%`}
                            style={{position:'absolute',top:7,left:leftPx,width:widthPx,height:22,borderRadius:br,background:`linear-gradient(90deg,${t.pal.c1},${t.pal.c2})`,opacity:t.done?.5:1,overflow:'hidden',cursor:'pointer',transition:'filter .2s'}}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.filter='brightness(1.2)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.filter=''}
                          >
                            <div style={{position:'absolute',inset:0,width:`${prog}%`,background:'rgba(255,255,255,.28)',borderRadius:'inherit'}}/>
                            {widthPx>40&&<div style={{position:'absolute',left:8,right:4,top:0,bottom:0,display:'flex',alignItems:'center',fontSize:'.62rem',color:'#fff',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',gap:4,zIndex:2}}>
                              {t.text}{prog>0&&<span style={{fontSize:'.58rem',padding:'1px 5px',borderRadius:4,background:'rgba(0,0,0,.3)',flexShrink:0}}>{prog}%</span>}
                            </div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ])}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding:'8px 6px',fontSize:'.66rem',fontWeight:600,textTransform:'uppercase',letterSpacing:.7,color:'var(--muted)',textAlign:'center',borderRight:'1px solid var(--border)',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:10 };
const navBtn: React.CSSProperties = { background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',width:32,height:32,borderRadius:9,cursor:'pointer',fontSize:'.88rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 };
