/**
 * IkigaiDashboard Component
 *
 * Landing page for the Ikigai feature showing:
 * - Feature description and benefits
 * - "Neues Ikigai starten" button (requires auth)
 * - List of previous Ikigai sessions (if authenticated)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Plus,
  Heart,
  Star,
  Users,
  Briefcase,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  History,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/base/card';
import wordpressAPI from '@/services/wordpress-api';
import FeatureInfoModal from '@/components/global/FeatureInfoModal';
import FeatureInfoButton from '@/components/global/FeatureInfoButton';
import FeatureAppHeader from '@/components/global/FeatureAppHeader';
import MicrophoneSelector from '@/components/device-setup/MicrophoneSelector';
import { COLORS, createGradient } from '@/config/colors';

/**
 * The four Ikigai dimensions for display
 */
const IKIGAI_DIMENSIONS = [
  {
    key: 'love',
    label: 'Was du liebst',
    icon: Heart,
    color: COLORS.rose[500],
    description: 'Deine Leidenschaften und Interessen',
  },
  {
    key: 'talent',
    label: 'Was du kannst',
    icon: Star,
    color: COLORS.amber[500],
    description: 'Deine Fähigkeiten und Stärken',
  },
  {
    key: 'need',
    label: 'Was die Welt braucht',
    icon: Users,
    color: COLORS.emerald[500],
    description: 'Wie du anderen helfen kannst',
  },
  {
    key: 'market',
    label: 'Wofür du bezahlt werden kannst',
    icon: Briefcase,
    color: COLORS.blue[500],
    description: 'Deine beruflichen Möglichkeiten',
  },
];

const IkigaiDashboard = ({
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

  // Ikigai gradient
  const ikigaiGradient = createGradient(COLORS.purple[500], COLORS.purple[400]);

  // Load previous sessions if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await wordpressAPI.getIkigais();
      if (response?.data?.ikigais) {
        // Sort by date, newest first, limit to 5
        const sorted = response.data.ikigais
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setSessions(sorted);
      }
    } catch (err) {
      console.error('[IkigaiDashboard] Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle start new Ikigai - requires auth
   */
  const handleStartNew = useCallback(() => {
    if (!isAuthenticated) {
      // Set pending action and trigger login
      if (setPendingAction) {
        setPendingAction({ type: 'ikigai_start' });
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
        In Bearbeitung
      </span>
    );
  };

  return (
    <>
      {/* Feature Info Modal - shows on first visit */}
      <FeatureInfoModal featureId="ikigai" showOnMount />

      <div className="min-h-full">
        {/* Header */}
        <FeatureAppHeader
          featureId="ikigai"
          icon={Compass}
          title="Ikigai-Kompass"
          subtitle="Finde deine berufliche Bestimmung"
          gradient={ikigaiGradient}
          historyLabel="Meine Ikigai"
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
              style={{ background: ikigaiGradient }}
            >
              <Compass className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Entdecke dein Ikigai
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Ikigai ist ein japanisches Konzept für den "Grund des Seins" –
              die perfekte Schnittmenge aus dem, was du liebst, was du kannst,
              was die Welt braucht und wofür du bezahlt werden kannst.
              Finde deinen einzigartigen Karrierepfad.
            </p>
          </motion.div>

          {/* Four Dimensions Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {IKIGAI_DIMENSIONS.map((dim, index) => (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white rounded-xl p-4 border border-slate-200 text-center"
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${dim.color}15` }}
                >
                  <dim.icon className="w-6 h-6" style={{ color: dim.color }} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">
                  {dim.label}
                </h3>
                <p className="text-xs text-slate-500">
                  {dim.description}
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
                <Mic className="w-[22px] h-[22px] text-purple-500" />
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
                background: ikigaiGradient,
                color: 'white',
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Neues Ikigai starten
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
                  Letzte Ikigai-Analysen
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
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onContinueSession(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `${COLORS.purple[500]}15` }}
                        >
                          <Compass className="w-5 h-5" style={{ color: COLORS.purple[500] }} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {session.summary
                              ? session.summary.substring(0, 50) + (session.summary.length > 50 ? '...' : '')
                              : 'Ikigai-Analyse'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(session.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session)}
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
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
            className="mt-12 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              So funktioniert's
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-slate-800">Dimensionen ausfüllen</p>
                  <p className="text-sm text-slate-600">
                    Beantworte Fragen zu den vier Ikigai-Bereichen
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-slate-800">KI-Analyse</p>
                  <p className="text-sm text-slate-600">
                    Die KI extrahiert Schlüsselwörter aus deinen Antworten
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-slate-800">Karrierepfade</p>
                  <p className="text-sm text-slate-600">
                    Erhalte personalisierte Berufsvorschläge
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

export default IkigaiDashboard;
