const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index.js","./ui-vendor-zeH2bUSD.js","./react-vendor-uDOJF2jQ.js","./FeatureInfoButton-CSO-N4qQ.js","./FeatureInfoButton.css"])))=>i.map(i=>d[i]);
import{r as ie,a$ as ne,U as re,M as J,j as e,m as z,a as B,f as Z,b as ae,B as K,L as U,E as le,A as oe,u as ce,J as de,a2 as q,l as W,z as me,b0 as X,a0 as ue,a1 as he,i as ge,Y as xe,F as pe,V as fe,e as be,Z as ye,g as Q,h as je,a7 as ke}from"./ui-vendor-zeH2bUSD.js";import{a as w}from"./react-vendor-uDOJF2jQ.js";import{C as v,B as $}from"./select-native-CSFtBRq_.js";import{g as Y,a as ee,w as ve,C as x,u as Se,q as Ne}from"./FeatureInfoButton-CSO-N4qQ.js";import"./dialog-CxUaA3gX.js";import{u as we}from"./useMobile-YxjH166V.js";import{P as ze}from"./ProgressChart-DYsvngxF.js";import{F as M}from"./FeatureAppHeader-UhIrznzb.js";import{_ as Ae}from"./index.js";import"./utils-BEHD0UYf.js";import"./index-CklPxmEV.js";const Ce=(t,s=null)=>{const{totalSessions:r,moduleBreakdown:a,averageScores:m,recentTrend:l,topStrengths:o,topWeaknesses:u,fillerWordAverage:c,pacingIssues:p,lastSessionDate:f,daysSinceLastSession:d}=t;return`Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.
${s?`
### NUTZER-FOKUS (WICHTIG!)
Der Nutzer hat folgenden Fokus gewählt: **${{bewerbung:"Bewerbung & Karriere (Vorstellungsgespräche, Selbstpräsentation)",vertrieb:"Vertrieb & Verkauf (Kundengespräche, Verkaufsverhandlungen)",fuehrung:"Führung & Management (Mitarbeitergespräche, Teamführung)",kommunikation:"Allgemeine Kommunikation (Präsentationen, Meetings)"}[s]||s}**

⚠️ ALLE Empfehlungen und Trainings-Vorschläge sollten primär auf diesen Fokusbereich ausgerichtet sein!
- Bevorzuge Szenarien und Trainings, die zum Fokusbereich passen
- Formuliere Stärken und Verbesserungsbereiche im Kontext des gewählten Fokus
- Der "nächste Schritt" sollte direkt zum Fokusbereich relevant sein
`:""}

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${r}
- Letztes Training: ${f||"Unbekannt"} (vor ${d} Tagen)

### Module-Aktivität
${Object.entries(a).map(([j,S])=>`- ${j}: ${S} Sessions`).join(`
`)}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(m).map(([j,S])=>`- ${j}: ${S!==null?Math.round(S):"Keine Daten"}`).join(`
`)}

### Trend (letzte 30 Tage vs. davor)
${l?`${l>0?"+":""}${l.toFixed(1)}% Veränderung`:"Nicht genug Daten"}

### Identifizierte Stärken (aus Feedback)
${o.length>0?o.map(j=>`- ${j}`).join(`
`):"Noch keine identifiziert"}

### Identifizierte Schwächen (aus Feedback)
${u.length>0?u.map(j=>`- ${j}`).join(`
`):"Noch keine identifiziert"}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${c!==null?c.toFixed(1):"Keine Daten"}
- Häufige Tempo-Probleme: ${p.length>0?p.join(", "):"Keine erkannt"}

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
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`},Ee=()=>`Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

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
}`;async function Te(){const t=Y(),s={"X-WP-Nonce":ee()};try{const[r,a,m,l]=await Promise.all([fetch(`${t}/simulator/sessions`,{headers:s,credentials:"same-origin"}),fetch(`${t}/video-training/sessions`,{headers:s,credentials:"same-origin"}),fetch(`${t}/roleplays/sessions`,{headers:s,credentials:"same-origin"}),fetch(`${t}/game/sessions`,{headers:s,credentials:"same-origin"})]),[o,u,c,p]=await Promise.all([r.ok?r.json():{data:{sessions:[]}},a.ok?a.json():{data:{sessions:[]}},m.ok?m.json():{data:[]},l.ok?l.json():{data:[]}]),f=(d,k=null)=>{if(Array.isArray(d))return d;if(d?.data){if(k&&d.data[k])return Array.isArray(d.data[k])?d.data[k]:[];if(Array.isArray(d.data))return d.data;if(d.data.sessions&&Array.isArray(d.data.sessions))return d.data.sessions}return[]};return{simulator:f(o,"sessions"),video:f(u,"sessions"),roleplay:f(c),games:f(p)}}catch(r){return console.error("[CoachingIntelligence] Failed to fetch sessions:",r),{simulator:[],video:[],roleplay:[],games:[]}}}async function Fe(){const t=Y(),s={"X-WP-Nonce":ee()};try{const[r,a,m,l]=await Promise.all([fetch(`${t}/simulator/scenarios`,{headers:s,credentials:"same-origin"}),fetch(`${t}/video-training/scenarios`,{headers:s,credentials:"same-origin"}),fetch(`${t}/roleplays`,{headers:s,credentials:"same-origin"}),fetch(`${t}/smartbriefing/templates`,{headers:s,credentials:"same-origin"})]),[o,u,c,p]=await Promise.all([r.ok?r.json():{data:{scenarios:[]}},a.ok?a.json():{data:{scenarios:[]}},m.ok?m.json():{data:[]},l.ok?l.json():{data:[]}]),f=(d,k=null)=>{if(Array.isArray(d))return d;if(d?.data){if(k&&d.data[k])return Array.isArray(d.data[k])?d.data[k]:[];if(Array.isArray(d.data))return d.data}return[]};return{simulator:f(o,"scenarios"),video:f(u,"scenarios"),roleplay:f(c),briefingTemplates:f(p)}}catch(r){return console.error("[CoachingIntelligence] Failed to fetch scenarios:",r),{simulator:[],video:[],roleplay:[],briefingTemplates:[]}}}function De(t){const s=Array.isArray(t?.simulator)?t.simulator:[],r=Array.isArray(t?.video)?t.video:[],a=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.games)?t.games:[],l=[...s.map(i=>({...i,module:"Szenario-Training"})),...r.map(i=>({...i,module:"Wirkungs-Analyse"})),...a.map(i=>({...i,module:"Live-Simulation"})),...m.map(i=>({...i,module:"Rhetorik-Gym"}))],o=l.length,u={"Szenario-Training":s.length,"Wirkungs-Analyse":r.length,"Live-Simulation":a.length,"Rhetorik-Gym":m.length},c={overall:[],communication:[],content:[],structure:[],confidence:[],fillerWords:[]};s.forEach(i=>{if(i.overall_score!=null){const n=parseFloat(i.overall_score);c.overall.push(n<=10?n*10:n)}try{const n=i.summary_feedback||i.summary_feedback_json,h=typeof n=="string"?JSON.parse(n):n;h?.scores&&(h.scores.content!=null&&c.content.push(h.scores.content*10),h.scores.structure!=null&&c.structure.push(h.scores.structure*10))}catch{}}),r.forEach(i=>{if(i.overall_score!=null){const n=parseFloat(i.overall_score);c.overall.push(n<=10?n*10:n)}}),a.forEach(i=>{try{const n=typeof i.feedback_json=="string"?JSON.parse(i.feedback_json):i.feedback_json,h=n?.rating?.overall??n?.rating?.gesamteindruck??n?.overall_score??n?.overallScore??n?.score;if(h!=null){const se=parseFloat(h)<=10?parseFloat(h)*10:parseFloat(h);c.overall.push(se)}const N=n?.rating?.communication??n?.rating?.kommunikation;N!=null&&c.communication.push(parseFloat(N)*10)}catch{}});let p=0,f=0;m.forEach(i=>{i.score!=null&&c.overall.push(parseFloat(i.score)),i.filler_count!=null&&(p+=parseInt(i.filler_count),f++)});const d=i=>i.length>0?i.reduce((n,h)=>n+h,0)/i.length:null,k={Gesamt:d(c.overall),Kommunikation:d(c.communication),Inhalt:d(c.content),Struktur:d(c.structure)},F=new Date;F.setDate(F.getDate()-30);const j=[],S=[],R=i=>{const n=i.created_at||i.started_at||i.updated_at;if(!n)return null;const h=new Date(n);return isNaN(h.getTime())?null:h},C=i=>{if(i.overall_score!=null){const n=parseFloat(i.overall_score);return n<=10?n*10:n}if(i.score!=null)return parseFloat(i.score);try{const n=typeof i.feedback_json=="string"?JSON.parse(i.feedback_json):i.feedback_json,h=n?.rating?.overall??n?.rating?.gesamteindruck??n?.overall_score;if(h!=null){const N=parseFloat(h);return N<=10?N*10:N}}catch{}return null};l.forEach(i=>{const n=R(i),h=C(i);n&&h!=null&&(n>=F?j.push(h):S.push(h))});const L=d(j),D=d(S),P=L!=null&&D!=null&&D>0?(L-D)/D*100:null,E={},A={};[...s,...r,...a].forEach(i=>{try{let n=i.summary_feedback||i.summary_feedback_json||i.feedback_json||i.analysis_json;typeof n=="string"&&(n=JSON.parse(n)),n?.strengths&&n.strengths.forEach(h=>{const N=h.toLowerCase().substring(0,50);E[N]=(E[N]||0)+1}),(n?.improvements||n?.weaknesses)&&(n.improvements||n.weaknesses||[]).forEach(h=>{const N=h.toLowerCase().substring(0,50);A[N]=(A[N]||0)+1})}catch{}});const b=Object.entries(E).sort((i,n)=>n[1]-i[1]).slice(0,5).map(([i])=>i),G=Object.entries(A).sort((i,n)=>n[1]-i[1]).slice(0,5).map(([i])=>i),_=l.map(i=>({session:i,date:R(i)})).filter(({date:i})=>i!==null).sort((i,n)=>n.date-i.date),T=_[0]?.date?_[0].date.toLocaleDateString("de-DE"):null,g=_[0]?.date?Math.floor((Date.now()-_[0].date)/(1e3*60*60*24)):null,y=[];return[...s,...m].forEach(i=>{try{let n=i.analysis||i.audio_analysis||i.analysis_json;typeof n=="string"&&(n=JSON.parse(n)),n?.pacing?.rating&&n.pacing.rating!=="optimal"&&(y.includes(n.pacing.rating)||y.push(n.pacing.rating))}catch{}}),{totalSessions:o,moduleBreakdown:u,averageScores:k,recentTrend:P,topStrengths:b,topWeaknesses:G,fillerWordAverage:f>0?p/f:null,pacingIssues:y,lastSessionDate:T,daysSinceLastSession:g??999,rawSessions:t}}function Ie(t){const s=Array.isArray(t?.simulator)?t.simulator:[],r=Array.isArray(t?.video)?t.video:[],a=Array.isArray(t?.roleplay)?t.roleplay:[],m=Array.isArray(t?.briefingTemplates)?t.briefingTemplates:[];let l=`
## VERFÜGBARE TRAININGS-SZENARIEN

`;return s.length>0&&(l+=`### Szenario-Training (strukturiertes Q&A mit Feedback)
`,s.forEach(o=>{const u=o.difficulty||o.meta?.difficulty||"Mittel";l+=`- ID:${o.id} "${o.title}" [${u}]${o.description?` - ${o.description.substring(0,100)}`:""}
`}),l+=`
`),r.length>0&&(l+=`### Wirkungs-Analyse (Video-Training mit Körpersprache-Feedback)
`,r.forEach(o=>{l+=`- ID:${o.id} "${o.title}"${o.description?` - ${o.description.substring(0,100)}`:""}
`}),l+=`
`),a.length>0&&(l+=`### Live-Simulation (Echtzeit-Gespräch mit KI)
`,a.forEach(o=>{l+=`- ID:${o.id} "${o.title}"${o.description?` - ${o.description.substring(0,100)}`:""}
`}),l+=`
`),m.length>0&&(l+=`### Smart Briefing (KI-generierte Wissenspakete)
`,m.forEach(o=>{l+=`- ID:${o.id} "${o.title}" [${o.category||"Allgemein"}]
`}),l+=`
`),l+=`### Rhetorik-Gym (Kurze Sprechübungen)
`,l+=`- "Der Klassiker" - 60 Sekunden freies Sprechen
`,l+=`- "Zufalls-Thema" - Überraschungsthema per Zufall
`,l+=`- "Stress-Test" - 90 Sekunden mit wechselnden Fragen
`,l}async function _e(t,s){const{totalSessions:r}=t;if(r<3){console.log("[CoachingIntelligence] New user - using welcome prompt");const o=Ee();try{return{...await V(o),isWelcome:!0,generatedAt:new Date().toISOString()}}catch(u){return console.error("[CoachingIntelligence] Failed to generate welcome coaching:",u),$e()}}const a=Ie(s),l=Ce(t,userFocus)+`
`+a+`

## WICHTIG FÜR EMPFEHLUNGEN

Wenn du ein Training empfiehlst, nutze die IDs aus dem Szenario-Katalog oben.
Format für Empfehlungen:
{
  "scenario_id": <ID aus Katalog oder null für Rhetorik-Gym>,
  "scenario_title": "<Exakter Titel aus Katalog>",
  "module": "szenario-training|wirkungs-analyse|live-simulation|smart-briefing|rhetorik-gym"
}`;try{return{...await V(l),isWelcome:!1,generatedAt:new Date().toISOString(),sessionStats:t}}catch(o){throw console.error("[CoachingIntelligence] Failed to generate coaching analysis:",o),o}}async function V(t){const{GoogleGenerativeAI:s}=await Ae(async()=>{const{GoogleGenerativeAI:c}=await import("./index.js").then(p=>p.x);return{GoogleGenerativeAI:c}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),r=ve.getGeminiApiKey();if(!r)throw new Error("Gemini API key not configured");const u=(await(await new s(r).getGenerativeModel({model:"gemini-2.0-flash-exp"}).generateContent(t)).response).text();try{const c=u.match(/```(?:json)?\s*([\s\S]*?)```/),p=c?c[1].trim():u.trim();return JSON.parse(p)}catch(c){throw console.error("[CoachingIntelligence] Failed to parse Gemini response:",c),console.log("[CoachingIntelligence] Raw response:",u),new Error("Failed to parse AI response")}}function $e(){return{isWelcome:!0,level:{name:"Einsteiger",score:0,description:"Bereit für den Start!"},summary:"Willkommen bei deinem persönlichen Karriere-Coach! Starte jetzt mit deinem ersten Training.",strengths:[{title:"Motivation",description:"Du bist hier - das ist der erste Schritt",evidence:"Interesse an Verbesserung ist die beste Voraussetzung"}],focusAreas:[{title:"Erste Erfahrungen sammeln",priority:"hoch",description:"Lerne die Module kennen",currentState:"Noch keine Trainings",targetState:"5 Sessions in der ersten Woche"}],recommendations:[{action:"Starte mit dem Rhetorik-Gym",module:"rhetorik-gym",reason:"Kurze Sessions zum Einstieg",frequency:"1x täglich"}],nextStep:{title:"Dein erstes Rhetorik-Gym",description:"Sprich 60 Sekunden zu einem Thema deiner Wahl",module:"rhetorik-gym",estimatedTime:"2 Minuten"},motivation:"Jede Reise beginnt mit dem ersten Schritt!",generatedAt:new Date().toISOString()}}async function Re(t=null){console.log("[CoachingIntelligence] Starting analysis...",t?`Focus: ${t}`:"No focus set");const[s,r]=await Promise.all([Te(),Fe()]);console.log("[CoachingIntelligence] Data fetched:",{sessions:{simulator:s.simulator.length,video:s.video.length,roleplay:s.roleplay.length,games:s.games.length},scenarios:{simulator:r.simulator.length,video:r.video.length,roleplay:r.roleplay.length,briefingTemplates:r.briefingTemplates.length}}),s.simulator.length>0&&console.log("[CoachingIntelligence] Sample simulator session:",{id:s.simulator[0].id,overall_score:s.simulator[0].overall_score,created_at:s.simulator[0].created_at}),s.roleplay.length>0&&console.log("[CoachingIntelligence] Sample roleplay session:",{id:s.roleplay[0].id,feedback_json:s.roleplay[0].feedback_json?"present":"missing",rating:s.roleplay[0].feedback_json?.rating,created_at:s.roleplay[0].created_at}),s.games.length>0&&console.log("[CoachingIntelligence] Sample game session:",{id:s.games[0].id,score:s.games[0].score,created_at:s.games[0].created_at});const a=De(s);return console.log("[CoachingIntelligence] Stats aggregated:",{totalSessions:a.totalSessions,averageScores:a.averageScores,daysSinceLastSession:a.daysSinceLastSession,lastSessionDate:a.lastSessionDate,moduleBreakdown:a.moduleBreakdown}),{coaching:await _e(a,r),stats:a,scenarios:r,sessions:s}}const te=[{id:"bewerbung",title:"Bewerbung & Karriere",description:"Vorstellungsgespräche, Gehaltsverhandlungen, Selbstpräsentation",icon:ie,color:x.indigo[500],keywords:["bewerbung","vorstellung","interview","karriere","gehalt","job"]},{id:"vertrieb",title:"Vertrieb & Verkauf",description:"Kundengespräche, Verkaufspräsentationen, Einwandbehandlung",icon:ne,color:x.emerald[500],keywords:["vertrieb","verkauf","kunde","sales","akquise","pitch"]},{id:"fuehrung",title:"Führung & Management",description:"Mitarbeitergespräche, Feedback geben, Konfliktlösung",icon:re,color:x.purple[500],keywords:["führung","management","mitarbeiter","feedback","team","konflikt"]},{id:"kommunikation",title:"Allgemeine Kommunikation",description:"Rhetorik, Präsentationen, überzeugendes Sprechen",icon:J,color:x.amber[500],keywords:["kommunikation","rhetorik","präsentation","sprechen","vortrag"]}],Ke=({category:t,isSelected:s,onSelect:r})=>{const a=t.icon;return e.jsx(z.div,{whileHover:{scale:1.02},whileTap:{scale:.98},children:e.jsx(v,{className:`p-5 cursor-pointer transition-all ${s?"ring-2 ring-offset-2 shadow-lg":"hover:shadow-md border-slate-200"}`,style:{borderColor:s?t.color:void 0,ringColor:s?t.color:void 0},onClick:()=>r(t.id),children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",style:{backgroundColor:`${t.color}15`},children:e.jsx(a,{size:24,style:{color:t.color}})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h3",{className:"font-semibold text-slate-900",children:t.title}),s&&e.jsx(z.div,{initial:{scale:0},animate:{scale:1},className:"w-5 h-5 rounded-full flex items-center justify-center",style:{backgroundColor:t.color},children:e.jsx(ae,{size:12,className:"text-white"})})]}),e.jsx("p",{className:"text-sm text-slate-500 mt-1",children:t.description})]})]})})})},We=({onComplete:t,onSkip:s})=>{const[r,a]=w.useState(null),[m,l]=w.useState(1),o=()=>{r&&(localStorage.setItem("kicoach_user_focus",r),localStorage.setItem("kicoach_focus_selected","true"),t(r))},u=()=>{localStorage.setItem("kicoach_focus_selected","true"),s?.()};return e.jsx(z.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",children:e.jsx(z.div,{initial:{scale:.9,y:20},animate:{scale:1,y:0},exit:{scale:.9,y:20},className:"w-full max-w-2xl",children:e.jsxs(v,{className:"p-6 md:p-8 shadow-2xl",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("div",{className:"w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4",children:e.jsx(B,{size:32,className:"text-white"})}),e.jsx("h2",{className:"text-2xl font-bold text-slate-900 mb-2",children:"Willkommen bei deinem KI-Coach!"}),e.jsx("p",{className:"text-slate-600",children:"Um dir die besten Trainings zu empfehlen, verrate uns kurz deinen Fokus."})]}),e.jsx("div",{className:"grid gap-3 mb-8",children:te.map(c=>e.jsx(Ke,{category:c,isSelected:r===c.id,onSelect:a},c.id))}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("button",{onClick:u,className:"text-sm text-slate-500 hover:text-slate-700 transition-colors",children:"Überspringen"}),e.jsx($,{onClick:o,disabled:!r,icon:e.jsx(Z,{size:16}),iconPosition:"right",children:"Weiter"})]}),e.jsx("p",{className:"text-xs text-slate-400 text-center mt-4",children:"Du kannst deinen Fokus jederzeit in den Einstellungen ändern."})]})})})},Le=()=>localStorage.getItem("kicoach_focus_selected")==="true",H=()=>localStorage.getItem("kicoach_user_focus"),Ge=()=>{localStorage.removeItem("kicoach_user_focus"),localStorage.removeItem("kicoach_focus_selected")},O={"rhetorik-gym":be,"szenario-training":W,"wirkungs-analyse":fe,"live-simulation":J,"smart-briefing":pe},Me={"rhetorik-gym":"gym","szenario-training":"simulator","wirkungs-analyse":"video_training","live-simulation":"dashboard","smart-briefing":"smart_briefing"},Pe={Einsteiger:x.slate[400],Anfänger:x.amber[500],Fortgeschritten:x.blue[500],Profi:x.emerald[500],Experte:x.purple[500]},Be=({level:t})=>{const s=Pe[t.name]||x.indigo[500],r=t.score||0,a=54,m=a*2*Math.PI,l=m-r/100*m;return e.jsxs("div",{className:"relative flex flex-col items-center",children:[e.jsxs("div",{className:"relative",style:{width:140,height:140},children:[e.jsxs("svg",{width:140,height:140,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:70,cy:70,r:a,fill:"none",stroke:x.slate[200],strokeWidth:10}),e.jsx(z.circle,{cx:70,cy:70,r:a,fill:"none",stroke:s,strokeWidth:10,strokeLinecap:"round",strokeDasharray:m,initial:{strokeDashoffset:m},animate:{strokeDashoffset:l},transition:{duration:1.5,ease:"easeOut"}})]}),e.jsxs("div",{className:"absolute inset-0 flex flex-col items-center justify-center",children:[e.jsx(ue,{size:32,style:{color:s}}),e.jsx("span",{className:"text-2xl font-bold text-slate-900 mt-1",children:t.score})]})]}),e.jsxs("div",{className:"mt-3 text-center",children:[e.jsx("span",{className:"text-lg font-bold px-4 py-1 rounded-full",style:{backgroundColor:`${s}20`,color:s},children:t.name}),e.jsx("p",{className:"text-sm text-slate-500 mt-2",children:t.description})]})]})},Oe=({strength:t,index:s})=>e.jsx(z.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:s*.1},children:e.jsx(v,{className:"p-4 border-l-4 border-l-green-500",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0",children:e.jsx(q,{size:18,className:"text-green-600"})}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("p",{className:"text-xs text-slate-600 mt-1 break-words",children:t.description}),t.evidence&&e.jsx("p",{className:"text-xs text-slate-400 mt-1 italic break-words",children:t.evidence})]})]})})}),Ue=({area:t,index:s,onNavigate:r,scenarios:a})=>{const m={hoch:{bg:"bg-red-100",text:"text-red-600",border:"border-red-500"},mittel:{bg:"bg-amber-100",text:"text-amber-600",border:"border-amber-500"},niedrig:{bg:"bg-blue-100",text:"text-blue-600",border:"border-blue-500"}},l=m[t.priority]||m.mittel,o=t.suggestedTrainings||[];return e.jsx(z.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:s*.1},children:e.jsx(v,{className:`p-4 border-l-4 ${l.border}`,children:e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.title}),e.jsx("span",{className:`text-[10px] font-medium px-2 py-0.5 rounded-full ${l.bg} ${l.text}`,children:t.priority})]}),e.jsx("p",{className:"text-xs text-slate-600 mt-1",children:t.description}),e.jsxs("div",{className:"mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Aktuell: "}),e.jsx("span",{className:"text-slate-600",children:t.currentState})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400",children:"Ziel: "}),e.jsx("span",{className:"text-green-600 font-medium",children:t.targetState})]})]}),o.length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-slate-100",children:[e.jsx("p",{className:"text-[10px] text-slate-400 uppercase tracking-wide mb-2",children:"Passende Trainings:"}),e.jsx("div",{className:"flex flex-col gap-1.5",children:o.slice(0,2).map((u,c)=>{const p=O[u.module]||W;return e.jsxs("button",{onClick:()=>r?.(u.module,u.scenario_id),className:"flex items-center gap-2 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 text-left w-full",children:[e.jsx(p,{size:14,className:"flex-shrink-0 text-slate-500"}),e.jsx("span",{className:"flex-1",children:u.title}),e.jsx(je,{size:14,className:"text-slate-400 flex-shrink-0"})]},c)})})]})]}),e.jsx(W,{size:20,className:l.text})]})})})},Ve=({rec:t,index:s,onNavigate:r})=>{const a=O[t.module]||W;return e.jsx(z.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:s*.1},children:e.jsx(v,{className:"p-4 hover:shadow-md transition-shadow",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0",children:e.jsx(a,{size:20,className:"text-primary"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"text-sm font-semibold text-slate-900",children:t.action}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:t.reason}),t.frequency&&e.jsxs("div",{className:"flex items-center gap-1 mt-2 text-xs text-slate-400",children:[e.jsx(Q,{size:12}),e.jsx("span",{children:t.frequency})]})]}),e.jsx($,{variant:"secondary",size:"sm",className:"flex-shrink-0",onClick:()=>r(t.module,t.scenario_id),children:e.jsx(ke,{size:14})})]})})})},He=({nextStep:t,onNavigate:s})=>{const r=O[t.module]||ye;return e.jsx(z.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{delay:.3},children:e.jsxs(v,{className:"p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5",onClick:()=>s(t.module,t.scenario_id),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(B,{size:20,className:"text-primary"}),e.jsx("span",{className:"text-xs font-semibold text-primary uppercase tracking-wide",children:"Nächster Schritt"})]}),e.jsx("h3",{className:"text-xl font-bold text-slate-900 mb-2",children:t.title}),e.jsx("p",{className:"text-sm text-slate-600 mb-4",children:t.description}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-500",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(r,{size:16}),e.jsx("span",{className:"capitalize",children:t.module?.replace("-"," ")})]}),t.estimatedTime&&e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(Q,{size:16}),e.jsx("span",{children:t.estimatedTime})]})]}),e.jsx($,{icon:e.jsx(Z,{size:16}),children:"Jetzt starten"})]})]})})},Je=({stats:t})=>{const s=[{label:"Gesamt Sessions",value:t.totalSessions,icon:X,color:x.indigo[500]},{label:"Ø Bewertung",value:t.averageScores?.Gesamt!=null?`${Math.round(t.averageScores.Gesamt)}%`:"—",icon:he,color:x.amber[500]},{label:"Trend (30 Tage)",value:t.recentTrend!=null?`${t.recentTrend>0?"+":""}${t.recentTrend.toFixed(1)}%`:"—",icon:ge,color:t.recentTrend>0?x.emerald[500]:x.red[500]},{label:"Letztes Training",value:t.daysSinceLastSession!=null&&t.daysSinceLastSession<999?t.daysSinceLastSession===0?"Heute":`Vor ${t.daysSinceLastSession}d`:"—",icon:xe,color:x.blue[500]}];return e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:s.map((r,a)=>e.jsx(z.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:a*.05},children:e.jsxs(v,{className:"p-4 text-center",children:[e.jsx(r.icon,{size:24,className:"mx-auto mb-2",style:{color:r.color}}),e.jsx("div",{className:"text-2xl font-bold text-slate-900",children:r.value}),e.jsx("div",{className:"text-xs text-slate-500",children:r.label})]})},r.label))})},at=({isAuthenticated:t,requireAuth:s,onNavigate:r})=>{const a=we(),{branding:m}=Se();m?.primaryAccent||x.indigo[500];const[l,o]=w.useState(!0),[u,c]=w.useState(!1),[p,f]=w.useState(null),[d,k]=w.useState(null),[F,j]=w.useState(!1),[S,R]=w.useState(H()),C=w.useCallback(async(g=!1,y=null)=>{if(!t){o(!1);return}try{g?c(!0):o(!0),f(null);const i=y??S??H(),n=await Re(i);k(n)}catch(i){console.error("[KiCoach] Failed to load coaching:",i),f("Fehler beim Laden der Coaching-Analyse")}finally{o(!1),c(!1)}},[t,S]);w.useEffect(()=>{C()},[C]),w.useEffect(()=>{if(t&&!l&&d&&!Le()){const g=setTimeout(()=>j(!0),500);return()=>clearTimeout(g)}},[t,l,d]);const L=g=>{R(g),j(!1),C(!0,g)},D=()=>{j(!1)},P=()=>{Ge(),R(null),j(!0)},E=(g,y)=>{const i=Me[g]||g;r&&r(i,y)};w.useEffect(()=>{!t&&s&&s()},[t,s]);const A=Ne(x.indigo[600],x.purple[500]);if(l)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:K,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs("div",{className:"text-center",children:[e.jsx(U,{size:48,className:"text-primary animate-spin mx-auto"}),e.jsx("p",{className:"text-slate-500 mt-4",children:"Analysiere deine Trainings..."})]})})]});if(!t)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:K,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(v,{className:"p-8 text-center max-w-md",children:[e.jsx(K,{size:48,className:"text-primary mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Anmeldung erforderlich"}),e.jsx("p",{className:"text-slate-600 mb-6",children:"Um deinen persönlichen KI-Coach zu nutzen, musst du angemeldet sein."}),e.jsx($,{onClick:s,children:"Anmelden"})]})})]});if(p&&!d)return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:K,gradient:A}),e.jsx("div",{className:"flex items-center justify-center min-h-[60vh]",children:e.jsxs(v,{className:"p-8 text-center max-w-md",children:[e.jsx(le,{size:48,className:"text-red-500 mx-auto mb-4"}),e.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-2",children:"Fehler beim Laden"}),e.jsx("p",{className:"text-slate-600 mb-6",children:p}),e.jsx($,{onClick:()=>C(),children:"Erneut versuchen"})]})})]});const{coaching:b,stats:G,sessions:I,scenarios:_}=d||{},T=S?te.find(g=>g.id===S):null;return e.jsxs("div",{className:"min-h-screen bg-slate-50",children:[e.jsx(oe,{children:F&&e.jsx(We,{onComplete:L,onSkip:D})}),e.jsx(M,{title:"KI-Coach",subtitle:"Dein persönlicher Karriere-Coach",icon:K,gradient:A,rightContent:e.jsxs($,{variant:"secondary",size:"sm",onClick:()=>C(!0),disabled:u,className:"bg-white/20 border-white/30 text-white hover:bg-white/30",children:[u?e.jsx(U,{size:16,className:"animate-spin"}):e.jsx(ce,{size:16}),e.jsx("span",{className:"ml-2 hidden sm:inline",children:"Aktualisieren"})]})}),e.jsx("div",{className:"bg-white border-b border-slate-200",children:e.jsx("div",{className:`${a?"px-4 py-3":"px-8 py-4"} max-w-6xl mx-auto`,children:e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-sm text-slate-500",children:"Mein Fokus:"}),T?e.jsxs("div",{className:"flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg",children:[e.jsx(T.icon,{size:16,style:{color:T.color}}),e.jsx("span",{className:"text-sm font-medium text-slate-700",children:T.title})]}):e.jsx("span",{className:"text-sm text-slate-400 italic",children:"Nicht festgelegt"})]}),e.jsxs("button",{onClick:P,className:"flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors",children:[e.jsx(de,{size:14}),e.jsx("span",{children:T?"Ändern":"Festlegen"})]})]})})}),e.jsx("div",{className:`${a?"p-4":"px-8 py-6"}`,children:e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("div",{className:`grid gap-6 ${a?"grid-cols-1":"grid-cols-3"}`,children:[e.jsx(v,{className:"p-6 flex items-center justify-center",children:b?.level&&e.jsx(Be,{level:b.level})}),e.jsxs("div",{className:`${a?"":"col-span-2"}`,children:[G&&e.jsx(Je,{stats:G}),b?.summary&&e.jsx(z.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.2},className:"mt-4",children:e.jsx(v,{className:"p-4 bg-gradient-to-r from-slate-50 to-slate-100",children:e.jsx("p",{className:"text-sm text-slate-700 leading-relaxed",children:b.summary})})})]})]}),b?.nextStep&&e.jsx(He,{nextStep:b.nextStep,onNavigate:E}),e.jsxs("div",{className:`grid gap-6 ${a?"grid-cols-1":"grid-cols-2"}`,children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(q,{size:20,className:"text-green-500"}),"Deine Stärken"]}),e.jsxs("div",{className:"space-y-3",children:[b?.strengths?.map((g,y)=>e.jsx(Oe,{strength:g,index:y},y)),(!b?.strengths||b.strengths.length===0)&&e.jsx(v,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Stärken identifiziert. Absolviere mehr Trainings!"})]})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(W,{size:20,className:"text-amber-500"}),"Fokus-Bereiche"]}),e.jsxs("div",{className:"space-y-3",children:[b?.focusAreas?.map((g,y)=>e.jsx(Ue,{area:g,index:y,onNavigate:E,scenarios:_},y)),(!b?.focusAreas||b.focusAreas.length===0)&&e.jsx(v,{className:"p-4 text-center text-slate-500 text-sm",children:"Noch keine Fokus-Bereiche identifiziert."})]})]})]}),b?.recommendations?.length>0&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(me,{size:20,className:"text-primary"}),"Empfehlungen für dich"]}),e.jsx("div",{className:`grid gap-4 ${a?"grid-cols-1":"grid-cols-2"}`,children:b.recommendations.map((g,y)=>e.jsx(Ve,{rec:g,index:y,onNavigate:E},y))})]}),I&&e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-bold text-slate-900 mb-4 flex items-center gap-2",children:[e.jsx(X,{size:20,className:"text-indigo-500"}),"Dein Fortschritt"]}),e.jsx(v,{className:"p-4",children:e.jsx(ze,{simulatorSessions:I.simulator,videoSessions:I.video,roleplaySessions:I.roleplay,gameSessions:I.games})})]}),b?.motivation&&e.jsxs(z.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.5},className:"text-center py-8",children:[e.jsx(B,{size:24,className:"text-primary mx-auto mb-3"}),e.jsxs("p",{className:"text-lg font-medium text-slate-700 italic",children:['"',b.motivation,'"']})]})]})})]})};export{at as KiCoachApp};
