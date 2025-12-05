import{r as i,f as a,b as m,w as p,s as c}from"./index-2MCVXq29.js";import"./ui-w9afQ6nK.js";import"./vendor-B_deTkiR.js";import"./router-Cn4Sc231.js";import"./dashboard-PvmJpgU7.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const y=()=>{const e=window;e.addEventListener("statusTap",()=>{i(()=>{const n=e.innerWidth,s=e.innerHeight,o=document.elementFromPoint(n/2,s/2);if(!o)return;const t=a(o);t&&new Promise(r=>m(t,r)).then(()=>{p(async()=>{t.style.setProperty("--overflow","hidden"),await c(t,300),t.style.removeProperty("--overflow")})})})})};export{y as startStatusTap};
