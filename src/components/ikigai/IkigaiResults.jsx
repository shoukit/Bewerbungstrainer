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
} from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
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
 * - 3 career path cards
 * - Training scenario recommendations
 */
const IkigaiResults = ({
  dimensions,
  synthesisResult,
  onStartNew,
  onEdit,
  DIMENSIONS,
}) => {
  const branding = useBranding();
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
   * Card colors for paths
   */
  const pathColors = [
    { bg: '#FEF2F2', border: '#E11D48', accent: '#E11D48' },
    { bg: '#FFFBEB', border: '#F59E0B', accent: '#F59E0B' },
    { bg: '#F0FDF4', border: '#10B981', accent: '#10B981' },
  ];

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E11D48, #F59E0B, #10B981, #6366F1)',
            }}
          >
            <Sparkles size={36} className="text-white" />
          </div>
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: branding.colors?.text?.primary || '#1e293b' }}
        >
          Dein Ikigai-Kompass
        </h1>
        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: branding.colors?.text?.secondary || '#64748b' }}
        >
          {synthesisResult?.summary || 'Basierend auf deinen Eingaben haben wir diese Karrierepfade für dich identifiziert.'}
        </p>
      </motion.div>

      {/* Dimension summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
      >
        {Object.entries(DIMENSIONS).map(([key, config]) => {
          const Icon = DIMENSION_ICONS[key];
          const tags = dimensions[key]?.tags || [];

          return (
            <div
              key={key}
              className="p-3 rounded-xl"
              style={{
                backgroundColor: `${config.color}10`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: config.color }} />
                <span
                  className="font-semibold text-sm"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
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
      <div className="space-y-6 mb-10">
        <h2
          className="text-xl font-bold"
          style={{ color: branding.colors?.text?.primary || '#1e293b' }}
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
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: colors.bg,
                border: `2px solid ${colors.border}30`,
              }}
            >
              {/* Path header */}
              <div
                className="px-6 py-4"
                style={{
                  backgroundColor: colors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {path.role_title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Path content */}
              <div className="p-6">
                <p
                  className="text-gray-700 mb-4"
                  style={{ lineHeight: 1.6 }}
                >
                  {path.description}
                </p>

                {/* Why this fits */}
                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-4"
                  style={{ backgroundColor: `${colors.border}15` }}
                >
                  <CheckCircle
                    size={20}
                    style={{ color: colors.accent }}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p
                      className="font-semibold mb-1"
                      style={{ color: colors.accent }}
                    >
                      Warum passt das zu dir?
                    </p>
                    <p className="text-gray-600 text-sm">{path.why_fit}</p>
                  </div>
                </div>

                {/* Training tags */}
                {path.training_tags && path.training_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {path.training_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
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
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap size={18} className="text-gray-500" />
                      <span className="font-semibold text-gray-700">
                        Passende Trainings:
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recommendedScenarios.map((scenario, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor:
                                scenario.type === 'simulator'
                                  ? '#3B82F620'
                                  : '#8B5CF620',
                            }}
                          >
                            {scenario.type === 'simulator' ? (
                              <Target
                                size={18}
                                style={{ color: '#3B82F6' }}
                              />
                            ) : (
                              <Play
                                size={18}
                                style={{ color: '#8B5CF6' }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {scenario.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {scenario.type === 'simulator'
                                ? 'Szenario-Training'
                                : 'Live-Simulation'}
                            </p>
                          </div>
                          <ChevronRight
                            size={18}
                            className="text-gray-400 group-hover:text-gray-600 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No scenarios found */}
                {!loadingScenarios && recommendedScenarios.length === 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <GraduationCap size={18} />
                      <span className="text-sm">
                        Entdecke unsere Trainings im Menü links
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row justify-center gap-4"
      >
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium border-2 transition-all hover:scale-105"
          style={{
            borderColor: branding.colors?.primary || '#6366F1',
            color: branding.colors?.primary || '#6366F1',
          }}
        >
          <Edit3 size={20} />
          <span>Anpassen</span>
        </button>
        <button
          onClick={onStartNew}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #E11D48, #6366F1)',
          }}
        >
          <RefreshCw size={20} />
          <span>Neu starten</span>
        </button>
      </motion.div>

      {/* Empty state */}
      {(!synthesisResult?.paths || synthesisResult.paths.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Du bist einzigartig - wir brauchen mehr Details, um passende Pfade zu finden.
          </p>
          <button
            onClick={onEdit}
            className="mt-4 px-6 py-3 rounded-xl font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #E11D48, #6366F1)',
            }}
          >
            Zurück zur Eingabe
          </button>
        </div>
      )}
    </div>
  );
};

export default IkigaiResults;
