"use client";
import { useState, useRef, useEffect } from "react";
import { JList, Task, Palette } from "@/lib/types";
import TaskCard from "./TaskCard";

interface Props {
  list: JList;
  li: number;
  palette: Palette;
  onOpenTask: (task?: Task) => void;
  onOpenStyle: () => void;
  onToggle: (ti: number) => void;
  onMoveTask: (fromLi: number, fromTi: number, toTi: number) => void;
  onMoveList: (fromLi: number, toLi: number) => void;
  onArchiveList: () => void;
  onArchiveDone: () => void;
  onUpdateTitle: (title: string) => void;
  onContextMenu: (e: React.MouseEvent, ti: number) => void;
  isListDragging: boolean;
  onListDragStart: () => void;
  onListDragEnd: () => void;
}

export default function ListCard({
  list,
  li,
  palette,
  onOpenTask,
  onOpenStyle,
  onToggle,
  onMoveTask,
  onMoveList,
  onArchiveList,
  onArchiveDone,
  onUpdateTitle,
  onContextMenu,
  isListDragging,
  onListDragStart,
  onListDragEnd,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState(list.title);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const doneCount = list.tasks.filter((t) => t.done).length;

  const titleDone = () => {
    setEditing(false);
    onUpdateTitle(titleVal.trim() || list.title);
  };

  const getDropIndex = (e: React.DragEvent): number => {
    const container = tasksRef.current;
    if (!container) return list.tasks.length;
    const taskEls = Array.from(
      container.querySelectorAll<HTMLElement>("[data-ti]"),
    );
    if (taskEls.length === 0) return 0;

    for (let i = 0; i < taskEls.length; i++) {
      const rect = taskEls[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) return i;
    }
    return list.tasks.length;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Identify what is being dragged via dataTransfer types if possible,
    // or rely on the isListDragging prop from parent
    if (isListDragging) {
      setIsDragOver(true);
      return;
    }

    setIsDragOver(true);
    setDropIndex(getDropIndex(e));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we are actually leaving the list element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const dragType = e.dataTransfer.getData("drag");

    if (dragType === "task") {
      const fromLi = parseInt(e.dataTransfer.getData("taskLi"));
      const fromTi = parseInt(e.dataTransfer.getData("taskTi"));
      const insertAt = dropIndex ?? list.tasks.length;
      if (!isNaN(fromLi) && !isNaN(fromTi)) {
        onMoveTask(fromLi, fromTi, insertAt);
      }
    } else if (dragType === "list") {
      const fromLi = parseInt(e.dataTransfer.getData("listLi"));
      // Prevent moving a list onto itself
      if (!isNaN(fromLi) && fromLi !== li) {
        onMoveList(fromLi, li);
      }
    }
    setDropIndex(null);
  };

  return (
    <div
      data-li={li}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flexShrink: 0,
        width: 290,
        background: "rgba(11,11,19,.72)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        backdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        opacity: isListDragging ? 0.4 : 1,
        transition: "all .2s ease",
        boxShadow: isDragOver ? "0 0 0 2px var(--accent)" : "none",
        transform: isDragOver && isListDragging ? "scale(1.02)" : "none",
      }}
    >
      {/* Banner Area */}
      <div
        onClick={onOpenStyle}
        style={{
          height: 70,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg,${palette.c1},${palette.c2})`,
          cursor: "pointer",
        }}
      >
        {/* Banner image — object-fit:cover is always applied immediately */}
        {list.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={list.bannerUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,transparent, rgba(11,11,19,.4))",
          }}
        />

        {/* Desktop drag handle — hidden on touch screens */}
        <div
          className="list-drag-handle list-drag-handle-desktop"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("drag", "list");
            e.dataTransfer.setData("listLi", String(li));
            onListDragStart();
          }}
          onDragEnd={onListDragEnd}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            color: "rgba(255,255,255,0.4)",
            cursor: "grab",
            padding: "4px 12px",
          }}
        >
          ⠿
        </div>

        {/* Mobile reorder arrows — shown only on touch screens via CSS class */}
        <div
          className="list-reorder-arrows"
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            gap: 4,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMoveList(li, li - 1); }}
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.8)",
              fontSize: ".85rem",
              width: 28, height: 24,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveList(li, li + 1); }}
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.8)",
              fontSize: ".85rem",
              width: 28, height: 24,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >›</button>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 12px 8px",
          gap: 8,
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={titleVal}
            autoFocus
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={titleDone}
            onKeyDown={(e) => {
              if (e.key === "Enter") titleDone();
              if (e.key === "Escape") {
                setEditing(false);
                setTitleVal(list.title);
              }
            }}
            style={{
              flex: 1,
              background: "var(--surface2)",
              border: "1px solid var(--accent)",
              borderRadius: 4,
              color: "var(--text)",
              padding: "2px 6px",
              outline: "none",
              fontSize: ".85rem",
            }}
          />
        ) : (
          <div
            onClick={() => {
              setEditing(true);
              setTimeout(() => inputRef.current?.focus(), 10);
            }}
            style={{
              fontWeight: 700,
              fontSize: ".88rem",
              flex: 1,
              cursor: "text",
            }}
          >
            {list.title}
          </div>
        )}
        <div style={{ fontSize: ".65rem", opacity: 0.6 }}>
          {doneCount}/{list.tasks.length}
        </div>

        {/* Menu Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          <i className="fa-solid fa-ellipsis-vertical" />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 10,
              top: 110,
              zIndex: 100,
              background: "#1a1a26",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <MI icon="fa-check" label="Archive Done" onClick={onArchiveDone} />
            <MI
              icon="fa-trash"
              label="Archive List"
              danger
              onClick={onArchiveList}
            />
          </div>
        )}
      </div>

      {/* Task List */}
      <div
        ref={tasksRef}
        style={{
          padding: "0 8px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 20,
        }}
      >
        {list.tasks.map((task, ti) => (
          <div key={task.id} data-ti={ti}>
            {/* Indicator for Task drop position */}
            {!isListDragging && isDragOver && dropIndex === ti && (
              <div
                style={{
                  height: 2,
                  background: "var(--accent)",
                  margin: "4px 0",
                  borderRadius: 2,
                }}
              />
            )}
            <TaskCard
              task={task}
              li={li}
              ti={ti}
              palette={palette}
              onToggle={() => onToggle(ti)}
              onContextMenu={(e) => onContextMenu(e, ti)}
            />
            <div style={{ height: 6 }} />
          </div>
        ))}

        {/* Indicator for end of list */}
        {!isListDragging && isDragOver && dropIndex === list.tasks.length && (
          <div
            style={{
              height: 2,
              background: "var(--accent)",
              margin: "4px 0",
              borderRadius: 2,
            }}
          />
        )}

        {list.tasks.length === 0 && !isListDragging && (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              fontSize: ".7rem",
              color: "var(--muted)",
              border: "1px dashed var(--border)",
              borderRadius: 8,
            }}
          >
            {isDragOver ? "Drop Task Here" : "Empty List"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 10 }}>
        <button
          onClick={() => onOpenTask()}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: ".75rem",
          }}
        >
          + Add Task
        </button>
      </div>
    </div>
  );
}

function MI({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        fontSize: ".75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: danger ? "#ff4d4d" : "inherit",
      }}
      className="menu-item-hover"
    >
      <i className={`fa-solid ${icon}`} style={{ width: 14 }} />
      {label}
    </div>
  );
}
