import React from 'react';
import { MessageSquare } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';

/**
 * RoleplayDeviceSetup Component
 *
 * Wraps DeviceSetupPage for Live-Simulationen.
 * Provides microphone selection before starting the roleplay session.
 */
const RoleplayDeviceSetup = ({
  scenario,
  onBack,
  onStart,
}) => {
  const handleStart = ({ selectedMicrophoneId }) => {
    onStart({
      selectedMicrophoneId,
    });
  };

  // Get interviewer name for button label
  const interviewerName = scenario?.interviewer_profile?.name;
  const startLabel = interviewerName
    ? `${interviewerName} anrufen`
    : 'Gespräch starten';

  return (
    <DeviceSetupPage
      mode="audio"
      scenario={scenario}
      onBack={onBack}
      onStart={handleStart}
      title={scenario?.title}
      startButtonLabel={startLabel}
      icon={MessageSquare}
    />
  );
};

export default RoleplayDeviceSetup;
