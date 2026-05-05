const {
Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
Header, Footer, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
TabStopType, TabStopPosition, TableOfContents
} = require('docx');
const fs = require('fs');

// ─── COULEURS & CONSTANTES ───────────────────────────────────────────────────
const BLEU = "1F3864"; // bleu marine profond
const ORANGE = "C55A11"; // accent
const GRIS = "4A4A4A";
const BLANC = "FFFFFF";
const BLEU_CLAIR = "D6E4F0";

const CM = (cm) => Math.round(cm * 567); // 1 cm = 567 DXA
const PT = (pt) => pt * 2; // half-points

const MARGINS = { top: CM(2.5), right: CM(2.5), bottom: CM(2.5), left: CM(2.5) };

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
default: {
document: { run: { font: "Times New Roman", size: PT(12), color: GRIS } }
},
paragraphStyles: [
{
id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
run: { size: PT(14), bold: true, font: "Times New Roman", color: BLEU, allCaps: true },
paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0,
border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE, space: 4 } } }
},
{
id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
run: { size: PT(12), bold: true, font: "Times New Roman", color: BLEU },
paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
},
{
id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
run: { size: PT(12), bold: true, font: "Times New Roman", color: ORANGE },
paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 }
},
{
id: "corps", name: "Corps", basedOn: "Normal", next: "corps",
run: { size: PT(12), font: "Times New Roman", color: GRIS },
paragraph: { spacing: { line: 360, lineRule: "auto", after: 120 }, alignment: AlignmentType.JUSTIFIED }
},
{
id: "titre_page", name: "TitrePage", basedOn: "Normal",
run: { size: PT(16), bold: true, font: "Times New Roman", color: BLEU, allCaps: true },
paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 } }
}
]
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const body = (text, opts = {}) => new Paragraph({
style: "corps",
children: [new TextRun({ text, ...opts })]
});

const bodyParts = (parts) => new Paragraph({
style: "corps",
children: parts.map(p => new TextRun(p))
});

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });

const space = (n = 1) => Array.from({length: n}, () =>
new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } })
);

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const bullet = (text) => new Paragraph({
numbering: { reference: "bullets", level: 0 },
style: "corps",
children: [new TextRun(text)]
});

const centered = (text, opts = {}) => new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text, font: "Times New Roman", size: PT(12), ...opts })]
});

const centeredBold = (text, size = 14, color = BLEU) => new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text, bold: true, font: "Times New Roman", size: PT(size), color, allCaps: true })]
});

// ─── TABLEAU SIMPLE ──────────────────────────────────────────────────────────
const borderCell = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: borderCell, bottom: borderCell, left: borderCell, right: borderCell };

const makeTable = (headers, rows, colWidths) => {
const totalW = colWidths.reduce((a,b) => a+b, 0);
return new Table({
width: { size: totalW, type: WidthType.DXA },
columnWidths: colWidths,
rows: [
new TableRow({
tableHeader: true,
children: headers.map((h, i) => new TableCell({
borders,
width: { size: colWidths[i], type: WidthType.DXA },
shading: { fill: BLEU, type: ShadingType.CLEAR },
margins: { top: 80, bottom: 80, left: 120, right: 120 },
children: [new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text: h, bold: true, color: BLANC, font: "Times New Roman", size: PT(11) })]
})]
}))
}),
...rows.map((row, ri) => new TableRow({
children: row.map((cell, i) => new TableCell({
borders,
width: { size: colWidths[i], type: WidthType.DXA },
shading: { fill: ri % 2 === 0 ? "F5F8FC" : BLANC, type: ShadingType.CLEAR },
margins: { top: 60, bottom: 60, left: 120, right: 120 },
children: [new Paragraph({
children: [new TextRun({ text: cell, font: "Times New Roman", size: PT(11) })]
})]
}))
}))
]
});
};

// ─── CONTENU ─────────────────────────────────────────────────────────────────

// PAGE DE GARDE
const coverPage = [
...space(2),
centeredBold("République du Cameroun", 11, "4A4A4A"),
centered("Paix – Travail – Patrie", { size: PT(11), color: GRIS }),
...space(1),
centeredBold("Lycée Bilingue de Buea", 12, BLEU),
...space(2),
new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text: "──────────────────────────────", color: ORANGE })]
}),
...space(1),
centeredBold("Rapport de Stage Pratique", 16, BLEU),
centeredBold("Série Technologies de l'Information (TI)", 13, BLEU),
...space(1),
new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text: "──────────────────────────────", color: ORANGE })]
}),
...space(2),
centeredBold("Thème :", 12, GRIS),
centeredBold("Conception et développement d'une plateforme éducative bilingue :", 13, BLEU),
centeredBold("KMERSCHOOL", 18, ORANGE),
...space(3),
centered("Effectué au sein de la structure :", { size: PT(12), color: GRIS }),
centeredBold("RHIZART", 14, BLEU),
...space(1),
centered("Période du stage : 18 Août 2025 – 26 Septembre 2025", { size: PT(11), color: GRIS }),
...space(3),
centered("Rédigé par :", { size: PT(11), color: GRIS }),
centeredBold("NGUIAMBA GEDEON", 13, BLEU),
...space(1),
centered("Sous la supervision de :", { size: PT(11), color: GRIS }),
centered("Encadreur académique : [Nom de l'encadreur académique]", { size: PT(11) }),
centered("Encadreur professionnel : [Nom du maître de stage]", { size: PT(11) }),
...space(2),
centered("Année scolaire 2024 – 2025", { size: PT(11), bold: true, color: GRIS }),
pageBreak()
];

// SOMMAIRE
const sommaireSection = [
h1("SOMMAIRE"),
new Paragraph({
children: [new TextRun({ text: "Le sommaire est généré automatiquement par votre traitement de texte.", italics: true,
color: GRIS, size: PT(11) })]
}),
...space(1),
// Sommaire manuel pour facilité
...["DÉDICACE .................................................................................................. ii",
"REMERCIEMENTS ........................................................................................ iii",
"RÉSUMÉ ..................................................................................................... iv",
"LISTE DES ABRÉVIATIONS ........................................................................ v",
"INTRODUCTION GÉNÉRALE ..................................................................... 1",
"CHAPITRE 1 : PRÉSENTATION DU CADRE DE STAGE ............................ 3",
" I. Description de RHIZART ............................................................. 3",
" II. Situation géographique ............................................................... 4",
" III. Historique ................................................................................... 4",
" IV. Objectifs de RHIZART ................................................................ 4",
" V. Ressources matérielles et humaines ............................................. 5",
"CHAPITRE 2 : TRAVAUX EFFECTUÉS ...................................................... 7",
" I. Journal de bord ............................................................................ 7",
" II. Présentation du projet KMERSCHOOL ....................................... 9",
" III. Architecture technique .............................................................. 12",
" IV. Réalisation des modules ............................................................. 14",
"CHAPITRE 3 : RÉSULTATS OBTENUS ...................................................... 18",
" I. Contributions au projet ............................................................... 18",
" II. Apports à l'entreprise ................................................................ 19",
" III. Difficultés et solutions ............................................................... 20",
" IV. Apports personnels du stage ...................................................... 21",
"CONCLUSION GÉNÉRALE ........................................................................ 22",
"MÉDIAGRAPHIE ........................................................................................ 23",
"ANNEXES ................................................................................................... 24"
].map(line => new Paragraph({
children: [new TextRun({ text: line, font: "Times New Roman", size: PT(11) })],
spacing: { after: 60 }
})),
pageBreak()
];

// DÉDICACE
const dedicaceSection = [
h1("DÉDICACE"),
...space(3),
new Paragraph({
alignment: AlignmentType.CENTER,
children: [new TextRun({ text: "À ma famille,", font: "Times New Roman", size: PT(13), bold: true, italics: true, color:
BLEU })]
}),
...space(1),
new Paragraph({
alignment: AlignmentType.CENTER,
style: "corps",
children: [new TextRun({
text: "Pour leur soutien moral et financier indéfectible tout au long de ma formation.",
italics: true
})]
}),
...space(2),
new Paragraph({
alignment: AlignmentType.CENTER,
style: "corps",
children: [new TextRun({
text: "À tous ceux qui croient en la puissance de l'éducation et de la technologie",
italics: true
})]
}),
new Paragraph({
alignment: AlignmentType.CENTER,
style: "corps",
children: [new TextRun({
text: "comme leviers du développement de notre pays, le Cameroun.",
italics: true
})]
}),
...space(2),
new Paragraph({
alignment: AlignmentType.CENTER,
style: "corps",
children: [new TextRun({
text: "Je vous dédie humblement ce travail.",
italics: true, bold: true
})]
}),
pageBreak()
];

// REMERCIEMENTS
const remerciementsSection = [
h1("REMERCIEMENTS"),
...space(1),
body("Au terme de ce stage pratique, il m'est agréable d'exprimer ma profonde gratitude à toutes les personnes qui, de
près ou de loin, ont contribué à la réussite de cette expérience professionnelle enrichissante."),
...space(1),
body("Mes remerciements vont en premier lieu à la structure RHIZART, qui m'a généreusement ouvert ses portes et offert
un environnement de travail stimulant et bienveillant. Je remercie tout particulièrement mon encadreur professionnel
pour sa disponibilité, ses précieux conseils et l'encadrement rigoureux dont il a fait preuve tout au long de mon
séjour."),
body("J'adresse également mes sincères remerciements à mon encadreur académique, dont les orientations pédagogiques
m'ont guidé dans la rédaction de ce rapport et dans la structuration de mes réflexions."),
body("Je tiens à remercier chaleureusement l'administration du Lycée Bilingue de Buea, le corps professoral de la
filière Technologies de l'Information, pour la formation de qualité qu'ils nous dispensent chaque jour."),
body("Enfin, j'exprime toute ma reconnaissance à ma famille pour son soutien moral et financier constant, ainsi qu'à mes
camarades de classe pour l'esprit de solidarité et d'entraide qui nous anime."),
...space(1),
body("Que chacun trouve ici l'expression de ma profonde gratitude."),
pageBreak()
];

// RÉSUMÉ
const resumeSection = [
h1("RÉSUMÉ"),
...space(1),
body("Ce rapport rend compte du stage pratique effectué au sein de la structure RHIZART du 18 août au 26 septembre 2025,
dans le cadre de la préparation au Baccalauréat série Technologies de l'Information (TI). Le stage a porté sur la
conception et le développement d'une plateforme éducative numérique bilingue dénommée KMERSCHOOL, destinée à couvrir
simultanément les deux sous-systèmes éducatifs camerounais — francophone et anglophone. Les travaux réalisés ont englobé
l'architecture de la base de données relationnelle sous Supabase, le développement du tableau de bord administrateur, du
portail professeur avec système KYC, ainsi que la mise en place de mécanismes avancés de validation de contenu par
déclencheurs SQL et politiques de sécurité au niveau ligne (RLS). Le rapport expose la démarche méthodologique adoptée,
les technologies utilisées, les difficultés rencontrées et les solutions apportées, ainsi que les enseignements tirés de
cette expérience formatrice."),
...space(1),
body("Mots-clés : plateforme éducative, bilingue, Supabase, HTML/CSS/JS, base de données, RLS, tableau de bord, portail
professeur."),
pageBreak()
];

// LISTE DES ABRÉVIATIONS
const abreviationsSection = [
h1("LISTE DES ABRÉVIATIONS"),
...space(1),
makeTable(
["Sigle / Abréviation", "Signification"],
[
["API", "Application Programming Interface (Interface de programmation)"],
["BAC", "Baccalauréat"],
["BD", "Base de Données"],
["BEPC", "Brevet d'Études du Premier Cycle"],
["CSS", "Cascading Style Sheets (Feuilles de style en cascade)"],
["GCE", "General Certificate of Education"],
["HTML", "HyperText Markup Language"],
["JS", "JavaScript"],
["KYC", "Know Your Customer (Vérification d'identité)"],
["MINESEC", "Ministère des Enseignements Secondaires"],
["MVP", "Minimum Viable Product"],
["RLS", "Row Level Security (Sécurité au niveau ligne)"],
["SQL", "Structured Query Language"],
["TI", "Technologies de l'Information"],
["UI", "User Interface (Interface utilisateur)"],
["URL", "Uniform Resource Locator"],
["UX", "User Experience (Expérience utilisateur)"],
["XAF", "Franc CFA de la Communauté Économique et Monétaire d'Afrique Centrale"],
],
[2800, 6500]
),
pageBreak()
];

// INTRODUCTION
const introductionSection = [
h1("INTRODUCTION GÉNÉRALE"),
...space(1),
// Paragraphe 1 : Contexte
bodyParts([
{ text: "Contexte. ", bold: true },
{ text: "Ce rapport de stage est rédigé dans le cadre de la préparation au Baccalauréat de la série Technologies de
l'Information (TI), conformément aux dispositions du MINESEC imposant à tout candidat un stage pratique d'entreprise
d'une durée de cinq semaines. C'est au sein de RHIZART, une structure spécialisée dans le développement de solutions
numériques basée à Buea (Cameroun), que ce stage s'est déroulé du 18 août au 26 septembre 2025. La mission principale
confiée a été de participer au développement de KMERSCHOOL, une plateforme éducative numérique inédite conçue pour
répondre aux besoins pédagogiques spécifiques des élèves des deux sous-systèmes éducatifs camerounais, francophone et
anglophone, qui coexistent dans notre pays sans jamais avoir bénéficié d'un outil commun et adapté." }
]),
...space(1),
// Paragraphe 2 : Problématique
bodyParts([
{ text: "Problématique. ", bold: true },
{ text: "Le Cameroun compte plus de 8 millions d'élèves répartis entre deux systèmes éducatifs distincts aux curricula,
aux examens et aux langues d'enseignement différents. Si des plateformes éducatives numériques existent à l'échelle
internationale — Khan Academy, Coursera, ou encore des sites français et anglophones — aucune d'entre elles ne prend en
charge simultanément et nativement la réalité bilingue et biculturelle du système éducatif camerounais. Les élèves de
Terminale C (francophone) et ceux d'Upper Sixth Science (anglophone) ne disposent d'aucun outil numérique local,
accessible et adapté à leurs programmes officiels, leurs séries et leurs examens (Baccalauréat, GCE A-Level). Comment
concevoir et développer une plateforme éducative qui gère de manière native les deux sous-systèmes, tout en permettant
une administration centralisée du contenu et une implication rémunérée des professeurs locaux ?" }
]),
...space(1),
// Paragraphe 3 : Méthodologie
bodyParts([
{ text: "Méthodologie. ", bold: true },
{ text: "Pour répondre à cette problématique, une approche itérative et modulaire a été adoptée. Le travail a débuté par
une phase d'analyse et de modélisation de la base de données sous Supabase (PostgreSQL), structurée autour des entités
clés du système éducatif camerounais : sous-systèmes, cycles, niveaux scolaires, séries, cours et examens. Ensuite, le
développement frontend a été conduit en HTML, CSS et JavaScript vanilla, garantissant légèreté et compatibilité. Trois
grands modules ont été successivement construits : le tableau de bord administrateur, le portail professeur avec système
KYC, et le pipeline de validation de contenu par déclencheurs SQL. Des politiques de sécurité au niveau ligne (RLS) ont
été implémentées pour isoler les accès selon les rôles." }
]),
...space(1),
// Paragraphe 4 : Plan
bodyParts([
{ text: "Plan. ", bold: true },
{ text: "Le présent rapport est structuré en trois chapitres. Le premier chapitre présente le cadre du stage,
c'est-à-dire la structure RHIZART, son contexte et ses ressources. Le second chapitre expose de façon détaillée les
travaux effectués : le journal de bord, la présentation et l'architecture du projet KMERSCHOOL, ainsi que la réalisation
des différents modules. Le troisième chapitre analyse les résultats obtenus, les apports du stage à l'entreprise et à ma
formation, ainsi que les difficultés rencontrées et les solutions apportées. Une conclusion générale clôt ce rapport en
ouvrant sur les perspectives." }
]),
pageBreak()
];

// CHAPITRE 1
const chapitre1 = [
h1("CHAPITRE 1 : PRÉSENTATION DU CADRE DE STAGE"),
...space(1),

h2("I. Description de RHIZART"),
body("RHIZART est une structure entrepreneuriale opérant dans le domaine du numérique et des technologies de
l'information au Cameroun. Spécialisée dans le développement de solutions web et mobiles innovantes, elle ambitionne de
contribuer à la transformation digitale de secteurs stratégiques tels que l'éducation, la santé et le commerce. Son
approche est fondée sur l'utilisation de technologies modernes, open-source et adaptées aux réalités locales
africaines."),
body("La structure se positionne comme un incubateur de projets technologiques à fort impact social, en mobilisant des
compétences pluridisciplinaires pour concevoir des produits numériques durables. KMERSCHOOL constitue l'un de ses
projets phares, illustrant parfaitement sa vocation éducative et citoyenne."),
...space(1),

h2("II. Situation géographique"),
body("RHIZART est implantée à Buea, chef-lieu de la Région du Sud-Ouest du Cameroun. Buea est une ville universitaire
dynamique, abritant l'Université de Buea — première université anglophone d'Afrique centrale — ce qui en fait un terreau
fertile pour les initiatives technologiques et entrepreneuriales. La structure bénéficie ainsi d'un écosystème
académique et numérique stimulant, facilitant le recrutement de compétences locales et le développement de partenariats
stratégiques."),
...space(1),

h2("III. Historique"),
body("RHIZART a été fondée avec pour vision de combler le déficit en solutions numériques adaptées aux besoins
spécifiques des populations camerounaises et africaines. Depuis sa création, elle a développé une expertise progressive
dans les domaines du développement web, de la gestion de bases de données et de l'ingénierie des systèmes éducatifs
numériques. [Note : les informations complémentaires sur l'historique détaillé de la structure seront complétées
ultérieurement par le stagiaire en accord avec le maître de stage.]"),
...space(1),

h2("IV. Objectifs de RHIZART"),
body("Les objectifs stratégiques de RHIZART s'articulent autour de plusieurs axes complémentaires :"),
bullet("Concevoir et déployer des solutions numériques innovantes répondant aux défis spécifiques du contexte africain
;"),
bullet("Contribuer à la démocratisation de l'accès à l'éducation de qualité grâce aux outils technologiques ;"),
bullet("Valoriser les compétences des enseignants et des créateurs de contenu locaux en les intégrant dans une chaîne de
valeur numérique rémunérée ;"),
bullet("Développer des plateformes accessibles, légères et adaptées aux infrastructures réseau disponibles en zone
rurale et urbaine camerounaise ;"),
bullet("Créer des partenariats avec les institutions éducatives, les établissements scolaires et les organismes
gouvernementaux pour ancrer ses solutions dans le tissu institutionnel."),
...space(1),

h2("V. Ressources matérielles et humaines"),
body("La structure dispose d'un environnement de travail équipé en postes informatiques, connexion internet haut débit
et outils de développement collaboratif. L'équipe est composée de développeurs web, de concepteurs UX/UI et d'un
responsable de projet expérimenté assurant la coordination des travaux."),
body("Pendant la durée du stage, le stagiaire a bénéficié d'un poste de travail dédié équipé des outils suivants :"),
makeTable(
["Ressource", "Description"],
[
["Ordinateur", "Laptop personnel avec accès internet"],
["Éditeur de code", "Visual Studio Code (VS Code)"],
["Navigateur", "Google Chrome + DevTools"],
["Gestionnaire de versions", "Git / GitHub"],
["SGBD Cloud", "Supabase (PostgreSQL)"],
["Outils de collaboration", "Notion, WhatsApp"],
["Framework CSS", "Tailwind CSS (CDN)"],
["Langage frontend", "HTML5 / CSS3 / JavaScript (Vanilla)"],
],
[3000, 6300]
),
pageBreak()
];

// CHAPITRE 2
const chapitre2 = [
h1("CHAPITRE 2 : TRAVAUX EFFECTUÉS"),
...space(1),

h2("I. Journal de bord"),
body("Conformément aux exigences du guide de stage du MINESEC, un journal de bord a été tenu tout au long des cinq
semaines de stage. Ce journal constitue une trace fidèle de l'ensemble des activités réalisées et des apprentissages
acquis au quotidien."),
...space(1),

h3("Semaine 1 (18 – 22 Août 2025) : Insertion et prise en main"),
body("La première semaine a été consacrée à l'insertion dans la structure et à la découverte du projet KMERSCHOOL. Dès
le premier jour, une présentation de l'équipe, des postes de travail et de l'environnement technique a été effectuée. Le
maître de stage a exposé la vision globale de la plateforme, ses enjeux et les spécifications fonctionnelles
attendues."),
body("Les activités principales de cette semaine ont été les suivantes :"),
bullet("Lundi 18 août : Accueil officiel, présentation de la structure et visite des espaces de travail. Lecture de la
documentation existante sur KMERSCHOOL et prise en main des outils (VS Code, Supabase, GitHub) ;"),
bullet("Mardi 19 août : Étude approfondie du schéma de base de données existant. Compréhension des entités principales :
sous_systemes, cycles, niveaux_scolaires, series_specialites, cours, examens. Analyse des relations entre tables ;"),
bullet("Mercredi 20 août : Prise en main de Supabase (authentification, politiques RLS, storage). Exploration du tableau
de bord Supabase et tests de premières requêtes SQL ;"),
bullet("Jeudi 21 août : Développement des premières interfaces HTML/CSS du tableau de bord administrateur. Mise en place
de la navigation entre les sections principales ;"),
bullet("Vendredi 22 août : Révision du travail de la semaine, rédaction du compte-rendu, discussion avec le maître de
stage sur les priorités de la semaine suivante."),
...space(1),

h3("Semaine 2 (25 – 29 Août 2025) : Développement du tableau de bord admin"),
body("La deuxième semaine a marqué le véritable démarrage du développement. L'objectif principal était de construire le
tableau de bord administrateur permettant la gestion des cours, matières et utilisateurs pour les deux sous-systèmes
éducatifs."),
bullet("Lundi 25 août : Développement de la page de connexion administrateur (admin-login.html) avec vérification du
rôle via la table admins dans Supabase. Mise en place de la session et de la redirection sécurisée ;"),
bullet("Mardi 26 août : Développement du module de gestion des cours. Formulaire de création de cours avec champs
bilingues (Français/Anglophone), upload d'images dans Supabase Storage (bucket course-images) et upload de PDF ;"),
bullet("Mercredi 27 août : Implémentation des filtres par sous-système. Un cours francophone est lié à sous_systeme_id =
francophone et ne s'affiche pas dans la section anglophone, et vice versa. Tests de cohérence ;"),
bullet("Jeudi 28 août : Développement du système de chargement dynamique des niveaux scolaires et des séries selon le
sous-système sélectionné (DataLoader.loadNiveaux et DataLoader.loadSeries) ;"),
bullet("Vendredi 29 août : Tests complets, correction des bugs d'affichage, mise à jour des styles CSS et préparation du
rapport hebdomadaire."),
...space(1),

h3("Semaine 3 (1 – 5 Septembre 2025) : Portail professeur et KYC"),
body("La troisième semaine a été dédiée au développement du portail professeur, l'un des modules les plus complexes du
projet, intégrant un système de vérification d'identité (KYC) complet."),
bullet("Lundi 1er septembre : Conception et développement de la page d'inscription professeur (professeur-login.html).
Formulaire en deux étapes : informations personnelles d'abord, puis upload des documents de vérification ;"),
bullet("Mardi 2 septembre : Intégration de l'upload de documents (diplôme, carte d'identité, attestation d'enseignement)
vers un bucket Supabase Storage privé. Enregistrement des métadonnées dans la table documents_verification ;"),
bullet("Mercredi 3 septembre : Développement du système de statut : un professeur nouvellement inscrit a le statut
en_attente. Il ne peut accéder à son espace qu'après approbation par un administrateur. Mise en place des redirections
conditionnelles ;"),
bullet("Jeudi 4 septembre : Développement du tableau de bord professeur (professeur-dashboard.html) avec section profil
(avatar, spécialités, sous-système), section de soumission d'épreuves et historique des soumissions ;"),
bullet("Vendredi 5 septembre : Tests des flux complets (inscription → attente → approbation admin → accès dashboard) et
correction des failles de sécurité RLS."),
...space(1),

h3("Semaines 4 et 5 (8 – 26 Septembre 2025) : Validation, tests et finalisation"),
body("Les deux dernières semaines ont été consacrées à la mise en place du pipeline de validation des épreuves soumises
par les professeurs, à la correction des problèmes de sécurité RLS et à la finalisation de l'ensemble des modules."),
bullet("Développement du module de validation admin des candidatures professeurs : quatre onglets (candidatures en
attente, révision d'épreuves, gestion des professeurs actifs, suivi des paiements) ;"),
bullet("Implémentation du déclencheur SQL (fn_valider_epreuve) : lors de la validation d'une épreuve soumise par un
professeur, ce trigger peuple automatiquement les tables examens, questions_examen et choix_reponses à partir du JSON de
soumission ;"),
bullet("Résolution d'un problème critique de récursivité infinie dans les politiques RLS de la table professeurs. La
correction a consisté à remplacer les sous-requêtes auto-référencielles par des vérifications directes sur la table
admins ;"),
bullet("Développement du système i18n (internationalisation) avec un dictionnaire de ~80 clés FR/EN pour un affichage
entièrement bilingue du dashboard professeur ;"),
bullet("Tests de bout en bout, correction des bugs finaux, rédaction de la documentation technique et préparation du
rapport de stage."),
...space(1),

h2("II. Présentation du projet KMERSCHOOL"),

h3("2.1 Contexte et genèse"),
body("KMERSCHOOL (KAMERSCHOOL) est la première plateforme éducative numérique camerounaise conçue pour gérer nativement
et simultanément les deux sous-systèmes éducatifs en vigueur dans le pays. Le Cameroun présente en effet une singularité
éducative unique en Afrique : deux systèmes d'enseignement secondaire distincts cohabitent sur son territoire, héritage
de son histoire coloniale."),
body("Le sous-système francophone, calqué sur le modèle français, organise le cursus en cycles conduisant au BEPC
(classe de Troisième), au Probatoire (Première) et au Baccalauréat (Terminale). Le sous-système anglophone,
d'inspiration britannique, conduit au GCE O-Level (Form 5) et au GCE A-Level (Upper Sixth). Ces deux systèmes ont des
curricula, des matières, des séries et des examens entièrement différents."),
body("Fort de ce constat, RHIZART a imaginé une plateforme qui serve de pont numérique entre ces deux univers éducatifs,
offrant à plus de 8 millions d'élèves camerounais un accès à des ressources pédagogiques adaptées à leur curriculum
spécifique."),
...space(1),

h3("2.2 Objectifs du projet"),
body("Les objectifs de KMERSCHOOL s'articulent autour de quatre grandes ambitions :"),
bullet("Offrir un accès équitable à des contenus pédagogiques de qualité, alignés sur les programmes officiels du
MINESEC, pour tous les élèves camerounais, qu'ils soient francophones ou anglophones ;"),
bullet("Permettre aux professeurs locaux de soumettre et de monétiser leur contenu éducatif (cours, examens, exercices)
via un portail dédié avec système de rémunération ;"),
bullet("Doter les administrateurs d'un tableau de bord centralisé pour gérer l'ensemble du contenu, valider les
contributions des professeurs et suivre les indicateurs clés ;"),
bullet("Proposer aux élèves une expérience d'apprentissage personnalisée, gamifiée et accessible, incluant des cours,
des exercices, des examens blancs et les annales officielles."),
...space(1),

h3("2.3 Public cible"),
makeTable(
["Profil", "Description", "Accès"],
[
["Élève francophone", "6ème → Terminale, BEPC / BAC", "Dashboard élève, cours FR"],
["Élève anglophone", "Form 1 → Upper Sixth, GCE O/A-Level", "Dashboard élève, cours EN"],
["Professeur", "Enseignant certifié TI/MINESEC", "Portail professeur, soumission"],
["Administrateur", "Équipe RHIZART/KMERSCHOOL", "Dashboard admin complet"],
],
[2500, 4000, 2800]
),
...space(1),

h2("III. Architecture technique"),

h3("3.1 Technologies utilisées"),
body("Le choix des technologies a été guidé par des critères de légèreté, de performance, de facilité de déploiement et
d'adaptation au contexte camerounais (connectivité variable, appareils d'entrée de gamme)."),
makeTable(
["Couche", "Technologie", "Rôle"],
[
["Frontend", "HTML5 / CSS3 / JavaScript Vanilla", "Interfaces utilisateur (admin, professeur)"],
["CSS Framework", "Tailwind CSS (via CDN)", "Stylisation rapide et responsive"],
["Backend / BDD", "Supabase (PostgreSQL)", "Base de données, authentification, stockage"],
["Authentification", "Supabase Auth", "Gestion des sessions et tokens JWT"],
["Stockage fichiers", "Supabase Storage", "Images de cours, PDF, avatars, documents KYC"],
["Sécurité", "Row Level Security (RLS)", "Contrôle d'accès au niveau des données"],
["Logique métier", "Fonctions SQL / Triggers PostgreSQL", "Validation et promotion des épreuves"],
],
[2000, 3200, 4100]
),
...space(1),

h3("3.2 Architecture de la base de données"),
body("La base de données de KMERSCHOOL, hébergée sur Supabase, est structurée autour d'un modèle relationnel riche
couvrant l'ensemble des entités du système éducatif camerounais. Elle comprend plus de 30 tables organisées en plusieurs
domaines fonctionnels :"),
bullet("Domaine éducatif : sous_systemes, cycles, niveaux_scolaires, series_specialites, matieres, cours, chapitres,
examens, questions_examen, choix_reponses ;"),
bullet("Domaine utilisateurs : profiles (élèves), professeurs, admins, avec authentification Supabase Auth ;"),
bullet("Domaine contenu professeur : soumissions_epreuves (JSON de questions), documents_verification (KYC) ;"),
bullet("Domaine monétisation : paiements_professeurs avec traçabilité des versements (MTN Money, Orange Money) ;"),
bullet("Domaine progression : progressions_cours, passages_examen, soumissions_exercices, badges."),
...space(1),

h3("3.3 Schéma des acteurs et flux"),
body("Le schéma ci-dessous illustre les interactions entre les trois types d'acteurs de la plateforme et les flux de
données associés :"),
makeTable(
["Acteur", "Action", "Table(s) concernée(s)"],
[
["Professeur", "S'inscrit et soumet ses documents KYC", "professeurs, documents_verification"],
["Admin", "Valide le professeur (statut → approuve)", "professeurs"],
["Professeur approuvé", "Soumet une épreuve (JSON de questions)", "soumissions_epreuves"],
["Admin", "Valide l'épreuve → trigger SQL", "examens, questions_examen, choix_reponses"],
["Trigger SQL", "Peuple les tables et met à jour les gains", "professeurs (gains_total)"],
["Admin", "Déclenche le paiement", "paiements_professeurs"],
["Élève", "Consulte les cours et passe les examens", "cours, passages_examen"],
],
[2000, 3300, 4000]
),
...space(1),

h2("IV. Réalisation des modules"),

h3("4.1 Module 1 : Tableau de bord administrateur"),
body("Le tableau de bord administrateur constitue le centre névralgique de la plateforme. Accessible uniquement après
vérification du rôle dans la table admins, il est organisé en sections distinctes accessibles via une navigation
latérale."),
body("La page d'accueil du dashboard présente trois espaces de gestion : Gestion Élèves (système éducatif camerounais),
Gestion Dev-Web et Gestion Designer. L'espace Élèves, le plus développé, offre :"),
bullet("Un onglet Francophone avec formulaire de création de cours (matière, chapitre, classe, série, contenu riche,
image, PDF, vidéo) ;"),
bullet("Un onglet Anglophone avec le même formulaire adapté en anglais ;"),
bullet("Un chargement dynamique des niveaux scolaires et séries via des appels Supabase ;"),
bullet("La liste des cours existants avec actions de modification et de suppression ;"),
bullet("Des statistiques en temps réel (total cours, élèves par sous-système)."),
...space(1),

h3("4.2 Module 2 : Portail professeur"),
body("Le portail professeur est un espace autonome, distinct du dashboard admin, accessible via une page de connexion
dédiée (professeur-login.html). Il intègre un système d'inscription en deux étapes :"),
body("Étape 1 — Informations personnelles : le professeur renseigne ses coordonnées, spécialités, sous-systèmes
enseignés, niveaux et établissement d'appartenance."),
body("Étape 2 — KYC documentaire : le professeur uploade obligatoirement trois types de documents (diplôme
universitaire, pièce d'identité, attestation d'enseignement) dans un bucket Supabase Storage à accès restreint. Ces
documents sont enregistrés dans la table documents_verification."),
body("Une fois inscrit, le professeur attend la validation de son compte par un administrateur. Selon son statut
(en_attente, approuvé, rejeté), il est redirigé vers l'interface correspondante. Après approbation, son tableau de bord
personnel lui donne accès à :"),
bullet("Son profil complet avec photo d'avatar, spécialités et statistiques de performance ;"),
bullet("Un formulaire de soumission d'épreuve avec builder de questions (QCM, vrai/faux, réponse courte) ;"),
bullet("L'historique de ses soumissions avec statuts (brouillon, soumis, en révision, validé, rejeté) ;"),
bullet("Ses statistiques financières (gains en attente, gains versés, taux d'acceptation) ;"),
bullet("Un système de changement de mot de passe et de préférences de langue (FR/EN)."),
...space(1),

h3("4.3 Module 3 : Pipeline de validation des épreuves"),
body("Ce module représente la pièce la plus complexe du système. Lorsqu'un professeur soumet une épreuve, son contenu
est stocké sous forme de JSON dans le champ contenu_json de la table soumissions_epreuves. L'administrateur peut
consulter une prévisualisation complète de l'épreuve avant de se prononcer."),
body("À la validation (passage du statut à valide), un déclencheur PostgreSQL (fn_valider_epreuve) est automatiquement
déclenché. Ce trigger effectue en cascade :"),
bullet("La création d'un enregistrement dans la table examens avec toutes les métadonnées de l'épreuve ;"),
bullet("La décompression du JSON et l'insertion de chaque question dans questions_examen ;"),
bullet("L'insertion des choix de réponses correspondants dans choix_reponses ;"),
bullet("La mise à jour du champ examen_id dans soumissions_epreuves pour référencer l'examen produit ;"),
bullet("Le calcul et la mise à jour des gains du professeur via la fonction incrémentale incrementer_gains_prof ;"),
bullet("Le recalcul du taux d'acceptation via la fonction recalculer_stats_prof."),
body("Cette approche garantit l'intégrité transactionnelle des données : soit toutes les opérations réussissent, soit
elles sont toutes annulées. Aucune donnée partielle ne peut exister en base."),
...space(1),

h3("4.4 Module 4 : Système bilingue (i18n)"),
body("Pour garantir une expérience utilisateur cohérente dans les deux langues, un système d'internationalisation (i18n)
a été développé en JavaScript. Un dictionnaire de ~80 clés couvre l'ensemble des libellés de l'interface du dashboard
professeur. La langue d'interface est automatiquement détectée à partir du sous-système du professeur (francophone → FR,
anglophone → EN) et peut être modifiée manuellement."),
pageBreak()
];

// CHAPITRE 3
const chapitre3 = [
h1("CHAPITRE 3 : RÉSULTATS OBTENUS"),
...space(1),

h2("I. Contributions au projet"),
body("À l'issue des cinq semaines de stage, les contributions apportées au projet KMERSCHOOL sont concrètes et
mesurables. Le tableau suivant synthétise les livrables produits et leur état d'avancement à la fin du stage :"),
makeTable(
["Module / Livrable", "État", "Technologies clés"],
[
["Page de connexion administrateur", "100% finalisé", "HTML, JS, Supabase Auth"],
["Dashboard admin (espace élèves)", "85% finalisé", "HTML, Tailwind, JS, Supabase"],
["Gestion des cours (FR + EN)", "90% finalisé", "JS, Supabase Storage, RLS"],
["Portail professeur (inscription + KYC)", "100% finalisé", "HTML, JS, Supabase Storage"],
["Dashboard professeur (profil, stats)", "90% finalisé", "HTML, JS, i18n"],
["Soumission et suivi d'épreuves", "85% finalisé", "JS, Supabase, JSON"],
["Pipeline de validation (trigger SQL)", "100% finalisé", "PostgreSQL, PL/pgSQL"],
["Politiques RLS (sécurité)", "100% finalisé", "PostgreSQL RLS"],
["Système i18n (FR/EN)", "100% finalisé", "JavaScript"],
["Module paiements professeurs (UI)", "70% finalisé", "HTML, JS, Supabase"],
],
[3800, 1800, 3700]
),
...space(1),

h2("II. Apports à l'entreprise"),
body("Les travaux réalisés pendant ce stage ont constitué une contribution directe et opérationnelle au projet
KMERSCHOOL, le projet central de RHIZART. Plusieurs apports significatifs méritent d'être soulignés :"),
body("Sur le plan technique, la mise en place du pipeline de validation par déclencheurs SQL constitue une avancée
architecturale majeure. Cette approche « trigger-driven » garantit la cohérence des données sans dépendance à la logique
applicative, ce qui rend le système plus robuste et plus facile à maintenir. De même, la résolution du problème de
récursivité infinie dans les politiques RLS a permis de sécuriser l'ensemble de la plateforme contre des accès non
autorisés."),
body("Sur le plan fonctionnel, le portail professeur avec système KYC ouvre à RHIZART une nouvelle dimension économique
: la possibilité de faire contribuer et rémunérer des centaines de professeurs locaux comme créateurs de contenu, créant
ainsi un modèle économique vertueux et durable pour la plateforme."),
body("Sur le plan de la vision produit, les choix architecturaux opérés (filtrage bilingue à la couche données, RPC
Supabase, triggers automatiques) posent des fondations solides pour l'évolution future du produit vers un public de 8
millions d'élèves potentiels."),
...space(1),

h2("III. Difficultés rencontrées et solutions apportées"),
body("Le développement de KMERSCHOOL a confronté le stagiaire à plusieurs défis techniques et organisationnels dont
voici les principaux :"),
...space(1),

h3("3.1 Récursivité infinie dans les politiques RLS"),
body("La première difficulté majeure a été la découverte d'une erreur 500 lors des appels à la table professeurs. Après
investigation, il s'est avéré que les politiques RLS vérifiaient le rôle en interrogeant la table professeurs elle-même
depuis la politique de cette même table, créant une boucle infinie."),
bodyParts([
{ text: "Solution apportée : ", bold: true },
{ text: "Suppression des politiques auto-référencielles et recréation en utilisant des vérifications directes sur la
table admins via auth.uid(), sans sous-requête sur professeurs. Cette approche élimine toute possibilité de
récursivité." }
]),
...space(1),

h3("3.2 Complexité du schéma bilingue"),
body("La gestion simultanée de deux sous-systèmes éducatifs avec des niveaux, cycles et séries distincts a nécessité une
modélisation rigoureuse pour éviter les confusions. Un cours francophone ne doit jamais apparaître dans l'interface
anglophone et vice versa."),
bodyParts([
{ text: "Solution apportée : ", bold: true },
{ text: "Toutes les entités (cours, examens, exercices) sont liées à un sous_systeme_id UUID. Le filtrage est effectué
systématiquement au niveau des requêtes Supabase, via des RPCs qui inspectent le tableau sous_systemes du professeur. La
logique UI reste ainsi propre et découplée." }
]),
...space(1),

h3("3.3 Synchronisation du trigger SQL avec la structure JSON"),
body("Le déclencheur PostgreSQL de validation devait parser correctement le JSON des épreuves soumises, dont la
structure pouvait varier légèrement selon la version du builder de questions utilisé par le professeur."),
bodyParts([
{ text: "Solution apportée : ", bold: true },
{ text: "Standardisation du format JSON dès la soumission, avec validation côté client avant envoi. Le trigger utilise
des opérateurs JSON natifs de PostgreSQL (->>) avec gestion d'exceptions pour traiter les cas de champs manquants." }
]),
...space(1),

h2("IV. Apports personnels du stage"),
body("Ce stage a représenté une expérience formatrice exceptionnelle, bien au-delà des aspects purement techniques. Sur
le plan des compétences techniques, il a permis de maîtriser des technologies avancées rarement abordées en classe :"),
bullet("La conception et l'administration d'une base de données relationnelle PostgreSQL à grande échelle, avec gestion
des UUID, des contraintes d'intégrité et des index ;"),
bullet("La maîtrise des politiques de sécurité RLS (Row Level Security), un mécanisme essentiel pour sécuriser les accès
multi-rôles dans une application SaaS ;"),
bullet("Le développement de triggers et fonctions PL/pgSQL pour automatiser des processus métier complexes ;"),
bullet("La gestion du stockage sécurisé de fichiers (KYC, images, PDF) dans un environnement cloud avec contrôle d'accès
granulaire ;"),
bullet("Le développement d'interfaces bilingues avec un système i18n personnalisé en JavaScript vanilla."),
body("Sur le plan professionnel et humain, ce stage a renforcé des qualités essentielles : la rigueur dans l'écriture du
code, la capacité à diagnostiquer et résoudre des problèmes complexes de manière autonome, la communication avec
l'équipe technique et la gestion du temps dans un environnement de développement réel. Il a également confirmé l'intérêt
profond du stagiaire pour le domaine du développement web et des technologies éducatives, ouvrant des perspectives
claires pour la suite de la formation."),
pageBreak()
];

// CONCLUSION
const conclusionSection = [
h1("CONCLUSION GÉNÉRALE"),
...space(1),
body("Ce stage pratique de cinq semaines effectué au sein de RHIZART dans le cadre du développement de la plateforme
KMERSCHOOL a été une expérience profondément enrichissante, tant sur le plan technique que sur le plan humain et
professionnel."),
body("L'objectif fixé — concevoir et développer les modules fondamentaux d'une plateforme éducative bilingue couvrant
les deux sous-systèmes éducatifs camerounais — a été atteint dans ses grandes lignes. Le tableau de bord administrateur,
le portail professeur avec système KYC, le pipeline de validation des épreuves par déclencheurs SQL et le système
bilingue i18n constituent des briques fonctionnelles solides sur lesquelles la suite du développement pourra
s'appuyer."),
body("Les défis rencontrés, notamment la gestion des politiques RLS, la complexité du schéma bilingue et le parsing des
données JSON en PL/pgSQL, ont été autant d'occasions d'approfondir des compétences techniques avancées que la seule
formation théorique n'aurait pu offrir. Chaque problème résolu a consolidé la confiance dans la capacité à produire un
code robuste et sécurisé."),
body("D'un point de vue plus large, ce projet illustre parfaitement la manière dont les technologies de l'information
peuvent devenir un levier de développement éducatif dans un contexte africain. KMERSCHOOL, si elle aboutit à son
déploiement complet, pourrait transformer l'accès à l'éducation de qualité pour des millions d'élèves camerounais, tout
en valorisant le travail des enseignants locaux."),
body("Ce stage a définitivement confirmé la vocation de l'auteur pour le développement web full-stack et les
technologies numériques au service de l'intérêt général. Il constitue une étape charnière dans la construction d'un
parcours professionnel orienté vers l'ingénierie logicielle et l'EdTech en Afrique."),
body("À l'issue de ce stage, plusieurs perspectives d'évolution ont été identifiées pour KMERSCHOOL : le développement
du portail élève, la création d'un système de recommandation de contenu, l'intégration de l'intelligence artificielle
pour la correction automatique des exercices, et le déploiement progressif auprès des établissements scolaires pilotes
de Buea et Yaoundé."),
pageBreak()
];

// MÉDIAGRAPHIE
const mediagraphieSection = [
h1("MÉDIAGRAPHIE"),
...space(1),
body("Ouvrages et guides :"),
bullet("Ministère des Enseignements Secondaires (MINESEC). Guide du Stage Pratique de la Série Technologies de
l'Information. Inspection de Pédagogie chargée de l'Informatique, Août 2014."),
...space(1),
body("Documentation technique (en ligne) :"),
bullet("Supabase. Documentation officielle. https://supabase.com/docs. Consultée entre août et septembre 2025."),
bullet("PostgreSQL. Documentation officielle – Row Level Security.
https://www.postgresql.org/docs/current/ddl-rowsecurity.html. Consultée en septembre 2025."),
bullet("Tailwind CSS. Documentation officielle. https://tailwindcss.com/docs. Consultée entre août et septembre 2025."),
bullet("Mozilla Developer Network (MDN). JavaScript Reference. https://developer.mozilla.org/fr/docs/Web/JavaScript.
Consultée entre août et septembre 2025."),
bullet("GitHub Docs. Git and GitHub documentation. https://docs.github.com. Consultée en août 2025."),
...space(1),
body("Ressources internes :"),
bullet("RHIZART / KMERSCHOOL. Présentation de la plateforme éducative camerounaise — Document interne. 2025."),
bullet("RHIZART. Schéma de base de données KMERSCHOOL — Document interne. Version du 18 août 2025."),
pageBreak()
];

// ANNEXES
const annexesSection = [
h1("ANNEXES"),
...space(1),
h2("Annexe A : Extrait du schéma de base de données"),
body("Le schéma ci-dessous présente les principales tables de la base de données KMERSCHOOL et leurs relations. La base
compte plus de 30 tables organisées autour des entités du système éducatif camerounais."),
...space(1),
makeTable(
["Table", "Description", "Clés principales"],
[
["sous_systemes", "Francophone / Anglophone", "id (uuid), code, nom_fr, nom_en"],
["cycles", "Cycles scolaires par sous-système", "id, sous_systeme_id, code, nom_fr"],
["niveaux_scolaires", "6ème à Terminale / Form 1 à Upper Sixth", "id, cycle_id, code, nom_fr, est_classe_examen"],
["series_specialites", "Séries (C, D, A-Level Science...)", "id, niveau_id, code, nom_fr, actif"],
["professeurs", "Comptes professeurs avec statut KYC", "id, statut, est_verifie, gains_total"],
["soumissions_epreuves", "Épreuves soumises par professeurs (JSON)", "id, prof_id, contenu_json, statut"],
["examens", "Examens validés et publiés", "id, titre, niveau_id, serie_id, est_publie"],
["questions_examen", "Questions liées aux examens", "id, examen_id, type_question, points"],
["choix_reponses", "Choix de réponses pour QCM", "id, question_id, est_correct"],
["paiements_professeurs", "Versements aux professeurs", "id, prof_id, montant, mode_paiement"],
],
[2500, 3200, 3600]
),
...space(2),

h2("Annexe B : Extrait du déclencheur SQL de validation"),
body("Le déclencheur fn_valider_epreuve est déclenché BEFORE UPDATE sur la table soumissions_epreuves lorsque le statut
passe à 'valide'. Il peuple automatiquement les tables examens, questions_examen et choix_reponses à partir du champ
contenu_json de la soumission."),
new Paragraph({
children: [new TextRun({
text: "CREATE OR REPLACE FUNCTION fn_valider_epreuve()\nRETURNS TRIGGER AS $$\nDECLARE\n v_examen_id INTEGER;\n q
JSONB;\n c JSONB;\n v_question_id INTEGER;\nBEGIN\n IF NEW.statut = 'valide' AND OLD.statut != 'valide' THEN\n INSERT
INTO examens (titre, type_examen, matiere_id, niveau_id ...)\n VALUES (NEW.titre, NEW.type_examen::varchar, ...)
RETURNING id INTO v_examen_id;\n FOR q IN SELECT * FROM jsonb_array_elements(NEW.contenu_json->'questions')\n LOOP\n
INSERT INTO questions_examen (examen_id, question_texte, type_question, ...)\n VALUES (v_examen_id, q->>'texte',
q->>'type', ...) RETURNING id INTO v_question_id;\n FOR c IN SELECT * FROM jsonb_array_elements(q->'choix')\n LOOP\n
INSERT INTO choix_reponses (question_id, texte_choix, est_correct, ordre)\n VALUES (v_question_id, c->>'texte',
(c->>'correct')::boolean, ...);\n END LOOP;\n END LOOP;\n PERFORM incrementer_gains_prof(NEW.prof_id,
NEW.remuneration_due);\n PERFORM recalculer_stats_prof(NEW.prof_id);\n END IF;\n RETURN NEW;\nEND;\n$$ LANGUAGE
plpgsql;",
font: "Courier New", size: PT(9), color: "333333"
})]
}),
];

// ─── DOCUMENT FINAL ───────────────────────────────────────────────────────────
const doc = new Document({
styles,
numbering: {
config: [{
reference: "bullets",
levels: [{
level: 0,
format: LevelFormat.BULLET,
text: "\u2022",
alignment: AlignmentType.LEFT,
style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 80 } } }
}]
}]
},
sections: [{
properties: {
page: {
size: { width: 11906, height: 16838 }, // A4
margin: MARGINS
}
},
headers: {
default: new Header({
children: [
new Paragraph({
children: [
new TextRun({ text: "KMERSCHOOL – Rapport de Stage | NGUIAMBA GEDEON | 2024-2025", font: "Times New Roman", size: PT(9),
color: "888888" })
],
border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD", space: 4 } }
})
]
})
},
footers: {
default: new Footer({
children: [
new Paragraph({
alignment: AlignmentType.CENTER,
children: [
new TextRun({ text: "— ", font: "Times New Roman", size: PT(10), color: "888888" }),
new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: PT(10), color: "888888" }),
new TextRun({ text: " —", font: "Times New Roman", size: PT(10), color: "888888" })
]
})
]
})
},
children: [
...coverPage,
...sommaireSection,
...dedicaceSection,
...remerciementsSection,
...resumeSection,
...abreviationsSection,
...introductionSection,
...chapitre1,
...chapitre2,
...chapitre3,
...conclusionSection,
...mediagraphieSection,
...annexesSection
]
}]
});

Packer.toBuffer(doc).then(buffer => {
fs.writeFileSync('/home/claude/RAPPORT_STAGE_NGUIAMBA_GEDEON.docx', buffer);
console.log('✅ Document généré avec succès !');
}).catch(err => {
console.error('❌ Erreur:', err);
process.exit(1);
});