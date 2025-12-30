import React, { useState, useRef } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
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
  Sparkles,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';

/**
 * Icon mapping for template icons
 */
const ICON_MAP = {
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
};

/**
 * Simple Markdown Renderer
 * Renders basic markdown elements
 */
const MarkdownContent = ({ content }) => {
  if (!content) return null;

  // Process markdown content
  const renderMarkdown = (text) => {
    // Split into lines for processing
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="my-3 pl-6 list-none"
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                className="mb-2 text-[15px] leading-relaxed text-gray-700 relative pl-5"
              >
                <span className="absolute left-0 text-primary font-bold">
                  {listType === 'number' ? `${idx + 1}.` : '•'}
                </span>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Headers
      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3
            key={`h3-${index}`}
            className={`text-lg font-bold text-slate-900 my-6 mb-3 pt-4 flex items-center gap-2 ${
              index > 0 ? 'border-t border-slate-100' : ''
            }`}
          >
            {renderInlineMarkdown(trimmedLine.substring(4))}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-xl font-bold text-slate-900 my-7 mb-3.5"
          >
            {renderInlineMarkdown(trimmedLine.substring(3))}
          </h2>
        );
        return;
      }

      if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1
            key={`h1-${index}`}
            className="text-2xl font-bold text-slate-900 my-8 mb-4"
          >
            {renderInlineMarkdown(trimmedLine.substring(2))}
          </h1>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(trimmedLine.substring(2));
        return;
      }

      // Numbered list
      const numberMatch = trimmedLine.match(/^(\d+)\.\s/);
      if (numberMatch) {
        if (listType !== 'number') {
          flushList();
          listType = 'number';
        }
        currentList.push(trimmedLine.substring(numberMatch[0].length));
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={`p-${index}`}
          className="my-3 text-[15px] leading-relaxed text-gray-700"
        >
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    // Flush remaining list
    flushList();

    return elements;
  };

  // Render inline markdown (bold, italic, code)
  const renderInlineMarkdown = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic: *text* or _text_
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
      // Code: `text`
      const codeMatch = remaining.match(/`([^`]+)`/);

      // Find the earliest match
      const matches = [
        { match: boldMatch, type: 'bold' },
        { match: italicMatch, type: 'italic' },
        { match: codeMatch, type: 'code' },
      ].filter(m => m.match);

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const earliest = matches.reduce((a, b) =>
        (a.match?.index ?? Infinity) < (b.match?.index ?? Infinity) ? a : b
      );

      if (earliest.match.index > 0) {
        parts.push(remaining.substring(0, earliest.match.index));
      }

      switch (earliest.type) {
        case 'bold':
          parts.push(
            <strong key={key++} className="font-semibold text-slate-900">
              {earliest.match[1]}
            </strong>
          );
          break;
        case 'italic':
          parts.push(
            <em key={key++} className="italic">
              {earliest.match[1] || earliest.match[2]}
            </em>
          );
          break;
        case 'code':
          parts.push(
            <code
              key={key++}
              className="bg-slate-100 px-1.5 py-0.5 rounded text-[13px] font-mono text-primary"
            >
              {earliest.match[1]}
            </code>
          );
          break;
      }

      remaining = remaining.substring(earliest.match.index + earliest.match[0].length);
    }

    return parts;
  };

  return <div>{renderMarkdown(content)}</div>;
};

/**
 * BriefingResult Component
 *
 * Displays the generated briefing with copy and PDF export options
 */
const BriefingResult = ({
  briefing,
  template,
  onBack,
  onCreateNew,
  onGenerateAnother,
}) => {
  const isMobile = useMobile();
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const IconComponent = ICON_MAP[template?.icon || briefing?.template_icon] || FileText;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefing.content_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[SmartBriefing] Failed to copy:', err);
    }
  };

  // Download as text file (simple alternative to PDF)
  const handleDownload = () => {
    const content = `${template?.title || briefing?.template_title}\n${'='.repeat(50)}\n\nErstellt am: ${formatDate(briefing.created_at)}\n\n${briefing.content_markdown}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-${briefing.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!briefing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Full width sticky */}
      <div
        className={`bg-brand-gradient sticky top-0 z-40 ${isMobile ? 'px-4 py-5' : 'px-8 py-6'}`}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-white/15 border-none rounded-lg px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div className={`flex items-center gap-6 ${isMobile ? 'flex-col items-start gap-4' : ''}`}>
            {/* Icon instead of Score Gauge */}
            <div
              className={`rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ${
                isMobile ? 'w-[70px] h-[70px]' : 'w-[90px] h-[90px]'
              }`}
            >
              <IconComponent size={isMobile ? 32 : 40} color="#fff" />
            </div>

            {/* Title & Meta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/20 text-white">
                  Smart Briefing
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-primary flex items-center gap-1">
                  <Sparkles size={12} />
                  Fertig!
                </span>
              </div>
              <h1 className={`font-bold text-white m-0 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                {template?.title || briefing?.template_title}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Calendar size={14} />
                  {formatDate(briefing.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons - Desktop only */}
            {!isMobile && (
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 cursor-pointer text-white text-sm font-medium border border-white/30 transition-colors ${
                    copied ? 'bg-green-500/30' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/20 border border-white/30 rounded-xl px-5 py-2.5 cursor-pointer text-white text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  <Download size={16} />
                  Speichern
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-[900px] mx-auto ${isMobile ? 'p-4' : 'px-8 py-6'}`}>
        {/* Mobile Action Buttons */}
        {isMobile && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-[13px] font-medium cursor-pointer transition-colors ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-[13px] font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Speichern
            </button>
          </div>
        )}

        {/* Briefing Content Card */}
        <div
          ref={contentRef}
          className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200"
        >
          {/* Briefing Content */}
          <div className={isMobile ? 'p-5' : 'p-8'}>
            <MarkdownContent content={briefing.content_markdown} />
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            onClick={onGenerateAnother}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-primary bg-white text-primary text-[15px] font-semibold cursor-pointer transition-all hover:bg-primary/5"
          >
            <RefreshCw size={18} />
            Mit anderen Angaben neu generieren
          </button>
          <button
            onClick={onCreateNew}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-none bg-brand-gradient text-white text-[15px] font-semibold cursor-pointer transition-all shadow-primary/40 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            Neues Briefing erstellen
          </button>
        </div>
      </div>
    </div>
  );
};

export default BriefingResult;
