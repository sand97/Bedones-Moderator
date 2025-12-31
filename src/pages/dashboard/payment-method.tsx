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
  CardFooter,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import {
  CreditCard,
  Smartphone,
  Check,
  Plus,
  Trash2,
  Star,
} from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

interface PaymentMethod {
  id: string;
  type: 'stripe' | 'notchpay';
  provider: string;
  last4?: string;
  phoneNumber?: string;
  isDefault: boolean;
  expiryDate?: string;
}

const PaymentMethodPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'stripe',
      provider: 'Visa',
      last4: '4242',
      isDefault: true,
      expiryDate: '12/25',
    },
    {
      id: '2',
      type: 'notchpay',
      provider: 'Orange Money',
      phoneNumber: '+237 6XX XX XX XX',
      isDefault: false,
    },
  ]);

  const [isAddMethodDialogOpen, setIsAddMethodDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    'stripe' | 'notchpay' | ''
  >('');

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    );
  };

  const handleRemoveMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  };

  const handleAddPaymentMethod = () => {
    if (selectedPaymentType === 'stripe') {
      // Redirect to Stripe checkout or setup
      window.open('https://checkout.stripe.com', '_blank');
    } else if (selectedPaymentType === 'notchpay') {
      // Redirect to Notch Pay setup
      window.open('https://notchpay.co', '_blank');
    }
    setIsAddMethodDialogOpen(false);
    setSelectedPaymentType('');
  };

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('sidebar.paymentMethod')}>
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
    <DashboardLayout pageTitle={t('sidebar.paymentMethod')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Moyens de Paiement</h2>
            <p className="text-sm text-muted-foreground">
              Gérez vos cartes bancaires et comptes Mobile Money
            </p>
          </div>
          <Button onClick={() => setIsAddMethodDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un moyen de paiement
          </Button>
        </div>

        {/* Payment Methods List */}
        <div className="grid gap-4">
          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Aucun moyen de paiement
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez votre première carte ou compte Mobile Money pour
                  commencer
                </p>
                <Button onClick={() => setIsAddMethodDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un moyen de paiement
                </Button>
              </CardContent>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        method.type === 'stripe'
                          ? 'bg-blue-50'
                          : 'bg-orange-50'
                      }`}
                    >
                      {method.type === 'stripe' ? (
                        <CreditCard
                          className={`h-5 w-5 ${
                            method.type === 'stripe'
                              ? 'text-blue-600'
                              : 'text-orange-600'
                          }`}
                        />
                      ) : (
                        <Smartphone
                          className={`h-5 w-5 ${
                            method.type === 'stripe'
                              ? 'text-blue-600'
                              : 'text-orange-600'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {method.provider}
                        </CardTitle>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.last4
                          ? `•••• ${method.last4}`
                          : method.phoneNumber}
                        {method.expiryDate && ` - Expire ${method.expiryDate}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="flex gap-2 pt-4">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Définir par défaut
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveMethod(method.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pricing Plans Info */}
        <Card className="bg-gradient-to-br from-black to-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Abonnement Actuel</CardTitle>
            <CardDescription className="text-gray-300">
              Plan gratuit - Limité à 10,000 tokens/mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-200 mb-4">
              Passez à un plan premium pour bénéficier de plus de tokens et de
              fonctionnalités avancées.
            </p>
            <Button variant="secondary" size="lg">
              Voir les plans premium
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog
        open={isAddMethodDialogOpen}
        onOpenChange={setIsAddMethodDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
            <DialogDescription>
              Choisissez le type de paiement que vous souhaitez ajouter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedPaymentType}
              onValueChange={(value: 'stripe' | 'notchpay') =>
                setSelectedPaymentType(value)
              }
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">Carte Bancaire (Stripe)</p>
                      <p className="text-sm text-muted-foreground">
                        Visa, Mastercard, American Express
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="notchpay" id="notchpay" />
                <Label htmlFor="notchpay" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold">Mobile Money (Notch Pay)</p>
                      <p className="text-sm text-muted-foreground">
                        Orange Money, MTN Mobile Money
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMethodDialogOpen(false);
                setSelectedPaymentType('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddPaymentMethod}
              disabled={!selectedPaymentType}
            >
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PaymentMethodPage;
