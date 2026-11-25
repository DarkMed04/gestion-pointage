# Gestionnaire de Pointage 

Application web full-stack de gestion du pointage quotidien avec contrôle d'accès basé sur les rôles (**ADMIN** et **SECURITY**), interface bilingue **Arabe / Français** (RTL / LTR), thèmes **Sombre / Clair** (Dark / Light), et design **Liquid Glass** adapté aux mobiles et ordinateurs.

---

## ✨ Fonctionnalités principales

- **Authentification & Sécurité (`NextAuth.js` + `bcryptjs`)**:
  - Connexion sécurisée avec gestion de session et vérification des rôles (`ADMIN` / `SECURITY`).
  - Support de `AUTH_TRUST_HOST=true` pour les environnements de production et déploiements cloud.
- **Gestion des Employés (`CRUD`)**:
  - Création, consultation, modification, et suppression des fiches employés (`matricule`, `nomComplet`, `poste`, `departement`, statut actif/inactif).
- **Pointage Journalier (`/pointage`)**:
  - Saisie manuelle des heures d'entrée et de sortie (`HH:MM`) avec bouton rapide **"Maintenant / الآن"**.
  - Calcul automatique des retards / départs anticipés et code couleur visuel (**Vert** à l'heure / **Rouge** en retard ou avance).
  - Traçabilité de l'agent (`enregistreParId`) ayant enregistré le pointage.
- **Tableau de Bord, Récompenses & Paramètres (`/dashboard`)**:
  - Statistiques du jour (employés actifs, pointés, à l'heure en vert, en retard en rouge).
  - Classement **Top 5** des employés les plus ponctuels (récompenses/discipline) et **Top 5** des plus grands retards (filtrable par période : semaine, mois, année, tout).
  - Configuration manuelle des horaires de référence (`heureEntreeStandard`, `heureSortieStandard`, `margeToleranceMinutes`).
- **Gestion des Utilisateurs & Agents de Sécurité (`/users`)**:
  - Ajout, activation/désactivation, modification (y compris réinitialisation du mot de passe), et suppression des comptes `SECURITY` et `ADMIN`.

---

## 🛠️ Stack Technique

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Langage**: TypeScript
- **Base de données & ORM**: PostgreSQL (Neon) avec Prisma ORM
- **Authentification**: NextAuth.js
- **Validation**: Zod
- **UI & Styles**: Tailwind CSS (Design Liquid Glass, Dark/Light mode, AR/FR)

---

## 📁 Structure du projet

```text
gestion-pointage/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── dashboard/route.ts
│   │   │   ├── employees/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── pointage/route.ts
│   │   │   └── users/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── employees/page.tsx
│   │   ├── login/page.tsx
│   │   ├── pointage/page.tsx
│   │   ├── users/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   └── prisma.ts
│   ├── types/
│   │   └── next-auth.d.ts
│   └── middleware.ts
├── package.json
└── README.md
```

---

## ⚙️ Installation et lancement en local

### 1. Cloner le dépôt et installer les dépendances

```bash
git clone [https://github.com/DarkMed04/gestion-pointage.git](https://github.com/DarkMed04/gestion-pointage.git)
cd gestion-pointage
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
AUTH_SECRET="votre_cle_secrete_robuste"
AUTH_TRUST_HOST=true
```

### 3. Synchroniser le schéma Prisma et générer le client

```bash
npx prisma generate
npx prisma db push
```

### 4. Lancer en développement ou en production locale

```bash
# Développement
npm run dev

# Build & Production locale
npm run build
npm run start
```

---

## 🚀 Déploiement sur Vercel

1. Importez le dépôt `DarkMed04/gestion-pointage` sur **Vercel**.
2. Ajoutez les variables d'environnement dans **Settings → Environment Variables** :
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST` = `true`
3. Assurez-vous que le script de build exécute bien Prisma :
   ```json
   "build": "prisma generate && next build",
   "postinstall": "prisma generate"
   ```
4. Lancez le **Deploy** puis vérifiez l'accès aux routes `/login`, `/dashboard`, `/employees`, `/pointage`, et `/users`.

---

## 🔐 Bonnes pratiques de sécurité

- Ne jamais commiter le fichier `.env` contenant les identifiants de base de données ou `AUTH_SECRET`.
- Changer tout mot de passe initial/par défaut immédiatement après la mise en ligne depuis `/users`.
- Effectuer une rotation du mot de passe de la base de données si une chaîne de connexion a été exposée.
