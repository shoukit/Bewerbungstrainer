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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePartner } from '@/context/PartnerContext';

/**
 * Skeleton Loader for AI Cards
 */
const CardSkeleton = () => (
  <div style={{
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: '#e2e8f0',
      marginBottom: '16px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '60%',
      height: '24px',
      borderRadius: '8px',
      backgroundColor: '#e2e8f0',
      marginBottom: '12px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '100%',
      height: '16px',
      borderRadius: '6px',
      backgroundColor: '#e2e8f0',
      marginBottom: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      width: '85%',
      height: '16px',
      borderRadius: '6px',
      backgroundColor: '#e2e8f0',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  </div>
);

/**
 * AI Coaching Card Component
 * Renders structured content with bullet points
 */
const CoachingCard = ({ card, index }) => {
  const cardStyles = {
    blind_spot: {
      bgColor: '#fefce8',
      borderColor: '#fde047',
      iconBg: '#fef08a',
      iconColor: '#ca8a04',
      bulletColor: '#ca8a04',
      icon: Lightbulb,
    },
    challenger: {
      bgColor: '#fef2f2',
      borderColor: '#fca5a5',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      bulletColor: '#dc2626',
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
        padding: '24px',
        borderRadius: '16px',
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
        borderRadius: '12px',
        backgroundColor: style.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Icon size={24} color={style.iconColor} />
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '12px',
      }}>
        {card.title}
      </h3>

      {/* Challenger: Show the argument being questioned */}
      {card.type === 'challenger' && card.argument && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: `3px solid ${style.bulletColor}`,
        }}>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
            Hinterfragtes Argument:
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
            "{card.argument}"
          </span>
        </div>
      )}

      {/* Intuition: Show the guiding question */}
      {card.type === 'intuition' && card.question && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: `3px solid ${style.bulletColor}`,
        }}>
          <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
            Reflexionsfrage:
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', fontStyle: 'italic' }}>
            {card.question}
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
              gap: '10px',
              marginBottom: '10px',
              fontSize: '15px',
              lineHeight: 1.5,
              color: '#475569',
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: style.bulletColor,
              marginTop: '8px',
              flexShrink: 0,
            }} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

/**
 * Rational Score Display
 */
const RationalScoreDisplay = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  const dominantSide = proScore > contraScore ? 'pro' : proScore < contraScore ? 'contra' : 'neutral';

  return (
    <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
      <CardHeader>
        <CardTitle icon={Scale} size="lg">
          Rationaler Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThumbsUp size={20} color="#16a34a" />
            <span style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#16a34a',
            }}>
              {proPercentage}%
            </span>
            <span style={{ color: '#64748b', fontSize: '14px' }}>
              ({proScore} Punkte)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>
              ({contraScore} Punkte)
            </span>
            <span style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#dc2626',
            }}>
              {contraPercentage}%
            </span>
            <ThumbsDown size={20} color="#dc2626" />
          </div>
        </div>

        {/* Score Bar */}
        <div style={{
          height: '32px',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: '#f1f5f9',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${proPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              height: '100%',
            }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${contraPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              height: '100%',
            }}
          />
        </div>

        {/* Summary text */}
        <p style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '15px',
          color: '#475569',
        }}>
          {dominantSide === 'pro' && (
            <>Die Zahlen sprechen <strong style={{ color: '#16a34a' }}>für</strong> deine Entscheidung.</>
          )}
          {dominantSide === 'contra' && (
            <>Die Zahlen sprechen <strong style={{ color: '#dc2626' }}>gegen</strong> deine Entscheidung.</>
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
  const { branding } = usePartner();
  const primaryColor = branding?.['--primary-accent'] || '#4A9EC9';

  const isLoading = !analysisResult;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <Button
            variant="ghost"
            onClick={onEditDecision}
          >
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            onClick={onStartNew}
          >
            <RefreshCw size={18} style={{ marginRight: '8px' }} />
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
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`,
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
          }}>
            <Sparkles size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px',
          }}>
            Deine Entscheidungsanalyse
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
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
        />
      )}

      {/* Analysis Summary */}
      {analysisResult?.analysis_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="gradient" padding="lg" style={{ marginBottom: '24px' }}>
            <CardContent>
              <p style={{
                fontSize: '17px',
                lineHeight: 1.7,
                color: '#334155',
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
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Sparkles size={22} color={primaryColor} />
          KI-Coaching Impulse
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {isLoading ? (
            // Skeleton loaders
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            // Actual cards
            analysisResult?.cards?.map((card, index) => (
              <CoachingCard key={card.type || index} card={card} index={index} />
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
            gap: '24px',
          }}>
            {/* Pro Arguments */}
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#16a34a',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <ThumbsUp size={18} />
                Pro ({decisionData?.proScore} Punkte)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {decisionData?.pros?.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#15803d' }}>{item.text}</span>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
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
                fontSize: '16px',
                fontWeight: 600,
                color: '#dc2626',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <ThumbsDown size={18} />
                Contra ({decisionData?.contraScore} Punkte)
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {decisionData?.cons?.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#b91c1c' }}>{item.text}</span>
                    <span style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
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
        gap: '16px',
        marginTop: '32px',
      }}>
        <Button
          variant="outline"
          size="lg"
          onClick={onEditDecision}
        >
          <Edit3 size={18} style={{ marginRight: '8px' }} />
          Argumente anpassen
        </Button>
        <Button
          variant="solid"
          size="lg"
          onClick={onStartNew}
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`,
          }}
        >
          <RefreshCw size={18} style={{ marginRight: '8px' }} />
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
