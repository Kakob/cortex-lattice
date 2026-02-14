(function(){var W=Object.defineProperty;var $=(r,t,o)=>t in r?W(r,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[t]=o;var C=(r,t,o)=>$(r,typeof t!="symbol"?t+"":t,o);const L={leetcode:/^https?:\/\/(www\.)?leetcode\.com\/problems\/([^/]+)/,grokking:/^https?:\/\/(www\.)?designgurus\.io\/course(-play)?\/([^/]+)/};function U(){const r=window.location.href;return L.leetcode.test(r)?"leetcode":L.grokking.test(r)?"grokking":null}function V(){const r=window.location.href,t=r.match(L.leetcode);if(t)return{platform:"leetcode",problemSlug:t[2]};const o=r.match(L.grokking);return o?{platform:"grokking",courseSlug:o[2]}:null}function j(){return{getTitle(){const r=['[data-cy="question-title"]','div[class*="text-title-large"]','div[class*="question-title"]','a[href*="/problems/"]'];for(const o of r){const n=document.querySelector(o);if(n!=null&&n.textContent)return n.textContent.trim()}const t=window.location.pathname.match(/\/problems\/([^/]+)/);return t?t[1].split("-").map(o=>o.charAt(0).toUpperCase()+o.slice(1)).join(" "):null},getCode(){var n;const r=(n=window.monaco)==null?void 0:n.editor;if(r!=null&&r.getModels){const e=r.getModels();if(e.length>0)return e[0].getValue()}const t=document.querySelector(".view-lines");if(t){const e=t.querySelectorAll(".view-line");if(e.length>0)return Array.from(e).map(c=>c.textContent||"").join(`
`)}const o=document.querySelector(".CodeMirror");if(o){const e=o.CodeMirror;if(e!=null&&e.getValue)return e.getValue()}return null},getDifficulty(){var t;const r=['div[class*="text-difficulty-easy"]','div[class*="text-difficulty-medium"]','div[class*="text-difficulty-hard"]','span[class*="text-olive"]','span[class*="text-yellow"]','span[class*="text-pink"]','div[diff="easy"]','div[diff="medium"]','div[diff="hard"]'];for(const o of r){const n=document.querySelector(o);if(n){const e=(t=n.textContent)==null?void 0:t.toLowerCase().trim();if(e==="easy")return"easy";if(e==="medium")return"medium";if(e==="hard")return"hard";if(o.includes("easy")||o.includes("olive"))return"easy";if(o.includes("medium")||o.includes("yellow"))return"medium";if(o.includes("hard")||o.includes("pink"))return"hard"}}},getProblemNumber(){const r=this.getTitle();if(r){const t=r.match(/^(\d+)\./);if(t)return parseInt(t[1],10)}}}}function z(){const r=document.querySelector('[data-e2e-locator="console-run-button"]')||document.querySelector('button[data-cy="run-code-btn"]')||Array.from(document.querySelectorAll("button")).find(o=>{var n;return(n=o.textContent)==null?void 0:n.toLowerCase().includes("run")}),t=document.querySelector('[data-e2e-locator="console-submit-button"]')||document.querySelector('button[data-cy="submit-code-btn"]')||Array.from(document.querySelectorAll("button")).find(o=>{var n;return(n=o.textContent)==null?void 0:n.toLowerCase().includes("submit")});return{runButton:r||null,submitButton:t||null}}function G(){var o,n;const r=document.querySelector('[data-e2e-locator="submission-result"]');if(r){const e=((o=r.textContent)==null?void 0:o.toLowerCase())||"";if(e.includes("accepted"))return"pass";if(e.includes("wrong answer")||e.includes("runtime error")||e.includes("time limit"))return"fail";if(e.includes("error"))return"error"}const t=document.querySelector('[class*="result"]');if(t){const e=((n=t.textContent)==null?void 0:n.toLowerCase())||"";if(e.includes("accepted")||e.includes("passed"))return"pass";if(e.includes("wrong")||e.includes("failed"))return"fail";if(e.includes("error"))return"error"}}function K(){return{getTitle(){const r=['h1[class*="title"]','h1[class*="lesson"]',".lesson-title",".problem-title",'[data-testid="problem-title"]',"h1",".content-header h1",".challenge-title"];for(const n of r){const e=document.querySelector(n);if(e!=null&&e.textContent){const c=e.textContent.trim();if(c&&!c.toLowerCase().includes("design gurus")&&!c.toLowerCase().includes("grokking")&&c.length<200)return c}}const t=document.querySelector('.breadcrumb-item:last-child, [class*="breadcrumb"] a:last-child');if(t!=null&&t.textContent)return t.textContent.trim();const o=window.location.pathname.match(/\/lesson\/([^/]+)/);return o?o[1].split("-").map(n=>n.charAt(0).toUpperCase()+n.slice(1)).join(" "):null},getCode(){var c;const r=(c=window.monaco)==null?void 0:c.editor;if(r!=null&&r.getModels){const s=r.getModels();if(s.length>0)return s[0].getValue()}const t=document.querySelectorAll(".CodeMirror");for(const s of t){const i=s.CodeMirror;if(i!=null&&i.getValue){const a=i.getValue();if(a&&a.trim().length>0)return a}}const o=document.querySelector(".view-lines");if(o){const s=o.querySelectorAll(".view-line");if(s.length>0)return Array.from(s).map(i=>i.textContent||"").join(`
`)}const n=document.querySelector('.code-editor, [class*="code-editor"], [class*="editor-container"]');if(n){const s=n.querySelector("textarea");if(s!=null&&s.value)return s.value}const e=document.querySelector(".ace_editor");if(e){const s=window.ace;if(s)try{return s.edit(e).getValue()}catch{}}return null},getDifficulty(){var o,n;const r=['[class*="difficulty"]','[class*="level"]',".badge",".tag",'[class*="easy"]','[class*="medium"]','[class*="hard"]'];for(const e of r){const c=document.querySelectorAll(e);for(const s of c){const i=((o=s.textContent)==null?void 0:o.toLowerCase())||"",a=((n=s.className)==null?void 0:n.toLowerCase())||"";if(i.includes("easy")||a.includes("easy"))return"easy";if(i.includes("medium")||a.includes("medium"))return"medium";if(i.includes("hard")||a.includes("hard"))return"hard"}}const t=window.location.href.toLowerCase();if(t.includes("easy"))return"easy";if(t.includes("medium"))return"medium";if(t.includes("hard"))return"hard"},getPattern(){const t=window.location.href.match(/\/course\/([^/]+)/);if(t){const n=t[1];return n.includes("coding-interview")?"gtci":n.includes("system-design")?"system-design":n}const o=['[class*="pattern"]',".category-tag",".topic-tag",'[class*="category"]'];for(const n of o){const e=document.querySelector(n);if(e!=null&&e.textContent)return e.textContent.trim().toLowerCase().replace(/\s+/g,"-")}}}}function D(){var n,e;const r=document.querySelectorAll("button");let t=null,o=null;for(const c of r){const s=((n=c.textContent)==null?void 0:n.toLowerCase())||"",i=c.className.toLowerCase(),a=((e=c.getAttribute("data-testid"))==null?void 0:e.toLowerCase())||"";(s.includes("run")||i.includes("run")||a.includes("run")||s.includes("execute"))&&(t=c),(s.includes("submit")||s.includes("test")||i.includes("submit")||a.includes("submit")||s.includes("check"))&&(o=c)}return o||(o=document.querySelector('[data-testid="submit-btn"], .submit-btn, [class*="submit"]')),t||(t=document.querySelector('[data-testid="run-btn"], .run-btn, [class*="run-code"]')),{runButton:t,submitButton:o}}function Y(){var n,e;const r=[".result-panel",".output-panel",'[class*="result"]','[class*="output"]','[data-testid*="result"]'];for(const c of r){const s=document.querySelector(c);if(s){const i=((n=s.textContent)==null?void 0:n.toLowerCase())||"",a=((e=s.className)==null?void 0:e.toLowerCase())||"";if(i.includes("passed")||i.includes("correct")||i.includes("success")||i.includes("accepted")||a.includes("success")||a.includes("passed"))return"pass";if(i.includes("failed")||i.includes("wrong")||i.includes("incorrect")||a.includes("fail")||a.includes("error"))return"fail";if(i.includes("error")||i.includes("exception")||i.includes("runtime"))return"error"}}const t=[".success-icon",'[class*="success"]',".check-icon",'[class*="check"]',".passed"];for(const c of t)if(document.querySelector(c)){const s=document.querySelector(c);if(s&&s.closest('[class*="result"], [class*="output"]'))return"pass"}const o=[".error-icon",'[class*="error"]:not(button)',".x-icon",".failed"];for(const c of o){const s=document.querySelector(c);if(s&&s.closest('[class*="result"], [class*="output"]'))return"fail"}}async function y(r,t=3,o=100){let n;for(let e=0;e<t;e++)try{return await chrome.runtime.sendMessage(r)}catch(c){if(n=c instanceof Error?c:new Error(String(c)),(n.message.includes("Receiving end does not exist")||n.message.includes("Could not establish connection")||n.message.includes("Extension context invalidated"))&&e<t-1){await new Promise(i=>setTimeout(i,o*(e+1))),console.log(`Cortex Lattice: Retrying message (attempt ${e+2}/${t})...`);continue}throw n}throw n||new Error("Failed to send message after retries")}const u={attemptId:null,problemId:null,snapshotCount:0,lastTestResult:void 0};function Q(r,t,o){t&&(F(),J(r,t),X(r,o))}async function F(){try{const r=await y({type:"GET_PROBLEM",payload:{url:window.location.href}});if(r!=null&&r.error){console.warn("Cortex Lattice: GET_PROBLEM returned error:",r.error);return}if(r!=null&&r.problem){u.problemId=r.problem.id;const t=await y({type:"GET_CURRENT_ATTEMPT",payload:{problemId:r.problem.id}});if(t!=null&&t.error){console.warn("Cortex Lattice: GET_CURRENT_ATTEMPT returned error:",t.error);return}t!=null&&t.attempt&&(u.attemptId=t.attempt.id,u.snapshotCount=t.attempt.snapshotCount||0)}}catch(r){console.warn("Cortex Lattice: Failed to initialize attempt (extension may need reload):",r)}}function J(r,t,o){new MutationObserver(()=>{const c=r==="leetcode"?z():D();c.runButton&&!c.runButton.hasAttribute("data-cortex-observed")&&(c.runButton.setAttribute("data-cortex-observed","true"),c.runButton.addEventListener("click",()=>{E("run",t)})),c.submitButton&&!c.submitButton.hasAttribute("data-cortex-observed")&&(c.submitButton.setAttribute("data-cortex-observed","true"),c.submitButton.addEventListener("click",()=>{E("submit",t)}))}).observe(document.body,{childList:!0,subtree:!0});const e=r==="leetcode"?z():D();e.runButton&&e.runButton.addEventListener("click",()=>E("run",t)),e.submitButton&&e.submitButton.addEventListener("click",()=>E("submit",t))}async function E(r,t){u.attemptId||await F();const o=t.getCode();if(!o||!u.attemptId){console.warn("Cortex Lattice: Could not capture snapshot - missing code or attempt ID");return}try{const n=await y({type:"SAVE_SNAPSHOT",payload:{attemptId:u.attemptId,trigger:r,code:o}});n!=null&&n.error?(console.warn("Cortex Lattice: SAVE_SNAPSHOT returned error (continuing anyway):",n.error),u.snapshotCount++):n!=null&&n.snapshot&&(u.snapshotCount++,console.log(`Cortex Lattice: Saved snapshot #${u.snapshotCount} (${r})`))}catch(n){console.warn("Cortex Lattice: Failed to save snapshot (extension may need reload):",n)}}function X(r,t){let o;new MutationObserver(()=>{o&&clearTimeout(o),o=window.setTimeout(()=>{const e=r==="leetcode"?G():Y();e&&e!==u.lastTestResult&&(u.lastTestResult=e,Z(e,t))},500)}).observe(document.body,{childList:!0,subtree:!0,characterData:!0})}async function Z(r,t){console.log(`Cortex Lattice: Detected test result: ${r}`),u.attemptId&&console.log(`Cortex Lattice: Test result for attempt ${u.attemptId}: ${r}`),r==="pass"&&setTimeout(()=>{if(t&&u.attemptId){const o=u.snapshotCount>1;t.showReflectionModal(o,async n=>{try{const e=await y({type:"ADD_REFLECTION",payload:{attemptId:u.attemptId,type:"post_solve",content:n.content,coldHint:n.coldHint,confidence:n.confidence}});e!=null&&e.error&&console.warn("Cortex Lattice: ADD_REFLECTION returned error (continuing anyway):",e.error);const c=await y({type:"END_ATTEMPT",payload:{attemptId:u.attemptId,passed:!0}});c!=null&&c.error?console.warn("Cortex Lattice: END_ATTEMPT returned error:",c.error):console.log("Cortex Lattice: Attempt completed successfully")}catch(e){console.warn("Cortex Lattice: Failed to save reflection (extension may need reload):",e)}})}},1500)}class tt{constructor(){C(this,"shadowHost",null);C(this,"shadowRoot",null);C(this,"currentAttemptId",null);C(this,"codeScraper",null);this.createShadowContainer()}setCodeScraper(t){this.codeScraper=t}createShadowContainer(){this.shadowHost=document.createElement("div"),this.shadowHost.id="cortex-lattice-modal-host",this.shadowHost.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 999999;
    `,this.shadowRoot=this.shadowHost.attachShadow({mode:"closed"});const t=document.createElement("style");t.textContent=this.getModalStyles(),this.shadowRoot.appendChild(t),document.body.appendChild(this.shadowHost)}getModalStyles(){return`
      .cortex-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.15s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cortex-modal {
        background: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow: hidden;
        animation: slideUp 0.2s ease-out;
      }

      .cortex-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #334155;
      }

      .cortex-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
      }

      .cortex-modal-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        font-size: 20px;
        line-height: 1;
      }

      .cortex-modal-close:hover {
        background: #334155;
        color: #f1f5f9;
      }

      .cortex-modal-body {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(90vh - 140px);
      }

      .cortex-modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #334155;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .cortex-input, .cortex-textarea {
        width: 100%;
        padding: 10px 14px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        font-size: 14px;
        transition: all 0.15s;
        box-sizing: border-box;
      }

      .cortex-textarea {
        resize: vertical;
        min-height: 100px;
        font-family: inherit;
      }

      .cortex-input:focus, .cortex-textarea:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }

      .cortex-input::placeholder, .cortex-textarea::placeholder {
        color: #64748b;
      }

      .cortex-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #f1f5f9;
        margin-bottom: 8px;
      }

      .cortex-form-group {
        margin-bottom: 16px;
      }

      .cortex-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        border: none;
      }

      .cortex-btn-primary {
        background: #6366f1;
        color: white;
      }

      .cortex-btn-primary:hover {
        background: #4f46e5;
      }

      .cortex-btn-secondary {
        background: #334155;
        color: #f1f5f9;
      }

      .cortex-btn-secondary:hover {
        background: #475569;
      }

      .cortex-entry-types {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .cortex-entry-type {
        flex: 1;
        min-width: 100px;
        padding: 10px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        color: #94a3b8;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
      }

      .cortex-entry-type:hover {
        border-color: #475569;
        color: #f1f5f9;
      }

      .cortex-entry-type.active {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
        color: #f1f5f9;
      }

      .cortex-option-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .cortex-option-btn {
        padding: 12px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        color: #f1f5f9;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
      }

      .cortex-option-btn:hover {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
      }

      .cortex-option-btn.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.2);
      }

      .cortex-option-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .cortex-option-desc {
        font-size: 12px;
        color: #94a3b8;
      }

      .cortex-confidence-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .cortex-confidence-btn {
        padding: 16px 12px;
        background: #0f172a;
        border: 2px solid #334155;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
        color: #f1f5f9;
      }

      .cortex-confidence-btn:hover {
        border-color: #6366f1;
      }

      .cortex-confidence-btn.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.2);
      }

      .cortex-confidence-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .cortex-confidence-label {
        font-size: 14px;
        font-weight: 500;
      }

      .cortex-confidence-desc {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
      }

      .cortex-helper {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 8px;
      }
    `}setAttemptId(t){this.currentAttemptId=t}showHotkeyModal(){if(!this.shadowRoot)return;const t=document.createElement("div");t.innerHTML=`
      <div class="cortex-modal-backdrop" id="cortex-hotkey-backdrop">
        <div class="cortex-modal">
          <div class="cortex-modal-header">
            <h2 class="cortex-modal-title">Quick Log</h2>
            <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
          </div>
          <div class="cortex-modal-body">
            <div class="cortex-entry-types" id="cortex-entry-types">
              <button class="cortex-entry-type active" data-type="thought">Thought</button>
              <button class="cortex-entry-type" data-type="stuck">Stuck</button>
              <button class="cortex-entry-type" data-type="aha">Aha!</button>
              <button class="cortex-entry-type" data-type="strategy">Strategy</button>
            </div>

            <div class="cortex-form-group">
              <label class="cortex-label" for="cortex-content">What's on your mind?</label>
              <textarea class="cortex-textarea" id="cortex-content" placeholder="Describe your thought, where you're stuck, or your breakthrough..."></textarea>
            </div>

            <div id="cortex-strategy-fields" style="display: none;">
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-strategy-problem">What is the problem asking?</label>
                <textarea class="cortex-textarea" id="cortex-strategy-problem" placeholder="Restate the problem in your own words..."></textarea>
              </div>
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-strategy-approach">What's your approach?</label>
                <textarea class="cortex-textarea" id="cortex-strategy-approach" placeholder="Outline your plan before coding..."></textarea>
              </div>
            </div>

            <div id="cortex-stuck-options" style="display: none;">
              <label class="cortex-label">What will you try next?</label>
              <div class="cortex-option-grid">
                <button class="cortex-option-btn" data-action="think_more">
                  <div class="cortex-option-title">Think more</div>
                  <div class="cortex-option-desc">Work through it myself</div>
                </button>
                <button class="cortex-option-btn" data-action="check_hint">
                  <div class="cortex-option-title">Check hint</div>
                  <div class="cortex-option-desc">Look at a small hint</div>
                </button>
                <button class="cortex-option-btn" data-action="ask_ai">
                  <div class="cortex-option-title">Ask AI</div>
                  <div class="cortex-option-desc">Get help from AI</div>
                </button>
                <button class="cortex-option-btn" data-action="view_solution">
                  <div class="cortex-option-title">View solution</div>
                  <div class="cortex-option-desc">Look at the answer</div>
                </button>
              </div>
            </div>
          </div>
          <div class="cortex-modal-footer">
            <button class="cortex-btn cortex-btn-secondary" id="cortex-cancel-btn">Cancel</button>
            <button class="cortex-btn cortex-btn-primary" id="cortex-save-btn">Save</button>
          </div>
        </div>
      </div>
    `;const o=this.shadowRoot.getElementById("cortex-hotkey-backdrop");o&&o.remove(),this.shadowRoot.appendChild(t.firstElementChild),this.setupHotkeyModalEvents()}setupHotkeyModalEvents(){if(!this.shadowRoot)return;const t=this.shadowRoot.getElementById("cortex-hotkey-backdrop"),o=this.shadowRoot.getElementById("cortex-close-btn"),n=this.shadowRoot.getElementById("cortex-cancel-btn"),e=this.shadowRoot.getElementById("cortex-save-btn"),c=this.shadowRoot.getElementById("cortex-entry-types"),s=this.shadowRoot.getElementById("cortex-stuck-options"),i=this.shadowRoot.getElementById("cortex-strategy-fields"),a=this.shadowRoot.getElementById("cortex-content"),m=a==null?void 0:a.parentElement;let p="thought",g;const h=()=>t==null?void 0:t.remove();o==null||o.addEventListener("click",h),n==null||n.addEventListener("click",h),t==null||t.addEventListener("click",l=>{l.target===t&&h()}),c==null||c.addEventListener("click",l=>{const f=l.target.closest(".cortex-entry-type");f&&(c.querySelectorAll(".cortex-entry-type").forEach(b=>b.classList.remove("active")),f.classList.add("active"),p=f.getAttribute("data-type"),s&&(s.style.display=p==="stuck"?"block":"none"),i&&(i.style.display=p==="strategy"?"block":"none"),m&&(m.style.display=p==="strategy"?"none":"block"))}),s==null||s.addEventListener("click",l=>{const f=l.target.closest(".cortex-option-btn");f&&(s.querySelectorAll(".cortex-option-btn").forEach(b=>b.classList.remove("selected")),f.classList.add("selected"),g=f.getAttribute("data-action"))}),e==null||e.addEventListener("click",async()=>{var b,k,T,A,I,R,M,q,B,_,N;let l;if(p==="strategy"){const d=(b=this.shadowRoot)==null?void 0:b.getElementById("cortex-strategy-problem"),v=(k=this.shadowRoot)==null?void 0:k.getElementById("cortex-strategy-approach"),P=(T=d==null?void 0:d.value)==null?void 0:T.trim(),H=(A=v==null?void 0:v.value)==null?void 0:A.trim();if(!P&&!H)return;l=`**Problem:** ${P||"(not provided)"}

**Approach:** ${H||"(not provided)"}`}else if(l=(I=a==null?void 0:a.value)==null?void 0:I.trim(),!l)return;if(!this.currentAttemptId){console.log("Cortex Lattice: No attemptId - retrying START_ATTEMPT...");try{const d=await y({type:"START_ATTEMPT",payload:{url:window.location.href,title:document.title,platform:window.location.hostname.includes("designgurus")?"grokking":"leetcode"}});(R=d==null?void 0:d.attempt)!=null&&R.id&&(this.currentAttemptId=d.attempt.id,console.log("Cortex Lattice: Retry succeeded, got attemptId:",this.currentAttemptId))}catch(d){console.error("Cortex Lattice: Retry START_ATTEMPT failed:",d)}}if(!this.currentAttemptId){console.error("Cortex Lattice: No attemptId set - are you logged into the web app?");const d=document.createElement("p");d.style.cssText="color: #ef4444; font-size: 12px; margin-top: 8px; text-align: center;",d.textContent="Not connected. Please log in at localhost:3001 and refresh this page.",(q=(M=this.shadowRoot)==null?void 0:M.querySelector(".cortex-modal-body"))==null||q.appendChild(d);return}const f=e;f.disabled=!0,f.textContent="Saving...";try{const d=((B=this.codeScraper)==null?void 0:B.call(this))??void 0;p==="stuck"&&g?await y({type:"ADD_STUCK_POINT",payload:{attemptId:this.currentAttemptId,description:l,intendedAction:g,codeSnapshot:d}}):await y({type:"ADD_REFLECTION",payload:{attemptId:this.currentAttemptId,type:p,content:l,codeSnapshot:d}}),h()}catch(d){console.error("Cortex Lattice: Failed to save entry:",d),f.textContent="Error - Retry",f.disabled=!1;const v=document.createElement("p");v.style.cssText="color: #ef4444; font-size: 12px; margin-top: 8px; text-align: center;",v.textContent="Failed to save. Please try again or refresh the page.",(N=(_=this.shadowRoot)==null?void 0:_.querySelector(".cortex-modal-footer"))==null||N.appendChild(v)}}),a==null||a.focus(),document.addEventListener("keydown",l=>{l.key==="Escape"&&h(),l.key==="Enter"&&(l.metaKey||l.ctrlKey)&&(e==null||e.click())},{once:!0})}showReflectionModal(t,o){if(!this.shadowRoot)return;const n=document.createElement("div");t?n.innerHTML=`
        <div class="cortex-modal-backdrop" id="cortex-reflection-backdrop">
          <div class="cortex-modal">
            <div class="cortex-modal-header">
              <h2 class="cortex-modal-title">Nice! You solved it!</h2>
              <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
            </div>
            <div class="cortex-modal-body">
              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-issue">What was the issue?</label>
                <textarea class="cortex-textarea" id="cortex-issue" placeholder="What tripped you up? What did you miss initially?"></textarea>
              </div>

              <div class="cortex-form-group">
                <label class="cortex-label" for="cortex-hint">What hint would have helped?</label>
                <textarea class="cortex-textarea" id="cortex-hint" placeholder="Write a hint that would help you next time (no spoilers)"></textarea>
                <p class="cortex-helper">This hint will show during your next review</p>
              </div>
            </div>
            <div class="cortex-modal-footer">
              <button class="cortex-btn cortex-btn-secondary" id="cortex-skip-btn">Skip</button>
              <button class="cortex-btn cortex-btn-primary" id="cortex-save-btn">Save</button>
            </div>
          </div>
        </div>
      `:n.innerHTML=`
        <div class="cortex-modal-backdrop" id="cortex-reflection-backdrop">
          <div class="cortex-modal">
            <div class="cortex-modal-header">
              <h2 class="cortex-modal-title">First try! How did it feel?</h2>
              <button class="cortex-modal-close" id="cortex-close-btn">&times;</button>
            </div>
            <div class="cortex-modal-body">
              <label class="cortex-label">How confident are you?</label>
              <div class="cortex-confidence-grid">
                <button class="cortex-confidence-btn" data-confidence="easy">
                  <div class="cortex-confidence-icon">😎</div>
                  <div class="cortex-confidence-label">Easy</div>
                  <div class="cortex-confidence-desc">I could do this in my sleep</div>
                </button>
                <button class="cortex-confidence-btn" data-confidence="moderate">
                  <div class="cortex-confidence-icon">🤔</div>
                  <div class="cortex-confidence-label">Moderate</div>
                  <div class="cortex-confidence-desc">Had to think, but got it</div>
                </button>
                <button class="cortex-confidence-btn" data-confidence="lucky">
                  <div class="cortex-confidence-icon">🍀</div>
                  <div class="cortex-confidence-label">Lucky</div>
                  <div class="cortex-confidence-desc">Not sure I could do it again</div>
                </button>
              </div>
            </div>
            <div class="cortex-modal-footer">
              <button class="cortex-btn cortex-btn-secondary" id="cortex-skip-btn">Skip</button>
            </div>
          </div>
        </div>
      `;const e=this.shadowRoot.getElementById("cortex-reflection-backdrop");e&&e.remove(),this.shadowRoot.appendChild(n.firstElementChild),this.setupReflectionModalEvents(t,o)}setupReflectionModalEvents(t,o){if(!this.shadowRoot)return;const n=this.shadowRoot.getElementById("cortex-reflection-backdrop"),e=this.shadowRoot.getElementById("cortex-close-btn"),c=this.shadowRoot.getElementById("cortex-skip-btn"),s=this.shadowRoot.getElementById("cortex-save-btn"),i=()=>n==null?void 0:n.remove();if(e==null||e.addEventListener("click",()=>{o({content:"Skipped",confidence:"moderate"}),i()}),c==null||c.addEventListener("click",()=>{o({content:"Skipped",confidence:"moderate"}),i()}),t)s==null||s.addEventListener("click",()=>{var l,f,b,k;const m=(l=this.shadowRoot)==null?void 0:l.getElementById("cortex-issue"),p=(f=this.shadowRoot)==null?void 0:f.getElementById("cortex-hint"),g=((b=m==null?void 0:m.value)==null?void 0:b.trim())||"No reflection provided",h=(k=p==null?void 0:p.value)==null?void 0:k.trim();o({content:g,coldHint:h}),i()});else{const m=this.shadowRoot.querySelector(".cortex-confidence-grid");m==null||m.addEventListener("click",p=>{const g=p.target.closest(".cortex-confidence-btn");if(!g)return;const h=g.getAttribute("data-confidence");o({content:`Confidence: ${h}`,confidence:h}),i()})}const a=m=>{m.key==="Escape"&&(o({content:"Skipped",confidence:"moderate"}),i(),document.removeEventListener("keydown",a))};document.addEventListener("keydown",a)}hideModal(){if(!this.shadowRoot)return;const t=this.shadowRoot.getElementById("cortex-hotkey-backdrop"),o=this.shadowRoot.getElementById("cortex-reflection-backdrop");t==null||t.remove(),o==null||o.remove()}}let x=null,w=null;async function S(){var o;const r=U();if(!r){console.log("Cortex Lattice: Not on a supported platform");return}console.log(`Cortex Lattice: Detected platform: ${r}`),r==="leetcode"?x=j():r==="grokking"&&(x=K()),w=new tt,x&&w.setCodeScraper(()=>(x==null?void 0:x.getCode())??null);const t=V();if(t){console.log("Cortex Lattice: Problem info:",t);const n=x==null?void 0:x.getTitle(),e=x==null?void 0:x.getDifficulty();if(n)try{const c=await y({type:"START_ATTEMPT",payload:{url:window.location.href,title:n,platform:r,difficulty:e}});c!=null&&c.error?console.warn("Cortex Lattice: Start attempt returned error (continuing anyway):",c.error):(console.log("Cortex Lattice: Started attempt:",c),(o=c==null?void 0:c.attempt)!=null&&o.id&&w&&(w.setAttemptId(c.attempt.id),console.log("Cortex Lattice: Set attemptId for modal:",c.attempt.id)))}catch(c){console.warn("Cortex Lattice: Failed to start attempt (extension may need reload):",c)}}Q(r,x,w)}chrome.runtime.onMessage.addListener((r,t,o)=>r.type==="OPEN_HOTKEY_MODAL"?(w&&w.showHotkeyModal(),o({success:!0}),!0):!1);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();let O=window.location.href;const et=new MutationObserver(()=>{window.location.href!==O&&(O=window.location.href,console.log("Cortex Lattice: URL changed, re-initializing..."),S())});et.observe(document.body,{childList:!0,subtree:!0});
})()
