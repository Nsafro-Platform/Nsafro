# Diagramme de cas d'utilisation — Nsafro

Version simplifiée du diagramme UML, en français.

## Fichiers

| Fichier | Description |
| --- | --- |
| `diagramme-cas-utilisation.puml` | Source PlantUML (à modifier) |
| `diagramme-cas-utilisation.png` | Rendu PNG |
| `diagramme-cas-utilisation.svg` | Rendu SVG |
| `diagramme-cas-utilisation-voyageur.puml` | Diagramme limité à l'utilisateur inscrit (source) |
| `diagramme-cas-utilisation-voyageur.png` | Rendu PNG |
| `diagramme-cas-utilisation-voyageur.svg` | Rendu SVG |
| `diagramme-classes.puml` | Diagramme de classes simplifié (source) |
| `diagramme-classes.png` | Rendu PNG |
| `diagramme-classes.svg` | Rendu SVG |
| `sequence-authentification.puml` | Séquence : connexion (source) |
| `sequence-authentification.png` | Rendu PNG |
| `sequence-authentification.svg` | Rendu SVG |
| `sequence-reservation-paiement.puml` | Séquence : réservation + paiement (source) |
| `sequence-reservation-paiement.png` | Rendu PNG |
| `sequence-reservation-paiement.svg` | Rendu SVG |
| `sequence-historique-reservations.puml` | Séquence : historique des réservations (source) |
| `sequence-historique-reservations.png` | Rendu PNG |
| `sequence-historique-reservations.svg` | Rendu SVG |

## Régénérer les images

```bash
cd docs/uml
plantuml -tpng diagramme-cas-utilisation.puml
plantuml -tsvg diagramme-cas-utilisation.puml
plantuml -tpng diagramme-cas-utilisation-voyageur.puml
plantuml -tsvg diagramme-cas-utilisation-voyageur.puml
plantuml -tpng diagramme-classes.puml
plantuml -tsvg diagramme-classes.puml
plantuml -tpng sequence-authentification.puml sequence-reservation-paiement.puml sequence-historique-reservations.puml
plantuml -tsvg sequence-authentification.puml sequence-reservation-paiement.puml sequence-historique-reservations.puml
```

## Acteurs

- **Visiteur** : accès public.
- **Voyageur** : compte créé, hérite du visiteur.
- **Administrateur** : back-office, hérite du voyageur.

## Cas d'utilisation

**Site de réservation** : consulter les voyages, consulter une fiche voyage, créer un compte, se connecter, réserver un voyage, payer la réservation, consulter ses réservations.

**Back-office** : gérer les voyages, gérer les utilisateurs, gérer les réservations, consulter le tableau de bord.

## Diagrammes de séquence

Trois scénarios, avec les participants *Application React*, *API Express* et *PostgreSQL* :

- **Authentification** : `POST /api/auth/login`, vérification bcrypt, cookie JWT, restauration via `GET /api/auth/me`.
- **Réservation et paiement** : chargement du catalogue, devis calculé côté serveur, création de la réservation avec vérification des places, puis paiement simulé.
- **Historique des réservations** : fusion des listes `bookings` et `reservations`, tri par date, paiement depuis l'historique.

## Diagramme de classes

Version simple, en français, déduite des migrations SQL : **Utilisateur**, **Voyage**, **Option**, **Reservation**, **Participant** et **Paiement**, avec les associations `effectue`, `gère`, `concerne`, `inclut`, `règle` et `sélectionne`.

## Variante « voyageur inscrit »

`diagramme-cas-utilisation-voyageur.puml` ne montre que l'utilisateur inscrit : se connecter, se déconnecter, consulter son profil, consulter les voyages et une fiche voyage, réserver, payer, consulter ses réservations.
