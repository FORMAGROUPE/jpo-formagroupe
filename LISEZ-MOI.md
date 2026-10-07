L'objectif de ce document est de vous guider pour publier la page JPO sur GitHub Pages à l'adresse jpo.formagroupe.fr.

## Contenu du dépôt
index.html, styles.css, app.js, config.js, logo-formagroupe.svg, robots.txt, sitemap.xml, CNAME, .nojekyll et le dossier polices/ (6 fichiers). Les fichiers build.py, gabarit.html et donnees.json servent à régénérer la page.
Le dépôt doit être public pour GitHub Pages gratuit : n'y déposez aucune donnée d'inscription.

## Publication
1. Déposez tous les fichiers à la racine du dépôt (y compris .nojekyll et CNAME).
2. GitHub : Settings > Pages > Source « Deploy from a branch », branche main, dossier / (root).
3. Dans « Custom domain », saisissez jpo.formagroupe.fr, enregistrez, puis cochez « Enforce HTTPS » quand l'option apparaît.
4. Chez AMEN, dans la gestion DNS : enregistrement CNAME, nom jpo, valeur <votre-compte>.github.io, TTL 3600. Ne modifiez pas les enregistrements @ et www.
5. Attendez la propagation (de quelques minutes à quelques heures), puis ouvrez https://jpo.formagroupe.fr.

## Avant d'ouvrir les inscriptions
- config.js : renseignez l'adresse du webhook n8n (champ webhook). Tant qu'il est vide, le formulaire indique que l'inscription en ligne n'est pas encore ouverte.
- n8n : importez n8n-workflow-jpo.json (voir le guide n8n).
- Qualiopi : mention retirée à votre demande. Elle est obligatoire sur les supports de communication d'un organisme certifié : à confirmer.

## Modifier une date, un horaire ou un campus
1. Modifiez donnees.json.
2. Lancez python3 build.py : index.html est régénéré.
3. Déposez index.html sur GitHub : la page se met à jour en une à deux minutes.
Les dates passées se masquent seules.

## Lien d'inscription par date (champ Notion)
https://jpo.formagroupe.fr/?jpo=AAAA-MM-JJ#inscription
La liste complète des 19 liens est dans liens-notion.csv.

## Données reçues par le webhook (JSON)
jpo, jpoLibelle, campus (formavar, formaplus, formabeaute-la-valette, formabeaute-toulon), campusLibelle, prenom, nom, email, telephone, profil, accompagnants, formation, consentement, consentementTexte, consentementDate, page.
