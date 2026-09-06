var x="__framer_force_showing_editorbar_since",w="__framer_editor_button_position",s="2147483647";var O=300;var i=12,d="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAApNJREFUSA2tlUtLlFEYgEe7mtFFQ8NLFBG1SJAwahtiLVy5ceVSEPQH1LZf0Lp9FO1bdYNyI7gyBFcS2kAzilYq3sfxeYZ55Zv6FGfohWfOd97vnPd23u9MXeZoaeb1Q7gPHXAFzsAS5GACxiEPqVKXqs1kmtAPQi+cAtedToz1PJ8ExxPwDl7CAlRImoN7rBiF86ABHTiGAzMIh8n3O+ifwWc4EL0n5TGTYQijvjNSxbUadozInUeGZ3nuh1WYgpIkM+hGMwYajAgdrfUn+AaLoLTCAxiAOxCZxL4RdB+gZMjxEjwHo4hS8Jh5DR9hz0mKaNizegoNEI7Wee6FXJTISG6AUgDr+QImoAiHie+mwZJow/PRps4uwnsnRj8Epqc4voVJJ8eULOtW4BFYYjPpgjc+3IWI2sh/wFeoVl6xYQ48dDGLfjOwc/ygQqz595hUMVouS9QHBm4l6k3HWpnBLqicgVrlCxujSbR1Swd+UDpQYRS/oVaZZ2MWwlZBB9Zdxf+QTYw8SRgq6sAvz7vH6JULEB9USVHFjzZskgPRQR4ayxoXXIdaHdg9HrB2rErByWxZERnYtrWUzD0esDbtTmXPhzXwHrKLxEUbYGbVyDkWWwkdadfqbPmwDXZSCyh2VAf8BM/nOOJH5Y0QopMt2I5U/KO4DZZJB47XwEX+ex0mGroMV8sLwp56gyuGwiyW4SZ4c8bt2cZzO7jBNeqtsRHbeZ1g9krsMbhfYPv/c5gecA+4yAVuitFszE5Hjva872OMdXagF19JIoOYWyozMTI3J0tmA6gLvXPfO1cc/XOqOLe/HbjwD8yCXRD3VNJROEgatiRZMJsKsbZHia3nAdphtq8fkiWyXJbBe8uM1aXKPouNnz2Bm1kwAAAAAElFTkSuQmCC",l="__framer-editorbar-container",a="__framer-editorbar-label",f="__framer-editorbar-button",u="__framer-editorbar-loading-spinner",E="__framer-editorbar-button-tooltip-visible",m=`
#${l} {
    align-items: center;
    display: flex;
    gap: 8px;
    position: fixed;
    z-index: calc(${s});
    width: max-content;
    cursor: pointer;
}

#${a} {
    background-color: #111;
    border-radius: 8px;
    font-family: "Inter", "Inter-Regular", system-ui, Arial, sans-serif;
    font-size: 12px;
    height: fit-content;
    opacity: 0;
    padding: 4px 8px;
    transition: opacity 0.4s ease-out;
    font-weight: 500;
    flex-shrink: 0;
    position: fixed;
    width: max-content;
    pointer-events: none;
    user-select: none;
}

#${f} {
    all: unset;
    align-items: center;
    border-radius: 15px;
    display: flex;
    height: 30px;
    justify-content: center;
    width: 30px;
    flex-shrink: 0;
}

#${a}.${E} {
    opacity: 1;
}

#${a}, #${f} {
    backdrop-filter: blur(10px);
    background-color: rgba(34, 34, 34, 0.8);
    box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px 0px, rgba(0, 0, 0, 0.05) 0px 1px 0px 0px, rgba(255, 255, 255, 0.15) 0px 0px 0px 1px;
    color: #fff;
}

#${u} {
    width: ${i}px;
    height: ${i}px;
    -webkit-mask: url(${d});
    mask: url(${d});
    -webkit-mask-size: ${i}px;
    mask-size: ${i}px;
    background-color: #fff;


    animation-duration: 800ms;
    animation-iteration-count: infinite;
    animation-name: __framer-loading-spin;
    animation-timing-function: linear;
}

@keyframes __framer-loading-spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
`,A=document.createElement("style");A.innerHTML=m;document.head.appendChild(A);function _(n){let e=window.__framer_editorBarDependencies;if(!e)throw new Error("Dependencies not found");if(e.__version<1||e.__version>3)throw new Error("Unsupported version");let t=e[n];if(!t)throw new Error("Dependency not found");return t}var{createElement:c,memo:T,useCallback:y,useEffect:L,useRef:B,useState:k,useLayoutEffect:N}=_("react");function U(n,e,t){let{children:r,...o}=e??{};return t!==void 0&&(o.key=t),c(n,o,r)}function Y(n,e,t){let{children:r,...o}=e??{};return t!==void 0&&(o.key=t),c(n,o,...r)}var p=class extends Error{};function H(n,e){if(n)return;if(typeof e=="function")try{e=e()}catch{e="(assert message threw)"}typeof e=="string"&&e.length>2048&&(e=e.slice(0,2048)+"\u2026");let t=new p(e?"Assertion Error: "+e:"Assertion Error");if(t.stack)try{let r=t.stack.split(`
`);r[1]?.includes("assert")?(r.splice(1,1),t.stack=r.join(`
`)):r[0]?.includes("assert")&&(r.splice(0,1),t.stack=r.join(`
`))}catch{}throw t}function C(n,e){throw e instanceof Error?e:e!==void 0?new Error(String(e)):new Error(n?`Unexpected value: ${n}`:"Application entered invalid state")}export{x as a,w as b,s as c,O as d,l as e,a as f,f as g,u as h,E as i,_ as j,T as k,y as l,L as m,B as n,k as o,H as p,C as q,U as r,Y as s};
//# sourceMappingURL=/__external/app.framerstatic.com/chunk-OHYXMHQF.mjs.map
