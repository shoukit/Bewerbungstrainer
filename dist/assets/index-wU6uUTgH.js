const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./ui-vendor-Cix6Gssq.js","./react-vendor-uDOJF2jQ.js","./FeatureInfoButton-Ca11wQwo.js","./FeatureInfoButton.css"])))=>i.map(i=>d[i]);
import{j as e,B as D,L,E as Z,u as q,m as N,a2 as W,l as F,z as X,a$ as G,a as M,a0 as Q,a1 as Y,i as ee,Y as te,F as se,M as ie,V as ne,e as re,Z as ae,g as P,f as oe,a7 as le}from"./ui-vendor-Cix6Gssq.js";import{a as C}from"./react-vendor-uDOJF2jQ.js";import{C as y,B as T}from"./select-native-BY39Up9p.js";import{g as B,a as O,u as ce,C as p,q as de}from"./FeatureInfoButton-Ca11wQwo.js";import"./dialog-hfgJFxQL.js";import{u as me}from"./useMobile-YxjH166V.js";import{P as he}from"./ProgressChart-CUdbU__s.js";import{F as $}from"./FeatureAppHeader-COrZ9MSu.js";import{_ as ge}from"./index.js";import"./utils-BEHD0UYf.js";import"./index-CklPxmEV.js";const ue=t=>{const{totalSessions:i,moduleBreakdown:n,averageScores:o,recentTrend:d,topStrengths:l,topWeaknesses:a,fillerWordAverage:m,pacingIssues:c,lastSessionDate:g,daysSinceLastSession:j}=t;return`Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${i}
- Letztes Training: ${g||"Unbekannt"} (vor ${j} Tagen)

### Module-Aktivität
${Object.entries(n).map(([x,v])=>`- ${x}: ${v} Sessions`).join(`
`)}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(o).map(([x,v])=>`- ${x}: ${v!==null?Math.round(v):"Keine Daten"}`).join(`
`)}

### Trend (letzte 30 Tage vs. davor)
${d?`${d>0?"+":""}${d.toFixed(1)}% Veränderung`:"Nicht genug Daten"}

### Identifizierte Stärken (aus Feedback)
${l.length>0?l.map(x=>`- ${x}`).join(`
`):"Noch keine identifiziert"}

### Identifizierte Schwächen (aus Feedback)
${a.length>0?a.map(x=>`- ${x}`).join(`
`):"Noch keine identifiziert"}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${m!==null?m.toFixed(1):"Keine Daten"}
- Häufige Tempo-Probleme: ${c.length>0?c.join(", "):"Keine erkannt"}

## DEINE AUFGABE

Erstelle eine motivierende, aber ehrliche Coaching-Analyse. Der Nutzer soll verstehen:
1. Wo er/sie aktuell steht
2. Was gut läuft
3. Was verbessert werden sollte
4. Konkrete nächste Schritte

## AUSGABE-FORMAT (JSON)

Antworte NUR mit validem JSON in exakt diesem Format:

{
  "level": {
    "name": "Anfänger|Fortgeschritten|Profi|Experte",
    "score": 0-100,
    "description": "Kurze Beschreibung des Levels (1 Satz)"
  },
  "summary": "2-3 Sätze Gesamtfazit - motivierend aber realistisch",
  "strengths": [
    {
      "title": "Stärke (kurz)",
      "description": "Erklärung warum das eine Stärke ist",
      "evidence": "Konkrete Daten/Beobachtungen"
    }
  ],
  "focusAreas": [
    {
      "title": "Fokusbereich (kurz)",
      "priority": "hoch|mittel|niedrig",
      "description": "Warum ist das wichtig?",
      "currentState": "Aktueller Stand basierend auf Daten",
      "targetState": "Was sollte erreicht werden?"
    }
  ],
  "recommendations": [
    {
      "action": "Konkrete Handlung",
      "module": "rhetorik-gym|szenario-training|wirkungs-analyse|live-simulation|smart-briefing",
      "reason": "Warum diese Empfehlung?",
      "frequency": "z.B. '2x pro Woche' oder 'Täglich 5 Min'"
    }
  ],
  "nextStep": {
    "title": "Der wichtigste nächste Schritt",
    "description": "Detaillierte Beschreibung was zu tun ist",
    "module": "rhetorik-gym|szenario-training|wirkungs-analyse|live-simulation|smart-briefing",
    "estimatedTime": "z.B. '10 Minuten'"
  },
  "motivation": "Ein motivierender Satz zum Abschluss"
}

## WICHTIGE REGELN

1. Sei KONKRET - nutze die echten Zahlen und Daten
2. Sei EHRLICH - keine leeren Floskeln
3. Sei MOTIVIEREND - betone Fortschritte und Potenzial
4. Sei PRAKTISCH - alle Empfehlungen müssen umsetzbar sein
5. Bei wenig Daten (< 5 Sessions): Fokussiere auf "Erste Schritte" statt tiefe Analyse
6. Maximal 3 Stärken, 3 Fokusbereiche, 4 Empfehlungen
7. Der "nextStep" sollte der WICHTIGSTE und am leichtesten umsetzbare sein

## LEVEL-KRITERIEN

- **Anfänger** (0-25): < 10 Sessions, unsichere Grundlagen
- **Fortgeschritten** (26-50): 10-30 Sessions, solide Basis, einige Schwächen
- **Profi** (51-75): 30-60 Sessions, konstant gute Leistungen
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`},xe=()=>`Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

Erstelle eine einladende Willkommens-Analyse, die den Nutzer motiviert, mit dem Training zu beginnen.

## AUSGABE-FORMAT (JSON)

{
  "level": {
    "name": "Einsteiger",
    "score": 0,
    "description": "Bereit für den Start deiner Trainingsreise!"
  },
  "summary": "Willkommen! Du stehst am Anfang einer spannenden Lernreise. Mit regelmäßigem Training wirst du schnell Fortschritte sehen.",
  "strengths": [
    {
      "title": "Motivation",
      "description": "Du hast den ersten Schritt gemacht und bist hier",
      "evidence": "Das Interesse an Verbesserung ist der wichtigste Ausgangspunkt"
    }
  ],
  "focusAreas": [
    {
      "title": "Erste Erfahrungen sammeln",
      "priority": "hoch",
      "description": "Lerne die verschiedenen Trainingsmodule kennen",
      "currentState": "Noch keine Trainings absolviert",
      "targetState": "5 verschiedene Sessions in der ersten Woche"
    }
  ],
  "recommendations": [
    {
      "action": "Starte mit dem Rhetorik-Gym",
      "module": "rhetorik-gym",
      "reason": "Kurze Sessions (60 Sekunden) - perfekt zum Einstieg",
      "frequency": "1x täglich"
    },
    {
      "action": "Erstelle dein erstes Smart Briefing",
      "module": "smart-briefing",
      "reason": "Bereite dich auf ein konkretes Gespräch vor",
      "frequency": "Vor wichtigen Terminen"
    },
    {
      "action": "Probiere das Szenario-Training",
      "module": "szenario-training",
      "reason": "Strukturiertes Üben mit sofortigem Feedback",
      "frequency": "2-3x pro Woche"
    }
  ],
  "nextStep": {
    "title": "Dein erstes Rhetorik-Gym Spiel",
    "description": "Sprich 60 Sekunden zu einem beliebigen Thema. Du bekommst sofort Feedback zu deinen Füllwörtern und deinem Sprechtempo.",
    "module": "rhetorik-gym",
    "estimatedTime": "2 Minuten"
  },
  "motivation": "Jede Reise beginnt mit dem ersten Schritt - und du hast ihn gerade gemacht! 🚀"
}`;async function pe(){const t=B(),i={"X-WP-Nonce":O()};try{const[n,o,d,l]=await Promise.all([fetch(`${t}/simulator/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/video-training/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/games`,{headers:i,credentials:"same-origin"})]),[a,m,c,g]=await Promise.all([n.ok?n.json():{data:[]},o.ok?o.json():{data:[]},d.ok?d.json():{data:[]},l.ok?l.json():{data:[]}]);return{simulator:a.data||a||[],video:m.data||m||[],roleplay:c.data||c||[],games:g.data||g||[]}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch sessions:",n),{simulator:[],video:[],roleplay:[],games:[]}}}async function fe(){const t=B(),i={"X-WP-Nonce":O()};try{const[n,o,d,l]=await Promise.all([fetch(`${t}/simulator/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/video-training/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/smartbriefing/templates`,{headers:i,credentials:"same-origin"})]),[a,m,c,g]=await Promise.all([n.ok?n.json():[],o.ok?o.json():[],d.ok?d.json():[],l.ok?l.json():[]]);return{simulator:Array.isArray(a)?a:a.data||[],video:Array.isArray(m)?m:m.data||[],roleplay:Array.isArray(c)?c:c.data||[],briefingTemplates:Array.isArray(g)?g:g.data||[]}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch scenarios:",n),{simulator:[],video:[],roleplay:[],briefingTemplates:[]}}}function ye(t){const{simulator:i,video:n,roleplay:o,games:d}=t,l=[...i.map(s=>({...s,module:"Szenario-Training"})),...n.map(s=>({...s,module:"Wirkungs-Analyse"})),...o.map(s=>({...s,module:"Live-Simulation"})),...d.map(s=>({...s,module:"Rhetorik-Gym"}))],a=l.length,m={"Szenario-Training":i.length,"Wirkungs-Analyse":n.length,"Live-Simulation":o.length,"Rhetorik-Gym":d.length},c={overall:[],communication:[],content:[],structure:[],confidence:[],fillerWords:[]};i.forEach(s=>{if(s.overall_score!=null){const r=parseFloat(s.overall_score);c.overall.push(r<=10?r*10:r)}try{const r=typeof s.summary_feedback_json=="string"?JSON.parse(s.summary_feedback_json):s.summary_feedback_json;r?.scores&&(r.scores.content!=null&&c.content.push(r.scores.content*10),r.scores.structure!=null&&c.structure.push(r.scores.structure*10))}catch{}}),n.forEach(s=>{if(s.overall_score!=null){const r=parseFloat(s.overall_score);c.overall.push(r<=10?r*10:r)}}),o.forEach(s=>{try{const r=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json;r?.rating?.overall!=null&&c.overall.push(r.rating.overall*10),r?.rating?.communication!=null&&c.communication.push(r.rating.communication*10)}catch{}});let g=0,j=0;d.forEach(s=>{s.score!=null&&c.overall.push(parseFloat(s.score)),s.filler_count!=null&&(g+=parseInt(s.filler_count),j++)});const x=s=>s.length>0?s.reduce((r,b)=>r+b,0)/s.length:null,v={Gesamt:x(c.overall),Kommunikation:x(c.communication),Inhalt:x(c.content),Struktur:x(c.structure)},S=new Date;S.setDate(S.getDate()-30);const A=[],w=[];l.forEach(s=>{const r=new Date(s.created_at),b=s.overall_score||s.score;if(b!=null){const k=parseFloat(b)<=10?parseFloat(b)*10:parseFloat(b);r>=S?A.push(k):w.push(k)}});const h=x(A),z=x(w),E=h!=null&&z!=null&&z>0?(h-z)/z*100:null,f={},u={};[...i,...n,...o].forEach(s=>{try{let r=s.summary_feedback_json||s.feedback_json||s.analysis_json;typeof r=="string"&&(r=JSON.parse(r)),r?.strengths&&r.strengths.forEach(b=>{const k=b.toLowerCase().substring(0,50);f[k]=(f[k]||0)+1}),(r?.improvements||r?.weaknesses)&&(r.improvements||r.weaknesses||[]).forEach(b=>{const k=b.toLowerCase().substring(0,50);u[k]=(u[k]||0)+1})}catch{}});const R=Object.entries(f).sort((s,r)=>r[1]-s[1]).slice(0,5).map(([s])=>s),V=Object.entries(u).sort((s,r)=>r[1]-s[1]).slice(0,5).map(([s])=>s),I=l.filter(s=>s.created_at).sort((s,r)=>new Date(r.created_at)-new Date(s.created_at)),H=I[0]?.created_at?new Date(I[0].created_at).toLocaleDateString("de-DE"):null,J=I[0]?.created_at?Math.floor((Date.now()-new Date(I[0].created_at))/(1e3*60*60*24)):null,_=[];return[...i,...d].forEach(s=>{try{let r=s.audio_analysis||s.analysis_json;typeof r=="string"&&(r=JSON.parse(r)),r?.pacing?.rating&&r.pacing.rating!=="optimal"&&(_.includes(r.pacing.rating)||_.push(r.pacing.rating))}catch{}}),{totalSessions:a,moduleBreakdown:m,averageScores:v,recentTrend:E,topStrengths:R,topWeaknesses:V,fillerWordAverage:j>0?g/j:null,pacingIssues:_,lastSessionDate:H,daysSinceLastSession:J??999,rawSessions:t}}function be(t){const{simulator:i,video:n,roleplay:o,briefingTemplates:d}=t;let l=`
## VERFÜGBARE TRAININGS-SZENARIEN

`;return i.length>0&&(l+=`### Szenario-Training (strukturiertes Q&A mit Feedback)
`,i.forEach(a=>{const m=a.difficulty||a.meta?.difficulty||"Mittel";l+=`- ID:${a.id} "${a.title}" [${m}]${a.description?` - ${a.description.substring(0,100)}`:""}
`}),l+=`
`),n.length>0&&(l+=`### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)
`,n.forEach(a=>{l+=`- ID:${a.id} "${a.title}"${a.description?` - ${a.description.substring(0,100)}`:""}
`}),l+=`
`),o.length>0&&(l+=`### Live-Simulation (Echtzeit-Gespräch mit KI)
`,o.forEach(a=>{l+=`- ID:${a.id} "${a.title}"${a.description?` - ${a.description.substring(0,100)}`:""}
`}),l+=`
`),d.length>0&&(l+=`### Smart Briefing (KI-generierte Wissenspakete)
`,d.forEach(a=>{l+=`- ID:${a.id} "${a.title}" [${a.category||"Allgemein"}]
`}),l+=`
`),l+=`### Rhetorik-Gym (Kurze Sprechübungen)
`,l+=`- "Der Klassiker" - 60 Sekunden freies Sprechen
`,l+=`- "Zufalls-Thema" - Überraschungsthema per Zufall
`,l+=`- "Stress-Test" - 90 Sekunden mit wechselnden Fragen
`,l}async function je(t,i){const{totalSessions:n}=t;if(n<3){console.log("[CoachingIntelligence] New user - using welcome prompt");const a=xe();try{return{...await K(a),isWelcome:!0,generatedAt:new Date().toISOString()}}catch(m){return console.error("[CoachingIntelligence] Failed to generate welcome coaching:",m),ve()}}const o=be(i),l=ue(t)+`
`+o+`

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;try{return{...await K(l),isWelcome:!1,generatedAt:new Date().toISOString(),sessionStats:t}}catch(a){throw console.error("[CoachingIntelligence] Failed to generate coaching analysis:",a),a}}async function K(t){const{GoogleGenerativeAI:i}=await ge(async()=>{const{GoogleGenerativeAI:c}=await import("./index.js").then(g=>g.x);return{GoogleGenerativeAI:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),n=window.bewerbungstrainerSettings?.geminiApiKey;if(!n)throw new Error("Gemini API key not configured");const m=(await(await new i(n).getGenerativeModel({model:"gemini-2.0-flash-exp"}).generateContent(t)).response).text();try{const c=m.match(/```(?:json)?\s*([\s\S]*?)```/),g=c?c[1].trim():m.trim();return JSON.parse(g)}catch(c){throw console.error("[CoachingIntelligence] Failed to parse Gemini response:",c),console.log("[CoachingIntelligence] Raw response:",m),new Error("Failed to parse AI response")}}function ve(){return{isWelcome:!0,level:{name:"Einsteiger",score:0,description:"Bereit für den Start!"},summary:"Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.",strengths:[{title:"Motivation",description:"Du bist hier - das ist der erste Schritt",evidence:"Interesse an Verbesserung ist die beste Voraussetzung"}],focusAreas:[{title:"Erste Erfahrungen sammeln",priority:"hoch",description:"Lerne die Module kennen",currentState:"Noch keine Trainings",targetState:"5 Sessions in der ersten Woche"}],recommendations:[{action:"Starte mit dem Rhetorik-Gym",module:"rhetorik-gym",reason:"Kurze Sessions zum Einstieg",frequency:"1x täglich"}],nextStep:{title:"Dein erstes Rhetorik-Gym",description:"Sprich 60 Sekunden zu einem Thema deiner Wahl",module:"rhetorik-gym",estimatedTime:"2 Minuten"},motivation:"Jede Reise beginnt mit dem ersten Schritt!",generatedAt:new Date().toISOString()}}async function Se(){console.log("[CoachingIntelligence] Starting analysis...");const[t,i]=await Promise.all([pe(),fe()]);console.log("[CoachingIntelligence] Data fetched:",{sessions:{simulator:t.simulator.length,video:t.video.length,roleplay:t.roleplay.length,games:t.games.length},scenarios:{simulator:i.simulator.length,video:i.video.length,roleplay:i.roleplay.length,briefingTemplates:i.briefingTemplates.length}});const n=ye(t);return console.log("[CoachingIntelligence] Stats aggregated:",{totalSessions:n.totalSessions,averageScores:n.averageScores}),{coaching:await je(n,i),stats:n,scenarios:i,sessions:t}}const U={"rhetorik-gym":re,"szenario-training":F,"wirkungs-analyse":ne,"live-simulation":ie,"smart-briefing":se},ke={"rhetorik-gym":"rhetorik-gym","szenario-training":"simulator","wirkungs-analyse":"video-training","live-simulation":"roleplay","smart-briefing":"smart-briefing"},Ne={Einsteiger:p.slate[400],Anfänger:p.amber[500],Fortgeschritten:p.blue[500],Profi:p.emerald[500],Experte:p.purple[500]},we=({level:t})=>{const i=Ne[t.name]||p.indigo[500],n=t.score||0,o=54,d=o*2*Math.PI,l=d-n/100*d;return e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:"relative",style:{width:140,height:140},children:[e.jsxs("svg",{width:140,height:140,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:70,cy:70,r:o,fill:"none",stroke:p.slate[200],strokeWidth:10}),e.jsx(N.circle,{cx:70,cy:70,r:o,fill:"none",stroke:i,strokeWidth:10,strokeLinecap:"round",strokeDasharray:d,initial:{strokeDashoffset:d},animate:{strokeDashoffset:l},transition:{duration:1.5,ease:"easeOut"}})]}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx(Q,{size:32,style:{color:i}}),e.jsx("span",{className:"text-2xl font-bold text-slate-900 mt-1",children:t.score})]})]}),e.jsxs("div",{className:"mt-3 text-center",children:[e.jsx("span",{className:"text-lg font-bold px-4 py-1 rounded-full",style:{backgroundColor:`${i}20`,color:i},children:t.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-2",children:t.description})]})]})},ze=({strength:t,index:i})=>e.jsx(N.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:i*.1},children:e.jsx(y,{className:"p-4 border-l-4 border-l-green-500",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0",children:e.jsx(W,{size:18,className:"text-green-600"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),t.evidence&&e.jsx("p",{className:"text-xs text-slate-400 mt-1 italic",children:t.evidence})]})]})})}),Ee=({area:t,index:i})=>{const n={hoch:{bg:"bg-red-100",text:"text-red-600",border:"border-red-500"},mittel:{bg:"bg-amber-100",text:"text-amber-600",border:"border-amber-500"},niedrig:{bg:"bg-blue-100",text:"text-blue-600",border:"border-blue-500"}},o=n[t.priority]||n.mittel;return e.jsx(N.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:i*.1},children:e.jsx(y,{className:`p-4 border-l-4 ${o.border}`,children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("span",{className:`text-[10px] font-medium px-2 py-0.5 rounded-full ${o.bg} ${o.text}`,children:t.priority})]}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),e.jsxs("div",{className:"mt-2 flex gap-4 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Aktuell: "}),e.jsx("span",{className:"text-slate-600",children:t.currentState})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Ziel: "}),e.jsx("span",{className:"text-green-600 font-medium",children:t.targetState})]})]})]}),e.jsx(F,{size:20,className:o.text})]})})})},Ce=({rec:t,index:i,onNavigate:n})=>{const o=U[t.module]||F;return e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:i*.1},children:e.jsx(y,{className:"p-4 hover:shadow-md transition-shadow",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(o,{size:20,className:"text-primary"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.action}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:t.reason}),t.frequency&&e.jsxs("div",{className:"flex items-center gap-1 mt-2 text-xs text-slate-400",children:[e.jsx(P,{size:12}),e.jsx("span",{children:t.frequency})]})]}),e.jsx(T,{variant:"secondary",size:"sm",className:"flex-shrink-0",onClick:()=>n(t.module,t.scenario_id),children:e.jsx(le,{size:14})})]})})})},Ae=({nextStep:t,onNavigate:i})=>{const n=U[t.module]||ae;return e.jsx(N.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:.3},children:e.jsxs(y,{className:"p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5",onClick:()=>i(t.module,t.scenario_id),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(M,{size:20,className:"text-primary"}),e.jsx("span",{className:"text-xs font-semibold text-primary uppercase tracking-wide",children:"Nächster Schritt"})]}),e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 mb-4",children:t.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(n,{size:16}),e.jsx("span",{className:"capitalize",children:t.module?.replace("-"," ")})]}),t.estimatedTime&&e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(P,{size:16}),e.jsx("span",{children:t.estimatedTime})]})]}),e.jsx(T,{icon:e.jsx(oe,{size:16}),children:"Jetzt starten"})]})]})})},De=({stats:t})=>{const i=[{label:"Gesamt Sessions",value:t.totalSessions,icon:G,color:p.indigo[500]},{label:"Ø Bewertung",value:t.averageScores?.Gesamt!=null?`${Math.round(t.averageScores.Gesamt)}%`:"—",icon:Y,color:p.amber[500]},{label:"Trend (30 Tage)",value:t.recentTrend!=null?`${t.recentTrend>0?"+":""}${t.recentTrend.toFixed(1)}%`:"—",icon:ee,color:t.recentTrend>0?p.emerald[500]:p.red[500]},{label:"Letztes Training",value:t.daysSinceLastSession!=null&&t.daysSinceLastSession<999?t.daysSinceLastSession===0?"Heute":`Vor ${t.daysSinceLastSession}d`:"—",icon:te,color:p.blue[500]}];return e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:i.map((n,o)=>e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:o*.05},children:e.jsxs(y,{className:"p-4 text-center",children:[e.jsx(n.icon,{size:24,className:"mx-auto mb-2",style:{color:n.color}}),e.jsx("div",{className:"text-2xl font-bold text-slate-900",children:n.value}),e.jsx("div",{className:"text-xs text-slate-500",children:n.label})]})},n.label))})},Pe=({isAuthenticated:t,requireAuth:i,onNavigate:n})=>{const o=me(),{branding:d}=ce();d?.primaryAccent||p.indigo[500];const[l,a]=C.useState(!0),[m,c]=C.useState(!1),[g,j]=C.useState(null),[x,v]=C.useState(null),S=C.useCallback(async(f=!1)=>{if(!t){a(!1);return}try{f?c(!0):a(!0),j(null);const u=await Se();v(u)}catch(u){console.error("[KiCoach] Failed to load coaching:",u),j("Fehler beim Laden der Coaching-Analyse")}finally{a(!1),c(!1)}},[t]);C.useEffect(()=>{S()},[S]);const A=(f,u)=>{const R=ke[f]||f;n&&n(R,u)};C.useEffect(()=>{!t&&i&&i()},[t,i]);const w=de(p.indigo[600],p.purple[500]);if(l)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs("div",{className:"text-center",children:[e.jsx(L,{size:48,className:"text-primary animate-spin mx-auto"}),e.jsx("p",{className:"text-slate-500 mt-4",children:"Analysiere deine Trainings..."})]})})]});if(!t)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(y,{className:"p-8 text-center max-w-md",children:[e.jsx(D,{size:48,className:"text-primary mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Anmeldung erforderlich"}),e.jsx("p",{className:"text-slate-600 mb-6",children:"Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein."}),e.jsx(T,{onClick:i,children:"Anmelden"})]})})]});if(g&&!x)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(y,{className:"p-8 text-center max-w-md",children:[e.jsx(Z,{size:48,className:"text-red-500 mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Fehler beim Laden"}),e.jsx("p",{className:"text-slate-600 mb-6",children:g}),e.jsx(T,{onClick:()=>S(),children:"Erneut versuchen"})]})})]});const{coaching:h,stats:z,sessions:E}=x||{};return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w,rightContent:e.jsxs(T,{variant:"secondary",size:"sm",onClick:()=>S(!0),disabled:m,className:"bg-white/20 border-white/30 text-white hover:bg-white/30",children:[m?e.jsx(L,{size:16,className:"animate-spin"}):e.jsx(q,{size:16}),e.jsx("span",{className:"ml-2 hidden sm:inline",children:"Aktualisieren"})]})}),e.jsx("div",{className:`${o?"p-4":"px-8 py-6"}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("div",{className:`grid gap-6 ${o?"grid-cols-1":"grid-cols-3"}`,children:[e.jsx(y,{className:"p-6 flex items-center justify-center",children:h?.level&&e.jsx(we,{level:h.level})}),e.jsxs("div",{className:`${o?"":"col-span-2"}`,children:[z&&e.jsx(De,{stats:z}),h?.summary&&e.jsx(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.2},className:"mt-4",children:e.jsx(y,{className:"p-4 bg-gradient-to-r from-slate-50 to-slate-100",children:e.jsx("p",{className:"text-sm text-slate-700 leading-relaxed",children:h.summary})})})]})]}),h?.nextStep&&e.jsx(Ae,{nextStep:h.nextStep,onNavigate:A}),e.jsxs("div",{className:`grid gap-6 ${o?"grid-cols-1":"grid-cols-2"}`,children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(W,{size:20,className:"text-green-500"}),"Deine Stärken"]}),e.jsxs("div",{className:"space-y-3",children:[h?.strengths?.map((f,u)=>e.jsx(ze,{strength:f,index:u},u)),(!h?.strengths||h.strengths.length===0)&&e.jsx(y,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Stärken identifiziert. Absolviere mehr Trainings!"})]})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(F,{size:20,className:"text-amber-500"}),"Fokus-Bereiche"]}),e.jsxs("div",{className:"space-y-3",children:[h?.focusAreas?.map((f,u)=>e.jsx(Ee,{area:f,index:u},u)),(!h?.focusAreas||h.focusAreas.length===0)&&e.jsx(y,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Fokus-Bereiche identifiziert."})]})]})]}),h?.recommendations?.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(X,{size:20,className:"text-primary"}),"Empfehlungen für dich"]}),e.jsx("div",{className:`grid gap-4 ${o?"grid-cols-1":"grid-cols-2"}`,children:h.recommendations.map((f,u)=>e.jsx(Ce,{rec:f,index:u,onNavigate:A},u))})]}),E&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(G,{size:20,className:"text-indigo-500"}),"Dein Fortschritt"]}),e.jsx(y,{className:"p-4",children:e.jsx(he,{simulatorSessions:E.simulator,videoSessions:E.video,roleplaySessions:E.roleplay,gameSessions:E.games})})]}),h?.motivation&&e.jsxs(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"text-center py-8",children:[e.jsx(M,{size:24,className:"text-primary mx-auto mb-3"}),e.jsxs("p",{className:"text-lg font-medium text-slate-700 italic",children:['"',h.motivation,'"']})]})]})})]})};export{Pe as KiCoachApp};
