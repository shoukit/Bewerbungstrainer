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

/**
 * Skeleton Loader for AI Cards
 */
const CardSkeleton = () => (
  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
    <div className="w-12 h-12 rounded-lg bg-slate-200 mb-4 animate-pulse" />
    <div className="w-3/5 h-6 rounded-md bg-slate-200 mb-3 animate-pulse" />
    <div className="w-full h-4 rounded-sm bg-slate-200 mb-2 animate-pulse" />
    <div className="w-5/6 h-4 rounded-sm bg-slate-200 animate-pulse" />
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
const CoachingCard = ({ card, index }) => {
  const cardStyles = {
    blind_spot: {
      bgClass: 'bg-yellow-50',
      borderClass: 'border-yellow-400',
      iconBgClass: 'bg-yellow-200',
      iconColorClass: 'text-yellow-700',
      bulletColorClass: 'bg-yellow-700',
      icon: Lightbulb,
    },
    challenger: {
      bgClass: 'bg-red-50',
      borderClass: 'border-red-300',
      iconBgClass: 'bg-red-50',
      iconColorClass: 'text-red-600',
      bulletColorClass: 'bg-red-600',
      icon: Flame,
    },
    intuition: {
      bgClass: 'bg-purple-50',
      borderClass: 'border-purple-300',
      iconBgClass: 'bg-purple-100',
      iconColorClass: 'text-purple-700',
      bulletColorClass: 'bg-purple-700',
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
      className={`p-6 rounded-xl ${style.bgClass} border-2 ${style.borderClass} h-full flex flex-col`}
    >
      <div className={`w-12 h-12 rounded-lg ${style.iconBgClass} flex items-center justify-center mb-4`}>
        <Icon size={28} className={style.iconColorClass} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">
        {card.title}
      </h3>

      {/* Challenger: Show the argument being questioned */}
      {card.type === 'challenger' && card.argument && (
        <div className={`py-2.5 px-3.5 bg-white/60 rounded-md mb-3 border-l-[3px] ${style.borderClass}`}>
          <span className="text-sm text-slate-600 block mb-0.5">
            Hinterfragtes Argument:
          </span>
          <span className="text-base font-semibold text-slate-800">
            "{card.argument}"
          </span>
        </div>
      )}

      {/* Intuition: Show the guiding question */}
      {card.type === 'intuition' && card.question && (
        <div className={`py-2.5 px-3.5 bg-white/60 rounded-md mb-3 border-l-[3px] ${style.borderClass}`}>
          <span className="text-sm text-slate-600 block mb-0.5">
            Reflexionsfrage:
          </span>
          <span className="text-base font-semibold text-slate-800 italic">
            {parseMarkdownBold(card.question)}
          </span>
        </div>
      )}

      {/* Structured bullet points */}
      <ul className="list-none p-0 m-0 flex-1">
        {points.map((point, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 mb-2.5 text-base leading-relaxed text-slate-600"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.bulletColorClass} mt-2 shrink-0`} />
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
const RationalScoreDisplay = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  const dominantSide = proScore > contraScore ? 'pro' : proScore < contraScore ? 'contra' : 'neutral';

  return (
    <Card variant="elevated" padding="lg" className="mb-6">
      <CardHeader>
        <CardTitle icon={Scale} size="lg">
          Rationaler Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-3">
          <div className="flex items-center gap-2">
            <ThumbsUp size={20} className="text-green-600" />
            <span className="text-4xl font-bold text-green-600">
              {proPercentage}%
            </span>
            <span className="text-slate-600 text-base">
              ({proScore} Punkte)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-base">
              ({contraScore} Punkte)
            </span>
            <span className="text-4xl font-bold text-red-600">
              {contraPercentage}%
            </span>
            <ThumbsDown size={20} className="text-red-600" />
          </div>
        </div>

        {/* Score Bar */}
        <div className="h-8 rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${proPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-gradient-to-r from-green-500 to-green-600 h-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${contraPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-gradient-to-r from-red-500 to-red-600 h-full"
          />
        </div>

        {/* Summary text */}
        <p className="mt-4 text-center text-base text-slate-600">
          {dominantSide === 'pro' && (
            <>Die Zahlen sprechen <strong className="text-green-600">für</strong> deine Entscheidung.</>
          )}
          {dominantSide === 'contra' && (
            <>Die Zahlen sprechen <strong className="text-red-600">gegen</strong> deine Entscheidung.</>
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
  const isLoading = !analysisResult;

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={onEditDecision}
          >
            <ArrowLeft size={18} className="mr-2" />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            onClick={onStartNew}
          >
            <RefreshCw size={18} className="mr-2" />
            Neue Analyse
          </Button>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-brand-gradient mb-4 shadow-lg">
            <Sparkles size={32} color="white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Deine Entscheidungsanalyse
          </h1>
          <p className="text-xl text-slate-600 italic">
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
          <Card variant="gradient" padding="lg" className="mb-6">
            <CardContent>
              <p className="text-lg leading-relaxed text-slate-800 text-center italic">
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
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-5 flex items-center gap-2.5">
          <Sparkles size={24} className="text-primary" />
          KI-Coaching Impulse
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {/* Pro Arguments */}
            <div>
              <h4 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                <ThumbsUp size={18} />
                Pro ({decisionData?.proScore} Punkte)
              </h4>
              <ul className="list-none p-0 m-0">
                {decisionData?.pros?.map((item, index) => (
                  <li
                    key={item.id || index}
                    className="py-2.5 px-3.5 bg-green-50 rounded-md mb-2 flex justify-between items-center"
                  >
                    <span className="text-green-800">{item.text}</span>
                    <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-sm text-sm font-semibold">
                      {item.weight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contra Arguments */}
            <div>
              <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                <ThumbsDown size={18} />
                Contra ({decisionData?.contraScore} Punkte)
              </h4>
              <ul className="list-none p-0 m-0">
                {decisionData?.cons?.map((item, index) => (
                  <li
                    key={item.id || index}
                    className="py-2.5 px-3.5 bg-red-50 rounded-md mb-2 flex justify-between items-center"
                  >
                    <span className="text-red-800">{item.text}</span>
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-sm text-sm font-semibold">
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
      <div className="flex justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={onEditDecision}
        >
          <Edit3 size={18} className="mr-2" />
          Argumente anpassen
        </Button>
        <Button
          variant="solid"
          size="lg"
          onClick={onStartNew}
          className="bg-brand-gradient"
        >
          <RefreshCw size={18} className="mr-2" />
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
