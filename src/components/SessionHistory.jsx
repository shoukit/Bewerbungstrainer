import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
  AlertCircle,
  Play,
  Star,
  TrendingUp,
  Filter,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

console.log('📦 [SESSION_HISTORY] SessionHistory module loaded');

const SessionHistory = ({ onBack, onSelectSession, isAuthenticated, onLoginClick }) => {
  console.log('🏗️ [SESSION_HISTORY] SessionHistory component initialized');

  // Partner branding
  const { branding } = usePartner();
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const focusRing = branding?.['--focus-ring'] || DEFAULT_BRANDING['--focus-ring'];

  const [sessions, setSessions] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
  });

  // Filters
  const [scenarioFilter, setScenarioFilter] = useState('all');

  // Load sessions and scenarios on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Reload when pagination or filter changes (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [pagination.offset, scenarioFilter, isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load scenarios for filtering/lookup
      const scenariosData = await getRoleplayScenarios();
      setScenarios(scenariosData);

      // Load sessions
      await loadSessions();
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);

      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
      };

      if (scenarioFilter !== 'all') {
        params.scenario_id = scenarioFilter;
      }

      const response = await getRoleplaySessions(params);
      setSessions(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
      }));
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Fehler beim Laden der Sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Create scenario lookup map
  const scenarioMap = useMemo(() => {
    const map = {};
    scenarios.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [scenarios]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract score from feedback JSON
  const extractScore = (feedbackJson) => {
    if (!feedbackJson) return null;
    try {
      let parsed = feedbackJson;
      if (typeof feedbackJson === 'string') {
        // Remove markdown code blocks if present
        let jsonString = feedbackJson.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        parsed = JSON.parse(jsonString);
      }
      return parsed.rating?.overall || null;
    } catch {
      return null;
    }
  };

  // Get score badge color
  const getScoreBadgeColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Show login required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Header - same style as other modules */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: headerGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <History style={{ width: '24px', height: '24px', color: headerText }} />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}>
              Meine Sessions
            </h1>
          </div>
          <p style={{
            fontSize: '16px',
            color: '#475569',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Hier findest du deine gespeicherten Übungen und Fortschritte
          </p>
        </div>

        {/* Login required message */}
        <div style={{
          maxWidth: '500px',
          margin: '60px auto',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <LogIn style={{ width: '32px', height: '32px', color: headerText }} />
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '12px',
          }}>
            Anmeldung erforderlich
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}>
            Um deine gespeicherten Sessions zu sehen, musst du dich zuerst anmelden.
          </p>
          <button
            onClick={onLoginClick}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: headerGradient,
              color: headerText,
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: `0 4px 12px ${primaryAccent}44`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${primaryAccent}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${primaryAccent}44`;
            }}
          >
            <LogIn style={{ width: '20px', height: '20px' }} />
            Jetzt anmelden
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 style={{ width: '48px', height: '48px', color: primaryAccent }} className="animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Sessions werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={loadData}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header - centered style like Szenario-Training */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: headerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <History style={{ width: '24px', height: '24px', color: headerText }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}>
            Meine Sessions
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: '#475569',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          {pagination.total} {pagination.total === 1 ? 'Übung' : 'Übungen'} gespeichert
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Scenario filter */}
          <div className="flex items-center gap-2">
            <Filter style={{ width: '20px', height: '20px', color: primaryAccent }} />
            <select
              value={scenarioFilter}
              onChange={(e) => {
                setScenarioFilter(e.target.value);
                setPagination((prev) => ({ ...prev, offset: 0 }));
              }}
              style={{
                height: '44px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#1e293b',
                fontSize: '14px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = primaryAccent;
                e.target.style.boxShadow = `0 0 0 3px ${focusRing}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              <option value="all">Alle Szenarien</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            onClick={loadSessions}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="max-w-5xl mx-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Noch keine Gespräche</h3>
            <p className="text-slate-500 mb-4">
              Starte dein erstes Rollenspiel-Training, um hier deine Fortschritte zu sehen.
            </p>
            <Button onClick={onBack}>
              <Play className="w-4 h-4 mr-2" />
              Training starten
            </Button>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
          >
            {sessions.map((session) => {
              const scenario = scenarioMap[session.scenario_id];
              const score = extractScore(session.feedback_json);

              return (
                <motion.div
                  key={session.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div
                    onClick={() => onSelectSession(session)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border border-slate-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          {/* Scenario icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: headerGradient }}
                          >
                            <MessageSquare className="w-5 h-5" style={{ color: headerText }} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 truncate">
                              {scenario?.title || `Szenario #${session.scenario_id}`}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {scenario?.description?.substring(0, 80) || 'Keine Beschreibung'}
                              {scenario?.description?.length > 80 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        {/* Date */}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{formatDate(session.created_at)}</span>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>

                        {/* Score */}
                        {score !== null && (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${getScoreBadgeColor(
                              score
                            )}`}
                          >
                            <Star className="w-4 h-4" />
                            <span className="font-semibold">{score}/10</span>
                          </div>
                        )}

                        {/* View button */}
                        <div className="flex items-center gap-1 text-ocean-blue-600 font-semibold">
                          <span>Analyse</span>
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={pagination.offset === 0 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>

            <span className="text-slate-600">
              Seite {currentPage} von {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total || isLoading}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
