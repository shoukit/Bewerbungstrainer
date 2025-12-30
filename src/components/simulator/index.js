/**
 * Simulator Components Index
 *
 * Exports all components for the Skill Simulator feature
 */

// Main components
export { default as SimulatorApp } from './SimulatorApp';
export { default as SimulatorDashboard } from './SimulatorDashboard';
export { default as SimulatorWizard } from './SimulatorWizard';
export { default as SimulatorSession } from './SimulatorSession';
export { default as ImmediateFeedback } from './ImmediateFeedback';
export { default as SessionComplete } from './SessionComplete';

// Session sub-components (extracted from SimulatorSession)
export { default as QuestionTips } from './QuestionTips';
export { default as SessionTimer } from './SessionTimer';
export { default as SimulatorAudioRecorder } from './SimulatorAudioRecorder';
export { default as PreSessionView } from './PreSessionView';
export { CompleteConfirmDialog, CancelConfirmDialog } from './ConfirmationDialogs';
