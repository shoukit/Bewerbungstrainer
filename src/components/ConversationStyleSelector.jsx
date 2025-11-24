import React from 'react';
import { Smile, Search, FileText } from 'lucide-react';

/**
 * ConversationStyleSelector Component
 *
 * Reusable component for selecting conversation style (friendly, critical, professional)
 * Used in both the wizard and during active conversations
 */
const CONVERSATION_STYLES = [
  {
    id: 'friendly',
    label: 'Freundlich',
    icon: Smile,
    description: 'Ermutigendes, unterstützendes Gespräch',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    hoverBorder: 'hover:border-green-400',
    selectedBorder: 'border-green-500',
    iconColor: 'text-green-600',
    emoji: '😊'
  },
  {
    id: 'critical',
    label: 'Kritisch',
    icon: Search,
    description: 'Anspruchsvolle, herausfordernde Fragen',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    hoverBorder: 'hover:border-orange-400',
    selectedBorder: 'border-orange-500',
    iconColor: 'text-orange-600',
    emoji: '🔍'
  },
  {
    id: 'professional',
    label: 'Sachlich',
    icon: FileText,
    description: 'Professionell, neutral, strukturiert',
    gradient: 'from-ocean-blue-500 to-ocean-deep-600',
    bgGradient: 'from-ocean-blue-50 to-ocean-deep-50',
    borderColor: 'border-ocean-blue-200',
    hoverBorder: 'hover:border-ocean-blue-400',
    selectedBorder: 'border-ocean-blue-500',
    iconColor: 'text-ocean-blue-600',
    emoji: '📋'
  }
];

function ConversationStyleSelector({
  selectedStyle,
  onStyleChange,
  compact = false,
  className = ''
}) {
  if (compact) {
    // Compact version for active conversation
    return (
      <div className={`flex gap-2 ${className}`}>
        {CONVERSATION_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;

          return (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={`
                flex-1 px-3 py-2 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? `${style.selectedBorder} bg-gradient-to-br ${style.bgGradient}`
                  : `${style.borderColor} ${style.hoverBorder} bg-white hover:bg-gradient-to-br hover:${style.bgGradient}`
                }
              `}
              title={style.description}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? style.iconColor : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? style.iconColor : 'text-slate-600'}`}>
                  {style.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Full version for wizard
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {CONVERSATION_STYLES.map((style) => {
        const Icon = style.icon;
        const isSelected = selectedStyle === style.id;

        return (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`
              relative p-6 rounded-2xl border-3 transition-all duration-300 transform
              ${isSelected
                ? `${style.selectedBorder} shadow-xl scale-105 bg-gradient-to-br ${style.bgGradient}`
                : `${style.borderColor} ${style.hoverBorder} bg-white hover:shadow-lg hover:scale-102 hover:bg-gradient-to-br hover:${style.bgGradient}`
              }
            `}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className={`
              w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
              ${isSelected ? `bg-gradient-to-br ${style.gradient} shadow-lg` : 'bg-slate-100'}
            `}>
              <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-slate-400'}`} strokeWidth={2} />
            </div>

            {/* Title */}
            <h3 className={`text-xl font-bold text-center mb-2 ${isSelected ? style.iconColor : 'text-slate-700'}`}>
              <span className="mr-2">{style.emoji}</span>
              {style.label}
            </h3>

            {/* Description */}
            <p className={`text-sm text-center ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
              {style.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export default ConversationStyleSelector;
export { CONVERSATION_STYLES };
