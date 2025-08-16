'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './languageSwitcher.module.css'; // adapte si nécessaire

const locales = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'eu', label: 'Euskara', flag: '/flags/euskadi.png' }, // image dans /public
];

export default function LanguageSwitcher() {
  const pathname = usePathname() || '/fr';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = pathname.split('/')[1] || 'fr';
  const activeLang = locales.find((l) => l.code === currentLocale) || locales[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderFlag = (flag: string, label: string) => {
    const isEmoji = /^[\uD83C-\uDBFF\uDC00-\uDFFF]+$/.test(flag);
    if (isEmoji) {
      return <span>{flag}</span>;
    } else {
      return (
        <Image
          src={flag}
          alt={`${label} flag`}
          width={20}
          height={15}
          style={{ objectFit: 'cover', borderRadius: 2 }}
          unoptimized
        />
      );
    }
  };

  return (
    <div ref={dropdownRef} className={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.button}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {renderFlag(activeLang.flag, activeLang.label)}
        <span>{activeLang.label}</span>
        <span className={styles.caret} aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <ul role="listbox" className={styles.dropdown}>
          {locales
            .filter((l) => l.code !== currentLocale)
            .map((lang) => {
              const newPath = pathname.replace(`/${currentLocale}`, `/${lang.code}`);
              return (
                <li key={lang.code} className={styles.dropdownItem}>
                  <Link
                    href={newPath}
                    className={styles.dropdownLink}
                    onClick={() => setIsOpen(false)}
                  >
                    {renderFlag(lang.flag, lang.label)}
                    <span>{lang.label}</span>
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
