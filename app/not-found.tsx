import Link from 'next/link';
import { CircleIcon } from 'lucide-react';
import LogoOnly from './[locale]/components/logOnly';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <LogoOnly />
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-base text-gray-500">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="max-w-48 mx-aut  o flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
