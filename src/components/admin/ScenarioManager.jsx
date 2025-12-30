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
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  User,
  Settings,
} from 'lucide-react';
import { FormAccordion, FormAccordionGroup } from '@/components/ui/base/form-accordion';
import wordpressAPI from '@/services/wordpress-api';

/**
 * ScenarioManager Component
 * Manages roleplay scenarios (Live-Gespräche)
 */
export default function ScenarioManager({ onBack }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    agent_id: '',
    initial_message: '',
    difficulty: 'medium',
    status: 'draft',
    coaching_hints: '',
    interviewer_profile: {
      name: '',
      role: '',
      properties: '',
    },
  });

  // Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wordpressAPI.adminGetRoleplayScenarios();
      if (response.success) {
        setScenarios(response.data || []);
      } else {
        throw new Error('Fehler beim Laden der Szenarien');
      }
    } catch (err) {
      setError(err.message);
      showToast('error', 'Fehler beim Laden der Szenarien');
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
      title: '',
      description: '',
      agent_id: '',
      initial_message: '',
      difficulty: 'medium',
      status: 'draft',
      coaching_hints: '',
      interviewer_profile: {
        name: '',
        role: '',
        properties: '',
      },
    });
    setIsCreateOpen(true);
  };

  const handleEdit = (scenario) => {
    setSelectedScenario(scenario);
    setFormData({
      title: scenario.title || '',
      description: scenario.description || '',
      agent_id: scenario.agent_id || '',
      initial_message: scenario.initial_message || '',
      difficulty: scenario.difficulty || 'medium',
      status: scenario.status || 'draft',
      coaching_hints: scenario.coaching_hints || '',
      interviewer_profile: {
        name: scenario.interviewer_profile?.name || '',
        role: scenario.interviewer_profile?.role || '',
        properties: scenario.interviewer_profile?.properties || '',
      },
    });
    setIsEditOpen(true);
  };

  const handleDelete = (scenario) => {
    setSelectedScenario(scenario);
    setIsDeleteOpen(true);
  };

  const submitCreate = async () => {
    if (!formData.title.trim()) {
      showToast('error', 'Bitte geben Sie einen Titel ein');
      return;
    }

    try {
      setSaving(true);
      const response = await wordpressAPI.adminCreateRoleplayScenario(formData);
      if (response.success) {
        showToast('success', 'Szenario erfolgreich erstellt');
        setIsCreateOpen(false);
        loadScenarios();
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
    if (!formData.title.trim()) {
      showToast('error', 'Bitte geben Sie einen Titel ein');
      return;
    }

    try {
      setSaving(true);
      const response = await wordpressAPI.adminUpdateRoleplayScenario(selectedScenario.id, formData);
      if (response.success) {
        showToast('success', 'Szenario erfolgreich aktualisiert');
        setIsEditOpen(false);
        loadScenarios();
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
      const response = await wordpressAPI.adminDeleteRoleplayScenario(selectedScenario.id);
      if (response.success) {
        showToast('success', 'Szenario erfolgreich gelöscht');
        setIsDeleteOpen(false);
        loadScenarios();
      } else {
        throw new Error('Fehler beim Löschen');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredScenarios = scenarios.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyLabel = (difficulty) => {
    const labels = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = { publish: 'Veröffentlicht', draft: 'Entwurf', pending: 'Ausstehend' };
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
            <div className="p-2 rounded-lg bg-blue-100">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-main)]">
                Live-Simulationen (Roleplays)
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {scenarios.length} Szenarien
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neues Szenario
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <Input
          placeholder="Szenarien durchsuchen..."
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
              <Button variant="outline" size="sm" onClick={loadScenarios}>
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenarios List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredScenarios.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery ? 'Keine Szenarien gefunden' : 'Noch keine Szenarien vorhanden'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreate} className="mt-4">
                      Erstes Szenario erstellen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredScenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-[var(--text-main)]">
                          {scenario.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(scenario.status)}`}>
                          {getStatusLabel(scenario.status)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                          {getDifficultyLabel(scenario.difficulty)}
                        </span>
                      </div>
                      {scenario.description && (
                        <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                          {scenario.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        {scenario.agent_id && (
                          <span>Agent: {scenario.agent_id.substring(0, 12)}...</span>
                        )}
                        <span>ID: {scenario.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(scenario)}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary-accent)]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(scenario)}
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
            <DialogTitle>Neues Szenario erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Roleplay-Szenario für Live-Simulationen.
            </DialogDescription>
          </DialogHeader>

          <ScenarioForm
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
            <DialogTitle>Szenario bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie das ausgewählte Roleplay-Szenario.
            </DialogDescription>
          </DialogHeader>

          <ScenarioForm
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
            <DialogTitle>Szenario löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Szenario "{selectedScenario?.title}" löschen möchten?
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
 * Scenario Form Component
 */
function ScenarioForm({ formData, setFormData }) {
  return (
    <FormAccordionGroup>
      {/* Basic Information */}
      <FormAccordion
        title="Grundinformationen"
        subtitle="Titel, Beschreibung und Basiseinstellungen"
        icon={FileText}
        accentColor="blue"
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Titel <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="z.B. Vorstellungsgespräch IT-Consultant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Kurze Beschreibung des Szenarios..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Entwurf</option>
                <option value="publish">Veröffentlicht</option>
                <option value="pending">Ausstehend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schwierigkeit</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="easy">Einfach</option>
                <option value="medium">Mittel</option>
                <option value="hard">Schwer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ElevenLabs Agent ID
            </label>
            <Input
              value={formData.agent_id}
              onChange={(e) => setFormData({...formData, agent_id: e.target.value})}
              placeholder="agent_xxx..."
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Die Agent ID aus Ihrem ElevenLabs Dashboard
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Erste Nachricht</label>
            <Textarea
              value={formData.initial_message}
              onChange={(e) => setFormData({...formData, initial_message: e.target.value})}
              placeholder="Die erste Nachricht des KI-Gesprächspartners..."
              rows={3}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Platzhalter: {'{{user_name}}'}, {'{{company_name}}'}, {'{{position}}'}
            </p>
          </div>
        </div>
      </FormAccordion>

      {/* Interviewer Profile */}
      <FormAccordion
        title="Gesprächspartner-Profil"
        subtitle="Name, Rolle und Eigenschaften des KI-Interviewers"
        icon={User}
        accentColor="teal"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.interviewer_profile.name}
                onChange={(e) => setFormData({
                  ...formData,
                  interviewer_profile: {...formData.interviewer_profile, name: e.target.value}
                })}
                placeholder="z.B. Dr. Maria Schmidt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rolle/Position</label>
              <Input
                value={formData.interviewer_profile.role}
                onChange={(e) => setFormData({
                  ...formData,
                  interviewer_profile: {...formData.interviewer_profile, role: e.target.value}
                })}
                placeholder="z.B. HR-Leiterin"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Eigenschaften</label>
            <Textarea
              value={formData.interviewer_profile.properties}
              onChange={(e) => setFormData({
                ...formData,
                interviewer_profile: {...formData.interviewer_profile, properties: e.target.value}
              })}
              placeholder="Charaktereigenschaften (eine pro Zeile)..."
              rows={3}
            />
          </div>
        </div>
      </FormAccordion>

      {/* Advanced Settings */}
      <FormAccordion
        title="Erweiterte Einstellungen"
        subtitle="Coaching-Hinweise und zusätzliche Konfiguration"
        icon={Settings}
        accentColor="purple"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Coaching-Hinweise</label>
            <Textarea
              value={formData.coaching_hints}
              onChange={(e) => setFormData({...formData, coaching_hints: e.target.value})}
              placeholder="Tipps für den Benutzer während des Gesprächs (eine pro Zeile)..."
              rows={4}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Diese Hinweise werden im Live-Coaching-Panel angezeigt
            </p>
          </div>
        </div>
      </FormAccordion>
    </FormAccordionGroup>
  );
}
