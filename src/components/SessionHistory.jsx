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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoleplaySessions, getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';

console.log('📦 [SESSION_HISTORY] SessionHistory module loaded');

const SessionHistory = ({ onBack, onSelectSession }) => {
  console.log('🏗️ [SESSION_HISTORY] SessionHistory component initialized');

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

  // Load sessions and scenarios on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload when pagination or filter changes
  useEffect(() => {
    loadSessions();
  }, [pagination.offset, scenarioFilter]);

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

  if (isLoading && sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-ocean-blue-600 animate-spin mx-auto mb-4" />
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
    <div className="min-h-screen py-8 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-blue-600 to-ocean-teal-500 flex items-center justify-center shadow-md">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Meine Sessions</h1>
              <p className="text-slate-600">
                {pagination.total} {pagination.total === 1 ? 'Übung' : 'Übungen'} gespeichert
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Scenario filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={scenarioFilter}
                onChange={(e) => {
                  setScenarioFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, offset: 0 }));
                }}
                className="h-11 px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-sm cursor-pointer hover:border-slate-300 focus:outline-none focus:border-ocean-blue-400 focus:ring-2 focus:ring-ocean-blue-100 transition-all duration-200"
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
        </motion.div>
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
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue-500 to-ocean-teal-400 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
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
