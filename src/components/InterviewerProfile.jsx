import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';

/**
 * InterviewerProfile Component
 * Displays the interviewer's profile with collapsible sections
 */
const InterviewerProfile = ({ profile }) => {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    objections: false,
    questions: false,
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
    return text.split(/\n|,/).map(item => item.trim()).filter(Boolean);
  };

  const properties = parseList(profile.properties);
  const objections = parseList(profile.typical_objections);
  const questions = parseList(profile.important_questions);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header with Avatar */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-6 text-center">
        <div className="flex justify-center mb-4">
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
              <User className="w-12 h-12 text-slate-400" />
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{profile.name}</h3>
        {profile.role && (
          <p className="text-blue-100 text-sm font-medium">{profile.role}</p>
        )}
      </div>

      {/* Collapsible Sections */}
      <div className="p-4 space-y-2">
        {/* Properties Section */}
        {properties.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('properties')}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
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
                <p className="text-sm text-slate-600 leading-relaxed">
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
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
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
                <ul className="space-y-2">
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
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
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
                <ul className="space-y-2">
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
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 text-center">
            💡 Für ein optimales Erlebnis empfiehlt sich die Nutzung von Kopfhörern mit Mikrofon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewerProfile;
