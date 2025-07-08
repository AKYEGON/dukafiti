// Simple static app to fix infinite loading issue
function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to DukaFiti
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-lg">
          Effortlessly manage your duka's inventory, sales, and customers—all in one mobile‑first POS.
        </p>
        <div className="space-x-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Sign In
          </button>
          <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <Landing />;
}