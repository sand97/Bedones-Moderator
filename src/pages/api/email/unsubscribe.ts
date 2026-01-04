/**
 * Email Unsubscribe Endpoint
 * Allows users to unsubscribe from marketing emails
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { unsubscribeUser } from '../../../lib/email/mailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { t: trackingId } = req.query;

  if (!trackingId || typeof trackingId !== 'string') {
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
          <p>Lien de désinscription invalide.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const success = await unsubscribeUser(trackingId);

    if (!success) {
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
            <p>Impossible de trouver cet email.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Désinscription confirmée - Moderateur Bedones</title>
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
          <h2>Désinscription confirmée</h2>
          <p>Vous ne recevrez plus d'emails marketing de notre part.</p>
          <p style="font-size: 14px; color: #999;">
            Vous continuerez à recevoir les emails transactionnels importants
            (confirmations de paiement, notifications d'expiration, etc.).
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local'}/dashboard">
            Retour au Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Error unsubscribing user:', error);
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
          <p>Une erreur s'est produite lors de la désinscription. Veuillez réessayer plus tard.</p>
        </div>
      </body>
      </html>
    `);
  }
}
