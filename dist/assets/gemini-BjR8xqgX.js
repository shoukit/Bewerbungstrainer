import{v as Z,a as X}from"./audio-BZs8f3gH.js";import{w as _}from"./formatting-aEs8dNBb.js";var M;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(M||(M={}));var D;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(D||(D={}));var G;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(G||(G={}));const F=["user","model","function","system"];var $;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})($||($={}));var z;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(z||(z={}));var x;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(x||(x={}));var L;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(L||(L={}));var T;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.OTHER="OTHER"})(T||(T={}));var U;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(U||(U={}));var P;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(P||(P={}));var W;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(W||(W={}));class m extends Error{constructor(t){super(`[GoogleGenerativeAI Error]: ${t}`)}}class k extends m{constructor(t,n){super(t),this.response=n}}class Q extends m{constructor(t,n,i,r){super(t),this.status=n,this.statusText=i,this.errorDetails=r}}class p extends m{}const le="https://generativelanguage.googleapis.com",ue="v1beta",de="0.21.0",he="genai-js";var I;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(I||(I={}));class ge{constructor(t,n,i,r,s){this.model=t,this.task=n,this.apiKey=i,this.stream=r,this.requestOptions=s}toString(){var t,n;const i=((t=this.requestOptions)===null||t===void 0?void 0:t.apiVersion)||ue;let s=`${((n=this.requestOptions)===null||n===void 0?void 0:n.baseUrl)||le}/${i}/${this.model}:${this.task}`;return this.stream&&(s+="?alt=sse"),s}}function fe(e){const t=[];return e?.apiClient&&t.push(e.apiClient),t.push(`${he}/${de}`),t.join(" ")}async function me(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",fe(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let i=(t=e.requestOptions)===null||t===void 0?void 0:t.customHeaders;if(i){if(!(i instanceof Headers))try{i=new Headers(i)}catch(r){throw new p(`unable to convert customHeaders value ${JSON.stringify(i)} to Headers: ${r.message}`)}for(const[r,s]of i.entries()){if(r==="x-goog-api-key")throw new p(`Cannot set reserved header name ${r}`);if(r==="x-goog-api-client")throw new p(`Header name ${r} can only be set using the apiClient field`);n.append(r,s)}}return n}async function Ee(e,t,n,i,r,s){const o=new ge(e,t,n,i,s);return{url:o.toString(),fetchOptions:Object.assign(Object.assign({},Ae(s)),{method:"POST",headers:await me(o),body:r})}}async function v(e,t,n,i,r,s={},o=fetch){const{url:c,fetchOptions:u}=await Ee(e,t,n,i,r,s);return pe(c,u,o)}async function pe(e,t,n=fetch){let i;try{i=await n(e,t)}catch(r){Se(r,e)}return i.ok||await Ie(i,e),i}function Se(e,t){let n=e;throw e instanceof Q||e instanceof p||(n=new m(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function Ie(e,t){let n="",i;try{const r=await e.json();n=r.error.message,r.error.details&&(n+=` ${JSON.stringify(r.error.details)}`,i=r.error.details)}catch{}throw new Q(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${n}`,e.status,e.statusText,i)}function Ae(e){const t={};if(e?.signal!==void 0||e?.timeout>=0){const n=new AbortController;e?.timeout>=0&&setTimeout(()=>n.abort(),e.timeout),e?.signal&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}function O(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),y(e.candidates[0]))throw new k(`${E(e)}`,e);return we(e)}else if(e.promptFeedback)throw new k(`Text not available. ${E(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),y(e.candidates[0]))throw new k(`${E(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),K(e)[0]}else if(e.promptFeedback)throw new k(`Function call not available. ${E(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),y(e.candidates[0]))throw new k(`${E(e)}`,e);return K(e)}else if(e.promptFeedback)throw new k(`Function call not available. ${E(e)}`,e)},e}function we(e){var t,n,i,r;const s=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const o of(r=(i=e.candidates)===null||i===void 0?void 0:i[0].content)===null||r===void 0?void 0:r.parts)o.text&&s.push(o.text),o.executableCode&&s.push("\n```"+o.executableCode.language+`
`+o.executableCode.code+"\n```\n"),o.codeExecutionResult&&s.push("\n```\n"+o.codeExecutionResult.output+"\n```\n");return s.length>0?s.join(""):""}function K(e){var t,n,i,r;const s=[];if(!((n=(t=e.candidates)===null||t===void 0?void 0:t[0].content)===null||n===void 0)&&n.parts)for(const o of(r=(i=e.candidates)===null||i===void 0?void 0:i[0].content)===null||r===void 0?void 0:r.parts)o.functionCall&&s.push(o.functionCall);if(s.length>0)return s}const be=[T.RECITATION,T.SAFETY,T.LANGUAGE];function y(e){return!!e.finishReason&&be.includes(e.finishReason)}function E(e){var t,n,i;let r="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)r+="Response was blocked",!((t=e.promptFeedback)===null||t===void 0)&&t.blockReason&&(r+=` due to ${e.promptFeedback.blockReason}`),!((n=e.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(r+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((i=e.candidates)===null||i===void 0)&&i[0]){const s=e.candidates[0];y(s)&&(r+=`Candidate was blocked due to ${s.finishReason}`,s.finishMessage&&(r+=`: ${s.finishMessage}`))}return r}function C(e){return this instanceof C?(this.v=e,this):new C(e)}function ke(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var i=n.apply(e,t||[]),r,s=[];return r={},o("next"),o("throw"),o("return"),r[Symbol.asyncIterator]=function(){return this},r;function o(h){i[h]&&(r[h]=function(a){return new Promise(function(g,b){s.push([h,a,g,b])>1||c(h,a)})})}function c(h,a){try{u(i[h](a))}catch(g){f(s[0][3],g)}}function u(h){h.value instanceof C?Promise.resolve(h.value.v).then(d,l):f(s[0][2],h)}function d(h){c("next",h)}function l(h){c("throw",h)}function f(h,a){h(a),s.shift(),s.length&&c(s[0][0],s[0][1])}}const B=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function _e(e){const t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=Ne(t),[i,r]=n.tee();return{stream:Ce(i),response:Te(r)}}async function Te(e){const t=[],n=e.getReader();for(;;){const{done:i,value:r}=await n.read();if(i)return O(Re(t));t.push(r)}}function Ce(e){return ke(this,arguments,function*(){const n=e.getReader();for(;;){const{value:i,done:r}=yield C(n.read());if(r)break;yield yield C(O(i))}})}function Ne(e){const t=e.getReader();return new ReadableStream({start(i){let r="";return s();function s(){return t.read().then(({value:o,done:c})=>{if(c){if(r.trim()){i.error(new m("Failed to parse stream"));return}i.close();return}r+=o;let u=r.match(B),d;for(;u;){try{d=JSON.parse(u[1])}catch{i.error(new m(`Error parsing JSON response: "${u[1]}"`));return}i.enqueue(d),r=r.substring(u[0].length),u=r.match(B)}return s()})}}})}function Re(e){const t=e[e.length-1],n={promptFeedback:t?.promptFeedback};for(const i of e){if(i.candidates)for(const r of i.candidates){const s=r.index;if(n.candidates||(n.candidates=[]),n.candidates[s]||(n.candidates[s]={index:r.index}),n.candidates[s].citationMetadata=r.citationMetadata,n.candidates[s].groundingMetadata=r.groundingMetadata,n.candidates[s].finishReason=r.finishReason,n.candidates[s].finishMessage=r.finishMessage,n.candidates[s].safetyRatings=r.safetyRatings,r.content&&r.content.parts){n.candidates[s].content||(n.candidates[s].content={role:r.content.role||"user",parts:[]});const o={};for(const c of r.content.parts)c.text&&(o.text=c.text),c.functionCall&&(o.functionCall=c.functionCall),c.executableCode&&(o.executableCode=c.executableCode),c.codeExecutionResult&&(o.codeExecutionResult=c.codeExecutionResult),Object.keys(o).length===0&&(o.text=""),n.candidates[s].content.parts.push(o)}}i.usageMetadata&&(n.usageMetadata=i.usageMetadata)}return n}async function ee(e,t,n,i){const r=await v(t,I.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),i);return _e(r)}async function te(e,t,n,i){const s=await(await v(t,I.GENERATE_CONTENT,e,!1,JSON.stringify(n),i)).json();return{response:O(s)}}function ne(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function N(e){let t=[];if(typeof e=="string")t=[{text:e}];else for(const n of e)typeof n=="string"?t.push({text:n}):t.push(n);return ve(t)}function ve(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let i=!1,r=!1;for(const s of e)"functionResponse"in s?(n.parts.push(s),r=!0):(t.parts.push(s),i=!0);if(i&&r)throw new m("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!i&&!r)throw new m("No content is provided for sending chat message.");return i?t:n}function ye(e,t){var n;let i={model:t?.model,generationConfig:t?.generationConfig,safetySettings:t?.safetySettings,tools:t?.tools,toolConfig:t?.toolConfig,systemInstruction:t?.systemInstruction,cachedContent:(n=t?.cachedContent)===null||n===void 0?void 0:n.name,contents:[]};const r=e.generateContentRequest!=null;if(e.contents){if(r)throw new p("CountTokensRequest must have one of contents or generateContentRequest, not both.");i.contents=e.contents}else if(r)i=Object.assign(Object.assign({},i),e.generateContentRequest);else{const s=N(e);i.contents=[s]}return{generateContentRequest:i}}function H(e){let t;return e.contents?t=e:t={contents:[N(e)]},e.systemInstruction&&(t.systemInstruction=ne(e.systemInstruction)),t}function Oe(e){return typeof e=="string"||Array.isArray(e)?{content:N(e)}:e}const j=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Me={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function De(e){let t=!1;for(const n of e){const{role:i,parts:r}=n;if(!t&&i!=="user")throw new m(`First content should be with role 'user', got ${i}`);if(!F.includes(i))throw new m(`Each item should include role field. Got ${i} but valid roles are: ${JSON.stringify(F)}`);if(!Array.isArray(r))throw new m("Content should have 'parts' property with an array of Parts");if(r.length===0)throw new m("Each Content should have at least one part");const s={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const c of r)for(const u of j)u in c&&(s[u]+=1);const o=Me[i];for(const c of j)if(!o.includes(c)&&s[c]>0)throw new m(`Content with role '${i}' can't contain '${c}' part`);t=!0}}const V="SILENT_ERROR";class Ge{constructor(t,n,i,r={}){this.model=n,this.params=i,this._requestOptions=r,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=t,i?.history&&(De(i.history),this._history=i.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(t,n={}){var i,r,s,o,c,u;await this._sendPromise;const d=N(t),l={safetySettings:(i=this.params)===null||i===void 0?void 0:i.safetySettings,generationConfig:(r=this.params)===null||r===void 0?void 0:r.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(o=this.params)===null||o===void 0?void 0:o.toolConfig,systemInstruction:(c=this.params)===null||c===void 0?void 0:c.systemInstruction,cachedContent:(u=this.params)===null||u===void 0?void 0:u.cachedContent,contents:[...this._history,d]},f=Object.assign(Object.assign({},this._requestOptions),n);let h;return this._sendPromise=this._sendPromise.then(()=>te(this._apiKey,this.model,l,f)).then(a=>{var g;if(a.response.candidates&&a.response.candidates.length>0){this._history.push(d);const b=Object.assign({parts:[],role:"model"},(g=a.response.candidates)===null||g===void 0?void 0:g[0].content);this._history.push(b)}else{const b=E(a.response);b&&console.warn(`sendMessage() was unsuccessful. ${b}. Inspect response object for details.`)}h=a}),await this._sendPromise,h}async sendMessageStream(t,n={}){var i,r,s,o,c,u;await this._sendPromise;const d=N(t),l={safetySettings:(i=this.params)===null||i===void 0?void 0:i.safetySettings,generationConfig:(r=this.params)===null||r===void 0?void 0:r.generationConfig,tools:(s=this.params)===null||s===void 0?void 0:s.tools,toolConfig:(o=this.params)===null||o===void 0?void 0:o.toolConfig,systemInstruction:(c=this.params)===null||c===void 0?void 0:c.systemInstruction,cachedContent:(u=this.params)===null||u===void 0?void 0:u.cachedContent,contents:[...this._history,d]},f=Object.assign(Object.assign({},this._requestOptions),n),h=ee(this._apiKey,this.model,l,f);return this._sendPromise=this._sendPromise.then(()=>h).catch(a=>{throw new Error(V)}).then(a=>a.response).then(a=>{if(a.candidates&&a.candidates.length>0){this._history.push(d);const g=Object.assign({},a.candidates[0].content);g.role||(g.role="model"),this._history.push(g)}else{const g=E(a);g&&console.warn(`sendMessageStream() was unsuccessful. ${g}. Inspect response object for details.`)}}).catch(a=>{a.message!==V&&console.error(a)}),h}}async function Fe(e,t,n,i){return(await v(t,I.COUNT_TOKENS,e,!1,JSON.stringify(n),i)).json()}async function $e(e,t,n,i){return(await v(t,I.EMBED_CONTENT,e,!1,JSON.stringify(n),i)).json()}async function ze(e,t,n,i){const r=n.requests.map(o=>Object.assign(Object.assign({},o),{model:t}));return(await v(t,I.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:r}),i)).json()}class J{constructor(t,n,i={}){this.apiKey=t,this._requestOptions=i,n.model.includes("/")?this.model=n.model:this.model=`models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=ne(n.systemInstruction),this.cachedContent=n.cachedContent}async generateContent(t,n={}){var i;const r=H(t),s=Object.assign(Object.assign({},this._requestOptions),n);return te(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(i=this.cachedContent)===null||i===void 0?void 0:i.name},r),s)}async generateContentStream(t,n={}){var i;const r=H(t),s=Object.assign(Object.assign({},this._requestOptions),n);return ee(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(i=this.cachedContent)===null||i===void 0?void 0:i.name},r),s)}startChat(t){var n;return new Ge(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(n=this.cachedContent)===null||n===void 0?void 0:n.name},t),this._requestOptions)}async countTokens(t,n={}){const i=ye(t,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),r=Object.assign(Object.assign({},this._requestOptions),n);return Fe(this.apiKey,this.model,i,r)}async embedContent(t,n={}){const i=Oe(t),r=Object.assign(Object.assign({},this._requestOptions),n);return $e(this.apiKey,this.model,i,r)}async batchEmbedContents(t,n={}){const i=Object.assign(Object.assign({},this._requestOptions),n);return ze(this.apiKey,this.model,t,i)}}class xe{constructor(t){this.apiKey=t}getGenerativeModel(t,n){if(!t.model)throw new m("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new J(this.apiKey,t,n)}getGenerativeModelFromCachedContent(t,n,i){if(!t.name)throw new p("Cached content must contain a `name` field.");if(!t.model)throw new p("Cached content must contain a `model` field.");const r=["model","systemInstruction"];for(const o of r)if(n?.[o]&&t[o]&&n?.[o]!==t[o]){if(o==="model"){const c=n.model.startsWith("models/")?n.model.replace("models/",""):n.model,u=t.model.startsWith("models/")?t.model.replace("models/",""):t.model;if(c===u)continue}throw new p(`Different value for "${o}" specified in modelParams (${n[o]}) and cachedContent (${t[o]})`)}const s=Object.assign(Object.assign({},n),{model:t.model,tools:t.tools,toolConfig:t.toolConfig,systemInstruction:t.systemInstruction,cachedContent:t});return new J(this.apiKey,s,i)}}const ie={FALLBACK_ORDER:["gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash-latest"]},R={API_KEY_MISSING:"Gemini API key is required",AUDIO_FILE_MISSING:"Audio file is required",TRANSCRIPT_EMPTY:"Transcript is empty",JSON_PARSE_FAILED:"Fehler beim Parsen der Antwort"};function Le(e,t={}){const{roleType:n="interview",userRoleLabel:i="Bewerber",agentRoleLabel:r="Gesprächspartner"}=t;return n==="simulation"?Pe(e,i,r):Ue(e,i,r)}function Ue(e,t,n){return`Du bist ein professioneller Karriere-Coach. Analysiere das folgende Gespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den/die ${t.toUpperCase()}!
- Die Aussagen des ${n} (z.B. "H. Müller", "${n}", oder ähnliche Kennzeichnungen) dienen NUR als Kontext für die Fragen.
- Dein gesamtes Feedback, alle Stärken, Verbesserungen, Tipps und Bewertungen beziehen sich NUR auf die Antworten und das Verhalten des/der ${t}.
- Bewerte NICHT die Qualität der Fragen oder das Verhalten des ${n}.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks des/der ${t} (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung",
    "Stärke 2: Was gut gemacht wurde",
    "Stärke 3: Weitere Stärken"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Verbesserungsbereich",
    "Verbesserung 2: Was besser gemacht werden könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung",
    "Tipp 2: Praktischer Ratschlag",
    "Tipp 3: Weitere hilfreiche Tipps"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der Antworten des/der ${t}:
- Struktur & Klarheit der Antworten
- Inhalt & Beispiele, die genannt werden
- Motivation & Begeisterung
- Professionalität & Selbstbewusstsein

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen.

Transkript:
${e}

JSON Feedback:`}function Pe(e,t,n){return`Du bist ein professioneller Coach für Kommunikation und Gesprächsführung. Analysiere das folgende Gespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

KONTEXT: Dies ist eine Simulation, bei der der/die ${t} das Gespräch führt und der/die ${n} darauf reagiert.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den/die ${t.toUpperCase()}!
- Die Aussagen des/der ${n} dienen als Kontext für die Reaktionen.
- Dein gesamtes Feedback bezieht sich NUR auf die Gesprächsführung, Reaktionen und das Verhalten des/der ${t}.
- Bewerte die Fähigkeit, das Gespräch professionell zu führen und auf den/die ${n} einzugehen.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format (keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung der Gesprächsführung des/der ${t} (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung zur Gesprächsführung",
    "Stärke 2: Was in der Kommunikation gut gemacht wurde",
    "Stärke 3: Weitere Stärken im Umgang mit dem/der ${n}"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Verbesserungsbereich in der Gesprächsführung",
    "Verbesserung 2: Wie besser auf den/die ${n} eingegangen werden könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung für ähnliche Situationen",
    "Tipp 2: Praktischer Ratschlag zur Gesprächsführung",
    "Tipp 3: Weitere hilfreiche Tipps"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der Gesprächsführung des/der ${t}:
- Gesprächsführung & Struktur (Wie gut wurde das Gespräch geleitet?)
- Kundenorientierung & Empathie (Wie gut wurde auf den/die ${n} eingegangen?)
- Problemlösungskompetenz (Wie effektiv wurden Anliegen bearbeitet?)
- Professionalität & Souveränität (Wie professionell war das Auftreten?)

Sei konstruktiv, ehrlich und motivierend. Fokussiere auf umsetzbare Verbesserungen für die Gesprächsführung.

Transkript:
${e}

JSON Feedback:`}function We(e,t){return e.replace("${transcript}",t)}const Ke=["Ähm","Äh","Öh","Mh","Halt","Eigentlich","Sozusagen","Quasi","Irgendwie","Also","Genau","Ja also"];function re(){return`${Ke.slice(0,9).map(t=>`"${t}"`).join(", ")}, "Also" (am Satzanfang), "Genau" (als Füllwort), "Ja also"`}const S="[Keine Sprache erkannt]";function se(){return`ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio: transcript = "${S}"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache: transcript = "${S}"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!
- Wenn jemand nur "Weiß ich nicht" oder "Keine Ahnung" sagt, transkribiere GENAU DAS
- Eine kurze Antwort wie "Ich weiß es nicht" ist eine valide Transkription
- HALLUZINIERE KEINE ausführlichen Antworten wenn der Sprecher das nicht gesagt hat`}function oe(e="game"){const t="Es wurde keine Sprache erkannt. Bitte stellen Sie sicher, dass Ihr Mikrofon funktioniert und Sie während der Aufnahme sprechen.";switch(e){case"game":return{transcript:S,filler_words:[],content_score:0,content_feedback:t};case"analysis":return{audio_metrics:{summary_text:t,confidence_score:0,speech_cleanliness:{score:0,total_filler_count:0,filler_word_analysis:[],feedback:"Keine Sprache zur Analyse erkannt."},pacing:{rating:"keine_sprache",estimated_wpm:0,issues_detected:[],feedback:"Keine Sprache zur Analyse erkannt."},tonality:{rating:"keine_sprache",emotional_tone:"neutral",highlights:[],feedback:"Keine Sprache zur Analyse erkannt."}}};case"simulator":return{transcript:S,feedback:{summary:t,strengths:[],improvements:["Bitte versuchen Sie es erneut und sprechen Sie klar und deutlich ins Mikrofon."],tips:["Achten Sie darauf, dass Ihr Mikrofon funktioniert und nicht stummgeschaltet ist."],scores:{content:0,structure:0,relevance:0,delivery:0,overall:0}},audio_metrics:{speech_rate:"keine_sprache",filler_words:{count:0,words:[],severity:"keine"},confidence_score:0,clarity_score:0,notes:"Keine Sprache erkannt"}};default:return{transcript:S,error:t}}}const ae=5e3;function Be(e={}){const{userRoleLabel:t="Bewerber",agentRoleLabel:n="Gesprächspartner",roleType:i="interview",hasTwoVoices:r=!0,transcript:s=null}=e,o=r?`
WICHTIG - STIMMEN-TRENNUNG:
Die Aufnahme enthält ZWEI Stimmen:
1. ${n.toUpperCase()} (KI-Stimme, synthetisch, akzentfrei)
2. ${t.toUpperCase()} (menschliche Stimme, natürliche Varianz)

Der/Die ${n} eröffnet typischerweise das Gespräch.
Analysiere AUSSCHLIESSLICH die Stimme des/der ${t.toUpperCase()}.
Ignoriere alle Äußerungen des/der ${n} komplett.
`:`
STIMM-ANALYSE:
Die Aufnahme enthält nur EINE Stimme: ${t.toUpperCase()}.
Analysiere diese Stimme vollständig.
`,c=s?`
TRANSKRIPT-REFERENZ:
Das folgende Transkript zeigt, wer was gesagt hat. Nutze es zur Orientierung:

${s}

Hinweis: Das Transkript hilft bei der Zuordnung. Die paraverbale Analyse (WIE etwas gesagt wird)
basiert aber auf dem AUDIO - nicht auf dem Text.
`:"";return`Du bist ein professioneller Voice-Coach und Kommunikationsexperte bei "KarriereHeld".
Deine Aufgabe: Analysiere die paraverbale Kommunikation im Audio.

Paraverbal = WIE etwas gesagt wird (nicht WAS gesagt wird).

${se()}
${o}
${c}
═══════════════════════════════════════════════════════════
ANALYSE-DIMENSIONEN (nur ${t.toUpperCase()})
═══════════════════════════════════════════════════════════

1. FÜLLWÖRTER (Speech Cleanliness)
   ────────────────────────────────
   Erkenne diese Füllwörter: ${re()}

   Für jedes Füllwort dokumentiere:
   - Exakter Zeitstempel (MM:SS)
   - Kontext (z.B. "Satzanfang", "beim Nachdenken", "Themenwechsel")

   Bewertungsmaßstab:
   - 0 Füllwörter: 100 Punkte (Exzellent)
   - 1-2 Füllwörter: 85-95 Punkte (Sehr gut)
   - 3-5 Füllwörter: 65-80 Punkte (Akzeptabel)
   - 6-10 Füllwörter: 40-60 Punkte (Verbesserungsbedarf)
   - 10+ Füllwörter: 0-35 Punkte (Deutlicher Übungsbedarf)

2. SPRECHTEMPO (Pacing)
   ─────────────────────
   Optimales Tempo: 120-150 Wörter pro Minute (WPM)

   Achte auf:
   - Durchschnittliches Tempo
   - Tempo-Variationen (monoton vs. dynamisch)
   - Auffällige Stellen (zu schnell/langsam) mit Zeitstempel

   Bewertung:
   - "optimal": 120-150 WPM, natürliche Variation
   - "zu_schnell": >160 WPM, gehetzt, atemlos
   - "zu_langsam": <100 WPM, schleppend, unsicher
   - "ungleichmaessig": Starke Schwankungen

3. TONALITÄT (Melodie & Betonung)
   ───────────────────────────────
   Analysiere:
   - Stimmmelodie (monoton / natürlich / lebendig)
   - Betonungen (passend / fehlend / übertrieben)
   - Emotionale Färbung (neutral / engagiert / nervös)

   Dokumentiere Highlights und Lowlights:
   - Positive Momente: Souveräne Passagen, gute Betonungen
   - Negative Momente: Unsichere Stellen, Stimmbrüche, Monotonie

4. SELBSTSICHERHEIT (Confidence)
   ──────────────────────────────
   Gesamteindruck: Wie sicher und kompetent wirkt die Stimme?

   Indikatoren für hohe Confidence:
   ✓ Klare, feste Stimme
   ✓ Angemessenes Tempo
   ✓ Gute Pausen (bewusst, nicht nervös)
   ✓ Natürliche Betonungen

   Indikatoren für niedrige Confidence:
   ✗ Zittrige oder leise Stimme
   ✗ Viele Füllwörter
   ✗ Hastiges Sprechen
   ✗ Aufsteigende Satzenden (Unsicherheit)

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (nur valides JSON, kein Markdown)
═══════════════════════════════════════════════════════════

{
  "audio_metrics": {
    "summary_text": "2-3 Sätze Gesamtfazit zur Stimmwirkung des/der ${t}. Was war gut? Was kann verbessert werden?",
    "confidence_score": <0-100>,

    "speech_cleanliness": {
      "score": <0-100>,
      "total_filler_count": <Anzahl>,
      "filler_word_analysis": [
        {
          "word": "Ähm",
          "count": <Anzahl>,
          "examples": [
            {"timestamp": "00:45", "context": "Satzanfang"},
            {"timestamp": "01:20", "context": "beim Nachdenken"}
          ]
        }
      ],
      "feedback": "Konkreter Tipp zur Vermeidung"
    },

    "pacing": {
      "rating": "optimal" | "zu_schnell" | "zu_langsam" | "ungleichmaessig",
      "estimated_wpm": <Zahl>,
      "issues_detected": [
        {"timestamp": "02:10", "issue": "Beschreibung des Problems"}
      ],
      "feedback": "Konkreter Tipp zum Tempo"
    },

    "tonality": {
      "rating": "monoton" | "natürlich" | "lebendig",
      "emotional_tone": "neutral" | "engagiert" | "nervös" | "enthusiastisch",
      "highlights": [
        {"timestamp": "00:30", "type": "positive", "note": "Souveräner Einstieg"},
        {"timestamp": "03:15", "type": "negative", "note": "Stimme wird unsicher"}
      ],
      "feedback": "Konkreter Tipp zur Stimmmelodie"
    }
  }
}

Beginne jetzt mit der Analyse:`}const Y=["Warum bin ich die beste Wahl für diese Position?","Meine größte berufliche Errungenschaft","Was motiviert mich jeden Tag aufzustehen?","Wie ich mit schwierigen Kollegen umgehe","Mein Führungsstil in 60 Sekunden","Die wichtigste Lektion meiner Karriere","Wie ich unter Druck arbeite","Warum Teamarbeit mir wichtig ist","Wenn ich ein Tier wäre, welches und warum?","Mein perfekter Tag sieht so aus...","Die beste Erfindung der Menschheit","Wenn ich die Welt verändern könnte...","Ein Buch, das mein Leben verändert hat","Mein Lieblingshobby und warum","Drei Dinge, die ich niemals machen würde","Warum Scheitern wichtig ist","Meine kontroverseste Meinung","Wie ich mit Kritik umgehe"],q=["Warum sollten wir ausgerechnet Sie einstellen und nicht einen der 50 anderen Bewerber?","Ihr Lebenslauf zeigt eine Lücke. Was haben Sie in dieser Zeit wirklich gemacht?","Nennen Sie mir drei echte Schwächen - und bitte keine getarnten Stärken.","Warum haben Sie Ihren letzten Job wirklich verlassen?","Wo sehen Sie sich in 5 Jahren? Und seien Sie ehrlich.","Was würde Ihr schlimmster Feind über Sie sagen?","Wenn ich Ihren letzten Chef anrufe - was wird er mir sagen?","Sie sind offensichtlich überqualifiziert. Werden Sie nicht schnell gelangweilt sein?","Warum haben Sie in Ihrer Karriere nicht mehr erreicht?","Überzeugen Sie mich in 30 Sekunden, dass Sie kein Risiko sind.","Was war Ihr größter beruflicher Misserfolg?","Haben Sie andere Angebote? Warum sind wir nicht Ihre erste Wahl?"];function He(e="Elevator Pitch",t=60){return`AUDIO-TRANSKRIPTION UND ANALYSE

THEMA: "${e}"

${se()}

DEINE AUFGABE (NUR bei klar erkennbarer Sprache):
1. TRANSKRIBIEREN: Schreibe WÖRTLICH was gesprochen wird - nichts hinzufügen
2. FÜLLWÖRTER: Finde diese Wörter im Transkript: ${re()}
3. INHALT: Bewerte wie gut die Antwort zum Thema passt (0-40 Punkte)

INHALTSBEWERTUNG (content_score):
- 0: Keine Sprache / am Thema vorbei / unverständlich
- 10: Nur ansatzweise zum Thema
- 20: Teilweise zum Thema, aber oberflächlich
- 30: Gut zum Thema, mit Substanz
- 40: Exzellent, strukturiert und überzeugend

OUTPUT - NUR valides JSON:
{
  "transcript": "${S}",
  "filler_words": [],
  "content_score": 0,
  "content_feedback": "Keine Sprache erkannt."
}

ODER bei erkannter Sprache:
{
  "transcript": "Das was tatsächlich gesagt wurde...",
  "filler_words": [{"word": "Ähm", "count": 1}],
  "content_score": 30,
  "content_feedback": "Kurzes Feedback (1-2 Sätze)"
}

ANALYSE DER AUDIO-DATEI:`}const je={excellent:{range:[90,100],messages:["Perfekt! Du bist ein Rhetorik-Champion!","Wow! Makellose Präsentation!","Ausgezeichnet! So sieht ein Profi aus!"],emoji:"🏆"},good:{range:[70,89],messages:["Sehr gut! Nur kleine Verbesserungen nötig.","Stark! Fast perfekt!","Beeindruckend! Weiter so!"],emoji:"🌟"},medium:{range:[50,69],messages:["Solide Leistung! Übung macht den Meister.","Guter Ansatz! Da geht noch mehr.","Auf dem richtigen Weg!"],emoji:"💪"},needsWork:{range:[30,49],messages:["Nicht schlecht, aber hier ist Potenzial!","Die Füllwörter haben dich erwischt!","Bleib dran - Verbesserung ist möglich!"],emoji:"🎯"},poor:{range:[0,29],messages:["Ähm... da müssen wir üben!","Die Füllwörter haben gewonnen. Revanche?","Kopf hoch! Jeder Profi hat so angefangen."],emoji:"🔄"}};function Qe(e){for(const[,t]of Object.entries(je))if(e>=t.range[0]&&e<=t.range[1]){const n=Math.floor(Math.random()*t.messages.length);return{message:t.messages[n],emoji:t.emoji}}return{message:"Weiter üben!",emoji:"💪"}}function Ve(){return Y[Math.floor(Math.random()*Y.length)]}function Je(){return q[Math.floor(Math.random()*q.length)]}const et={klassiker:{id:"klassiker",title:"Der Klassiker",subtitle:"Elevator Pitch",description:"60 Sekunden, um zu überzeugen. Präsentiere dich selbst ohne Füllwörter!",duration:60,icon:"rocket",color:"blue",topic:"Stelle dich selbst vor - wer bist du, was machst du, was ist dein Ziel?"},zufall:{id:"zufall",title:"Zufalls-Thema",subtitle:"Slot Machine",description:"Ein zufälliges Thema, spontan und fließend präsentiert.",duration:60,icon:"shuffle",color:"purple",getTopic:Ve},stress:{id:"stress",title:"Stress-Test",subtitle:"Überraschungsfrage",description:"Eine knallharte Interview-Frage. Behalte die Nerven!",duration:90,icon:"zap",color:"red",getTopic:Je}},A=!1;function ce(e){return e.message?.includes("404")||e.message?.includes("not found")}function Ye(e){return e.message?.includes("API key")}function qe(e,t){const n=ie.FALLBACK_ORDER.join(", ");return ce(e)?`Kein Gemini-Modell verfügbar. Versuchte Modelle: ${n}

Mögliche Lösungen:
1. Überprüfe, ob dein API Key gültig ist
2. Stelle sicher, dass die Gemini API aktiviert ist
3. Besuche https://ai.google.dev/ um deinen API-Key zu überprüfen

Fehler: ${e.message}`:Ye(e)?`API Key Problem: ${e.message}

Stelle sicher, dass:
1. VITE_GEMINI_API_KEY korrekt in der .env Datei gesetzt ist
2. Der API Key gültig ist (überprüfe auf https://ai.google.dev/)`:e.message||"Unbekannter Fehler"}async function w({apiKey:e,content:t,context:n}){const i=`[GEMINI ${n}]`;if(!e)throw console.error(`❌ ${i} API key is missing`),new Error(R.API_KEY_MISSING);let r=null;for(const o of ie.FALLBACK_ORDER)try{return(await(await new xe(e).getGenerativeModel({model:o}).generateContent(t)).response).text()}catch(c){if(console.error(`❌ ${i} Error with ${o}:`,c.message),r=c,ce(c))continue;break}const s=qe(r);throw new Error(`Fehler bei der ${n}: ${s}`)}async function tt(e,t,n="gemini-1.5-flash",i=null,r={}){if(!e||e.trim().length===0)throw console.error("❌ [GEMINI FEEDBACK] Transcript is empty"),new Error(R.TRANSCRIPT_EMPTY);const s=i?We(i,e):Le(e,r),o=r.roleType==="simulation"?"Simulation":"Interview",c=r.userRoleLabel||"Bewerber";`${o}${c}`,`${e.length}`,e.substring(0,300);const u=await w({apiKey:t,content:s,context:"FEEDBACK"});return _.logPrompt("GEMINI_LIVE_FEEDBACK",`Live-Training Feedback-Generierung (${o})`,s,{transcript_length:e.length,custom_prompt:i?"Ja":"Nein",role_type:r.roleType||"interview",user_role_label:c},u),u}async function nt(e,t,n="gemini-1.5-flash",i={}){if(!e)throw console.error("❌ [GEMINI AUDIO] Audio file is missing"),new Error(R.AUDIO_FILE_MISSING);const r=Z(e,{minSize:ae});if(!r.valid)return console.warn(`⚠️ [GEMINI AUDIO] Audio validation failed: ${r.error}, Size: ${e.size} bytes`),JSON.stringify(oe("analysis"));const s=i.userRoleLabel||"Bewerber",o=i.agentRoleLabel||"Gesprächspartner",c=i.roleType||"interview",u=i.hasTwoVoices!==!1,d=i.transcript||null,l=await X(e),f=Be({userRoleLabel:s,agentRoleLabel:o,roleType:c,hasTwoVoices:u,transcript:d}),h=[f,l];`${s}`,`${Math.round(e.size/1024)}`,e.type;const a=await w({apiKey:t,content:h,context:"AUDIO"});return _.logPrompt("GEMINI_LIVE_AUDIO_ANALYSIS",`Live-Training Audio-Analyse (${s})`,f,{audio_size_kb:Math.round(e.size/1024),audio_type:e.type,role_type:c,user_role_label:s},a),a}async function it(e,t,n="Elevator Pitch",i=60){if(!e)throw console.error("❌ [GEMINI GAME] Audio file is missing"),new Error(R.AUDIO_FILE_MISSING);const r=Z(e,{minSize:ae});if(!r.valid)return console.warn(`⚠️ [GEMINI GAME] Audio validation failed: ${r.error}, Size: ${e.size} bytes`),oe("game");const s=await X(e),c=[He(n,i),s];`${Math.round(e.size/1024)}`;const u=await w({apiKey:t,content:c,context:"GAME"});try{let d=u.trim();d.startsWith("```json")?d=d.replace(/```json\n?/,"").replace(/\n?```$/,""):d.startsWith("```")&&(d=d.replace(/```\n?/,"").replace(/\n?```$/,""));const l=JSON.parse(d);return{transcript:l.transcript||S,filler_words:l.filler_words||[],content_score:Math.max(0,Math.min(40,l.content_score||0)),content_feedback:l.content_feedback||""}}catch(d){throw console.error("❌ [GEMINI GAME] Failed to parse response:",d),console.error("❌ [GEMINI GAME] Raw response:",u),new Error(`${R.JSON_PARSE_FAILED}: ${d.message}`)}}async function rt(e,t){const{topic:n,context:i,pros:r,cons:s,proScore:o,contraScore:c}=e;if(!n||n.trim().length===0)throw new Error("Entscheidungsfrage fehlt");const u=r.map(a=>`- "${a.text}" (Gewicht: ${a.weight}/10)`).join(`
`),d=s.map(a=>`- "${a.text}" (Gewicht: ${a.weight}/10)`).join(`
`),l=i?`
Situationsbeschreibung des Users:
"${i}"
`:"",f=`Du bist 'Decisio', ein analytischer Entscheidungs-Coach.
Deine Aufgabe: Analysiere die Entscheidungsmatrix des Users (Thema, Pro/Contra mit Gewichtung 1-10).
Ziel: Deck blinde Flecken auf und hinterfrage die Gewichtung kritisch. Nimm dem User die Entscheidung NICHT ab, sondern verbessere seine Datengrundlage.

INPUT:
Thema: ${n}
${l}
Pro-Liste (Gesamtpunkte: ${o}):
${u||"(keine Pro-Argumente)"}

Contra-Liste (Gesamtpunkte: ${c}):
${d||"(keine Contra-Argumente)"}

Rationaler Score: ${o>c?"Pro führt":c>o?"Contra führt":"Ausgeglichen"} (${o} vs ${c})

GENERATION RULES:
1. "Blind Spot": Welcher Lebensbereich (Gesundheit, Langzeit, Familie, Werte, Finanzen, Karriere, Work-Life-Balance) fehlt? Welche Perspektive wurde nicht berücksichtigt?
2. "Challenger": Identifiziere das INTERESSANTESTE oder KRITISCHSTE Argument (nicht unbedingt das mit der höchsten Gewichtung). Wähle das Argument, das am meisten hinterfragt werden sollte - vielleicht weil die Bewertung unrealistisch wirkt, wichtige Aspekte ignoriert werden, oder es auf Annahmen basiert die geprüft werden sollten.
3. "Intuition": Stelle eine systemische Frage (z.B. 10-10-10 Methode: Wie wirst du in 10 Minuten/10 Monaten/10 Jahren darüber denken? Oder: Was würdest du einem Freund in dieser Situation raten?), um das Bauchgefühl zu prüfen.

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, kein Intro, keine Erklärung außerhalb des JSON.

FORMATIERUNG DER INHALTE:
- Jede Card soll STRUKTURIERT sein, NICHT als Fließtext
- Verwende kurze, prägnante Aufzählungspunkte
- Maximal 3-5 Punkte pro Card
- Jeder Punkt soll ein konkreter, handlungsorientierter Gedanke sein

JSON SCHEMA:
{
  "analysis_summary": "Ein bis zwei Sätze zum rationalen Ergebnis.",
  "cards": [
    {
      "type": "blind_spot",
      "title": "Der blinde Fleck",
      "points": [
        "Erster fehlender Aspekt oder Lebensbereich",
        "Zweiter fehlender Aspekt",
        "Dritter fehlender Aspekt (optional)"
      ]
    },
    {
      "type": "challenger",
      "title": "Der Härtetest",
      "argument": "NUR der Text des Arguments, OHNE Gewicht (z.B. Mehr Gehalt oder Flexible Arbeitszeiten)",
      "points": [
        "Erste kritische Frage zum Argument",
        "Zweite kritische Frage",
        "Dritte kritische Frage (optional)"
      ]
    },
    {
      "type": "intuition",
      "title": "Der Bauch-Check",
      "question": "Die zentrale Reflexionsfrage (z.B. '10-10-10 Methode')",
      "points": [
        "Erster Reflexionsimpuls",
        "Zweiter Reflexionsimpuls",
        "Dritter Reflexionsimpuls (optional)"
      ]
    }
  ]
}`;r.length,s.length,Math.max(...r.map(a=>a.weight),...s.map(a=>a.weight));const h=await w({apiKey:t,content:f,context:"DECISION"});try{let a=h.trim();a.startsWith("```json")?a=a.replace(/^```json\s*\n?/,""):a.startsWith("```")&&(a=a.replace(/^```\s*\n?/,"")),a=a.replace(/\n?```\s*$/,"").trim(),a=a.replace(/"\s*\(Gewicht:\s*\d+\/10\)"/g,'"');const g=JSON.parse(a);if(!g.cards||!Array.isArray(g.cards))throw new Error("Invalid response structure: missing cards array");return _.logPrompt("GEMINI_DECISION_ANALYSIS","Entscheidungs-Kompass Analyse",f,{topic:n,context:i?"vorhanden":"nicht angegeben",pro_count:r.length,contra_count:s.length,pro_score:o,contra_score:c},h),g}catch(a){throw console.error("❌ [GEMINI DECISION] Failed to parse response:",a),console.error("❌ [GEMINI DECISION] Raw response:",h),new Error(`Fehler beim Verarbeiten der Analyse: ${a.message}`)}}async function st(e,t,n,i=null,r=[],s=[]){if(!e||e.trim().length===0)throw new Error("Entscheidungsfrage fehlt");if(!["strategist","security","feelgood","growth","future"].includes(t))throw new Error(`Ungültige Persona: ${t}`);const c=i?`
Situationsbeschreibung:
"${i}"
`:"",u=r.filter(a=>a.text?.trim()).map(a=>`- ${a.text}`),d=s.filter(a=>a.text?.trim()).map(a=>`- ${a.text}`);let l="";(u.length>0||d.length>0)&&(l=`
BEREITS ERFASSTE ARGUMENTE DES USERS:
Nutze diese als Kontext, um ERGÄNZENDE Perspektiven zu generieren. Wiederhole NICHT dieselben Punkte, sondern baue darauf auf oder beleuchte andere Aspekte.`,u.length>0&&(l+=`
Pro-Argumente:
${u.join(`
`)}`),d.length>0&&(l+=`
Contra-Argumente:
${d.join(`
`)}`),l+=`
`);const f=`Du bist ein kreativer Entscheidungs-Assistent für die Karriere-Plattform 'KarriereHeld'.
Deine Aufgabe: Generiere für eine spezifische Entscheidungsfrage Argumente aus der strikten Sicht einer gewählten Persona.
${c?"WICHTIG: Berücksichtige unbedingt die Situationsbeschreibung des Users - seine Wünsche, Ängste und Rahmenbedingungen!":""}

INPUT:
Thema: ${e}${c}${l}
Persona: ${t}

PERSONA DEFINITIONEN:
- 'strategist' (Der Stratege): Fokus auf CV, Marktwert, Geld, Macht, Karriereleiter, Prestige.
- 'security' (Der Sicherheits-Beauftragte): Fokus auf Arbeitsplatzsicherheit, Gehaltsgarantie, Risikominimierung, Beständigkeit.
- 'feelgood' (Der Feel-Good Manager): Fokus auf Mental Health, Stresslevel, Team-Kultur, Zeit für Familie, Spaß.
- 'growth' (Der Gründer): Fokus auf steile Lernkurve, Innovation, Netzwerk, "High Risk / High Reward".
- 'future' (Das Zukunfts-Ich): Fokus auf langfristigen Sinn, "Regret Minimization" (Was werde ich in 10 Jahren bereuen?), Lebensziele.

OUTPUT FORMAT (JSON):
Generiere genau 4 Vorschläge (2 Pro, 2 Contra), die extrem kurz und knackig sind (max. 10 Wörter pro Punkt).

WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt. Kein Markdown, kein Intro.

{
  "suggestions": [
    { "type": "pro", "text": "Argument für JA aus Sicht der Persona" },
    { "type": "pro", "text": "Weiteres Argument für JA..." },
    { "type": "con", "text": "Argument für NEIN aus Sicht der Persona" },
    { "type": "con", "text": "Weiteres Argument für NEIN..." }
  ]
}`,h=await w({apiKey:n,content:f,context:"BRAINSTORM"});try{let a=h.trim();a.startsWith("```json")?a=a.replace(/```json\n?/,"").replace(/\n?```$/,""):a.startsWith("```")&&(a=a.replace(/```\n?/,"").replace(/\n?```$/,""));const g=JSON.parse(a);if(!g.suggestions||!Array.isArray(g.suggestions))throw new Error("Invalid response structure: missing suggestions array");return _.logPrompt("GEMINI_DECISION_BRAINSTORM",`Entscheidungs-Kompass Brainstorming (${t})`,f,{topic:e,context:i?"vorhanden":"nicht angegeben",persona:t},h),g}catch(a){throw console.error("❌ [GEMINI BRAINSTORM] Failed to parse response:",a),console.error("❌ [GEMINI BRAINSTORM] Raw response:",h),new Error(`Fehler beim Verarbeiten der Vorschläge: ${a.message}`)}}async function ot(e,t=[],n=[],i=[],r){if(!e||e.trim().length===0)throw new Error("Entscheidungsfrage fehlt");const s=t.filter(l=>l.text?.trim()).map(l=>`- ${l.text}`).join(`
`)||"(keine)",o=n.filter(l=>l.text?.trim()).map(l=>`- ${l.text}`).join(`
`)||"(keine)";let c="";i.length>0&&(c=`
BISHERIGER GESPRÄCHSVERLAUF:
`+i.map((l,f)=>`Frage ${f+1}: "${l.question}"
Antwort: "${l.answer}"`).join(`

`));const u=`Du bist ein einfühlsamer systemischer Coach, der Menschen hilft, versteckte Motive und Gefühle bei wichtigen Entscheidungen zu entdecken.

ENTSCHEIDUNGSTHEMA: "${e}"

BEREITS ERFASSTE ARGUMENTE:
Pro:
${s}

Contra:
${o}
${c}

DEINE AUFGABE:
1. Analysiere, welche PERSPEKTIVE oder welcher LEBENSBEREICH noch nicht beleuchtet wurde
2. Identifiziere eine LÜCKE (z.B. fehlen Emotionen? Langzeitperspektive? Werte? Beziehungen? Ängste? Träume?)
3. Stelle GENAU EINE tiefgründige, offene Frage, um diese Lücke zu füllen

FRAGE-TECHNIKEN (wähle passend):
- Wunderfrage: "Stell dir vor, du wachst morgen auf und alles ist perfekt gelöst..."
- Worst-Case: "Was ist das Schlimmste, das passieren könnte, wenn..."
- Zukunfts-Ich: "Stell dir vor, es ist 5 Jahre später..."
- Werte-Check: "Was sagt diese Entscheidung über das aus, was dir wirklich wichtig ist?"
- Bauchgefühl: "Wenn du ganz ehrlich bist, was sagt dein Körper dazu?"
- Mentor-Perspektive: "Was würde dir jemand raten, der dich sehr gut kennt?"

REGELN:
- Verwende die "Du"-Form (persönlich, warm)
- Halte die Frage kurz (max. 2 Sätze)
- Vermeide Wiederholungen von bereits gestellten Fragen
- Die Frage soll zum Nachdenken anregen, nicht suggestiv sein

AUSGABE (nur JSON, kein Markdown):
{
  "question": "Deine Frage hier...",
  "question_type": "wunderfrage|worst_case|zukunft|werte|bauchgefühl|mentor|andere",
  "targets_gap": "Kurze Beschreibung, welche Lücke diese Frage adressiert"
}`,d=await w({apiKey:r,content:u,context:"WIZARD_QUESTION"});try{let l=d.trim();l.startsWith("```json")?l=l.replace(/```json\n?/,"").replace(/\n?```$/,""):l.startsWith("```")&&(l=l.replace(/```\n?/,"").replace(/\n?```$/,""));const f=JSON.parse(l);return _.logPrompt("GEMINI_WIZARD_QUESTION","Deep Dive Wizard - Frage generieren",u,{topic:e,existing_pros:t.length,existing_cons:n.length},d),f}catch(l){throw console.error("❌ [GEMINI WIZARD] Failed to parse question response:",l),new Error(`Fehler beim Generieren der Frage: ${l.message}`)}}async function at(e,t,n,i){if(!n||n.trim().length<10)return{extracted_items:[],message:"Antwort zu kurz für Analyse"};const r=`Du bist ein Daten-Analyst für Entscheidungsprozesse. Deine Aufgabe ist es, aus Freitext-Antworten strukturierte Argumente zu extrahieren.

KONTEXT:
Entscheidungsthema: "${e}"
Gestellte Frage: "${t}"

ANTWORT DES USERS:
"${n}"

DEINE AUFGABE:
1. Identifiziere die KERN-ARGUMENTE im Text (max. 3 Stück)
2. Klassifiziere jedes als "pro" (spricht FÜR das Thema/JA) oder "con" (spricht DAGEGEN/NEIN)
3. Formuliere sie in KURZE, PRÄGNANTE Stichpunkte um (substantivisch, max. 8 Wörter)
4. Schätze die WICHTIGKEIT (weight 1-10) basierend auf:
   - Emotionale Intensität der Wortwahl
   - Wie oft/ausführlich der Punkt erwähnt wird
   - Körperliche Reaktionen (Bauchgefühl, Stress, etc.)

BEISPIELE für gute Extraktionen:
- "Ich kriege immer Bauchschmerzen" → "Körperliche Stressreaktion", weight: 8-9
- "Das Geld ist halt wichtig" → "Finanzielle Sicherheit", weight: 6-7
- "Ich träume davon seit Jahren" → "Langgehegter Lebenstraum", weight: 9

WICHTIG:
- Wenn der Text keine klaren Argumente enthält (z.B. "weiß nicht", zu vage), gib ein leeres Array zurück
- Extrahiere NUR das, was der User tatsächlich gesagt hat - erfinde nichts dazu
- Pro/Con bezieht sich auf das THEMA, nicht auf die Frage

AUSGABE (nur JSON, kein Markdown):
{
  "extracted_items": [
    {
      "type": "pro|con",
      "text": "Kurzer prägnanter Stichpunkt",
      "weight": 1-10,
      "source_quote": "Originalzitat aus der Antwort"
    }
  ],
  "analysis_note": "Kurze Notiz, was du erkannt hast (optional)"
}`,s=await w({apiKey:i,content:r,context:"WIZARD_EXTRACT"});try{let o=s.trim();o.startsWith("```json")?o=o.replace(/```json\n?/,"").replace(/\n?```$/,""):o.startsWith("```")&&(o=o.replace(/```\n?/,"").replace(/\n?```$/,""));const c=JSON.parse(o);return _.logPrompt("GEMINI_WIZARD_EXTRACT","Deep Dive Wizard - Argumente extrahieren",r,{topic:e,question_length:t.length,answer_length:n.length},s),c}catch(o){throw console.error("❌ [GEMINI EXTRACT] Failed to parse extraction response:",o),new Error(`Fehler beim Extrahieren der Argumente: ${o.message}`)}}export{xe as G,ae as M,nt as a,et as b,oe as c,it as d,Qe as e,ot as f,tt as g,at as h,st as i,rt as j};
