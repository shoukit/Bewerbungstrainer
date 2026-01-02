/**
 * CreateTemplateDialog Component
 *
 * A dialog for creating and editing custom Smart Briefing templates.
 * Features a user-friendly variable builder for defining form fields.
 */

import { useState, useEffect } from 'react';
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
  CheckCircle,
  Loader2,
  Save,
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

  // Sync local label when variable changes from outside
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

  // Update label and auto-generate key on blur (when leaving the field)
  const handleLabelBlur = () => {
    if (localLabel !== variable.label) {
      // Update label
      const updates = { label: localLabel };
      // Auto-generate key if empty or was auto-generated from previous label
      if (!variable.key || variable.key === generateKeyFromLabel(variable.label)) {
        updates.key = generateKeyFromLabel(localLabel);
      }
      onChange({ ...variable, ...updates });
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 mb-3 overflow-hidden">
      {/* Header */}
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

        {/* Move buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className={`p-1 border-none bg-transparent ${
              index === 0 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer opacity-100'
            }`}
          >
            <ChevronUp size={16} className="text-slate-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === total - 1}
            className={`p-1 border-none bg-transparent ${
              index === total - 1 ? 'cursor-not-allowed opacity-30' : 'cursor-pointer opacity-100'
            }`}
          >
            <ChevronDown size={16} className="text-slate-500" />
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 border-none bg-transparent cursor-pointer text-red-500"
          title="Variable löschen"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 flex flex-col gap-3">
              {/* Row 1: Label and Key */}
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

              {/* Row 2: Type and Required */}
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

              {/* Row 3: Placeholder */}
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

              {/* Options for select type */}
              {variable.type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Auswahloptionen
                  </label>
                  <div className="flex flex-col gap-2">
                    {(variable.options || []).map((option, optIndex) => (
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
                      className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-md bg-transparent text-slate-500 text-[13px] cursor-pointer mt-1 hover:bg-slate-50 transition-colors"
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
  const [systemPrompt, setSystemPrompt] = useState('');
  const [variables, setVariables] = useState([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'variables' | 'prompt'

  // Initialize form when editing
  useEffect(() => {
    if (editTemplate) {
      setTitle(editTemplate.title || '');
      setDescription(editTemplate.description || '');
      setIcon(editTemplate.icon || 'file-text');
      setSystemPrompt(editTemplate.system_prompt || '');
      setVariables(
        (editTemplate.variables_schema || []).map(v => ({
          ...v,
          id: v.id || generateId(),
          options: (v.options || []).map(o => ({ ...o, id: o.id || generateId() })),
        }))
      );
    } else {
      // Reset form for new template
      setTitle('');
      setDescription('');
      setIcon('file-text');
      setSystemPrompt('');
      setVariables([]);
    }
    setActiveTab('basics');
    setError(null);
  }, [editTemplate, isOpen]);

  // Add new variable
  const handleAddVariable = () => {
    setVariables([...variables, createEmptyVariable()]);
  };

  // Update variable
  const handleVariableChange = (index, updatedVariable) => {
    const newVariables = [...variables];
    newVariables[index] = updatedVariable;
    setVariables(newVariables);
  };

  // Delete variable
  const handleDeleteVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Move variable up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newVariables = [...variables];
    [newVariables[index - 1], newVariables[index]] = [newVariables[index], newVariables[index - 1]];
    setVariables(newVariables);
  };

  // Move variable down
  const handleMoveDown = (index) => {
    if (index === variables.length - 1) return;
    const newVariables = [...variables];
    [newVariables[index], newVariables[index + 1]] = [newVariables[index + 1], newVariables[index]];
    setVariables(newVariables);
  };

  // Validate form
  const validate = () => {
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein.');
      setActiveTab('basics');
      return false;
    }
    if (!systemPrompt.trim()) {
      setError('Bitte gib einen System-Prompt ein.');
      setActiveTab('prompt');
      return false;
    }
    // Validate variables
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
      // Prepare variables schema (remove internal IDs)
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
        system_prompt: systemPrompt,
        variables_schema: variablesSchema,
        ...(demoCode ? { demo_code: demoCode } : {}),
      };

      let response;
      if (editTemplate) {
        // Update existing template
        response = await wordpressAPI.request(`/smartbriefing/templates/${editTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateData),
        });
      } else {
        // Create new template
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
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
          <button
            onClick={onClose}
            className="p-2 border-none bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {[
            { key: 'basics', label: 'Grundlagen' },
            { key: 'variables', label: 'Eingabefelder' },
            { key: 'prompt', label: 'KI-Anweisung' },
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
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Basics Tab */}
          {activeTab === 'basics' && (
            <div className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Titel *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Projektpräsentation Vorbereitung"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[15px]"
                />
              </div>

              {/* Description */}
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

              {/* Icon */}
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
                  </span>
                </div>
              </div>

              {/* Variables list */}
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

              {/* Add variable button */}
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

          {/* Prompt Tab */}
          {activeTab === 'prompt' && (
            <div>
              <div className="bg-sky-50 rounded-xl p-4 mb-4 border border-sky-200">
                <div className="flex items-start gap-2.5">
                  <Lightbulb size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="m-0 mb-1.5 text-sm font-semibold text-sky-900">
                      Tipps für effektive Prompts
                    </h4>
                    <ul className="m-0 pl-4 text-[13px] text-sky-900 leading-relaxed">
                      <li>Verwende <code className="bg-sky-100 px-1 py-0.5 rounded">${'{variablenname}'}</code> um auf Eingabefelder zu verweisen</li>
                      <li>Beschreibe die Rolle der KI (z.B. "Du bist ein erfahrener Karriere-Coach...")</li>
                      <li>Definiere die Struktur des gewünschten Outputs</li>
                      <li>Gib Beispiele für den Ton und Stil</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Available variables */}
              {variables.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500">Verfügbare Variablen: </span>
                  {variables.map(v => (
                    <code
                      key={v.id}
                      className="inline-block px-1.5 py-0.5 mr-1.5 mb-1 bg-slate-100 rounded text-xs font-mono text-slate-600 cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        const insertion = `\${${v.key}}`;
                        setSystemPrompt(prev => prev + insertion);
                      }}
                      title="Klicken zum Einfügen"
                    >
                      ${'{' + v.key + '}'}
                    </code>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  System-Prompt *
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder={`Du bist ein erfahrener Experte für...

Erstelle ein strukturiertes Briefing für den Nutzer basierend auf folgenden Informationen:
- Position: \${position}
- Unternehmen: \${unternehmen}

Das Briefing soll folgende Abschnitte enthalten:
1. ...
2. ...

Formatiere jeden Abschnitt mit einem Titel und 5-8 konkreten Bullet Points.`}
                  rows={15}
                  className="w-full px-3.5 py-3.5 rounded-xl border border-slate-200 text-sm font-mono resize-y leading-relaxed"
                />
              </div>
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
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border-none bg-brand-gradient text-white text-sm font-semibold transition-all ${
              saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer opacity-100'
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
      </motion.div>
    </div>
  );
};

export default CreateTemplateDialog;
