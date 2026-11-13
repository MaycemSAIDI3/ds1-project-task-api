# API REST de gestion de projets et de tâches

Mini-projet DS1 — ISIDS.

## Auteure

Maycem Saidi — travail individuel.

## Présentation

Ce projet consiste à développer une API REST permettant à des
utilisateurs authentifiés de gérer leurs projets et les tâches associées.

## Technologies prévues

- Node.js et Express.js pour le serveur.
- MongoDB et Mongoose pour la base de données.
- JSON Web Token (JWT) pour l’authentification.
- bcryptjs pour le hachage des mots de passe.

## Fonctionnalités attendues

- Inscription et connexion des utilisateurs.
- Gestion des rôles user et manager.
- Création, consultation, modification et suppression des projets.
- Création, consultation, modification et suppression des tâches.
- Recherche et tri des projets et des tâches.
- Protection des routes par des middlewares.

## Règles principales

- Un utilisateur authentifié, user ou manager, peut créer un projet.
- Seul un manager peut consulter tous les projets de tous les utilisateurs.
- Un utilisateur authentifié peut créer une tâche rattachée à un projet.
- Une tâche possède un statut parmi : todo, doing et done.
- Seul un manager peut affecter une tâche à un utilisateur.

## État du projet

Développement en cours.

Les modèles User, Project et Task ainsi que la configuration
de connexion MongoDB sont préparés.

Le serveur, les routes, les contrôleurs, les middlewares
et les tests restent à compléter.
