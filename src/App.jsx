import React, { useState } from 'react';
import RoleplayDashboard from './components/RoleplayDashboard';
import RoleplaySession from './components/RoleplaySession';

console.log('📦 [APP] App.jsx module loaded');

function App() {
  console.log('🏗️ [APP] App component initialized');

  // Roleplay state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [roleplayVariables, setRoleplayVariables] = useState({});

  // ===== ROLEPLAY HANDLERS =====
  const handleSelectScenario = (scenario, variables = {}) => {
    console.log('🎭 [APP] Scenario selected:', scenario);
    console.log('🎭 [APP] Variables received:', variables);
    setSelectedScenario(scenario);
    setRoleplayVariables(variables);
  };

  const handleEndRoleplay = () => {
    console.log('🎭 [APP] Roleplay ended - returning to dashboard');
    setSelectedScenario(null);
    setRoleplayVariables({});
  };

  // ===== RENDERING =====
  if (selectedScenario) {
    // Show active roleplay session
    return (
      <RoleplaySession
        scenario={selectedScenario}
        variables={roleplayVariables}
        onEnd={handleEndRoleplay}
      />
    );
  } else {
    // Show roleplay dashboard (scenario selection)
    return (
      <RoleplayDashboard
        onSelectScenario={handleSelectScenario}
      />
    );
  }
}

export default App;
