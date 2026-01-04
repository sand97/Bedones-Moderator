import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { DashboardLayout } from '~/components/DashboardLayout';
import { trpc } from '~/utils/trpc';
import { trackBeginCheckout } from '~/lib/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import {
  CreditCard,
  Check,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';

export default function PaymentMethodPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? fr : enUS;

  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'notchpay'>('stripe');
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [phone, setPhone] = useState('');

  // Fetch current subscription
  const { data: currentData, isLoading: isLoadingCurrent } = trpc.subscription.getCurrent.useQuery();

  // Fetch available plans
  const { data: plans = [], isLoading: isLoadingPlans } = trpc.subscription.getPlans.useQuery();

  // Fetch payment history
  const { data: historyData, isLoading: isLoadingHistory } = trpc.subscription.getPaymentHistory.useQuery({
    limit: 10,
    offset: 0,
  });

  // Fetch subscription stats
  const { data: stats } = trpc.subscription.getStats.useQuery();

  // Calculate price for selected plan and months
  const { data: pricing } = trpc.subscription.calculatePrice.useQuery(
    {
      planKey: selectedPlan as 'STARTER' | 'PRO' | 'BUSINESS',
      months,
      currency: paymentMethod === 'stripe' ? 'USD' : 'XAF',
    },
    {
      enabled: !!selectedPlan && selectedPlan !== 'FREE',
    }
  );

  const handleUpgrade = async () => {
    if (!selectedPlan || selectedPlan === 'FREE') return;

    // Get plan details for tracking
    const plan = plans.find(p => p.key === selectedPlan);
    if (!plan) return;

    // Track begin_checkout event
    const currency = paymentMethod === 'stripe' ? 'USD' : 'XAF';
    const price = paymentMethod === 'stripe'
      ? plan.price.monthlyUsd * 100 // Convert to cents
      : plan.price.monthlyXaf;
    const totalValue = paymentMethod === 'notchpay'
      ? (pricing?.finalPrice || price * months)
      : price;

    trackBeginCheckout({
      currency,
      value: totalValue / (currency === 'USD' ? 100 : 1), // Normalize to actual currency value
      items: [{
        item_id: selectedPlan,
        item_name: plan.name,
        price: price / (currency === 'USD' ? 100 : 1),
        quantity: paymentMethod === 'notchpay' ? months : 1,
        item_category: 'subscription',
      }],
      payment_type: paymentMethod,
    });

    if (paymentMethod === 'stripe') {
      // Redirect to Stripe checkout
      // eslint-disable-next-line react-hooks/react-compiler
      window.location.href = `/api/stripe/checkout?plan=${selectedPlan}`;
    } else {
      // Redirect to NotchPay checkout
      const response = await fetch('/api/notchpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: selectedPlan,
          months,
          phone,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500"><Check className="mr-1 size-3" /> {t('payment.completed')}</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="mr-1 size-3" /> {t('payment.pending')}</Badge>;
      case 'FAILED':
        return <Badge variant="destructive"><AlertCircle className="mr-1 size-3" /> {t('payment.failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'XAF') {
      return `${amount.toLocaleString()} FCFA`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <DashboardLayout pageTitle={t('payment.title')}>
      <div className="space-y-4 md:space-y-6">
        {/* Current Subscription Card */}
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              {currentData?.planConfig.name || t('payment.currentPlan')}
            </CardTitle>
            <CardDescription>{t('payment.currentPlanDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingCurrent ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {currentData?.subscription?.expiresAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="size-4" />
                        <span>
                          {t('payment.expiresIn')} {stats?.daysRemaining} {t('payment.days')}
                        </span>
                        <span className="text-muted-foreground">
                          ({new Date(currentData.subscription.expiresAt).toLocaleDateString()})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <p className="text-2xl font-bold">
                        {currentData?.subscription?.tier === 'FREE' ? 'Free' : formatCurrency(currentData?.planConfig.price.monthly || 0, 'USD')}
                      </p>
                      {currentData?.subscription?.tier !== 'FREE' && (
                        <span className="text-sm text-muted-foreground">/mois</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Available Credits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('payment.availableCredits')}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{currentData?.creditsInfo.totalModerationCredits.toLocaleString()}</p>
                      <span className="text-sm text-muted-foreground">{t('payment.moderation')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">&nbsp;</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{currentData?.creditsInfo.totalFaqCredits.toLocaleString()}</p>
                      <span className="text-sm text-muted-foreground">FAQ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              {t('payment.availablePlans')}
            </CardTitle>
            <CardDescription>{t('payment.availablePlansDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingPlans ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {plans
                  .filter((plan) => plan.key !== 'FREE')
                  .map((plan) => (
                    <Card key={plan.key} className={selectedPlan === plan.key ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          <span className="text-3xl font-bold text-black">
                            ${plan.price.monthlyUsd}
                          </span>
                          <span className="text-sm">/mo</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="mt-0.5 size-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="w-full"
                              variant={selectedPlan === plan.key ? 'default' : 'outline'}
                              onClick={() => setSelectedPlan(plan.key)}
                            >
                              {currentData?.subscription?.tier === plan.tier
                                ? t('payment.currentPlan')
                                : t('payment.selectPlan')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t('payment.upgradeTo')} {plan.name}</DialogTitle>
                              <DialogDescription>
                                {t('payment.choosePaymentMethod')}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Payment Method Selection */}
                              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'notchpay')}>
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                                  <RadioGroupItem value="stripe" id="stripe" />
                                  <Label htmlFor="stripe" className="flex items-center justify-between flex-1 cursor-pointer">
                                    <span className="flex items-center gap-2">
                                      <CreditCard className="size-4" />
                                      {t('payment.creditCard')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Image src="/visa.jpeg" alt="Visa" width={32} height={20} className="rounded object-contain" unoptimized />
                                      <Image src="/mastercard.jpg" alt="Mastercard" width={32} height={20} className="rounded object-contain" unoptimized />
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                                  <RadioGroupItem value="notchpay" id="notchpay" />
                                  <Label htmlFor="notchpay" className="flex items-center justify-between flex-1 cursor-pointer">
                                    <span className="flex items-center gap-2">
                                      <Smartphone className="size-4" />
                                      {t('payment.mobileMoney')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Image src="/orange-money.jpeg" alt="Orange Money" width={32} height={20} className="rounded object-contain" unoptimized />
                                      <Image src="/mtn-momo.jpeg" alt="MTN Mobile Money" width={32} height={20} className="rounded object-contain" unoptimized />
                                    </div>
                                  </Label>
                                </div>
                              </RadioGroup>

                              {/* Multi-month selection for NotchPay */}
                              {paymentMethod === 'notchpay' && (
                                <div className="space-y-2">
                                  <Label>{t('payment.selectDuration')}</Label>
                                  <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v) as 1 | 3 | 6 | 12)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 {t('payment.month')}</SelectItem>
                                      <SelectItem value="3">3 {t('payment.months')} (-5%)</SelectItem>
                                      <SelectItem value="6">6 {t('payment.months')} (-10%)</SelectItem>
                                      <SelectItem value="12">12 {t('payment.months')} (-20%)</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Label>{t('payment.phoneNumber')}</Label>
                                  <Input
                                    type="tel"
                                    placeholder="+237 6XX XX XX XX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                  />

                                  {/* Price breakdown */}
                                  {pricing && (
                                    <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>{t('payment.basePrice')}</span>
                                        <span>{formatCurrency(pricing.basePrice, 'XAF')} × {months}</span>
                                      </div>
                                      {pricing.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>{t('payment.discount')} ({pricing.discount}%)</span>
                                          <span>-{formatCurrency(pricing.discountAmount, 'XAF')}</span>
                                        </div>
                                      )}
                                      <Separator />
                                      <div className="flex justify-between font-bold">
                                        <span>{t('payment.total')}</span>
                                        <span>{formatCurrency(pricing.finalPrice, 'XAF')}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <Button onClick={handleUpgrade} className="w-full">
                                <DollarSign className="mr-2 size-4" />
                                {t('payment.proceedToPayment')}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle>{t('payment.paymentHistory')}</CardTitle>
            <CardDescription>{t('payment.paymentHistoryDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : historyData && historyData.payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('payment.date')}</TableHead>
                    <TableHead>{t('payment.description')}</TableHead>
                    <TableHead>{t('payment.amount')}</TableHead>
                    <TableHead>{t('payment.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.payments.map((payment) => {
                    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDistanceToNow(new Date(payment.createdAt), {
                            addSuffix: true,
                            locale,
                          })}
                        </TableCell>
                        <TableCell>
                          {metadata.planName || 'Plan'}
                          {payment.monthsPurchased > 1 && ` (${payment.monthsPurchased} ${t('payment.months')})`}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {t('payment.noPayments')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
