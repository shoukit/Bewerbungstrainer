/**
 * Presentation Generator Service
 *
 * Transforms Smart Briefing content into professional PowerPoint presentations.
 * Uses Gemini AI for story structure generation and PptxGenJS for PPT creation.
 */

import PptxGenJS from 'pptxgenjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS } from '@/config/constants';
import wordpressAPI from './wordpress-api.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const SLIDE_COLORS = {
  primary: '4F46E5',      // Indigo
  primaryLight: 'EEF2FF', // Indigo-50
  dark: '1E293B',         // Slate-800
  text: '334155',         // Slate-700
  textLight: '64748B',    // Slate-500
  white: 'FFFFFF',
  accent: '7C3AED',       // Violet
  success: '059669',      // Emerald
  warning: 'D97706',      // Amber
};

// =============================================================================
// GEMINI INTEGRATION
// =============================================================================

/**
 * Get API key from WordPress config
 */
const getApiKey = () => {
  return wordpressAPI.getGeminiApiKey();
};

/**
 * Log prompt and response via WordPress API
 */
const logPromptAndResponse = async (prompt, response, metadata = {}) => {
  try {
    await wordpressAPI.request('/log-prompt', {
      method: 'POST',
      body: JSON.stringify({
        scenario: 'PRESENTATION_GENERATOR',
        description: 'Transformation von Smart Briefing zu PowerPoint-Präsentation',
        prompt: prompt,
        response: response,
        metadata: metadata,
      }),
    });
  } catch (err) {
    console.warn('[PresentationGen] Failed to log prompt:', err.message);
  }
};

/**
 * Generate presentation structure using Gemini
 */
const generatePresentationStructure = async (data) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key nicht konfiguriert');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Build input data string with full details
  const inputData = data.sections.map(section => {
    const itemsList = section.items.map(item => {
      let itemText = `- **${item.label}**`;
      if (item.content) itemText += `: ${item.content}`;
      if (item.userNote) itemText += `\n  → WICHTIG (Nutzer-Notiz): "${item.userNote}"`;
      return itemText;
    }).join('\n');

    return `### ${section.sectionTitle}\n${itemsList}`;
  }).join('\n\n');

  // Count items for context
  const totalItems = data.sections.reduce((acc, s) => acc + s.items.length, 0);

  const prompt = `Du bist ein erfahrener Präsentationsdesigner und Strategieberater.

## DEINE AUFGABE
Erstelle eine **vollständige, professionelle Präsentation** für folgenden Zweck:

**Präsentationsziel:** "${data.goal}"
**Briefing-Titel:** "${data.briefingTitle || 'Präsentation'}"

## WICHTIGE REGELN

### 1. DOKUMENTTYP VERSTEHEN
Analysiere das Präsentationsziel und füge ALLE Slides hinzu, die für diesen Präsentationstyp üblich und professionell sind - auch wenn sie nicht explizit im Input stehen!

Typische Slides je nach Präsentationstyp:
- **Kickoff/Projektstart:** Team-Vorstellung, Timeline/Meilensteine, Rollen & Verantwortlichkeiten, Spielregeln
- **Pitch/Präsentation:** Problem, Lösung, Markt, Geschäftsmodell, Team, Call-to-Action
- **Status-Update:** Fortschritt, Erfolge, Herausforderungen, Nächste Schritte
- **Workshop:** Agenda mit Zeiten, Ziele, Methodik, Erwartete Ergebnisse

### 2. INHALTE VOLLSTÄNDIG AUSARBEITEN
- ALLE ${totalItems} Punkte aus dem Input MÜSSEN in der Präsentation vorkommen
- Nicht nur Stichworte, sondern ausformulierte, verständliche Sätze
- Konkrete Details übernehmen (Zeitangaben, Namen, Zahlen!)
- Punkte mit Nutzer-Notizen (→ WICHTIG) besonders hervorheben
- Jeder Bullet sollte für sich alleine verständlich sein

### 3. PLATZHALTER FÜR FEHLENDE INFOS
Wenn eine wichtige Slide zum Dokumenttyp gehört, aber du den Inhalt nicht kennst, erstelle sie mit "[PLATZHALTER: ...]" Bullets.

Beispiel für Team-Slide:
"bullets": ["[PLATZHALTER: Projektleiter - Name & Rolle]", "[PLATZHALTER: Teammitglied 1]", ...]

### 4. PROFESSIONELLE STRUKTUR
- Beginne mit einer packenden Titelfolie
- Baue einen logischen roten Faden auf
- Nutze verschiedene Slide-Typen für Abwechslung
- Ende mit klarem Call-to-Action oder Zusammenfassung
- Ziel: 8-15 Slides für eine vollständige Präsentation

## BRIEFING-INHALTE (alle ${totalItems} Punkte müssen verwendet werden!)

${inputData}

## AUSGABEFORMAT (JSON)

Antworte NUR mit validem JSON:
{
  "title": "Präsentationstitel (kurz & prägnant)",
  "slides": [
    {
      "type": "title",
      "title": "Haupttitel",
      "subtitle": "Untertitel mit Datum/Anlass"
    },
    {
      "type": "agenda",
      "title": "Agenda",
      "items": [
        {"time": "5 Min", "topic": "Begrüßung & Einführung"},
        {"time": "15 Min", "topic": "Projektziele vorstellen"}
      ]
    },
    {
      "type": "content",
      "title": "Slide-Titel",
      "bullets": ["Ausformulierter Punkt 1", "Ausformulierter Punkt 2"]
    },
    {
      "type": "team",
      "title": "Das Team",
      "members": [
        {"role": "Projektleiter", "name": "[PLATZHALTER]", "responsibility": "Gesamtverantwortung"},
        {"role": "Entwicklung", "name": "[PLATZHALTER]", "responsibility": "Technische Umsetzung"}
      ]
    },
    {
      "type": "timeline",
      "title": "Meilensteine",
      "milestones": [
        {"date": "KW 2", "title": "Kickoff", "status": "current"},
        {"date": "KW 4", "title": "Anforderungen final", "status": "upcoming"},
        {"date": "KW 8", "title": "MVP fertig", "status": "upcoming"}
      ]
    },
    {
      "type": "quote",
      "quote": "Wichtige Kernbotschaft oder Motto",
      "source": "Optional"
    },
    {
      "type": "two_columns",
      "title": "Vergleich oder Gegenüberstellung",
      "left": {"heading": "Links", "bullets": ["Punkt 1", "Punkt 2"]},
      "right": {"heading": "Rechts", "bullets": ["Punkt A", "Punkt B"]}
    },
    {
      "type": "summary",
      "title": "Nächste Schritte",
      "bullets": ["Konkrete Aktion 1", "Konkrete Aktion 2"]
    }
  ]
}

## SLIDE-TYPEN

| Typ | Verwendung |
|-----|------------|
| title | Titelfolie (immer am Anfang) |
| agenda | Agenda mit Zeitangaben |
| content | Standard-Inhaltsfolie mit Bullets |
| team | Team-Vorstellung mit Rollen |
| timeline | Meilensteine/Projektplan |
| quote | Hervorgehobene Kernbotschaft |
| two_columns | Zwei-Spalten-Vergleich |
| summary | Zusammenfassung/Call-to-Action (am Ende) |

WICHTIG:
- Antworte NUR mit dem JSON, keine Erklärungen!
- Verwende verschiedene Slide-Typen für eine professionelle Präsentation!
- ALLE Input-Punkte müssen in der Präsentation erscheinen!`;

  // Try models in fallback order
  for (const modelName of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`[PresentationGen] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Log prompt and response
      await logPromptAndResponse(prompt, response, {
        model: modelName,
        briefingTitle: data.briefingTitle,
        goal: data.goal,
        sectionsCount: data.sections?.length,
        itemsCount: totalItems,
      });

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Struktur in der Antwort');
      }

      const structure = JSON.parse(jsonMatch[0]);
      console.log('[PresentationGen] Structure generated:', structure.slides?.length, 'slides');
      return structure;
    } catch (err) {
      console.warn(`[PresentationGen] Model ${modelName} failed:`, err.message);
      if (modelName === GEMINI_MODELS.FALLBACK_ORDER[GEMINI_MODELS.FALLBACK_ORDER.length - 1]) {
        throw err;
      }
    }
  }

  throw new Error('Alle Gemini-Modelle fehlgeschlagen');
};

// =============================================================================
// PPTX GENERATION
// =============================================================================

/**
 * Create PowerPoint from structure
 */
const createPowerPoint = (structure) => {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = 'Karriereheld';
  pptx.title = structure.title || 'Präsentation';
  pptx.subject = 'Generiert aus Smart Briefing';
  pptx.company = 'Karriereheld';

  // Define master slide layouts
  pptx.defineSlideMaster({
    title: 'TITLE_SLIDE',
    background: { color: SLIDE_COLORS.primary },
  });

  pptx.defineSlideMaster({
    title: 'CONTENT_SLIDE',
    background: { color: SLIDE_COLORS.white },
  });

  pptx.defineSlideMaster({
    title: 'QUOTE_SLIDE',
    background: { color: SLIDE_COLORS.primaryLight },
  });

  pptx.defineSlideMaster({
    title: 'ACCENT_SLIDE',
    background: { color: SLIDE_COLORS.dark },
  });

  // Generate slides
  structure.slides.forEach((slideData) => {
    switch (slideData.type) {
      case 'title':
        createTitleSlide(pptx, slideData);
        break;
      case 'agenda':
        createAgendaSlide(pptx, slideData);
        break;
      case 'content':
        createContentSlide(pptx, slideData);
        break;
      case 'team':
        createTeamSlide(pptx, slideData);
        break;
      case 'timeline':
        createTimelineSlide(pptx, slideData);
        break;
      case 'quote':
        createQuoteSlide(pptx, slideData);
        break;
      case 'two_columns':
        createTwoColumnsSlide(pptx, slideData);
        break;
      case 'summary':
        createSummarySlide(pptx, slideData);
        break;
      default:
        createContentSlide(pptx, slideData);
    }
  });

  return pptx;
};

/**
 * Create title slide
 */
const createTitleSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });

  // Main title
  slide.addText(data.title || 'Präsentation', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.5,
    fontSize: 44,
    fontFace: 'Arial',
    color: SLIDE_COLORS.white,
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  // Subtitle
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5,
      y: 3.8,
      w: 9,
      h: 0.8,
      fontSize: 22,
      fontFace: 'Arial',
      color: SLIDE_COLORS.white,
      align: 'center',
      valign: 'middle',
    });
  }
};

/**
 * Create agenda slide with time blocks
 */
const createAgendaSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.primary },
  });

  slide.addText(data.title || 'Agenda', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Agenda items with time
  if (data.items && data.items.length > 0) {
    const startY = 1.7;
    const rowHeight = 0.65;

    data.items.forEach((item, index) => {
      const y = startY + (index * rowHeight);

      // Time badge
      slide.addText(item.time || '', {
        x: 0.5, y, w: 1.2, h: 0.5,
        fontSize: 14, fontFace: 'Arial', color: SLIDE_COLORS.white,
        fill: { color: SLIDE_COLORS.primary },
        align: 'center', valign: 'middle',
        shape: 'roundRect',
      });

      // Topic
      slide.addText(item.topic || '', {
        x: 1.9, y, w: 7.5, h: 0.5,
        fontSize: 18, fontFace: 'Arial', color: SLIDE_COLORS.text,
        valign: 'middle',
      });
    });
  }
};

/**
 * Create content slide with bullets
 */
const createContentSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.primary },
  });

  slide.addText(data.title || 'Inhalt', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Bullet points
  if (data.bullets && data.bullets.length > 0) {
    const bulletItems = data.bullets.map(text => ({
      text: cleanMarkdown(text),
      options: {
        bullet: { type: 'bullet', color: SLIDE_COLORS.primary },
        fontSize: 18,
        color: SLIDE_COLORS.text,
        paraSpaceAfter: 14,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.7, y: 1.7, w: 8.6, h: 4.2,
      fontFace: 'Arial', valign: 'top',
    });
  }
};

/**
 * Create team slide
 */
const createTeamSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.accent },
  });

  slide.addText(data.title || 'Das Team', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Team members
  if (data.members && data.members.length > 0) {
    const cols = Math.min(data.members.length, 3);
    const colWidth = 9 / cols;
    const startY = 1.7;

    data.members.forEach((member, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 0.5 + (col * colWidth);
      const y = startY + (row * 1.8);

      // Role (bold)
      slide.addText(member.role || 'Rolle', {
        x, y, w: colWidth - 0.3, h: 0.4,
        fontSize: 16, fontFace: 'Arial', color: SLIDE_COLORS.primary,
        bold: true,
      });

      // Name
      slide.addText(member.name || '[Name]', {
        x, y: y + 0.4, w: colWidth - 0.3, h: 0.35,
        fontSize: 14, fontFace: 'Arial', color: SLIDE_COLORS.dark,
      });

      // Responsibility
      if (member.responsibility) {
        slide.addText(member.responsibility, {
          x, y: y + 0.75, w: colWidth - 0.3, h: 0.5,
          fontSize: 12, fontFace: 'Arial', color: SLIDE_COLORS.textLight,
        });
      }
    });
  }
};

/**
 * Create timeline/milestones slide
 */
const createTimelineSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.success },
  });

  slide.addText(data.title || 'Meilensteine', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Timeline
  if (data.milestones && data.milestones.length > 0) {
    const lineY = 3;
    const count = data.milestones.length;
    const spacing = 8 / Math.max(count - 1, 1);

    // Horizontal line
    slide.addShape('line', {
      x: 1, y: lineY, w: 8, h: 0,
      line: { color: SLIDE_COLORS.textLight, width: 2 },
    });

    data.milestones.forEach((milestone, index) => {
      const x = 1 + (index * spacing);
      const isCurrent = milestone.status === 'current';
      const dotColor = isCurrent ? SLIDE_COLORS.primary : SLIDE_COLORS.textLight;

      // Dot
      slide.addShape('ellipse', {
        x: x - 0.15, y: lineY - 0.15, w: 0.3, h: 0.3,
        fill: { color: dotColor },
      });

      // Date above
      slide.addText(milestone.date || '', {
        x: x - 0.6, y: lineY - 0.9, w: 1.2, h: 0.4,
        fontSize: 12, fontFace: 'Arial', color: SLIDE_COLORS.textLight,
        align: 'center',
      });

      // Title below
      slide.addText(milestone.title || '', {
        x: x - 0.8, y: lineY + 0.4, w: 1.6, h: 0.8,
        fontSize: 13, fontFace: 'Arial',
        color: isCurrent ? SLIDE_COLORS.primary : SLIDE_COLORS.text,
        bold: isCurrent,
        align: 'center',
      });
    });
  }
};

/**
 * Create quote/highlight slide
 */
const createQuoteSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'QUOTE_SLIDE' });

  // Large quote mark
  slide.addText('"', {
    x: 0.5, y: 1, w: 1, h: 1.5,
    fontSize: 120, fontFace: 'Georgia', color: SLIDE_COLORS.primary, bold: true,
  });

  // Quote text
  slide.addText(cleanMarkdown(data.quote || ''), {
    x: 1, y: 2.2, w: 8, h: 2.5,
    fontSize: 28, fontFace: 'Georgia', color: SLIDE_COLORS.dark,
    italic: true, align: 'center', valign: 'middle',
  });

  // Source
  if (data.source) {
    slide.addText(`— ${data.source}`, {
      x: 1, y: 4.8, w: 8, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: SLIDE_COLORS.textLight, align: 'center',
    });
  }
};

/**
 * Create two-column comparison slide
 */
const createTwoColumnsSlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.primary },
  });

  slide.addText(data.title || 'Vergleich', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Left column
  if (data.left) {
    slide.addText(data.left.heading || '', {
      x: 0.5, y: 1.6, w: 4.2, h: 0.5,
      fontSize: 20, fontFace: 'Arial', color: SLIDE_COLORS.primary, bold: true,
    });

    if (data.left.bullets) {
      const leftItems = data.left.bullets.map(text => ({
        text: cleanMarkdown(text),
        options: { bullet: { type: 'bullet' }, fontSize: 16, color: SLIDE_COLORS.text, paraSpaceAfter: 10 },
      }));
      slide.addText(leftItems, {
        x: 0.5, y: 2.2, w: 4.2, h: 3.5, fontFace: 'Arial', valign: 'top',
      });
    }
  }

  // Divider line
  slide.addShape('line', {
    x: 5, y: 1.6, w: 0, h: 4,
    line: { color: SLIDE_COLORS.textLight, width: 1 },
  });

  // Right column
  if (data.right) {
    slide.addText(data.right.heading || '', {
      x: 5.3, y: 1.6, w: 4.2, h: 0.5,
      fontSize: 20, fontFace: 'Arial', color: SLIDE_COLORS.accent, bold: true,
    });

    if (data.right.bullets) {
      const rightItems = data.right.bullets.map(text => ({
        text: cleanMarkdown(text),
        options: { bullet: { type: 'bullet' }, fontSize: 16, color: SLIDE_COLORS.text, paraSpaceAfter: 10 },
      }));
      slide.addText(rightItems, {
        x: 5.3, y: 2.2, w: 4.2, h: 3.5, fontFace: 'Arial', valign: 'top',
      });
    }
  }
};

/**
 * Create summary/closing slide
 */
const createSummarySlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar with accent color
  slide.addShape('rect', {
    x: 0, y: 0, w: 10, h: 1.3,
    fill: { color: SLIDE_COLORS.accent },
  });

  slide.addText(data.title || 'Zusammenfassung', {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontSize: 28, fontFace: 'Arial', color: SLIDE_COLORS.white, bold: true,
  });

  // Bullet points with checkmarks - proper formatting with line breaks
  if (data.bullets && data.bullets.length > 0) {
    const bulletItems = data.bullets.map(text => ({
      text: cleanMarkdown(text),
      options: {
        bullet: { code: '2713', color: SLIDE_COLORS.success }, // ✓ checkmark
        fontSize: 18,
        color: SLIDE_COLORS.dark,
        paraSpaceAfter: 18,
        indentLevel: 0,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.7, y: 1.8, w: 8.6, h: 4,
      fontFace: 'Arial', valign: 'top',
    });
  }
};

/**
 * Clean markdown formatting from text (remove ** etc.)
 */
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')  // Remove bold **
    .replace(/\*/g, '')    // Remove italic *
    .replace(/__/g, '')    // Remove bold __
    .replace(/_/g, ' ')    // Replace underscores
    .trim();
};

// =============================================================================
// TWO-STEP GENERATION PROCESS
// =============================================================================

/**
 * Step 1: Generate structure proposal (quick, lightweight)
 * Returns only slide outline for user review
 */
export const generateStructureProposal = async (data) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key nicht konfiguriert');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Build concise input data (just labels, no full content)
  const inputSummary = data.sections.map(section => {
    const labels = section.items.map(item => `- ${item.label}`).join('\n');
    return `### ${section.sectionTitle}\n${labels}`;
  }).join('\n\n');

  const totalItems = data.sections.reduce((acc, s) => acc + s.items.length, 0);

  const prompt = `Du bist ein Präsentationsdesigner. Erstelle eine Slide-Struktur für folgende Präsentation:

**Ziel:** "${data.goal}"
**Briefing:** "${data.briefingTitle || 'Präsentation'}"

**Inhalte (${totalItems} Punkte):**
${inputSummary}

AUFGABE: Erstelle NUR die Slide-Struktur (Titel + Typ), KEINE Inhalte!

Dokumenttyp-spezifische Slides hinzufügen:
- Kickoff: Team, Timeline, Spielregeln
- Pitch: Problem, Lösung, Team, Call-to-Action
- Status: Fortschritt, Herausforderungen, Nächste Schritte
- Workshop: Agenda mit Zeiten, Methodik

AUSGABE (nur JSON):
{
  "title": "Präsentationstitel",
  "slides": [
    {"type": "title", "title": "Titelfolie", "description": "Einführung mit Datum/Anlass"},
    {"type": "agenda", "title": "Agenda", "description": "Zeitplan mit 6 Punkten"},
    {"type": "content", "title": "Projektziele", "description": "4 Hauptziele des Projekts"},
    {"type": "team", "title": "Das Team", "description": "Rollen & Verantwortlichkeiten"},
    {"type": "timeline", "title": "Meilensteine", "description": "6 wichtige Termine"},
    {"type": "summary", "title": "Nächste Schritte", "description": "Call-to-Action"}
  ]
}

Slide-Typen: title, agenda, content, team, timeline, quote, two_columns, summary

Antworte NUR mit JSON!`;

  // Try models in fallback order
  for (const modelName of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`[PresentationGen] Structure proposal with: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Log
      await logPromptAndResponse(prompt, response, {
        model: modelName,
        step: 'structure_proposal',
      });

      // Parse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Struktur');
      }

      const structure = JSON.parse(jsonMatch[0]);
      console.log('[PresentationGen] Structure proposal:', structure.slides?.length, 'slides');
      return structure;
    } catch (err) {
      console.warn(`[PresentationGen] Model ${modelName} failed:`, err.message);
      if (modelName === GEMINI_MODELS.FALLBACK_ORDER[GEMINI_MODELS.FALLBACK_ORDER.length - 1]) {
        throw err;
      }
    }
  }

  throw new Error('Struktur-Generierung fehlgeschlagen');
};

/**
 * Step 2: Generate full presentation from approved structure
 * Takes the user-approved slide structure and fills it with content
 */
export const generateFromApprovedStructure = async (data, approvedStructure) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key nicht konfiguriert');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Build full input data
  const inputData = data.sections.map(section => {
    const itemsList = section.items.map(item => {
      let itemText = `- **${item.label}**`;
      if (item.content) itemText += `: ${item.content}`;
      if (item.userNote) itemText += `\n  → WICHTIG (Nutzer-Notiz): "${item.userNote}"`;
      return itemText;
    }).join('\n');
    return `### ${section.sectionTitle}\n${itemsList}`;
  }).join('\n\n');

  const slideStructure = approvedStructure.slides.map((s, i) =>
    `${i + 1}. [${s.type}] ${s.title}`
  ).join('\n');

  const prompt = `Du bist ein Präsentationsdesigner. Fülle diese genehmigte Struktur mit vollständigen Inhalten.

**Präsentation:** "${approvedStructure.title}"
**Ziel:** "${data.goal}"

## GENEHMIGTE SLIDE-STRUKTUR (NICHT ÄNDERN!)
${slideStructure}

## BRIEFING-INHALTE (alle Punkte verwenden!)
${inputData}

AUFGABE:
1. Fülle JEDE Slide mit vollständigen, ausformulierten Inhalten
2. ALLE Punkte aus dem Briefing müssen vorkommen
3. Nutzer-Notizen (→ WICHTIG) besonders betonen
4. Platzhalter "[PLATZHALTER: ...]" für fehlende Infos

AUSGABE: Vollständiges JSON mit allen Slide-Details.

Beispiel pro Slide-Typ:
- title: {"type":"title","title":"...","subtitle":"..."}
- agenda: {"type":"agenda","title":"...","items":[{"time":"5 Min","topic":"..."}]}
- content: {"type":"content","title":"...","bullets":["...","..."]}
- team: {"type":"team","title":"...","members":[{"role":"...","name":"...","responsibility":"..."}]}
- timeline: {"type":"timeline","title":"...","milestones":[{"date":"...","title":"...","status":"current/upcoming"}]}
- quote: {"type":"quote","quote":"...","source":"..."}
- two_columns: {"type":"two_columns","title":"...","left":{"heading":"...","bullets":[]},"right":{"heading":"...","bullets":[]}}
- summary: {"type":"summary","title":"...","bullets":["..."]}

Antworte NUR mit JSON!`;

  // Try models
  for (const modelName of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`[PresentationGen] Full content with: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      await logPromptAndResponse(prompt, response, {
        model: modelName,
        step: 'full_content',
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Keine gültige JSON-Struktur');
      }

      const fullStructure = JSON.parse(jsonMatch[0]);
      console.log('[PresentationGen] Full content generated');

      // Create and download PowerPoint
      const pptx = createPowerPoint(fullStructure);
      const sanitizedTitle = (fullStructure.title || 'Praesentation')
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      const filename = `${sanitizedTitle}.pptx`;

      await pptx.writeFile({ fileName: filename });
      return { success: true, filename };
    } catch (err) {
      console.warn(`[PresentationGen] Model ${modelName} failed:`, err.message);
      if (modelName === GEMINI_MODELS.FALLBACK_ORDER[GEMINI_MODELS.FALLBACK_ORDER.length - 1]) {
        throw err;
      }
    }
  }

  throw new Error('Content-Generierung fehlgeschlagen');
};

// =============================================================================
// LEGACY: SINGLE-STEP GENERATION (kept for backwards compatibility)
// =============================================================================

/**
 * Generate presentation from briefing data (single step - legacy)
 * @param {Object} data - Selected items and presentation goal
 * @param {string} data.goal - Presentation goal/audience
 * @param {string} data.briefingTitle - Original briefing title
 * @param {Array} data.sections - Selected sections with items
 */
export const generatePresentationFromBriefing = async (data) => {
  console.log('[PresentationGen] Starting single-step generation...', data);

  // 1. Generate structure with Gemini
  console.log('[PresentationGen] Calling Gemini for structure...');
  const structure = await generatePresentationStructure(data);

  // 2. Create PowerPoint
  console.log('[PresentationGen] Creating PowerPoint...');
  const pptx = createPowerPoint(structure);

  // 3. Generate filename
  const sanitizedTitle = (structure.title || 'Praesentation')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const filename = `${sanitizedTitle}.pptx`;

  // 4. Download
  console.log('[PresentationGen] Downloading:', filename);
  await pptx.writeFile({ fileName: filename });

  console.log('[PresentationGen] Done!');
  return { success: true, filename };
};

export default {
  generatePresentationFromBriefing,
  generateStructureProposal,
  generateFromApprovedStructure,
};
