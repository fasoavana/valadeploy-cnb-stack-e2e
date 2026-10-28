# ValaDeploy — essai E2E d'une STACK CNB (28 octobre 2026)

> **Priorité STACK, pas mono-projet.** Démonstrateur indépendant, **ne pas confondre avec le code de ValaDeploy**.

Structure du dépôt Git **monorepo** :

```
frontend/  React + Vite + serveur HTTP Node sans Dockerfile
backend/   FastAPI + psycopg, Procfile sans Dockerfile
           (routes /health et /api/v1/health pour vérifier PostgreSQL)
PostgreSQL image officielle postgres:17-alpine (composant ValaDeploy DATABASE)
```

## Avant tout déploiement

1. Décompresser ce paquet **dans un nouveau répertoire** et vérifier :
   `bash verifier_stack_avant_git.sh`. Ce test local ne touche pas à ValaDeploy.
2. Dans `frontend/`, générer le vrai verrou npm depuis le registre officiel :
   `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`
   puis `npm ci --ignore-scripts` et `npm run build`; **committer le `package-lock.json`**. Les builds CNB pourront utiliser le verrou. Le lock ne figure pas dans l'archive car le réseau du générateur de ce fichier ne permet pas de le vérifier honnêtement.
3. Créer **un nouveau** dépôt Git accessible à ValaDeploy. Ne pas réutiliser ou écraser les modifications du dépôt `fastapi-react-postgres-template`.
   `git init -b main && git add . && git commit -m "test: stack cnb React FastAPI PostgreSQL"`
   Ajouter le nouveau remote puis pousser selon les instructions de ton hébergeur. Ne mettre **aucun** secret dans Git.
4. Dans ValaDeploy : **New Stack** (pas New Project), slug `vd-cnb-stack-e2e`.
   - DATABASE : name `database`, image `postgres:17-alpine`, volume `pgdata`, accès public **non**, mode auto.
   - BACK : name `back`, URL du NOUVEAU dépôt, branche `main`, sous-répertoire `backend`, port `8000`, public **oui**, mode `buildpack`, `manual_build` vide.
   - FRONT : name `front`, même URL et branche, sous-répertoire `frontend`, port `8080`, public **oui**, mode `buildpack`, `manual_build` vide.
   - FRONT : variable d'environnement publique `BP_NODE_RUN_SCRIPTS=build`. ValaDeploy injecte automatiquement `VITE_API_URL` vers le backend (préfixe `/api/v1`) selon le code intégré. Ne pas ajouter de secrets de base de données : ValaDeploy injecte `DATABASE_URL` au BACK.
5. Générer facultativement le JSON exact de `/deploy/stack` :
   `python3 generer_payload.py https://.../repo.git`. Cela **n'appelle pas** l'API et ne déclenche aucun pipeline.
6. Lancer depuis la page Stack et consulter **les états par composant** : DB d'abord, BACK puis FRONT ; build, tests, Gitleaks, Checkov/SonarQube si activés, Trivy, Gate ; puis HTTP. **Aucun contournement du Gate.**

## Preuves de fonctionnement

- `GET https://vd-cnb-stack-e2e-front.<APP_DOMAIN>/health` → `FRONT_CNB_OK` si le service répond.
- `GET https://vd-cnb-stack-e2e-back.<APP_DOMAIN>/health` → JSON `status:up` (service BACK lancé).
- `GET https://vd-cnb-stack-e2e-back.<APP_DOMAIN>/api/v1/health` → `database:connected` **uniquement si PostgreSQL est joignable**.
- Page React → affiche `STACK_CNB_E2E_OK` uniquement après connexion réussie frontend → API → DB.
- Relever dans ValaDeploy les statuts de sécurité **individuels**, sans déclarer PASS à partir d'un test technique isolé.

## Limites et points à examiner

- La liste de builders approuvés doit inclure les langages Node.js et Python. Le Go déjà validé ne garantit pas à lui seul les autres langages.
- **Test runner actuel :** d'après les sources `ValaDeploy(7).zip` + intégration du 27/10/2026, `strategy_for_type(ProjectType.BUILDPACK)` n'a **pas de stratégie de test dédiée** ; l'étape TEST peut donc être `SKIPPED` même si les fichiers de tests existent. Ne pas annoncer que les tests applicatifs ont été exécutés avant d'avoir corrigé et vérifié ce comportement.
- Le registre et les règles iptables doivent rester disponibles ; les règles Docker→VM actuelles sont volatiles au redémarrage de l'hôte.
- Les scanners peuvent légitimement bloquer des vulnérabilités dans les images CNB ; ne pas désactiver les contrôles.
- La présence de `Procfile` pour FastAPI et de `BP_NODE_RUN_SCRIPTS=build` pour Vite sont essentielles. Le port BACK `8000` doit rester conforme au Procfile (le `PORT` injecté côté ValaDeploy est 8000).
- Le backend utilise des versions Python épinglées au 28/10/2026 ; le Security Gate et les analyses réelles déterminent l'acceptabilité, pas la seule fraîcheur de version.

## Sources du contrat

`StackDeploySchema` et `routes_stack.py`, `front_deployer.py`, `back_deployer.py`, `app_component_deployer.py`, `test_runner.py` du projet ValaDeploy reçu, plus patch CNB installé. Aucun changement apporté au code de ValaDeploy par ce paquet.
