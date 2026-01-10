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
};

// =============================================================================
// GEMINI INTEGRATION
// =============================================================================

/**
 * Get API key from WordPress settings
 */
const getApiKey = async () => {
  try {
    const settings = await wordpressAPI.request('/settings');
    return settings?.gemini_api_key || import.meta.env.VITE_GEMINI_API_KEY || '';
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
};

/**
 * Generate presentation structure using Gemini
 */
const generatePresentationStructure = async (data) => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key nicht konfiguriert');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Build input data string
  const inputData = data.sections.map(section => {
    const itemsList = section.items.map(item => {
      let itemText = `- ${item.label}`;
      if (item.content) itemText += `: ${item.content}`;
      if (item.userNote) itemText += `\n  [Nutzer-Notiz: "${item.userNote}"]`;
      return itemText;
    }).join('\n');

    return `## ${section.sectionTitle}\n${itemsList}`;
  }).join('\n\n');

  const prompt = `Du bist ein Experte für Präsentationsdesign und Storytelling. Transformiere die folgenden Briefing-Punkte in eine überzeugende Präsentationsstruktur.

## KONTEXT
- Briefing-Titel: "${data.briefingTitle || 'Smart Briefing'}"
- Präsentationsziel: "${data.goal}"

## BRIEFING-INHALTE (vom Nutzer ausgewählt)
${inputData}

## DEINE AUFGABE
Erstelle eine Präsentation mit 5-8 Slides, die:
1. Eine klare Story mit rotem Faden erzählt
2. Die wichtigsten Punkte hervorhebt (besonders jene mit Nutzer-Notizen!)
3. Minimalistisch ist (wenig Text pro Slide, max 4-5 Bullet Points)
4. Zum angegebenen Präsentationsziel passt

## AUSGABEFORMAT (JSON)
Antworte NUR mit validem JSON in diesem Format:
{
  "title": "Präsentationstitel",
  "slides": [
    {
      "type": "title",
      "title": "Haupttitel",
      "subtitle": "Untertitel oder Anlass"
    },
    {
      "type": "content",
      "title": "Slide-Titel",
      "bullets": ["Punkt 1", "Punkt 2", "Punkt 3"]
    },
    {
      "type": "quote",
      "quote": "Wichtige Aussage oder Kernbotschaft",
      "source": "Optional: Quelle"
    },
    {
      "type": "summary",
      "title": "Zusammenfassung",
      "bullets": ["Takeaway 1", "Takeaway 2"]
    }
  ]
}

Slide-Typen:
- "title": Titelfolie (nur am Anfang)
- "content": Normale Inhaltsfolie mit Bullets
- "quote": Hervorgehobenes Zitat/Kernbotschaft (sparsam verwenden)
- "summary": Zusammenfassung/Call-to-Action (am Ende)

WICHTIG: Antworte NUR mit dem JSON, keine Erklärungen davor oder danach!`;

  // Try models in fallback order
  for (const modelName of GEMINI_MODELS.FALLBACK_ORDER) {
    try {
      console.log(`[PresentationGen] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

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

  // Generate slides
  structure.slides.forEach((slideData, index) => {
    switch (slideData.type) {
      case 'title':
        createTitleSlide(pptx, slideData);
        break;
      case 'content':
        createContentSlide(pptx, slideData);
        break;
      case 'quote':
        createQuoteSlide(pptx, slideData);
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
    y: 2.5,
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
      y: 4,
      w: 9,
      h: 0.8,
      fontSize: 20,
      fontFace: 'Arial',
      color: SLIDE_COLORS.white,
      align: 'center',
      valign: 'middle',
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
    x: 0,
    y: 0,
    w: 10,
    h: 1.3,
    fill: { color: SLIDE_COLORS.primary },
  });

  // Title text
  slide.addText(data.title || 'Inhalt', {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.6,
    fontSize: 28,
    fontFace: 'Arial',
    color: SLIDE_COLORS.white,
    bold: true,
  });

  // Bullet points
  if (data.bullets && data.bullets.length > 0) {
    const bulletItems = data.bullets.map(text => ({
      text,
      options: {
        bullet: { type: 'bullet', color: SLIDE_COLORS.primary },
        fontSize: 18,
        color: SLIDE_COLORS.text,
        paraSpaceAfter: 12,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.7,
      y: 1.8,
      w: 8.6,
      h: 4,
      fontFace: 'Arial',
      valign: 'top',
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
    x: 0.5,
    y: 1,
    w: 1,
    h: 1.5,
    fontSize: 120,
    fontFace: 'Georgia',
    color: SLIDE_COLORS.primary,
    bold: true,
  });

  // Quote text
  slide.addText(data.quote || '', {
    x: 1,
    y: 2.2,
    w: 8,
    h: 2.5,
    fontSize: 28,
    fontFace: 'Georgia',
    color: SLIDE_COLORS.dark,
    italic: true,
    align: 'center',
    valign: 'middle',
  });

  // Source (if provided)
  if (data.source) {
    slide.addText(`— ${data.source}`, {
      x: 1,
      y: 4.8,
      w: 8,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Arial',
      color: SLIDE_COLORS.textLight,
      align: 'center',
    });
  }
};

/**
 * Create summary/closing slide
 */
const createSummarySlide = (pptx, data) => {
  const slide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });

  // Title bar with accent color
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 10,
    h: 1.3,
    fill: { color: SLIDE_COLORS.accent },
  });

  // Title text
  slide.addText(data.title || 'Zusammenfassung', {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.6,
    fontSize: 28,
    fontFace: 'Arial',
    color: SLIDE_COLORS.white,
    bold: true,
  });

  // Bullet points with checkmarks
  if (data.bullets && data.bullets.length > 0) {
    const bulletItems = data.bullets.map(text => ({
      text: `✓  ${text}`,
      options: {
        fontSize: 20,
        color: SLIDE_COLORS.dark,
        paraSpaceAfter: 16,
        bold: true,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.7,
      y: 1.8,
      w: 8.6,
      h: 4,
      fontFace: 'Arial',
      valign: 'top',
    });
  }
};

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

/**
 * Generate presentation from briefing data
 * @param {Object} data - Selected items and presentation goal
 * @param {string} data.goal - Presentation goal/audience
 * @param {string} data.briefingTitle - Original briefing title
 * @param {Array} data.sections - Selected sections with items
 */
export const generatePresentationFromBriefing = async (data) => {
  console.log('[PresentationGen] Starting generation...', data);

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
};
