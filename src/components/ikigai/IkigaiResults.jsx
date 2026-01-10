import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Edit3,
  ChevronRight,
  Target,
  GraduationCap,
  Play,
  CheckCircle,
  Briefcase,
  Heart,
  Star,
  Globe,
  Coins,
  Building2,
  MapPin,
  Lightbulb,
  Loader2,
  Plus,
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { useMobile } from '@/hooks/useMobile';
import { COLORS } from '@/config/colors';
import { Card, CardContent } from '@/components/ui/base/card';
import { Button } from '@/components/ui/base/button';
import wordpressAPI from '@/services/wordpress-api';

/**
 * Icon mapping for dimensions
 */
const DIMENSION_ICONS = {
  love: Heart,
  talent: Star,
  need: Globe,
  market: Coins,
};

/**
 * IkigaiResults - Career Paths Display
 *
 * Shows the synthesized career paths with:
 * - Summary connecting all dimensions
 * - Career path cards with job resources
 * - Training scenario recommendations
 * - Button to generate more suggestions
 */
const IkigaiResults = ({
  dimensions,
  synthesisResult,
  onStartNew,
  onEdit,
  onGenerateMore,
  isGeneratingMore,
  DIMENSIONS,
}) => {
  const b = useBranding();
  const isMobile = useMobile(768);
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);

  // Load available scenarios for recommendations
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        // Load both simulator and roleplay scenarios
        const [simulatorRes, roleplayRes] = await Promise.all([
          wordpressAPI.getSimulatorScenarios(),
          wordpressAPI.getScenarios(),
        ]);

        const allScenarios = [
          ...(simulatorRes?.scenarios || []).map((s) => ({
            ...s,
            type: 'simulator',
          })),
          ...(roleplayRes?.scenarios || []).map((s) => ({
            ...s,
            type: 'roleplay',
          })),
        ];

        setScenarios(allScenarios);
      } catch (err) {
        console.error('[IkigaiResults] Failed to load scenarios:', err);
      } finally {
        setLoadingScenarios(false);
      }
    };

    loadScenarios();
  }, []);

  /**
   * Get recommended scenarios for a career path
   */
  const getRecommendedScenarios = (trainingTags) => {
    if (!trainingTags || trainingTags.length === 0 || scenarios.length === 0) {
      return [];
    }

    // Normalize tags for comparison
    const normalizedTags = trainingTags.map((tag) => tag.toLowerCase());

    // Score each scenario based on tag matches
    const scoredScenarios = scenarios.map((scenario) => {
      const scenarioText = [
        scenario.title || '',
        scenario.category || '',
        scenario.tags || '',
        scenario.description || '',
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;
      normalizedTags.forEach((tag) => {
        if (scenarioText.includes(tag)) {
          score += 1;
        }
      });

      return { ...scenario, matchScore: score };
    });

    // Filter and sort by match score
    return scoredScenarios
      .filter((s) => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2); // Top 2 recommendations
  };

  /**
   * Card colors for paths (using dimension colors + additional colors for more paths)
   */
  const pathColors = [
    { bg: `${DIMENSIONS.love.color}08`, border: DIMENSIONS.love.color, accent: DIMENSIONS.love.color },
    { bg: `${DIMENSIONS.talent.color}08`, border: DIMENSIONS.talent.color, accent: DIMENSIONS.talent.color },
    { bg: `${DIMENSIONS.need.color}08`, border: DIMENSIONS.need.color, accent: DIMENSIONS.need.color },
    { bg: `${DIMENSIONS.market.color}08`, border: DIMENSIONS.market.color, accent: DIMENSIONS.market.color },
    { bg: `${COLORS.violet[500]}08`, border: COLORS.violet[500], accent: COLORS.violet[500] },
    { bg: `${COLORS.cyan[500]}08`, border: COLORS.cyan[500], accent: COLORS.cyan[500] },
    { bg: `${COLORS.rose[500]}08`, border: COLORS.rose[500], accent: COLORS.rose[500] },
    { bg: `${COLORS.teal[500]}08`, border: COLORS.teal[500], accent: COLORS.teal[500] },
  ];

  return (
    <div style={{ padding: isMobile ? b.space[4] : b.space[8], maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: b.space[8] }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: b.space[4] }}>
          <div
            style={{
              width: isMobile ? '64px' : '80px',
              height: isMobile ? '64px' : '80px',
              borderRadius: b.radius.full,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: b.headerGradient,
              boxShadow: b.shadow.lg,
            }}
          >
            <Sparkles size={isMobile ? 28 : 36} color="white" />
          </div>
        </div>
        <h1
          style={{
            fontSize: isMobile ? b.fontSize['2xl'] : b.fontSize['3xl'],
            fontWeight: b.fontWeight.bold,
            color: b.textMain,
            marginBottom: b.space[2],
          }}
        >
          Dein Ikigai-Kompass
        </h1>
        <p
          style={{
            fontSize: b.fontSize.base,
            color: b.textSecondary,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          {synthesisResult?.summary || 'Basierend auf deinen Eingaben haben wir diese Karrierepfade für dich identifiziert.'}
        </p>
      </motion.div>

      {/* Dimension summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
      >
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const Icon = DIMENSION_ICONS[key];
          const tags = dimensions[key]?.tags || [];

          return (
            <div
              key={key}
              style={{
                padding: b.space[3],
                borderRadius: b.radius.xl,
                backgroundColor: `${config.color}10`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[2] }}>
                <Icon size={16} style={{ color: config.color }} />
                <span
                  style={{
                    fontWeight: b.fontWeight.semibold,
                    fontSize: b.fontSize.sm,
                    color: config.color,
                  }}
                >
                  {config.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: `2px ${b.space[2]}`,
                      borderRadius: b.radius.full,
                      fontSize: b.fontSize.xs,
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Career paths */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[6], marginBottom: b.space[8] }}>
        <h2
          style={{
            fontSize: b.fontSize.xl,
            fontWeight: b.fontWeight.bold,
            color: b.textMain,
          }}
        >
          Deine Karrierepfade
        </h2>

        {synthesisResult?.paths?.map((path, index) => {
          const colors = pathColors[index % pathColors.length];
          const recommendedScenarios = getRecommendedScenarios(path.training_tags);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              style={{
                borderRadius: b.radius['2xl'],
                overflow: 'hidden',
                boxShadow: b.shadow.md,
                backgroundColor: b.cardBgColor,
                border: `2px solid ${colors.border}30`,
              }}
            >
              {/* Path header */}
              <div
                style={{
                  padding: isMobile ? `${b.space[3]} ${b.space[4]}` : `${b.space[4]} ${b.space[6]}`,
                  backgroundColor: colors.border,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3] }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: b.radius.full,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Briefcase size={20} color="white" />
                  </div>
                  <h3
                    style={{
                      fontSize: isMobile ? b.fontSize.lg : b.fontSize.xl,
                      fontWeight: b.fontWeight.bold,
                      color: 'white',
                    }}
                  >
                    {path.role_title}
                  </h3>
                </div>
              </div>

              {/* Path content */}
              <div style={{ padding: isMobile ? b.space[4] : b.space[6] }}>
                <p
                  style={{
                    color: b.textSecondary,
                    marginBottom: b.space[4],
                    lineHeight: 1.6,
                    fontSize: b.fontSize.base,
                  }}
                >
                  {path.description}
                </p>

                {/* Why this fits */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: b.space[3],
                    padding: b.space[4],
                    borderRadius: b.radius.xl,
                    marginBottom: b.space[4],
                    backgroundColor: `${colors.border}15`,
                  }}
                >
                  <CheckCircle
                    size={20}
                    style={{ color: colors.accent, flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <p
                      style={{
                        fontWeight: b.fontWeight.semibold,
                        marginBottom: '4px',
                        color: colors.accent,
                      }}
                    >
                      Warum passt das zu dir?
                    </p>
                    <p style={{ color: b.textSecondary, fontSize: b.fontSize.sm }}>{path.why_fit}</p>
                  </div>
                </div>

                {/* Job Resources Section */}
                {path.job_resources && (
                  <div
                    style={{
                      padding: b.space[4],
                      borderRadius: b.radius.xl,
                      marginBottom: b.space[4],
                      backgroundColor: `${COLORS.amber[500]}10`,
                      border: `1px solid ${COLORS.amber[500]}30`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[3] }}>
                      <MapPin size={18} style={{ color: COLORS.amber[600] }} />
                      <span style={{ fontWeight: b.fontWeight.semibold, color: COLORS.amber[700] }}>
                        Wo findest du solche Jobs?
                      </span>
                    </div>

                    {/* Companies */}
                    {path.job_resources.companies && path.job_resources.companies.length > 0 && (
                      <div style={{ marginBottom: b.space[3] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[1] }}>
                          <Building2 size={14} style={{ color: b.textMuted }} />
                          <span style={{ fontSize: b.fontSize.sm, fontWeight: b.fontWeight.medium, color: b.textSecondary }}>
                            Unternehmen & Organisationen:
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '22px' }}>
                          {path.job_resources.companies.map((company, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: `2px ${b.space[2]}`,
                                borderRadius: b.radius.md,
                                fontSize: b.fontSize.sm,
                                backgroundColor: b.cardBgColor,
                                color: b.textMain,
                                border: `1px solid ${b.borderColor}`,
                              }}
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Boards */}
                    {path.job_resources.job_boards && path.job_resources.job_boards.length > 0 && (
                      <div style={{ marginBottom: b.space[3] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[1] }}>
                          <Globe size={14} style={{ color: b.textMuted }} />
                          <span style={{ fontSize: b.fontSize.sm, fontWeight: b.fontWeight.medium, color: b.textSecondary }}>
                            Jobbörsen & Plattformen:
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '22px' }}>
                          {path.job_resources.job_boards.map((board, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: `2px ${b.space[2]}`,
                                borderRadius: b.radius.md,
                                fontSize: b.fontSize.sm,
                                backgroundColor: b.cardBgColor,
                                color: b.textMain,
                                border: `1px solid ${b.borderColor}`,
                              }}
                            >
                              {board}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Tips */}
                    {path.job_resources.search_tips && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: b.space[2] }}>
                          <Lightbulb size={14} style={{ color: COLORS.amber[600], flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: b.fontSize.sm, color: b.textSecondary }}>
                            <span style={{ fontWeight: b.fontWeight.medium }}>Tipp: </span>
                            {path.job_resources.search_tips}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Training tags */}
                {path.training_tags && path.training_tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: b.space[2], marginBottom: b.space[4] }}>
                    {path.training_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: `${b.space[1]} ${b.space[3]}`,
                          borderRadius: b.radius.full,
                          fontSize: b.fontSize.xs,
                          fontWeight: b.fontWeight.medium,
                          backgroundColor: `${colors.border}20`,
                          color: colors.accent,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Recommended trainings */}
                {recommendedScenarios.length > 0 && (
                  <div style={{ borderTop: `1px solid ${b.borderColor}`, paddingTop: b.space[4], marginTop: b.space[4] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[3] }}>
                      <GraduationCap size={18} style={{ color: b.textMuted }} />
                      <span style={{ fontWeight: b.fontWeight.semibold, color: b.textSecondary }}>
                        Passende Trainings:
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                        gap: b.space[3],
                      }}
                    >
                      {recommendedScenarios.map((scenario, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: b.space[3],
                            padding: b.space[3],
                            borderRadius: b.radius.xl,
                            background: b.cardBgColor,
                            border: `1px solid ${b.borderColor}`,
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: b.radius.lg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor:
                                scenario.type === 'simulator'
                                  ? `${b.primaryAccent}15`
                                  : `${COLORS.violet[500]}15`,
                            }}
                          >
                            {scenario.type === 'simulator' ? (
                              <Target size={18} style={{ color: b.primaryAccent }} />
                            ) : (
                              <Play size={18} style={{ color: COLORS.violet[500] }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: b.fontWeight.medium,
                                color: b.textMain,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {scenario.title}
                            </p>
                            <p style={{ fontSize: b.fontSize.xs, color: b.textMuted }}>
                              {scenario.type === 'simulator'
                                ? 'Szenario-Training'
                                : 'Live-Simulation'}
                            </p>
                          </div>
                          <ChevronRight size={18} style={{ color: b.textMuted }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Generate More Button */}
      {onGenerateMore && synthesisResult?.paths?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: b.space[8],
          }}
        >
          <Button
            onClick={onGenerateMore}
            disabled={isGeneratingMore}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: b.space[2],
              padding: `${b.space[3]} ${b.space[6]}`,
              borderRadius: b.radius.xl,
              fontWeight: b.fontWeight.medium,
              border: `2px dashed ${COLORS.emerald[500]}`,
              color: isGeneratingMore ? b.textMuted : COLORS.emerald[600],
              background: isGeneratingMore ? b.disabledBg : `${COLORS.emerald[500]}10`,
              cursor: isGeneratingMore ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isGeneratingMore ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Generiere weitere Vorschläge...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Weitere 3 Vorschläge generieren</span>
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          gap: b.space[4],
        }}
      >
        <Button
          onClick={onEdit}
          variant="outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[2],
            padding: `${b.space[3]} ${b.space[6]}`,
            borderRadius: b.radius.xl,
            fontWeight: b.fontWeight.medium,
            borderWidth: '2px',
            borderColor: b.primaryAccent,
            color: b.primaryAccent,
            background: 'transparent',
          }}
        >
          <Edit3 size={20} />
          <span>Anpassen</span>
        </Button>
        <Button
          onClick={onStartNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: b.space[2],
            padding: `${b.space[3]} ${b.space[6]}`,
            borderRadius: b.radius.xl,
            fontWeight: b.fontWeight.medium,
            color: 'white',
            background: b.headerGradient,
            boxShadow: b.shadow.md,
          }}
        >
          <RefreshCw size={20} />
          <span>Neu starten</span>
        </Button>
      </motion.div>

      {/* Empty state */}
      {(!synthesisResult?.paths || synthesisResult.paths.length === 0) && (
        <div style={{ textAlign: 'center', padding: `${b.space[12]} 0` }}>
          <p style={{ color: b.textMuted }}>
            Du bist einzigartig - wir brauchen mehr Details, um passende Pfade zu finden.
          </p>
          <Button
            onClick={onEdit}
            style={{
              marginTop: b.space[4],
              padding: `${b.space[3]} ${b.space[6]}`,
              borderRadius: b.radius.xl,
              fontWeight: b.fontWeight.medium,
              color: 'white',
              background: b.headerGradient,
            }}
          >
            Zurück zur Eingabe
          </Button>
        </div>
      )}
    </div>
  );
};

export default IkigaiResults;
