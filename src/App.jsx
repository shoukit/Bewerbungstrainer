import React, { useState } from 'react';
import RoleplayDashboard from './components/RoleplayDashboard';
import RoleplaySession from './components/RoleplaySession';
import SessionHistory from './components/SessionHistory';
import SessionDetailView from './components/SessionDetailView';

console.log('📦 [APP] App.jsx module loaded');

// View constants
const VIEWS = {
  DASHBOARD: 'dashboard',
  ROLEPLAY: 'roleplay',
  HISTORY: 'history',
  SESSION_DETAIL: 'session_detail',
};

function App() {
  console.log('🏗️ [APP] App component initialized');

  // Current view state
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});

  // Session history state
  const [selectedSession, setSelectedSession] = useState(null);

  // ===== ROLEPLAY HANDLERS =====
  const handleSelectScenario = (scenario, variables = {}) => {
    console.log('🎭 [APP] Scenario selected:', scenario);
    console.log('🎭 [APP] Variables received:', variables);
    setSelectedScenario(scenario);
    setRoleplayVariables(variables);
    setCurrentView(VIEWS.ROLEPLAY);
  };

  const handleEndRoleplay = () => {
    console.log('🎭 [APP] Roleplay ended - returning to dashboard');
    setSelectedScenario(null);
    setRoleplayVariables({});
    setCurrentView(VIEWS.DASHBOARD);
  };

  // ===== HISTORY HANDLERS =====
  const handleOpenHistory = () => {
    console.log('📜 [APP] Opening session history');
    setCurrentView(VIEWS.HISTORY);
  };

  const handleCloseHistory = () => {
    console.log('📜 [APP] Closing session history');
    setCurrentView(VIEWS.DASHBOARD);
  };

  const handleSelectSession = (session) => {
    console.log('📜 [APP] Session selected:', session.id);
    setSelectedSession(session);
    setCurrentView(VIEWS.SESSION_DETAIL);
  };

  const handleCloseSessionDetail = () => {
    console.log('📜 [APP] Closing session detail');
    setSelectedSession(null);
    setCurrentView(VIEWS.HISTORY);
  };

  // ===== RENDERING =====
  switch (currentView) {
    case VIEWS.ROLEPLAY:
      return (
        <RoleplaySession
          scenario={selectedScenario}
          variables={roleplayVariables}
          onEnd={handleEndRoleplay}
        />
      );

    case VIEWS.HISTORY:
      return (
        <SessionHistory
          onBack={handleCloseHistory}
          onSelectSession={handleSelectSession}
        />
      );

    case VIEWS.SESSION_DETAIL:
      return (
        <SessionDetailView
          session={selectedSession}
          onBack={handleCloseSessionDetail}
        />
      );

    case VIEWS.DASHBOARD:
    default:
      return (
        <RoleplayDashboard
          onSelectScenario={handleSelectScenario}
          onOpenHistory={handleOpenHistory}
        />
      );
  }
}

export default App;
