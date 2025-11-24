import { useUser } from '@/shared/contexts';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

export default function ProfilePage() {
  const { user, isGuest, clearUser } = useUser();

  const handleLogout = () => {
    if (confirm('Möchtest du dich wirklich abmelden? Deine Daten werden gelöscht.')) {
      clearUser();
      window.location.href = ROUTES.HOME;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mein Profil</h1>

          {user ? (
            <div className="space-y-6">
              {/* User Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-lg text-gray-900">{user.name || 'Nicht gesetzt'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <p className="text-lg text-gray-900">{user.position || 'Nicht gesetzt'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmen</label>
                <p className="text-lg text-gray-900">{user.company || 'Nicht gesetzt'}</p>
              </div>

              {user.conversationStyle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bevorzugter Gesprächsstil</label>
                  <p className="text-lg text-gray-900 capitalize">{user.conversationStyle}</p>
                </div>
              )}

              {/* Status */}
              <div className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  {isGuest ? '👤 Gast-Modus (Daten lokal gespeichert)' : '✓ WordPress-Nutzer'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Link
                  to={ROUTES.WIZARD}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Profil bearbeiten
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Abmelden
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Du bist nicht angemeldet.</p>
              <Link
                to={ROUTES.WIZARD}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Profil erstellen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
