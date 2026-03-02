"use client";
import { Dashboard } from "@/lib/types";
import { PAL } from "@/lib/utils";

interface Props {
  D: Dashboard;
  onNav: (dir: number) => void;
  onOpenDate: (li: number, ti: number) => void;
}
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ D, onNav, onOpenDate }: Props) {
  const { calYear: Y, calMonth: M } = D;
  const allTasks: {
    text: string;
    startDate: string | null;
    endDate: string | null;
    done: boolean;
    li: number;
    ti: number;
    isArc: boolean;
    c1: string;
  }[] = [];
  D.lists.forEach((lst, li) =>
    lst.tasks.forEach((t, ti) => {
      if (t.startDate || t.endDate)
        allTasks.push({
          ...t,
          li,
          ti,
          isArc: false,
          c1: (lst.palette || PAL[li % PAL.length]).c1,
        });
    }),
  );
  D.archivedTasks.forEach((t) => {
    if (t.startDate || t.endDate)
      allTasks.push({ ...t, li: -1, ti: -1, isArc: true, c1: PAL[0].c1 });
  });

  const fd = new Date(Y, M, 1).getDay();
  const dim = new Date(Y, M + 1, 0).getDate();
  const pdim = new Date(Y, M, 0).getDate();
  const today = new Date();
  const cells = Math.ceil((fd + dim) / 7) * 7;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => onNav(-1)} style={navBtn}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div
          style={{
            fontFamily: "Syne,sans-serif",
            fontWeight: 800,
            fontSize: "1.35rem",
            background: "linear-gradient(135deg,#00d26a,#ff81f5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            width: 240,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {MONTHS[M]} {Y}
        </div>
        <button onClick={() => onNav(1)} style={navBtn}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,minmax(0,1fr))",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              background: "rgba(18,18,28,.92)",
              padding: "8px 5px",
              fontSize: ".68rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--muted)",
              textAlign: "center",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {d}
          </div>
        ))}
        {Array.from({ length: cells }, (_, i) => {
          let day: number,
            tm = true;
          if (i < fd) {
            day = pdim - fd + i + 1;
            tm = false;
          } else if (i >= fd + dim) {
            day = i - fd - dim + 1;
            tm = false;
          } else day = i - fd + 1;
          const isToday =
            tm &&
            day === today.getDate() &&
            M === today.getMonth() &&
            Y === today.getFullYear();
          const ds = tm
            ? `${Y}-${String(M + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          const dayTasks = ds
            ? allTasks.filter(
                (t) =>
                  t.startDate === ds ||
                  t.endDate === ds ||
                  (t.startDate &&
                    t.endDate &&
                    ds >= t.startDate &&
                    ds <= t.endDate),
              )
            : [];

          return (
            <div
              key={i}
              style={{
                background: isToday
                  ? "rgba(111,95,255,.08)"
                  : "rgba(11,11,19,.8)",
                minHeight: 92,
                padding: 6,
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                transition: "background .2s",
                opacity: tm ? 1 : 0.34,
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (tm)
                  (e.currentTarget as HTMLElement).style.background = isToday
                    ? "rgba(111,95,255,.12)"
                    : "rgba(18,18,28,.9)";
              }}
              onMouseLeave={(e) => {
                if (tm)
                  (e.currentTarget as HTMLElement).style.background = isToday
                    ? "rgba(111,95,255,.08)"
                    : "rgba(11,11,19,.8)";
              }}
            >
              <div
                style={{
                  fontSize: ".74rem",
                  fontWeight: 600,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 3,
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "#fff" : "inherit",
                }}
              >
                {day}
              </div>
              {dayTasks.slice(0, 3).map((t, j) => (
                <div
                  key={j}
                  onClick={() => !t.isArc && onOpenDate(t.li, t.ti)}
                  style={{
                    fontSize: ".62rem",
                    borderRadius: 4,
                    padding: "2px 5px",
                    marginBottom: 2,
                    cursor: t.isArc ? "default" : "pointer",
                    transition: "all .15s",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    borderLeft: `3px solid ${t.c1}`,
                    background: `${t.c1}18`,
                    color: t.done ? "var(--muted)" : "var(--text)",
                    opacity: t.done ? 0.38 : t.isArc ? 0.24 : 1,
                    textDecoration: t.done ? "line-through" : "none",
                    fontStyle: t.isArc ? "italic" : "normal",
                    lineHeight: 1.35,
                  }}
                  onMouseEnter={(e) => {
                    if (!t.isArc) {
                      (e.currentTarget as HTMLElement).style.opacity = ".75";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateX(2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = t.done
                      ? ".38"
                      : t.isArc
                        ? ".24"
                        : "1";
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}
                >
                  {t.done ? "✓ " : ""}
                  {t.isArc ? "📦 " : ""}
                  {t.text}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <div
                  style={{
                    fontSize: ".62rem",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  +{dayTasks.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
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
  transition: "all .2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
