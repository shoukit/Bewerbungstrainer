import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';

/**
 * InterviewerProfile Component
 * Displays ONLY the collapsible sections (properties, objections, questions)
 * Header is rendered in RoleplaySession.jsx
 */
const InterviewerProfile = ({ profile, replaceVariables = (text) => text }) => {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    objections: true,
    questions: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!profile || !profile.name) {
    return null;
  }

  // Parse properties (can be line-separated or comma-separated)
  const parseList = (text) => {
    if (!text) return [];
    // Apply variable replacement before parsing
    const replaced = replaceVariables(text);
    return replaced.split(/\n|,/).map(item => item.trim()).filter(Boolean);
  };

  const properties = parseList(profile.properties);
  const objections = parseList(profile.typical_objections);
  const questions = parseList(profile.important_questions);

  return (
    <div className="p-4 flex flex-col gap-2">
      {/* Properties Section */}
      {properties.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('properties')}
            className={`w-full px-4 py-3 border-none cursor-pointer flex items-center justify-between transition-colors ${
              expandedSections.properties ? 'bg-primary/10' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold text-slate-700">Eigenschaften</span>
            {expandedSections.properties ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {expandedSections.properties && (
            <div className="p-4 bg-white">
              <p className="text-sm text-slate-600 leading-relaxed m-0">
                {properties.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Objections Section */}
      {objections.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('objections')}
            className={`w-full px-4 py-3 border-none cursor-pointer flex items-center justify-between transition-colors ${
              expandedSections.objections ? 'bg-primary/10' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold text-slate-700">Typische Einwände</span>
            {expandedSections.objections ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {expandedSections.objections && (
            <div className="p-4 bg-white">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {objections.map((objection, index) => (
                  <li key={index} className="text-sm text-slate-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{objection}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Questions Section */}
      {questions.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('questions')}
            className={`w-full px-4 py-3 border-none cursor-pointer flex items-center justify-between transition-colors ${
              expandedSections.questions ? 'bg-primary/10' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <span className="font-semibold text-slate-700">Wichtige Fragen</span>
            {expandedSections.questions ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          {expandedSections.questions && (
            <div className="p-4 bg-white">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {questions.map((question, index) => (
                  <li key={index} className="text-sm text-slate-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Microphone Tip */}
      <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-xs text-primary text-center m-0">
          💡 Für ein optimales Erlebnis empfiehlt sich die Nutzung von Kopfhörern mit Mikrofon.
        </p>
      </div>
    </div>
  );
};

export default InterviewerProfile;
