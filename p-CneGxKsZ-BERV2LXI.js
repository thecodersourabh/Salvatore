import{W as r,f as i,e as s,P as m,m as a}from"./index-w_e1lKC3.js";import"./ui-BgAf-vtK.js";import"./router-BpGlpfXu.js";import"./dashboard-m1-hry3t.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const f=()=>{const e=window;e.addEventListener("statusTap",()=>{r(()=>{const o=document.elementFromPoint(e.innerWidth/2,e.innerHeight/2);if(!o)return;const t=i(o);t&&new Promise(n=>s(t,n)).then(()=>{m(async()=>{t.style.setProperty("--overflow","hidden"),await a(t,300),t.style.removeProperty("--overflow")})})})})};export{f as startStatusTap};
