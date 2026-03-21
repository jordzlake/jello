import { Palette } from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function fmtDate(d: string | null): string {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + (+day);
}

export function fmtDateFull(d: Date): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

export const PAL: Palette[] = [
  {c1:'#6f5fff',c2:'#ff5fa0'},{c1:'#00c6ff',c2:'#7b2ff7'},
  {c1:'#f7971e',c2:'#ffd200'},{c1:'#0ba360',c2:'#3cba92'},
  {c1:'#f953c6',c2:'#b91d73'},{c1:'#4facfe',c2:'#00f2fe'},
  {c1:'#fa709a',c2:'#fee140'},{c1:'#a18cd1',c2:'#fbc2eb'},
  {c1:'#ff6b6b',c2:'#ffa07a'},{c1:'#43e97b',c2:'#38f9d7'},
  {c1:'#667eea',c2:'#764ba2'},{c1:'#f093fb',c2:'#f5576c'},
  {c1:'#11998e',c2:'#38ef7d'},{c1:'#fc4a1a',c2:'#f7b733'},
  {c1:'#4e54c8',c2:'#8f94fb'},{c1:'#00b09b',c2:'#96c93d'},
  {c1:'#e96c4c',c2:'#f7ca18'},{c1:'#834d9b',c2:'#d04ed6'},
  {c1:'#1a1a2e',c2:'#e94560'},{c1:'#0f3460',c2:'#533483'},
  {c1:'#ff4e50',c2:'#f9d423'},{c1:'#1f4037',c2:'#99f2c8'},
  {c1:'#c94b4b',c2:'#4b134f'},{c1:'#2980b9',c2:'#6dd5fa'},
];
