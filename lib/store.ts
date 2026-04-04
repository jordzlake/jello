"use client";
import { useState, useEffect, useCallback } from "react";
import { GlobalState, Dashboard, JList, Task, Palette } from "./types";
import { uid, PAL } from "./utils";

const KEY = "jello_v4";

export function emptyDash(name: string): Dashboard {
  return {
    name,
    lists: [],
    archivedTasks: [],
    archivedLists: [],
    bgUrl: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    ganttZoom: "week",
    ganttOffset: 0,
  };
}

function defaultState(): GlobalState {
  const id = uid();
  return { activeDash: id, dashboards: { [id]: emptyDash("My Board") } };
}

export function useStore() {
  const [G, setG_] = useState<GlobalState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setG_(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const setG = useCallback((updater: (prev: GlobalState) => GlobalState) => {
    setG_((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const D = G.dashboards[G.activeDash];

  // ── Dashboard ──
  const switchDash = (id: string) => setG((g) => ({ ...g, activeDash: id }));
  const newDash = (name: string) =>
    setG((g) => {
      const id = uid();
      return {
        ...g,
        activeDash: id,
        dashboards: { ...g.dashboards, [id]: emptyDash(name) },
      };
    });
  const renameDash = (id: string, name: string) =>
    setG((g) => ({
      ...g,
      dashboards: { ...g.dashboards, [id]: { ...g.dashboards[id], name } },
    }));
  const deleteDash = (id: string) =>
    setG((g) => {
      const dbs = { ...g.dashboards };
      delete dbs[id];
      const active = g.activeDash === id ? Object.keys(dbs)[0] : g.activeDash;
      return { ...g, activeDash: active, dashboards: dbs };
    });

  // ── Board helpers ──
  const updateD = (patch: Partial<Dashboard>) =>
    setG((g) => ({
      ...g,
      dashboards: { ...g.dashboards, [g.activeDash]: { ...D, ...patch } },
    }));

  // ── Lists ──
  const addList = (title: string, palette: Palette) =>
    updateD({
      lists: [...D.lists, { id: uid(), title, tasks: [], palette }],
    });
  const updateList = (li: number, patch: Partial<JList>) => {
    const lists = D.lists.map((l, i) => (i === li ? { ...l, ...patch } : l));
    updateD({ lists });
  };
  const reorderLists = (fromLi: number, toLi: number) => {
    const lists = [...D.lists];
    const [moved] = lists.splice(fromLi, 1);
    lists.splice(toLi, 0, moved);
    updateD({ lists });
  };
  const archiveList = (li: number) => {
    const lists = [...D.lists];
    const [removed] = lists.splice(li, 1);
    updateD({
      lists,
      archivedLists: [
        ...D.archivedLists,
        { ...removed, archivedAt: Date.now() } as JList,
      ],
    });
  };
  const restoreList = (i: number) => {
    const archivedLists = [...D.archivedLists];
    const [removed] = archivedLists.splice(i, 1);
    updateD({ lists: [...D.lists, removed], archivedLists });
  };

  // ── Tasks ──
  const addTask = (li: number, task: Omit<Task, "id">) => {
    const lists = D.lists.map((l, i) =>
      i !== li ? l : { ...l, tasks: [...l.tasks, { ...task, id: uid() }] },
    );
    updateD({ lists });
  };
  const updateTask = (li: number, ti: number, patch: Partial<Task>) => {
    const lists = D.lists.map((l, i) =>
      i !== li
        ? l
        : {
            ...l,
            tasks: l.tasks.map((t, j) => (j !== ti ? t : { ...t, ...patch })),
          },
    );
    updateD({ lists });
  };
  const toggleTask = (li: number, ti: number) => {
    const t = D.lists[li].tasks[ti];
    const done = !t.done;
    updateTask(li, ti, {
      done,
      progress: done && t.progress < 100 ? 100 : t.progress,
    });
  };
  const moveTask = (
    fromLi: number,
    fromTi: number,
    toLi: number,
    toTi?: number,
  ) => {
    const lists = D.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
    const [task] = lists[fromLi].tasks.splice(fromTi, 1);
    let insertAt = toTi ?? lists[toLi].tasks.length;
    if (fromLi === toLi && toTi !== undefined && toTi > fromTi) {
      insertAt = toTi - 1;
    }
    insertAt = Math.max(0, Math.min(insertAt, lists[toLi].tasks.length));
    lists[toLi].tasks.splice(insertAt, 0, task);
    updateD({ lists });
  };
  const archiveTask = (li: number, ti: number) => {
    const lists = D.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
    const [t] = lists[li].tasks.splice(ti, 1);
    updateD({
      lists,
      archivedTasks: [
        ...D.archivedTasks,
        { ...t, archived: true, archivedAt: Date.now() },
      ],
    });
  };
  const deleteTask = (li: number, ti: number) => {
    const lists = D.lists.map((l, i) =>
      i !== li ? l : { ...l, tasks: l.tasks.filter((_, j) => j !== ti) },
    );
    updateD({ lists });
  };
  const archiveDone = (li: number) => {
    const done = D.lists[li].tasks
      .filter((t) => t.done)
      .map((t) => ({ ...t, archived: true, archivedAt: Date.now() }));
    const lists = D.lists.map((l, i) =>
      i !== li ? l : { ...l, tasks: l.tasks.filter((t) => !t.done) },
    );
    updateD({ lists, archivedTasks: [...D.archivedTasks, ...done] });
  };
  const restoreTask = (i: number) => {
    const archivedTasks = [...D.archivedTasks];
    const [t] = archivedTasks.splice(i, 1);
    const lists =
      D.lists.length > 0
        ? D.lists.map((l, li) =>
            li === 0
              ? {
                  ...l,
                  tasks: [
                    ...l.tasks,
                    { ...t, archived: false, archivedAt: undefined },
                  ],
                }
              : l,
          )
        : D.lists;
    updateD({ lists, archivedTasks });
  };
  const deleteArchivedTask = (i: number) => {
    const archivedTasks = [...D.archivedTasks];
    archivedTasks.splice(i, 1);
    updateD({ archivedTasks });
  };

  // ── Settings ──
  const setBg = (url: string | null) => updateD({ bgUrl: url });
  const setCalNav = (year: number, month: number) =>
    updateD({ calYear: year, calMonth: month });
  const setGanttZoom = (zoom: Dashboard["ganttZoom"]) =>
    updateD({ ganttZoom: zoom });
  const setGanttOffset = (offset: number) => updateD({ ganttOffset: offset });

  // ── Save / Load JSON ──
  const saveJson = () => {
    const blob = new Blob([JSON.stringify(G, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jello-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const loadJson = (file: File) =>
    new Promise<void>((resolve, reject) => {
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const p = JSON.parse(ev.target!.result as string) as GlobalState;
          if (!p.dashboards || !p.activeDash) throw new Error("bad");
          setG_((prev) => {
            try {
              localStorage.setItem(KEY, JSON.stringify(p));
            } catch {}
            return p;
          });
          resolve();
        } catch {
          reject(new Error("Invalid Jello save file."));
        }
      };
      r.readAsText(file);
    });

  return {
    G,
    D,
    hydrated,
    switchDash,
    newDash,
    renameDash,
    deleteDash,
    addList,
    updateList,
    reorderLists,
    archiveList,
    restoreList,
    addTask,
    updateTask,
    toggleTask,
    moveTask,
    archiveTask,
    deleteTask,
    archiveDone,
    restoreTask,
    deleteArchivedTask,
    setBg,
    setCalNav,
    setGanttZoom,
    setGanttOffset,
    saveJson,
    loadJson,
  };
}

// ── Objectives Store ─────────────────────────────────────────────────
const OBJ_KEY = 'jello_objectives';

export function useObjectivesStore() {
  const [objectives, setObjectives_] = useState<import('./types').Objective[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OBJ_KEY);
      if (raw) setObjectives_(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const save = (objs: import('./types').Objective[]) => {
    try { localStorage.setItem(OBJ_KEY, JSON.stringify(objs)); } catch {}
    setObjectives_(objs);
  };

  const addObjective = (title: string, description: string, color: string, color2: string) => {
    const obj: import('./types').Objective = {
      id: uid(), title, description, color, color2, components: [], createdAt: Date.now(),
    };
    save([...objectives, obj]);
    return obj.id;
  };

  const updateObjective = (id: string, patch: Partial<import('./types').Objective>) => {
    save(objectives.map(o => o.id === id ? { ...o, ...patch } : o));
  };

  const deleteObjective = (id: string) => {
    save(objectives.filter(o => o.id !== id));
  };

  const addComponent = (objId: string, text: string) => {
    save(objectives.map(o => o.id !== objId ? o : {
      ...o,
      components: [...o.components, { id: uid(), text, done: false, notes: '' }],
    }));
  };

  const updateComponent = (objId: string, compId: string, patch: Partial<import('./types').ObjComponent>) => {
    save(objectives.map(o => o.id !== objId ? o : {
      ...o,
      components: o.components.map(c => c.id !== compId ? c : { ...c, ...patch }),
    }));
  };

  const deleteComponent = (objId: string, compId: string) => {
    save(objectives.map(o => o.id !== objId ? o : {
      ...o,
      components: o.components.filter(c => c.id !== compId),
    }));
  };

  return { objectives, hydrated, addObjective, updateObjective, deleteObjective, addComponent, updateComponent, deleteComponent };
}
