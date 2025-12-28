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
} from 'lucide-react';
import { usePartner, useAuth } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { getRecentActivities } from '@/services/wordpress-api';

/**
 * QuadDashboard - Homepage with two-zone layout
 *
 * Zone A: Strategy Suite (Phase 1) - 3 cards
 *   1. Orientierung (Ikigai)
 *   2. Entscheiden (Decision Navigator)
 *   3. Vorbereiten (Smart Briefing)
 *
 * Zone B: Training Arena (Phase 2) - 2x2 grid
 *   1. Szenario Training (Chat)
 *   2. Live Simulation (Voice)
 *   3. Wirkungsanalyse (Video)
 *   4. Rhetorik Gym (Drills)
 */
const QuadDashboard = ({ onNavigate }) => {
  const { branding, user } = usePartner();
  const { isAuthenticated } = useAuth();
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Get themed styles
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

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
      description: 'Wohin willst du? Finde den Schnittpunkt deiner Talente.',
      icon: Compass,
      color: COLORS.purple[500],
      bgLight: COLORS.purple[50],
      gradient: `linear-gradient(135deg, ${COLORS.purple[500]} 0%, ${COLORS.purple[600]} 100%)`,
      route: 'ikigai',
    },
    {
      id: 'decision',
      step: '2',
      title: 'Entscheiden',
      subtitle: 'Decision-Navigator',
      description: 'Dilemma lösen. KI-gestützte Pro & Contra Analyse.',
      icon: Scale,
      color: COLORS.blue[500],
      bgLight: COLORS.blue[50],
      gradient: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.blue[600]} 100%)`,
      route: 'decision_board',
    },
    {
      id: 'briefing',
      step: '3',
      title: 'Vorbereiten',
      subtitle: 'Smart Briefing',
      description: 'Dein Schlachtplan. Erstelle Leitfäden für Termine.',
      icon: FileText,
      color: COLORS.amber[500],
      bgLight: COLORS.amber[50],
      gradient: `linear-gradient(135deg, ${COLORS.amber[500]} 0%, ${COLORS.amber[600]} 100%)`,
      route: 'smart_briefing',
    },
  ];

  // Zone B: Training Arena cards
  const trainingCards = [
    {
      id: 'simulator',
      title: 'Szenario Training',
      subtitle: 'Chat-Simulation',
      description: 'Löse Konflikte und Cases im Messenger-Stil.',
      icon: MessageSquare,
      tag: 'Text-Chat',
      color: COLORS.green[500],
      bgLight: COLORS.green[50],
      gradient: `linear-gradient(135deg, ${COLORS.green[500]} 0%, ${COLORS.green[600]} 100%)`,
      route: 'simulator',
    },
    {
      id: 'roleplay',
      title: 'Live Simulation',
      subtitle: 'Voice-Roleplay',
      description: 'Echtzeit-Gespräche. Sprich laut mit der KI.',
      icon: Mic,
      tag: 'Voice-KI',
      color: COLORS.amber[600],
      bgLight: COLORS.amber[50],
      gradient: `linear-gradient(135deg, ${COLORS.amber[500]} 0%, ${COLORS.red[500]} 100%)`,
      route: 'dashboard',
    },
    {
      id: 'video',
      title: 'Wirkungsanalyse',
      subtitle: 'Video-Feedback',
      description: 'Analysiere deine Präsenz, Mimik und Gestik.',
      icon: Video,
      tag: 'Video-KI',
      color: COLORS.red[500],
      bgLight: COLORS.red[50],
      gradient: `linear-gradient(135deg, ${COLORS.red[500]} 0%, ${COLORS.purple[500]} 100%)`,
      route: 'video_training',
    },
    {
      id: 'gym',
      title: 'Rhetorik Gym',
      subtitle: 'Speed-Drills',
      description: 'Tägliche Übungen für Schlagfertigkeit & Stimme.',
      icon: Zap,
      tag: 'Drills',
      color: COLORS.purple[600],
      bgLight: COLORS.purple[50],
      gradient: `linear-gradient(135deg, ${COLORS.purple[600]} 0%, ${COLORS.blue[600]} 100%)`,
      route: 'gym_klassiker',
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const handleNavigate = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  // Format activity date
  const formatActivityDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
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

  return (
    <div className="min-h-screen py-6 lg:py-10 px-4 lg:px-6">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* HEADER - Centered */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 800,
            color: COLORS.slate[900],
            marginBottom: '8px',
            lineHeight: 1.2,
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
                , wo stehst du gerade?
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
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            Erst denken, dann handeln. Wähle deine Phase.
          </p>
        </motion.header>

        {/* ZONE A: STRATEGIE SUITE (Phase 1) */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <span style={{
              background: COLORS.slate[100],
              color: COLORS.slate[600],
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              Phase 1
            </span>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: COLORS.slate[800],
              margin: 0,
            }}>
              Deine Strategie
            </h2>
          </div>

          {/* Strategy Cards - 3 columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '20px',
          }}>
            {strategyCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  border: `1px solid ${COLORS.slate[200]}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 24px -8px ${card.color}30`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = COLORS.slate[200];
                }}
              >
                {/* Step Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: card.bgLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: card.color,
                }}>
                  {card.step}
                </div>

                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: `0 6px 12px -3px ${card.color}40`,
                }}>
                  <card.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.slate[900],
                  marginBottom: '4px',
                }}>
                  {card.title}
                </h3>

                {/* Subtitle */}
                <p style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: card.color,
                  marginBottom: '8px',
                }}>
                  {card.subtitle}
                </p>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: COLORS.slate[600],
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {card.description}
                </p>

                {/* Arrow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '16px',
                }}>
                  <ArrowRight style={{
                    width: '18px',
                    height: '18px',
                    color: COLORS.slate[400],
                  }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ZONE B: TRAININGS-ARENA (Phase 2) */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <span style={{
              background: COLORS.green[100],
              color: COLORS.green[700],
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              Phase 2
            </span>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: COLORS.slate[800],
              margin: 0,
            }}>
              Trainings-Arena
            </h2>
          </div>

          {/* Training Cards - 2x2 Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '20px',
          }}>
            {trainingCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate(card.route)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  border: `1px solid ${COLORS.slate[200]}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 24px -8px ${card.color}30`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = COLORS.slate[200];
                }}
              >
                {/* Tag Badge */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: card.bgLight,
                  color: card.color,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {card.tag}
                </div>

                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: `0 6px 12px -3px ${card.color}40`,
                }}>
                  <card.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.slate[900],
                  marginBottom: '4px',
                }}>
                  {card.title}
                </h3>

                {/* Subtitle */}
                <p style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: card.color,
                  marginBottom: '8px',
                }}>
                  {card.subtitle}
                </p>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: COLORS.slate[600],
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {card.description}
                </p>

                {/* Arrow */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '16px',
                }}>
                  <ArrowRight style={{
                    width: '18px',
                    height: '18px',
                    color: COLORS.slate[400],
                  }} />
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
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-12"
          >
            <div style={{
              borderTop: `1px solid ${COLORS.slate[200]}`,
              paddingTop: '32px',
            }}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: 600,
                color: COLORS.slate[400],
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Clock style={{ width: '14px', height: '14px' }} />
                Deine letzten Aktivitäten
              </h3>

              {loadingActivities ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  color: COLORS.slate[500],
                }}>
                  <div className="animate-spin" style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${COLORS.slate[200]}`,
                    borderTopColor: primaryAccent,
                    borderRadius: '50%',
                  }} />
                  Lädt...
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: '12px',
                }}>
                  {recentActivities.slice(0, 6).map((activity, index) => (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: COLORS.slate[50],
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onClick={() => handleNavigate('history')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = COLORS.slate[100];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = COLORS.slate[50];
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: primaryAccent,
                          flexShrink: 0,
                        }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: 500,
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
                        flexShrink: 0,
                        marginLeft: '12px',
                      }}>
                        {formatActivityDate(activity.created_at || activity.date)}
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
              marginTop: '48px',
              textAlign: 'center',
              padding: '32px',
              background: `linear-gradient(135deg, ${COLORS.slate[50]} 0%, ${COLORS.blue[50]} 100%)`,
              borderRadius: '16px',
              border: `1px solid ${COLORS.slate[200]}`,
            }}
          >
            <TrendingUp style={{
              width: '32px',
              height: '32px',
              color: COLORS.slate[400],
              margin: '0 auto 12px',
            }} />
            <p style={{
              fontSize: '15px',
              color: COLORS.slate[600],
              margin: 0,
            }}>
              Melde dich an, um deinen Fortschritt zu speichern und personalisierte Empfehlungen zu erhalten.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuadDashboard;
