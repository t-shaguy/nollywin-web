'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white">Oops!</h1>
          <h2 className="text-xl font-semibold text-gray-300">
            Something went wrong
          </h2>
          <p className="text-gray-400 text-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-[#7C3AED] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#6D28D9] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
