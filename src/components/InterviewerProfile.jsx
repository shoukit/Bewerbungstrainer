import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * InterviewerProfile Component
 * Displays ONLY the collapsible sections (properties, objections, questions)
 * Header is rendered in RoleplaySession.jsx
 */
const InterviewerProfile = ({ profile, replaceVariables = (text) => text }) => {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    objections: false,
    questions: false,
  });

  // Partner theming
  const b = useBranding();

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

  const sectionButtonStyle = {
    width: '100%',
    padding: `${b.space[3]} ${b.space[4]}`,
    backgroundColor: COLORS.slate[50],
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: `background-color ${b.transition.normal}`,
  };

  const sectionButtonExpandedStyle = {
    ...sectionButtonStyle,
    backgroundColor: b.primaryAccentLight,
  };

  const sectionContentStyle = {
    padding: b.space[4],
    backgroundColor: 'white',
  };

  return (
    <div style={{ padding: b.space[4], display: 'flex', flexDirection: 'column', gap: b.space[2] }}>
      {/* Properties Section */}
      {properties.length > 0 && (
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: b.radius.lg, overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('properties')}
            style={expandedSections.properties ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.properties ? b.primaryAccentLight : COLORS.slate[50]}
          >
            <span style={{ fontWeight: 600, color: COLORS.slate[700] }}>Eigenschaften</span>
            {expandedSections.properties ? (
              <ChevronUp style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            ) : (
              <ChevronDown style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            )}
          </button>
          {expandedSections.properties && (
            <div style={sectionContentStyle}>
              <p style={{ fontSize: b.fontSize.sm, color: COLORS.slate[600], lineHeight: 1.6, margin: 0 }}>
                {properties.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Objections Section */}
      {objections.length > 0 && (
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: b.radius.lg, overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('objections')}
            style={expandedSections.objections ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.objections ? b.primaryAccentLight : COLORS.slate[50]}
          >
            <span style={{ fontWeight: 600, color: COLORS.slate[700] }}>Typische Einwände</span>
            {expandedSections.objections ? (
              <ChevronUp style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            ) : (
              <ChevronDown style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            )}
          </button>
          {expandedSections.objections && (
            <div style={sectionContentStyle}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: b.space[2] }}>
                {objections.map((objection, index) => (
                  <li key={index} style={{ fontSize: b.fontSize.sm, color: COLORS.slate[600], display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: b.space[2] }}>•</span>
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
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: b.radius.lg, overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('questions')}
            style={expandedSections.questions ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.questions ? b.primaryAccentLight : COLORS.slate[50]}
          >
            <span style={{ fontWeight: 600, color: COLORS.slate[700] }}>Wichtige Fragen</span>
            {expandedSections.questions ? (
              <ChevronUp style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            ) : (
              <ChevronDown style={{ width: '20px', height: '20px', color: COLORS.slate[500] }} />
            )}
          </button>
          {expandedSections.questions && (
            <div style={sectionContentStyle}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: b.space[2] }}>
                {questions.map((question, index) => (
                  <li key={index} style={{ fontSize: b.fontSize.sm, color: COLORS.slate[600], display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: b.space[2] }}>•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Microphone Tip */}
      <div style={{
        marginTop: b.space[4],
        padding: b.space[3],
        backgroundColor: b.primaryAccentLight,
        borderRadius: b.radius.lg,
        border: `1px solid ${b.primaryAccent}33`,
      }}>
        <p style={{ fontSize: b.fontSize.xs, color: b.primaryAccent, textAlign: 'center', margin: 0 }}>
          💡 Für ein optimales Erlebnis empfiehlt sich die Nutzung von Kopfhörern mit Mikrofon.
        </p>
      </div>
    </div>
  );
};

export default InterviewerProfile;
