'use client';
import { useEffect, useRef } from 'react';
interface P { x:number;y:number;w:number;h:number;c:string;vx:number;vy:number;rot:number;rv:number;life:number; }
export default function Confetti({ burst }: { burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const running = useRef(false);
  useEffect(() => {
    if (!burst) return;
    const cvs = ref.current; if (!cvs) return;
    cvs.width = window.innerWidth; cvs.height = window.innerHeight;
    const C = ['#6f5fff','#ff81f5','#00d26a','#ffd200','#4facfe','#fa709a'];
    for (let i=0;i<130;i++) parts.current.push({
      x:Math.random()*cvs.width, y:Math.random()*cvs.height-cvs.height,
      w:Math.random()*10+5, h:Math.random()*6+3,
      c:C[~~(Math.random()*C.length)],
      vx:(Math.random()-.5)*4, vy:Math.random()*4+2,
      rot:Math.random()*360, rv:(Math.random()-.5)*8, life:1,
    });
    if (!running.current) anim(cvs);
  }, [burst]);
  const anim = (cvs: HTMLCanvasElement) => {
    running.current = true;
    const cx = cvs.getContext('2d')!;
    const frame = () => {
      cx.clearRect(0,0,cvs.width,cvs.height);
      parts.current = parts.current.filter(p=>p.life>0);
      parts.current.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.rv;
        if(p.y>cvs.height*.7) p.life-=.03; else p.vy+=.05;
        cx.save(); cx.globalAlpha=p.life; cx.translate(p.x,p.y);
        cx.rotate(p.rot*Math.PI/180); cx.fillStyle=p.c;
        cx.fillRect(-p.w/2,-p.h/2,p.w,p.h); cx.restore();
      });
      if (parts.current.length) requestAnimationFrame(frame);
      else { running.current=false; cx.clearRect(0,0,cvs.width,cvs.height); }
    };
    requestAnimationFrame(frame);
  };
  useEffect(() => {
    const fn = () => { if(ref.current){ref.current.width=window.innerWidth;ref.current.height=window.innerHeight;} };
    window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn);
  },[]);
  return <canvas ref={ref} style={{position:'fixed',inset:0,zIndex:9998,pointerEvents:'none'}} />;
}
