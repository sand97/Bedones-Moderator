import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useSession, signOut } from '~/lib/auth-client';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();

  const handleAuthClick = () => {
    if (session?.user) {
      // Sign out
      signOut();
      router.push('/');
    } else {
      // Go to login page
      router.push('/');
    }
  };

  const handleLanguageToggle = async () => {
    const newLang = router.locale === 'fr' ? 'en' : 'fr';
    // Change i18next language immediately for instant UI update
    await i18n.changeLanguage(newLang);
    // Update Next.js router locale
    router.push(router.pathname, router.asPath, { locale: newLang });
  };

  return (
    <header className={cn('px-4', className)}>
      <div className="max-w-screen-lg mx-auto flex items-center justify-between">
        <div
          className="w-12 h-12 rounded-full bg-black flex items-center justify-center cursor-pointer"
          onClick={() => router.push(session?.user ? '/dashboard' : '/')}
        >
          <span className="text-white text-xl font-bold">B</span>
        </div>
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="text-sm text-gray-600">
              {session.user.name || session.user.email}
            </span>
          )}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 border border-gray-300 transition-colors"
            title="Switch language"
          >
            {router.locale === 'en' ? 'Français' : 'English'}
          </button>
          <Button
            variant="outline"
            className="bg-white hover:bg-gray-50"
            onClick={handleAuthClick}
          >
            {session?.user ? t('header.signOut') : t('header.connection')}
          </Button>
        </div>
      </div>
    </header>
  );
}
