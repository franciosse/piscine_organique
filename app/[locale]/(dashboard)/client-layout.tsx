'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Icon, ChevronDown, Leaf, Droplet } from 'lucide-react';
import { flowerLotus } from "@lucide/lab";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
DropdownMenuSub,
DropdownMenuSubContent,
DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import LanguageSwitcher from '../components/languageSwitcher';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PrincipesMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations('Menu');

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="flex items-center hover:text-gray-600 transition-colors">
        {t('principles')}
        <ChevronDown className="ml-1 h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 flex flex-col gap-1 z-4000000000">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/principes/circulation" className="flex w-full items-center">
            <Droplet className="mr-2 h-4 w-4" />
            {t('circulation')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/principes/filtration" className="flex w-full items-center">
            <Leaf className="mr-2 h-4 w-4" />
            {t('filtration')}
          </Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="cursor-pointer">
          <Link href="/principes/energy" className="flex w-full items-center">
            {t('energy')}
          </Link>
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();
  const t = useTranslations('Menu'); // ✅ Déplacé à l'intérieur du composant

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link href="/pricing" className="flex items-center">
          {t('pricing')}
        </Link>
        <Button asChild className="rounded-full green-500 hover:bg-green-600">
          <Link className="flex items-center green-500" href="/sign-up">{t('signUp')}</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9 rounded-full bg-green-500 hover:bg-green-600">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>{t('dashboard')}</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const t = useTranslations('Menu'); // ✅ Déplacé à l'intérieur du composant

  return (
    <header className="border-b border-gray-200 z-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Icon iconNode={flowerLotus} />
          <span className="ml-2 text-xl font-semibold text-gray-900">Piscine Organique</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <Link href="/about" className="flex items-center">
              {t('about')}
            </Link>
            <PrincipesMenu />
            <UserMenu />
            <LanguageSwitcher />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}