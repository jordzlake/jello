'use client';
export default function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position:'fixed', bottom:18, left:'50%', transform:'translateX(-50%)',
      background:'rgba(16,16,26,.97)', border:'1px solid var(--border)',
      borderRadius:10, padding:'9px 16px', fontSize:'.8rem', zIndex:9990,
      boxShadow:'0 8px 36px rgba(0,0,0,.45)', backdropFilter:'blur(20px)',
      color:'var(--text)', whiteSpace:'nowrap', animation:'fadeIn .25s ease',
      pointerEvents:'none',
    }}>
      {msg}
    </div>
  );
}
