import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Video,
  MessageSquare,
  Dumbbell,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';
import SetupSelector from '@/components/wizard/SetupSelector';

/**
 * OverviewDashboard - Landing page with overview of all training modules
 */
const OverviewDashboard = ({ onNavigate }) => {
  // Get partner branding and setup selection
  const { branding, partnerName, isWhiteLabel, dashboardTitle, dashboardHook, currentSetup } = usePartner();

  // Get themed styles
  const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  // Feature cards data
  const features = [
    {
      id: 'smart_briefing',
      icon: Sparkles,
      title: 'Smart Briefing',
      subtitle: 'KI-Vorbereitungs-Assistent',
      description: 'Erhalte massgeschneiderte Briefings für deine Gespräche. Die KI erstellt dir Insider-Wissen, fachliche Must-Haves und clevere Rückfragen - basierend auf deinen spezifischen Angaben.',
      highlights: [
        'Personalisierte Gesprächsvorbereitung',
        'Branchenspezifisches Wissen',
        'Intelligente Rückfragen-Vorschläge',
      ],
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      accentColor: '#EC4899',
    },
    {
      id: 'simulator',
      icon: Target,
      title: 'Szenario-Training',
      subtitle: 'Gezielte Vorbereitung',
      description: 'Trainiere mit vorbereiteten Fragen und erhalte sofortiges KI-Feedback zu jeder Antwort. Perfekt für die systematische Vorbereitung auf entscheidende Gespräche, Verhandlungen und Pitches.',
      highlights: [
        'Vordefinierte Business-Szenarien',
        'Sofortiges Feedback nach jeder Antwort',
        'Strukturierte Auswertung',
      ],
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      accentColor: '#10B981',
    },
    {
      id: 'video_training',
      icon: Video,
      title: 'Wirkungs-Analyse',
      subtitle: 'Auftreten & Präsenz perfektionieren',
      description: 'Nimm dich selbst auf Video auf und erhalte eine detaillierte KI-Analyse zu Körpersprache, Mimik und rhetorischer Wirkung. Ideal für Präsentationen, Pitches und den professionellen Auftritt.',
      highlights: [
        'Video-Selbstaufnahme',
        'Analyse von Körpersprache & Charisma',
        'Konkrete Verbesserungsvorschläge',
      ],
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      accentColor: '#8B5CF6',
    },
    {
      id: 'dashboard',
      icon: MessageSquare,
      title: 'Live-Simulationen',
      subtitle: 'Realistische Dialog-Szenarien',
      description: 'Führe echte Gespräche mit einem KI-Sparringspartner in Echtzeit. Die natürlichste Art, schwierige Gesprächssituationen zu üben – von der Verhandlung bis zum Feedbackgespräch.',
      highlights: [
        'Echtzeit-Sprachkonversation',
        'Verschiedene Gesprächspartner-Persönlichkeiten',
        'Vollständiges Gesprächs-Feedback',
      ],
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      accentColor: '#3B82F6',
    },
    {
      id: 'gym_klassiker',
      icon: Dumbbell,
      title: 'Rhetorik-Gym',
      subtitle: 'Ausdrucksweise schärfen',
      description: 'Trainiere deine Ausdrucksweise effizient: Reduziere Füllwörter, verbessere dein Sprechtempo und wirke souveräner und überzeugender in jedem Meeting.',
      highlights: [
        'Füllwort-Erkennung',
        'Sprechtempo-Analyse',
        'Gamification & Highscores',
      ],
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      accentColor: '#F59E0B',
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

  return (
    <div className="min-h-screen py-6 lg:py-10 px-4 lg:px-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full text-center mb-10 lg:mb-14 px-4 lg:px-8"
      >
        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '16px',
          lineHeight: 1.2,
        }}>
          Willkommen im{' '}
          <span style={{
            background: headerGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Trainingscenter
          </span>
        </h1>

        {/* Partner Dashboard Title and Hook (only shown when configured) */}
        {(dashboardTitle || dashboardHook) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{
              marginBottom: '24px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.06) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              maxWidth: '700px',
              margin: '0 auto 24px',
            }}
          >
            {dashboardTitle && (
              <h2 style={{
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: dashboardHook ? '8px' : '0',
                lineHeight: 1.3,
              }}>
                {dashboardTitle}
              </h2>
            )}
            {dashboardHook && (
              <p style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: '#475569',
                margin: 0,
                lineHeight: 1.6,
              }}>
                {dashboardHook}
              </p>
            )}
          </motion.div>
        )}

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          color: '#475569',
          maxWidth: '700px',
          margin: '0 auto 32px',
          lineHeight: 1.6,
        }}>
          Bereite dich optimal auf Bewerbungsgespräche vor. Wähle einen Trainingsbereich und starte dein persönliches Coaching.
        </p>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { icon: Zap, label: 'KI-Feedback', value: 'Sofort' },
            { icon: Trophy, label: 'Trainingsmodi', value: '4' },
            { icon: TrendingUp, label: 'Fortschritt', value: 'Messbar' },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '20px', height: '20px', color: primaryAccent }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Setup Selector - Allow users to select their training focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="w-full px-4 lg:px-8 mb-10"
      >
        <SetupSelector />
      </motion.div>

      {/* Feature Cards Grid - responsive with min 2 per row on larger screens */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full px-4 lg:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
        }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleFeatureClick(feature.id)}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '28px',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
              transition: 'box-shadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              {/* Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: feature.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 16px -4px ${feature.accentColor}40`,
              }}>
                <feature.icon style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>

              {/* Arrow */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <ArrowRight style={{ width: '18px', height: '18px', color: '#64748b' }} />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '4px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: feature.accentColor,
              }}>
                {feature.subtitle}
              </p>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.6,
              marginBottom: '20px',
              flex: 1,
            }}>
              {feature.description}
            </p>

            {/* Highlights */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
            }}>
              {feature.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 style={{
                    width: '16px',
                    height: '16px',
                    color: feature.accentColor,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '14px',
                    color: '#334155',
                  }}>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        style={{
          maxWidth: '700px',
          margin: '48px auto 0',
          textAlign: 'center',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(59, 130, 246, 0.1)',
        }}
      >
        <h3 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '8px',
        }}>
          Bereit für dein Training?
        </h3>
        <p style={{
          fontSize: '15px',
          color: '#64748b',
          marginBottom: '0',
        }}>
          Wähle einen der Trainingsbereiche oben aus und starte sofort mit deinem persönlichen Coaching.
        </p>
      </motion.div>
    </div>
  );
};

export default OverviewDashboard;
