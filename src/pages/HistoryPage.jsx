import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Meine Sessions</h1>

          {/* Placeholder - will be implemented later */}
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Noch keine Sessions vorhanden
            </h2>
            <p className="text-gray-600 mb-6">
              Starte dein erstes Interview, um deinen Verlauf zu sehen.
            </p>
            <Link
              to={ROUTES.INTERVIEW}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Interview starten
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
