/**
 * CreateTemplateDialog Component
 *
 * A dialog for creating and editing custom Smart Briefing templates.
 * Features:
 * - User-friendly variable builder for defining form fields
 * - Structured prompt editor (ai_role, sections, ai_behavior)
 * - Usecase presets (Sales, Career, Application, etc.)
 * - Variable insertion via dropdown
 * - Live preview before saving
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  FileText,
  Briefcase,
  Banknote,
  Users,
  Target,
  Lightbulb,
  Star,
  Shield,
  Compass,
  Rocket,
  MessageCircle,
  Award,
  Book,
  ClipboardList,
  User,
  HelpCircle,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Available icons for templates
 */
const AVAILABLE_ICONS = [
  { key: 'file-text', icon: FileText, label: 'Dokument' },
  { key: 'briefcase', icon: Briefcase, label: 'Koffer' },
  { key: 'banknote', icon: Banknote, label: 'Geld' },
  { key: 'users', icon: Users, label: 'Team' },
  { key: 'user', icon: User, label: 'Person' },
  { key: 'target', icon: Target, label: 'Ziel' },
  { key: 'lightbulb', icon: Lightbulb, label: 'Idee' },
  { key: 'star', icon: Star, label: 'Stern' },
  { key: 'shield', icon: Shield, label: 'Schutz' },
  { key: 'compass', icon: Compass, label: 'Kompass' },
  { key: 'rocket', icon: Rocket, label: 'Rakete' },
  { key: 'message-circle', icon: MessageCircle, label: 'Nachricht' },
  { key: 'award', icon: Award, label: 'Auszeichnung' },
  { key: 'book', icon: Book, label: 'Buch' },
  { key: 'clipboard', icon: ClipboardList, label: 'Checkliste' },
];

/**
 * Variable types
 */
const VARIABLE_TYPES = [
  { value: 'text', label: 'Einzeiliges Textfeld' },
  { value: 'textarea', label: 'Mehrzeiliges Textfeld' },
  { value: 'select', label: 'Dropdown-Auswahl' },
];

/**
 * Usecase Presets with pre-filled prompt structures
 */
const USECASE_PRESETS = [
  {
    key: 'empty',
    label: '--- Vorlage wählen ---',
    icon: FileText,
    aiRole: '',
    sections: [],
    aiBehavior: '',
  },
  {
    key: 'sales',
    label: '🎯 Sales / Kundengespräch',
    icon: Target,
    aiRole: 'Du bist ein erfahrener Sales-Coach und Vertriebsexperte mit 15+ Jahren Erfahrung im B2B-Vertrieb.',
    sections: [
      { id: 'hook', title: 'The Hook 🪝', instruction: 'Erstelle einen packenden Gesprächseinstieg für ${customer_type} Kunden' },
      { id: 'discovery', title: 'Discovery Questions 🔍', instruction: 'Formuliere 5-7 offene Fragen um Bedarf zu wecken und Pain Points zu identifizieren' },
      { id: 'value', title: 'Value Proposition 💎', instruction: 'Beschreibe den Mehrwert basierend auf ${product_service}' },
      { id: 'objections', title: 'Einwandbehandlung 🛡️', instruction: 'Liste typische Einwände und passende Antworten' },
      { id: 'closing', title: 'Closing Path 🎯', instruction: 'Entwickle einen Weg zum Ziel: ${meeting_goal}' },
    ],
    aiBehavior: 'Schreibe praxisnah und actionable. Jeder Punkt soll direkt umsetzbar sein. Vermeide Theorie - fokussiere auf konkrete Formulierungen und Techniken.',
  },
  {
    key: 'career',
    label: '💼 Karriere / Vorstellungsgespräch',
    icon: Briefcase,
    aiRole: 'Du bist ein erfahrener Karriere-Coach und HR-Experte mit umfassender Erfahrung in Bewerbungsprozessen.',
    sections: [
      { id: 'company', title: 'Unternehmens-Insights 🏢', instruction: 'Recherchiere wichtige Fakten über ${unternehmen} die im Gespräch relevant sind' },
      { id: 'position', title: 'Positions-Analyse 📋', instruction: 'Analysiere die Anforderungen für ${position} und wie der Kandidat diese erfüllt' },
      { id: 'questions', title: 'Typische Fragen ❓', instruction: 'Liste die 10 wahrscheinlichsten Interviewfragen mit Antwortstrategien' },
      { id: 'stories', title: 'STAR-Stories ⭐', instruction: 'Entwickle 3-5 Erfolgsgeschichten nach der STAR-Methode' },
      { id: 'questions_to_ask', title: 'Eigene Fragen 🙋', instruction: 'Formuliere 5-7 kluge Rückfragen an den Interviewer' },
    ],
    aiBehavior: 'Sei konkret und praxisorientiert. Gib Formulierungsvorschläge die direkt verwendet werden können. Berücksichtige deutsche Geschäftskultur.',
  },
  {
    key: 'negotiation',
    label: '💰 Gehaltsverhandlung',
    icon: Banknote,
    aiRole: 'Du bist ein Experte für Gehaltsverhandlungen und Karriereentwicklung.',
    sections: [
      { id: 'market', title: 'Marktanalyse 📊', instruction: 'Analysiere Gehaltsspannen für ${position} in ${branche} und ${region}' },
      { id: 'arguments', title: 'Argumente 💪', instruction: 'Entwickle 5-7 überzeugende Argumente für eine Gehaltserhöhung basierend auf ${erfolge}' },
      { id: 'counter', title: 'Konterstrategien 🛡️', instruction: 'Bereite Antworten auf typische Gegenargumente des Arbeitgebers vor' },
      { id: 'tactics', title: 'Verhandlungstaktiken 🎯', instruction: 'Beschreibe bewährte Taktiken für die Gehaltsverhandlung' },
      { id: 'alternatives', title: 'Alternativen 🔄', instruction: 'Liste nicht-monetäre Benefits die verhandelbar sind' },
    ],
    aiBehavior: 'Fokussiere auf konkrete Zahlen und Formulierungen. Sei selbstbewusst aber nicht arrogant im Ton.',
  },
  {
    key: 'presentation',
    label: '🎤 Präsentation / Pitch',
    icon: Rocket,
    aiRole: 'Du bist ein Präsentations-Coach und Storytelling-Experte.',
    sections: [
      { id: 'hook', title: 'Eröffnung 🎬', instruction: 'Erstelle einen aufmerksamkeitsstarken Einstieg für ${thema}' },
      { id: 'problem', title: 'Problem/Herausforderung ⚡', instruction: 'Beschreibe das Problem das ${zielgruppe} hat' },
      { id: 'solution', title: 'Lösung/Angebot 💡', instruction: 'Präsentiere die Lösung klar und überzeugend' },
      { id: 'proof', title: 'Beweise/Beispiele 📈', instruction: 'Liste Erfolgsbeispiele, Zahlen und Social Proof' },
      { id: 'cta', title: 'Call-to-Action 🎯', instruction: 'Formuliere einen klaren nächsten Schritt' },
    ],
    aiBehavior: 'Schreibe in aktivem, energetischem Stil. Jeder Abschnitt soll eine klare Botschaft haben. Nutze Storytelling-Elemente.',
  },
  {
    key: 'feedback',
    label: '💬 Feedback-Gespräch',
    icon: MessageCircle,
    aiRole: 'Du bist ein erfahrener Leadership-Coach und Experte für Mitarbeiterführung.',
    sections: [
      { id: 'context', title: 'Gesprächsrahmen 📋', instruction: 'Bereite den Rahmen für das Feedback-Gespräch mit ${mitarbeiter_name} vor' },
      { id: 'positive', title: 'Stärken & Erfolge ⭐', instruction: 'Liste konkrete positive Beobachtungen und Erfolge' },
      { id: 'development', title: 'Entwicklungsfelder 🌱', instruction: 'Beschreibe Verbesserungspotenziale konstruktiv' },
      { id: 'goals', title: 'Zielvereinbarung 🎯', instruction: 'Formuliere SMART-Ziele für die nächste Periode' },
      { id: 'support', title: 'Unterstützungsangebote 🤝', instruction: 'Liste mögliche Unterstützungsmaßnahmen' },
    ],
    aiBehavior: 'Schreibe wertschätzend und konstruktiv. Fokussiere auf Verhalten, nicht auf Persönlichkeit. Nutze die SBI-Methode (Situation-Behavior-Impact).',
  },
];

/**
 * Generate a unique ID
 */
const generateId = () => `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Default empty variable
 */
const createEmptyVariable = () => ({
  id: generateId(),
  key: '',
  label: '',
  type: 'text',
  required: true,
  placeholder: '',
  options: [],
});

/**
 * Default empty option for select
 */
const createEmptyOption = () => ({
  id: generateId(),
  value: '',
  label: '',
});

/**
 * Default empty section
 */
const createEmptySection = () => ({
  id: generateId(),
  title: '',
  instruction: '',
});

/**
 * Variable Item Component
 */
const VariableItem = ({
  variable,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localLabel, setLocalLabel] = useState(variable.label);

  useEffect(() => {
    setLocalLabel(variable.label);
  }, [variable.label]);

  const handleChange = (field, value) => {
    onChange({ ...variable, [field]: value });
  };

  const handleAddOption = () => {
    const newOptions = [...(variable.options || []), createEmptyOption()];
    onChange({ ...variable, options: newOptions });
  };

  const handleOptionChange = (optionId, field, value) => {
    const newOptions = variable.options.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    );
    onChange({ ...variable, options: newOptions });
  };

  const handleDeleteOption = (optionId) => {
    const newOptions = variable.options.filter(opt => opt.id !== optionId);
    onChange({ ...variable, options: newOptions });
  };

  const generateKeyFromLabel = (label) => {
    return label
      .toLowerCase()
      .replace(/[äöüß]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match]))
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleLabelBlur = () => {
    if (localLabel !== variable.label) {
      const updates = { label: localLabel };
      if (!variable.key || variable.key === generateKeyFromLabel(variable.label)) {
        updates.key = generateKeyFromLabel(localLabel);
      }
      onChange({ ...variable, ...updates });
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 mb-3 overflow-hidden">
      <div
        className={`flex items-center gap-2 px-4 py-3 bg-white cursor-pointer ${
          isExpanded ? 'border-b border-slate-200' : ''
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical size={16} className="text-slate-400 cursor-grab" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-slate-900 text-sm">
            {variable.label || `Variable ${index + 1}`}
          </span>
          {variable.key && (
            <span className="ml-2 text-slate-500 text-xs">
              ${'{'}${variable.key}{'}'}
            </span>
          )}
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
          {VARIABLE_TYPES.find(t => t.value === variable.type)?.label || variable.type}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className={`p-1 border-none bg-transparent ${
              index === 0 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
            }`}
          >
            <ChevronUp size={16} className="text-slate-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === total - 1}
            className={`p-1 border-none bg-transparent ${
              index === total - 1 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
            }`}
          >
            <ChevronDown size={16} className="text-slate-500" />
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 border-none bg-transparent cursor-pointer text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Feldbezeichnung *
                  </label>
                  <input
                    type="text"
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    onBlur={handleLabelBlur}
                    placeholder="z.B. Unternehmen"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Variablenname *
                  </label>
                  <input
                    type="text"
                    value={variable.key}
                    onChange={(e) => handleChange('key', e.target.value)}
                    placeholder="z.B. unternehmen"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Feldtyp
                  </label>
                  <select
                    value={variable.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {VARIABLE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => handleChange('required', e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-slate-600">Pflichtfeld</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Platzhalter-Text (optional)
                </label>
                <input
                  type="text"
                  value={variable.placeholder}
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                  placeholder="z.B. BMW AG, Siemens, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              {variable.type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Auswahloptionen
                  </label>
                  <div className="flex flex-col gap-2">
                    {(variable.options || []).map((option) => (
                      <div key={option.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => handleOptionChange(option.id, 'value', e.target.value)}
                          placeholder="Wert"
                          className="flex-1 px-2.5 py-2 rounded-md border border-slate-200 text-[13px] font-mono"
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => handleOptionChange(option.id, 'label', e.target.value)}
                          placeholder="Anzeigename"
                          className="flex-[2] px-2.5 py-2 rounded-md border border-slate-200 text-[13px]"
                        />
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          className="p-1.5 border-none bg-transparent cursor-pointer text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddOption}
                      className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-md bg-transparent text-slate-500 text-[13px] cursor-pointer mt-1 hover:bg-slate-50"
                    >
                      <Plus size={14} />
                      Option hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Section Item Component for structured prompts
 */
const SectionItem = ({
  section,
  index,
  total,
  variables,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onInsertVariable,
}) => {
  const instructionRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ ...section, [field]: value });
  };

  const handleInsertVariable = (varKey) => {
    const textarea = instructionRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = section.instruction;
      const insertion = `\${${varKey}}`;
      const newText = text.substring(0, start) + insertion + text.substring(end);
      handleChange('instruction', newText);
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }, 0);
    } else {
      handleChange('instruction', section.instruction + `\${${varKey}}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-3 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-200">
        <GripVertical size={16} className="text-slate-400 cursor-grab" />
        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <input
          type="text"
          value={section.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Abschnittstitel (z.B. 'Discovery Questions 🔍')"
          className="flex-1 px-2 py-1 rounded border-0 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400"
        />
        <div className="flex gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className={`p-1 border-none bg-transparent ${index === 0 ? 'opacity-30' : 'cursor-pointer'}`}
          >
            <ChevronUp size={16} className="text-slate-500" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className={`p-1 border-none bg-transparent ${index === total - 1 ? 'opacity-30' : 'cursor-pointer'}`}
          >
            <ChevronDown size={16} className="text-slate-500" />
          </button>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 border-none bg-transparent cursor-pointer text-red-500 hover:bg-red-50 rounded"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-600">
            Anweisung für diesen Abschnitt
          </label>
          {variables.length > 0 && (
            <VariableDropdown
              variables={variables}
              onSelect={handleInsertVariable}
            />
          )}
        </div>
        <textarea
          ref={instructionRef}
          value={section.instruction}
          onChange={(e) => handleChange('instruction', e.target.value)}
          placeholder="z.B. 'Erstelle 5-7 offene Fragen um Bedarf zu wecken basierend auf ${customer_type}'"
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-y"
        />
      </div>
    </div>
  );
};

/**
 * Variable Dropdown Component for inserting variables
 */
const VariableDropdown = ({ variables, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variables.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-medium border-none cursor-pointer hover:bg-indigo-100 transition-colors"
      >
        <Plus size={14} />
        Variable einfügen
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 min-w-[180px] py-1"
          >
            {variables.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  onSelect(v.key);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-none bg-transparent cursor-pointer flex items-center justify-between gap-2"
              >
                <span className="text-slate-700">{v.label}</span>
                <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  ${'{'}${v.key}{'}'}
                </code>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Icon Selector Component
 */
const IconSelector = ({ selectedIcon, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {AVAILABLE_ICONS.map(({ key, icon: Icon, label }) => {
        const isSelected = selectedIcon === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            title={label}
            className={`w-[60px] h-[60px] rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-slate-200 bg-white hover:border-primary/40'
            }`}
          >
            <Icon size={28} className={isSelected ? 'text-primary' : 'text-slate-500'} />
          </button>
        );
      })}
    </div>
  );
};

/**
 * Preview Modal Component
 */
const PreviewModal = ({ isOpen, onClose, templateData, variables }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [testValues, setTestValues] = useState({});

  // Initialize test values when variables change
  useEffect(() => {
    const initial = {};
    variables.forEach(v => {
      initial[v.key] = v.placeholder || `[${v.label}]`;
    });
    setTestValues(initial);
    setPreview(null);
  }, [variables]);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const geminiApiKey = wordpressAPI.getGeminiApiKey();
      if (!geminiApiKey) {
        throw new Error('Kein Gemini API-Key konfiguriert');
      }

      // Build the full prompt
      let fullPrompt = templateData.aiRole + '\n\n';

      if (templateData.sections.length > 0) {
        fullPrompt += 'Erstelle ein strukturiertes Briefing mit folgenden Abschnitten:\n\n';
        templateData.sections.forEach((section, idx) => {
          fullPrompt += `### ${idx + 1}. ${section.title}\n${section.instruction}\n\n`;
        });
      }

      if (templateData.aiBehavior) {
        fullPrompt += `\n\nWICHTIG: ${templateData.aiBehavior}`;
      }

      // Replace variables with test values
      Object.entries(testValues).forEach(([key, value]) => {
        fullPrompt = fullPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      });

      // Generate preview (simplified - just show the prompt for now)
      // In production, this would call the actual API
      setPreview({
        prompt: fullPrompt,
        sections: templateData.sections.map(s => ({
          title: s.title,
          instruction: s.instruction.replace(/\$\{(\w+)\}/g, (_, key) => testValues[key] || `[${key}]`),
        })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-[800px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Template Vorschau</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-none bg-white/80 rounded-lg cursor-pointer hover:bg-white transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Test Values */}
          {variables.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Testwerte für Variablen:</h4>
              <div className="grid grid-cols-2 gap-3">
                {variables.map(v => (
                  <div key={v.id}>
                    <label className="block text-xs text-slate-500 mb-1">{v.label}</label>
                    <input
                      type="text"
                      value={testValues[v.key] || ''}
                      onChange={(e) => setTestValues(prev => ({ ...prev, [v.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold border-none cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generiere Vorschau...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Vorschau generieren
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              {/* AI Role */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">KI-Rolle</h4>
                <p className="text-sm text-slate-700">{templateData.aiRole}</p>
              </div>

              {/* Sections */}
              {preview.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">{section.title}</h4>
                  <p className="text-sm text-slate-600">{section.instruction}</p>
                </div>
              ))}

              {/* Behavior */}
              {templateData.aiBehavior && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2">Verhalten</h4>
                  <p className="text-sm text-amber-800">{templateData.aiBehavior}</p>
                </div>
              )}

              {/* Full Prompt */}
              <div className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Vollständiger Prompt</h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(preview.prompt)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border-none cursor-pointer hover:bg-slate-700"
                  >
                    <Copy size={12} />
                    Kopieren
                  </button>
                </div>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-auto">
                  {preview.prompt}
                </pre>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Main CreateTemplateDialog Component
 */
const CreateTemplateDialog = ({
  isOpen,
  onClose,
  onSave,
  editTemplate = null,
  demoCode,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('file-text');
  const [variables, setVariables] = useState([]);

  // Structured prompt state
  const [aiRole, setAiRole] = useState('');
  const [sections, setSections] = useState([]);
  const [aiBehavior, setAiBehavior] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('empty');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basics');
  const [showPreview, setShowPreview] = useState(false);

  // Refs for variable insertion
  const aiRoleRef = useRef(null);
  const aiBehaviorRef = useRef(null);

  // Initialize form when editing
  useEffect(() => {
    if (editTemplate) {
      setTitle(editTemplate.title || '');
      setDescription(editTemplate.description || '');
      setIcon(editTemplate.icon || 'file-text');
      setVariables(
        (editTemplate.variables_schema || []).map(v => ({
          ...v,
          id: v.id || generateId(),
          options: (v.options || []).map(o => ({ ...o, id: o.id || generateId() })),
        }))
      );

      // Parse existing prompt into structured format
      if (editTemplate.ai_role) {
        setAiRole(editTemplate.ai_role);
      } else if (editTemplate.system_prompt) {
        // Try to extract role from legacy system_prompt
        setAiRole(editTemplate.system_prompt);
      }

      if (editTemplate.ai_task) {
        // Parse ai_task into sections
        try {
          const parsed = JSON.parse(editTemplate.ai_task);
          if (Array.isArray(parsed)) {
            setSections(parsed.map(s => ({ ...s, id: s.id || generateId() })));
          }
        } catch {
          // If not JSON, create single section
          setSections([{ id: generateId(), title: 'Hauptabschnitt', instruction: editTemplate.ai_task }]);
        }
      }

      setAiBehavior(editTemplate.ai_behavior || '');
      setSelectedPreset('empty');
    } else {
      // Reset form for new template
      setTitle('');
      setDescription('');
      setIcon('file-text');
      setVariables([]);
      setAiRole('');
      setSections([]);
      setAiBehavior('');
      setSelectedPreset('empty');
    }
    setActiveTab('basics');
    setError(null);
  }, [editTemplate, isOpen]);

  // Apply preset
  const handleApplyPreset = (presetKey) => {
    const preset = USECASE_PRESETS.find(p => p.key === presetKey);
    if (!preset || presetKey === 'empty') {
      setSelectedPreset('empty');
      return;
    }

    setSelectedPreset(presetKey);
    setAiRole(preset.aiRole);
    setSections(preset.sections.map(s => ({ ...s, id: generateId() })));
    setAiBehavior(preset.aiBehavior);
    setIcon(AVAILABLE_ICONS.find(i => i.icon === preset.icon)?.key || 'file-text');
  };

  // Variable management
  const handleAddVariable = () => {
    setVariables([...variables, createEmptyVariable()]);
  };

  const handleVariableChange = (index, updatedVariable) => {
    const newVariables = [...variables];
    newVariables[index] = updatedVariable;
    setVariables(newVariables);
  };

  const handleDeleteVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newVariables = [...variables];
    [newVariables[index - 1], newVariables[index]] = [newVariables[index], newVariables[index - 1]];
    setVariables(newVariables);
  };

  const handleMoveDown = (index) => {
    if (index === variables.length - 1) return;
    const newVariables = [...variables];
    [newVariables[index], newVariables[index + 1]] = [newVariables[index + 1], newVariables[index]];
    setVariables(newVariables);
  };

  // Section management
  const handleAddSection = () => {
    setSections([...sections, createEmptySection()]);
  };

  const handleSectionChange = (index, updatedSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleDeleteSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionMoveUp = (index) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
  };

  const handleSectionMoveDown = (index) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };

  // Insert variable into text field
  const insertVariableAt = (ref, setter, currentValue, varKey) => {
    const textarea = ref.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertion = `\${${varKey}}`;
      const newText = currentValue.substring(0, start) + insertion + currentValue.substring(end);
      setter(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }, 0);
    } else {
      setter(currentValue + `\${${varKey}}`);
    }
  };

  // Build system_prompt from structured fields (for backward compatibility)
  const buildSystemPrompt = () => {
    let prompt = aiRole + '\n\n';

    if (sections.length > 0) {
      prompt += 'Erstelle ein strukturiertes Briefing mit folgenden Abschnitten:\n\n';
      sections.forEach((section, idx) => {
        prompt += `### ${idx + 1}. ${section.title}\n${section.instruction}\n\n`;
      });
    }

    if (aiBehavior) {
      prompt += `\nWICHTIG: ${aiBehavior}`;
    }

    return prompt;
  };

  // Validate form
  const validate = () => {
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein.');
      setActiveTab('basics');
      return false;
    }
    if (!aiRole.trim()) {
      setError('Bitte definiere eine KI-Rolle.');
      setActiveTab('prompt');
      return false;
    }
    if (sections.length === 0) {
      setError('Bitte füge mindestens einen Abschnitt hinzu.');
      setActiveTab('prompt');
      return false;
    }
    for (const section of sections) {
      if (!section.title.trim()) {
        setError('Alle Abschnitte benötigen einen Titel.');
        setActiveTab('prompt');
        return false;
      }
    }
    for (const v of variables) {
      if (!v.key.trim() || !v.label.trim()) {
        setError('Alle Variablen benötigen einen Namen und eine Bezeichnung.');
        setActiveTab('variables');
        return false;
      }
      if (v.type === 'select' && (!v.options || v.options.length === 0)) {
        setError(`Variable "${v.label}" benötigt mindestens eine Auswahloption.`);
        setActiveTab('variables');
        return false;
      }
    }
    return true;
  };

  // Save template
  const handleSave = async () => {
    setError(null);
    if (!validate()) return;

    setSaving(true);

    try {
      const variablesSchema = variables.map(v => ({
        key: v.key,
        label: v.label,
        type: v.type,
        required: v.required,
        placeholder: v.placeholder,
        ...(v.type === 'select' ? {
          options: v.options.map(o => ({ value: o.value, label: o.label })),
        } : {}),
      }));

      const templateData = {
        title: title.trim(),
        description: description.trim(),
        icon,
        // Structured prompt fields
        ai_role: aiRole,
        ai_task: JSON.stringify(sections.map(s => ({ title: s.title, instruction: s.instruction }))),
        ai_behavior: aiBehavior,
        // Legacy field for backward compatibility
        system_prompt: buildSystemPrompt(),
        variables_schema: variablesSchema,
        ...(demoCode ? { demo_code: demoCode } : {}),
      };

      let response;
      if (editTemplate) {
        response = await wordpressAPI.request(`/smartbriefing/templates/${editTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateData),
        });
      } else {
        response = await wordpressAPI.request('/smartbriefing/templates', {
          method: 'POST',
          body: JSON.stringify(templateData),
        });
      }

      if (response.success) {
        onSave?.(response.data.template);
        onClose();
      } else {
        throw new Error(response.message || 'Fehler beim Speichern');
      }
    } catch (err) {
      console.error('[CreateTemplateDialog] Save error:', err);
      setError(err.message || 'Fehler beim Speichern des Templates');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-[750px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-xl font-bold text-slate-900">
                {editTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
              </h2>
              <p className="mt-1 mb-0 text-sm text-slate-500">
                Erstelle ein persönliches Briefing-Template
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Eye size={16} />
                Vorschau
              </button>
              <button
                onClick={onClose}
                className="p-2 border-none bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-6">
            {[
              { key: 'basics', label: '1. Grundlagen' },
              { key: 'variables', label: '2. Eingabefelder' },
              { key: 'prompt', label: '3. KI-Anweisung' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 border-none bg-transparent text-sm font-semibold cursor-pointer -mb-px transition-all ${
                  activeTab === tab.key
                    ? 'text-primary border-b-[3px] border-primary'
                    : 'text-slate-500 border-b-[3px] border-transparent hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Basics Tab */}
            {activeTab === 'basics' && (
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Sales Discovery Call Prep"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[15px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kurze Beschreibung, wofür dieses Template verwendet wird..."
                    rows={3}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Symbol
                  </label>
                  <IconSelector selectedIcon={icon} onSelect={setIcon} />
                </div>
              </div>
            )}

            {/* Variables Tab */}
            {activeTab === 'variables' && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle size={16} className="text-slate-500" />
                    <span className="text-[13px] text-slate-500">
                      Definiere die Eingabefelder, die der Nutzer beim Erstellen eines Briefings ausfüllen soll.
                      Diese können dann im Prompt als ${'{variablenname}'} verwendet werden.
                    </span>
                  </div>
                </div>

                {variables.map((variable, index) => (
                  <VariableItem
                    key={variable.id}
                    variable={variable}
                    index={index}
                    total={variables.length}
                    onChange={(updated) => handleVariableChange(index, updated)}
                    onDelete={() => handleDeleteVariable(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                  />
                ))}

                <button
                  onClick={handleAddVariable}
                  className="flex items-center justify-center gap-2 w-full px-3.5 py-3.5 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-500 text-sm font-medium cursor-pointer transition-all hover:border-primary hover:text-primary"
                >
                  <Plus size={18} />
                  Eingabefeld hinzufügen
                </button>

                {variables.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Noch keine Eingabefelder definiert.
                  </div>
                )}
              </div>
            )}

            {/* Prompt Tab - Structured Editor */}
            {activeTab === 'prompt' && (
              <div className="space-y-6">
                {/* Preset Selector */}
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={18} className="text-indigo-600" />
                    <label className="text-sm font-semibold text-slate-900">
                      Schnellstart mit Vorlage
                    </label>
                  </div>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handleApplyPreset(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-indigo-200 text-sm bg-white cursor-pointer"
                  >
                    {USECASE_PRESETS.map(preset => (
                      <option key={preset.key} value={preset.key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Role */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900">
                      KI-Rolle *
                    </label>
                    {variables.length > 0 && (
                      <VariableDropdown
                        variables={variables}
                        onSelect={(varKey) => insertVariableAt(aiRoleRef, setAiRole, aiRole, varKey)}
                      />
                    )}
                  </div>
                  <textarea
                    ref={aiRoleRef}
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value)}
                    placeholder="z.B. 'Du bist ein erfahrener Sales-Coach mit 15+ Jahren B2B-Vertriebserfahrung...'"
                    rows={3}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm resize-y"
                  />
                </div>

                {/* Sections */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-900">
                      Briefing-Abschnitte *
                    </label>
                    <span className="text-xs text-slate-500">
                      {sections.length} Abschnitt{sections.length !== 1 ? 'e' : ''}
                    </span>
                  </div>

                  {sections.map((section, index) => (
                    <SectionItem
                      key={section.id}
                      section={section}
                      index={index}
                      total={sections.length}
                      variables={variables}
                      onChange={(updated) => handleSectionChange(index, updated)}
                      onDelete={() => handleDeleteSection(index)}
                      onMoveUp={() => handleSectionMoveUp(index)}
                      onMoveDown={() => handleSectionMoveDown(index)}
                    />
                  ))}

                  <button
                    onClick={handleAddSection}
                    className="flex items-center justify-center gap-2 w-full px-3.5 py-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 text-sm font-medium cursor-pointer transition-all hover:bg-indigo-100"
                  >
                    <Plus size={18} />
                    Abschnitt hinzufügen
                  </button>
                </div>

                {/* AI Behavior */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900">
                      Verhalten & Stil (optional)
                    </label>
                    {variables.length > 0 && (
                      <VariableDropdown
                        variables={variables}
                        onSelect={(varKey) => insertVariableAt(aiBehaviorRef, setAiBehavior, aiBehavior, varKey)}
                      />
                    )}
                  </div>
                  <textarea
                    ref={aiBehaviorRef}
                    value={aiBehavior}
                    onChange={(e) => setAiBehavior(e.target.value)}
                    placeholder="z.B. 'Schreibe praxisnah und actionable. Vermeide Theorie - fokussiere auf konkrete Formulierungen.'"
                    rows={2}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm resize-y"
                  />
                </div>

                {/* Variable chips */}
                {variables.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">Verfügbare Variablen (klicken zum Kopieren)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variables.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            navigator.clipboard.writeText(`\${${v.key}}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          <span className="text-slate-600">{v.label}</span>
                          <code className="font-mono text-indigo-600">${'{'}${v.key}{'}'}</code>
                          <Copy size={12} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Eye size={16} />
                Vorschau
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border-none bg-brand-gradient text-white text-sm font-semibold transition-all ${
                  saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editTemplate ? 'Speichern' : 'Template erstellen'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        templateData={{ aiRole, sections, aiBehavior }}
        variables={variables}
      />
    </>
  );
};

export default CreateTemplateDialog;
