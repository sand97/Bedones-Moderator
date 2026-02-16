import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="font-semibold text-base mb-4 text-foreground">Moderateur Bedones</h3>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline', 'Modération intelligente pour vos réseaux sociaux')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-widest text-foreground mb-4">{t('footer.product', 'Produit')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                  {t('footer.dashboard', 'Tableau de bord')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                  {t('footer.blog', 'Blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-widest text-foreground mb-4">{t('footer.legal', 'Légal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                  {t('footer.privacy', 'Confidentialité')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                  {t('footer.terms', 'Conditions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-widest text-foreground mb-4">{t('footer.support', 'Support')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                  {t('footer.help', 'Aide')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Moderateur Bedones. {t('footer.rights', 'Tous droits réservés.')}.</p>
        </div>
      </div>
    </footer>
  );
}
