import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white">404</h1>
          <h2 className="text-xl font-semibold text-gray-300">
            Page Not Found
          </h2>
          <p className="text-gray-400 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block w-full bg-[#7C3AED] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#6D28D9] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
