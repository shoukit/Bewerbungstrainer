/**
 * Centralized Icon Mappings
 *
 * This file consolidates all icon mappings used across the application.
 * Import icons from here instead of defining local ICON_MAP objects.
 */

import {
  FileText,
  Briefcase,
  Banknote,
  Users,
  User,
  MessageCircle,
  Target,
  Award,
  Book,
  ClipboardList,
  Star,
  Lightbulb,
  Shield,
  Compass,
  Rocket,
  Calendar,
  Sparkles,
  Video,
  Mic,
  Play,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Settings,
  Home,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
  Zap,
  Heart,
  ThumbsUp,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Clock,
  Bell,
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Download,
  Upload,
  Share,
  Copy,
  Save,
  Folder,
  File,
  Image,
  Music,
  Film,
  Camera,
  Headphones,
  Volume2,
  VolumeX,
  Wifi,
  Battery,
  Sun,
  Moon,
  Cloud,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Grid,
  List,
  Layout,
  Sidebar,
  Maximize,
  Minimize,
  Terminal,
  Code,
  Database,
  Server,
  Globe,
  Link,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  PenLine,
  Bot,
} from 'lucide-react';

/**
 * Template/Briefing icon mapping
 * Used in: SmartBriefingForm, BriefingWorkbook, SmartBriefingDashboard
 */
export const TEMPLATE_ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
  'user': User,
  'message-circle': MessageCircle,
  'target': Target,
  'award': Award,
  'book': Book,
  'clipboard': ClipboardList,
  'star': Star,
  'lightbulb': Lightbulb,
  'shield': Shield,
  'compass': Compass,
  'rocket': Rocket,
  'calendar': Calendar,
  'sparkles': Sparkles,
  'video': Video,
  'mic': Mic,
  'play': Play,
  'check-circle': CheckCircle,
  'alert-circle': AlertCircle,
  'help-circle': HelpCircle,
  'settings': Settings,
  'home': Home,
  'trending-up': TrendingUp,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'activity': Activity,
  'zap': Zap,
  'heart': Heart,
  'thumbs-up': ThumbsUp,
  'message-square': MessageSquare,
  'mail': Mail,
  'phone': Phone,
  'map-pin': MapPin,
  'clock': Clock,
  'bell': Bell,
  'search': Search,
  'filter': Filter,
  'edit': Edit,
  'trash': Trash2,
  'plus': Plus,
  'minus': Minus,
  'check': Check,
  'x': X,
  'info': Info,
  'warning': AlertTriangle,
  'refresh': RefreshCw,
  'loader': Loader2,
  'globe': Globe,
  'link': Link,
  'bookmark': Bookmark,
  'tag': Tag,
  'code': Code,
  'database': Database,
  'server': Server,
  'pen': PenLine,
  'bot': Bot,
};

/**
 * Briefing-specific icon subset (for SessionHistory)
 * Smaller map for performance in list views
 */
export const BRIEFING_ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
};

/**
 * Get an icon component by name with fallback
 * @param {string} iconName - Icon name (kebab-case)
 * @param {React.ComponentType} fallback - Fallback icon component
 * @returns {React.ComponentType} Icon component
 */
export const getIcon = (iconName, fallback = FileText) => {
  return TEMPLATE_ICON_MAP[iconName] || fallback;
};

/**
 * Get a briefing icon component by name
 * @param {string} iconName - Icon name
 * @returns {React.ComponentType} Icon component
 */
export const getBriefingIcon = (iconName) => {
  return BRIEFING_ICON_MAP[iconName] || FileText;
};

export default TEMPLATE_ICON_MAP;
