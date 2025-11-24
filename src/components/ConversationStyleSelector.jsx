import React from 'react';
import { Smile, Search, FileText } from 'lucide-react';

/**
 * ConversationStyleSelector Component
 *
 * Reusable component for selecting conversation style (friendly, critical, professional)
 * Used in both the wizard and during active conversations
 *
 * Design follows KarriereHeld Styleguide:
 * - Colors: Blue 600 (Primary), Green 500 (Success), Slate (Neutrals)
 * - Rounded: 2xl for buttons, 3xl for cards
 * - Shadows: Colored shadows (shadow-blue-500/30)
 */
const CONVERSATION_STYLES = [
  {
    id: 'friendly',
    label: 'Freundlich',
    icon: Smile,
    description: 'Ermutigendes, unterstützendes Gespräch',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-slate-200',
    hoverBorder: 'hover:border-green-500',
    selectedBorder: 'border-green-500',
    iconColor: 'text-green-600',
    shadowColor: 'shadow-green-500/30',
    emoji: '😊'
  },
  {
    id: 'critical',
    label: 'Kritisch',
    icon: Search,
    description: 'Anspruchsvolle, herausfordernde Fragen',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-slate-200',
    hoverBorder: 'hover:border-orange-500',
    selectedBorder: 'border-orange-500',
    iconColor: 'text-orange-600',
    shadowColor: 'shadow-orange-500/30',
    emoji: '🔍'
  },
  {
    id: 'professional',
    label: 'Sachlich',
    icon: FileText,
    description: 'Professionell, neutral, strukturiert',
    gradient: 'from-blue-600 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-slate-200',
    hoverBorder: 'hover:border-blue-600',
    selectedBorder: 'border-blue-600',
    iconColor: 'text-blue-600',
    shadowColor: 'shadow-blue-500/30',
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
    // Compact version for active conversation (Styleguide: Buttons use rounded-2xl)
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
                flex-1 px-3 py-2 rounded-2xl border-2 transition-all duration-200 font-bold
                ${isSelected
                  ? `${style.selectedBorder} bg-gradient-to-br ${style.bgGradient} shadow-lg ${style.shadowColor}`
                  : `${style.borderColor} ${style.hoverBorder} bg-white hover:bg-slate-50 hover:shadow-md`
                }
              `}
              title={style.description}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? style.iconColor : 'text-slate-400'}`} strokeWidth={2} />
                <span className={`text-sm ${isSelected ? style.iconColor : 'text-slate-700'}`}>
                  {style.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Full version for wizard (Styleguide: Cards use rounded-3xl, shadow-xl, hover:-translate-y-2)
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}>
      {CONVERSATION_STYLES.map((style) => {
        const Icon = style.icon;
        const isSelected = selectedStyle === style.id;

        return (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`
              relative p-8 rounded-3xl border-2 transition-all duration-300 group
              ${isSelected
                ? `${style.selectedBorder} shadow-xl ${style.shadowColor} bg-gradient-to-br ${style.bgGradient} -translate-y-2`
                : `${style.borderColor} bg-white hover:shadow-lg hover:-translate-y-2 hover:${style.hoverBorder}`
              }
            `}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-4 right-4">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className={`
              w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300
              ${isSelected
                ? `bg-gradient-to-br ${style.gradient} ${style.shadowColor}`
                : 'bg-slate-100 group-hover:scale-110'
              }
            `}>
              <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-slate-400'}`} strokeWidth={2} />
            </div>

            {/* Title */}
            <h3 className={`text-xl font-bold text-center mb-3 ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>
              <span className="mr-2">{style.emoji}</span>
              {style.label}
            </h3>

            {/* Description */}
            <p className={`text-sm text-center leading-relaxed ${isSelected ? 'text-slate-600' : 'text-slate-600'}`}>
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
