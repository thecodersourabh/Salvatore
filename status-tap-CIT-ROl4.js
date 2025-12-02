import{r as i,f as a,b as m,w as p,s as c}from"./index-CdToqK_y.js";import"./ui-DNDdiJKy.js";import"./vendor-B_deTkiR.js";import"./router-BaOvApis.js";import"./dashboard-CNJmpfot.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const y=()=>{const e=window;e.addEventListener("statusTap",()=>{i(()=>{const n=e.innerWidth,s=e.innerHeight,o=document.elementFromPoint(n/2,s/2);if(!o)return;const t=a(o);t&&new Promise(r=>m(t,r)).then(()=>{p(async()=>{t.style.setProperty("--overflow","hidden"),await c(t,300),t.style.removeProperty("--overflow")})})})})};export{y as startStatusTap};
