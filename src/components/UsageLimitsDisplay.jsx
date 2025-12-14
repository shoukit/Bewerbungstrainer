import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * UsageLimitsDisplay Component
 *
 * Shows the user their current usage limits for Live-Gespräche
 * - Available minutes remaining
 * - Monthly limit
 * - Used minutes
 * - Next recharge date
 */
const UsageLimitsDisplay = ({ onNavigateToRoleplay, compact = false }) => {
  const { branding, demoCode } = usePartner();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usageData, setUsageData] = useState(null);

  // Themed styles
  const themedStyles = useMemo(() => {
    const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
    const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
    const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
    const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

    return {
      headerGradient,
      headerText,
      primaryAccent,
      primaryAccentLight,
    };
  }, [branding]);

  // Fetch usage data
  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wordpressAPI.getUsageLimits(demoCode);
      setUsageData(data);
    } catch (err) {
      console.error('[UsageLimits] Error fetching usage data:', err);
      setError(err.message || 'Fehler beim Laden der Nutzungsdaten');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsageData();
  }, [demoCode]);

  // Calculate percentage used
  const percentUsed = useMemo(() => {
    if (!usageData || usageData.monthly_limit === 0) return 0;
    return Math.min(100, (usageData.used_minutes / usageData.monthly_limit) * 100);
  }, [usageData]);

  // Get status color
  const getStatusColor = (remaining, limit) => {
    const percentRemaining = (remaining / limit) * 100;
    if (percentRemaining <= 0) return '#ef4444'; // Red
    if (percentRemaining <= 20) return '#f59e0b'; // Orange
    if (percentRemaining <= 50) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Format minutes as "X Min."
  const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return '0 Min.';
    return `${Math.round(minutes * 10) / 10} Min.`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsageData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // Compact version (for sidebar or header)
  if (compact) {
    const statusColor = getStatusColor(usageData?.remaining_minutes || 0, usageData?.monthly_limit || 10);
    const hasMinutes = usageData?.has_minutes !== false;

    return (
      <div
        className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onNavigateToRoleplay}
        title={hasMinutes ? 'Live-Gespräch starten' : 'Keine Minuten mehr verfügbar'}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: themedStyles.headerGradient }}
          >
            <Phone className="w-5 h-5" style={{ color: themedStyles.headerText }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Live-Gespräche</p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color: statusColor }}>
                {formatMinutes(usageData?.remaining_minutes || 0)}
              </span>
              <span className="text-xs text-slate-400">
                / {usageData?.monthly_limit || 10} Min.
              </span>
            </div>
          </div>
          {!hasMinutes && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentUsed}%`,
              background: statusColor,
            }}
          />
        </div>
      </div>
    );
  }

  // Full version
  const statusColor = getStatusColor(usageData?.remaining_minutes || 0, usageData?.monthly_limit || 10);
  const hasMinutes = usageData?.has_minutes !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ background: themedStyles.headerGradient }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6" style={{ color: themedStyles.headerText }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: themedStyles.headerText }}>
                Live-Gespräche
              </h2>
              <p className="text-sm opacity-80" style={{ color: themedStyles.headerText }}>
                Monatliches Kontingent
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchUsageData}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Main usage display */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            {/* Circular progress indicator */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={statusColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(100 - percentUsed) * 2.827} 282.7`}
                className="transition-all duration-500"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: statusColor }}>
                {formatMinutes(usageData?.remaining_minutes || 0)}
              </span>
              <span className="text-sm text-slate-500">verfügbar</span>
            </div>
          </div>
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          {!hasMinutes ? (
            <motion.div
              key="no-minutes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium text-sm">
                    Dein Kontingent ist aufgebraucht
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    Am {formatDate(usageData?.next_reset)} werden deine Minuten wieder aufgeladen.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : percentUsed > 80 ? (
            <motion.div
              key="low-minutes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-800 font-medium text-sm">
                    Dein Kontingent ist fast aufgebraucht
                  </p>
                  <p className="text-orange-600 text-xs mt-1">
                    Nutze deine verbleibenden {formatMinutes(usageData?.remaining_minutes)} weise.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium text-sm">
                    Du hast noch Minuten verfügbar
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    Starte jetzt ein Live-Gespräch zum Üben.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Limit</span>
            </div>
            <span className="text-lg font-bold text-slate-700">
              {usageData?.monthly_limit || 10} Min.
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Verbraucht</span>
            </div>
            <span className="text-lg font-bold text-slate-700">
              {formatMinutes(usageData?.used_minutes || 0)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Aufladung</span>
            </div>
            <span className="text-sm font-bold text-slate-700">
              {formatDate(usageData?.next_reset)}
            </span>
          </div>
        </div>

        {/* Period info */}
        <div className="text-center text-xs text-slate-400 mb-6">
          Abrechnungszeitraum: {formatDate(usageData?.period_start)} - {formatDate(usageData?.period_end)}
        </div>

        {/* Action button */}
        {onNavigateToRoleplay && (
          <Button
            onClick={onNavigateToRoleplay}
            disabled={!hasMinutes}
            className="w-full py-6 text-base font-semibold rounded-xl"
            style={{
              background: hasMinutes ? themedStyles.headerGradient : '#94a3b8',
              color: themedStyles.headerText,
            }}
          >
            <Phone className="w-5 h-5 mr-2" />
            {hasMinutes ? 'Live-Gespräch starten' : 'Keine Minuten verfügbar'}
          </Button>
        )}

        {/* Demo code info */}
        {usageData?.is_demo_user && usageData?.demo_code && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 text-xs text-slate-400">
              Demo-Zugang:
              <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">
                {usageData.demo_code}
              </code>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UsageLimitsDisplay;
