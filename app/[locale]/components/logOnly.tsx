'use client';

import Link from 'next/link';
import { Icon } from 'lucide-react';
import { flowerLotus } from '@lucide/lab';

export default function LogoOnly() {
  return (
    <div className="py-4 px-6">
      <Link href="/" className="flex items-center">
        <Icon iconNode={flowerLotus} />
        <span className="ml-2 text-xl font-semibold text-gray-900">Piscine Organique</span>
      </Link>
    </div>
  );
}
