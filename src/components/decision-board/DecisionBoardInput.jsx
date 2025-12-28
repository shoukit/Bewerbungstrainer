import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Scale,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePartner } from '@/context/PartnerContext';
import { analyzeDecision } from '@/services/gemini';

/**
 * Generate unique ID for items
 */
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Weight Slider Component
 */
const WeightSlider = ({ value, onChange, color }) => {
  const sliderBg = color === 'green'
    ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
    : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(90deg, ${color === 'green' ? '#22c55e' : '#ef4444'} 0%, ${color === 'green' ? '#22c55e' : '#ef4444'} ${(value - 1) * 11.1}%, #e2e8f0 ${(value - 1) * 11.1}%, #e2e8f0 100%)`,
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          minWidth: '32px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '14px',
          color: color === 'green' ? '#16a34a' : '#dc2626',
          backgroundColor: color === 'green' ? '#dcfce7' : '#fee2e2',
          padding: '2px 8px',
          borderRadius: '6px',
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Decision Item Component
 */
const DecisionItem = ({ item, onUpdate, onDelete, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: color === 'green' ? -20 : 20 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: color === 'green' ? '#f0fdf4' : '#fef2f2',
        borderRadius: '12px',
        border: `1px solid ${color === 'green' ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <Input
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        placeholder={color === 'green' ? 'Pro-Argument...' : 'Contra-Argument...'}
        style={{
          flex: 1,
          backgroundColor: 'white',
          border: `1px solid ${color === 'green' ? '#86efac' : '#fca5a5'}`,
        }}
      />
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
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fee2e2';
          e.currentTarget.style.color = '#dc2626';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

/**
 * Rational Score Bar Component
 */
const RationalScoreBar = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  return (
    <div style={{ marginTop: '24px' }}>
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
 * DecisionBoardInput - Main Input Component
 */
const DecisionBoardInput = ({
  initialData,
  onAnalysisComplete,
  isAuthenticated,
  requireAuth,
}) => {
  const { branding } = usePartner();

  // Initialize state from initialData if provided (for editing)
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [pros, setPros] = useState(initialData?.pros || [
    { id: generateId(), text: '', weight: 5 },
  ]);
  const [cons, setCons] = useState(initialData?.cons || [
    { id: generateId(), text: '', weight: 5 },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate scores
  const proScore = useMemo(() =>
    pros.reduce((acc, item) => acc + (item.text.trim() ? item.weight : 0), 0),
    [pros]
  );

  const contraScore = useMemo(() =>
    cons.reduce((acc, item) => acc + (item.text.trim() ? item.weight : 0), 0),
    [cons]
  );

  // Check if we have valid items
  const hasValidPros = pros.some(item => item.text.trim());
  const hasValidCons = cons.some(item => item.text.trim());
  const canAnalyze = topic.trim() && (hasValidPros || hasValidCons);

  // Add new item
  const addPro = useCallback(() => {
    setPros(prev => [...prev, { id: generateId(), text: '', weight: 5 }]);
  }, []);

  const addCon = useCallback(() => {
    setCons(prev => [...prev, { id: generateId(), text: '', weight: 5 }]);
  }, []);

  // Update item
  const updatePro = useCallback((id, updates) => {
    setPros(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const updateCon = useCallback((id, updates) => {
    setCons(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Delete item
  const deletePro = useCallback((id) => {
    setPros(prev => prev.filter(item => item.id !== id));
  }, []);

  const deleteCon = useCallback((id) => {
    setCons(prev => prev.filter(item => item.id !== id));
  }, []);

  // Analyze decision
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Get API key from WordPress config
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      // Filter out empty items
      const validPros = pros.filter(item => item.text.trim());
      const validCons = cons.filter(item => item.text.trim());

      const decisionData = {
        topic,
        pros: validPros,
        cons: validCons,
        proScore,
        contraScore,
      };

      const result = await analyzeDecision(decisionData, apiKey);

      onAnalysisComplete(decisionData, result);
    } catch (err) {
      console.error('[DecisionBoard] Analysis error:', err);
      setError(err.message || 'Fehler bei der Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  }, [topic, pros, cons, proScore, contraScore, canAnalyze, onAnalysisComplete]);

  const primaryColor = branding?.['--primary-accent'] || '#4A9EC9';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`,
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
        }}>
          <Scale size={32} color="white" />
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '8px',
        }}>
          Der Entscheidungs-Kompass
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Analysiere deine Entscheidung objektiv. Gewichte Pro und Contra,
          und erhalte KI-gestützte Impulse für blinde Flecken.
        </p>
      </div>

      {/* Decision Question */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
        <CardHeader>
          <CardTitle icon={Lightbulb} size="md">
            Deine Entscheidungsfrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Soll ich das Jobangebot annehmen?"
            style={{
              fontSize: '18px',
              padding: '16px',
              borderRadius: '12px',
            }}
          />
        </CardContent>
      </Card>

      {/* Pro/Contra Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
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
                  Was spricht dafür?
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {pros.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updatePro}
                    onDelete={deletePro}
                    color="green"
                  />
                ))}
              </AnimatePresence>
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
                Argument hinzufugen
              </Button>
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
                  Was spricht dagegen?
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {cons.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updateCon}
                    onDelete={deleteCon}
                    color="red"
                  />
                ))}
              </AnimatePresence>
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
                Argument hinzufugen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Bar */}
      {(hasValidPros || hasValidCons) && (
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
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            marginBottom: '24px',
            color: '#dc2626',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Analyze Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          variant="solid"
          size="lg"
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            background: canAnalyze
              ? `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`
              : undefined,
            boxShadow: canAnalyze ? '0 8px 24px rgba(124, 58, 237, 0.3)' : undefined,
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={22} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} />
              Analyse läuft...
            </>
          ) : (
            <>
              <Sparkles size={22} style={{ marginRight: '10px' }} />
              Entscheidung analysieren
            </>
          )}
        </Button>
      </div>

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

          input[type="range"]::-moz-range-thumb {
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

export default DecisionBoardInput;
