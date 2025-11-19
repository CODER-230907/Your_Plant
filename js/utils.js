// utils.js
export function uid(){ if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,9); }
export function loadJSON(key, fallback=[]){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ console.error('parse',e); return fallback; } }
export function saveJSON(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){ console.error('save',e); } }
export function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
export function placeholderSvg(text){ const txt = encodeURIComponent(text); return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='320'><rect width='100%' height='100%' fill='%23eef'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='20'>${txt}</text></svg>`; }
