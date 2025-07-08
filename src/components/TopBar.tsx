import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Business Dashboard</h2>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <span className="text-gray-600">Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
}