# MarketLocal

Marketplace e-commerce multi-vendeurs — projet portfolio Full Stack.

MarketLocal permet à des acheteurs de découvrir et commander des produits locaux, à des vendeurs de gérer leur boutique et à un administrateur de superviser la plateforme.

## Fonctionnalités

### Acheteur
- inscription / connexion / déconnexion
- catalogue avec recherche et filtres
- fiche produit et avis
- panier persistant
- adresses de livraison enregistrées
- création et suivi des commandes
- paiement Stripe
- historique des commandes
- avis réservés aux clients ayant acheté le produit

### Vendeur
- demande de création de boutique
- validation par l'administrateur
- gestion des produits et du stock
- gestion des commandes reçues
- statistiques de ventes
- consultation des avis
- connexion Stripe Express pour recevoir les revenus

### Administrateur
- validation / refus des boutiques
- utilisateurs
- catégories
- commandes
- commissions
- statistiques globales

## Architecture

```text
MarketLocal/
├── Laravel API
│   ├── app/Http/Controllers/Api
│   ├── app/Http/Requests
│   ├── app/Http/Resources
│   ├── app/Models
│   ├── app/Services
│   ├── database/migrations
│   └── routes/api.php
│
└── Next.js
    ├── src/app
    ├── src/components
    ├── src/features
    └── src/lib
```

## Stack

- Backend : Laravel 12 / PHP 8.2+
- Auth : Laravel Sanctum
- Base de données : MySQL
- Frontend : Next.js 16 / React 19 / TypeScript
- UI : Tailwind CSS
- État client : Redux Toolkit
- HTTP : Axios
- Paiement : Stripe + Stripe Connect Express
- Images : Cloudinary (fallback local configurable)
- Tests : Pest / PHPUnit
- Déploiement : Vercel (frontend) + Render (API) + Aiven (MySQL), offres gratuites

## Installation backend

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
php artisan serve
```

Configurer ensuite les variables Stripe et Cloudinary dans `.env`.

## Installation frontend

```bash
npm install
npm run dev
```

Créer `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Stripe

### Paiement

Le serveur crée un PaymentIntent par commande. Le webhook `payment_intent.succeeded` confirme le paiement côté serveur.

### Stripe Connect

Chaque vendeur validé peut créer un compte Stripe Express et suivre son onboarding depuis **Ma boutique**. Le pays du compte connecté est volontairement configurable via `STRIPE_CONNECT_COUNTRY` : il doit correspondre au pays légalement pris en charge de la plateforme, et non simplement au pays de l'utilisateur.

Pour imposer Connect avant tout paiement en production :

```env
STRIPE_CONNECT_REQUIRED=true
```

Le webhook regroupe ensuite les lignes par boutique et crée un transfert vers chaque compte connecté. Les clés d'idempotence empêchent la duplication des transferts lors d'un rejeu du webhook.

## Cloudinary

Configurer :

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=marketlocal
CLOUDINARY_REQUIRED=true
```

Quand Cloudinary n'est pas configuré et que `CLOUDINARY_REQUIRED=false`, le développement local utilise le disque public Laravel.

## Commandes planifiées

Les commandes non payées expirent après `ORDER_EXPIRATION_MINUTES` et le stock est restitué.

En local :

```bash
php artisan schedule:work
```

En production, configurer un cron qui exécute `php artisan schedule:run` chaque minute.

## Tests

```bash
php artisan test
```

La configuration de test utilise SQLite en mémoire.

## Sécurité

- rôles contrôlés par middleware
- FormRequests Laravel
- mots de passe hashés
- Sanctum
- contrôle de propriété vendeur
- contrôle de propriété des adresses
- webhook Stripe signé
- idempotence des paiements et transferts
- stock verrouillé pendant la création des commandes
- snapshots historiques des lignes de commande
- aucun numéro de carte bancaire stocké par MarketLocal

## Comptes de démonstration

Créés par `php artisan migrate --seed` côté API (mot de passe commun : `password`). Ils sont aussi proposés en un clic sur la page de connexion.

| Rôle | E-mail | Ce qu'on peut tester |
|---|---|---|
| Acheteur | `acheteur@marketlocal.test` | panier, paiement, suivi, avis (3 commandes déjà passées) |
| Vendeuse | `vendeur@marketlocal.test` | boutique « Atelier Amina », produits, commandes reçues, statistiques |
| Administrateur | `admin@marketlocal.test` | validation de boutique (« Épicerie Fine Omar » est en attente), commissions, statistiques |

Autres comptes de démo : `youssef@`, `salma@`, `omar@` (vendeurs) et `lina@marketlocal.test` (acheteuse).
Pour masquer le bloc des comptes de démo en production : `NEXT_PUBLIC_DEMO_ACCOUNTS=false`.

## Parcours de démonstration

```text
Acheteur
  → inscription
  → catalogue
  → panier
  → adresse
  → commande
  → Stripe
  → webhook
  → commande payée
  → suivi
  → avis

Vendeur
  → inscription vendeur
  → création boutique
  → validation admin
  → onboarding Stripe
  → produits
  → commandes
  → expédition / livraison
  → statistiques

Admin
  → connexion
  → validation boutique
  → catégories
  → commissions
  → commandes
  → statistiques
```

## Déploiement

| Partie | Service gratuit |
|---|---|
| Frontend Next.js | Vercel (Hobby) |
| API Laravel | Render (Free, Docker) |
| Base MySQL | Aiven (Free) |
| Images | Cloudinary (Free) |
| Paiement | Stripe en mode test |

Variables Vercel : `NEXT_PUBLIC_API_URL` (URL Render + `/api`) et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Le guide pas à pas est dans `DEPLOIEMENT.md` du dépôt backend.

> L'API est hébergée sur l'offre gratuite de Render : après une période d'inactivité, le premier chargement peut prendre 30 à 50 secondes.

## Après récupération du projet

Le fichier `composer.json` est désormais inclus. Si `vendor/` n'est pas présent :

```bash
composer install
php artisan optimize:clear
php artisan migrate --seed
```

Puis, pour le frontend :

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

> **Important pour la mise en production :** la disponibilité de Stripe dépend du pays de l'entreprise et de la fonctionnalité Connect. Vérifiez la disponibilité actuelle de Stripe avant d'activer les transferts réels. Pour une entreprise établie au Maroc, la liste mondiale actuelle de Stripe ne classe pas le Maroc parmi les pays où Stripe Payments est directement disponible ; il faut donc prévoir une entité/pays pris en charge ou un autre prestataire pour un déploiement réel.
"# marketlocal-web" 
