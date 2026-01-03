/**
 * InlineEditTitle - Inline editing for session titles
 *
 * Displays a title with an edit button. When clicked, shows an input field
 * for renaming. Includes save/cancel functionality.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

const InlineEditTitle = ({
  title,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Titel eingeben...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update editValue when title prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title || '');
    }
  }, [title, isEditing]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditValue(title || '');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    const trimmedValue = editValue.trim();

    if (!trimmedValue || trimmedValue === title) {
      setIsEditing(false);
      setEditValue(title || '');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving title:', err);
      // Keep editing mode open on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={isSaving}
          className={`flex-1 px-2 py-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${inputClassName}`}
          style={{ minWidth: '150px' }}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 rounded-lg border-none bg-green-500 text-white cursor-pointer flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50"
          title="Speichern"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1.5 rounded-lg border-none bg-slate-200 text-slate-600 cursor-pointer flex items-center justify-center hover:bg-slate-300 transition-colors disabled:opacity-50"
          title="Abbrechen"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className={className}>{title || placeholder}</span>
      <button
        onClick={handleEditClick}
        className="p-1 rounded-md border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-slate-600 hover:bg-slate-100 transition-all"
        title="Umbenennen"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
};

export default InlineEditTitle;
