const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./ui-vendor-Cix6Gssq.js","./react-vendor-uDOJF2jQ.js","./FeatureInfoButton-Ca11wQwo.js","./FeatureInfoButton.css"])))=>i.map(i=>d[i]);
import{j as e,B as D,L as W,E as Q,u as Y,m as A,a2 as K,l as $,z as ee,a$ as M,a as B,a0 as te,a1 as se,i as ie,Y as ae,F as ne,M as re,V as le,e as oe,Z as ce,g as P,f as de,a7 as me}from"./ui-vendor-Cix6Gssq.js";import{a as z}from"./react-vendor-uDOJF2jQ.js";import{C as S,B as T}from"./select-native-BY39Up9p.js";import{g as O,a as U,w as he,u as ge,C as j,q as ue}from"./FeatureInfoButton-Ca11wQwo.js";import"./dialog-hfgJFxQL.js";import{u as xe}from"./useMobile-YxjH166V.js";import{P as pe}from"./ProgressChart-CUdbU__s.js";import{F as _}from"./FeatureAppHeader-COrZ9MSu.js";import{_ as fe}from"./index.js";import"./utils-BEHD0UYf.js";import"./index-CklPxmEV.js";const ye=t=>{const{totalSessions:a,moduleBreakdown:n,averageScores:l,recentTrend:m,topStrengths:c,topWeaknesses:r,fillerWordAverage:g,pacingIssues:d,lastSessionDate:y,daysSinceLastSession:x}=t;return`Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${a}
- Letztes Training: ${y||"Unbekannt"} (vor ${x} Tagen)

### Module-Aktivität
${Object.entries(n).map(([o,p])=>`- ${o}: ${p} Sessions`).join(`
`)}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(l).map(([o,p])=>`- ${o}: ${p!==null?Math.round(p):"Keine Daten"}`).join(`
`)}

### Trend (letzte 30 Tage vs. davor)
${m?`${m>0?"+":""}${m.toFixed(1)}% Veränderung`:"Nicht genug Daten"}

### Identifizierte Stärken (aus Feedback)
${c.length>0?c.map(o=>`- ${o}`).join(`
`):"Noch keine identifiziert"}

### Identifizierte Schwächen (aus Feedback)
${r.length>0?r.map(o=>`- ${o}`).join(`
`):"Noch keine identifiziert"}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${g!==null?g.toFixed(1):"Keine Daten"}
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
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`},be=()=>`Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

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
}`;async function je(){const t=O(),a={"X-WP-Nonce":U()};try{const[n,l,m,c]=await Promise.all([fetch(`${t}/simulator/sessions`,{headers:a,credentials:"same-origin"}),fetch(`${t}/video-training/sessions`,{headers:a,credentials:"same-origin"}),fetch(`${t}/sessions`,{headers:a,credentials:"same-origin"}),fetch(`${t}/game/sessions`,{headers:a,credentials:"same-origin"})]),[r,g,d,y]=await Promise.all([n.ok?n.json():{data:{sessions:[]}},l.ok?l.json():{data:{sessions:[]}},m.ok?m.json():{data:[]},c.ok?c.json():{data:[]}]),x=(o,p=null)=>{if(Array.isArray(o))return o;if(o?.data){if(p&&o.data[p])return Array.isArray(o.data[p])?o.data[p]:[];if(Array.isArray(o.data))return o.data;if(o.data.sessions&&Array.isArray(o.data.sessions))return o.data.sessions}return[]};return{simulator:x(r,"sessions"),video:x(g,"sessions"),roleplay:x(d),games:x(y)}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch sessions:",n),{simulator:[],video:[],roleplay:[],games:[]}}}async function ve(){const t=O(),a={"X-WP-Nonce":U()};try{const[n,l,m,c]=await Promise.all([fetch(`${t}/simulator/scenarios`,{headers:a,credentials:"same-origin"}),fetch(`${t}/video-training/scenarios`,{headers:a,credentials:"same-origin"}),fetch(`${t}/roleplays`,{headers:a,credentials:"same-origin"}),fetch(`${t}/smartbriefing/templates`,{headers:a,credentials:"same-origin"})]),[r,g,d,y]=await Promise.all([n.ok?n.json():{data:{scenarios:[]}},l.ok?l.json():{data:{scenarios:[]}},m.ok?m.json():{data:[]},c.ok?c.json():{data:[]}]),x=(o,p=null)=>{if(Array.isArray(o))return o;if(o?.data){if(p&&o.data[p])return Array.isArray(o.data[p])?o.data[p]:[];if(Array.isArray(o.data))return o.data}return[]};return{simulator:x(r,"scenarios"),video:x(g,"scenarios"),roleplay:x(d),briefingTemplates:x(y)}}catch(n){return console.error("[CoachingIntelligence] Failed to fetch scenarios:",n),{simulator:[],video:[],roleplay:[],briefingTemplates:[]}}}function Se(t){const a=Array.isArray(t?.simulator)?t.simulator:[],n=Array.isArray(t?.video)?t.video:[],l=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.games)?t.games:[],c=[...a.map(s=>({...s,module:"Szenario-Training"})),...n.map(s=>({...s,module:"Wirkungs-Analyse"})),...l.map(s=>({...s,module:"Live-Simulation"})),...m.map(s=>({...s,module:"Rhetorik-Gym"}))],r=c.length,g={"Szenario-Training":a.length,"Wirkungs-Analyse":n.length,"Live-Simulation":l.length,"Rhetorik-Gym":m.length},d={overall:[],communication:[],content:[],structure:[],confidence:[],fillerWords:[]};a.forEach(s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);d.overall.push(i<=10?i*10:i)}try{const i=s.summary_feedback||s.summary_feedback_json,h=typeof i=="string"?JSON.parse(i):i;h?.scores&&(h.scores.content!=null&&d.content.push(h.scores.content*10),h.scores.structure!=null&&d.structure.push(h.scores.structure*10))}catch{}}),n.forEach(s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);d.overall.push(i<=10?i*10:i)}}),l.forEach(s=>{try{const i=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json,h=i?.rating?.overall??i?.rating?.gesamteindruck??i?.overall_score??i?.overallScore??i?.score;if(h!=null){const X=parseFloat(h)<=10?parseFloat(h)*10:parseFloat(h);d.overall.push(X)}const v=i?.rating?.communication??i?.rating?.kommunikation;v!=null&&d.communication.push(parseFloat(v)*10)}catch{}});let y=0,x=0;m.forEach(s=>{s.score!=null&&d.overall.push(parseFloat(s.score)),s.filler_count!=null&&(y+=parseInt(s.filler_count),x++)});const o=s=>s.length>0?s.reduce((i,h)=>i+h,0)/s.length:null,p={Gesamt:o(d.overall),Kommunikation:o(d.communication),Inhalt:o(d.content),Struktur:o(d.structure)},k=new Date;k.setDate(k.getDate()-30);const E=[],w=[],u=s=>{const i=s.created_at||s.started_at||s.updated_at;if(!i)return null;const h=new Date(i);return isNaN(h.getTime())?null:h},I=s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);return i<=10?i*10:i}if(s.score!=null)return parseFloat(s.score);try{const i=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json,h=i?.rating?.overall??i?.rating?.gesamteindruck??i?.overall_score;if(h!=null){const v=parseFloat(h);return v<=10?v*10:v}}catch{}return null};c.forEach(s=>{const i=u(s),h=I(s);i&&h!=null&&(i>=k?E.push(h):w.push(h))});const N=o(E),b=o(w),f=N!=null&&b!=null&&b>0?(N-b)/b*100:null,C={},R={};[...a,...n,...l].forEach(s=>{try{let i=s.summary_feedback||s.summary_feedback_json||s.feedback_json||s.analysis_json;typeof i=="string"&&(i=JSON.parse(i)),i?.strengths&&i.strengths.forEach(h=>{const v=h.toLowerCase().substring(0,50);C[v]=(C[v]||0)+1}),(i?.improvements||i?.weaknesses)&&(i.improvements||i.weaknesses||[]).forEach(h=>{const v=h.toLowerCase().substring(0,50);R[v]=(R[v]||0)+1})}catch{}});const J=Object.entries(C).sort((s,i)=>i[1]-s[1]).slice(0,5).map(([s])=>s),H=Object.entries(R).sort((s,i)=>i[1]-s[1]).slice(0,5).map(([s])=>s),F=c.map(s=>({session:s,date:u(s)})).filter(({date:s})=>s!==null).sort((s,i)=>i.date-s.date),Z=F[0]?.date?F[0].date.toLocaleDateString("de-DE"):null,q=F[0]?.date?Math.floor((Date.now()-F[0].date)/(1e3*60*60*24)):null,L=[];return[...a,...m].forEach(s=>{try{let i=s.analysis||s.audio_analysis||s.analysis_json;typeof i=="string"&&(i=JSON.parse(i)),i?.pacing?.rating&&i.pacing.rating!=="optimal"&&(L.includes(i.pacing.rating)||L.push(i.pacing.rating))}catch{}}),{totalSessions:r,moduleBreakdown:g,averageScores:p,recentTrend:f,topStrengths:J,topWeaknesses:H,fillerWordAverage:x>0?y/x:null,pacingIssues:L,lastSessionDate:Z,daysSinceLastSession:q??999,rawSessions:t}}function ke(t){const a=Array.isArray(t?.simulator)?t.simulator:[],n=Array.isArray(t?.video)?t.video:[],l=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.briefingTemplates)?t.briefingTemplates:[];let c=`
## VERFÜGBARE TRAININGS-SZENARIEN

`;return a.length>0&&(c+=`### Szenario-Training (strukturiertes Q&A mit Feedback)
`,a.forEach(r=>{const g=r.difficulty||r.meta?.difficulty||"Mittel";c+=`- ID:${r.id} "${r.title}" [${g}]${r.description?` - ${r.description.substring(0,100)}`:""}
`}),c+=`
`),n.length>0&&(c+=`### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)
`,n.forEach(r=>{c+=`- ID:${r.id} "${r.title}"${r.description?` - ${r.description.substring(0,100)}`:""}
`}),c+=`
`),l.length>0&&(c+=`### Live-Simulation (Echtzeit-Gespräch mit KI)
`,l.forEach(r=>{c+=`- ID:${r.id} "${r.title}"${r.description?` - ${r.description.substring(0,100)}`:""}
`}),c+=`
`),m.length>0&&(c+=`### Smart Briefing (KI-generierte Wissenspakete)
`,m.forEach(r=>{c+=`- ID:${r.id} "${r.title}" [${r.category||"Allgemein"}]
`}),c+=`
`),c+=`### Rhetorik-Gym (Kurze Sprechübungen)
`,c+=`- "Der Klassiker" - 60 Sekunden freies Sprechen
`,c+=`- "Zufalls-Thema" - Überraschungsthema per Zufall
`,c+=`- "Stress-Test" - 90 Sekunden mit wechselnden Fragen
`,c}async function Ne(t,a){const{totalSessions:n}=t;if(n<3){console.log("[CoachingIntelligence] New user - using welcome prompt");const r=be();try{return{...await G(r),isWelcome:!0,generatedAt:new Date().toISOString()}}catch(g){return console.error("[CoachingIntelligence] Failed to generate welcome coaching:",g),Ae()}}const l=ke(a),c=ye(t)+`
`+l+`

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;try{return{...await G(c),isWelcome:!1,generatedAt:new Date().toISOString(),sessionStats:t}}catch(r){throw console.error("[CoachingIntelligence] Failed to generate coaching analysis:",r),r}}async function G(t){const{GoogleGenerativeAI:a}=await fe(async()=>{const{GoogleGenerativeAI:d}=await import("./index.js").then(y=>y.x);return{GoogleGenerativeAI:d}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),n=he.getGeminiApiKey();if(!n)throw new Error("Gemini API key not configured");const g=(await(await new a(n).getGenerativeModel({model:"gemini-2.0-flash-exp"}).generateContent(t)).response).text();try{const d=g.match(/```(?:json)?\s*([\s\S]*?)```/),y=d?d[1].trim():g.trim();return JSON.parse(y)}catch(d){throw console.error("[CoachingIntelligence] Failed to parse Gemini response:",d),console.log("[CoachingIntelligence] Raw response:",g),new Error("Failed to parse AI response")}}function Ae(){return{isWelcome:!0,level:{name:"Einsteiger",score:0,description:"Bereit für den Start!"},summary:"Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.",strengths:[{title:"Motivation",description:"Du bist hier - das ist der erste Schritt",evidence:"Interesse an Verbesserung ist die beste Voraussetzung"}],focusAreas:[{title:"Erste Erfahrungen sammeln",priority:"hoch",description:"Lerne die Module kennen",currentState:"Noch keine Trainings",targetState:"5 Sessions in der ersten Woche"}],recommendations:[{action:"Starte mit dem Rhetorik-Gym",module:"rhetorik-gym",reason:"Kurze Sessions zum Einstieg",frequency:"1x täglich"}],nextStep:{title:"Dein erstes Rhetorik-Gym",description:"Sprich 60 Sekunden zu einem Thema deiner Wahl",module:"rhetorik-gym",estimatedTime:"2 Minuten"},motivation:"Jede Reise beginnt mit dem ersten Schritt!",generatedAt:new Date().toISOString()}}async function we(){console.log("[CoachingIntelligence] Starting analysis...");const[t,a]=await Promise.all([je(),ve()]);console.log("[CoachingIntelligence] Data fetched:",{sessions:{simulator:t.simulator.length,video:t.video.length,roleplay:t.roleplay.length,games:t.games.length},scenarios:{simulator:a.simulator.length,video:a.video.length,roleplay:a.roleplay.length,briefingTemplates:a.briefingTemplates.length}}),t.simulator.length>0&&console.log("[CoachingIntelligence] Sample simulator session:",{id:t.simulator[0].id,overall_score:t.simulator[0].overall_score,created_at:t.simulator[0].created_at}),t.roleplay.length>0&&console.log("[CoachingIntelligence] Sample roleplay session:",{id:t.roleplay[0].id,feedback_json:t.roleplay[0].feedback_json?"present":"missing",rating:t.roleplay[0].feedback_json?.rating,created_at:t.roleplay[0].created_at}),t.games.length>0&&console.log("[CoachingIntelligence] Sample game session:",{id:t.games[0].id,score:t.games[0].score,created_at:t.games[0].created_at});const n=Se(t);return console.log("[CoachingIntelligence] Stats aggregated:",{totalSessions:n.totalSessions,averageScores:n.averageScores,daysSinceLastSession:n.daysSinceLastSession,lastSessionDate:n.lastSessionDate,moduleBreakdown:n.moduleBreakdown}),{coaching:await Ne(n,a),stats:n,scenarios:a,sessions:t}}const V={"rhetorik-gym":oe,"szenario-training":$,"wirkungs-analyse":le,"live-simulation":re,"smart-briefing":ne},ze={"rhetorik-gym":"gym","szenario-training":"simulator","wirkungs-analyse":"video_training","live-simulation":"dashboard","smart-briefing":"smart_briefing"},Ee={Einsteiger:j.slate[400],Anfänger:j.amber[500],Fortgeschritten:j.blue[500],Profi:j.emerald[500],Experte:j.purple[500]},Ce=({level:t})=>{const a=Ee[t.name]||j.indigo[500],n=t.score||0,l=54,m=l*2*Math.PI,c=m-n/100*m;return e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:"relative",style:{width:140,height:140},children:[e.jsxs("svg",{width:140,height:140,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:70,cy:70,r:l,fill:"none",stroke:j.slate[200],strokeWidth:10}),e.jsx(A.circle,{cx:70,cy:70,r:l,fill:"none",stroke:a,strokeWidth:10,strokeLinecap:"round",strokeDasharray:m,initial:{strokeDashoffset:m},animate:{strokeDashoffset:c},transition:{duration:1.5,ease:"easeOut"}})]}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx(te,{size:32,style:{color:a}}),e.jsx("span",{className:"text-2xl font-bold text-slate-900 mt-1",children:t.score})]})]}),e.jsxs("div",{className:"mt-3 text-center",children:[e.jsx("span",{className:"text-lg font-bold px-4 py-1 rounded-full",style:{backgroundColor:`${a}20`,color:a},children:t.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-2",children:t.description})]})]})},De=({strength:t,index:a})=>e.jsx(A.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:a*.1},children:e.jsx(S,{className:"p-4 border-l-4 border-l-green-500",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0",children:e.jsx(K,{size:18,className:"text-green-600"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),t.evidence&&e.jsx("p",{className:"text-xs text-slate-400 mt-1 italic",children:t.evidence})]})]})})}),Te=({area:t,index:a})=>{const n={hoch:{bg:"bg-red-100",text:"text-red-600",border:"border-red-500"},mittel:{bg:"bg-amber-100",text:"text-amber-600",border:"border-amber-500"},niedrig:{bg:"bg-blue-100",text:"text-blue-600",border:"border-blue-500"}},l=n[t.priority]||n.mittel;return e.jsx(A.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:a*.1},children:e.jsx(S,{className:`p-4 border-l-4 ${l.border}`,children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("span",{className:`text-[10px] font-medium px-2 py-0.5 rounded-full ${l.bg} ${l.text}`,children:t.priority})]}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),e.jsxs("div",{className:"mt-2 flex gap-4 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Aktuell: "}),e.jsx("span",{className:"text-slate-600",children:t.currentState})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Ziel: "}),e.jsx("span",{className:"text-green-600 font-medium",children:t.targetState})]})]})]}),e.jsx($,{size:20,className:l.text})]})})})},Ie=({rec:t,index:a,onNavigate:n})=>{const l=V[t.module]||$;return e.jsx(A.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:a*.1},children:e.jsx(S,{className:"p-4 hover:shadow-md transition-shadow",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(l,{size:20,className:"text-primary"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.action}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:t.reason}),t.frequency&&e.jsxs("div",{className:"flex items-center gap-1 mt-2 text-xs text-slate-400",children:[e.jsx(P,{size:12}),e.jsx("span",{children:t.frequency})]})]}),e.jsx(T,{variant:"secondary",size:"sm",className:"flex-shrink-0",onClick:()=>n(t.module,t.scenario_id),children:e.jsx(me,{size:14})})]})})})},Fe=({nextStep:t,onNavigate:a})=>{const n=V[t.module]||ce;return e.jsx(A.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:.3},children:e.jsxs(S,{className:"p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5",onClick:()=>a(t.module,t.scenario_id),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(B,{size:20,className:"text-primary"}),e.jsx("span",{className:"text-xs font-semibold text-primary uppercase tracking-wide",children:"Nächster Schritt"})]}),e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 mb-4",children:t.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(n,{size:16}),e.jsx("span",{className:"capitalize",children:t.module?.replace("-"," ")})]}),t.estimatedTime&&e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(P,{size:16}),e.jsx("span",{children:t.estimatedTime})]})]}),e.jsx(T,{icon:e.jsx(de,{size:16}),children:"Jetzt starten"})]})]})})},_e=({stats:t})=>{const a=[{label:"Gesamt Sessions",value:t.totalSessions,icon:M,color:j.indigo[500]},{label:"Ø Bewertung",value:t.averageScores?.Gesamt!=null?`${Math.round(t.averageScores.Gesamt)}%`:"—",icon:se,color:j.amber[500]},{label:"Trend (30 Tage)",value:t.recentTrend!=null?`${t.recentTrend>0?"+":""}${t.recentTrend.toFixed(1)}%`:"—",icon:ie,color:t.recentTrend>0?j.emerald[500]:j.red[500]},{label:"Letztes Training",value:t.daysSinceLastSession!=null&&t.daysSinceLastSession<999?t.daysSinceLastSession===0?"Heute":`Vor ${t.daysSinceLastSession}d`:"—",icon:ae,color:j.blue[500]}];return e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:a.map((n,l)=>e.jsx(A.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:l*.05},children:e.jsxs(S,{className:"p-4 text-center",children:[e.jsx(n.icon,{size:24,className:"mx-auto mb-2",style:{color:n.color}}),e.jsx("div",{className:"text-2xl font-bold text-slate-900",children:n.value}),e.jsx("div",{className:"text-xs text-slate-500",children:n.label})]})},n.label))})},Je=({isAuthenticated:t,requireAuth:a,onNavigate:n})=>{const l=xe(),{branding:m}=ge();m?.primaryAccent||j.indigo[500];const[c,r]=z.useState(!0),[g,d]=z.useState(!1),[y,x]=z.useState(null),[o,p]=z.useState(null),k=z.useCallback(async(b=!1)=>{if(!t){r(!1);return}try{b?d(!0):r(!0),x(null);const f=await we();p(f)}catch(f){console.error("[KiCoach] Failed to load coaching:",f),x("Fehler beim Laden der Coaching-Analyse")}finally{r(!1),d(!1)}},[t]);z.useEffect(()=>{k()},[k]);const E=(b,f)=>{const C=ze[b]||b;n&&n(C,f)};z.useEffect(()=>{!t&&a&&a()},[t,a]);const w=ue(j.indigo[600],j.purple[500]);if(c)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(_,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs("div",{className:"text-center",children:[e.jsx(W,{size:48,className:"text-primary animate-spin mx-auto"}),e.jsx("p",{className:"text-slate-500 mt-4",children:"Analysiere deine Trainings..."})]})})]});if(!t)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(_,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(S,{className:"p-8 text-center max-w-md",children:[e.jsx(D,{size:48,className:"text-primary mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Anmeldung erforderlich"}),e.jsx("p",{className:"text-slate-600 mb-6",children:"Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein."}),e.jsx(T,{onClick:a,children:"Anmelden"})]})})]});if(y&&!o)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(_,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(S,{className:"p-8 text-center max-w-md",children:[e.jsx(Q,{size:48,className:"text-red-500 mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Fehler beim Laden"}),e.jsx("p",{className:"text-slate-600 mb-6",children:y}),e.jsx(T,{onClick:()=>k(),children:"Erneut versuchen"})]})})]});const{coaching:u,stats:I,sessions:N}=o||{};return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(_,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:D,gradient:w,rightContent:e.jsxs(T,{variant:"secondary",size:"sm",onClick:()=>k(!0),disabled:g,className:"bg-white/20 border-white/30 text-white hover:bg-white/30",children:[g?e.jsx(W,{size:16,className:"animate-spin"}):e.jsx(Y,{size:16}),e.jsx("span",{className:"ml-2 hidden sm:inline",children:"Aktualisieren"})]})}),e.jsx("div",{className:`${l?"p-4":"px-8 py-6"}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("div",{className:`grid gap-6 ${l?"grid-cols-1":"grid-cols-3"}`,children:[e.jsx(S,{className:"p-6 flex items-center justify-center",children:u?.level&&e.jsx(Ce,{level:u.level})}),e.jsxs("div",{className:`${l?"":"col-span-2"}`,children:[I&&e.jsx(_e,{stats:I}),u?.summary&&e.jsx(A.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.2},className:"mt-4",children:e.jsx(S,{className:"p-4 bg-gradient-to-r from-slate-50 to-slate-100",children:e.jsx("p",{className:"text-sm text-slate-700 leading-relaxed",children:u.summary})})})]})]}),u?.nextStep&&e.jsx(Fe,{nextStep:u.nextStep,onNavigate:E}),e.jsxs("div",{className:`grid gap-6 ${l?"grid-cols-1":"grid-cols-2"}`,children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(K,{size:20,className:"text-green-500"}),"Deine Stärken"]}),e.jsxs("div",{className:"space-y-3",children:[u?.strengths?.map((b,f)=>e.jsx(De,{strength:b,index:f},f)),(!u?.strengths||u.strengths.length===0)&&e.jsx(S,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Stärken identifiziert. Absolviere mehr Trainings!"})]})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx($,{size:20,className:"text-amber-500"}),"Fokus-Bereiche"]}),e.jsxs("div",{className:"space-y-3",children:[u?.focusAreas?.map((b,f)=>e.jsx(Te,{area:b,index:f},f)),(!u?.focusAreas||u.focusAreas.length===0)&&e.jsx(S,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Fokus-Bereiche identifiziert."})]})]})]}),u?.recommendations?.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(ee,{size:20,className:"text-primary"}),"Empfehlungen für dich"]}),e.jsx("div",{className:`grid gap-4 ${l?"grid-cols-1":"grid-cols-2"}`,children:u.recommendations.map((b,f)=>e.jsx(Ie,{rec:b,index:f,onNavigate:E},f))})]}),N&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(M,{size:20,className:"text-indigo-500"}),"Dein Fortschritt"]}),e.jsx(S,{className:"p-4",children:e.jsx(pe,{simulatorSessions:N.simulator,videoSessions:N.video,roleplaySessions:N.roleplay,gameSessions:N.games})})]}),u?.motivation&&e.jsxs(A.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"text-center py-8",children:[e.jsx(B,{size:24,className:"text-primary mx-auto mb-3"}),e.jsxs("p",{className:"text-lg font-medium text-slate-700 italic",children:['"',u.motivation,'"']})]})]})})]})};export{Je as KiCoachApp};
