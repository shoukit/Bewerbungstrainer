import React, { useState, useRef } from 'react';
import { useBranding } from '@/hooks/useBranding';
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
const MarkdownContent = ({ content, primaryAccent }) => {
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
            style={{
              margin: '12px 0',
              paddingLeft: '24px',
              listStyle: 'none',
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: '8px',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: '#374151',
                  position: 'relative',
                  paddingLeft: '20px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: primaryAccent,
                    fontWeight: 'bold',
                  }}
                >
                  {listType === 'number' ? `${idx + 1}.` : ''}
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
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '24px 0 12px 0',
              paddingTop: '16px',
              borderTop: index > 0 ? '1px solid #f1f5f9' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
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
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '28px 0 14px 0',
            }}
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
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '32px 0 16px 0',
            }}
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
          style={{
            margin: '12px 0',
            fontSize: '15px',
            lineHeight: 1.7,
            color: '#374151',
          }}
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
            <strong key={key++} style={{ fontWeight: 600, color: '#0f172a' }}>
              {earliest.match[1]}
            </strong>
          );
          break;
        case 'italic':
          parts.push(
            <em key={key++} style={{ fontStyle: 'italic' }}>
              {earliest.match[1] || earliest.match[2]}
            </em>
          );
          break;
        case 'code':
          parts.push(
            <code
              key={key++}
              style={{
                backgroundColor: '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: primaryAccent,
              }}
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
  const b = useBranding();
  const isMobile = useMobile();
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  // Get primary accent color from branding
  const primaryAccent = b.primaryAccent;
  const headerGradient = b.headerGradient;
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
    <div style={{ minHeight: '100vh', background: b.pageBg }}>
      {/* Header - Full width sticky */}
      <div style={{
        background: headerGradient,
        padding: isMobile ? '20px 16px' : '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '24px',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* Icon instead of Score Gauge */}
            <div style={{
              width: isMobile ? 70 : 90,
              height: isMobile ? 70 : 90,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconComponent size={isMobile ? 32 : 40} color="#fff" />
            </div>

            {/* Title & Meta */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}>
                  Smart Briefing
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.9)',
                  color: primaryAccent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Sparkles size={12} />
                  Fertig!
                </span>
              </div>
              <h1 style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                marginBottom: '8px',
              }}>
                {template?.title || briefing?.template_title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  <Calendar size={14} />
                  {formatDate(briefing.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons - Desktop only */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
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
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px 32px',
      }}>
        {/* Mobile Action Buttons */}
        {isMobile && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${b.borderColor}`,
                backgroundColor: copied ? '#dcfce7' : 'white',
                color: copied ? '#16a34a' : b.textSecondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: '10px',
                border: `1px solid ${b.borderColor}`,
                backgroundColor: 'white',
                color: b.textSecondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Download size={16} />
              Speichern
            </button>
          </div>
        )}

        {/* Briefing Content Card */}
        <div
          ref={contentRef}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: `1px solid ${b.borderColor}`,
          }}
        >
          {/* Briefing Content */}
          <div style={{ padding: isMobile ? '20px' : '32px' }}>
            <MarkdownContent
              content={briefing.content_markdown}
              primaryAccent={primaryAccent}
            />
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onGenerateAnother}
            style={{
              flex: 1,
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '12px',
              border: `2px solid ${primaryAccent}`,
              backgroundColor: 'white',
              color: primaryAccent,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={18} />
            Mit anderen Angaben neu generieren
          </button>
          <button
            onClick={onCreateNew}
            style={{
              flex: 1,
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}dd)`,
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 14px ${primaryAccent}40`,
            }}
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
