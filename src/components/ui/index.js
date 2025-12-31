/**
 * UI Components - Unified export for all UI components
 *
 * WICHTIG: Bevorzugt `themed/` Komponenten für neuen Code!
 *
 * Beispiel:
 * ```jsx
 * import { Button, Card, Input, Dialog, Badge } from '@/components/ui';
 *
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Titel</Card.Title>
 *   </Card.Header>
 *   <Card.Body>
 *     <Input label="Name" />
 *     <Button>Absenden</Button>
 *   </Card.Body>
 * </Card>
 * ```
 */

// =============================================================================
// THEMED COMPONENTS (Partner-branded, CSS-Klassen-basiert)
// Bevorzugt für neuen Code!
// =============================================================================

// Card & Layout
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  CardActions,
} from './themed/Card';

// Buttons
export {
  Button,
  IconButton,
  ButtonGroup,
} from './themed/Button';

// Form Elements
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  FormGroup,
  InputWrapper,
} from './themed/Input';

// Badges
export {
  Badge,
  StatusBadge,
  ScoreBadge,
} from './themed/Badge';

// Dialogs
export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  ConfirmDialog,
} from './themed/Dialog';

// =============================================================================
// COMPOSITE COMPONENTS (Feature-spezifisch)
// =============================================================================

export { default as ScenarioDashboard } from './composite/ScenarioDashboard';
export { default as ScenarioCard } from './composite/ScenarioCard';
export { default as ConfirmationDialog } from './composite/ConfirmationDialog';
export { default as ConfirmDeleteDialog } from './composite/ConfirmDeleteDialog';
export { default as DynamicFormField } from './composite/DynamicFormField';
export { default as ErrorState } from './composite/ErrorState';
export { default as StatusBanner } from './composite/StatusBanner';
export { default as Accordion } from './composite/Accordion';
export { default as Timer } from './composite/Timer';
export { default as AudioVisualizer } from './composite/AudioVisualizer';
export { default as VideoRecorder } from './composite/VideoRecorder';
export { default as MobileFilterSheet } from './composite/MobileFilterSheet';
export { ProgressBar } from './composite/progress-bar';
export { FullscreenLoader } from './composite/fullscreen-loader';
export { FeedbackTip } from './composite/feedback-tip';

// =============================================================================
// BASE COMPONENTS (Legacy - für Radix UI Dialog etc.)
// Nur verwenden wenn themed/ keine Alternative hat
// =============================================================================

// Radix-based Dialog (für komplexe Dialog-Patterns)
export {
  Dialog as RadixDialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
} from './base/dialog';

// Label (noch nicht in themed/)
export { Label } from './base/label';

// Skeleton Loading Components
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonGrid,
  SkeletonListItem,
  SkeletonList,
  SkeletonHeader,
  SkeletonStats,
  SkeletonAudioPlayer,
  SkeletonPage,
} from './base/skeleton';

// Form Accordion
export { default as FormAccordion } from './base/form-accordion';

// Select Native
export { default as SelectNative } from './base/select-native';

// =============================================================================
// SIDEBAR
// =============================================================================

export { default as Sidebar } from './sidebar/Sidebar';
