/**
 * DecisionBoardDashboard Component
 *
 * Landing page for the Decision Board feature showing:
 * - Feature description and benefits
 * - "Neue Entscheidung starten" button (requires auth)
 * - List of previous decisions (if authenticated)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Brain,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  History,
  Lightbulb,
  Target,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/base/card';
import wordpressAPI from '@/services/wordpress-api';
import FeatureInfoModal from '@/components/global/FeatureInfoModal';
import FeatureAppHeader from '@/components/global/FeatureAppHeader';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import { COLORS, createGradient } from '@/config/colors';

/**
 * Feature highlights for the dashboard
 */
const FEATURE_HIGHLIGHTS = [
  {
    icon: ThumbsUp,
    color: COLORS.emerald[500],
    title: 'Pro-Argumente',
    description: 'Sammle alle Vorteile mit Gewichtung',
  },
  {
    icon: ThumbsDown,
    color: COLORS.rose[500],
    title: 'Contra-Argumente',
    description: 'Erfasse Nachteile und Risiken',
  },
  {
    icon: Brain,
    color: COLORS.violet[500],
    title: 'KI-Analyse',
    description: 'Objektive Auswertung deiner Argumente',
  },
  {
    icon: Lightbulb,
    color: COLORS.amber[500],
    title: 'Coaching-Impulse',
    description: 'Neue Perspektiven für deine Entscheidung',
  },
];

const DecisionBoardDashboard = ({
  onStartNew,
  onContinueSession,
  onNavigateToHistory,
  isAuthenticated,
  requireAuth,
  setPendingAction,
  selectedMicrophoneId,
  onMicrophoneChange,
  onTestMicrophone,
}) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Decision Board gradient
  const decisionGradient = createGradient(COLORS.teal[500], COLORS.teal[400]);

  // Load previous sessions if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await wordpressAPI.getDecisions();
      if (response?.data?.decisions) {
        // Sort by date, newest first, limit to 5
        const sorted = response.data.decisions
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setSessions(sorted);
      }
    } catch (err) {
      console.error('[DecisionDashboard] Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle start new Decision - requires auth
   */
  const handleStartNew = useCallback(() => {
    if (!isAuthenticated) {
      // Set pending action and trigger login
      if (setPendingAction) {
        setPendingAction({ type: 'decision_start' });
      }
      if (requireAuth) {
        requireAuth(() => {
          onStartNew();
        });
      }
      return;
    }
    onStartNew();
  }, [isAuthenticated, requireAuth, setPendingAction, onStartNew]);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Get status badge for session
   */
  const getStatusBadge = (session) => {
    if (session.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <Sparkles className="w-3 h-3" />
          Abgeschlossen
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Entwurf
      </span>
    );
  };

  /**
   * Get decision summary for display
   */
  const getDecisionSummary = (session) => {
    if (session.analysis?.recommendation) {
      return session.analysis.recommendation.substring(0, 50) + '...';
    }
    return session.topic || 'Entscheidungsanalyse';
  };

  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="decisionboard" showOnMount />

      <div className="min-h-full">
        {/* Header */}
        <FeatureAppHeader
          featureId="decisionboard"
          icon={Scale}
          title="Entscheidungs-Board"
          subtitle="Strukturierte Entscheidungsfindung"
          gradient={decisionGradient}
          historyLabel="Meine Entscheidungen"
          onNavigateToHistory={onNavigateToHistory}
          showHistoryButton={isAuthenticated && sessions.length > 0}
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: decisionGradient }}
            >
              <Scale className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Fundierte Entscheidungen treffen
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Stehst du vor einer wichtigen Entscheidung? Das Entscheidungs-Board hilft dir,
              Pro- und Contra-Argumente systematisch zu sammeln, zu gewichten und mit
              KI-Unterstützung die richtige Wahl zu treffen.
            </p>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {FEATURE_HIGHLIGHTS.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white rounded-xl p-4 border border-slate-200 text-center"
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Microphone Setup Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className="p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-2.5 mb-4">
                <Mic className="w-[22px] h-[22px] text-teal-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Mikrofon testen
                </h3>
              </div>
              <MicrophoneSelector
                selectedDeviceId={selectedMicrophoneId}
                onDeviceChange={onMicrophoneChange}
                onTestClick={onTestMicrophone}
              />
            </Card>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <Button
              onClick={handleStartNew}
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{
                background: decisionGradient,
                color: 'white',
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Neue Entscheidung starten
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {!isAuthenticated && (
              <p className="text-sm text-slate-500 mt-3">
                Anmeldung erforderlich zum Starten
              </p>
            )}
          </motion.div>

          {/* Previous Sessions (only if authenticated and has sessions) */}
          {isAuthenticated && sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  Letzte Entscheidungen
                </h3>
                {sessions.length >= 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToHistory}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    Alle anzeigen
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onContinueSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `${COLORS.teal[500]}15` }}
                        >
                          <Scale className="w-5 h-5" style={{ color: COLORS.teal[500] }} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {session.topic
                              ? session.topic.substring(0, 50) + (session.topic.length > 50 ? '...' : '')
                              : 'Entscheidungsanalyse'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session)}
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* How it works section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-500" />
              So funktioniert's
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-slate-800">Fragestellung eingeben</p>
                  <p className="text-sm text-slate-600">
                    Beschreibe deine Entscheidung oder Frage
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-slate-800">Argumente sammeln</p>
                  <p className="text-sm text-slate-600">
                    Füge Pro- und Contra-Punkte mit Gewichtung hinzu
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-slate-800">KI-Analyse erhalten</p>
                  <p className="text-sm text-slate-600">
                    Erhalte eine fundierte Empfehlung und neue Perspektiven
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DecisionBoardDashboard;
