import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Seite nicht gefunden</h2>
        <p className="text-gray-600 mb-8">
          Die gesuchte Seite existiert leider nicht.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
