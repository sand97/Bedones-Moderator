/**
 * API Endpoint: Verify Email
 * Verifies user's email address via token sent in verification email
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { sendEmail } from '../../../lib/email/mailer';
import { welcomeEmail } from '../../../lib/email/templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur - Moderateur Bedones</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            text-align: center;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 1px solid #e0e0e0;
          }
          h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚫ Moderateur Bedones</h1>
          <h2>Erreur</h2>
          <p>Lien de vérification invalide.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // Find verification token
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!verification) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lien expiré - Moderateur Bedones</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #f5f5f5;
              padding: 40px 20px;
              text-align: center;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border: 1px solid #e0e0e0;
            }
            h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚫ Moderateur Bedones</h1>
            <h2>Lien expiré</h2>
            <p>Ce lien de vérification a expiré ou est invalide. Veuillez demander un nouveau lien de vérification.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Find user with this email
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
    });

    if (!user) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erreur - Moderateur Bedones</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #f5f5f5;
              padding: 40px 20px;
              text-align: center;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border: 1px solid #e0e0e0;
            }
            h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚫ Moderateur Bedones</h1>
            <h2>Erreur</h2>
            <p>Utilisateur introuvable.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    // Delete verification token
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    console.log(`✅ Email verified for user ${user.id}: ${user.email}`);

    // Send welcome email
    if (user.email) {
      const emailTemplate = welcomeEmail({
        userName: user.name || user.email,
        userEmail: user.email,
      });

      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        previewText: emailTemplate.previewText,
        userId: user.id,
        campaignType: 'WELCOME',
        campaignName: 'welcome',
      });

      console.log(`📧 Welcome email sent to ${user.email}`);
    }

    // Success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email vérifié - Moderateur Bedones</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            text-align: center;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 1px solid #e0e0e0;
          }
          h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
          h2 { color: #000; font-size: 20px; margin-bottom: 15px; }
          p { color: #666; line-height: 1.6; margin-bottom: 15px; }
          .emoji { font-size: 48px; margin-bottom: 20px; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover { background-color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚫ Moderateur Bedones</h1>
          <div class="emoji">✅</div>
          <h2>Email vérifié avec succès !</h2>
          <p>Votre adresse email a été vérifiée. Vous pouvez maintenant recevoir des notifications et des astuces de modération.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local'}/dashboard">
            Accéder au Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur - Moderateur Bedones</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
            text-align: center;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 1px solid #e0e0e0;
          }
          h1 { color: #000; font-size: 24px; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚫ Moderateur Bedones</h1>
          <h2>Erreur</h2>
          <p>Une erreur s'est produite lors de la vérification de votre email. Veuillez réessayer plus tard.</p>
        </div>
      </body>
      </html>
    `);
  }
}
