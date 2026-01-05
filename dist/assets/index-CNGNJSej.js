const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./ui-vendor-Cix6Gssq.js","./react-vendor-uDOJF2jQ.js","./FeatureInfoButton-Ca11wQwo.js","./FeatureInfoButton.css"])))=>i.map(i=>d[i]);
import{j as e,B as D,L,E as Z,u as q,m as N,a2 as W,l as F,z as X,a$ as G,a as M,a0 as Q,a1 as Y,i as ee,Y as te,F as se,M as ie,V as ne,e as re,Z as ae,g as P,f as le,a7 as oe}from"./ui-vendor-Cix6Gssq.js";import{a as E}from"./react-vendor-uDOJF2jQ.js";import{C as b,B as T}from"./select-native-BY39Up9p.js";import{g as B,a as O,w as ce,u as de,C as f,q as me}from"./FeatureInfoButton-Ca11wQwo.js";import"./dialog-hfgJFxQL.js";import{u as he}from"./useMobile-YxjH166V.js";import{P as ge}from"./ProgressChart-CUdbU__s.js";import{F as $}from"./FeatureAppHeader-COrZ9MSu.js";import{_ as ue}from"./index.js";import"./utils-BEHD0UYf.js";import"./index-CklPxmEV.js";const xe=t=>{const{totalSessions:i,moduleBreakdown:n,averageScores:l,recentTrend:m,topStrengths:o,topWeaknesses:a,fillerWordAverage:h,pacingIssues:d,lastSessionDate:p,daysSinceLastSession:u}=t;return`Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${i}
- Letztes Training: ${p||"Unbekannt"} (vor ${u} Tagen)

### Module-Aktivität
${Object.entries(n).map(([c,v])=>`- ${c}: ${v} Sessions`).join(`
`)}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(l).map(([c,v])=>`- ${c}: ${v!==null?Math.round(v):"Keine Daten"}`).join(`
`)}

### Trend (letzte 30 Tage vs. davor)
${m?`${m>0?"+":""}${m.toFixed(1)}% Veränderung`:"Nicht genug Daten"}

### Identifizierte Stärken (aus Feedback)
${o.length>0?o.map(c=>`- ${c}`).join(`
`):"Noch keine identifiziert"}

### Identifizierte Schwächen (aus Feedback)
${a.length>0?a.map(c=>`- ${c}`).join(`
`):"Noch keine identifiziert"}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${h!==null?h.toFixed(1):"Keine Daten"}
- Häufige Tempo-Probleme: ${d.length>0?d.join(", "):"Keine erkannt"}

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
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`},pe=()=>`Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

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
}`;async function fe(){const t=B(),i={"X-WP-Nonce":O()};try{const[n,l,m,o]=await Promise.all([fetch(`${t}/simulator/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/video-training/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/sessions`,{headers:i,credentials:"same-origin"}),fetch(`${t}/games`,{headers:i,credentials:"same-origin"})]),[a,h,d,p]=await Promise.all([n.ok?n.json():{data:[]},l.ok?l.json():{data:[]},m.ok?m.json():{data:[]},o.ok?o.json():{data:[]}]),u=c=>Array.isArray(c)?c:c&&Array.isArray(c.data)?c.data:[];return{simulator:u(a),video:u(h),roleplay:u(d),games:u(p)}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch sessions:",n),{simulator:[],video:[],roleplay:[],games:[]}}}async function ye(){const t=B(),i={"X-WP-Nonce":O()};try{const[n,l,m,o]=await Promise.all([fetch(`${t}/simulator/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/video-training/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/scenarios`,{headers:i,credentials:"same-origin"}),fetch(`${t}/smartbriefing/templates`,{headers:i,credentials:"same-origin"})]),[a,h,d,p]=await Promise.all([n.ok?n.json():[],l.ok?l.json():[],m.ok?m.json():[],o.ok?o.json():[]]),u=c=>Array.isArray(c)?c:c&&Array.isArray(c.data)?c.data:[];return{simulator:u(a),video:u(h),roleplay:u(d),briefingTemplates:u(p)}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch scenarios:",n),{simulator:[],video:[],roleplay:[],briefingTemplates:[]}}}function be(t){const i=Array.isArray(t?.simulator)?t.simulator:[],n=Array.isArray(t?.video)?t.video:[],l=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.games)?t.games:[],o=[...i.map(s=>({...s,module:"Szenario-Training"})),...n.map(s=>({...s,module:"Wirkungs-Analyse"})),...l.map(s=>({...s,module:"Live-Simulation"})),...m.map(s=>({...s,module:"Rhetorik-Gym"}))],a=o.length,h={"Szenario-Training":i.length,"Wirkungs-Analyse":n.length,"Live-Simulation":l.length,"Rhetorik-Gym":m.length},d={overall:[],communication:[],content:[],structure:[],confidence:[],fillerWords:[]};i.forEach(s=>{if(s.overall_score!=null){const r=parseFloat(s.overall_score);d.overall.push(r<=10?r*10:r)}try{const r=typeof s.summary_feedback_json=="string"?JSON.parse(s.summary_feedback_json):s.summary_feedback_json;r?.scores&&(r.scores.content!=null&&d.content.push(r.scores.content*10),r.scores.structure!=null&&d.structure.push(r.scores.structure*10))}catch{}}),n.forEach(s=>{if(s.overall_score!=null){const r=parseFloat(s.overall_score);d.overall.push(r<=10?r*10:r)}}),l.forEach(s=>{try{const r=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json;r?.rating?.overall!=null&&d.overall.push(r.rating.overall*10),r?.rating?.communication!=null&&d.communication.push(r.rating.communication*10)}catch{}});let p=0,u=0;m.forEach(s=>{s.score!=null&&d.overall.push(parseFloat(s.score)),s.filler_count!=null&&(p+=parseInt(s.filler_count),u++)});const c=s=>s.length>0?s.reduce((r,j)=>r+j,0)/s.length:null,v={Gesamt:c(d.overall),Kommunikation:c(d.communication),Inhalt:c(d.content),Struktur:c(d.structure)},S=new Date;S.setDate(S.getDate()-30);const C=[],A=[];o.forEach(s=>{const r=new Date(s.created_at),j=s.overall_score||s.score;if(j!=null){const k=parseFloat(j)<=10?parseFloat(j)*10:parseFloat(j);r>=S?C.push(k):A.push(k)}});const g=c(C),w=c(A),z=g!=null&&w!=null&&w>0?(g-w)/w*100:null,y={},x={};[...i,...n,...l].forEach(s=>{try{let r=s.summary_feedback_json||s.feedback_json||s.analysis_json;typeof r=="string"&&(r=JSON.parse(r)),r?.strengths&&r.strengths.forEach(j=>{const k=j.toLowerCase().substring(0,50);y[k]=(y[k]||0)+1}),(r?.improvements||r?.weaknesses)&&(r.improvements||r.weaknesses||[]).forEach(j=>{const k=j.toLowerCase().substring(0,50);x[k]=(x[k]||0)+1})}catch{}});const R=Object.entries(y).sort((s,r)=>r[1]-s[1]).slice(0,5).map(([s])=>s),V=Object.entries(x).sort((s,r)=>r[1]-s[1]).slice(0,5).map(([s])=>s),I=o.filter(s=>s.created_at).sort((s,r)=>new Date(r.created_at)-new Date(s.created_at)),H=I[0]?.created_at?new Date(I[0].created_at).toLocaleDateString("de-DE"):null,J=I[0]?.created_at?Math.floor((Date.now()-new Date(I[0].created_at))/(1e3*60*60*24)):null,_=[];return[...i,...m].forEach(s=>{try{let r=s.audio_analysis||s.analysis_json;typeof r=="string"&&(r=JSON.parse(r)),r?.pacing?.rating&&r.pacing.rating!=="optimal"&&(_.includes(r.pacing.rating)||_.push(r.pacing.rating))}catch{}}),{totalSessions:a,moduleBreakdown:h,averageScores:v,recentTrend:z,topStrengths:R,topWeaknesses:V,fillerWordAverage:u>0?p/u:null,pacingIssues:_,lastSessionDate:H,daysSinceLastSession:J??999,rawSessions:t}}function je(t){const i=Array.isArray(t?.simulator)?t.simulator:[],n=Array.isArray(t?.video)?t.video:[],l=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.briefingTemplates)?t.briefingTemplates:[];let o=`
## VERFÜGBARE TRAININGS-SZENARIEN

`;return i.length>0&&(o+=`### Szenario-Training (strukturiertes Q&A mit Feedback)
`,i.forEach(a=>{const h=a.difficulty||a.meta?.difficulty||"Mittel";o+=`- ID:${a.id} "${a.title}" [${h}]${a.description?` - ${a.description.substring(0,100)}`:""}
`}),o+=`
`),n.length>0&&(o+=`### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)
`,n.forEach(a=>{o+=`- ID:${a.id} "${a.title}"${a.description?` - ${a.description.substring(0,100)}`:""}
`}),o+=`
`),l.length>0&&(o+=`### Live-Simulation (Echtzeit-Gespräch mit KI)
`,l.forEach(a=>{o+=`- ID:${a.id} "${a.title}"${a.description?` - ${a.description.substring(0,100)}`:""}
`}),o+=`
`),m.length>0&&(o+=`### Smart Briefing (KI-generierte Wissenspakete)
`,m.forEach(a=>{o+=`- ID:${a.id} "${a.title}" [${a.category||"Allgemein"}]
`}),o+=`
`),o+=`### Rhetorik-Gym (Kurze Sprechübungen)
`,o+=`- "Der Klassiker" - 60 Sekunden freies Sprechen
`,o+=`- "Zufalls-Thema" - Überraschungsthema per Zufall
`,o+=`- "Stress-Test" - 90 Sekunden mit wechselnden Fragen
`,o}async function ve(t,i){const{totalSessions:n}=t;if(n<3){console.log("[CoachingIntelligence] New user - using welcome prompt");const a=pe();try{return{...await K(a),isWelcome:!0,generatedAt:new Date().toISOString()}}catch(h){return console.error("[CoachingIntelligence] Failed to generate welcome coaching:",h),Se()}}const l=je(i),o=xe(t)+`
`+l+`

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;try{return{...await K(o),isWelcome:!1,generatedAt:new Date().toISOString(),sessionStats:t}}catch(a){throw console.error("[CoachingIntelligence] Failed to generate coaching analysis:",a),a}}async function K(t){const{GoogleGenerativeAI:i}=await ue(async()=>{const{GoogleGenerativeAI:d}=await import("./index.js").then(p=>p.x);return{GoogleGenerativeAI:d}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),n=ce.getGeminiApiKey();if(!n)throw new Error("Gemini API key not configured");const h=(await(await new i(n).getGenerativeModel({model:"gemini-2.0-flash-exp"}).generateContent(t)).response).text();try{const d=h.match(/```(?:json)?\s*([\s\S]*?)```/),p=d?d[1].trim():h.trim();return JSON.parse(p)}catch(d){throw console.error("[CoachingIntelligence] Failed to parse Gemini response:",d),console.log("[CoachingIntelligence] Raw response:",h),new Error("Failed to parse AI response")}}function Se(){return{isWelcome:!0,level:{name:"Einsteiger",score:0,description:"Bereit für den Start!"},summary:"Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.",strengths:[{title:"Motivation",description:"Du bist hier - das ist der erste Schritt",evidence:"Interesse an Verbesserung ist die beste Voraussetzung"}],focusAreas:[{title:"Erste Erfahrungen sammeln",priority:"hoch",description:"Lerne die Module kennen",currentState:"Noch keine Trainings",targetState:"5 Sessions in der ersten Woche"}],recommendations:[{action:"Starte mit dem Rhetorik-Gym",module:"rhetorik-gym",reason:"Kurze Sessions zum Einstieg",frequency:"1x täglich"}],nextStep:{title:"Dein erstes Rhetorik-Gym",description:"Sprich 60 Sekunden zu einem Thema deiner Wahl",module:"rhetorik-gym",estimatedTime:"2 Minuten"},motivation:"Jede Reise beginnt mit dem ersten Schritt!",generatedAt:new Date().toISOString()}}async function ke(){console.log("[CoachingIntelligence] Starting analysis...");const[t,i]=await Promise.all([fe(),ye()]);console.log("[CoachingIntelligence] Data fetched:",{sessions:{simulator:t.simulator.length,video:t.video.length,roleplay:t.roleplay.length,games:t.games.length},scenarios:{simulator:i.simulator.length,video:i.video.length,roleplay:i.roleplay.length,briefingTemplates:i.briefingTemplates.length}});const n=be(t);return console.log("[CoachingIntelligence] Stats aggregated:",{totalSessions:n.totalSessions,averageScores:n.averageScores}),{coaching:await ve(n,i),stats:n,scenarios:i,sessions:t}}const U={"rhetorik-gym":re,"szenario-training":F,"wirkungs-analyse":ne,"live-simulation":ie,"smart-briefing":se},Ne={"rhetorik-gym":"rhetorik-gym","szenario-training":"simulator","wirkungs-analyse":"video-training","live-simulation":"roleplay","smart-briefing":"smart-briefing"},Ae={Einsteiger:f.slate[400],Anfänger:f.amber[500],Fortgeschritten:f.blue[500],Profi:f.emerald[500],Experte:f.purple[500]},we=({level:t})=>{const i=Ae[t.name]||f.indigo[500],n=t.score||0,l=54,m=l*2*Math.PI,o=m-n/100*m;return e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:"relative",style:{width:140,height:140},children:[e.jsxs("svg",{width:140,height:140,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:70,cy:70,r:l,fill:"none",stroke:f.slate[200],strokeWidth:10}),e.jsx(N.circle,{cx:70,cy:70,r:l,fill:"none",stroke:i,strokeWidth:10,strokeLinecap:"round",strokeDasharray:m,initial:{strokeDashoffset:m},animate:{strokeDashoffset:o},transition:{duration:1.5,ease:"easeOut"}})]}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx(Q,{size:32,style:{color:i}}),e.jsx("span",{className:"text-2xl font-bold text-slate-900 mt-1",children:t.score})]})]}),e.jsxs("div",{className:"mt-3 text-center",children:[e.jsx("span",{className:"text-lg font-bold px-4 py-1 rounded-full",style:{backgroundColor:`${i}20`,color:i},children:t.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-2",children:t.description})]})]})},ze=({strength:t,index:i})=>e.jsx(N.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:i*.1},children:e.jsx(b,{className:"p-4 border-l-4 border-l-green-500",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0",children:e.jsx(W,{size:18,className:"text-green-600"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),t.evidence&&e.jsx("p",{className:"text-xs text-slate-400 mt-1 italic",children:t.evidence})]})]})})}),Ee=({area:t,index:i})=>{const n={hoch:{bg:"bg-red-100",text:"text-red-600",border:"border-red-500"},mittel:{bg:"bg-amber-100",text:"text-amber-600",border:"border-amber-500"},niedrig:{bg:"bg-blue-100",text:"text-blue-600",border:"border-blue-500"}},l=n[t.priority]||n.mittel;return e.jsx(N.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:i*.1},children:e.jsx(b,{className:`p-4 border-l-4 ${l.border}`,children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("span",{className:`text-[10px] font-medium px-2 py-0.5 rounded-full ${l.bg} ${l.text}`,children:t.priority})]}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),e.jsxs("div",{className:"mt-2 flex gap-4 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Aktuell: "}),e.jsx("span",{className:"text-slate-600",children:t.currentState})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Ziel: "}),e.jsx("span",{className:"text-green-600 font-medium",children:t.targetState})]})]})]}),e.jsx(F,{size:20,className:l.text})]})})})},Ce=({rec:t,index:i,onNavigate:n})=>{const l=U[t.module]||F;return e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:i*.1},children:e.jsx(b,{className:"p-4 hover:shadow-md transition-shadow",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(l,{size:20,className:"text-primary"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.action}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:t.reason}),t.frequency&&e.jsxs("div",{className:"flex items-center gap-1 mt-2 text-xs text-slate-400",children:[e.jsx(P,{size:12}),e.jsx("span",{children:t.frequency})]})]}),e.jsx(T,{variant:"secondary",size:"sm",className:"flex-shrink-0",onClick:()=>n(t.module,t.scenario_id),children:e.jsx(oe,{size:14})})]})})})},De=({nextStep:t,onNavigate:i})=>{const n=U[t.module]||ae;return e.jsx(N.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:.3},children:e.jsxs(b,{className:"p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5",onClick:()=>i(t.module,t.scenario_id),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(M,{size:20,className:"text-primary"}),e.jsx("span",{className:"text-xs font-semibold text-primary uppercase tracking-wide",children:"Nächster Schritt"})]}),e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 mb-4",children:t.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(n,{size:16}),e.jsx("span",{className:"capitalize",children:t.module?.replace("-"," ")})]}),t.estimatedTime&&e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(P,{size:16}),e.jsx("span",{children:t.estimatedTime})]})]}),e.jsx(T,{icon:e.jsx(le,{size:16}),children:"Jetzt starten"})]})]})})},Te=({stats:t})=>{const i=[{label:"Gesamt Sessions",value:t.totalSessions,icon:G,color:f.indigo[500]},{label:"Ø Bewertung",value:t.averageScores?.Gesamt!=null?`${Math.round(t.averageScores.Gesamt)}%`:"—",icon:Y,color:f.amber[500]},{label:"Trend (30 Tage)",value:t.recentTrend!=null?`${t.recentTrend>0?"+":""}${t.recentTrend.toFixed(1)}%`:"—",icon:ee,color:t.recentTrend>0?f.emerald[500]:f.red[500]},{label:"Letztes Training",value:t.daysSinceLastSession!=null&&t.daysSinceLastSession<999?t.daysSinceLastSession===0?"Heute":`Vor ${t.daysSinceLastSession}d`:"—",icon:te,color:f.blue[500]}];return e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:i.map((n,l)=>e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:l*.05},children:e.jsxs(b,{className:"p-4 text-center",children:[e.jsx(n.icon,{size:24,className:"mx-auto mb-2",style:{color:n.color}}),e.jsx("div",{className:"text-2xl font-bold text-slate-900",children:n.value}),e.jsx("div",{className:"text-xs text-slate-500",children:n.label})]})},n.label))})},Be=({isAuthenticated:t,requireAuth:i,onNavigate:n})=>{const l=he(),{branding:m}=de();m?.primaryAccent||f.indigo[500];const[o,a]=E.useState(!0),[h,d]=E.useState(!1),[p,u]=E.useState(null),[c,v]=E.useState(null),S=E.useCallback(async(y=!1)=>{if(!t){a(!1);return}try{y?d(!0):a(!0),u(null);const x=await ke();v(x)}catch(x){console.error("[KiCoach] Failed to load coaching:",x),u("Fehler beim Laden der Coaching-Analyse")}finally{a(!1),d(!1)}},[t]);E.useEffect(()=>{S()},[S]);const C=(y,x)=>{const R=Ne[y]||y;n&&n(R,x)};E.useEffect(()=>{!t&&i&&i()},[t,i]);const A=me(f.indigo[600],f.purple[500]);if(o)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs("div",{className:"text-center",children:[e.jsx(L,{size:48,className:"text-primary animate-spin mx-auto"}),e.jsx("p",{className:"text-slate-500 mt-4",children:"Analysiere deine Trainings..."})]})})]});if(!t)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(b,{className:"p-8 text-center max-w-md",children:[e.jsx(D,{size:48,className:"text-primary mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Anmeldung erforderlich"}),e.jsx("p",{className:"text-slate-600 mb-6",children:"Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein."}),e.jsx(T,{onClick:i,children:"Anmelden"})]})})]});if(p&&!c)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(b,{className:"p-8 text-center max-w-md",children:[e.jsx(Z,{size:48,className:"text-red-500 mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Fehler beim Laden"}),e.jsx("p",{className:"text-slate-600 mb-6",children:p}),e.jsx(T,{onClick:()=>S(),children:"Erneut versuchen"})]})})]});const{coaching:g,stats:w,sessions:z}=c||{};return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx($,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:A,rightContent:e.jsxs(T,{variant:"secondary",size:"sm",onClick:()=>S(!0),disabled:h,className:"bg-white/20 border-white/30 text-white hover:bg-white/30",children:[h?e.jsx(L,{size:16,className:"animate-spin"}):e.jsx(q,{size:16}),e.jsx("span",{className:"ml-2 hidden sm:inline",children:"Aktualisieren"})]})}),e.jsx("div",{className:`${l?"p-4":"px-8 py-6"}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("div",{className:`grid gap-6 ${l?"grid-cols-1":"grid-cols-3"}`,children:[e.jsx(b,{className:"p-6 flex items-center justify-center",children:g?.level&&e.jsx(we,{level:g.level})}),e.jsxs("div",{className:`${l?"":"col-span-2"}`,children:[w&&e.jsx(Te,{stats:w}),g?.summary&&e.jsx(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.2},className:"mt-4",children:e.jsx(b,{className:"p-4 bg-gradient-to-r from-slate-50 to-slate-100",children:e.jsx("p",{className:"text-sm text-slate-700 leading-relaxed",children:g.summary})})})]})]}),g?.nextStep&&e.jsx(De,{nextStep:g.nextStep,onNavigate:C}),e.jsxs("div",{className:`grid gap-6 ${l?"grid-cols-1":"grid-cols-2"}`,children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(W,{size:20,className:"text-green-500"}),"Deine Stärken"]}),e.jsxs("div",{className:"space-y-3",children:[g?.strengths?.map((y,x)=>e.jsx(ze,{strength:y,index:x},x)),(!g?.strengths||g.strengths.length===0)&&e.jsx(b,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Stärken identifiziert. Absolviere mehr Trainings!"})]})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(F,{size:20,className:"text-amber-500"}),"Fokus-Bereiche"]}),e.jsxs("div",{className:"space-y-3",children:[g?.focusAreas?.map((y,x)=>e.jsx(Ee,{area:y,index:x},x)),(!g?.focusAreas||g.focusAreas.length===0)&&e.jsx(b,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Fokus-Bereiche identifiziert."})]})]})]}),g?.recommendations?.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(X,{size:20,className:"text-primary"}),"Empfehlungen für dich"]}),e.jsx("div",{className:`grid gap-4 ${l?"grid-cols-1":"grid-cols-2"}`,children:g.recommendations.map((y,x)=>e.jsx(Ce,{rec:y,index:x,onNavigate:C},x))})]}),z&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(G,{size:20,className:"text-indigo-500"}),"Dein Fortschritt"]}),e.jsx(b,{className:"p-4",children:e.jsx(ge,{simulatorSessions:z.simulator,videoSessions:z.video,roleplaySessions:z.roleplay,gameSessions:z.games})})]}),g?.motivation&&e.jsxs(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"text-center py-8",children:[e.jsx(M,{size:24,className:"text-primary mx-auto mb-3"}),e.jsxs("p",{className:"text-lg font-medium text-slate-700 italic",children:['"',g.motivation,'"']})]})]})})]})};export{Be as KiCoachApp};
