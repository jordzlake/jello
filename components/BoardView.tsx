'use client';
import { useState } from 'react';
import { Dashboard, JList, Task } from '@/lib/types';
import { PAL } from '@/lib/utils';
import ListCard from './ListCard';

interface Props {
  D: Dashboard;
  onOpenTask: (li: number, task?: Task) => void;
  onOpenStyle: (li: number) => void;
  onToggle: (li: number, ti: number) => void;
  onMoveTask: (fromLi: number, fromTi: number, toLi: number, toTi?: number) => void;
  onMoveList: (fromLi: number, toLi: number) => void;
  onArchiveList: (li: number) => void;
  onArchiveDone: (li: number) => void;
  onUpdateTitle: (li: number, title: string) => void;
  onContextMenu: (e: React.MouseEvent, li: number, ti: number) => void;
  onAddList: () => void;
}

export default function BoardView({ D, onOpenTask, onOpenStyle, onToggle, onMoveTask, onMoveList, onArchiveList, onArchiveDone, onUpdateTitle, onContextMenu, onAddList }: Props) {
  const [draggingLi, setDraggingLi] = useState<number | null>(null);

  return (
    <div style={{display:'flex',gap:15,alignItems:'flex-start',overflowX:'auto',paddingBottom:22,minHeight:'70vh'}}>
      {D.lists.map((list, li) => (
        <ListCard
          key={list.id}
          list={list} li={li}
          palette={list.palette || PAL[li % PAL.length]}
          onOpenTask={(task) => onOpenTask(li, task)}
          onOpenStyle={() => onOpenStyle(li)}
          onToggle={(ti) => onToggle(li, ti)}
          onMoveTask={(fromLi, fromTi, toTi) => onMoveTask(fromLi, fromTi, li, toTi)}
          onMoveList={onMoveList}
          onArchiveList={() => onArchiveList(li)}
          onArchiveDone={() => onArchiveDone(li)}
          onUpdateTitle={(title) => onUpdateTitle(li, title)}
          onContextMenu={(e, ti) => onContextMenu(e, li, ti)}
          isListDragging={draggingLi !== null && draggingLi !== li}
          onListDragStart={() => setDraggingLi(li)}
          onListDragEnd={() => setDraggingLi(null)}
        />
      ))}

      <button onClick={onAddList} style={{flexShrink:0,width:265,height:50,background:'rgba(255,255,255,.03)',border:'1.5px dashed rgba(255,255,255,.12)',borderRadius:'var(--radius)',color:'var(--muted)',fontFamily:'DM Sans,sans-serif',fontSize:'.83rem',cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:7,alignSelf:'flex-start'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.background='rgba(111,95,255,.06)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.12)';e.currentTarget.style.color='var(--muted)';e.currentTarget.style.background='rgba(255,255,255,.03)';}}
      ><i className="fa-solid fa-plus"></i> New List</button>
    </div>
  );
}
