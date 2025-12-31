import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { trpc } from '~/utils/trpc';
import { DashboardLayout } from '~/components/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare, Zap, TrendingUp, Calendar } from 'lucide-react';

type Period = 'week' | 'month' | 'year';

interface UsageData {
  date: string;
  facebookComments: number;
  instagramComments: number;
  tokensUsed: number;
}

const UsagesPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();

  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  // Mock data - Replace with actual API call
  const generateMockData = (period: Period): UsageData[] => {
    const data: UsageData[] = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        }),
        facebookComments: Math.floor(Math.random() * 50) + 10,
        instagramComments: Math.floor(Math.random() * 40) + 5,
        tokensUsed: Math.floor(Math.random() * 1000) + 200,
      });
    }
    return data;
  };

  const usageData = generateMockData(period);

  // Calculate totals
  const totalFacebookComments = usageData.reduce(
    (sum, item) => sum + item.facebookComments,
    0,
  );
  const totalInstagramComments = usageData.reduce(
    (sum, item) => sum + item.instagramComments,
    0,
  );
  const totalTokensUsed = usageData.reduce(
    (sum, item) => sum + item.tokensUsed,
    0,
  );
  const totalComments = totalFacebookComments + totalInstagramComments;

  // Mock data for token limits
  const monthlyTokenLimit = 50000;
  const tokensRemaining = monthlyTokenLimit - totalTokensUsed;
  const tokenUsagePercentage = (totalTokensUsed / monthlyTokenLimit) * 100;

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('sidebar.usages')}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle={t('sidebar.usages')}>
      <div className="space-y-6">
        {/* Header with Period Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Utilisation</h2>
            <p className="text-sm text-muted-foreground">
              Suivez vos statistiques d'utilisation et votre consommation de tokens
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="period-select" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Période:
            </Label>
            <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
              <SelectTrigger id="period-select" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commentaires
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalComments}</div>
              <p className="text-xs text-muted-foreground">
                {period === 'week'
                  ? '7 derniers jours'
                  : period === 'month'
                    ? '30 derniers jours'
                    : 'Cette année'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tokens Utilisés
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTokensUsed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {tokenUsagePercentage.toFixed(1)}% du quota mensuel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tokens Restants
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tokensRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {monthlyTokenLimit.toLocaleString()} / mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Moyenne / Jour
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totalComments / usageData.length)}
              </div>
              <p className="text-xs text-muted-foreground">
                Commentaires modérés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commentaires Modérés</CardTitle>
            <CardDescription>
              Évolution des commentaires Facebook et Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="facebookComments"
                  stroke="#1877f2"
                  name="Facebook"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="instagramComments"
                  stroke="#e4405f"
                  name="Instagram"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisation des Tokens</CardTitle>
            <CardDescription>
              Consommation de tokens IA par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tokensUsed"
                  stroke="#8b5cf6"
                  name="Tokens"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token Quota Warning */}
        {tokenUsagePercentage > 80 && (
          <Card className="border-orange-500 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">
                    Attention : Quota de tokens bientôt atteint
                  </h3>
                  <p className="text-sm text-orange-800 mt-1">
                    Vous avez utilisé {tokenUsagePercentage.toFixed(1)}% de votre
                    quota mensuel. Envisagez de passer à un forfait supérieur si
                    vous dépassez régulièrement cette limite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsagesPage;
