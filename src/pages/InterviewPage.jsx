import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

export default function InterviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Interview-Trainer</h1>
          <p className="text-gray-600 mb-6">
            Diese Seite wird noch migriert. Das Interview-Modul wird in Kürze hier verfügbar sein.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              🚧 Migration in Progress
            </h2>
            <p className="text-blue-800">
              Wir arbeiten gerade an der Modularisierung des Interview-Trainers.
              Die Funktionalität wird in den nächsten Schritten hier integriert.
            </p>
          </div>

          <Link
            to={ROUTES.HOME}
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
