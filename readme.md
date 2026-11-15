# API REST de gestion de projets et de tâches

Mini-projet DS1 — ISIDS, réalisé individuellement par **Maycem Saidi**.

Express.js, MongoDB/Mongoose, bcryptjs et JWT. Commentaires du code en derja tunisienne écrite en alphabet latin.

## Interface de démonstration locale

Après le démarrage du serveur, ouvrez **http://localhost:3000/** dans votre navigateur. L'interface permet de s'inscrire, se connecter, gérer les projets et les tâches, rechercher et trier. Sélectionnez une carte de projet pour afficher ses tâches. Le panneau « Réponse de l'API » affiche les réponses JSON en masquant les tokens.

Le token reste uniquement en mémoire : actualiser la page demande une nouvelle connexion. L'interface fonctionne sans bibliothèque externe ni connexion internet. Elle utilise la même API et le même MongoDB local ; aucune publication sur internet n'est nécessaire. Les utilisateurs managers disposent d'un champ d'affectation par identifiant utilisateur. La promotion manager reste une commande locale, décrite ci-dessous.

## Installation

Prérequis : Node.js 22 ou supérieur, npm et MongoDB Community Server démarré. Vérification finale réalisée avec Node.js 26.

```powershell
git clone https://github.com/MaycemSAIDI3/ds1-project-task-api.git
cd ds1-project-task-api
npm.cmd ci
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Si vous avez déjà le projet, utilisez son dossier actuel. Ne remplacez pas un fichier .env déjà configuré. Copiez la chaîne aléatoire générée après JWT_SECRET= dans .env :

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/ds_backend
JWT_SECRET=REMPLACER_PAR_VOTRE_SECRET_ALEATOIRE
JWT_EXPIRES_IN=1h
```

Ne conservez pas le texte de remplacement comme secret. Ne publiez jamais .env.

Si MongoDB est arrêté, exécutez dans PowerShell en administrateur :

```powershell
Start-Service MongoDB
```

Dans le terminal du projet :

```powershell
npm.cmd start
```

Le serveur attend MongoDB avant de démarrer. Vérifiez http://localhost:3000/api/health. Cette route de diagnostic est un ajout facultatif.

Pour recharger automatiquement après les modifications :

```powershell
npm.cmd run dev
```

## Permissions

Toutes les routes de projets et tâches demandent l'en-tête `Authorization: Bearer TOKEN`.

- L'inscription impose le rôle user, même si un autre rôle est envoyé.
- Un user consulte, modifie et supprime ses propres projets et leurs tâches.
- Un manager accède à tous les projets et à leurs tâches.
- Les deux rôles peuvent créer des projets et créer des tâches dans les projets accessibles.
- Seul un manager peut renseigner, changer ou retirer assignedTo, à la création comme à la modification.
- L'utilisateur assigné doit exister. La valeur null retire l'affectation.
- L'affectation seule n'accorde pas l'accès à un projet privé. Ce choix de permissions complète l'énoncé, qui ne détaille pas cet accès.
- Un projet absent ou inaccessible renvoie 404, pour ne pas révéler les projets des autres utilisateurs.
- Supprimer un projet supprime ses tâches. Ces suppressions sont successives, sans transaction : une panne entre les opérations peut laisser un projet sans ses tâches.

### Compte manager

Inscrivez un compte puis, localement :

```powershell
npm.cmd run manager -- LOGIN_DU_COMPTE
```

Cette commande promeut un compte existant. Aucune route publique ne permet de changer de rôle. Le rôle est relu dans MongoDB à chaque requête authentifiée.

## Routes

Adresses relatives à http://localhost:3000 :

| Méthode | Route | Action |
|---|---|---|
| GET | /api/health | Vérifier que l'API répond |
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion et token JWT |
| GET | /api/auth/me | Profil connecté |
| POST | /api/projects | Créer un projet |
| GET | /api/projects | Lister les projets accessibles |
| GET | /api/projects/:id | Consulter un projet |
| PATCH | /api/projects/:id | Modifier un projet |
| DELETE | /api/projects/:id | Supprimer le projet et ses tâches |
| POST | /api/projects/:projectId/tasks | Créer une tâche |
| GET | /api/projects/:projectId/tasks | Lister les tâches du projet |
| GET | /api/projects/:projectId/tasks/:taskId | Consulter une tâche |
| PATCH | /api/projects/:projectId/tasks/:taskId | Modifier ou affecter une tâche |
| DELETE | /api/projects/:projectId/tasks/:taskId | Supprimer une tâche |

### Champs

**Inscription** : name, login, password. Login unique normalisé en minuscules. Mot de passe de 8 caractères minimum et 72 octets UTF-8 maximum, haché avec bcryptjs et jamais renvoyé. **Connexion** : login, password.

**Projet** : name obligatoire (120 caractères maximum), description facultative (2 000 maximum), status parmi in_progress, completed, paused. Owner et createdAt sont définis par le serveur.

**Tâche** : title obligatoire (120 maximum), description facultative (2 000 maximum), status parmi todo, doing, done ; deadline est une date ISO ou null ; assignedTo est un ID utilisateur existant ou null (manager uniquement). Le projet provient de l'URL et ne peut pas être changé.

### Recherche et tri

- Projets : search sur le nom et la description ; sortBy=name|status|createdAt ; order=asc|desc.
- Tâches : search sur le titre et la description ; sortBy=title|status|deadline|createdAt ; order=asc|desc ; filtre status=todo|doing|done.
- Par défaut : date de création décroissante. Recherche littérale insensible à la casse, 200 caractères maximum. Les permissions restent appliquées.

```text
GET /api/projects?search=backend&sortBy=name&order=asc
GET /api/projects/PROJECT_ID/tasks?search=rapport&status=todo&sortBy=deadline&order=asc
```

## Exemple PowerShell

Gardez le serveur ouvert et utilisez un deuxième terminal :

```powershell
$body = @{ name = 'Utilisateur demo'; login = 'demo'; password = 'DemoLocal2026!' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -ContentType 'application/json' -Body $body

$body = @{ login = 'demo'; password = 'DemoLocal2026!' } | ConvertTo-Json
$session = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
$headers = @{ Authorization = "Bearer $($session.token)" }

$body = @{ name = 'Projet demo' } | ConvertTo-Json
$result = Invoke-RestMethod -Uri 'http://localhost:3000/api/projects' -Method Post -Headers $headers -ContentType 'application/json' -Body $body
$projectId = $result.project._id

$body = @{ title = 'Preparer le rapport'; status = 'todo'; deadline = '2026-12-01' } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$projectId/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body $body

Invoke-RestMethod -Uri "http://localhost:3000/api/projects/$projectId/tasks?sortBy=title&order=asc" -Headers $headers
```

Ces identifiants servent à une démonstration locale. Si vous recommencez, connectez-vous au compte existant ou choisissez un nouveau login.

## Réponses

200 : succès ; 201 : création ; 400 : données invalides ; 401 : authentification absente, invalide ou expirée ; 403 : permission insuffisante pour l'affectation ; 404 : ressource absente ou inaccessible ; 409 : login déjà utilisé ; 413 : corps trop volumineux ; 500 : erreur interne.

## Tests

MongoDB doit être démarré et .env configuré. Aucun serveur Express préalablement lancé n'est nécessaire : les tests ouvrent un port temporaire.

```powershell
npm.cmd test
```

La suite vérifie le hachage, les JWT invalides et expirés, les rôles, l'isolation entre utilisateurs, les opérations sur projets et tâches, l'affectation, la recherche, le tri et la suppression des tâches associées. Elle supprime ses comptes et projets temporaires. Un arrêt brutal peut laisser des données de test ; les logins commencent par integration_.

## Structure

```text
src/
  app.js
  server.js
  config/database.js
  models/
  controllers/
  middleware/
  routes/
scripts/promote-manager.js
tests/
.env.example
```

Les dépendances sont décrites dans package.json et verrouillées dans package-lock.json. .gitignore exclut .env, node_modules et les logs.

## Remise

Le dépôt GitHub contient le code et les commits de progression. Si le dépôt est privé, donner accès à l'enseignant. Déposer le lien sur Classroom avant l'heure limite : cette remise reste à effectuer par l'étudiante.
