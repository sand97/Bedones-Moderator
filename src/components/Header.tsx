import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Globe, HelpCircle } from 'lucide-react';
import { useAuth } from '~/hooks/useAuth';
import { cn } from '~/lib/utils';

interface HeaderProps {
  className?: string;
  variant?: 'default' | 'transparent';
}

export function Header({ className, variant = 'default' }: HeaderProps) {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();

  const isTransparent = variant === 'transparent';

  // const handleAuthClick = async () => {
  //   if (session?.user) {
  //     await signOut();
  //     router.push('/');
  //   } else {
  //     signIn();
  //   }
  // };

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
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer",
            isTransparent ? "bg-white" : "bg-black"
          )}
          onClick={() => router.push(session?.user ? '/dashboard' : '/')}
        >
          <span className={cn("text-xl font-bold", isTransparent ? "text-black" : "text-white")}>B</span>
        </div>
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className={cn("text-sm", isTransparent ? "text-white" : "text-gray-600")}>
              {session.user.name || session.user.email}
            </span>
          )}
          <button
            onClick={handleLanguageToggle}
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isTransparent
                ? "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                : "bg-white text-foreground hover:bg-gray-100 border border-gray-300"
            )}
            title="Switch language"
          >
            <Globe className="h-4 w-4" strokeWidth={1} />
            {router.locale === 'en' ? 'Français' : 'English'}
          </button>
          <Link
            href="/help"
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isTransparent
                ? "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                : "bg-white text-foreground hover:bg-gray-100 border border-gray-300"
            )}
          >
            <HelpCircle className="h-4 w-4" strokeWidth={1} />
            {t('header.help')}
          </Link>
          {/* <Button
            variant="outline"
            className="bg-white hover:bg-gray-50"
            onClick={handleAuthClick}
          >
            {session?.user ? t('header.signOut') : t('header.connection')}
          </Button> */}
        </div>
      </div>
    </header>
  );
}
