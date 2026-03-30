"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Dashboard } from "@/lib/types";
import { PAL } from "@/lib/utils";
import "gantt-task-react/dist/index.css";

// Dynamically import to avoid SSR issues with gantt-task-react
const GanttChart = dynamic(
  () => import("gantt-task-react").then((m) => m.Gantt),
  { ssr: false },
);
const { ViewMode } = require("gantt-task-react");

interface Props {
  D: Dashboard;
  onSetZoom: (z: "week" | "month" | "quarter") => void;
  onNav: (dir: number) => void;
  onGoToday: () => void;
  onOpenDate: (li: number, ti: number) => void;
}

// Parse "YYYY-MM-DD" as local midnight — no UTC conversion, no DST math,
// just the date the user typed, rendered in their local timezone.
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// End date for gantt-task-react must be EXCLUSIVE (i.e. day after last day)
// so a task ending Apr 6 needs end = Apr 7
function parseEndDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d + 1);
}

const ZOOM_MAP = {
  week: "Day" as const,
  month: "Week" as const,
  quarter: "Month" as const,
};

export default function GanttView({
  D,
  onSetZoom,
  onNav,
  onGoToday,
  onOpenDate,
}: Props) {
  const zoom = D.ganttZoom || "week";
  const viewMode = ViewMode[ZOOM_MAP[zoom]] as any;

  // Build gantt-task-react task list — one "project" row per list, then task rows
  const tasks = useMemo(() => {
    const result: any[] = [];

    D.lists.forEach((lst, li) => {
      const datedTasks = lst.tasks
        .map((t, ti) => ({ t, ti }))
        .filter(({ t }) => t.startDate || t.endDate);

      if (datedTasks.length === 0) return;

      const pal = lst.palette || PAL[li % PAL.length];

      // Project / group header row
      const projectId = `list-${li}`;
      const allStarts = datedTasks.map(({ t }) =>
        parseDate(t.startDate || t.endDate!),
      );
      const allEnds = datedTasks.map(({ t }) =>
        parseEndDate(t.endDate || t.startDate!),
      );
      const projStart = new Date(
        Math.min(...allStarts.map((d) => d.getTime())),
      );
      const projEnd = new Date(Math.max(...allEnds.map((d) => d.getTime())));

      result.push({
        id: projectId,
        name: lst.title,
        start: projStart,
        end: projEnd,
        progress: 0,
        type: "project",
        hideChildren: false,
        styles: {
          backgroundColor: pal.c1 + "60",
          backgroundSelectedColor: pal.c1 + "90",
        },
      });

      // Task rows
      datedTasks.forEach(({ t, ti }) => {
        const start = parseDate(t.startDate || t.endDate!);
        const end = parseEndDate(t.endDate || t.startDate!);
        result.push({
          id: `task-${li}-${ti}`,
          name: t.text,
          start,
          end,
          progress: t.progress ?? 0,
          type: "task",
          project: projectId,
          isDisabled: false,
          styles: {
            backgroundColor: t.done ? "#444" : pal.c1,
            backgroundSelectedColor: t.done ? "#555" : pal.c2,
            progressColor: pal.c2,
            progressSelectedColor: pal.c1,
          },
        });
      });
    });

    return result;
  }, [D.lists]);

  const handleClick = (task: any) => {
    const match = task.id.match(/^task-(\d+)-(\d+)$/);
    if (match) onOpenDate(parseInt(match[1]), parseInt(match[2]));
  };

  const noTasks = tasks.length === 0;

  return (
    <div>
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            background: "linear-gradient(135deg,#00d26a,#ff81f5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <i
            className="fa-solid fa-bars-progress"
            style={{ fontSize: "1rem", marginRight: 8, color: "#00d26a" }}
          />
          Gantt Chart
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {(["week", "month", "quarter"] as const).map((z) => (
            <button
              key={z}
              onClick={() => onSetZoom(z)}
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: zoom === z ? "var(--accent)" : "var(--muted)",
                fontSize: ".72rem",
                padding: "4px 10px",
                borderRadius: 7,
                cursor: "pointer",
                transition: "all .2s",
                borderColor: zoom === z ? "var(--accent)" : "var(--border)",
              }}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => onNav(-1)} style={navBtn}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <button onClick={() => onNav(1)} style={navBtn}>
          <i className="fa-solid fa-chevron-right" />
        </button>
        <button onClick={onGoToday} style={navBtn}>
          <i className="fa-solid fa-circle-dot" />
        </button>
      </div>

      {noTasks ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--muted)",
            fontSize: ".88rem",
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          <i
            className="fa-solid fa-bars-progress"
            style={{
              fontSize: "2rem",
              marginBottom: 12,
              display: "block",
              opacity: 0.3,
            }}
          />
          No tasks with dates yet.
          <br />
          Add start/end dates to tasks to see them here.
        </div>
      ) : (
        <div className="jello-gantt">
          <GanttChart
            tasks={tasks}
            viewMode={viewMode}
            onClick={handleClick}
            listCellWidth="200px"
            columnWidth={zoom === "week" ? 50 : zoom === "month" ? 30 : 80}
            rowHeight={40}
            barFill={72}
            barCornerRadius={6}
            headerHeight={50}
            fontFamily="DM Sans, sans-serif"
            fontSize="12px"
            todayColor="rgba(111,95,255,0.15)"
            arrowColor="var(--accent)"
          />
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  width: 32,
  height: 32,
  borderRadius: 9,
  cursor: "pointer",
  fontSize: ".88rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
