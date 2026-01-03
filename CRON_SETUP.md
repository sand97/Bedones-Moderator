# Configuration des Cron Jobs

Ce document explique comment configurer les tâches planifiées (cron jobs) pour gérer automatiquement le renouvellement des crédits et les abonnements.

## 📋 Tâches Planifiées

### 1. **Renouvellement Quotidien** (Daily Credit Renewal)
**Fréquence** : Tous les jours à 18:00
**Endpoint** : `POST /api/cron/daily-renewal`

**Actions** :
- ✅ Recharge les crédits mensuels pour tous les abonnements actifs
- ✅ Rétrograde les abonnements expirés vers le plan FREE
- ✅ Met à jour les dates de renouvellement

### 2. **Rappels Hebdomadaires** (Weekly Reminders)
**Fréquence** : Tous les lundis à 09:00
**Endpoint** : `POST /api/cron/weekly-reminder`

**Actions** :
- 📧 Envoie des rappels pour les abonnements qui expirent dans 7 jours
- 📊 Notifie les utilisateurs avec peu de crédits restants

---

## 🔐 Configuration de Sécurité

### Étape 1 : Générer un CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajoutez le résultat dans votre fichier `.env` :

```env
CRON_SECRET=votre_token_secret_genere_ici
```

⚠️ **Important** : Ne partagez JAMAIS ce token et ne le committez pas dans Git !

---

## ⚙️ Option 1 : Cloudflare Cron Triggers (Recommandé)

Si vous déployez sur Cloudflare Workers/Pages, utilisez les Cron Triggers natifs.

### Configuration dans `wrangler.toml`

```toml
[triggers]
crons = [
  "0 18 * * *",  # Daily at 18:00 UTC
  "0 9 * * 1"    # Every Monday at 09:00 UTC
]

[env.production]
vars = { ENVIRONMENT = "production" }

# Secrets à ajouter via Cloudflare Dashboard ou CLI
# - CRON_SECRET
# - STRIPE_SECRET_KEY
# - NOTCH_PRIVATE_KEY
# etc.
```

### Ajouter les secrets via CLI

```bash
# Ajouter le CRON_SECRET
wrangler secret put CRON_SECRET

# Ajouter les autres secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put NOTCH_PRIVATE_KEY
wrangler secret put NOTCH_HASH_KEY
```

### Handler pour Cloudflare Workers

Créez un fichier `workers/scheduled.ts` :

```typescript
export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const hour = new Date().getUTCHours();
    const dayOfWeek = new Date().getUTCDay();

    // Daily renewal at 18:00 UTC
    if (hour === 18) {
      const response = await fetch(
        `${env.APP_URL}/api/cron/daily-renewal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CRON_SECRET}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Daily renewal:', await response.json());
    }

    // Weekly reminder on Monday (1) at 09:00 UTC
    if (dayOfWeek === 1 && hour === 9) {
      const response = await fetch(
        `${env.APP_URL}/api/cron/weekly-reminder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CRON_SECRET}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Weekly reminder:', await response.json());
    }
  },
};
```

---

## ⚙️ Option 2 : Service Externe (cron-job.org, EasyCron, etc.)

Si vous ne pouvez pas utiliser Cloudflare Cron Triggers, utilisez un service externe.

### 2.1 Avec cron-job.org (Gratuit)

1. Allez sur [cron-job.org](https://cron-job.org)
2. Créez un compte gratuit
3. Créez deux tâches :

#### Tâche 1 : Renouvellement Quotidien

- **URL** : `https://votre-domaine.com/api/cron/daily-renewal`
- **Méthode** : POST
- **Schedule** : Tous les jours à 18:00
- **Headers** :
  ```
  Authorization: Bearer VOTRE_CRON_SECRET
  Content-Type: application/json
  ```

#### Tâche 2 : Rappels Hebdomadaires

- **URL** : `https://votre-domaine.com/api/cron/weekly-reminder`
- **Méthode** : POST
- **Schedule** : Tous les lundis à 09:00
- **Headers** :
  ```
  Authorization: Bearer VOTRE_CRON_SECRET
  Content-Type: application/json
  ```

### 2.2 Avec un serveur Linux (crontab)

Si vous avez un serveur Linux, vous pouvez utiliser `crontab` :

```bash
# Éditer le crontab
crontab -e

# Ajouter ces lignes :
# Renouvellement quotidien à 18:00
0 18 * * * curl -X POST https://votre-domaine.com/api/cron/daily-renewal \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"

# Rappels hebdomadaires (lundi à 09:00)
0 9 * * 1 curl -X POST https://votre-domaine.com/api/cron/weekly-reminder \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 🧪 Tester les Cron Jobs

### Test Manuel via curl

```bash
# Test du renouvellement quotidien
curl -X POST http://localhost:3000/api/cron/daily-renewal \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"

# Test des rappels hebdomadaires
curl -X POST http://localhost:3000/api/cron/weekly-reminder \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Réponse Attendue (Succès)

```json
{
  "success": true,
  "timestamp": "2026-01-03T18:00:00.000Z",
  "duration": 1234,
  "stats": {
    "usersProcessed": 15,
    "creditsRefilled": 75000,
    "subscriptionsExpired": 2
  }
}
```

### Réponse Attendue (Erreur)

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## 📊 Monitoring et Logs

### Voir les logs Cloudflare

```bash
# En temps réel
wrangler tail

# Logs historiques (via dashboard)
https://dash.cloudflare.com/
```

### Logs de Production

Tous les cron jobs génèrent des logs détaillés :

```
🔄 Starting daily credit renewal job...
📊 Found 15 subscriptions ready for renewal
✅ Renewed credits for user user@example.com - 6000 credits added to 3 pages
⬇️ Downgraded expired subscription for user expired@example.com to FREE tier
✅ Daily credit renewal job completed successfully
📈 Stats: 15 users, 75000 credits, 2 expired
```

---

## 🚨 Gestion des Erreurs

### Que faire en cas d'échec ?

1. **Vérifier les logs** pour identifier l'erreur
2. **Réexécuter manuellement** le cron job
3. **Vérifier la base de données** pour les incohérences
4. **Contacter le support** si le problème persiste

### Erreurs Communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `401 Unauthorized` | CRON_SECRET invalide | Vérifier `.env` et le token |
| `Database connection failed` | Base de données inaccessible | Vérifier la connexion DB |
| `Failed to renew credits` | Erreur sur un utilisateur | Vérifier les logs détaillés |

---

## 📝 Checklist de Déploiement

- [ ] Générer un `CRON_SECRET` sécurisé
- [ ] Ajouter `CRON_SECRET` dans `.env` (local) et Cloudflare/production
- [ ] Configurer les Cloudflare Cron Triggers OU un service externe
- [ ] Tester les endpoints manuellement
- [ ] Vérifier les logs après la première exécution
- [ ] Configurer des alertes email en cas d'échec (TODO)

---

## 🔮 Améliorations Futures

- [ ] Envoyer des emails de notification aux utilisateurs
- [ ] Dashboard pour voir l'historique des cron jobs
- [ ] Alertes Slack/Discord en cas d'échec
- [ ] Retry automatique en cas d'erreur
- [ ] Métriques de performance (temps d'exécution, taux de succès)

---

## 📚 Ressources

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cron Expression Generator](https://crontab.guru/)
- [cron-job.org](https://cron-job.org)
