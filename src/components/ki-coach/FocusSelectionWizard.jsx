/**
 * FocusSelectionWizard - First-time user focus selection
 *
 * Asks users about their training focus (Sales, Job Interview, Leadership, etc.)
 * to personalize scenario recommendations.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  Target,
  MessageSquare,
  Presentation,
  Handshake,
  GraduationCap,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { COLORS } from '@/config/colors';

// Focus categories with their scenarios
export const FOCUS_CATEGORIES = [
  {
    id: 'bewerbung',
    title: 'Bewerbung & Karriere',
    description: 'Vorstellungsgespräche, Gehaltsverhandlungen, Selbstpräsentation',
    icon: Briefcase,
    color: COLORS.indigo[500],
    keywords: ['bewerbung', 'vorstellung', 'interview', 'karriere', 'gehalt', 'job'],
  },
  {
    id: 'vertrieb',
    title: 'Vertrieb & Verkauf',
    description: 'Kundengespräche, Verkaufspräsentationen, Einwandbehandlung',
    icon: Handshake,
    color: COLORS.emerald[500],
    keywords: ['vertrieb', 'verkauf', 'kunde', 'sales', 'akquise', 'pitch'],
  },
  {
    id: 'fuehrung',
    title: 'Führung & Management',
    description: 'Mitarbeitergespräche, Feedback geben, Konfliktlösung',
    icon: Users,
    color: COLORS.purple[500],
    keywords: ['führung', 'management', 'mitarbeiter', 'feedback', 'team', 'konflikt'],
  },
  {
    id: 'kommunikation',
    title: 'Allgemeine Kommunikation',
    description: 'Rhetorik, Präsentationen, überzeugendes Sprechen',
    icon: MessageSquare,
    color: COLORS.amber[500],
    keywords: ['kommunikation', 'rhetorik', 'präsentation', 'sprechen', 'vortrag'],
  },
];

const FocusCategoryCard = ({ category, isSelected, onSelect }) => {
  const Icon = category.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`p-5 cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-offset-2 shadow-lg'
            : 'hover:shadow-md border-slate-200'
        }`}
        style={{
          borderColor: isSelected ? category.color : undefined,
          ringColor: isSelected ? category.color : undefined,
        }}
        onClick={() => onSelect(category.id)}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <Icon size={24} style={{ color: category.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{category.title}</h3>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <Check size={12} className="text-white" />
                </motion.div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{category.description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const FocusSelectionWizard = ({ onComplete, onSkip }) => {
  const [selectedFocus, setSelectedFocus] = useState(null);
  const [step, setStep] = useState(1);

  const handleContinue = () => {
    if (selectedFocus) {
      // Save to localStorage
      localStorage.setItem('kicoach_user_focus', selectedFocus);
      localStorage.setItem('kicoach_focus_selected', 'true');
      onComplete(selectedFocus);
    }
  };

  const handleSkip = () => {
    // Mark as skipped but don't set a focus
    localStorage.setItem('kicoach_focus_selected', 'true');
    onSkip?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-6 md:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Willkommen bei deinem KI-Coach!
            </h2>
            <p className="text-slate-600">
              Um dir die besten Trainings zu empfehlen, verrate uns kurz deinen Fokus.
            </p>
          </div>

          {/* Focus Categories */}
          <div className="grid gap-3 mb-8">
            {FOCUS_CATEGORIES.map((category) => (
              <FocusCategoryCard
                key={category.id}
                category={category}
                isSelected={selectedFocus === category.id}
                onSelect={setSelectedFocus}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Überspringen
            </button>
            <Button
              onClick={handleContinue}
              disabled={!selectedFocus}
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Weiter
            </Button>
          </div>

          {/* Info text */}
          <p className="text-xs text-slate-400 text-center mt-4">
            Du kannst deinen Fokus jederzeit in den Einstellungen ändern.
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
};

/**
 * Check if user has selected a focus
 */
export const hasSelectedFocus = () => {
  return localStorage.getItem('kicoach_focus_selected') === 'true';
};

/**
 * Get user's selected focus
 */
export const getUserFocus = () => {
  return localStorage.getItem('kicoach_user_focus');
};

/**
 * Clear user's focus selection (for settings)
 */
export const clearUserFocus = () => {
  localStorage.removeItem('kicoach_user_focus');
  localStorage.removeItem('kicoach_focus_selected');
};

/**
 * Check if a scenario matches user's focus
 */
export const scenarioMatchesFocus = (scenario, userFocus) => {
  if (!userFocus) return true; // No focus = show all

  const focusCategory = FOCUS_CATEGORIES.find(f => f.id === userFocus);
  if (!focusCategory) return true;

  const scenarioText = [
    scenario.title || '',
    scenario.description || '',
    scenario.category || '',
    ...(scenario.tags || []),
  ].join(' ').toLowerCase();

  return focusCategory.keywords.some(keyword => scenarioText.includes(keyword));
};

export default FocusSelectionWizard;
