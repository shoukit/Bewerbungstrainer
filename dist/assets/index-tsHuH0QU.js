const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./ui-vendor-zeH2bUSD.js","./react-vendor-uDOJF2jQ.js","./FeatureInfoButton-CSO-N4qQ.js","./FeatureInfoButton.css"])))=>i.map(i=>d[i]);
import{r as se,a$ as ie,U as ne,M as J,j as e,m as N,a as B,f as H,b as ae,B as W,L as U,E as re,A as le,u as oe,J as ce,a2 as Z,l as K,z as de,b0 as q,a0 as me,a1 as ue,i as he,Y as ge,F as xe,V as pe,e as fe,Z as ye,g as X,h as be,a7 as je}from"./ui-vendor-zeH2bUSD.js";import{a as S}from"./react-vendor-uDOJF2jQ.js";import{C as k,B as F}from"./select-native-CSFtBRq_.js";import{g as Q,a as Y,w as ke,C as g,u as ve,q as Se}from"./FeatureInfoButton-CSO-N4qQ.js";import"./dialog-CxUaA3gX.js";import{u as Ne}from"./useMobile-YxjH166V.js";import{P as we}from"./ProgressChart-7GUVmng6.js";import{F as M}from"./FeatureAppHeader-UhIrznzb.js";import{_ as ze}from"./index.js";import"./utils-BEHD0UYf.js";import"./index-CklPxmEV.js";const Ae=t=>{const{totalSessions:n,moduleBreakdown:a,averageScores:c,recentTrend:m,topStrengths:r,topWeaknesses:l,fillerWordAverage:u,pacingIssues:d,lastSessionDate:j,daysSinceLastSession:x}=t;return`Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${n}
- Letztes Training: ${j||"Unbekannt"} (vor ${x} Tagen)

### Module-Aktivität
${Object.entries(a).map(([o,p])=>`- ${o}: ${p} Sessions`).join(`
`)}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(c).map(([o,p])=>`- ${o}: ${p!==null?Math.round(p):"Keine Daten"}`).join(`
`)}

### Trend (letzte 30 Tage vs. davor)
${m?`${m>0?"+":""}${m.toFixed(1)}% Veränderung`:"Nicht genug Daten"}

### Identifizierte Stärken (aus Feedback)
${r.length>0?r.map(o=>`- ${o}`).join(`
`):"Noch keine identifiziert"}

### Identifizierte Schwächen (aus Feedback)
${l.length>0?l.map(o=>`- ${o}`).join(`
`):"Noch keine identifiziert"}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${u!==null?u.toFixed(1):"Keine Daten"}
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
      "targetState": "Was sollte erreicht werden?",
      "suggestedTrainings": [
        {
          "title": "Szenario-Titel aus dem Katalog",
          "module": "szenario-training|wirkungs-analyse|live-simulation|rhetorik-gym",
          "scenario_id": "ID aus Katalog oder null für Rhetorik-Gym"
        }
      ]
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
8. JEDER Fokusbereich muss 1-2 "suggestedTrainings" haben - nutze IDs aus dem Szenario-Katalog!

## LEVEL-KRITERIEN

- **Anfänger** (0-25): < 10 Sessions, unsichere Grundlagen
- **Fortgeschritten** (26-50): 10-30 Sessions, solide Basis, einige Schwächen
- **Profi** (51-75): 30-60 Sessions, konstant gute Leistungen
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`},Ce=()=>`Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

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
      "targetState": "5 verschiedene Sessions in der ersten Woche",
      "suggestedTrainings": [
        {
          "title": "Rhetorik-Gym: Der Klassiker",
          "module": "rhetorik-gym",
          "scenario_id": null
        },
        {
          "title": "Szenario-Training starten",
          "module": "szenario-training",
          "scenario_id": null
        }
      ]
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
}`;async function Ee(){const t=Q(),n={"X-WP-Nonce":Y()};try{const[a,c,m,r]=await Promise.all([fetch(`${t}/simulator/sessions`,{headers:n,credentials:"same-origin"}),fetch(`${t}/video-training/sessions`,{headers:n,credentials:"same-origin"}),fetch(`${t}/roleplays/sessions`,{headers:n,credentials:"same-origin"}),fetch(`${t}/game/sessions`,{headers:n,credentials:"same-origin"})]),[l,u,d,j]=await Promise.all([a.ok?a.json():{data:{sessions:[]}},c.ok?c.json():{data:{sessions:[]}},m.ok?m.json():{data:[]},r.ok?r.json():{data:[]}]),x=(o,p=null)=>{if(Array.isArray(o))return o;if(o?.data){if(p&&o.data[p])return Array.isArray(o.data[p])?o.data[p]:[];if(Array.isArray(o.data))return o.data;if(o.data.sessions&&Array.isArray(o.data.sessions))return o.data.sessions}return[]};return{simulator:x(l,"sessions"),video:x(u,"sessions"),roleplay:x(d),games:x(j)}}catch(a){return console.error("[CoachingIntelligence] Failed to fetch sessions:",a),{simulator:[],video:[],roleplay:[],games:[]}}}async function Te(){const t=Q(),n={"X-WP-Nonce":Y()};try{const[a,c,m,r]=await Promise.all([fetch(`${t}/simulator/scenarios`,{headers:n,credentials:"same-origin"}),fetch(`${t}/video-training/scenarios`,{headers:n,credentials:"same-origin"}),fetch(`${t}/roleplays`,{headers:n,credentials:"same-origin"}),fetch(`${t}/smartbriefing/templates`,{headers:n,credentials:"same-origin"})]),[l,u,d,j]=await Promise.all([a.ok?a.json():{data:{scenarios:[]}},c.ok?c.json():{data:{scenarios:[]}},m.ok?m.json():{data:[]},r.ok?r.json():{data:[]}]),x=(o,p=null)=>{if(Array.isArray(o))return o;if(o?.data){if(p&&o.data[p])return Array.isArray(o.data[p])?o.data[p]:[];if(Array.isArray(o.data))return o.data}return[]};return{simulator:x(l,"scenarios"),video:x(u,"scenarios"),roleplay:x(d),briefingTemplates:x(j)}}catch(a){return console.error("[CoachingIntelligence] Failed to fetch scenarios:",a),{simulator:[],video:[],roleplay:[],briefingTemplates:[]}}}function Ie(t){const n=Array.isArray(t?.simulator)?t.simulator:[],a=Array.isArray(t?.video)?t.video:[],c=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.games)?t.games:[],r=[...n.map(s=>({...s,module:"Szenario-Training"})),...a.map(s=>({...s,module:"Wirkungs-Analyse"})),...c.map(s=>({...s,module:"Live-Simulation"})),...m.map(s=>({...s,module:"Rhetorik-Gym"}))],l=r.length,u={"Szenario-Training":n.length,"Wirkungs-Analyse":a.length,"Live-Simulation":c.length,"Rhetorik-Gym":m.length},d={overall:[],communication:[],content:[],structure:[],confidence:[],fillerWords:[]};n.forEach(s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);d.overall.push(i<=10?i*10:i)}try{const i=s.summary_feedback||s.summary_feedback_json,h=typeof i=="string"?JSON.parse(i):i;h?.scores&&(h.scores.content!=null&&d.content.push(h.scores.content*10),h.scores.structure!=null&&d.structure.push(h.scores.structure*10))}catch{}}),a.forEach(s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);d.overall.push(i<=10?i*10:i)}}),c.forEach(s=>{try{const i=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json,h=i?.rating?.overall??i?.rating?.gesamteindruck??i?.overall_score??i?.overallScore??i?.score;if(h!=null){const te=parseFloat(h)<=10?parseFloat(h)*10:parseFloat(h);d.overall.push(te)}const v=i?.rating?.communication??i?.rating?.kommunikation;v!=null&&d.communication.push(parseFloat(v)*10)}catch{}});let j=0,x=0;m.forEach(s=>{s.score!=null&&d.overall.push(parseFloat(s.score)),s.filler_count!=null&&(j+=parseInt(s.filler_count),x++)});const o=s=>s.length>0?s.reduce((i,h)=>i+h,0)/s.length:null,p={Gesamt:o(d.overall),Kommunikation:o(d.communication),Inhalt:o(d.content),Struktur:o(d.structure)},_=new Date;_.setDate(_.getDate()-30);const z=[],$=[],R=s=>{const i=s.created_at||s.started_at||s.updated_at;if(!i)return null;const h=new Date(i);return isNaN(h.getTime())?null:h},A=s=>{if(s.overall_score!=null){const i=parseFloat(s.overall_score);return i<=10?i*10:i}if(s.score!=null)return parseFloat(s.score);try{const i=typeof s.feedback_json=="string"?JSON.parse(s.feedback_json):s.feedback_json,h=i?.rating?.overall??i?.rating?.gesamteindruck??i?.overall_score;if(h!=null){const v=parseFloat(h);return v<=10?v*10:v}}catch{}return null};r.forEach(s=>{const i=R(s),h=A(s);i&&h!=null&&(i>=_?z.push(h):$.push(h))});const L=o(z),T=o($),P=L!=null&&T!=null&&T>0?(L-T)/T*100:null,C={},w={};[...n,...a,...c].forEach(s=>{try{let i=s.summary_feedback||s.summary_feedback_json||s.feedback_json||s.analysis_json;typeof i=="string"&&(i=JSON.parse(i)),i?.strengths&&i.strengths.forEach(h=>{const v=h.toLowerCase().substring(0,50);C[v]=(C[v]||0)+1}),(i?.improvements||i?.weaknesses)&&(i.improvements||i.weaknesses||[]).forEach(h=>{const v=h.toLowerCase().substring(0,50);w[v]=(w[v]||0)+1})}catch{}});const f=Object.entries(C).sort((s,i)=>i[1]-s[1]).slice(0,5).map(([s])=>s),G=Object.entries(w).sort((s,i)=>i[1]-s[1]).slice(0,5).map(([s])=>s),D=r.map(s=>({session:s,date:R(s)})).filter(({date:s})=>s!==null).sort((s,i)=>i.date-s.date),E=D[0]?.date?D[0].date.toLocaleDateString("de-DE"):null,y=D[0]?.date?Math.floor((Date.now()-D[0].date)/(1e3*60*60*24)):null,b=[];return[...n,...m].forEach(s=>{try{let i=s.analysis||s.audio_analysis||s.analysis_json;typeof i=="string"&&(i=JSON.parse(i)),i?.pacing?.rating&&i.pacing.rating!=="optimal"&&(b.includes(i.pacing.rating)||b.push(i.pacing.rating))}catch{}}),{totalSessions:l,moduleBreakdown:u,averageScores:p,recentTrend:P,topStrengths:f,topWeaknesses:G,fillerWordAverage:x>0?j/x:null,pacingIssues:b,lastSessionDate:E,daysSinceLastSession:y??999,rawSessions:t}}function De(t){const n=Array.isArray(t?.simulator)?t.simulator:[],a=Array.isArray(t?.video)?t.video:[],c=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.briefingTemplates)?t.briefingTemplates:[];let r=`
## VERFÜGBARE TRAININGS-SZENARIEN

`;return n.length>0&&(r+=`### Szenario-Training (strukturiertes Q&A mit Feedback)
`,n.forEach(l=>{const u=l.difficulty||l.meta?.difficulty||"Mittel";r+=`- ID:${l.id} "${l.title}" [${u}]${l.description?` - ${l.description.substring(0,100)}`:""}
`}),r+=`
`),a.length>0&&(r+=`### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)
`,a.forEach(l=>{r+=`- ID:${l.id} "${l.title}"${l.description?` - ${l.description.substring(0,100)}`:""}
`}),r+=`
`),c.length>0&&(r+=`### Live-Simulation (Echtzeit-Gespräch mit KI)
`,c.forEach(l=>{r+=`- ID:${l.id} "${l.title}"${l.description?` - ${l.description.substring(0,100)}`:""}
`}),r+=`
`),m.length>0&&(r+=`### Smart Briefing (KI-generierte Wissenspakete)
`,m.forEach(l=>{r+=`- ID:${l.id} "${l.title}" [${l.category||"Allgemein"}]
`}),r+=`
`),r+=`### Rhetorik-Gym (Kurze Sprechübungen)
`,r+=`- "Der Klassiker" - 60 Sekunden freies Sprechen
`,r+=`- "Zufalls-Thema" - Überraschungsthema per Zufall
`,r+=`- "Stress-Test" - 90 Sekunden mit wechselnden Fragen
`,r}async function Fe(t,n){const{totalSessions:a}=t;if(a<3){console.log("[CoachingIntelligence] New user - using welcome prompt");const l=Ce();try{return{...await V(l),isWelcome:!0,generatedAt:new Date().toISOString()}}catch(u){return console.error("[CoachingIntelligence] Failed to generate welcome coaching:",u),_e()}}const c=De(n),r=Ae(t)+`
`+c+`

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;try{return{...await V(r),isWelcome:!1,generatedAt:new Date().toISOString(),sessionStats:t}}catch(l){throw console.error("[CoachingIntelligence] Failed to generate coaching analysis:",l),l}}async function V(t){const{GoogleGenerativeAI:n}=await ze(async()=>{const{GoogleGenerativeAI:d}=await import("./index.js").then(j=>j.x);return{GoogleGenerativeAI:d}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),a=ke.getGeminiApiKey();if(!a)throw new Error("Gemini API key not configured");const u=(await(await new n(a).getGenerativeModel({model:"gemini-2.0-flash-exp"}).generateContent(t)).response).text();try{const d=u.match(/```(?:json)?\s*([\s\S]*?)```/),j=d?d[1].trim():u.trim();return JSON.parse(j)}catch(d){throw console.error("[CoachingIntelligence] Failed to parse Gemini response:",d),console.log("[CoachingIntelligence] Raw response:",u),new Error("Failed to parse AI response")}}function _e(){return{isWelcome:!0,level:{name:"Einsteiger",score:0,description:"Bereit für den Start!"},summary:"Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.",strengths:[{title:"Motivation",description:"Du bist hier - das ist der erste Schritt",evidence:"Interesse an Verbesserung ist die beste Voraussetzung"}],focusAreas:[{title:"Erste Erfahrungen sammeln",priority:"hoch",description:"Lerne die Module kennen",currentState:"Noch keine Trainings",targetState:"5 Sessions in der ersten Woche"}],recommendations:[{action:"Starte mit dem Rhetorik-Gym",module:"rhetorik-gym",reason:"Kurze Sessions zum Einstieg",frequency:"1x täglich"}],nextStep:{title:"Dein erstes Rhetorik-Gym",description:"Sprich 60 Sekunden zu einem Thema deiner Wahl",module:"rhetorik-gym",estimatedTime:"2 Minuten"},motivation:"Jede Reise beginnt mit dem ersten Schritt!",generatedAt:new Date().toISOString()}}async function $e(){console.log("[CoachingIntelligence] Starting analysis...");const[t,n]=await Promise.all([Ee(),Te()]);console.log("[CoachingIntelligence] Data fetched:",{sessions:{simulator:t.simulator.length,video:t.video.length,roleplay:t.roleplay.length,games:t.games.length},scenarios:{simulator:n.simulator.length,video:n.video.length,roleplay:n.roleplay.length,briefingTemplates:n.briefingTemplates.length}}),t.simulator.length>0&&console.log("[CoachingIntelligence] Sample simulator session:",{id:t.simulator[0].id,overall_score:t.simulator[0].overall_score,created_at:t.simulator[0].created_at}),t.roleplay.length>0&&console.log("[CoachingIntelligence] Sample roleplay session:",{id:t.roleplay[0].id,feedback_json:t.roleplay[0].feedback_json?"present":"missing",rating:t.roleplay[0].feedback_json?.rating,created_at:t.roleplay[0].created_at}),t.games.length>0&&console.log("[CoachingIntelligence] Sample game session:",{id:t.games[0].id,score:t.games[0].score,created_at:t.games[0].created_at});const a=Ie(t);return console.log("[CoachingIntelligence] Stats aggregated:",{totalSessions:a.totalSessions,averageScores:a.averageScores,daysSinceLastSession:a.daysSinceLastSession,lastSessionDate:a.lastSessionDate,moduleBreakdown:a.moduleBreakdown}),{coaching:await Fe(a,n),stats:a,scenarios:n,sessions:t}}const ee=[{id:"bewerbung",title:"Bewerbung & Karriere",description:"Vorstellungsgespräche, Gehaltsverhandlungen, Selbstpräsentation",icon:se,color:g.indigo[500],keywords:["bewerbung","vorstellung","interview","karriere","gehalt","job"]},{id:"vertrieb",title:"Vertrieb & Verkauf",description:"Kundengespräche, Verkaufspräsentationen, Einwandbehandlung",icon:ie,color:g.emerald[500],keywords:["vertrieb","verkauf","kunde","sales","akquise","pitch"]},{id:"fuehrung",title:"Führung & Management",description:"Mitarbeitergespräche, Feedback geben, Konfliktlösung",icon:ne,color:g.purple[500],keywords:["führung","management","mitarbeiter","feedback","team","konflikt"]},{id:"kommunikation",title:"Allgemeine Kommunikation",description:"Rhetorik, Präsentationen, überzeugendes Sprechen",icon:J,color:g.amber[500],keywords:["kommunikation","rhetorik","präsentation","sprechen","vortrag"]}],Re=({category:t,isSelected:n,onSelect:a})=>{const c=t.icon;return e.jsx(N.div,{whileHover:{scale:1.02},whileTap:{scale:.98},children:e.jsx(k,{className:`p-5 cursor-pointer transition-all ${n?"ring-2 ring-offset-2 shadow-lg":"hover:shadow-md border-slate-200"}`,style:{borderColor:n?t.color:void 0,ringColor:n?t.color:void 0},onClick:()=>a(t.id),children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",style:{backgroundColor:`${t.color}15`},children:e.jsx(c,{size:24,style:{color:t.color}})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h3",{className:"font-semibold text-slate-900",children:t.title}),n&&e.jsx(N.div,{initial:{scale:0},animate:{scale:1},className:"w-5 h-5 rounded-full flex items-center justify-center",style:{backgroundColor:t.color},children:e.jsx(ae,{size:12,className:"text-white"})})]}),e.jsx("p",{className:"text-sm text-slate-500 mt-1",children:t.description})]})]})})})},We=({onComplete:t,onSkip:n})=>{const[a,c]=S.useState(null),[m,r]=S.useState(1),l=()=>{a&&(localStorage.setItem("kicoach_user_focus",a),localStorage.setItem("kicoach_focus_selected","true"),t(a))},u=()=>{localStorage.setItem("kicoach_focus_selected","true"),n?.()};return e.jsx(N.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",children:e.jsx(N.div,{initial:{scale:.9,y:20},animate:{scale:1,y:0},exit:{scale:.9,y:20},className:"w-full max-w-2xl",children:e.jsxs(k,{className:"p-6 md:p-8 shadow-2xl",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("div",{className:"w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4",children:e.jsx(B,{size:32,className:"text-white"})}),e.jsx("h2",{className:"text-2xl font-bold text-slate-900 mb-2",children:"Willkommen bei deinem KI-Coach!"}),e.jsx("p",{className:"text-slate-600",children:"Um dir die besten Trainings zu empfehlen, verrate uns kurz deinen Fokus."})]}),e.jsx("div",{className:"grid gap-3 mb-8",children:ee.map(d=>e.jsx(Re,{category:d,isSelected:a===d.id,onSelect:c},d.id))}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("button",{onClick:u,className:"text-sm text-slate-500 hover:text-slate-700 transition-colors",children:"Überspringen"}),e.jsx(F,{onClick:l,disabled:!a,icon:e.jsx(H,{size:16}),iconPosition:"right",children:"Weiter"})]}),e.jsx("p",{className:"text-xs text-slate-400 text-center mt-4",children:"Du kannst deinen Fokus jederzeit in den Einstellungen ändern."})]})})})},Ke=()=>localStorage.getItem("kicoach_focus_selected")==="true",Le=()=>localStorage.getItem("kicoach_user_focus"),Ge=()=>{localStorage.removeItem("kicoach_user_focus"),localStorage.removeItem("kicoach_focus_selected")},O={"rhetorik-gym":fe,"szenario-training":K,"wirkungs-analyse":pe,"live-simulation":J,"smart-briefing":xe},Me={"rhetorik-gym":"gym","szenario-training":"simulator","wirkungs-analyse":"video_training","live-simulation":"dashboard","smart-briefing":"smart_briefing"},Pe={Einsteiger:g.slate[400],Anfänger:g.amber[500],Fortgeschritten:g.blue[500],Profi:g.emerald[500],Experte:g.purple[500]},Be=({level:t})=>{const n=Pe[t.name]||g.indigo[500],a=t.score||0,c=54,m=c*2*Math.PI,r=m-a/100*m;return e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:"relative",style:{width:140,height:140},children:[e.jsxs("svg",{width:140,height:140,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:70,cy:70,r:c,fill:"none",stroke:g.slate[200],strokeWidth:10}),e.jsx(N.circle,{cx:70,cy:70,r:c,fill:"none",stroke:n,strokeWidth:10,strokeLinecap:"round",strokeDasharray:m,initial:{strokeDashoffset:m},animate:{strokeDashoffset:r},transition:{duration:1.5,ease:"easeOut"}})]}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx(me,{size:32,style:{color:n}}),e.jsx("span",{className:"text-2xl font-bold text-slate-900 mt-1",children:t.score})]})]}),e.jsxs("div",{className:"mt-3 text-center",children:[e.jsx("span",{className:"text-lg font-bold px-4 py-1 rounded-full",style:{backgroundColor:`${n}20`,color:n},children:t.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-2",children:t.description})]})]})},Oe=({strength:t,index:n})=>e.jsx(N.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:n*.1},children:e.jsx(k,{className:"p-4 border-l-4 border-l-green-500",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0",children:e.jsx(Z,{size:18,className:"text-green-600"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),t.evidence&&e.jsx("p",{className:"text-xs text-slate-400 mt-1 italic",children:t.evidence})]})]})})}),Ue=({area:t,index:n,onNavigate:a,scenarios:c})=>{const m={hoch:{bg:"bg-red-100",text:"text-red-600",border:"border-red-500"},mittel:{bg:"bg-amber-100",text:"text-amber-600",border:"border-amber-500"},niedrig:{bg:"bg-blue-100",text:"text-blue-600",border:"border-blue-500"}},r=m[t.priority]||m.mittel,l=t.suggestedTrainings||[];return e.jsx(N.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:n*.1},children:e.jsx(k,{className:`p-4 border-l-4 ${r.border}`,children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("span",{className:`text-[10px] font-medium px-2 py-0.5 rounded-full ${r.bg} ${r.text}`,children:t.priority})]}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),e.jsxs("div",{className:"mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Aktuell: "}),e.jsx("span",{className:"text-slate-600",children:t.currentState})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Ziel: "}),e.jsx("span",{className:"text-green-600 font-medium",children:t.targetState})]})]}),l.length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-slate-100",children:[e.jsx("p",{className:"text-[10px] text-slate-400 uppercase tracking-wide mb-2",children:"Passende Trainings:"}),e.jsx("div",{className:"flex flex-col gap-1.5",children:l.slice(0,2).map((u,d)=>{const j=O[u.module]||K;return e.jsxs("button",{onClick:()=>a?.(u.module,u.scenario_id),className:"flex items-center gap-2 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 text-left w-full",children:[e.jsx(j,{size:14,className:"flex-shrink-0 text-slate-500"}),e.jsx("span",{className:"flex-1",children:u.title}),e.jsx(be,{size:14,className:"text-slate-400 flex-shrink-0"})]},d)})})]})]}),e.jsx(K,{size:20,className:r.text})]})})})},Ve=({rec:t,index:n,onNavigate:a})=>{const c=O[t.module]||K;return e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:n*.1},children:e.jsx(k,{className:"p-4 hover:shadow-md transition-shadow",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(c,{size:20,className:"text-primary"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.action}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:t.reason}),t.frequency&&e.jsxs("div",{className:"flex items-center gap-1 mt-2 text-xs text-slate-400",children:[e.jsx(X,{size:12}),e.jsx("span",{children:t.frequency})]})]}),e.jsx(F,{variant:"secondary",size:"sm",className:"flex-shrink-0",onClick:()=>a(t.module,t.scenario_id),children:e.jsx(je,{size:14})})]})})})},Je=({nextStep:t,onNavigate:n})=>{const a=O[t.module]||ye;return e.jsx(N.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:.3},children:e.jsxs(k,{className:"p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5",onClick:()=>n(t.module,t.scenario_id),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(B,{size:20,className:"text-primary"}),e.jsx("span",{className:"text-xs font-semibold text-primary uppercase tracking-wide",children:"Nächster Schritt"})]}),e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 mb-4",children:t.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(a,{size:16}),e.jsx("span",{className:"capitalize",children:t.module?.replace("-"," ")})]}),t.estimatedTime&&e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(X,{size:16}),e.jsx("span",{children:t.estimatedTime})]})]}),e.jsx(F,{icon:e.jsx(H,{size:16}),children:"Jetzt starten"})]})]})})},He=({stats:t})=>{const n=[{label:"Gesamt Sessions",value:t.totalSessions,icon:q,color:g.indigo[500]},{label:"Ø Bewertung",value:t.averageScores?.Gesamt!=null?`${Math.round(t.averageScores.Gesamt)}%`:"—",icon:ue,color:g.amber[500]},{label:"Trend (30 Tage)",value:t.recentTrend!=null?`${t.recentTrend>0?"+":""}${t.recentTrend.toFixed(1)}%`:"—",icon:he,color:t.recentTrend>0?g.emerald[500]:g.red[500]},{label:"Letztes Training",value:t.daysSinceLastSession!=null&&t.daysSinceLastSession<999?t.daysSinceLastSession===0?"Heute":`Vor ${t.daysSinceLastSession}d`:"—",icon:ge,color:g.blue[500]}];return e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:n.map((a,c)=>e.jsx(N.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:c*.05},children:e.jsxs(k,{className:"p-4 text-center",children:[e.jsx(a.icon,{size:24,className:"mx-auto mb-2",style:{color:a.color}}),e.jsx("div",{className:"text-2xl font-bold text-slate-900",children:a.value}),e.jsx("div",{className:"text-xs text-slate-500",children:a.label})]})},a.label))})},rt=({isAuthenticated:t,requireAuth:n,onNavigate:a})=>{const c=Ne(),{branding:m}=ve();m?.primaryAccent||g.indigo[500];const[r,l]=S.useState(!0),[u,d]=S.useState(!1),[j,x]=S.useState(null),[o,p]=S.useState(null),[_,z]=S.useState(!1),[$,R]=S.useState(Le()),A=S.useCallback(async(y=!1)=>{if(!t){l(!1);return}try{y?d(!0):l(!0),x(null);const b=await $e();p(b)}catch(b){console.error("[KiCoach] Failed to load coaching:",b),x("Fehler beim Laden der Coaching-Analyse")}finally{l(!1),d(!1)}},[t]);S.useEffect(()=>{A()},[A]),S.useEffect(()=>{if(t&&!r&&o&&!Ke()){const y=setTimeout(()=>z(!0),500);return()=>clearTimeout(y)}},[t,r,o]);const L=y=>{R(y),z(!1),A(!0)},T=()=>{z(!1)},P=()=>{Ge(),R(null),z(!0)},C=(y,b)=>{const s=Me[y]||y;a&&a(s,b)};S.useEffect(()=>{!t&&n&&n()},[t,n]);const w=Se(g.indigo[600],g.purple[500]);if(r)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:W,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs("div",{className:"text-center",children:[e.jsx(U,{size:48,className:"text-primary animate-spin mx-auto"}),e.jsx("p",{className:"text-slate-500 mt-4",children:"Analysiere deine Trainings..."})]})})]});if(!t)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:W,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(k,{className:"p-8 text-center max-w-md",children:[e.jsx(W,{size:48,className:"text-primary mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Anmeldung erforderlich"}),e.jsx("p",{className:"text-slate-600 mb-6",children:"Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein."}),e.jsx(F,{onClick:n,children:"Anmelden"})]})})]});if(j&&!o)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:W,gradient:w}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(k,{className:"p-8 text-center max-w-md",children:[e.jsx(re,{size:48,className:"text-red-500 mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Fehler beim Laden"}),e.jsx("p",{className:"text-slate-600 mb-6",children:j}),e.jsx(F,{onClick:()=>A(),children:"Erneut versuchen"})]})})]});const{coaching:f,stats:G,sessions:I,scenarios:D}=o||{},E=$?ee.find(y=>y.id===$):null;return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(le,{children:_&&e.jsx(We,{onComplete:L,onSkip:T})}),e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:W,gradient:w,rightContent:e.jsxs(F,{variant:"secondary",size:"sm",onClick:()=>A(!0),disabled:u,className:"bg-white/20 border-white/30 text-white hover:bg-white/30",children:[u?e.jsx(U,{size:16,className:"animate-spin"}):e.jsx(oe,{size:16}),e.jsx("span",{className:"ml-2 hidden sm:inline",children:"Aktualisieren"})]})}),e.jsx("div",{className:"bg-white border-b border-slate-200",children:e.jsx("div",{className:`${c?"px-4 py-3":"px-8 py-4"} max-w-6xl mx-auto`,children:e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-sm text-slate-500",children:"Mein Fokus:"}),E?e.jsxs("div",{className:"flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg",children:[e.jsx(E.icon,{size:16,style:{color:E.color}}),e.jsx("span",{className:"text-sm font-medium text-slate-700",children:E.title})]}):e.jsx("span",{className:"text-sm text-slate-400 italic",children:"Nicht festgelegt"})]}),e.jsxs("button",{onClick:P,className:"flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors",children:[e.jsx(ce,{size:14}),e.jsx("span",{children:E?"Ändern":"Festlegen"})]})]})})}),e.jsx("div",{className:`${c?"p-4":"px-8 py-6"}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("div",{className:`grid gap-6 ${c?"grid-cols-1":"grid-cols-3"}`,children:[e.jsx(k,{className:"p-6 flex items-center justify-center",children:f?.level&&e.jsx(Be,{level:f.level})}),e.jsxs("div",{className:`${c?"":"col-span-2"}`,children:[G&&e.jsx(He,{stats:G}),f?.summary&&e.jsx(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.2},className:"mt-4",children:e.jsx(k,{className:"p-4 bg-gradient-to-r from-slate-50 to-slate-100",children:e.jsx("p",{className:"text-sm text-slate-700 leading-relaxed",children:f.summary})})})]})]}),f?.nextStep&&e.jsx(Je,{nextStep:f.nextStep,onNavigate:C}),e.jsxs("div",{className:`grid gap-6 ${c?"grid-cols-1":"grid-cols-2"}`,children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(Z,{size:20,className:"text-green-500"}),"Deine Stärken"]}),e.jsxs("div",{className:"space-y-3",children:[f?.strengths?.map((y,b)=>e.jsx(Oe,{strength:y,index:b},b)),(!f?.strengths||f.strengths.length===0)&&e.jsx(k,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Stärken identifiziert. Absolviere mehr Trainings!"})]})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(K,{size:20,className:"text-amber-500"}),"Fokus-Bereiche"]}),e.jsxs("div",{className:"space-y-3",children:[f?.focusAreas?.map((y,b)=>e.jsx(Ue,{area:y,index:b,onNavigate:C,scenarios:D},b)),(!f?.focusAreas||f.focusAreas.length===0)&&e.jsx(k,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Fokus-Bereiche identifiziert."})]})]})]}),f?.recommendations?.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(de,{size:20,className:"text-primary"}),"Empfehlungen für dich"]}),e.jsx("div",{className:`grid gap-4 ${c?"grid-cols-1":"grid-cols-2"}`,children:f.recommendations.map((y,b)=>e.jsx(Ve,{rec:y,index:b,onNavigate:C},b))})]}),I&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(q,{size:20,className:"text-indigo-500"}),"Dein Fortschritt"]}),e.jsx(k,{className:"p-4",children:e.jsx(we,{simulatorSessions:I.simulator,videoSessions:I.video,roleplaySessions:I.roleplay,gameSessions:I.games})})]}),f?.motivation&&e.jsxs(N.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"text-center py-8",children:[e.jsx(B,{size:24,className:"text-primary mx-auto mb-3"}),e.jsxs("p",{className:"text-lg font-medium text-slate-700 italic",children:['"',f.motivation,'"']})]})]})})]})};export{rt as KiCoachApp};
