"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { Task, Palette } from "@/lib/types";
import { PAL, uid } from "@/lib/utils";

import Header, { ViewType } from "./Header";
import BoardView from "./BoardView";
import CalendarView from "./CalendarView";
import GanttView from "./GanttView";
import TaskModal from "./TaskModal";
import ListStyleModal from "./ListStyleModal";
import BgModal from "./BgModal";
import ArchivePanel from "./ArchivePanel";
import ContextMenu from "./ContextMenu";
import Confetti from "./Confetti";
import Toast from "./Toast";
import Modal, { MLabel, MInput, MFooter, BtnGhost, BtnPrimary } from "./Modal";

export default function App() {
  const store = useStore();
  const { G, D, hydrated } = store;

  const [view, setView] = useState<ViewType>("board");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [confetti, setConfetti] = useState(0);

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [pendingLi, setPendingLi] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [styleLi, setStyleLi] = useState(0);

  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Date modal (from ctx / gantt / calendar click)
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [dateLi, setDateLi] = useState(0);
  const [dateTi, setDateTi] = useState(0);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Dashboard modals
  const [dashModalOpen, setDashModalOpen] = useState(false);
  const [dashEditId, setDashEditId] = useState<string | null>(null);
  const [dashName, setDashName] = useState("");

  // New list modal
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListPal, setNewListPal] = useState<Palette>(PAL[0]);

  // Context menu
  const [ctx, setCtx] = useState<{
    x: number;
    y: number;
    li: number;
    ti: number;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  // Apply background
  useEffect(() => {
    if (!hydrated) return;
    const url = D?.bgUrl;
    const layer = document.getElementById("bg-layer");
    if (layer) {
      layer.style.backgroundImage = url ? `url(${url})` : "";
      layer.style.opacity = url ? "1" : "0";
    }
  }, [D?.bgUrl, hydrated]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtx(null);
        setArchiveOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!hydrated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--muted)",
          fontSize: ".88rem",
        }}
      >
        <i
          className="fa-solid fa-spinner"
          style={{ animation: "spin .8s linear infinite", marginRight: 10 }}
        ></i>
      </div>
    );
  }

  // ── Task actions ──
  const openTaskModal = (li: number, task?: Task) => {
    setPendingLi(li);
    setEditingTask(task || null);
    setTaskModalOpen(true);
  };
  const confirmTask = (data: Omit<Task, "id">) => {
    if (editingTask) {
      const li = D.lists.findIndex((l) =>
        l.tasks.some((t) => t.id === editingTask.id),
      );
      const ti = D.lists[li]?.tasks.findIndex((t) => t.id === editingTask.id);
      if (li >= 0 && ti >= 0) store.updateTask(li, ti, data);
      showToast("Task updated ✦");
    } else {
      store.addTask(pendingLi, data);
      showToast("Task added ✦");
    }
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const openDateModal = (li: number, ti: number) => {
    setDateLi(li);
    setDateTi(ti);
    const t = D.lists[li]?.tasks[ti];
    setDateStart(t?.startDate || "");
    setDateEnd(t?.endDate || "");
    setDateModalOpen(true);
    setCtx(null);
  };

  const confirmDate = () => {
    store.updateTask(dateLi, dateTi, {
      startDate: dateStart || null,
      endDate: dateEnd || null,
    });
    setDateModalOpen(false);
    showToast("Dates saved");
  };

  // ── Context menu ──
  const showCtx = (e: React.MouseEvent, li: number, ti: number) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, li, ti });
  };

  // ── Toggles ──
  const handleToggle = (li: number, ti: number) => {
    const wasDone = D.lists[li].tasks[ti].done;
    store.toggleTask(li, ti);
    if (!wasDone) setConfetti((c) => c + 1);
  };

  // ── Dashboard ──
  const openNewDash = () => {
    setDashEditId(null);
    setDashName("");
    setDashModalOpen(true);
  };
  const openRenameDash = (id: string) => {
    setDashEditId(id);
    setDashName(G.dashboards[id].name);
    setDashModalOpen(true);
  };
  const confirmDash = () => {
    if (!dashName.trim()) return;
    if (dashEditId) {
      store.renameDash(dashEditId, dashName.trim());
      showToast("Renamed");
    } else {
      store.newDash(dashName.trim());
      showToast("Dashboard created ✦");
    }
    setDashModalOpen(false);
  };
  const handleDeleteDash = (id: string) => {
    if (Object.keys(G.dashboards).length === 1) {
      showToast("Cannot delete the only dashboard");
      return;
    }
    if (!confirm(`Delete "${G.dashboards[id].name}"?`)) return;
    store.deleteDash(id);
    showToast("Dashboard deleted");
  };

  // ── New list ──
  const confirmNewList = () => {
    if (!newListName.trim()) return;
    store.addList(newListName.trim(), newListPal);
    setNewListOpen(false);
    setNewListName("");
    showToast("List created ✦");
  };

  const dateInputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--rsm)",
    color: "var(--text)",
    fontFamily: "DM Sans,sans-serif",
    fontSize: ".84rem",
    padding: "8px 10px",
    outline: "none",
    transition: "border-color .2s",
    colorScheme: "dark" as any,
  };

  return (
    <>
      {/* Background layers */}
      <div
        id="bg-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0,
          transition: "opacity .6s",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(135deg,rgba(11,11,19,.9),rgba(11,11,19,.74))",
          backdropFilter: "blur(3px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          G={G}
          view={view}
          onViewChange={setView}
          onOpenBg={() => setBgModalOpen(true)}
          onOpenArchive={() => setArchiveOpen(!archiveOpen)}
          onSaveJson={() => {
            store.saveJson();
            showToast("Saved ✦");
          }}
          onLoadJson={async (f) => {
            try {
              await store.loadJson(f);
              showToast("State loaded ✦");
            } catch (e: any) {
              alert(e.message);
            }
          }}
          onSwitchDash={store.switchDash}
          onNewDash={openNewDash}
          onRenameDash={openRenameDash}
          onDeleteDash={handleDeleteDash}
        />

        <main
          style={{
            position: "relative",
            zIndex: 2,
            padding: 20,
            flex: 1,
          }}
        >
          {view === "board" && (
            <BoardView
              D={D}
              onOpenTask={openTaskModal}
              onOpenStyle={(li) => {
                setStyleLi(li);
                setStyleModalOpen(true);
              }}
              onToggle={handleToggle}
              onMoveTask={store.moveTask}
              onMoveList={store.reorderLists}
              onArchiveList={(li) => {
                store.archiveList(li);
                showToast("List archived");
              }}
              onArchiveDone={(li) => {
                store.archiveDone(li);
                showToast("Done tasks archived");
              }}
              onUpdateTitle={(li, title) => store.updateList(li, { title })}
              onContextMenu={showCtx}
              onAddList={() => {
                setNewListName("");
                setNewListPal(PAL[D.lists.length % PAL.length]);
                setNewListOpen(true);
              }}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              D={D}
              onNav={(dir) => {
                let m = D.calMonth + dir,
                  y = D.calYear;
                if (m > 11) {
                  m = 0;
                  y++;
                }
                if (m < 0) {
                  m = 11;
                  y--;
                }
                store.setCalNav(y, m);
              }}
              onOpenDate={openDateModal}
            />
          )}
          {view === "gantt" && (
            <GanttView
              D={D}
              onSetZoom={store.setGanttZoom}
              onNav={(dir) =>
                store.setGanttOffset(
                  D.ganttOffset +
                    dir *
                      Math.ceil(
                        (D.ganttZoom === "week"
                          ? 14
                          : D.ganttZoom === "month"
                            ? 30
                            : 90) / 2,
                      ),
                )
              }
              onGoToday={() => store.setGanttOffset(0)}
              onOpenDate={openDateModal}
            />
          )}
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        editTask={editingTask}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onConfirm={confirmTask}
      />

      {/* List Style Modal */}
      <ListStyleModal
        open={styleModalOpen}
        list={D.lists[styleLi] || null}
        onClose={() => setStyleModalOpen(false)}
        onUpdate={(patch) => store.updateList(styleLi, patch)}
      />

      {/* BG Modal */}
      <BgModal
        open={bgModalOpen}
        onClose={() => setBgModalOpen(false)}
        onSelect={(url) => {
          store.setBg(url);
          showToast("Background updated ✦");
        }}
        onClear={() => {
          store.setBg(null);
          showToast("Background cleared");
        }}
      />

      {/* Date Modal */}
      <Modal
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        title={
          <>
            <i
              className="fa-regular fa-calendar-check"
              style={{ color: "var(--accent)" }}
            ></i>{" "}
            Edit Task Dates
          </>
        }
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div>
            <MLabel>Start date</MLabel>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              style={dateInputStyle}
            />
          </div>
          <div>
            <MLabel>End / due date</MLabel>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              style={dateInputStyle}
            />
          </div>
        </div>
        <MFooter>
          <BtnGhost onClick={() => setDateModalOpen(false)}>Cancel</BtnGhost>
          <BtnPrimary onClick={confirmDate}>Save</BtnPrimary>
        </MFooter>
      </Modal>

      {/* Dashboard Modal */}
      <Modal
        open={dashModalOpen}
        onClose={() => setDashModalOpen(false)}
        title={
          <>
            <i
              className="fa-solid fa-table-columns"
              style={{ color: "var(--accent)" }}
            ></i>{" "}
            {dashEditId ? "Rename Dashboard" : "New Dashboard"}
          </>
        }
      >
        <MLabel>Dashboard name</MLabel>
        <MInput
          value={dashName}
          onChange={setDashName}
          placeholder="e.g. Work, Personal, Side Project…"
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmDash();
          }}
        />
        <MFooter>
          <BtnGhost onClick={() => setDashModalOpen(false)}>Cancel</BtnGhost>
          <BtnPrimary onClick={confirmDash}>
            {dashEditId ? "Rename" : "Create"}
          </BtnPrimary>
        </MFooter>
      </Modal>

      {/* New List Modal */}
      <Modal
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        title={
          <>
            <i
              className="fa-solid fa-rectangle-list"
              style={{ color: "var(--accent)" }}
            ></i>{" "}
            New List
          </>
        }
      >
        <MLabel>List name</MLabel>
        <MInput
          value={newListName}
          onChange={setNewListName}
          placeholder="e.g. To Do, In Progress, Done…"
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmNewList();
          }}
        />
        <MLabel>Color theme</MLabel>
        <div
          style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}
        >
          {PAL.map((p, i) => (
            <div
              key={i}
              onClick={() => setNewListPal(p)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                cursor: "pointer",
                flexShrink: 0,
                background: `linear-gradient(135deg,${p.c1},${p.c2})`,
                border: `2px solid ${newListPal.c1 === p.c1 ? "#fff" : "transparent"}`,
                transition: "all .2s",
                transform: newListPal.c1 === p.c1 ? "scale(1.14)" : "scale(1)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  newListPal.c1 === p.c1 ? "scale(1.14)" : "scale(1)")
              }
            />
          ))}
        </div>
        <MFooter>
          <BtnGhost onClick={() => setNewListOpen(false)}>Cancel</BtnGhost>
          <BtnPrimary onClick={confirmNewList}>
            <i className="fa-solid fa-plus"></i> Create
          </BtnPrimary>
        </MFooter>
      </Modal>

      {/* Archive Panel */}
      <ArchivePanel
        open={archiveOpen}
        D={D}
        onClose={() => setArchiveOpen(false)}
        onRestoreList={(i) => {
          store.restoreList(i);
          showToast("List restored");
        }}
        onRestoreTask={(i) => {
          store.restoreTask(i);
          showToast("Task restored");
        }}
        onDeleteTask={(i) => {
          store.deleteArchivedTask(i);
        }}
      />
      {archiveOpen && (
        <div
          onClick={() => setArchiveOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 499,
            background: "rgba(0,0,0,.4)",
          }}
        />
      )}

      {/* Context Menu */}
      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          visible={!!ctx}
          onClose={() => setCtx(null)}
          onEdit={() => {
            const t = D.lists[ctx.li].tasks[ctx.ti];
            openTaskModal(ctx.li, t);
            setCtx(null);
          }}
          onDate={() => openDateModal(ctx.li, ctx.ti)}
          onToggle={() => {
            handleToggle(ctx.li, ctx.ti);
            setCtx(null);
          }}
          onArchive={() => {
            store.archiveTask(ctx.li, ctx.ti);
            showToast("Task archived");
            setCtx(null);
          }}
          onDelete={() => {
            store.deleteTask(ctx.li, ctx.ti);
            showToast("Task deleted");
            setCtx(null);
          }}
        />
      )}

      <Confetti burst={confetti} />
      <Toast msg={toastMsg} />
    </>
  );
}
