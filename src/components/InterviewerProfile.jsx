import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

/**
 * Theme colors (slate only - blue/teal from partner branding)
 */
const COLORS = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 500: '#64748b', 600: '#475569', 700: '#334155' },
};

/**
 * InterviewerProfile Component
 * Displays ONLY the collapsible sections (properties, objections, questions)
 * Header is rendered in RoleplaySession.jsx
 */
const InterviewerProfile = ({ profile }) => {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    objections: false,
    questions: false,
  });

  // Partner theming
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const primaryAccentLight = branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'];

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

  const sectionButtonStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: COLORS.slate[50],
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.2s',
  };

  const sectionButtonExpandedStyle = {
    ...sectionButtonStyle,
    backgroundColor: primaryAccentLight,
  };

  const sectionContentStyle = {
    padding: '16px',
    backgroundColor: 'white',
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Properties Section */}
      {properties.length > 0 && (
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('properties')}
            style={expandedSections.properties ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.properties ? primaryAccentLight : COLORS.slate[50]}
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
              <p style={{ fontSize: '14px', color: COLORS.slate[600], lineHeight: 1.6, margin: 0 }}>
                {properties.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Objections Section */}
      {objections.length > 0 && (
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('objections')}
            style={expandedSections.objections ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.objections ? primaryAccentLight : COLORS.slate[50]}
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
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {objections.map((objection, index) => (
                  <li key={index} style={{ fontSize: '14px', color: COLORS.slate[600], display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: '8px' }}>•</span>
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
        <div style={{ border: `1px solid ${COLORS.slate[200]}`, borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => toggleSection('questions')}
            style={expandedSections.questions ? sectionButtonExpandedStyle : sectionButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.slate[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSections.questions ? primaryAccentLight : COLORS.slate[50]}
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
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questions.map((question, index) => (
                  <li key={index} style={{ fontSize: '14px', color: COLORS.slate[600], display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: '8px' }}>•</span>
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
        marginTop: '16px',
        padding: '12px',
        backgroundColor: primaryAccentLight,
        borderRadius: '8px',
        border: `1px solid ${primaryAccent}33`,
      }}>
        <p style={{ fontSize: '12px', color: primaryAccent, textAlign: 'center', margin: 0 }}>
          💡 Für ein optimales Erlebnis empfiehlt sich die Nutzung von Kopfhörern mit Mikrofon.
        </p>
      </div>
    </div>
  );
};

export default InterviewerProfile;
