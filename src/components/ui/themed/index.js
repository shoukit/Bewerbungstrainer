/**
 * Themed Components - Partner-branded UI components
 *
 * These components automatically apply partner branding via CSS variables.
 * Use these instead of raw HTML elements for consistent styling across the app.
 *
 * @example
 * import { Card, Button, Input, Badge } from '@/components/ui/themed';
 *
 * <Card>
 *   <Card.Header gradient>
 *     <Card.Title>Welcome</Card.Title>
 *   </Card.Header>
 *   <Card.Body>
 *     <Input label="Name" />
 *     <Button>Submit</Button>
 *   </Card.Body>
 * </Card>
 */

// Card components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  CardActions,
} from './Card';

// Button components
export {
  Button,
  IconButton,
  ButtonGroup,
} from './Button';

// Input components
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  FormGroup,
  InputWrapper,
} from './Input';

// Badge components
export {
  Badge,
  StatusBadge,
  ScoreBadge,
} from './Badge';
