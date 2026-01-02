/**
 * Ikigai Dimension Configuration
 *
 * Defines the four core dimensions of the Ikigai concept:
 * - Love (Leidenschaft) - What you love
 * - Talent (Stärken) - What you're good at
 * - Need (Mission) - What the world needs
 * - Market (Markt) - What you can be paid for
 *
 * Usage:
 *   import { DIMENSIONS } from '@/config/ikigaiDimensions';
 */

export const DIMENSIONS = {
  love: {
    key: 'love',
    label: 'Leidenschaft',
    title: 'Deine Leidenschaft',
    icon: '❤️',
    color: '#E11D48', // Rose-600
    question: 'Stell dir vor, Geld spielt keine Rolle: Womit würdest du deinen Tag verbringen? Bei welchem Thema vergisst du völlig die Zeit?',
    placeholder: 'Schreib einfach drauf los: Hobbys, Themen, Tätigkeiten...',
    description: 'Was treibt dich an?',
  },
  talent: {
    key: 'talent',
    label: 'Stärken',
    title: 'Deine Stärken',
    icon: '⭐',
    color: '#F59E0B', // Amber-500
    question: 'Wofür bitten dich Freunde oder Kollegen oft um Rat? Was erledigst du "mit links", während andere daran verzweifeln?',
    placeholder: 'Z.B. Organisieren, Zuhören, Coden, Designen...',
    description: 'Was fällt dir leicht?',
  },
  need: {
    key: 'need',
    label: 'Mission',
    title: 'Deine Mission',
    icon: '🌍',
    color: '#10B981', // Emerald-500
    question: 'Welches Problem in der Gesellschaft oder Wirtschaft nervt dich? Wo würdest du gerne mitanpacken, um Dinge zu verbessern?',
    placeholder: 'Z.B. Nachhaltigkeit, Bildung, bessere Software, Pflege...',
    description: 'Welchen Beitrag leistest du?',
  },
  market: {
    key: 'market',
    label: 'Markt',
    title: 'Der Markt',
    icon: '💰',
    color: '#6366F1', // Indigo-500
    question: 'Welche deiner Fähigkeiten sind bares Geld wert? Für welche Jobs oder Dienstleistungen existiert ein echtes Budget?',
    placeholder: 'Z.B. Projektmanagement, Beratung, Handwerk...',
    description: 'Wofür wirst du bezahlt?',
  },
};

/**
 * Get dimension keys in order
 */
export const DIMENSION_ORDER = ['love', 'talent', 'need', 'market'];

/**
 * Get all dimension colors as array
 */
export const DIMENSION_COLORS = Object.values(DIMENSIONS).map(d => d.color);

export default DIMENSIONS;
