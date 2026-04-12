"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dashboard } from "@/lib/types";
import { PAL, fmtDateFull } from "@/lib/utils";

interface Props {
  D: Dashboard;
  onSetZoom: (z: "week" | "month" | "quarter") => void;
  onNav: (dir: number) => void;
  onGoToday: () => void;
  onOpenDate: (li: number, ti: number) => void;
}

const ZOOM_DAYS = { week: 14, month: 30, quarter: 90 };
const CELL_W_DESK = { week: 52, month: 26, quarter: 14 };
const CELL_W_MOB = { week: 34, month: 18, quarter: 10 };

export default function GanttView({
  D,
  onSetZoom,
  onNav,
  onGoToday,
  onOpenDate,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [containerW, setContainerW] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Measure available timeline width so columns fill the container exactly
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setContainerW(w);
    });
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const zoom = D.ganttZoom || "week";
  const days = ZOOM_DAYS[zoom];
  const offset = D.ganttOffset || 0;
  const mspd = 86400000;
  const nameW = isMobile ? 110 : 200;
  const minCellW = (isMobile ? CELL_W_MOB : CELL_W_DESK)[zoom];
  // If the container is wide enough, expand cellW so columns fill it exactly.
  // Otherwise use the minimum and let the user scroll.
  const availW = containerW > 0 ? Math.max(0, containerW - nameW) : 0;
  const cellW =
    availW > 0 && availW >= minCellW * days
      ? Math.floor(availW / days)
      : minCellW;
  const gridW = cellW * days;
  const rowH = isMobile ? 30 : 36;
  const barH = isMobile ? 16 : 22;

  // UTC dates
  const todayUTC = new Date();
  const today = new Date(
    Date.UTC(todayUTC.getFullYear(), todayUTC.getMonth(), todayUTC.getDate()),
  );
  const startDay = new Date(today);
  startDay.setUTCDate(startDay.getUTCDate() + offset);
  const endDay = new Date(startDay);
  endDay.setUTCDate(endDay.getUTCDate() + days - 1);
  const startMs = startDay.getTime();

  const colDates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay);
    d.setUTCDate(d.getUTCDate() + i);
    colDates.push(d);
  }

  // Build row data
  const allTasks: any[] = [];
  D.lists.forEach((lst, li) =>
    lst.tasks.forEach((t, ti) => {
      if (t.startDate || t.endDate)
        allTasks.push({
          ...t,
          li,
          ti,
          pal: lst.palette || PAL[li % PAL.length],
        });
    }),
  );

  type Grp = { title: string; pal: (typeof PAL)[0]; tasks: any[] };
  const groups: Record<number, Grp> = {};
  D.lists.forEach((lst, li) => {
    const lt = allTasks.filter((t) => t.li === li);
    if (lt.length)
      groups[li] = {
        title: lst.title,
        pal: lst.palette || PAL[li % PAL.length],
        tasks: lt,
      };
  });

  // Today line offset
  const todayOff = Math.floor((today.getTime() - startMs) / mspd) * cellW;
  const showToday = today >= startDay && today <= endDay;

  // Sync left-panel scroll with timeline scroll (vertical)
  const nameRef = useRef<HTMLDivElement>(null);

  if (!allTasks.length)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <GanttHeader
          isMobile={isMobile}
          zoom={zoom}
          startDay={startDay}
          endDay={endDay}
          onSetZoom={onSetZoom}
          onNav={onNav}
          onGoToday={onGoToday}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: ".88rem",
            border: "1px solid var(--border)",
            borderRadius: 14,
            textAlign: "center",
            padding: 40,
          }}
        >
          <div>
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
        </div>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <GanttHeader
        isMobile={isMobile}
        zoom={zoom}
        startDay={startDay}
        endDay={endDay}
        onSetZoom={onSetZoom}
        onNav={onNav}
        onGoToday={onGoToday}
      />

      {/* ── Grid ──────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          background: "#0b0b13",
        }}
      >
        {/* Left: sticky name column */}
        <div
          ref={nameRef}
          style={{
            width: nameW,
            flexShrink: 0,
            overflowY: "hidden",
            borderRight: "1px solid var(--border)",
            background: "#0e0e1a",
          }}
        >
          {/* Header cell */}
          <div
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              paddingLeft: 10,
              fontSize: isMobile ? ".6rem" : ".66rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "var(--muted)",
              borderBottom: "1px solid var(--border)",
              background: "rgba(14,14,22,.97)",
              position: "sticky",
              top: 0,
              zIndex: 5,
              flexShrink: 0,
            }}
          >
            Task
          </div>
          {/* Name rows */}
          {Object.values(groups).map((grp: Grp, gi) => [
            <div
              key={`gn${gi}`}
              style={{
                height: rowH,
                display: "flex",
                alignItems: "center",
                padding: `0 ${isMobile ? 8 : 14}px`,
                fontFamily: "Syne,sans-serif",
                fontWeight: 700,
                fontSize: isMobile ? ".72rem" : ".8rem",
                background: `linear-gradient(90deg,${grp.pal.c1}22,transparent)`,
                borderBottom: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {grp.title}
            </div>,
            ...grp.tasks.map((t: any, ri: number) => (
              <div
                key={`tn${gi}-${ri}`}
                onClick={() => onOpenDate(t.li, t.ti)}
                style={{
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  padding: `0 ${isMobile ? 8 : 14}px`,
                  fontSize: isMobile ? ".7rem" : ".8rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderBottom: "1px solid rgba(255,255,255,.04)",
                  cursor: "pointer",
                  color: t.done ? "var(--done-txt)" : "inherit",
                  textDecoration: t.done ? "line-through" : "none",
                  background: "rgba(11,11,19,.92)",
                }}
              >
                {t.done ? "✓ " : ""}
                {t.text}
              </div>
            )),
          ])}
        </div>

        {/* Right: scrollable timeline */}
        <div
          ref={outerRef}
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "auto",
            position: "relative",
          }}
          onScroll={(e) => {
            if (nameRef.current)
              nameRef.current.scrollTop = (
                e.currentTarget as HTMLDivElement
              ).scrollTop;
          }}
        >
          {/* Fixed-width inner — EXACTLY gridW, never stretches */}
          <div
            style={{
              width: gridW,
              minWidth: gridW,
              maxWidth: gridW,
              position: "relative",
            }}
          >
            {/* Header: day columns */}
            <div
              style={{
                height: 36,
                display: "flex",
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "rgba(14,14,22,.97)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {colDates.map((d, i) => {
                const isT = d.getTime() === today.getTime();
                const day = d.getUTCDay();
                const date = d.getUTCDate();
                const isWE = day === 0 || day === 6;
                const lbl =
                  zoom === "week"
                    ? isMobile
                      ? `${["S", "M", "T", "W", "T", "F", "S"][day]}${date}`
                      : `${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][day]} ${date}`
                    : (date === 1
                        ? [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ][d.getUTCMonth()] + " "
                        : "") + date;
                return (
                  <div
                    key={i}
                    style={{
                      width: cellW,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile
                        ? ".5rem"
                        : zoom === "week"
                          ? ".65rem"
                          : ".58rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: isT
                        ? "var(--accent)"
                        : isWE
                          ? "rgba(255,255,255,.25)"
                          : "var(--muted)",
                      background: isT ? "rgba(111,95,255,.18)" : "transparent",
                      boxShadow: isT ? "inset 0 -2px 0 var(--accent)" : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      borderRight: "1px solid rgba(255,255,255,.04)",
                    }}
                  >
                    {lbl}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {Object.values(groups).map((grp: Grp, gi) => [
              /* Group header row */
              <div
                key={`gr${gi}`}
                style={{
                  height: rowH,
                  display: "flex",
                  alignItems: "center",
                  background: `linear-gradient(90deg,${grp.pal.c1}18,transparent)`,
                  borderBottom: "1px solid var(--border)",
                  borderTop: "1px solid var(--border)",
                }}
              />,

              /* Task rows */
              ...grp.tasks.map((t: any, ri: number) => {
                const [sy, sm, sd] = (t.startDate || t.endDate)
                  .split("-")
                  .map(Number);
                const [ey, em, ed] = (t.endDate || t.startDate)
                  .split("-")
                  .map(Number);
                const tStart = new Date(Date.UTC(sy, sm - 1, sd));
                const tEnd = new Date(Date.UTC(ey, em - 1, ed));
                const inView = tEnd >= startDay && tStart <= endDay;
                const leftCol = Math.max(
                  0,
                  Math.floor((tStart.getTime() - startMs) / mspd),
                );
                const rightCol = Math.min(
                  days,
                  Math.ceil((tEnd.getTime() - startMs) / mspd) + 1,
                );
                // leftPx and widthPx are in exact cellW units — no table layout involved
                const leftPx = leftCol * cellW;
                const widthPx = Math.max((rightCol - leftCol) * cellW, 4);
                const ol = tStart < startDay,
                  or = tEnd > endDay;
                const br = `${ol ? 0 : 5}px ${or ? 0 : 5}px ${or ? 0 : 5}px ${ol ? 0 : 5}px`;
                const prog = t.progress || 0;
                const barTop = (rowH - barH) / 2;

                return (
                  <div
                    key={`tr${gi}-${ri}`}
                    style={{
                      height: rowH,
                      position: "relative",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      background: "rgba(11,11,19,.7)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(18,18,28,.85)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(11,11,19,.7)")
                    }
                  >
                    {/* Today line */}
                    {showToday && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: todayOff,
                          width: 1,
                          background: "rgba(255,95,160,.5)",
                          zIndex: 3,
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    {/* Bar — positioned with exact pixel math, no table influence */}
                    {inView && (
                      <div
                        onClick={() => onOpenDate(t.li, t.ti)}
                        style={{
                          position: "absolute",
                          top: barTop,
                          left: leftPx,
                          width: widthPx,
                          height: barH,
                          borderRadius: br,
                          background: `linear-gradient(90deg,${t.pal.c1},${t.pal.c2})`,
                          opacity: t.done ? 0.45 : 1,
                          overflow: "hidden",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,.3)",
                          transition: "filter .18s",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.filter =
                            "brightness(1.2)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.filter = "")
                        }
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: `${prog}%`,
                            background: "rgba(255,255,255,.25)",
                            borderRadius: "inherit",
                          }}
                        />
                        {widthPx > (isMobile ? 28 : 40) && (
                          <div
                            style={{
                              position: "absolute",
                              left: 6,
                              right: 4,
                              top: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              fontSize: isMobile ? ".52rem" : ".62rem",
                              color: "#fff",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              gap: 3,
                              zIndex: 2,
                            }}
                          >
                            {t.text}
                            {prog > 0 && !isMobile && (
                              <span
                                style={{
                                  fontSize: ".54rem",
                                  padding: "1px 4px",
                                  borderRadius: 4,
                                  background: "rgba(0,0,0,.3)",
                                  flexShrink: 0,
                                }}
                              >
                                {prog}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }),
            ])}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared header ────────────────────────────────────────────────────
function GanttHeader({
  isMobile,
  zoom,
  startDay,
  endDay,
  onSetZoom,
  onNav,
  onGoToday,
}: {
  isMobile: boolean;
  zoom: string;
  startDay: Date;
  endDay: Date;
  onSetZoom: (z: any) => void;
  onNav: (d: number) => void;
  onGoToday: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      {!isMobile && (
        <div
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 800,
            fontSize: "1.2rem",
            background: "linear-gradient(135deg,#00d26a,#ff81f5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginRight: 4,
            whiteSpace: "nowrap",
          }}
        >
          <i
            className="fa-solid fa-bars-progress"
            style={{ fontSize: ".9rem", marginRight: 7, color: "#00d26a" }}
          />
          Gantt Chart
        </div>
      )}
      <div style={{ display: "flex", gap: 3 }}>
        {(["week", "month", "quarter"] as const).map((z) => (
          <button
            key={z}
            onClick={() => onSetZoom(z)}
            style={{
              border: "1px solid",
              borderColor: zoom === z ? "var(--accent)" : "var(--border)",
              background: "var(--surface)",
              color: zoom === z ? "var(--accent)" : "var(--muted)",
              fontSize: ".72rem",
              padding: "4px 10px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {z.charAt(0).toUpperCase() + z.slice(1)}
          </button>
        ))}
      </div>
      <button onClick={() => onNav(-1)} style={navBtn}>
        <i className="fa-solid fa-chevron-left" />
      </button>
      <span
        style={{
          fontSize: ".72rem",
          color: "var(--muted)",
          whiteSpace: "nowrap",
        }}
      >
        {fmtDateFull(
          new Date(
            startDay.getUTCFullYear(),
            startDay.getUTCMonth(),
            startDay.getUTCDate(),
          ),
        )}
        {!isMobile &&
          ` — ${fmtDateFull(new Date(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate()))}`}
      </span>
      <button onClick={() => onNav(1)} style={navBtn}>
        <i className="fa-solid fa-chevron-right" />
      </button>
      <button onClick={onGoToday} style={navBtn}>
        <i className="fa-solid fa-circle-dot" />
      </button>
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
