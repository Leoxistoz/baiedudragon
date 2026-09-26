# La Baie du Dragon — site + espace propriétaire

Projet Netlify indépendant, pensé pour être affiché sous
`francois-digital.fr/exemples/labaiedudragon/` via une redirection (proxy)
configurée sur le site agence.

## Pages
- `index.html` — accueil (public)
- `carte.html` — carte / menu (public)
- `admin.html` — connexion propriétaire (public, protégé par mot de passe)
- `dashboard.html` — modification du contenu (protégé, nécessite d'être connecté)
- `mentions-legales.html` — mentions légales

## Fonctions serverless (`netlify/functions`)
- `login.js` — vérifie le mot de passe (`ADMIN_PASSWORD`), pose un cookie de session signé
- `logout.js` — supprime le cookie de session
- `get-content.js` — renvoie le contenu actuel (public), lu depuis Netlify Blobs
- `update-content.js` — écrit le nouveau contenu (protégé par le cookie de session)
- `_auth.js` — logique de signature/vérification du cookie (HMAC-SHA256)

## Edge Function
- `netlify/edge-functions/protect-dashboard.js` — bloque l'accès à `dashboard.html`
  si le cookie de session est absent ou invalide.

## Variables d'environnement à configurer sur Netlify
| Nom | Rôle |
|---|---|
| `ADMIN_PASSWORD` | Mot de passe du propriétaire pour se connecter |
| `AUTH_SECRET` | Clé secrète utilisée pour signer les cookies de session |

## Stockage du contenu
Le contenu modifiable (téléphone, adresse, horaires, carte...) est stocké dans
**Netlify Blobs** (store `site-content`, clé `data`). Tant qu'aucune modification
n'a été enregistrée, `get-content.js` renvoie les valeurs par défaut définies
dans ce même fichier.

## Important : chemins relatifs
Tous les liens et appels (`style.css`, `script.js`, `carte.html`,
`.netlify/functions/...`) sont **relatifs** (sans `/` au début). C'est
indispensable pour que le site continue de fonctionner une fois affiché sous
`francois-digital.fr/exemples/labaiedudragon/` via la redirection proxy.
