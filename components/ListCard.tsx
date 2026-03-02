"use client";
import { useState, useRef } from "react";
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

  const done = list.tasks.filter((t) => t.done).length;

  const titleDone = () => {
    setEditing(false);
    onUpdateTitle(titleVal.trim() || list.title);
  };

  const getDropIndex = (clientY: number): number => {
    const container = tasksRef.current;
    if (!container) return list.tasks.length;
    const wrappers = Array.from(
      container.querySelectorAll<HTMLElement>("[data-task-index]"),
    );
    if (wrappers.length === 0) return 0;
    for (const wrapper of wrappers) {
      const rect = wrapper.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return parseInt(wrapper.getAttribute("data-task-index") || "0");
      }
    }
    return list.tasks.length;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isListDragging) return;
    setIsDragOver(true);
    setDropIndex(getDropIndex(e.clientY));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropIndex(null);

    const drag = e.dataTransfer.getData("drag");
    if (drag === "task") {
      const fromLi = parseInt(e.dataTransfer.getData("taskLi"));
      const fromTi = parseInt(e.dataTransfer.getData("taskTi"));
      if (!isNaN(fromLi) && !isNaN(fromTi)) {
        const visualIndex = getDropIndex(e.clientY);
        onMoveTask(fromLi, fromTi, visualIndex);
      }
    } else if (drag === "list") {
      const fromLi = parseInt(e.dataTransfer.getData("listLi"));
      if (!isNaN(fromLi) && fromLi !== li) onMoveList(fromLi, li);
    }
  };

  return (
    <div
      data-li={li}
      className={
        isListDragging ? "list-dragging" : isDragOver ? "list-drag-over" : ""
      }
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
        animation: "listIn .35s cubic-bezier(.34,1.56,.64,1)",
        transition: "box-shadow .3s,opacity .2s,transform .2s",
        boxShadow: isDragOver ? "0 0 0 4px rgba(111,95,255,.2)" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isDragOver)
          e.currentTarget.style.boxShadow = "0 8px 40px rgba(111,95,255,.13)";
      }}
      onMouseLeave={(e) => {
        if (!isDragOver) e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Banner */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".list-drag-handle")) return;
          onOpenStyle();
        }}
        style={{
          height: 70,
          position: "relative",
          overflow: "hidden",
          background: list.bannerUrl
            ? undefined
            : `linear-gradient(135deg,${palette.c1},${palette.c2})`,
          backgroundImage: list.bannerUrl ? `url(${list.bannerUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,transparent 30%,rgba(11,11,19,.55) 100%)",
          }}
        />
        <div
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            opacity: 0,
            transition: "opacity .2s",
            background: "rgba(0,0,0,.5)",
            fontSize: ".68rem",
            color: "#fff",
            letterSpacing: 1,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <i className="fa-solid fa-image"></i> Change Banner
        </div>
        <div
          className="list-drag-handle"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData("drag", "list");
            e.dataTransfer.setData("listLi", String(li));
            e.dataTransfer.effectAllowed = "move";
            onListDragStart();
          }}
          onDragEnd={onListDragEnd}
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            color: "rgba(255,255,255,.32)",
            fontSize: ".58rem",
            letterSpacing: 3,
            cursor: "grab",
            transition: "color .2s",
            userSelect: "none",
            padding: "4px 8px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,.85)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,.32)")
          }
        >
          ⠿ ⠿ ⠿
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px 7px",
          gap: 7,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            background: `linear-gradient(135deg,${palette.c1},${palette.c2})`,
          }}
        />
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
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: ".88rem",
              flex: 1,
              minWidth: 0,
              background: "var(--surface2)",
              border: "1px solid var(--accent)",
              borderRadius: 6,
              color: "var(--text)",
              padding: "2px 8px",
              outline: "none",
            }}
          />
        ) : (
          <div
            onClick={() => {
              setEditing(true);
              setTitleVal(list.title);
              setTimeout(() => inputRef.current?.select(), 50);
            }}
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: ".88rem",
              cursor: "pointer",
              flex: 1,
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              userSelect: "none",
            }}
          >
            {list.title}
          </div>
        )}
        <div
          style={{
            fontSize: ".64rem",
            color: "var(--muted)",
            background: "var(--surface)",
            borderRadius: 20,
            padding: "2px 7px",
            flexShrink: 0,
          }}
        >
          {done}/{list.tasks.length}
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
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
              fontSize: ".9rem",
              padding: "3px 5px",
              borderRadius: 6,
              transition: "all .2s",
            }}
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 400,
                background: "rgba(16,16,26,.97)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 5,
                minWidth: 188,
                boxShadow: "0 20px 60px rgba(0,0,0,.6)",
                backdropFilter: "blur(20px)",
                animation: "menuIn .15s ease",
              }}
            >
              <MI
                icon="fa-palette"
                label="Customize"
                onClick={() => {
                  onOpenStyle();
                  setMenuOpen(false);
                }}
              />
              <MI
                icon="fa-plus"
                label="Add Task"
                onClick={() => {
                  onOpenTask();
                  setMenuOpen(false);
                }}
              />
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "4px 0",
                }}
              />
              <MI
                icon="fa-check-double"
                label="Archive Done"
                onClick={() => {
                  onArchiveDone();
                  setMenuOpen(false);
                }}
              />
              <MI
                icon="fa-box-archive"
                label="Archive List"
                danger
                onClick={() => {
                  onArchiveList();
                  setMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={tasksRef}
        style={{
          padding: "0 8px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          maxHeight: 400,
          flex: 1,
          minHeight: 8,
        }}
      >
        {list.tasks.map((task, ti) => (
          <div key={task.id} data-task-index={ti} style={{ paddingBottom: 6 }}>
            {isDragOver && dropIndex === ti && (
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: "var(--accent)",
                  marginBottom: 4,
                  boxShadow: "0 0 8px rgba(111,95,255,.6)",
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
          </div>
        ))}
        {isDragOver &&
          dropIndex === list.tasks.length &&
          list.tasks.length > 0 && (
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: "var(--accent)",
                marginBottom: 6,
                boxShadow: "0 0 8px rgba(111,95,255,.6)",
              }}
            />
          )}
        {list.tasks.length === 0 && (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,.08)",
              borderRadius: "var(--rsm)",
              padding: "12px 8px",
              textAlign: "center",
              fontSize: ".72rem",
              color: "var(--muted)",
              opacity: isDragOver ? 0.8 : 0.4,
              transition: "opacity .2s",
              marginBottom: 6,
            }}
          >
            {isDragOver ? "⬇ Drop here" : "No tasks yet"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "6px 8px 11px" }}>
        <button
          onClick={() => onOpenTask()}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px dashed rgba(255,255,255,.1)",
            color: "var(--muted)",
            fontFamily: "DM Sans,sans-serif",
            fontSize: ".76rem",
            padding: 7,
            borderRadius: "var(--rsm)",
            cursor: "pointer",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.background = "rgba(111,95,255,.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <i className="fa-solid fa-plus"></i> Add task
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
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "7px 11px",
        borderRadius: 8,
        fontSize: ".78rem",
        cursor: "pointer",
        transition: "all .15s",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: danger ? "#ff6b6b" : "var(--text)",
        background: hov
          ? danger
            ? "rgba(255,107,107,.1)"
            : "var(--surface2)"
          : "transparent",
      }}
    >
      <i
        className={`fa-solid ${icon}`}
        style={{
          width: 13,
          textAlign: "center",
          color: danger ? "#ff6b6b" : "var(--muted)",
        }}
      ></i>
      {label}
    </div>
  );
}
