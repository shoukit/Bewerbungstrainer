import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Users,
  Target,
  Video,
  Settings,
  ChevronRight,
  Shield,
} from 'lucide-react';

/**
 * AdminDashboard Component
 * Main hub for all admin functionality
 */
export default function AdminDashboard({ onNavigate }) {
  const adminSections = [
    {
      id: 'admin_roleplays',
      title: 'Live-Simulationen',
      description: 'Verwalten Sie Szenarien für Live-Voice-Interviews mit KI-Gesprächspartnern.',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: null,
    },
    {
      id: 'admin_simulator',
      title: 'Szenario-Training',
      description: 'Konfigurieren Sie strukturierte Trainingsszenarien mit Fragen und Feedback.',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: null,
    },
    {
      id: 'admin_video',
      title: 'Wirkungs-Analyse',
      description: 'Verwalten Sie Video-basierte Wirkungs-Analysen und Übungen.',
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: null,
    },
    {
      id: 'admin_partners',
      title: 'Partner-Branding',
      description: 'White-Label Partner verwalten: Farben, Logos und Modul-Zugriff.',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      stats: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            Administration
          </h1>
          <p className="text-[var(--text-secondary)]">
            Verwalten Sie Szenarien, Trainings und Partner-Konfigurationen
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Admin-Bereich</h3>
              <p className="text-sm text-blue-700 mt-1">
                Dieser Bereich ist nur für WordPress-Administratoren sichtbar.
                Hier können Sie alle Inhalte und Konfigurationen der Plattform verwalten.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => (
          <Card
            key={section.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:border-[var(--primary-accent)] group"
            onClick={() => onNavigate(section.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${section.bgColor} transition-transform group-hover:scale-110`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-main)] group-hover:text-[var(--primary-accent)] transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary-accent)] group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schnellaktionen</CardTitle>
          <CardDescription>
            Häufig verwendete Admin-Funktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate('admin_roleplays')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Neues Roleplay erstellen
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('admin_partners')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Neuen Partner anlegen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
