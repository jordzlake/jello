export interface Palette { c1: string; c2: string; }

export interface Task {
  id: string;
  text: string;
  done: boolean;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  progress: number;
  archived?: boolean;
  archivedAt?: number;
}

export interface JList {
  id: string;
  title: string;
  tasks: Task[];
  palette: Palette;
  bannerUrl?: string | null;
}

export interface Dashboard {
  name: string;
  lists: JList[];
  archivedTasks: Task[];
  archivedLists: JList[];
  bgUrl: string | null;
  calYear: number;
  calMonth: number;
  ganttZoom: 'week' | 'month' | 'quarter';
  ganttOffset: number;
}

export interface GlobalState {
  activeDash: string;
  dashboards: Record<string, Dashboard>;
}
