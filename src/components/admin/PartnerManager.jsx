import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/base/card';
import { Button } from '@/components/ui/base/button';
import { Input } from '@/components/ui/base/input';
import { Textarea } from '@/components/ui/base/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/base/dialog';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Palette,
  ExternalLink,
  Copy,
  FileText,
  Layers,
  Layout,
  PanelLeft,
  Sparkles,
  Square,
  PanelTop,
  Shapes,
  Type,
  Frame,
} from 'lucide-react';
import { FormAccordion, FormAccordionGroup } from '@/components/ui/base/form-accordion';
import wordpressAPI from '@/services/wordpress-api';

// Available modules
const AVAILABLE_MODULES = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'roleplay', label: 'Live-Simulation (Roleplay)' },
  { id: 'simulator', label: 'Szenario-Training (Simulator)' },
  { id: 'video_training', label: 'Wirkungs-Analyse' },
  { id: 'gym', label: 'Rhetorik-Gym (Game)' },
  { id: 'history', label: 'Verlauf / History' },
];

// Default branding values - matching WordPress backend
const DEFAULT_BRANDING = {
  // App / Allgemein
  '--app-bg-start': '#f8fafc',
  '--app-bg-mid': '#eff6ff',
  '--app-bg-end': '#f0fdfa',
  '--card-bg-color': '#ffffff',
  // Sidebar
  '--sidebar-bg-color': '#ffffff',
  '--sidebar-text-color': '#0f172a',
  '--sidebar-text-muted': '#64748b',
  '--sidebar-active-bg': '#eef2ff',
  '--sidebar-active-text': '#4f46e5',
  // Akzentfarben
  '--primary-accent': '#6366f1',
  '--primary-accent-hover': '#4f46e5',
  // Buttons
  '--button-solid': '#6366f1',
  '--button-text': '#ffffff',
  // Header
  '--header-gradient-start': '#6366f1',
  '--header-gradient-end': '#8b5cf6',
  '--header-text': '#ffffff',
  // Icons
  '--icon-primary': '#6366f1',
  '--icon-secondary': '#8b5cf6',
  '--icon-muted': '#94a3b8',
  // Text
  '--text-main': '#0f172a',
  '--text-secondary': '#475569',
  '--text-muted': '#94a3b8',
  // Rahmen & Focus
  '--border-color': '#e2e8f0',
  '--border-color-light': '#f1f5f9',
  '--focus-ring': 'rgba(99, 102, 241, 0.3)',
};

// Branding field sections for the form - icons will be added in component
const BRANDING_SECTIONS = [
  {
    id: 'app',
    title: 'App / Allgemein',
    subtitle: 'Hintergrundfarben der Anwendung',
    accentColor: 'blue',
    iconName: 'Layout',
    fields: [
      { key: '--app-bg-start', label: 'App Hintergrund (Start)', type: 'color' },
      { key: '--app-bg-mid', label: 'App Hintergrund (Mitte)', type: 'color' },
      { key: '--app-bg-end', label: 'App Hintergrund (Ende)', type: 'color' },
      { key: '--card-bg-color', label: 'Karten Hintergrund', type: 'color' },
    ],
  },
  {
    id: 'sidebar',
    title: 'Sidebar',
    subtitle: 'Farben der Seitennavigation',
    accentColor: 'teal',
    iconName: 'PanelLeft',
    fields: [
      { key: '--sidebar-bg-color', label: 'Sidebar Hintergrund', type: 'color' },
      { key: '--sidebar-text-color', label: 'Sidebar Text', type: 'color' },
      { key: '--sidebar-text-muted', label: 'Sidebar Text (gedämpft)', type: 'color' },
      { key: '--sidebar-active-bg', label: 'Sidebar Aktiv Hintergrund', type: 'color' },
      { key: '--sidebar-active-text', label: 'Sidebar Aktiv Text', type: 'color' },
    ],
  },
  {
    id: 'accent',
    title: 'Akzentfarben',
    subtitle: 'Primäre Markenfarben',
    accentColor: 'purple',
    iconName: 'Sparkles',
    fields: [
      { key: '--primary-accent', label: 'Primärfarbe', type: 'color' },
      { key: '--primary-accent-hover', label: 'Primärfarbe (Hover)', type: 'color' },
    ],
  },
  {
    id: 'buttons',
    title: 'Buttons',
    subtitle: 'Schaltflächenfarben',
    accentColor: 'green',
    iconName: 'Square',
    fields: [
      { key: '--button-solid', label: 'Button Farbe', type: 'color' },
      { key: '--button-text', label: 'Button Text', type: 'color' },
    ],
  },
  {
    id: 'header',
    title: 'Header',
    subtitle: 'Kopfzeilenfarben',
    accentColor: 'orange',
    iconName: 'PanelTop',
    fields: [
      { key: '--header-gradient-start', label: 'Header Gradient (Start)', type: 'color' },
      { key: '--header-gradient-end', label: 'Header Gradient (Ende)', type: 'color' },
      { key: '--header-text', label: 'Header Text', type: 'color' },
    ],
  },
  {
    id: 'icons',
    title: 'Icons',
    subtitle: 'Symbolfarben',
    accentColor: 'blue',
    iconName: 'Shapes',
    fields: [
      { key: '--icon-primary', label: 'Icon Primär', type: 'color' },
      { key: '--icon-secondary', label: 'Icon Sekundär', type: 'color' },
      { key: '--icon-muted', label: 'Icon (gedämpft)', type: 'color' },
    ],
  },
  {
    id: 'text',
    title: 'Text',
    subtitle: 'Textfarben',
    accentColor: 'teal',
    iconName: 'Type',
    fields: [
      { key: '--text-main', label: 'Text Hauptfarbe', type: 'color' },
      { key: '--text-secondary', label: 'Text Sekundär', type: 'color' },
      { key: '--text-muted', label: 'Text (gedämpft)', type: 'color' },
    ],
  },
  {
    id: 'borders',
    title: 'Rahmen & Focus',
    subtitle: 'Rahmen- und Fokusfarben',
    accentColor: 'purple',
    iconName: 'Frame',
    fields: [
      { key: '--border-color', label: 'Rahmenfarbe', type: 'color' },
      { key: '--border-color-light', label: 'Rahmenfarbe (hell)', type: 'color' },
      { key: '--focus-ring', label: 'Focus Ring', type: 'color' },
    ],
  },
];

// Icon mapping
const SECTION_ICONS = {
  Layout,
  PanelLeft,
  Sparkles,
  Square,
  PanelTop,
  Shapes,
  Type,
  Frame,
};

/**
 * PartnerManager Component
 * Manages white-label partners
 */
export default function PartnerManager({ onBack }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'draft',
    modules: [],
    branding: { ...DEFAULT_BRANDING },
  });

  // Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wordpressAPI.adminGetPartners();
      if (response.success) {
        setPartners(response.data || []);
      } else {
        throw new Error('Fehler beim Laden der Partner');
      }
    } catch (err) {
      setError(err.message);
      showToast('error', 'Fehler beim Laden der Partner');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      status: 'draft',
      modules: [],
      branding: { ...DEFAULT_BRANDING },
    });
    setIsCreateOpen(true);
  };

  const handleEdit = (partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name || '',
      slug: partner.slug || '',
      description: partner.description || '',
      status: partner.status || 'draft',
      modules: partner.modules || [],
      branding: { ...DEFAULT_BRANDING, ...partner.branding },
    });
    setIsEditOpen(true);
  };

  const handleDelete = (partner) => {
    setSelectedPartner(partner);
    setIsDeleteOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'Bitte geben Sie einen Namen ein');
      return;
    }

    const dataToSend = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    };

    try {
      setSaving(true);
      const response = await wordpressAPI.adminCreatePartner(dataToSend);
      if (response.success) {
        showToast('success', 'Partner erfolgreich erstellt');
        setIsCreateOpen(false);
        loadPartners();
      } else {
        throw new Error('Fehler beim Erstellen');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      setSaving(true);
      const response = await wordpressAPI.adminUpdatePartner(selectedPartner.id, formData);
      if (response.success) {
        showToast('success', 'Partner erfolgreich aktualisiert');
        setIsEditOpen(false);
        loadPartners();
      } else {
        throw new Error('Fehler beim Aktualisieren');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    try {
      setSaving(true);
      const response = await wordpressAPI.adminDeletePartner(selectedPartner.id);
      if (response.success) {
        showToast('success', 'Partner erfolgreich gelöscht');
        setIsDeleteOpen(false);
        loadPartners();
      } else {
        throw new Error('Fehler beim Löschen');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyPartnerUrl = (slug) => {
    const url = `${window.location.origin}${window.location.pathname}?partner=${slug}`;
    navigator.clipboard.writeText(url);
    showToast('success', 'URL in Zwischenablage kopiert');
  };

  const filteredPartners = partners.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status) => {
    const labels = { publish: 'Aktiv', draft: 'Entwurf', pending: 'Ausstehend' };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      publish: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-main)]">
                Partner-Branding
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {partners.length} Partner
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neuer Partner
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          placeholder="Partner durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-accent)]" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadPartners}>
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partners List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredPartners.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery ? 'Keine Partner gefunden' : 'Noch keine Partner vorhanden'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreate} className="mt-4">
                      Ersten Partner erstellen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Color Preview */}
                        <div
                          className="w-8 h-8 rounded-lg border shadow-sm"
                          style={{
                            background: partner.branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'],
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[var(--text-main)]">
                              {partner.name}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(partner.status)}`}>
                              {getStatusLabel(partner.status)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-muted)]">
                            Slug: {partner.slug}
                          </p>
                        </div>
                      </div>
                      {partner.description && (
                        <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-1">
                          {partner.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        {partner.modules?.length > 0 ? (
                          <span>{partner.modules.length} Module aktiv</span>
                        ) : (
                          <span>Alle Module aktiv</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPartnerUrl(partner.slug)}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary-accent)]"
                        title="URL kopieren"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(partner)}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary-accent)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(partner)}
                        className="text-[var(--text-secondary)] hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuen Partner erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen White-Label Partner mit eigenem Branding.
            </DialogDescription>
          </DialogHeader>

          <PartnerForm
            formData={formData}
            setFormData={setFormData}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={submitCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Konfiguration des ausgewählten Partners.
            </DialogDescription>
          </DialogHeader>

          <PartnerForm
            formData={formData}
            setFormData={setFormData}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partner löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Partner "{selectedPartner?.name}" löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={submitDelete} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Color Input Component
 */
function ColorInput({ label, value, defaultValue, onChange }) {
  // Handle rgba values - convert to hex for color picker
  const isRgba = value?.startsWith('rgba') || defaultValue?.startsWith('rgba');
  const displayValue = isRgba ? '#3A7FA7' : (value || defaultValue || '#000000');

  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded border cursor-pointer"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultValue}
          className="flex-1 text-xs"
        />
      </div>
    </div>
  );
}

/**
 * Branding Preview Component
 */
function BrandingPreview({ branding }) {
  const bgStart = branding?.['--app-bg-start'] || DEFAULT_BRANDING['--app-bg-start'];
  const bgMid = branding?.['--app-bg-mid'] || DEFAULT_BRANDING['--app-bg-mid'];
  const bgEnd = branding?.['--app-bg-end'] || DEFAULT_BRANDING['--app-bg-end'];
  const cardBg = branding?.['--card-bg-color'] || DEFAULT_BRANDING['--card-bg-color'];
  const headerStart = branding?.['--header-gradient-start'] || DEFAULT_BRANDING['--header-gradient-start'];
  const headerEnd = branding?.['--header-gradient-end'] || DEFAULT_BRANDING['--header-gradient-end'];
  const headerText = branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'];
  const textMain = branding?.['--text-main'] || DEFAULT_BRANDING['--text-main'];
  const textSecondary = branding?.['--text-secondary'] || DEFAULT_BRANDING['--text-secondary'];
  const buttonSolid = branding?.['--button-solid'] || DEFAULT_BRANDING['--button-solid'];
  const buttonText = branding?.['--button-text'] || DEFAULT_BRANDING['--button-text'];
  const borderColor = branding?.['--border-color'] || DEFAULT_BRANDING['--border-color'];

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{
        background: `linear-gradient(135deg, ${bgStart} 0%, ${bgMid} 50%, ${bgEnd} 100%)`,
      }}
    >
      {/* Mini Header */}
      <div
        className="rounded-t-lg px-3 py-2 mb-2"
        style={{ background: `linear-gradient(135deg, ${headerStart} 0%, ${headerEnd} 100%)` }}
      >
        <span className="text-xs font-medium" style={{ color: headerText }}>Header Vorschau</span>
      </div>

      {/* Card Preview */}
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: textMain }}>Karten-Titel</p>
        <p className="text-xs mb-3" style={{ color: textSecondary }}>Sekundärer Text</p>
        <button
          type="button"
          className="px-3 py-1.5 rounded text-xs font-medium"
          style={{
            backgroundColor: buttonSolid,
            color: buttonText,
          }}
        >
          Button
        </button>
      </div>
    </div>
  );
}

/**
 * Partner Form Component
 */
function PartnerForm({ formData, setFormData }) {
  const handleModuleToggle = (moduleId) => {
    const currentModules = formData.modules || [];
    if (currentModules.includes(moduleId)) {
      setFormData({
        ...formData,
        modules: currentModules.filter(m => m !== moduleId),
      });
    } else {
      setFormData({
        ...formData,
        modules: [...currentModules, moduleId],
      });
    }
  };

  const handleBrandingChange = (key, value) => {
    setFormData({
      ...formData,
      branding: {
        ...formData.branding,
        [key]: value,
      },
    });
  };

  return (
    <FormAccordionGroup>
      {/* Basic Information */}
      <FormAccordion
        title="Grundinformationen"
        subtitle="Name, Slug und Status des Partners"
        icon={FileText}
        accentColor="blue"
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="z.B. Vertriebsakademie Müller"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL-ID)</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
              placeholder="z.B. vertriebsakademie-mueller"
            />
            <p className="text-xs text-slate-500 mt-1">
              Wird in der URL verwendet: ?partner={formData.slug || 'ihr-slug'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optionale Beschreibung des Partners..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="draft">Entwurf</option>
              <option value="publish">Aktiv</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
        </div>
      </FormAccordion>

      {/* Modules */}
      <FormAccordion
        title="Erlaubte Module"
        subtitle="Welche Funktionen für diesen Partner verfügbar sind"
        icon={Layers}
        accentColor="green"
        badge={formData.modules?.length > 0 ? `${formData.modules.length} ausgewählt` : 'Alle'}
      >
        <div>
          <p className="text-sm text-slate-500 mb-4">
            Keine Auswahl = Alle Module sind erlaubt
          </p>
          <div className="space-y-2">
            {AVAILABLE_MODULES.map((module) => (
              <label
                key={module.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.modules?.includes(module.id) || false}
                  onChange={() => handleModuleToggle(module.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{module.label}</span>
              </label>
            ))}
          </div>
        </div>
      </FormAccordion>

      {/* Branding Preview */}
      <FormAccordion
        title="Branding Vorschau"
        subtitle="Live-Vorschau der konfigurierten Farben"
        icon={Palette}
        accentColor="orange"
        defaultExpanded={true}
      >
        <BrandingPreview branding={formData.branding} />
        <p className="text-xs text-slate-500 text-center">
          Ändern Sie die Farben in den Sektionen unten
        </p>
      </FormAccordion>

      {/* Dynamic Branding Sections */}
      {BRANDING_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.iconName];
        return (
          <FormAccordion
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            icon={Icon}
            accentColor={section.accentColor}
          >
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <ColorInput
                  key={field.key}
                  label={field.label}
                  value={formData.branding?.[field.key]}
                  defaultValue={DEFAULT_BRANDING[field.key]}
                  onChange={(value) => handleBrandingChange(field.key, value)}
                />
              ))}
            </div>
          </FormAccordion>
        );
      })}
    </FormAccordionGroup>
  );
}
