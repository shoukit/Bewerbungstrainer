import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { FormAccordion, FormAccordionGroup } from '@/components/ui/form-accordion';
import wordpressAPI from '@/services/wordpress-api';

// Available modules
const AVAILABLE_MODULES = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'roleplay', label: 'Live-Gespräch (Roleplay)' },
  { id: 'simulator', label: 'Szenario-Training (Simulator)' },
  { id: 'video_training', label: 'Video-Training' },
  { id: 'gym', label: 'Rhetorik-Gym (Game)' },
  { id: 'history', label: 'Verlauf / History' },
];

// Default branding values
const DEFAULT_BRANDING = {
  '--primary-accent': '#3A7FA7',
  '--primary-accent-hover': '#2D6485',
  '--sidebar-bg-color': '#ffffff',
  '--sidebar-text-color': '#0f172a',
  '--sidebar-active-bg': '#E8F4F8',
  '--sidebar-active-text': '#2D6485',
  '--button-solid': '#3A7FA7',
  '--button-text': '#ffffff',
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

  const brandingFields = [
    { key: '--primary-accent', label: 'Primärfarbe', type: 'color' },
    { key: '--primary-accent-hover', label: 'Primärfarbe (Hover)', type: 'color' },
    { key: '--sidebar-bg-color', label: 'Sidebar Hintergrund', type: 'color' },
    { key: '--sidebar-text-color', label: 'Sidebar Text', type: 'color' },
    { key: '--sidebar-active-bg', label: 'Sidebar Aktiv Hintergrund', type: 'color' },
    { key: '--sidebar-active-text', label: 'Sidebar Aktiv Text', type: 'color' },
    { key: '--button-solid', label: 'Button Farbe', type: 'color' },
    { key: '--button-text', label: 'Button Text', type: 'color' },
  ];

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
            <p className="text-xs text-[var(--text-muted)] mt-1">
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
          <p className="text-sm text-[var(--text-muted)] mb-4">
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

      {/* Branding */}
      <FormAccordion
        title="Branding / Farben"
        subtitle="Individuelle Farbgestaltung für den Partner"
        icon={Palette}
        accentColor="orange"
      >
        <div>
          {/* Preview */}
          <div className="mb-4 p-4 rounded-lg border" style={{
            backgroundColor: formData.branding?.['--sidebar-bg-color'] || '#ffffff',
          }}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg"
                style={{ backgroundColor: formData.branding?.['--primary-accent'] || '#3A7FA7' }}
              />
              <div>
                <p className="font-medium" style={{ color: formData.branding?.['--sidebar-text-color'] || '#0f172a' }}>
                  Vorschau
                </p>
                <p className="text-sm" style={{ color: formData.branding?.['--sidebar-active-text'] || '#2D6485' }}>
                  Aktiver Text
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: formData.branding?.['--button-solid'] || '#3A7FA7',
                color: formData.branding?.['--button-text'] || '#ffffff',
              }}
            >
              Button Beispiel
            </button>
          </div>

          {/* Color Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {brandingFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.branding?.[field.key] || DEFAULT_BRANDING[field.key]}
                    onChange={(e) => handleBrandingChange(field.key, e.target.value)}
                    className="w-10 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.branding?.[field.key] || ''}
                    onChange={(e) => handleBrandingChange(field.key, e.target.value)}
                    placeholder={DEFAULT_BRANDING[field.key]}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FormAccordion>
    </FormAccordionGroup>
  );
}
