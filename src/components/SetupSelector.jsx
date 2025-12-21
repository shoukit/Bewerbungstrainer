import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';

/**
 * SetupSelector - Allows users to select their training setup/focus area
 * Shows available setups and the currently selected one
 */
const SetupSelector = ({ compact = false }) => {
  const {
    selectedSetup,
    currentSetup,
    setSelectedSetup,
    clearSelectedSetup,
    availableSetups,
  } = usePartner();

  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (setupId) => {
    setSelectedSetup(setupId);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    clearSelectedSetup();
  };

  // Compact mode - just a dropdown button
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          {currentSetup ? (
            <>
              <span>{currentSetup.icon}</span>
              <span className="text-sm font-medium text-gray-700">{currentSetup.name}</span>
              <button
                onClick={handleClear}
                className="ml-1 p-0.5 hover:bg-gray-100 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-500">Setup wählen...</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="p-2">
                {availableSetups.map((setup) => (
                  <button
                    key={setup.id}
                    onClick={() => handleSelect(setup.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedSetup === setup.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{setup.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{setup.name}</div>
                      <div className="text-xs text-gray-500 truncate">{setup.focus}</div>
                    </div>
                    {selectedSetup === setup.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Full mode - Grid of setup cards
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Wähle dein Trainings-Setup
        </h2>
        <p className="text-gray-600 text-sm">
          Je nach Fokus werden dir die passenden Szenarien angezeigt
        </p>
      </div>

      {/* Current Selection Banner */}
      {currentSetup && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border-2"
          style={{
            backgroundColor: `${currentSetup.color}10`,
            borderColor: `${currentSetup.color}40`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentSetup.icon}</span>
              <div>
                <div className="font-bold text-gray-900">{currentSetup.name}</div>
                <div className="text-sm text-gray-600">{currentSetup.description}</div>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Setup wechseln
            </button>
          </div>
        </motion.div>
      )}

      {/* Setup Grid */}
      {!currentSetup && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableSetups.map((setup, index) => (
            <motion.button
              key={setup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(setup.id)}
              className="group relative p-5 bg-white border-2 border-gray-100 rounded-xl text-left hover:border-gray-200 hover:shadow-lg transition-all duration-200"
              style={{
                '--setup-color': setup.color,
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${setup.color}15`,
                }}
              >
                {setup.icon}
              </div>

              {/* Content */}
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-gray-900">
                {setup.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {setup.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: `${setup.color}15`,
                    color: setup.color,
                  }}
                >
                  {setup.focus}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {setup.targetGroup}
                </span>
              </div>

              {/* Hover indicator */}
              <div
                className="absolute inset-x-0 bottom-0 h-1 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: setup.color }}
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* All Scenarios Option */}
      {!currentSetup && (
        <div className="mt-6 text-center">
          <button
            onClick={() => clearSelectedSetup()}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Alle Szenarien anzeigen (kein Setup)
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupSelector;
