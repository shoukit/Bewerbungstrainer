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
import { usePartner } from '@/context/PartnerContext';
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
  primaryAccent,
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
    <div
      style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'white',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical size={16} style={{ color: '#94a3b8', cursor: 'grab' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
            {variable.label || `Variable ${index + 1}`}
          </span>
          {variable.key && (
            <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '12px' }}>
              ${'{'}${variable.key}{'}'}
            </span>
          )}
        </div>

        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: `${primaryAccent}15`,
            color: primaryAccent,
          }}
        >
          {VARIABLE_TYPES.find(t => t.value === variable.type)?.label || variable.type}
        </span>

        {/* Move buttons */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              opacity: index === 0 ? 0.3 : 1,
            }}
          >
            <ChevronUp size={16} style={{ color: '#64748b' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === total - 1}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: index === total - 1 ? 'not-allowed' : 'pointer',
              opacity: index === total - 1 ? 0.3 : 1,
            }}
          >
            <ChevronDown size={16} style={{ color: '#64748b' }} />
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            padding: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#ef4444',
          }}
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
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Row 1: Label and Key */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Feldbezeichnung *
                  </label>
                  <input
                    type="text"
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    onBlur={handleLabelBlur}
                    placeholder="z.B. Unternehmen"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Variablenname *
                  </label>
                  <input
                    type="text"
                    value={variable.key}
                    onChange={(e) => handleChange('key', e.target.value)}
                    placeholder="z.B. unternehmen"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Type and Required */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Feldtyp
                  </label>
                  <select
                    value={variable.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      backgroundColor: 'white',
                    }}
                  >
                    {VARIABLE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={variable.required}
                    onChange={(e) => handleChange('required', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: primaryAccent }}
                  />
                  <span style={{ fontSize: '14px', color: '#475569' }}>Pflichtfeld</span>
                </label>
              </div>

              {/* Row 3: Placeholder */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Platzhalter-Text (optional)
                </label>
                <input
                  type="text"
                  value={variable.placeholder}
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                  placeholder="z.B. BMW AG, Siemens, etc."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Options for select type */}
              {variable.type === 'select' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Auswahloptionen
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(variable.options || []).map((option, optIndex) => (
                      <div key={option.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => handleOptionChange(option.id, 'value', e.target.value)}
                          placeholder="Wert"
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                          }}
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => handleOptionChange(option.id, 'label', e.target.value)}
                          placeholder="Anzeigename"
                          style={{
                            flex: 2,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                          }}
                        />
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          style={{
                            padding: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddOption}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        color: '#64748b',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
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
const IconSelector = ({ selectedIcon, onSelect, primaryAccent }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {AVAILABLE_ICONS.map(({ key, icon: Icon, label }) => {
        const isSelected = selectedIcon === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            title={label}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              border: `2px solid ${isSelected ? primaryAccent : '#e2e8f0'}`,
              backgroundColor: isSelected ? `${primaryAccent}15` : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Icon size={28} style={{ color: isSelected ? primaryAccent : '#64748b' }} />
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
  const { branding, config } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || config?.buttonGradientStart || '#3A7FA7';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      // Don't close on backdrop click - user must use Cancel or X button
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {editTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Erstelle ein persönliches Briefing-Template
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={20} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
          }}
        >
          {[
            { key: 'basics', label: 'Grundlagen' },
            { key: 'variables', label: 'Eingabefelder' },
            { key: 'prompt', label: 'KI-Anweisung' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === tab.key ? primaryAccent : '#64748b',
                borderBottom: `3px solid ${activeTab === tab.key ? primaryAccent : 'transparent'}`,
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {/* Basics Tab */}
          {activeTab === 'basics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Projektpräsentation Vorbereitung"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '15px',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Beschreibung
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurze Beschreibung, wofür dieses Template verwendet wird..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Icon */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                  Symbol
                </label>
                <IconSelector selectedIcon={icon} onSelect={setIcon} primaryAccent={primaryAccent} />
              </div>
            </div>
          )}

          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <HelpCircle size={16} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
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
                  primaryAccent={primaryAccent}
                />
              ))}

              {/* Add variable button */}
              <button
                onClick={handleAddVariable}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '2px dashed #cbd5e1',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryAccent;
                  e.currentTarget.style.color = primaryAccent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <Plus size={18} />
                Eingabefeld hinzufügen
              </button>

              {variables.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: '#94a3b8',
                    fontSize: '14px',
                  }}
                >
                  Noch keine Eingabefelder definiert.
                </div>
              )}
            </div>
          )}

          {/* Prompt Tab */}
          {activeTab === 'prompt' && (
            <div>
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid #bae6fd',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Lightbulb size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: '#0369a1' }}>
                      Tipps für effektive Prompts
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#0369a1', lineHeight: 1.6 }}>
                      <li>Verwende <code style={{ backgroundColor: '#e0f2fe', padding: '1px 4px', borderRadius: '3px' }}>${'{variablenname}'}</code> um auf Eingabefelder zu verweisen</li>
                      <li>Beschreibe die Rolle der KI (z.B. "Du bist ein erfahrener Karriere-Coach...")</li>
                      <li>Definiere die Struktur des gewünschten Outputs</li>
                      <li>Gib Beispiele für den Ton und Stil</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Available variables */}
              {variables.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Verfügbare Variablen: </span>
                  {variables.map(v => (
                    <code
                      key={v.id}
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        marginRight: '6px',
                        marginBottom: '4px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#475569',
                        cursor: 'pointer',
                      }}
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
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
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryAccent} 0%, ${primaryAccent}dd 100%)`,
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
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

        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </motion.div>
    </div>
  );
};

export default CreateTemplateDialog;
