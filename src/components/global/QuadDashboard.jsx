import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Scale,
  FileText,
  ArrowRight,
  Clock,
  TrendingUp,
  MessageSquare,
  Mic,
  Video,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { usePartner, useAuth } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS, GRADIENTS } from '@/config/colors';
import { getRecentActivities, getWPApiUrl, getWPNonce } from '@/services/wordpress-api';
import { getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { formatRelativeTime } from '@/utils/formatting';
import SetupSelector from '@/components/wizard/SetupSelector';
import FeatureInfoButton from './FeatureInfoButton';

/**
 * QuadDashboard - Homepage with two-zone layout
 *
 * Zone A: Strategy Suite (Phase 1) - 3 cards
 * Zone B: Training Arena (Phase 2) - 2x2 grid
 */
const QuadDashboard = ({ onNavigate }) => {
  const { branding, user, filterScenariosBySetupAndPartner, currentSetup, checkModuleAllowed, appName, dashboardSubtitle } = usePartner();
  const { isAuthenticated } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [scenarioCounts, setScenarioCounts] = useState({
    simulator: null,
    roleplay: null,
    video: null,
  });

  // Get themed styles
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Helper function to fetch simulator scenarios
  const fetchSimulatorScenarios = async () => {
    try {
      const response = await fetch(`${getWPApiUrl()}/simulator/scenarios`, {
        headers: { 'X-WP-Nonce': getWPNonce() },
        credentials: 'same-origin',
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.success && data.data?.scenarios ? data.data.scenarios : [];
    } catch {
      return [];
    }
  };

  // Helper function to fetch video scenarios
  const fetchVideoScenarios = async () => {
    try {
      const response = await fetch(`${getWPApiUrl()}/video-training/scenarios`, {
        headers: { 'X-WP-Nonce': getWPNonce() },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.success && data.data?.scenarios ? data.data.scenarios : [];
    } catch {
      return [];
    }
  };

  // Load scenario counts when setup changes
  useEffect(() => {
    const loadScenarioCounts = async () => {
      try {
        // Fetch all scenarios in parallel
        const [simulatorData, roleplayData, videoData] = await Promise.all([
          fetchSimulatorScenarios(),
          getRoleplayScenarios().catch(() => []),
          fetchVideoScenarios(),
        ]);

        // Filter and count based on current setup
        const simulatorFiltered = filterScenariosBySetupAndPartner(simulatorData || [], 'simulator');
        const roleplayFiltered = filterScenariosBySetupAndPartner(roleplayData || [], 'roleplay');
        const videoFiltered = filterScenariosBySetupAndPartner(videoData || [], 'video_training');

        console.log('[QuadDashboard] Scenario counts:', {
          currentSetup: currentSetup?.id,
          simulator: simulatorFiltered.length,
          roleplay: roleplayFiltered.length,
          video: videoFiltered.length,
        });

        setScenarioCounts({
          simulator: simulatorFiltered.length,
          roleplay: roleplayFiltered.length,
          video: videoFiltered.length,
        });
      } catch (error) {
        console.error('Failed to load scenario counts:', error);
      }
    };

    loadScenarioCounts();
  }, [currentSetup, filterScenariosBySetupAndPartner]);

  // Load recent activities if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadRecentActivities();
    }
  }, [isAuthenticated]);

  const loadRecentActivities = async () => {
    setLoadingActivities(true);
    try {
      const activities = await getRecentActivities(6);
      setRecentActivities(activities || []);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setRecentActivities([]);
    }
    setLoadingActivities(false);
  };

  // Get user's first name
  const getFirstName = () => {
    if (!user) return null;
    if (user.first_name) return user.first_name;
    if (user.display_name) return user.display_name.split(' ')[0];
    if (user.name) return user.name.split(' ')[0];
    return null;
  };

  const firstName = getFirstName();

  // Zone A: Strategy Suite cards - with moduleKey for partner filtering
  const allStrategyCards = [
    {
      id: 'ikigai',
      moduleKey: 'ikigai', // Matches PHP module ID
      featureId: 'ikigai',
      step: '1',
      title: 'Orientierung',
      subtitle: 'Ikigai-Kompass',
      description: 'Finde den Schnittpunkt deiner Talente, Leidenschaften und Möglichkeiten.',
      icon: Compass,
      color: COLORS.purple[500],
      bgLight: COLORS.purple[50],
      gradient: `linear-gradient(135deg, ${COLORS.purple[400]} 0%, ${COLORS.purple[600]} 100%)`,
      route: 'ikigai',
    },
    {
      id: 'decision',
      moduleKey: 'decision', // Matches PHP module ID
      featureId: 'decisionboard',
      step: '2',
      title: 'Entscheiden',
      subtitle: 'Decision-Navigator',
      description: 'Löse dein Dilemma mit KI-gestützter Pro & Contra Analyse.',
      icon: Scale,
      color: COLORS.blue[500],
      bgLight: COLORS.blue[50],
      gradient: `linear-gradient(135deg, ${COLORS.blue[400]} 0%, ${COLORS.blue[600]} 100%)`,
      route: 'decision_board',
    },
    {
      id: 'briefing',
      moduleKey: 'briefings', // Matches PHP module ID
      featureId: 'smartbriefing',
      step: '3',
      title: 'Vorbereiten',
      subtitle: 'Smart Briefing',
      description: 'Erstelle deinen Schlachtplan mit personalisierten Leitfäden.',
      icon: FileText,
      color: COLORS.amber[500],
      bgLight: COLORS.amber[50],
      gradient: `linear-gradient(135deg, ${COLORS.amber[400]} 0%, ${COLORS.amber[600]} 100%)`,
      route: 'smart_briefing',
    },
  ];

  // Filter strategy cards based on partner's allowed modules
  const strategyCards = allStrategyCards.filter(card => checkModuleAllowed(card.moduleKey));

  // Zone B: Training Arena cards - with moduleKey for partner filtering
  const allTrainingCards = [
    {
      id: 'simulator',
      moduleKey: 'simulator', // Matches PHP module ID
      featureId: 'simulator',
      title: 'Szenario Training',
      subtitle: 'Frage-Antwort',
      description: 'Beantworte Interview-Fragen und erhalte sofortiges KI-Feedback.',
      icon: MessageSquare,
      tag: 'Audio-KI',
      color: COLORS.green[500],
      bgLight: COLORS.green[50],
      gradient: `linear-gradient(135deg, ${COLORS.green[400]} 0%, ${COLORS.teal[500]} 100%)`,
      route: 'simulator',
      countKey: 'simulator',
    },
    {
      id: 'roleplay',
      moduleKey: 'roleplay', // Matches PHP module ID
      featureId: 'roleplay',
      title: 'Live Simulation',
      subtitle: 'Echtzeit-Dialog',
      description: 'Führe ein realistisches Gespräch mit dem KI-Interviewer.',
      icon: Mic,
      tag: 'Voice-KI',
      color: COLORS.amber[500],
      bgLight: COLORS.amber[50],
      gradient: `linear-gradient(135deg, ${COLORS.amber[400]} 0%, ${COLORS.red[400]} 100%)`,
      route: 'dashboard',
      countKey: 'roleplay',
    },
    {
      id: 'video',
      moduleKey: 'video_training', // Matches PHP module ID
      featureId: 'videotraining',
      title: 'Wirkungsanalyse',
      subtitle: 'Körpersprache',
      description: 'Nimm dich auf Video auf und erhalte Feedback zu deiner Wirkung.',
      icon: Video,
      tag: 'Video-KI',
      color: COLORS.red[500],
      bgLight: COLORS.red[50],
      gradient: `linear-gradient(135deg, ${COLORS.red[400]} 0%, ${COLORS.purple[500]} 100%)`,
      route: 'video_training',
      countKey: 'video',
    },
    {
      id: 'gym',
      moduleKey: 'gym', // Matches PHP module ID
      featureId: 'rhetorikgym',
      title: 'Rhetorik Gym',
      subtitle: 'Sprechtraining',
      description: 'Reduziere Füllwörter und verbessere deine Redegewandtheit.',
      icon: Zap,
      tag: 'Drills',
      color: COLORS.purple[500],
      bgLight: COLORS.purple[50],
      gradient: `linear-gradient(135deg, ${COLORS.purple[500]} 0%, ${COLORS.blue[500]} 100%)`,
      route: 'gym_klassiker',
      countKey: null, // No scenarios for gym
    },
  ];

  // Filter training cards based on partner's allowed modules
  const trainingCards = allTrainingCards.filter(card => checkModuleAllowed(card.moduleKey));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  const handleNavigate = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  // Get activity type label
  const getActivityTypeLabel = (type) => {
    const labels = {
      briefing: 'Smart Briefing',
      simulator: 'Szenario-Training',
      video: 'Wirkungs-Analyse',
      roleplay: 'Live-Simulation',
      game: 'Rhetorik-Gym',
      ikigai: 'Ikigai-Kompass',
      decision: 'Entscheidungs-Navigator',
    };
    return labels[type] || type;
  };

  // Get activity color
  const getActivityColor = (type) => {
    const colors = {
      briefing: COLORS.amber[500],
      simulator: COLORS.green[500],
      video: COLORS.red[500],
      roleplay: COLORS.amber[600],
      game: COLORS.purple[500],
      ikigai: COLORS.purple[500],
      decision: COLORS.blue[500],
    };
    return colors[type] || COLORS.slate[400];
  };

  return (
    <div className="min-h-screen py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1000px] mx-auto">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-14"
        >
          <h1 className="text-[clamp(26px,4.5vw,38px)] font-extrabold text-slate-900 mb-3 leading-tight tracking-tight">
            {firstName ? (
              <>
                Hallo{' '}
                <span style={{ color: primaryAccent }}>
                  {firstName}
                </span>
                , wo stehst du?
              </>
            ) : (
              <>
                Willkommen bei{' '}
                <span style={{ color: primaryAccent }}>
                  {appName || 'Karriereheld'}
                </span>
              </>
            )}
          </h1>
          <p className="text-[clamp(15px,2vw,17px)] text-slate-500 max-w-[420px] mx-auto leading-relaxed">
            {dashboardSubtitle || 'Erst denken, dann handeln. Wähle deine Phase.'}
          </p>
        </motion.header>

        {/* ZONE A: STRATEGIE - Only show if there are visible strategy cards */}
        {strategyCards.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <span className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                Phase 1
              </span>
              <h2 className="text-lg font-bold text-slate-800 m-0">
                Deine Strategie
              </h2>
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-3 gap-6 strategy-grid">
              {strategyCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                className="bg-white rounded-2xl p-6 cursor-pointer border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 ease-out relative overflow-hidden"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 32px -8px ${card.color}25`;
                  e.currentTarget.style.borderColor = `${card.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Background Accent */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-5 pointer-events-none" style={{ background: card.color }} />

                {/* Step Badge & Info Button */}
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  <FeatureInfoButton
                    featureId={card.featureId}
                    size="md"
                  />
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: card.bgLight, color: card.color }}>
                    {card.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{
                  background: card.gradient,
                  boxShadow: `0 8px 20px -4px ${card.color}40`,
                }}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-1.5">
                  {card.title}
                </h3>

                <p className="text-sm font-semibold mb-2.5" style={{ color: card.color }}>
                  {card.subtitle}
                </p>

                <p className="text-sm text-slate-500 leading-relaxed m-0 min-h-[44px]">
                  {card.description}
                </p>

                {/* Arrow */}
                <div className="flex justify-end mt-5">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center transition-all duration-200">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          </motion.section>
        )}

        {/* ZONE B: TRAINING - Only show if there are visible training cards */}
        {trainingCards.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3.5 mb-6">
              <span className="bg-gradient-to-br from-green-50 to-green-100 text-green-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                Phase 2
              </span>
              <h2 className="text-lg font-bold text-slate-800 m-0">
                Trainings-Arena
              </h2>
            </div>

            {/* Setup Selector - Filter training scenarios */}
            <div className="mb-6">
              <SetupSelector />
            </div>

            {/* Training Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-6 training-grid">
              {trainingCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                className="bg-white rounded-2xl p-6 cursor-pointer border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 ease-out relative overflow-hidden flex flex-col"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 32px -8px ${card.color}25`;
                  e.currentTarget.style.borderColor = `${card.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Tag Badge & Info Button */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <FeatureInfoButton
                    featureId={card.featureId}
                    size="md"
                  />
                  <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ background: card.bgLight, color: card.color }}>
                    {card.tag}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{
                  background: card.gradient,
                  boxShadow: `0 8px 20px -4px ${card.color}40`,
                }}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {card.title}
                </h3>

                <p className="text-sm font-semibold mb-2" style={{ color: card.color }}>
                  {card.subtitle}
                </p>

                <p className="text-sm text-slate-500 leading-normal m-0 flex-1">
                  {card.description}
                </p>

                {/* Scenario Count Badge & Arrow */}
                <div className="flex justify-between items-center mt-4">
                  {/* Scenario Count - always show when count is available */}
                  {card.countKey && scenarioCounts[card.countKey] !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-sm font-bold" style={{
                        color: scenarioCounts[card.countKey] > 0 ? card.color : COLORS.slate[400],
                      }}>
                        {scenarioCounts[card.countKey]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {scenarioCounts[card.countKey] === 1 ? 'Szenario' : 'Szenarien'}
                      </span>
                    </div>
                  )}
                  {/* Spacer when no count shown */}
                  {(!card.countKey || scenarioCounts[card.countKey] === null) && (
                    <div />
                  )}
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          </motion.section>
        )}

        {/* RECENT ACTIVITIES */}
        {isAuthenticated && recentActivities.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 m-0">
                    Letzte Aktivitäten
                  </h3>
                </div>
                <button
                  onClick={() => handleNavigate('history')}
                  className="flex items-center gap-1 text-sm font-semibold bg-transparent border-0 cursor-pointer px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-50"
                  style={{ color: primaryAccent }}
                >
                  Alle ansehen
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingActivities ? (
                <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
                  <div className="animate-spin w-5 h-5 border-2 border-slate-200 rounded-full" style={{ borderTopColor: primaryAccent }} />
                  Lädt...
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:bg-white hover:border-slate-200"
                      onClick={() => handleNavigate('history')}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: getActivityColor(activity.type) }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {activity.title || getActivityTypeLabel(activity.type)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 m-0">
                            {getActivityTypeLabel(activity.type)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium flex-shrink-0 ml-4">
                        {formatRelativeTime(activity.created_at || activity.date)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Empty State for non-authenticated */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-center py-10 px-8 bg-white rounded-2xl border border-slate-100 shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Verfolge deinen Fortschritt
            </h3>
            <p className="text-sm text-slate-500 m-0 max-w-[360px] mx-auto leading-relaxed">
              Melde dich an, um deinen Fortschritt zu speichern und personalisierte Empfehlungen zu erhalten.
            </p>
          </motion.div>
        )}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 900px) {
          .strategy-grid {
            grid-template-columns: 1fr !important;
          }
          .training-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .strategy-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .training-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuadDashboard;
