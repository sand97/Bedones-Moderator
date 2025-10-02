import type { NextPageWithLayout } from './_app';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Header } from '~/components/Header';
import { Button } from '~/components/ui/button';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

const AuthErrorPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { error } = router.query;
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

  useEffect(() => {
    if (error) {
      const errorCode = String(error);

      // Try to get specific error translation
      const specificTitle = t(`authError.errors.${errorCode}.title`, '');
      const specificMessage = t(`authError.errors.${errorCode}.message`, '');

      if (specificTitle && specificMessage) {
        setErrorTitle(specificTitle);
        setErrorMessage(specificMessage);
      } else {
        // Fallback to default error
        setErrorTitle(t('authError.title'));
        setErrorMessage(t('authError.message'));
      }
    } else {
      setErrorTitle(t('authError.title'));
      setErrorMessage(t('authError.message'));
    }
  }, [error, t]);

  const handleTryAgain = () => {
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px]" />

      <Header className="pt-4 pb-8 relative z-10" />

      <div className="container mx-auto px-4 pb-4 max-w-2xl relative z-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center shadow-inner">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                {errorTitle}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-base leading-relaxed">
                  {errorMessage || t('authError.message')}
                </p>

                {error && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-mono text-gray-700">
                      {t('authError.errorCode')}{' '}
                      <span className="font-semibold text-gray-900">
                        {error}
                      </span>
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleTryAgain}
                    className="w-full bg-black hover:bg-gray-800 text-white px-8 py-6 text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <RefreshCcw className="mr-2 h-5 w-5" />
                    {t('authError.tryAgain')}
                  </Button>

                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-base rounded-lg transition-all duration-200"
                  >
                    <Home className="mr-2 h-5 w-5" />
                    {t('authError.goHome')}
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    {t('authError.needHelp')}
                  </summary>
                  <div className="mt-3 space-y-2 text-gray-600">
                    <p>{t('authError.helpIntro')}</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>{t('authError.helpSteps.clearCache')}</li>
                      <li>{t('authError.helpSteps.tryBrowser')}</li>
                      <li>{t('authError.helpSteps.checkConnection')}</li>
                      <li>{t('authError.helpSteps.contactSupport')}</li>
                    </ul>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;
