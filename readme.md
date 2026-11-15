# API REST de gestion de projets et de tâches

## DS1 — Mini-projet ISIDS

| Informations | |
|---|---|
| Auteure | **Maycem Saidi** |
| Réalisation | **Travail individuel (monôme)** |
| Technologies | Node.js, Express.js, MongoDB, Mongoose |
| Authentification | JWT et bcryptjs |

## Présentation

Cette API permet à des utilisateurs authentifiés de gérer des projets et leurs tâches. Elle distingue deux rôles : `user` et `manager`.

Le projet comprend la gestion des utilisateurs, les opérations de création, consultation, modification et suppression des projets et tâches, ainsi que la recherche et le tri. Les commentaires du code sont en derja tunisienne écrite en alphabet latin.

## Installation et lancement

### Prérequis

- Node.js 22 ou supérieur et npm.
- MongoDB démarré et accessible.
- Git pour cloner le dépôt.

Le projet a été testé sur Windows avec Node.js 26 et MongoDB Community Server 9.0.4.

### Configuration

```powershell
git clone https://github.com/MaycemSAIDI3/ds1-project-task-api.git
cd ds1-project-task-api
npm.cmd ci
Copy-Item .env.example .env
```

Générer un secret JWT :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Dans `.env`, renseigner les valeurs suivantes. Remplacer la valeur de `JWT_SECRET` par la chaîne générée.

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/ds_backend
JWT_SECRET=VOTRE_SECRET_ALEATOIRE
JWT_EXPIRES_IN=1h
```

Le fichier `.env` reste local et n'est pas versionné. `.env.example` contient uniquement les paramètres nécessaires, sans secret.

Si MongoDB est installé comme service Windows et qu'il est arrêté, exécuter dans PowerShell en administrateur :

```powershell
Start-Service MongoDB
```

Démarrer l'application :

```powershell
npm.cmd start
```

Le serveur écoute sur `http://localhost:3000` après la connexion à MongoDB. La route `GET /api/health` permet de vérifier qu'il répond.

Pendant le développement, `npm.cmd run dev` recharge le serveur après les modifications.

## Modèles

| Modèle | Principaux champs |
|---|---|
| User | name, login, password haché, role, createdAt |
| Project | name, description, owner, status, createdAt |
| Task | title, description, status, deadline, project, assignedTo, createdAt |

- Le login est unique et normalisé en minuscules.
- Le mot de passe comporte au moins 8 caractères et au maximum 72 octets UTF-8. Il est haché avec bcryptjs avant l'enregistrement.
- Les statuts de projet sont `in_progress`, `completed` et `paused`.
- Les statuts de tâche sont `todo`, `doing` et `done`.
- La date limite est facultative : date ISO valide ou `null`.
- Le propriétaire du projet et le projet associé à une tâche ne sont pas modifiables.

## Rôles et permissions

| Action | user | manager |
|---|---|---|
| Créer un projet | Oui | Oui |
| Voir tous les projets | Non | Oui |
| Consulter, modifier ou supprimer un projet | Ses projets | Tous les projets |
| Créer, consulter, modifier ou supprimer une tâche | Dans ses projets | Dans tous les projets |
| Affecter une tâche ou retirer son affectation | Non | Oui |

L'inscription publique attribue toujours le rôle `user`. L'affectation vérifie que l'utilisateur désigné existe.

Les règles de modification et de suppression, ainsi que l'accès aux tâches, sont des choix d'implémentation : l'énoncé ne les détaille pas. L'affectation seule ne donne pas accès au projet privé d'un autre utilisateur.

Les routes sont protégées par le middleware `authenticate`. Il vérifie la signature et l'expiration du JWT puis recharge l'utilisateur depuis MongoDB. Le rôle utilisé est celui de la base de données. Les contrôleurs appliquent les filtres de propriétaire et le contrôle d'affectation. Le middleware `authorize` est disponible et testé séparément ; les routes actuelles n'en ont pas besoin car elles acceptent les deux rôles et contrôlent les actions dans les contrôleurs.

### Préparer un compte manager

Créer d'abord le compte avec la route d'inscription, puis exécuter localement :

```powershell
npm.cmd run manager -- LOGIN_DU_COMPTE
```

La commande promeut un utilisateur existant. Aucune route publique ne permet de changer de rôle.

## Routes de l'API

Les routes ci-dessous sont relatives à `http://localhost:3000`.

| Méthode | Route | Fonction |
|---|---|---|
| GET | /api/health | État du serveur |
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion et obtention du JWT |
| GET | /api/auth/me | Profil de l'utilisateur connecté |
| POST | /api/projects | Création d'un projet |
| GET | /api/projects | Liste des projets accessibles |
| GET | /api/projects/:id | Consultation d'un projet |
| PATCH | /api/projects/:id | Modification d'un projet |
| DELETE | /api/projects/:id | Suppression du projet et de ses tâches |
| POST | /api/projects/:projectId/tasks | Création d'une tâche |
| GET | /api/projects/:projectId/tasks | Liste des tâches du projet |
| GET | /api/projects/:projectId/tasks/:taskId | Consultation d'une tâche |
| PATCH | /api/projects/:projectId/tasks/:taskId | Modification ou affectation d'une tâche |
| DELETE | /api/projects/:projectId/tasks/:taskId | Suppression d'une tâche |

Seules les routes `/api/health`, `/api/auth/register` et `/api/auth/login` sont publiques. Pour les autres :

```http
Authorization: Bearer VOTRE_TOKEN
```

### Exemples de corps JSON

Inscription :

```json
{
  "name": "Utilisateur de démonstration",
  "login": "demo",
  "password": "DemoLocal2026!"
}
```

Connexion :

```json
{
  "login": "demo",
  "password": "DemoLocal2026!"
}
```

Création d'un projet :

```json
{
  "name": "Préparation du rapport",
  "description": "Organisation du travail du mini-projet",
  "status": "in_progress"
}
```

Création d'une tâche :

```json
{
  "title": "Rédiger la présentation",
  "status": "todo",
  "deadline": "2026-12-01"
}
```

Le propriétaire est déduit du compte connecté, et le projet de la tâche provient de l'URL. Pour affecter une tâche, un manager peut ajouter `assignedTo` avec l'identifiant d'un utilisateur existant. La valeur `null` retire l'affectation.

## Recherche et tri

| Ressource | Recherche | Champs de tri | Filtre supplémentaire |
|---|---|---|---|
| Projets | name et description | name, status, createdAt | — |
| Tâches | title et description | title, status, deadline, createdAt | status |

Les paramètres sont `search`, `sortBy` et `order=asc\|desc`. Par défaut, le tri se fait par date de création décroissante. La recherche est littérale, insensible à la casse et limitée à 200 caractères.

```text
GET /api/projects?search=rapport&sortBy=name&order=asc
GET /api/projects/PROJECT_ID/tasks?status=todo&sortBy=deadline&order=asc
```

Les mêmes permissions s'appliquent pendant les recherches.

## Interface web — ajout facultatif

Une interface de démonstration est accessible sur **http://localhost:3000/**. Elle utilise les routes de l'API pour l'inscription, la connexion et la gestion des projets et tâches.

Sélectionner un projet pour afficher ses tâches. Le panneau « Réponse de l'API » montre les réponses JSON en masquant le token. L'affectation est affichée uniquement aux managers et utilise l'identifiant MongoDB de l'utilisateur.

Le token reste en mémoire : actualiser la page demande une nouvelle connexion. Aucun compte de démonstration n'est créé automatiquement lors du clonage. L'interface fonctionne sans dépendance web externe ; son ajout est enregistré dans un commit distinct du backend.

## Tests

MongoDB doit être démarré et `.env` configuré.

```powershell
npm.cmd test
```

Les tests ouvrent un serveur sur un port temporaire et créent leurs propres comptes et projets. Ils vérifient :

- Le hachage des mots de passe et l'authentification JWT.
- Le refus des tokens absents, invalides et expirés.
- L'isolation des projets entre utilisateurs et les droits du manager.
- Les opérations sur les projets et les tâches.
- L'affectation réservée au manager.
- La recherche, le tri et les données invalides, dont les dates impossibles.
- La suppression des tâches associées à un projet.
- L'accès à l'interface sans exposer les fichiers de configuration.

Les données temporaires sont supprimées à la fin des tests. Un arrêt brutal peut laisser des comptes dont le login commence par `integration_`.

## Organisation du code

```text
public/                  Interface de démonstration
src/
  app.js                 Application Express et routes
  server.js              Démarrage après connexion MongoDB
  config/database.js     Connexion à la base
  models/                Schémas User, Project et Task
  controllers/           Traitements et permissions
  middleware/            Authentification et autorisation
  routes/                Déclaration des routes
scripts/
  promote-manager.js     Attribution locale du rôle manager
tests/                   Tests automatisés
.env.example             Exemple de configuration
```

## Erreurs et limites

Les réponses utilisent notamment les codes `400` (données invalides), `401` (authentification), `403` (affectation non autorisée), `404` (ressource absente ou inaccessible) et `409` (login déjà utilisé). Les erreurs internes ne sont pas détaillées dans la réponse au client.

La suppression d'un projet et de ses tâches s'effectue en deux opérations, sans transaction. Une panne entre les opérations peut laisser un projet sans ses tâches. Les listes ne sont pas paginées et la connexion ne dispose pas de limitation du nombre de tentatives. Ces points restent des améliorations possibles pour une utilisation au-delà du mini-projet.
