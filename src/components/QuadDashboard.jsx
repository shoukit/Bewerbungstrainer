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
import { COLORS } from '@/config/colors';
import { getRecentActivities, getWPApiUrl, getWPNonce } from '@/services/wordpress-api';
import { getRoleplayScenarios } from '@/services/roleplay-feedback-adapter';
import { formatRelativeTime } from '@/utils/formatting';
import SetupSelector from './SetupSelector';

/**
 * QuadDashboard - Homepage with two-zone layout
 *
 * Zone A: Strategy Suite (Phase 1) - 3 cards
 * Zone B: Training Arena (Phase 2) - 2x2 grid
 */
const QuadDashboard = ({ onNavigate }) => {
  const { branding, user, filterScenariosBySetupAndPartner, currentSetup } = usePartner();
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

  // Zone A: Strategy Suite cards
  const strategyCards = [
    {
      id: 'ikigai',
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

  // Zone B: Training Arena cards
  const trainingCards = [
    {
      id: 'simulator',
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-14"
        >
          <h1 style={{
            fontSize: 'clamp(26px, 4.5vw, 38px)',
            fontWeight: 800,
            color: COLORS.slate[900],
            marginBottom: '12px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            {firstName ? (
              <>
                Hallo{' '}
                <span style={{
                  background: headerGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {firstName}
                </span>
                , wo stehst du?
              </>
            ) : (
              <>
                Willkommen bei{' '}
                <span style={{
                  background: headerGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Karriereheld
                </span>
              </>
            )}
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 17px)',
            color: COLORS.slate[500],
            maxWidth: '420px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Erst denken, dann handeln. Wähle deine Phase.
          </p>
        </motion.header>

        {/* ZONE A: STRATEGIE */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ marginBottom: '48px' }}
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
          }}>
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.slate[100]} 0%, ${COLORS.slate[200]} 100%)`,
              color: COLORS.slate[700],
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Phase 1
            </span>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.slate[800],
              margin: 0,
            }}>
              Deine Strategie
            </h2>
          </div>

          {/* Strategy Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
          className="strategy-grid"
          >
            {strategyCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  cursor: 'pointer',
                  border: `1px solid ${COLORS.slate[100]}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 20px 40px -12px ${card.color}25`;
                  e.currentTarget.style.borderColor = `${card.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = COLORS.slate[100];
                }}
              >
                {/* Background Accent */}
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `${card.color}08`,
                  pointerEvents: 'none',
                }} />

                {/* Step Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: card.bgLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: card.color,
                }}>
                  {card.step}
                </div>

                {/* Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: `0 8px 20px -4px ${card.color}40`,
                }}>
                  <card.icon style={{ width: '26px', height: '26px', color: 'white' }} />
                </div>

                {/* Content */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: COLORS.slate[900],
                  marginBottom: '6px',
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: card.color,
                  marginBottom: '10px',
                }}>
                  {card.subtitle}
                </p>

                <p style={{
                  fontSize: '14px',
                  color: COLORS.slate[500],
                  lineHeight: 1.6,
                  margin: 0,
                  minHeight: '44px',
                }}>
                  {card.description}
                </p>

                {/* Arrow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '20px',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: COLORS.slate[50],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    <ArrowRight style={{
                      width: '16px',
                      height: '16px',
                      color: COLORS.slate[400],
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ZONE B: TRAINING */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ marginBottom: '48px' }}
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
          }}>
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.green[50]} 0%, ${COLORS.green[100]} 100%)`,
              color: COLORS.green[700],
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Phase 2
            </span>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.slate[800],
              margin: 0,
            }}>
              Trainings-Arena
            </h2>
          </div>

          {/* Setup Selector - Filter training scenarios */}
          <div style={{ marginBottom: '24px' }}>
            <SetupSelector />
          </div>

          {/* Training Cards - 2x2 Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
          className="training-grid"
          >
            {trainingCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '26px',
                  cursor: 'pointer',
                  border: `1px solid ${COLORS.slate[100]}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 20px 40px -12px ${card.color}25`;
                  e.currentTarget.style.borderColor = `${card.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = COLORS.slate[100];
                }}
              >
                {/* Tag Badge */}
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: card.bgLight,
                  color: card.color,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}>
                  {card.tag}
                </div>

                {/* Icon */}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                  boxShadow: `0 8px 20px -4px ${card.color}40`,
                }}>
                  <card.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>

                {/* Content */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.slate[900],
                  marginBottom: '4px',
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: card.color,
                  marginBottom: '8px',
                }}>
                  {card.subtitle}
                </p>

                <p style={{
                  fontSize: '14px',
                  color: COLORS.slate[500],
                  lineHeight: 1.5,
                  margin: 0,
                  flex: 1,
                }}>
                  {card.description}
                </p>

                {/* Scenario Count Badge & Arrow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                }}>
                  {/* Scenario Count - always show when count is available */}
                  {card.countKey && scenarioCounts[card.countKey] !== null && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: COLORS.slate[50],
                      border: `1px solid ${COLORS.slate[100]}`,
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: scenarioCounts[card.countKey] > 0 ? card.color : COLORS.slate[400],
                      }}>
                        {scenarioCounts[card.countKey]}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: COLORS.slate[500],
                      }}>
                        {scenarioCounts[card.countKey] === 1 ? 'Szenario' : 'Szenarien'}
                      </span>
                    </div>
                  )}
                  {/* Spacer when no count shown */}
                  {(!card.countKey || scenarioCounts[card.countKey] === null) && (
                    <div />
                  )}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: COLORS.slate[50],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ArrowRight style={{
                      width: '16px',
                      height: '16px',
                      color: COLORS.slate[400],
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* RECENT ACTIVITIES */}
        {isAuthenticated && recentActivities.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '28px',
              border: `1px solid ${COLORS.slate[100]}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: COLORS.slate[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Clock style={{ width: '18px', height: '18px', color: COLORS.slate[500] }} />
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: COLORS.slate[800],
                    margin: 0,
                  }}>
                    Letzte Aktivitäten
                  </h3>
                </div>
                <button
                  onClick={() => handleNavigate('history')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: primaryAccent,
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.slate[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  Alle ansehen
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {loadingActivities ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '32px',
                  color: COLORS.slate[500],
                }}>
                  <div className="animate-spin" style={{
                    width: '20px',
                    height: '20px',
                    border: `2px solid ${COLORS.slate[200]}`,
                    borderTopColor: primaryAccent,
                    borderRadius: '50%',
                  }} />
                  Lädt...
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: COLORS.slate[50],
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid transparent',
                      }}
                      onClick={() => handleNavigate('history')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = COLORS.slate[200];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = COLORS.slate[50];
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: getActivityColor(activity.type),
                          flexShrink: 0,
                        }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: COLORS.slate[800],
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {activity.title || getActivityTypeLabel(activity.type)}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: COLORS.slate[500],
                            margin: '2px 0 0 0',
                          }}>
                            {getActivityTypeLabel(activity.type)}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        color: COLORS.slate[400],
                        fontWeight: 500,
                        flexShrink: 0,
                        marginLeft: '16px',
                      }}>
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
            style={{
              textAlign: 'center',
              padding: '40px 32px',
              background: 'white',
              borderRadius: '20px',
              border: `1px solid ${COLORS.slate[100]}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${COLORS.blue[50]} 0%, ${COLORS.purple[50]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <TrendingUp style={{
                width: '28px',
                height: '28px',
                color: COLORS.blue[500],
              }} />
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.slate[800],
              marginBottom: '8px',
            }}>
              Verfolge deinen Fortschritt
            </h3>
            <p style={{
              fontSize: '14px',
              color: COLORS.slate[500],
              margin: 0,
              maxWidth: '360px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}>
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
