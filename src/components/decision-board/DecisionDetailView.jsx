/**
 * DecisionDetailView - Full detail view for a saved decision
 *
 * Shows the complete decision with Pro/Contra lists, AI analysis,
 * and allows editing/deleting.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Scale,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Plus,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePartner } from '@/context/PartnerContext';
import { useBranding } from '@/hooks/useBranding';
import { formatDateTime } from '@/utils/formatting';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Generate unique ID for items
 */
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Weight Slider Component
 */
const WeightSlider = ({ value, onChange, color, disabled }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px', width: '100px' }}>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(90deg, ${color === 'green' ? '#22c55e' : '#ef4444'} 0%, ${color === 'green' ? '#22c55e' : '#ef4444'} ${(value - 1) * 11.1}%, #e2e8f0 ${(value - 1) * 11.1}%, #e2e8f0 100%)`,
          appearance: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      />
      <span
        style={{
          minWidth: '28px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '13px',
          color: color === 'green' ? '#16a34a' : '#dc2626',
          backgroundColor: color === 'green' ? '#dcfce7' : '#fee2e2',
          padding: '2px 6px',
          borderRadius: '6px',
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Score Bar Component
 */
const RationalScoreBar = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        <span style={{ color: '#16a34a' }}>Pro: {proScore} Punkte ({proPercentage}%)</span>
        <span style={{ color: '#dc2626' }}>Contra: {contraScore} Punkte ({contraPercentage}%)</span>
      </div>
      <div style={{
        height: '24px',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: '#f1f5f9',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px',
            minWidth: proPercentage > 10 ? 'auto' : '0',
          }}
        >
          {proPercentage > 15 && `${proPercentage}%`}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${contraPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px',
            minWidth: contraPercentage > 10 ? 'auto' : '0',
          }}
        >
          {contraPercentage > 15 && `${contraPercentage}%`}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Editable Decision Item
 */
const DecisionItem = ({ item, onUpdate, onDelete, color, isEditing, autoFocus, onAddNew }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && isEditing) {
      e.preventDefault();
      if (item.text.trim() && onAddNew) {
        onAddNew();
      }
    }
  };

  if (!isEditing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: color === 'green' ? '#f0fdf4' : '#fef2f2',
          borderRadius: '10px',
          border: `1px solid ${color === 'green' ? '#bbf7d0' : '#fecaca'}`,
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          backgroundColor: color === 'green' ? '#dcfce7' : '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {color === 'green' ? (
            <ThumbsUp size={14} color="#16a34a" />
          ) : (
            <ThumbsDown size={14} color="#dc2626" />
          )}
        </div>
        <span style={{ flex: 1, fontSize: '14px', color: '#334155', lineHeight: 1.4 }}>
          {item.text}
        </span>
        <WeightSlider value={item.weight} onChange={() => {}} color={color} disabled />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: color === 'green' ? -20 : 20 }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        backgroundColor: color === 'green' ? '#f0fdf4' : '#fef2f2',
        borderRadius: '12px',
        border: `1px solid ${color === 'green' ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <Input
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder={color === 'green' ? 'Pro-Argument...' : 'Contra-Argument...'}
        style={{
          flex: '1 1 200px',
          minWidth: '0',
          backgroundColor: 'white',
          border: `1px solid ${color === 'green' ? '#86efac' : '#fca5a5'}`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <WeightSlider
          value={item.weight}
          onChange={(weight) => onUpdate(item.id, { weight })}
          color={color}
        />
        <button
          onClick={() => onDelete(item.id)}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#94a3b8',
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * AI Coaching Card Component
 */
const CoachingCard = ({ card }) => {
  const getCardStyle = (type) => {
    switch (type) {
      case 'blind_spot':
        return { bg: '#fef3c7', border: '#fcd34d', icon: '👁️', color: '#b45309' };
      case 'reframe':
        return { bg: '#dbeafe', border: '#93c5fd', icon: '🔄', color: '#1d4ed8' };
      case 'question':
        return { bg: '#f3e8ff', border: '#c4b5fd', icon: '❓', color: '#7c3aed' };
      case 'action':
        return { bg: '#dcfce7', border: '#86efac', icon: '🎯', color: '#15803d' };
      default:
        return { bg: '#f1f5f9', border: '#cbd5e1', icon: '💡', color: '#475569' };
    }
  };

  const style = getCardStyle(card.type);

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: style.bg,
        borderRadius: '12px',
        border: `1px solid ${style.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: style.color,
            marginBottom: '6px',
          }}>
            {card.title}
          </h4>
          <p style={{
            fontSize: '14px',
            color: '#334155',
            lineHeight: 1.5,
            margin: 0,
          }}>
            {card.content}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main DecisionDetailView Component
 */
const DecisionDetailView = ({
  decision,
  onBack,
  onDelete,
  onUpdate,
}) => {
  const { branding } = usePartner();
  const b = useBranding();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [focusedItemId, setFocusedItemId] = useState(null);

  // Editable state
  const [editedTopic, setEditedTopic] = useState(decision.topic || '');
  const [editedContext, setEditedContext] = useState(decision.context || '');
  const [editedPros, setEditedPros] = useState(decision.pros || []);
  const [editedCons, setEditedCons] = useState(decision.cons || []);

  const primaryColor = branding?.['--primary-accent'] || '#8b5cf6';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';

  // Calculate scores
  const proScore = useMemo(() =>
    editedPros.reduce((acc, item) => acc + (item.text?.trim() ? (item.weight || 5) : 0), 0),
    [editedPros]
  );

  const contraScore = useMemo(() =>
    editedCons.reduce((acc, item) => acc + (item.text?.trim() ? (item.weight || 5) : 0), 0),
    [editedCons]
  );

  // Handlers for editing
  const addPro = useCallback(() => {
    const newId = generateId();
    setEditedPros(prev => [...prev, { id: newId, text: '', weight: 5 }]);
    setFocusedItemId(newId);
  }, []);

  const addCon = useCallback(() => {
    const newId = generateId();
    setEditedCons(prev => [...prev, { id: newId, text: '', weight: 5 }]);
    setFocusedItemId(newId);
  }, []);

  const updatePro = useCallback((id, updates) => {
    setEditedPros(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const updateCon = useCallback((id, updates) => {
    setEditedCons(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deletePro = useCallback((id) => {
    setEditedPros(prev => prev.filter(item => item.id !== id));
  }, []);

  const deleteCon = useCallback((id) => {
    setEditedCons(prev => prev.filter(item => item.id !== id));
  }, []);

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedTopic(decision.topic || '');
    setEditedContext(decision.context || '');
    setEditedPros(decision.pros || []);
    setEditedCons(decision.cons || []);
    setIsEditing(false);
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Filter out empty items
      const validPros = editedPros.filter(item => item.text?.trim());
      const validCons = editedCons.filter(item => item.text?.trim());

      const updateData = {
        topic: editedTopic.trim(),
        context: editedContext.trim() || null,
        pros: validPros,
        cons: validCons,
        pro_score: proScore,
        contra_score: contraScore,
      };

      const response = await wordpressAPI.updateDecision(decision.id, updateData);

      if (response.success) {
        const updatedDecision = {
          ...decision,
          ...updateData,
        };
        onUpdate?.(updatedDecision);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error(response.message || 'Fehler beim Speichern');
      }
    } catch (err) {
      console.error('Failed to save decision:', err);
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete decision
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(decision.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete decision:', err);
      setError(err.message || 'Fehler beim Löschen');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={18} />
          Zurück
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X size={16} style={{ marginRight: '6px' }} />
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                style={{ background: headerGradient }}
              >
                {isSaving ? (
                  <Loader2 size={16} style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save size={16} style={{ marginRight: '6px' }} />
                )}
                Speichern
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} style={{ marginRight: '6px' }} />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                style={{ borderColor: '#fecaca', color: '#dc2626' }}
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                Löschen
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              marginBottom: '16px',
              color: '#16a34a',
            }}
          >
            <CheckCircle size={20} />
            <span>Änderungen erfolgreich gespeichert!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              marginBottom: '16px',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Card */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Scale size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <>
                <Input
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  placeholder="Entscheidungsfrage..."
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                />
                <Textarea
                  value={editedContext}
                  onChange={(e) => setEditedContext(e.target.value)}
                  placeholder="Kontext / Situationsbeschreibung..."
                  rows={2}
                  style={{ fontSize: '14px' }}
                />
              </>
            ) : (
              <>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '4px',
                  lineHeight: 1.3,
                }}>
                  {decision.topic}
                </h1>
                {decision.context && (
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '8px',
                    lineHeight: 1.5,
                  }}>
                    {decision.context}
                  </p>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#94a3b8',
                }}>
                  <Calendar size={14} />
                  {formatDateTime(decision.created_at)}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Pro/Contra Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Pro Column */}
        <Card variant="elevated" padding="lg" style={{ borderTop: '4px solid #22c55e' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ThumbsUp size={20} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#16a34a', margin: 0 }}>
                  PRO
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  {editedPros.filter(p => p.text?.trim()).length} Argumente
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence mode="popLayout">
                {editedPros.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updatePro}
                    onDelete={deletePro}
                    onAddNew={addPro}
                    color="green"
                    isEditing={isEditing}
                    autoFocus={focusedItemId === item.id}
                  />
                ))}
              </AnimatePresence>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={addPro}
                  style={{
                    borderColor: '#22c55e',
                    color: '#16a34a',
                    borderStyle: 'dashed',
                  }}
                >
                  <Plus size={18} style={{ marginRight: '8px' }} />
                  Argument hinzufügen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contra Column */}
        <Card variant="elevated" padding="lg" style={{ borderTop: '4px solid #ef4444' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ThumbsDown size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#dc2626', margin: 0 }}>
                  CONTRA
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  {editedCons.filter(c => c.text?.trim()).length} Argumente
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence mode="popLayout">
                {editedCons.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updateCon}
                    onDelete={deleteCon}
                    onAddNew={addCon}
                    color="red"
                    isEditing={isEditing}
                    autoFocus={focusedItemId === item.id}
                  />
                ))}
              </AnimatePresence>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={addCon}
                  style={{
                    borderColor: '#ef4444',
                    color: '#dc2626',
                    borderStyle: 'dashed',
                  }}
                >
                  <Plus size={18} style={{ marginRight: '8px' }} />
                  Argument hinzufügen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Bar */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <CardHeader>
          <CardTitle icon={Scale} size="md">
            Rationaler Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RationalScoreBar proScore={proScore} contraScore={contraScore} />
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {decision.analysis && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  KI-Analyse
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  Coaching-Impulse für deine Entscheidung
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Recommendation */}
            {decision.analysis.recommendation && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Lightbulb size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#8b5cf6',
                      marginBottom: '4px',
                    }}>
                      Empfehlung
                    </h4>
                    <p style={{
                      fontSize: '15px',
                      color: '#334155',
                      lineHeight: 1.5,
                      margin: 0,
                    }}>
                      {decision.analysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Coaching Cards */}
            {decision.analysis.coaching_cards && decision.analysis.coaching_cards.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {decision.analysis.coaching_cards.map((card, idx) => (
                  <CoachingCard key={idx} card={card} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Entscheidung löschen"
        description="Möchtest du diese Entscheidung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid currentColor;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `}
      </style>
    </div>
  );
};

export default DecisionDetailView;
