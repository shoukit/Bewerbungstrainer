import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Scale,
  FileText,
  Rocket,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Target,
  Video,
  MessageSquare,
  Dumbbell,
} from 'lucide-react';
import { usePartner, useAuth } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import { COLORS } from '@/config/colors';
import { getRecentActivities } from '@/services/wordpress-api';

/**
 * QuadDashboard - New homepage with 2x2 grid of main features
 *
 * The Quad represents the 4 phases of career development:
 * 1. Orientierung (Ikigai) - Find your path
 * 2. Entscheidung (Decision Board) - Make decisions
 * 3. Vorbereitung (Smart Briefing) - Prepare for meetings
 * 4. Training (Simulator/Roleplay) - Practice skills
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

  // Get user's first name or fallback
  const getFirstName = () => {
    if (!user) return null;
    if (user.first_name) return user.first_name;
    if (user.display_name) return user.display_name.split(' ')[0];
    if (user.name) return user.name.split(' ')[0];
    return null;
  };

  const firstName = getFirstName();

  // Smart recommendation based on user state
  const getSmartRecommendation = () => {
    // Logic could be enhanced based on user's last activity, progress, etc.
    if (!isAuthenticated) {
      return 'Starte deine Reise mit dem Ikigai-Kompass und finde deinen idealen Karrierepfad.';
    }
    if (recentActivities.length === 0) {
      return 'Beginne mit dem Ikigai-Kompass, um deine Stärken und Leidenschaften zu entdecken.';
    }
    // Could add more intelligent recommendations based on activity patterns
    return 'Dein letztes Training war stark. Bereit für die nächste Challenge?';
  };

  // Training sub-features for the Training Arena card
  const trainingSubFeatures = [
    {
      id: 'simulator',
      title: 'Szenario-Training',
      description: 'Strukturiertes Q&A mit Sofort-Feedback',
      icon: Target,
      route: 'simulator',
    },
    {
      id: 'video_training',
      title: 'Wirkungs-Analyse',
      description: 'Video-Training mit Körpersprache-Feedback',
      icon: Video,
      route: 'video_training',
    },
    {
      id: 'dashboard',
      title: 'Live-Simulationen',
      description: 'Echtzeit-Gespräche mit KI-Interviewer',
      icon: MessageSquare,
      route: 'dashboard',
    },
    {
      id: 'gym_klassiker',
      title: 'Rhetorik-Gym',
      description: 'Gamifiziertes Sprechtraining',
      icon: Dumbbell,
      route: 'gym_klassiker',
    },
  ];

  // The 4 main feature cards - the "Power Quad"
  const quadFeatures = [
    {
      id: 'ikigai',
      phase: 'Orientierung finden',
      title: 'Ikigai-Kompass',
      description: 'Entdecke den Schnittpunkt aus Talent, Leidenschaft und Marktchancen.',
      icon: Compass,
      color: COLORS.purple[500],
      bgColor: COLORS.purple[50],
      hoverBgColor: COLORS.purple[100],
      gradient: `linear-gradient(135deg, ${COLORS.purple[500]} 0%, ${COLORS.purple[600]} 100%)`,
      route: 'ikigai',
    },
    {
      id: 'decision',
      phase: 'Entscheidung treffen',
      title: 'Entscheidungs-Navigator',
      description: 'Rational und intuitiv. Nutze KI, um komplexe Wahlmöglichkeiten zu klären.',
      icon: Scale,
      color: COLORS.blue[500],
      bgColor: COLORS.blue[50],
      hoverBgColor: COLORS.blue[100],
      gradient: `linear-gradient(135deg, ${COLORS.blue[500]} 0%, ${COLORS.blue[600]} 100%)`,
      route: 'decision_board',
    },
    {
      id: 'briefing',
      phase: 'Gespräch vorbereiten',
      title: 'Smart Briefing',
      description: 'Erstelle in 2 Minuten den perfekten Leitfaden für Gehalt, Pitch oder Konflikte.',
      icon: FileText,
      color: COLORS.amber[500],
      bgColor: COLORS.amber[50],
      hoverBgColor: COLORS.amber[100],
      gradient: `linear-gradient(135deg, ${COLORS.amber[500]} 0%, ${COLORS.amber[600]} 100%)`,
      route: 'smart_briefing',
    },
    {
      id: 'training',
      phase: 'Skills trainieren',
      title: 'Trainings-Arena',
      description: 'Wende dein Wissen an mit unseren 4 Trainingsmodi:',
      icon: Rocket,
      color: COLORS.green[500],
      bgColor: COLORS.green[50],
      hoverBgColor: COLORS.green[100],
      gradient: `linear-gradient(135deg, ${COLORS.green[500]} 0%, ${COLORS.teal[500]} 100%)`,
      hasSubFeatures: true, // Special flag for the training card
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  const handleFeatureClick = (featureId) => {
    if (onNavigate) {
      onNavigate(featureId);
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

  // Render a standard feature card
  const renderStandardCard = (feature) => (
    <motion.div
      key={feature.id}
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleFeatureClick(feature.route)}
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        cursor: 'pointer',
        border: `1px solid ${COLORS.slate[200]}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '240px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = feature.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = COLORS.slate[200];
      }}
    >
      {/* Icon */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: feature.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: `0 8px 16px -4px ${feature.color}40`,
      }}>
        <feature.icon style={{ width: '28px', height: '28px', color: 'white' }} />
      </div>

      {/* Phase Label */}
      <p style={{
        fontSize: '13px',
        fontWeight: 600,
        color: feature.color,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {feature.phase}
      </p>

      {/* Title */}
      <h3 style={{
        fontSize: '22px',
        fontWeight: 700,
        color: COLORS.slate[900],
        marginBottom: '8px',
        lineHeight: 1.2,
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '15px',
        color: COLORS.slate[600],
        lineHeight: 1.6,
        flex: 1,
      }}>
        {feature.description}
      </p>

      {/* Arrow indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: '16px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: COLORS.slate[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <ArrowRight style={{ width: '18px', height: '18px', color: COLORS.slate[500] }} />
        </div>
      </div>
    </motion.div>
  );

  // Render the Training Arena card with sub-features
  const renderTrainingCard = (feature) => (
    <motion.div
      key={feature.id}
      variants={itemVariants}
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        border: `1px solid ${COLORS.slate[200]}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '240px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: feature.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: `0 8px 16px -4px ${feature.color}40`,
      }}>
        <feature.icon style={{ width: '28px', height: '28px', color: 'white' }} />
      </div>

      {/* Phase Label */}
      <p style={{
        fontSize: '13px',
        fontWeight: 600,
        color: feature.color,
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {feature.phase}
      </p>

      {/* Title */}
      <h3 style={{
        fontSize: '22px',
        fontWeight: 700,
        color: COLORS.slate[900],
        marginBottom: '8px',
        lineHeight: 1.2,
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '15px',
        color: COLORS.slate[600],
        lineHeight: 1.6,
        marginBottom: '16px',
      }}>
        {feature.description}
      </p>

      {/* Sub-features list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
      }}>
        {trainingSubFeatures.map((subFeature) => (
          <div
            key={subFeature.id}
            onClick={(e) => {
              e.stopPropagation();
              handleFeatureClick(subFeature.route);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: COLORS.slate[50],
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.green[50];
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = COLORS.slate[50];
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: feature.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <subFeature.icon style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: COLORS.slate[800],
                margin: 0,
                lineHeight: 1.3,
              }}>
                {subFeature.title}
              </p>
              <p style={{
                fontSize: '12px',
                color: COLORS.slate[500],
                margin: 0,
                lineHeight: 1.3,
              }}>
                {subFeature.description}
              </p>
            </div>
            <ArrowRight style={{
              width: '14px',
              height: '14px',
              color: COLORS.slate[400],
              flexShrink: 0,
            }} />
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen py-6 lg:py-10 px-4 lg:px-6">
      {/* Smart Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full mb-10 lg:mb-14 px-4 lg:px-8"
      >
        {/* Greeting */}
        <h1 style={{
          fontSize: 'clamp(26px, 4.5vw, 38px)',
          fontWeight: 800,
          color: COLORS.slate[900],
          marginBottom: '12px',
          lineHeight: 1.2,
        }}>
          {firstName ? (
            <>
              Willkommen zurück,{' '}
              <span style={{
                background: headerGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {firstName}!
              </span>
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

        {/* Smart Recommendation */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)',
            color: COLORS.slate[600],
            maxWidth: '600px',
            lineHeight: 1.6,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles style={{ width: '18px', height: '18px', color: primaryAccent, flexShrink: 0 }} />
          {getSmartRecommendation()}
        </motion.p>
      </motion.header>

      {/* The Power-Quad Grid - 2x2 on desktop, stacked on mobile */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full px-4 lg:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {quadFeatures.map((feature) => (
          feature.hasSubFeatures
            ? renderTrainingCard(feature)
            : renderStandardCard(feature)
        ))}
      </motion.div>

      {/* Recent Activities Section */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="w-full px-4 lg:px-8 mt-12"
          style={{
            maxWidth: '1000px',
            margin: '48px auto 0',
          }}
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
              marginBottom: '20px',
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
            ) : recentActivities.length === 0 ? (
              <div style={{
                padding: '24px',
                background: COLORS.slate[50],
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <TrendingUp style={{
                  width: '32px',
                  height: '32px',
                  color: COLORS.slate[300],
                  margin: '0 auto 12px',
                }} />
                <p style={{
                  fontSize: '15px',
                  color: COLORS.slate[500],
                  margin: 0,
                }}>
                  Noch keine Aktivitäten. Starte jetzt mit deinem ersten Training!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
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
                    onClick={() => {
                      // Navigate to history or detail view
                      if (onNavigate) {
                        onNavigate('history');
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = COLORS.slate[100];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = COLORS.slate[50];
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: primaryAccent,
                      }} />
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: COLORS.slate[800],
                          margin: 0,
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
                    }}>
                      {formatActivityDate(activity.created_at || activity.date)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Call to Action for non-authenticated users */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            maxWidth: '600px',
            margin: '48px auto 0',
            textAlign: 'center',
            padding: '32px',
            background: `linear-gradient(135deg, ${COLORS.blue[50]} 0%, ${COLORS.purple[50]} 100%)`,
            borderRadius: '20px',
            border: `1px solid ${COLORS.blue[100]}`,
          }}
        >
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: COLORS.slate[900],
            marginBottom: '8px',
          }}>
            Wo stehst du gerade?
          </h3>
          <p style={{
            fontSize: '15px',
            color: COLORS.slate[600],
            margin: 0,
          }}>
            Wähle einen der vier Bereiche und starte deine Karriere-Reise.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default QuadDashboard;
