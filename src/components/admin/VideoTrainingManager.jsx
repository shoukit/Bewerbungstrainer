import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/base/card';
import { Button } from '@/components/ui/base/button';
import { Input } from '@/components/ui/base/input';
import {
  Video,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import wordpressAPI from '@/services/wordpress-api';

/**
 * VideoTrainingManager Component
 * Displays overview of video training scenarios
 */
export default function VideoTrainingManager({ onBack }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wordpressAPI.adminGetVideoTrainingScenarios();
      if (response.success) {
        setScenarios(response.data || []);
      } else {
        throw new Error('Fehler beim Laden der Szenarien');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredScenarios = scenarios.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-main)]">
                Wirkungs-Analyse
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {scenarios.length} Szenarien
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Verwaltung im WordPress-Backend</h3>
              <p className="text-sm text-blue-700 mt-1 mb-3">
                Wirkungs-Analyse-Szenarien werden im WordPress-Adminbereich verwaltet.
                Hier sehen Sie eine Übersicht der vorhandenen Szenarien.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/wp-admin/edit.php?post_type=video_training_scenario', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                WordPress-Admin öffnen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Video className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery ? 'Keine Szenarien gefunden' : 'Noch keine Wirkungs-Analyse-Szenarien vorhanden'}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open('/wp-admin/post-new.php?post_type=video_training_scenario', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Im WordPress-Admin erstellen
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
                        {scenario.difficulty && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                            {getDifficultyLabel(scenario.difficulty)}
                          </span>
                        )}
                      </div>
                      {scenario.description && (
                        <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                          {scenario.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        {scenario.category && <span>Kategorie: {scenario.category}</span>}
                        <span>ID: {scenario.id}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/wp-admin/post.php?post=${scenario.id}&action=edit`, '_blank')}
                      className="text-[var(--text-secondary)] hover:text-[var(--primary-accent)]"
                      title="Im WordPress-Admin bearbeiten"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
