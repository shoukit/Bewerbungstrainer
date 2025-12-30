import React from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Lightbulb,
  Flame,
  Heart,
  ArrowLeft,
  RefreshCw,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/base/card';
import { Button } from '@/components/ui/base/button';
import { useBranding } from '@/hooks/useBranding';

/**
 * Skeleton Loader for AI Cards
 */
const CardSkeleton = ({ b }) => (
  <div style={{
    padding: b.space[6],
    borderRadius: b.radius.xl,
    backgroundColor: b.cardBgHover,
    border: `1px solid ${b.borderColor}`,
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: b.radius.lg,
      backgroundColor: b.borderColor,
      marginBottom: b.space[4],
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '60%',
      height: '24px',
      borderRadius: b.radius.md,
      backgroundColor: b.borderColor,
      marginBottom: b.space[3],
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '100%',
      height: '16px',
      borderRadius: b.radius.sm,
      backgroundColor: b.borderColor,
      marginBottom: b.space[2],
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '85%',
      height: '16px',
      borderRadius: b.radius.sm,
      backgroundColor: b.borderColor,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  </div>
);

/**
 * Parse markdown bold (**text**) and return React elements
 */
const parseMarkdownBold = (text) => {
  if (!text) return text;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * AI Coaching Card Component
 * Renders structured content with bullet points
 */
const CoachingCard = ({ card, index, b }) => {
  const cardStyles = {
    blind_spot: {
      bgColor: b.warningLight,
      borderColor: b.warning,
      iconBg: '#fef08a',
      iconColor: b.warningDark,
      bulletColor: b.warningDark,
      icon: Lightbulb,
    },
    challenger: {
      bgColor: b.errorLight,
      borderColor: '#fca5a5',
      iconBg: b.errorLight,
      iconColor: b.error,
      bulletColor: b.error,
      icon: Flame,
    },
    intuition: {
      bgColor: '#f5f3ff',
      borderColor: '#c4b5fd',
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      bulletColor: '#7c3aed',
      icon: Heart,
    },
  };

  const style = cardStyles[card.type] || cardStyles.blind_spot;
  const Icon = style.icon;

  // Get points array - support both old (content) and new (points) format
  const points = card.points || (card.content ? [card.content] : []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15 }}
      style={{
        padding: b.space[6],
        borderRadius: b.radius.xl,
        backgroundColor: style.bgColor,
        border: `2px solid ${style.borderColor}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: b.radius.lg,
        backgroundColor: style.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: b.space[4],
      }}>
        <Icon size={b.iconSize['2xl']} color={style.iconColor} />
      </div>
      <h3 style={{
        fontSize: b.fontSize.xl,
        fontWeight: b.fontWeight.bold,
        color: b.textMain,
        marginBottom: b.space[3],
      }}>
        {card.title}
      </h3>

      {/* Challenger: Show the argument being questioned */}
      {card.type === 'challenger' && card.argument && (
        <div style={{
          padding: `${b.space[2.5]} ${b.space[3.5]}`,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: b.radius.md,
          marginBottom: b.space[3],
          borderLeft: `3px solid ${style.bulletColor}`,
        }}>
          <span style={{ fontSize: b.fontSize.sm, color: b.textSecondary, display: 'block', marginBottom: '2px' }}>
            Hinterfragtes Argument:
          </span>
          <span style={{ fontSize: b.fontSize.md, fontWeight: b.fontWeight.semibold, color: b.textMain }}>
            "{card.argument}"
          </span>
        </div>
      )}

      {/* Intuition: Show the guiding question */}
      {card.type === 'intuition' && card.question && (
        <div style={{
          padding: `${b.space[2.5]} ${b.space[3.5]}`,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: b.radius.md,
          marginBottom: b.space[3],
          borderLeft: `3px solid ${style.bulletColor}`,
        }}>
          <span style={{ fontSize: b.fontSize.sm, color: b.textSecondary, display: 'block', marginBottom: '2px' }}>
            Reflexionsfrage:
          </span>
          <span style={{ fontSize: b.fontSize.md, fontWeight: b.fontWeight.semibold, color: b.textMain, fontStyle: 'italic' }}>
            {parseMarkdownBold(card.question)}
          </span>
        </div>
      )}

      {/* Structured bullet points */}
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        flex: 1,
      }}>
        {points.map((point, idx) => (
          <li
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: b.space[2.5],
              marginBottom: b.space[2.5],
              fontSize: b.fontSize.md,
              lineHeight: 1.5,
              color: b.textSecondary,
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: b.radius.full,
              backgroundColor: style.bulletColor,
              marginTop: '8px',
              flexShrink: 0,
            }} />
            <span>{parseMarkdownBold(point)}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

/**
 * Rational Score Display
 */
const RationalScoreDisplay = ({ proScore, contraScore, b }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  const dominantSide = proScore > contraScore ? 'pro' : proScore < contraScore ? 'contra' : 'neutral';

  return (
    <Card variant="elevated" padding="lg" style={{ marginBottom: b.space[6] }}>
      <CardHeader>
        <CardTitle icon={Scale} size="lg">
          Rationaler Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: b.space[3],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2] }}>
            <ThumbsUp size={b.iconSize.lg} color={b.success} />
            <span style={{
              fontSize: b.fontSize['4xl'],
              fontWeight: b.fontWeight.bold,
              color: b.success,
            }}>
              {proPercentage}%
            </span>
            <span style={{ color: b.textSecondary, fontSize: b.fontSize.base }}>
              ({proScore} Punkte)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2] }}>
            <span style={{ color: b.textSecondary, fontSize: b.fontSize.base }}>
              ({contraScore} Punkte)
            </span>
            <span style={{
              fontSize: b.fontSize['4xl'],
              fontWeight: b.fontWeight.bold,
              color: b.error,
            }}>
              {contraPercentage}%
            </span>
            <ThumbsDown size={b.iconSize.lg} color={b.error} />
          </div>
        </div>

        {/* Score Bar */}
        <div style={{
          height: '32px',
          borderRadius: b.radius.xl,
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: b.cardBgHover,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${proPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(90deg, ${b.success} 0%, ${b.successDark} 100%)`,
              height: '100%',
            }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${contraPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: `linear-gradient(90deg, ${b.error} 0%, ${b.errorDark} 100%)`,
              height: '100%',
            }}
          />
        </div>

        {/* Summary text */}
        <p style={{
          marginTop: b.space[4],
          textAlign: 'center',
          fontSize: b.fontSize.md,
          color: b.textSecondary,
        }}>
          {dominantSide === 'pro' && (
            <>Die Zahlen sprechen <strong style={{ color: b.success }}>für</strong> deine Entscheidung.</>
          )}
          {dominantSide === 'contra' && (
            <>Die Zahlen sprechen <strong style={{ color: b.error }}>gegen</strong> deine Entscheidung.</>
          )}
          {dominantSide === 'neutral' && (
            <>Die Argumente sind <strong>ausgeglichen</strong> - hier lohnt sich ein genauerer Blick.</>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * DecisionBoardResult - Result Display Component
 */
const DecisionBoardResult = ({
  decisionData,
  analysisResult,
  onStartNew,
  onEditDecision,
}) => {
  const b = useBranding();

  const isLoading = !analysisResult;

  return (
    <div style={{ padding: b.space[6], maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: b.space[8] }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: b.space[4],
        }}>
          <Button
            variant="ghost"
            onClick={onEditDecision}
          >
            <ArrowLeft size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            onClick={onStartNew}
          >
            <RefreshCw size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
            Neue Analyse
          </Button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: b.radius.xl,
            background: b.headerGradient,
            marginBottom: b.space[4],
            boxShadow: b.coloredShadow(b.primaryAccent, 'lg'),
          }}>
            <Sparkles size={b.iconSize['3xl']} color={b.white} />
          </div>
          <h1 style={{
            fontSize: b.fontSize['4xl'],
            fontWeight: b.fontWeight.bold,
            color: b.textMain,
            marginBottom: b.space[2],
          }}>
            Deine Entscheidungsanalyse
          </h1>
          <p style={{
            fontSize: b.fontSize.xl,
            color: b.textSecondary,
            fontStyle: 'italic',
          }}>
            "{decisionData?.topic}"
          </p>
        </div>
      </motion.div>

      {/* Rational Score */}
      {decisionData && (
        <RationalScoreDisplay
          proScore={decisionData.proScore}
          contraScore={decisionData.contraScore}
          b={b}
        />
      )}

      {/* Analysis Summary */}
      {analysisResult?.analysis_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="gradient" padding="lg" style={{ marginBottom: b.space[6] }}>
            <CardContent>
              <p style={{
                fontSize: b.fontSize.lg,
                lineHeight: 1.7,
                color: b.textMain,
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                {analysisResult.analysis_summary}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Coaching Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ marginBottom: b.space[8] }}
      >
        <h2 style={{
          fontSize: b.fontSize['2xl'],
          fontWeight: b.fontWeight.bold,
          color: b.textMain,
          marginBottom: b.space[5],
          display: 'flex',
          alignItems: 'center',
          gap: b.space[2.5],
        }}>
          <Sparkles size={b.iconSize.xl} color={b.primaryAccent} />
          KI-Coaching Impulse
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: b.space[5],
        }}>
          {isLoading ? (
            // Skeleton loaders
            <>
              <CardSkeleton b={b} />
              <CardSkeleton b={b} />
              <CardSkeleton b={b} />
            </>
          ) : (
            // Actual cards
            analysisResult?.cards?.map((card, index) => (
              <CoachingCard key={card.type || index} card={card} index={index} b={b} />
            ))
          )}
        </div>
      </motion.div>

      {/* Decision Arguments Summary */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle icon={Scale} size="md">
            Deine Argumente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: b.space[6],
          }}>
            {/* Pro Arguments */}
            <div>
              <h4 style={{
                fontSize: b.fontSize.lg,
                fontWeight: b.fontWeight.semibold,
                color: b.success,
                marginBottom: b.space[3],
                display: 'flex',
                alignItems: 'center',
                gap: b.space[2],
              }}>
                <ThumbsUp size={b.iconSize.md} />
                Pro ({decisionData?.proScore} Punkte)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {decisionData?.pros?.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      padding: `${b.space[2.5]} ${b.space[3.5]}`,
                      backgroundColor: b.successLight,
                      borderRadius: b.radius.md,
                      marginBottom: b.space[2],
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: b.successDark }}>{item.text}</span>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: b.success,
                      padding: `2px ${b.space[2]}`,
                      borderRadius: b.radius.sm,
                      fontSize: b.fontSize.sm,
                      fontWeight: b.fontWeight.semibold,
                    }}>
                      {item.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contra Arguments */}
            <div>
              <h4 style={{
                fontSize: b.fontSize.lg,
                fontWeight: b.fontWeight.semibold,
                color: b.error,
                marginBottom: b.space[3],
                display: 'flex',
                alignItems: 'center',
                gap: b.space[2],
              }}>
                <ThumbsDown size={b.iconSize.md} />
                Contra ({decisionData?.contraScore} Punkte)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {decisionData?.cons?.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      padding: `${b.space[2.5]} ${b.space[3.5]}`,
                      backgroundColor: b.errorLight,
                      borderRadius: b.radius.md,
                      marginBottom: b.space[2],
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: b.errorDark }}>{item.text}</span>
                    <span style={{
                      backgroundColor: '#fee2e2',
                      color: b.error,
                      padding: `2px ${b.space[2]}`,
                      borderRadius: b.radius.sm,
                      fontSize: b.fontSize.sm,
                      fontWeight: b.fontWeight.semibold,
                    }}>
                      {item.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: b.space[4],
        marginTop: b.space[8],
      }}>
        <Button
          variant="outline"
          size="lg"
          onClick={onEditDecision}
        >
          <Edit3 size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
          Argumente anpassen
        </Button>
        <Button
          variant="solid"
          size="lg"
          onClick={onStartNew}
          style={{
            background: b.headerGradient,
          }}
        >
          <RefreshCw size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
          Neue Entscheidung
        </Button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default DecisionBoardResult;
