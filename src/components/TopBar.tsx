import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Business Dashboard</h2>
        <div className="flex items-center space-x-4">
          {user ? (
            <span className="text-gray-600">Welcome, {user.email}</span>
          ) : (
            <span className="text-gray-600">Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
}