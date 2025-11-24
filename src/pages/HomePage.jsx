import { Link } from 'react-router-dom';
import { useUser } from '@/shared/contexts';
import { ROUTES } from '@/routes/routes.config';

export default function HomePage() {
  const { user, hasCompletedWizard } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            KarriereHeld Bewerbungstrainer
          </h1>
          <p className="text-xl text-gray-600">
            Deine interaktive Plattform für perfekte Bewerbungsgespräche
          </p>
        </div>

        {/* User Greeting */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Willkommen zurück, {user.name}! 👋
            </h2>
            {user.position && user.company && (
              <p className="text-gray-600">
                Position: {user.position} bei {user.company}
              </p>
            )}
          </div>
        )}

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Interview Trainer */}
          <Link
            to={hasCompletedWizard ? ROUTES.INTERVIEW : ROUTES.WIZARD}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Interview-Trainer</h3>
            <p className="text-gray-600 mb-4">
              Übe realistische Bewerbungsgespräche mit unserem KI-gestützten Interviewer
            </p>
            <span className="text-blue-600 font-semibold group-hover:underline">
              Jetzt starten →
            </span>
          </Link>

          {/* Situations Coach */}
          <div className="bg-gray-100 rounded-lg shadow-md p-8 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                Bald verfügbar
              </span>
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-500 mb-2">Situations-Coach</h3>
            <p className="text-gray-500 mb-4">
              Trainiere spezifische berufliche Gesprächssituationen und erhalte detailliertes Feedback
            </p>
            <span className="text-gray-400 font-semibold">
              In Entwicklung...
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Schnellzugriff</h3>
          <div className="flex flex-wrap gap-3">
            {!hasCompletedWizard && (
              <Link
                to={ROUTES.WIZARD}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Profil einrichten
              </Link>
            )}
            <Link
              to={ROUTES.HISTORY}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Meine Sessions
            </Link>
            <Link
              to={ROUTES.PROFILE}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
