'use client';
import { useState, useEffect } from 'react';
import Modal, { MLabel, MInput, MFooter, BtnGhost, BtnPrimary, DQBtn } from './Modal';
import { Task } from '@/lib/types';

interface Props {
  open: boolean;
  editTask: Task | null;
  onClose: () => void;
  onConfirm: (data: Omit<Task,'id'>) => void;
}

export default function TaskModal({ open, editTask, onClose, onConfirm }: Props) {
  const [text, setText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      const t = editTask;
      setText(t?.text ?? '');
      setStartDate(t?.startDate ?? '');
      setEndDate(t?.endDate ?? '');
      setStartTime(t?.startTime ?? '');
      setEndTime(t?.endTime ?? '');
      setProgress(t?.progress ?? 0);
    }
  }, [open, editTask]);

  const qd = (field: 'start'|'end', off: number | null) => {
    if (off === null) { field==='start'?setStartDate(''):setEndDate(''); return; }
    const d = new Date(); d.setDate(d.getDate()+off);
    const v = d.toISOString().split('T')[0];
    field==='start'?setStartDate(v):setEndDate(v);
  };

  const confirm = () => {
    if (!text.trim()) return;
    onConfirm({ text:text.trim(), done:editTask?.done||false, startDate:startDate||null, endDate:endDate||null, startTime:startTime||null, endTime:endTime||null, progress });
  };

  const inputStyle: React.CSSProperties = { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--rsm)', color:'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:'.84rem', padding:'8px 10px', outline:'none', transition:'border-color .2s', colorScheme:'dark' as const };

  return (
    <Modal open={open} onClose={onClose} title={<><i className="fa-solid fa-pen-to-square" style={{color:'var(--accent)'}}></i> {editTask ? 'Edit Task' : 'Add Task'}</>}>
      <MLabel>Task name *</MLabel>
      <MInput value={text} onChange={setText} placeholder="What needs doing?" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();confirm();}}} />

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div>
          <MLabel>Start date</MLabel>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
            <DQBtn onClick={()=>qd('start',0)}>Today</DQBtn>
            <DQBtn onClick={()=>qd('start',1)}>Tomorrow</DQBtn>
            <DQBtn onClick={()=>qd('start',null)}>Clear</DQBtn>
          </div>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <MLabel>End / due date</MLabel>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
            <DQBtn onClick={()=>qd('end',0)}>Today</DQBtn>
            <DQBtn onClick={()=>qd('end',7)}>+1 Wk</DQBtn>
            <DQBtn onClick={()=>qd('end',null)}>Clear</DQBtn>
          </div>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
        <div>
          <MLabel>Start time (optional)</MLabel>
          <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <MLabel>End time (optional)</MLabel>
          <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <MLabel>Progress — {progress}%</MLabel>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <input type="range" min={0} max={100} value={progress} onChange={e=>setProgress(+e.target.value)} style={{flex:1}} />
        <span style={{fontSize:'.8rem',fontWeight:600,color:'var(--accent)',minWidth:36,textAlign:'right'}}>{progress}%</span>
      </div>

      <MFooter>
        <BtnGhost onClick={onClose}>Cancel</BtnGhost>
        <BtnPrimary onClick={confirm}>
          <i className={editTask ? 'fa-solid fa-check' : 'fa-solid fa-plus'}></i> {editTask ? 'Save' : 'Add'}
        </BtnPrimary>
      </MFooter>
    </Modal>
  );
}
