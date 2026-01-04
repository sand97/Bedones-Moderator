/**
 * Email Templates - Black & White Minimalist Design
 * All transactional email templates with inline CSS
 */

export interface EmailTemplateData {
  userName?: string;
  userEmail?: string;
  [key: string]: unknown;
}

/**
 * Base email template with Black header + White content
 */
function baseTemplate(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${previewText ? `<meta name="description" content="${previewText}">` : ''}
  <title>Moderateur Bedones</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #FFFFFF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header: Black background with white logo -->
          <tr>
            <td style="background-color: #000000; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                ⚫ Moderateur Bedones
              </h1>
            </td>
          </tr>

          <!-- Content: White background with black text -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 40px; border-left: 1px solid #E0E0E0; border-right: 1px solid #E0E0E0;">
              ${content}
            </td>
          </tr>

          <!-- Footer: Light gray background -->
          <tr>
            <td style="background-color: #F5F5F5; padding: 30px 40px; border-top: 1px solid #E0E0E0; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Moderateur Bedones. Tous droits réservés.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="{{unsubscribeUrl}}" style="color: #666666; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking pixel (replaced by mailer) -->
  {{trackingPixel}}
</body>
</html>
  `.trim();
}

/**
 * CTA Button component
 */
function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td style="background-color: #000000; text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 16px 40px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Payment Success Email
 */
export function paymentSuccessEmail(data: {
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  months: number;
  expiresAt: Date;
  creditsAdded: number;
}): { subject: string; html: string; previewText: string } {
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(data.expiresAt);

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Paiement confirmé !
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Votre paiement de <strong>${formattedAmount}</strong> pour le plan <strong>${data.planName}</strong> (${data.months} mois) a été confirmé avec succès.
    </p>

    <!-- Payment details box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #F5F5F5; border: 1px solid #E0E0E0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
            <strong style="color: #000000;">Plan :</strong> ${data.planName}
          </p>
          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
            <strong style="color: #000000;">Montant :</strong> ${formattedAmount}
          </p>
          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
            <strong style="color: #000000;">Durée :</strong> ${data.months} mois
          </p>
          <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
            <strong style="color: #000000;">Crédits ajoutés :</strong> ${data.creditsAdded.toLocaleString('fr-FR')}
          </p>
          <p style="margin: 0; color: #666666; font-size: 14px;">
            <strong style="color: #000000;">Expire le :</strong> ${formattedDate}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Vos crédits ont été ajoutés à toutes vos pages. Vous pouvez commencer à modérer vos commentaires dès maintenant !
    </p>

    ${ctaButton('Accéder au Dashboard', '{{dashboardUrl}}')}

    <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Merci de votre confiance,<br>
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: `✅ Paiement confirmé - ${data.planName}`,
    html: baseTemplate(content, 'Votre paiement a été confirmé avec succès'),
    previewText: 'Votre paiement a été confirmé avec succès',
  };
}

/**
 * 2. Payment Failed Email
 */
export function paymentFailedEmail(data: {
  userName: string;
  planName: string;
  amount: number;
  currency: string;
  reason?: string;
}): { subject: string; html: string; previewText: string } {
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Échec du paiement
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Malheureusement, votre paiement de <strong>${formattedAmount}</strong> pour le plan <strong>${data.planName}</strong> n'a pas pu être traité.
    </p>

    ${data.reason ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #FFF5F5; border: 1px solid #FEE; border-left: 4px solid #000;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
            <strong style="color: #000000;">Raison :</strong> ${data.reason}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Quelque chose n'a pas fonctionné ? Voici ce que vous pouvez faire :
    </p>

    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.6;">
      <li style="margin-bottom: 10px;">Vérifier que vous avez suffisamment de fonds</li>
      <li style="margin-bottom: 10px;">Essayer un autre moyen de paiement</li>
      <li style="margin-bottom: 10px;">Contacter notre équipe support si le problème persiste</li>
    </ul>

    ${ctaButton('Réessayer le paiement', '{{retryPaymentUrl}}')}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Besoin d'aide ? Répondez simplement à cet email.<br>
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: '❌ Échec de votre paiement',
    html: baseTemplate(content, 'Votre paiement n\'a pas pu être traité'),
    previewText: 'Votre paiement n\'a pas pu être traité',
  };
}

/**
 * 3. Subscription Expired Email
 */
export function subscriptionExpiredEmail(data: {
  userName: string;
  planName: string;
  expiredAt: Date;
}): { subject: string; html: string; previewText: string } {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(data.expiredAt);

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Votre abonnement a expiré
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Votre abonnement <strong>${data.planName}</strong> a expiré le ${formattedDate}. Votre compte a été basculé vers le plan gratuit (100 commentaires/mois).
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #F5F5F5; border: 1px solid #E0E0E0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: 600;">
            Quelque chose n'a pas fonctionné ?
          </p>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
            Nous aimerions comprendre pourquoi vous n'avez pas renouvelé votre abonnement. Y a-t-il un problème que nous pourrions résoudre ?
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Vous pouvez à tout moment réactiver votre abonnement et retrouver tous vos crédits mensuels.
    </p>

    ${ctaButton('Renouveler mon abonnement', '{{renewUrl}}')}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Des questions ? Répondez à cet email.<br>
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: '⏰ Votre abonnement a expiré',
    html: baseTemplate(content, 'Votre abonnement a expiré'),
    previewText: 'Votre abonnement a expiré',
  };
}

/**
 * 4. Subscription Expiring Soon (7 days)
 */
export function subscriptionExpiringSoonEmail(data: {
  userName: string;
  planName: string;
  expiresAt: Date;
  daysRemaining: number;
}): { subject: string; html: string; previewText: string } {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(data.expiresAt);

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Votre abonnement expire bientôt
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Votre abonnement <strong>${data.planName}</strong> expire dans <strong>${data.daysRemaining} jours</strong>, le ${formattedDate}.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #F5F5F5; border: 1px solid #E0E0E0; border-left: 4px solid #000000;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 10px 0; color: #000000; font-size: 16px; font-weight: 600;">
            Ne perdez pas vos crédits !
          </p>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
            Renouvelez dès maintenant pour continuer à modérer vos commentaires sans interruption.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Renouveler maintenant', '{{renewUrl}}')}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Merci de votre confiance,<br>
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: `⚠️ Votre abonnement expire dans ${data.daysRemaining} jours`,
    html: baseTemplate(content, `Votre abonnement expire dans ${data.daysRemaining} jours`),
    previewText: `Votre abonnement expire dans ${data.daysRemaining} jours`,
  };
}

/**
 * 5. Low Credits Warning
 */
export function lowCreditsEmail(data: {
  userName: string;
  planName: string;
  creditsRemaining: number;
  totalCredits: number;
  percentageRemaining: number;
}): { subject: string; html: string; previewText: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Vos crédits sont presque épuisés
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Il vous reste seulement <strong>${data.creditsRemaining.toLocaleString('fr-FR')} crédits</strong> (${Math.round(data.percentageRemaining)}% de votre quota mensuel).
    </p>

    <!-- Progress bar -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td style="background-color: #E0E0E0; height: 10px; position: relative;">
          <div style="background-color: ${data.percentageRemaining < 5 ? '#000000' : '#666666'}; height: 10px; width: ${data.percentageRemaining}%;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding-top: 10px;">
          <p style="margin: 0; color: #666666; font-size: 14px; text-align: center;">
            ${data.creditsRemaining.toLocaleString('fr-FR')} / ${data.totalCredits.toLocaleString('fr-FR')} crédits restants
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Pour continuer à modérer vos commentaires sans interruption, pensez à upgrader votre plan ou attendez le rechargement automatique de vos crédits le mois prochain.
    </p>

    ${ctaButton('Voir les plans', '{{pricingUrl}}')}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: '⚠️ Vos crédits sont presque épuisés',
    html: baseTemplate(content, `Il vous reste ${data.creditsRemaining} crédits`),
    previewText: `Il vous reste ${data.creditsRemaining} crédits`,
  };
}

/**
 * 6. Email Verification (for social auth users)
 */
export function emailVerificationEmail(data: {
  userName: string;
  verificationUrl: string;
}): { subject: string; html: string; previewText: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Vérifiez votre adresse email
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Merci d'avoir ajouté votre adresse email à votre compte Moderateur Bedones. Pour activer les notifications et recevoir des astuces de modération, veuillez vérifier votre email.
    </p>

    ${ctaButton('Vérifier mon email', data.verificationUrl)}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Ce lien expire dans 24 heures.<br>
      Si vous n'avez pas demandé cette vérification, ignorez cet email.
    </p>
  `;

  return {
    subject: 'Vérifiez votre adresse email',
    html: baseTemplate(content, 'Vérifiez votre adresse email'),
    previewText: 'Vérifiez votre adresse email',
  };
}

/**
 * 7. Welcome Email
 */
export function welcomeEmail(data: {
  userName: string;
  userEmail: string;
}): { subject: string; html: string; previewText: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #000000; font-size: 28px; font-weight: 600; line-height: 1.3;">
      Bienvenue sur Moderateur Bedones !
    </h2>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Bonjour ${data.userName},
    </p>
    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
      Merci de nous faire confiance pour modérer vos commentaires sur Facebook et Instagram. Nous sommes ravis de vous compter parmi nous !
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #F5F5F5; border: 1px solid #E0E0E0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 15px 0; color: #000000; font-size: 16px; font-weight: 600;">
            Pour commencer :
          </p>
          <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
            <li>Connectez votre page Facebook ou compte Instagram</li>
            <li>Configurez vos règles de modération</li>
            <li>Laissez notre IA gérer vos commentaires</li>
          </ol>
        </td>
      </tr>
    </table>

    ${ctaButton('Configurer ma première page', '{{dashboardUrl}}')}

    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
      Besoin d'aide ? Répondez à cet email.<br>
      L'équipe Moderateur Bedones
    </p>
  `;

  return {
    subject: '👋 Bienvenue sur Moderateur Bedones',
    html: baseTemplate(content, 'Commencez à modérer vos commentaires dès maintenant'),
    previewText: 'Commencez à modérer vos commentaires dès maintenant',
  };
}
