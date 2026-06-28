import {
  db, usersTable, filieresTable, studentsTable, teachersTable,
  coursesTable, modulesTable, chaptersTable, inscriptionsTable, paymentsTable,
  enrollmentsTable, certificatesTable, evaluationsTable,
  type InsertStudent, type InsertCourse, type InsertChapter,
  type InsertInscription, type InsertPayment,
} from "@workspace/db";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🔄 Clearing existing data...");

  // Truncate in reverse FK order
  await db.execute(sql`TRUNCATE TABLE certificates RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE evaluations RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE enrollments RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE payments RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE inscriptions RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE chapters RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE modules RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE courses RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE students RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE teachers RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE filieres RESTART IDENTITY CASCADE`);
  console.log("✓ All tables cleared");

  // ── Filieres — Structure officielle ISC Mbujimayi ─────────────────────────
  // Faculté 1: Sciences Commerciales et Financières (3 filières)
  // Faculté 2: Informatique de Gestion (1 filière)
  // Faculté 3: Secrétariat de Direction (1 filière)
  const filiereData = [
    {
      id: nanoid(), code: "COMPTA", name: "Comptabilité",
      faculty: "Sciences Commerciales et Financières",
      description: "Formation approfondie en comptabilité générale et analytique, audit financier et normes OHADA. Les diplômés maîtrisent les outils de gestion financière des entreprises congolaises.",
      duration: 4,
    },
    {
      id: nanoid(), code: "FISC", name: "Fiscalité",
      faculty: "Sciences Commerciales et Financières",
      description: "Formation spécialisée en droit fiscal congolais, TVA, impôts sur les bénéfices et optimisation fiscale. Prépare aux métiers de conseiller fiscal et de gestionnaire de la conformité.",
      duration: 3,
    },
    {
      id: nanoid(), code: "MKT", name: "Marketing",
      faculty: "Sciences Commerciales et Financières",
      description: "Formation en stratégie commerciale, marketing digital et étude de marché. Les diplômés pilotent les actions commerciales et la communication des entreprises.",
      duration: 4,
    },
    {
      id: nanoid(), code: "INFO", name: "Informatique de Gestion",
      faculty: "Informatique de Gestion",
      description: "Formation en développement logiciel, bases de données, systèmes d'information et sécurité informatique appliqués à la gestion des organisations.",
      duration: 4,
    },
    {
      id: nanoid(), code: "SECDIR", name: "Secrétariat de Direction",
      faculty: "Secrétariat de Direction",
      description: "Formation en techniques de secrétariat, bureautique avancée, correspondance administrative et gestion de l'information. Prépare aux fonctions d'assistanat de direction.",
      duration: 3,
    },
  ];
  await db.insert(filieresTable).values(filiereData);
  const [fCompta, fFisc, fMkt, fInfo, fSecdir] = filiereData;
  console.log("✓ 5 filières (3 facultés) seeded");

  // ── Staff Users ───────────────────────────────────────────────────────────
  const staffUsers = [
    { id: nanoid(), clerkId: "seed_admin_001", email: "admin@isc-mbujimayi.ac.cd", firstName: "Jean-Paul", lastName: "Kalumba", role: "ADMIN" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_director_001", email: "directeur@isc-mbujimayi.ac.cd", firstName: "Prosper", lastName: "Ngandu", role: "DIRECTOR" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_financial_001", email: "finance@isc-mbujimayi.ac.cd", firstName: "Marie", lastName: "Kabwe", role: "FINANCIAL_SERVICE" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_academic_001", email: "scolarite@isc-mbujimayi.ac.cd", firstName: "André", lastName: "Mutombo", role: "ACADEMIC_SERVICE" as const, isActive: true },
  ];
  await db.insert(usersTable).values(staffUsers);

  // ── Teacher Users ─────────────────────────────────────────────────────────
  const teacherUsers = [
    { id: nanoid(), clerkId: "seed_teacher_001", email: "prof.mukendi@isc-mbujimayi.ac.cd", firstName: "Patrick", lastName: "Mukendi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_002", email: "prof.tshiamala@isc-mbujimayi.ac.cd", firstName: "Cécile", lastName: "Tshiamala", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_003", email: "prof.kazadi@isc-mbujimayi.ac.cd", firstName: "Théodore", lastName: "Kazadi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_004", email: "prof.kabamba@isc-mbujimayi.ac.cd", firstName: "Joseph", lastName: "Kabamba", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_005", email: "prof.ntumba@isc-mbujimayi.ac.cd", firstName: "Henriette", lastName: "Ntumba", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_006", email: "prof.katanga@isc-mbujimayi.ac.cd", firstName: "Sylvain", lastName: "Katanga", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_007", email: "prof.ilunga@isc-mbujimayi.ac.cd", firstName: "Brigitte", lastName: "Ilunga", role: "TEACHER" as const, isActive: true },
  ];
  await db.insert(usersTable).values(teacherUsers);
  console.log("✓ Staff & teacher users seeded");

  // ── Teacher Profiles ──────────────────────────────────────────────────────
  const teachers = [
    { id: nanoid(), userId: teacherUsers[0].id, code: "PROF001", firstName: "Patrick", lastName: "Mukendi", specialty: "Gestion Commerciale & Marketing", grade: "Professeur Associé" },
    { id: nanoid(), userId: teacherUsers[1].id, code: "PROF002", firstName: "Cécile", lastName: "Tshiamala", specialty: "Informatique de Gestion & Bases de Données", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[2].id, code: "PROF003", firstName: "Théodore", lastName: "Kazadi", specialty: "Comptabilité & Finance OHADA", grade: "Professeur Ordinaire" },
    { id: nanoid(), userId: teacherUsers[3].id, code: "PROF004", firstName: "Joseph", lastName: "Kabamba", specialty: "Management & Leadership", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[4].id, code: "PROF005", firstName: "Henriette", lastName: "Ntumba", specialty: "Secrétariat de Direction & Bureautique", grade: "Assistant" },
    { id: nanoid(), userId: teacherUsers[5].id, code: "PROF006", firstName: "Sylvain", lastName: "Katanga", specialty: "Droit Fiscal & Fiscalité", grade: "Professeur Associé" },
    { id: nanoid(), userId: teacherUsers[6].id, code: "PROF007", firstName: "Brigitte", lastName: "Ilunga", specialty: "Secrétariat & Communication Administrative", grade: "Chargé de Cours" },
  ];
  await db.insert(teachersTable).values(teachers);
  console.log("✓ 7 teachers seeded");

  // ── Student Users (20) ────────────────────────────────────────────────────
  const studentUserData = [
    { firstName: "Emmanuel", lastName: "Kalenga", phone: "+243812345601" },
    { firstName: "Thérèse", lastName: "Mbuyi", phone: "+243812345602" },
    { firstName: "Albert", lastName: "Tshiongo", phone: "+243812345603" },
    { firstName: "Claudine", lastName: "Kaseba", phone: "+243812345604" },
    { firstName: "Gabriel", lastName: "Kabongo", phone: "+243812345605" },
    { firstName: "Patience", lastName: "Muamba", phone: "+243812345606" },
    { firstName: "Dieudonné", lastName: "Kabeya", phone: "+243812345607" },
    { firstName: "Josephine", lastName: "Tshilomba", phone: "+243812345608" },
    { firstName: "Serge", lastName: "Mulumba", phone: "+243812345609" },
    { firstName: "Christine", lastName: "Kayumba", phone: "+243812345610" },
    { firstName: "Adolphe", lastName: "Mwamba", phone: "+243812345611" },
    { firstName: "Béatrice", lastName: "Tshimanga", phone: "+243812345612" },
    { firstName: "Gustave", lastName: "Ngoyi", phone: "+243812345613" },
    { firstName: "Félicité", lastName: "Kabila", phone: "+243812345614" },
    { firstName: "Hervé", lastName: "Lukusa", phone: "+243812345615" },
    { firstName: "Martine", lastName: "Kasongo", phone: "+243812345616" },
    { firstName: "Théophile", lastName: "Mujinga", phone: "+243812345617" },
    { firstName: "Angélique", lastName: "Tshibangu", phone: "+243812345618" },
    { firstName: "Bertrand", lastName: "Kyungu", phone: "+243812345619" },
    { firstName: "Yvette", lastName: "Kalombo", phone: "+243812345620" },
  ];

  const studentUsers = studentUserData.map((d, i) => ({
    id: nanoid(),
    clerkId: `seed_student_${String(i + 1).padStart(3, "0")}`,
    email: `etudiant.${d.lastName.toLowerCase()}@isc-mbujimayi.ac.cd`,
    firstName: d.firstName,
    lastName: d.lastName,
    role: "STUDENT" as const,
    isActive: true,
  }));
  await db.insert(usersTable).values(studentUsers);

  const filiereIds = [fCompta!.id, fFisc!.id, fMkt!.id, fInfo!.id, fSecdir!.id];

  const students: InsertStudent[] = studentUserData.map((d, i) => ({
    id: nanoid(),
    userId: studentUsers[i]!.id,
    numEtudiant: `ISC24${String(i + 1).padStart(3, "0")}`,
    firstName: d.firstName,
    lastName: d.lastName,
    phone: d.phone,
    filiereId: filiereIds[i % filiereIds.length] ?? null,
  }));
  await db.insert(studentsTable).values(students);
  console.log("✓ 20 students seeded");

  // ── Courses ───────────────────────────────────────────────────────────────
  // Thumbnails mapped per filière using generated images
  // Thumbnails — unique per course where available, filière image as fallback
  const courses: InsertCourse[] = [
    // ── COMPTABILITÉ ──────────────────────────────────────────────────────
    {
      id: nanoid(), teacherId: teachers[2]!.id, filiereId: fCompta!.id,
      title: "Comptabilité Générale",
      thumbnail: "/images/course-compta-generale.png",
      description: "Principes fondamentaux OHADA : plan comptable, journal, grand-livre, balance et états financiers annuels.",
      status: "PUBLISHED", level: "L1", duration: 80,
    },
    {
      id: nanoid(), teacherId: teachers[2]!.id, filiereId: fCompta!.id,
      title: "Comptabilité Analytique",
      thumbnail: "/images/course-compta-analytique.png",
      description: "Méthodes de coût de revient, analyse de la rentabilité et tableaux de bord financiers d'entreprise.",
      status: "PUBLISHED", level: "L2", duration: 60,
    },
    {
      id: nanoid(), teacherId: teachers[2]!.id, filiereId: fCompta!.id,
      title: "Audit et Contrôle Interne",
      thumbnail: "/images/course-audit.png",
      description: "Techniques d'audit financier, normes ISA et dispositifs de contrôle interne en entreprise.",
      status: "PUBLISHED", level: "L3", duration: 50,
    },
    // ── FISCALITÉ ──────────────────────────────────────────────────────────
    {
      id: nanoid(), teacherId: teachers[5]!.id, filiereId: fFisc!.id,
      title: "Fiscalité des Entreprises",
      thumbnail: "/images/course-fiscalite-entreprises.png",
      description: "Impôt sur les bénéfices, TVA, taxe professionnelle et obligations déclaratives en RDC.",
      status: "PUBLISHED", level: "L1", duration: 65,
    },
    {
      id: nanoid(), teacherId: teachers[5]!.id, filiereId: fFisc!.id,
      title: "Procédures Fiscales",
      thumbnail: "/images/course-procedures-fiscales.png",
      description: "Contrôle fiscal, contentieux, réclamations et garanties du contribuable en République Démocratique du Congo.",
      status: "PUBLISHED", level: "L2", duration: 40,
    },
    {
      id: nanoid(), teacherId: teachers[5]!.id, filiereId: fFisc!.id,
      title: "Droit Fiscal International",
      thumbnail: "/images/filiere-fisc.png",
      description: "Conventions fiscales bilatérales, prix de transfert et planification fiscale internationale.",
      status: "PUBLISHED", level: "L3", duration: 55,
    },
    // ── MARKETING ─────────────────────────────────────────────────────────
    {
      id: nanoid(), teacherId: teachers[0]!.id, filiereId: fMkt!.id,
      title: "Fondamentaux du Marketing",
      thumbnail: "/images/filiere-mkt.png",
      description: "Concepts clés du marketing : segmentation, ciblage, positionnement, mix marketing et comportement du consommateur.",
      status: "PUBLISHED", level: "L1", duration: 50,
    },
    {
      id: nanoid(), teacherId: teachers[0]!.id, filiereId: fMkt!.id,
      title: "Marketing Digital",
      thumbnail: "/images/course-marketing.png",
      description: "Réseaux sociaux, SEO, publicité en ligne et stratégie de contenu pour les entreprises de la RDC.",
      status: "PUBLISHED", level: "L2", duration: 40,
    },
    {
      id: nanoid(), teacherId: teachers[0]!.id, filiereId: fMkt!.id,
      title: "Étude de Marché et Gestion Commerciale",
      thumbnail: "/images/course-commerce.png",
      description: "Méthodologie d'enquête, analyse de la concurrence, segmentation du marché et stratégies commerciales.",
      status: "PUBLISHED", level: "L2", duration: 45,
    },
    // ── INFORMATIQUE DE GESTION ───────────────────────────────────────────
    {
      id: nanoid(), teacherId: teachers[1]!.id, filiereId: fInfo!.id,
      title: "Bases de Données et SQL",
      thumbnail: "/images/filiere-info.png",
      description: "Bases de données relationnelles, modèle Entité-Association et langage SQL avancé pour la gestion.",
      status: "PUBLISHED", level: "L1", duration: 45,
    },
    {
      id: nanoid(), teacherId: teachers[1]!.id, filiereId: fInfo!.id,
      title: "Développement Web et Applications de Gestion",
      thumbnail: "/images/course-informatique.png",
      description: "HTML, CSS, JavaScript et frameworks modernes pour créer des applications web de gestion d'entreprise.",
      status: "PUBLISHED", level: "L2", duration: 60,
    },
    {
      id: nanoid(), teacherId: teachers[1]!.id, filiereId: fInfo!.id,
      title: "Systèmes d'Information en Gestion",
      thumbnail: "/images/course-management.png",
      description: "Architecture des SI, ERP, progiciels de gestion intégrée (Sage, SAP) et sécurité informatique.",
      status: "PUBLISHED", level: "L3", duration: 55,
    },
    // ── SECRÉTARIAT DE DIRECTION ──────────────────────────────────────────
    {
      id: nanoid(), teacherId: teachers[4]!.id, filiereId: fSecdir!.id,
      title: "Techniques du Secrétariat",
      thumbnail: "/images/filiere-secdir.png",
      description: "Gestion du courrier, accueil des visiteurs, organisation des réunions et tenue des archives d'entreprise.",
      status: "PUBLISHED", level: "L1", duration: 50,
    },
    {
      id: nanoid(), teacherId: teachers[6]!.id, filiereId: fSecdir!.id,
      title: "Bureautique et Applications Informatiques",
      thumbnail: "/images/course-default.png",
      description: "Maîtrise de Microsoft Office (Word, Excel, PowerPoint), gestion de la messagerie et outils collaboratifs.",
      status: "PUBLISHED", level: "L1", duration: 45,
    },
    {
      id: nanoid(), teacherId: teachers[4]!.id, filiereId: fSecdir!.id,
      title: "Correspondance Administrative et Commerciale",
      thumbnail: "/images/course-default.png",
      description: "Rédaction professionnelle : lettres, rapports, comptes rendus, notes de service et communications officielles.",
      status: "PUBLISHED", level: "L2", duration: 35,
    },
    {
      id: nanoid(), teacherId: teachers[3]!.id, filiereId: fSecdir!.id,
      title: "Management de Bureau et Organisation",
      thumbnail: "/images/course-default.png",
      description: "Gestion du temps, organisation du bureau d'un dirigeant, coordination des agendas et accueil de haut niveau.",
      status: "PUBLISHED", level: "L2", duration: 40,
    },
  ];
  await db.insert(coursesTable).values(courses);
  console.log("✓ 16 courses seeded (4 per filière)");

  // ── Modules & Chapters ────────────────────────────────────────────────────
  const moduleData = [
    // Comptabilité Générale (courses[0])
    { id: nanoid(), courseId: courses[0]!.id, title: "Le plan comptable OHADA", order: 1 },
    { id: nanoid(), courseId: courses[0]!.id, title: "Journal, grand-livre et balance", order: 2 },
    { id: nanoid(), courseId: courses[0]!.id, title: "États financiers annuels", order: 3 },
    // Fiscalité des Entreprises (courses[3])
    { id: nanoid(), courseId: courses[3]!.id, title: "Impôts directs en RDC", order: 1 },
    { id: nanoid(), courseId: courses[3]!.id, title: "TVA et taxes indirectes", order: 2 },
    // Marketing Digital (courses[7])
    { id: nanoid(), courseId: courses[7]!.id, title: "Stratégie digitale et réseaux sociaux", order: 1 },
    { id: nanoid(), courseId: courses[7]!.id, title: "SEO et publicité en ligne", order: 2 },
    // Bases de Données (courses[9])
    { id: nanoid(), courseId: courses[9]!.id, title: "Introduction aux bases de données", order: 1 },
    { id: nanoid(), courseId: courses[9]!.id, title: "Langage SQL avancé", order: 2 },
    // Techniques du Secrétariat (courses[12])
    { id: nanoid(), courseId: courses[12]!.id, title: "Gestion du courrier et des archives", order: 1 },
    { id: nanoid(), courseId: courses[12]!.id, title: "Organisation des réunions", order: 2 },
    // Bureautique (courses[13])
    { id: nanoid(), courseId: courses[13]!.id, title: "Microsoft Word et Excel avancés", order: 1 },
    { id: nanoid(), courseId: courses[13]!.id, title: "PowerPoint et outils collaboratifs", order: 2 },
  ];
  await db.insert(modulesTable).values(moduleData);

  const chapterData: InsertChapter[] = [
    // Plan comptable OHADA
    { id: nanoid(), moduleId: moduleData[0]!.id, title: "Classes de comptes et codification OHADA", type: "TEXT", content: "Le plan comptable OHADA classe les comptes en 9 classes numérotées de 1 à 9. La classe 1 regroupe les capitaux propres et emprunts; la classe 2 les immobilisations; la classe 3 les stocks; les classes 4 et 5 les tiers et trésorerie; les classes 6 et 7 les charges et produits.", duration: 45, order: 1 },
    { id: nanoid(), moduleId: moduleData[0]!.id, title: "Principes comptables fondamentaux", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 30, order: 2 },
    // Journal
    { id: nanoid(), moduleId: moduleData[1]!.id, title: "Passation des écritures au journal", type: "TEXT", content: "L'enregistrement chronologique des opérations dans le journal constitue la base de la comptabilité. Chaque écriture doit mentionner la date, les comptes débités, les comptes crédités et le libellé de l'opération.", duration: 50, order: 1 },
    { id: nanoid(), moduleId: moduleData[1]!.id, title: "Du journal au grand-livre", type: "PDF", content: "/docs/journal-grandlivre.pdf", duration: 40, order: 2 },
    // États financiers
    { id: nanoid(), moduleId: moduleData[2]!.id, title: "Le bilan et ses composantes", type: "TEXT", content: "Le bilan présente la situation patrimoniale de l'entreprise à une date donnée. L'actif comprend les immobilisations et actifs circulants; le passif les capitaux propres et dettes.", duration: 60, order: 1 },
    // Fiscalité — IBS
    { id: nanoid(), moduleId: moduleData[3]!.id, title: "L'impôt sur les bénéfices des sociétés (IBS)", type: "TEXT", content: "L'IBS en RDC s'applique au résultat fiscal des sociétés résidentes au taux de 30%. La base imposable est déterminée en retraitant le résultat comptable selon les règles du Code des Impôts.", duration: 50, order: 1 },
    { id: nanoid(), moduleId: moduleData[4]!.id, title: "TVA : mécanisme et déclaration mensuelle", type: "PDF", content: "/docs/tva-rdc.pdf", duration: 45, order: 1 },
    // Marketing digital
    { id: nanoid(), moduleId: moduleData[5]!.id, title: "Réseaux sociaux et stratégie de contenu", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 35, order: 1 },
    { id: nanoid(), moduleId: moduleData[6]!.id, title: "Fondamentaux du référencement naturel (SEO)", type: "TEXT", content: "Le SEO (Search Engine Optimization) regroupe l'ensemble des techniques visant à améliorer le positionnement d'un site web dans les résultats des moteurs de recherche.", duration: 40, order: 1 },
    // SQL
    { id: nanoid(), moduleId: moduleData[7]!.id, title: "Concepts des bases de données relationnelles", type: "TEXT", content: "Une base de données relationnelle organise les données en tables reliées par des clés étrangères. Le modèle Entité-Association (E-A) permet de modéliser les besoins avant implémentation.", duration: 40, order: 1 },
    { id: nanoid(), moduleId: moduleData[7]!.id, title: "Introduction à SQL", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 50, order: 2 },
    { id: nanoid(), moduleId: moduleData[8]!.id, title: "Requêtes SQL avancées — JOIN et sous-requêtes", type: "TEXT", content: "Les jointures permettent de combiner des données de plusieurs tables: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN. Les sous-requêtes (subqueries) s'imbriquent dans SELECT, FROM ou WHERE.", duration: 70, order: 1 },
    // Secrétariat
    { id: nanoid(), moduleId: moduleData[9]!.id, title: "Traitement du courrier entrant et sortant", type: "TEXT", content: "Le secrétaire de direction assure la réception, l'enregistrement, le tri et la distribution du courrier. Il veille à la confidentialité des documents sensibles et à la tenue du registre du courrier.", duration: 40, order: 1 },
    { id: nanoid(), moduleId: moduleData[10]!.id, title: "Convocation et compte rendu de réunion", type: "PDF", content: "/docs/reunions.pdf", duration: 35, order: 1 },
    // Bureautique
    { id: nanoid(), moduleId: moduleData[11]!.id, title: "Excel : tableaux croisés dynamiques et formules avancées", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 55, order: 1 },
    { id: nanoid(), moduleId: moduleData[12]!.id, title: "PowerPoint : création de présentations professionnelles", type: "TEXT", content: "Une présentation professionnelle doit suivre la règle du 10-20-30 : max 10 diapositives, 20 minutes de présentation, taille de police min. 30pt. Chaque diapositive doit porter un seul message.", duration: 30, order: 1 },
  ];
  await db.insert(chaptersTable).values(chapterData);
  console.log("✓ 13 modules, 16 chapters seeded");

  // ── Inscriptions (12) ─────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const doc3 = [
    { type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now },
    { type: "photo", name: "photo.jpg", url: "/docs/photo.jpg", uploadedAt: now },
    { type: "cni", name: "cni.pdf", url: "/docs/cni.pdf", uploadedAt: now },
  ];
  const doc1 = [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }];
  const doc2 = [
    { type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now },
    { type: "photo", name: "photo.jpg", url: "/docs/photo.jpg", uploadedAt: now },
  ];

  const inscriptionData: InsertInscription[] = [
    { id: nanoid(), studentId: students[0]!.id, status: "APPROVED", notes: "Dossier complet — validé en commission", documents: doc3 },
    { id: nanoid(), studentId: students[1]!.id, status: "PENDING", notes: null, documents: doc1 },
    { id: nanoid(), studentId: students[2]!.id, status: "UNDER_REVIEW", notes: "En cours de vérification des diplômes", documents: doc2 },
    { id: nanoid(), studentId: students[3]!.id, status: "APPROVED", notes: "Dossier validé sans réserve", documents: doc3 },
    { id: nanoid(), studentId: students[4]!.id, status: "REJECTED", notes: "Carte nationale d'identité manquante", documents: doc1 },
    { id: nanoid(), studentId: students[5]!.id, status: "APPROVED", notes: "Dossier complet", documents: doc3 },
    { id: nanoid(), studentId: students[6]!.id, status: "PENDING", notes: null, documents: doc2 },
    { id: nanoid(), studentId: students[7]!.id, status: "UNDER_REVIEW", notes: "Vérification des antécédents académiques", documents: doc2 },
    { id: nanoid(), studentId: students[8]!.id, status: "APPROVED", notes: "Admis en L2", documents: doc3 },
    { id: nanoid(), studentId: students[9]!.id, status: "REJECTED", notes: "Diplôme non reconnu — réorientation conseillée", documents: doc1 },
    { id: nanoid(), studentId: students[10]!.id, status: "APPROVED", notes: "Dossier validé — bourse accordée", documents: doc3 },
    { id: nanoid(), studentId: students[11]!.id, status: "PENDING", notes: null, documents: doc2 },
  ];
  await db.insert(inscriptionsTable).values(inscriptionData);
  console.log("✓ 12 inscriptions seeded");

  // ── Enrollments ───────────────────────────────────────────────────────────
  const enrollmentData = [
    { id: nanoid(), studentId: students[0]!.id, courseId: courses[0]!.id },
    { id: nanoid(), studentId: students[0]!.id, courseId: courses[7]!.id },
    { id: nanoid(), studentId: students[2]!.id, courseId: courses[9]!.id },
    { id: nanoid(), studentId: students[3]!.id, courseId: courses[0]!.id },
    { id: nanoid(), studentId: students[5]!.id, courseId: courses[12]!.id },
    { id: nanoid(), studentId: students[8]!.id, courseId: courses[3]!.id },
    { id: nanoid(), studentId: students[10]!.id, courseId: courses[7]!.id },
    { id: nanoid(), studentId: students[12]!.id, courseId: courses[10]!.id },
    { id: nanoid(), studentId: students[14]!.id, courseId: courses[13]!.id },
    { id: nanoid(), studentId: students[16]!.id, courseId: courses[14]!.id },
  ];
  await db.insert(enrollmentsTable).values(enrollmentData);
  console.log("✓ 10 enrollments seeded");

  // ── Payments — 6 months of history ────────────────────────────────────────
  const paymentData: InsertPayment[] = [
    { id: nanoid(), studentId: students[0]!.id, reference: "ISC-24-001", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "VODACOM_MONEY", phoneNumber: students[0]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-A1B2C3D4", metadata: null },
    { id: nanoid(), studentId: students[1]!.id, reference: "ISC-24-002", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[1]!.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-E5F6G7H8", metadata: null },
    { id: nanoid(), studentId: students[2]!.id, reference: "ISC-24-003", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[2]!.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-I9J0K1L2", metadata: null },
    { id: nanoid(), studentId: students[3]!.id, reference: "ISC-24-004", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "VODACOM_MONEY", phoneNumber: students[3]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-M3N4O5P6", metadata: null },
    { id: nanoid(), studentId: students[4]!.id, reference: "ISC-24-005", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[4]!.phone ?? "", status: "FAILED", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[5]!.id, reference: "ISC-24-006", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "VODACOM_MONEY", phoneNumber: students[5]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-Q7R8S9T0", metadata: null },
    { id: nanoid(), studentId: students[6]!.id, reference: "ISC-24-007", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[6]!.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-U1V2W3X4", metadata: null },
    { id: nanoid(), studentId: students[0]!.id, reference: "ISC-24-008", amount: "250000", currency: "CDF", type: "COURSE_FEE", operator: "VODACOM_MONEY", phoneNumber: students[0]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-B2C3D4E5", metadata: null },
    { id: nanoid(), studentId: students[3]!.id, reference: "ISC-24-009", amount: "250000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[3]!.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-F6G7H8I9", metadata: null },
    { id: nanoid(), studentId: students[5]!.id, reference: "ISC-24-010", amount: "250000", currency: "CDF", type: "COURSE_FEE", operator: "VODACOM_MONEY", phoneNumber: students[5]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-J0K1L2M3", metadata: null },
    { id: nanoid(), studentId: students[8]!.id, reference: "ISC-24-011", amount: "250000", currency: "CDF", type: "COURSE_FEE", operator: "ORANGE_MONEY", phoneNumber: students[8]!.phone ?? "", status: "PENDING", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[10]!.id, reference: "ISC-24-012", amount: "250000", currency: "CDF", type: "COURSE_FEE", operator: "VODACOM_MONEY", phoneNumber: students[10]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-N4O5P6Q7", metadata: null },
    { id: nanoid(), studentId: students[0]!.id, reference: "ISC-24-013", amount: "15000", currency: "CDF", type: "EXAM_FEE", operator: "VODACOM_MONEY", phoneNumber: students[0]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-R8S9T0U1", metadata: null },
    { id: nanoid(), studentId: students[3]!.id, reference: "ISC-24-014", amount: "15000", currency: "CDF", type: "EXAM_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[3]!.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-V2W3X4Y5", metadata: null },
    { id: nanoid(), studentId: students[5]!.id, reference: "ISC-24-015", amount: "15000", currency: "CDF", type: "EXAM_FEE", operator: "VODACOM_MONEY", phoneNumber: students[5]!.phone ?? "", status: "CONFIRMED", operatorRef: "VOD-Z6A7B8C9", metadata: null },
  ];
  await db.insert(paymentsTable).values(paymentData);
  console.log("✓ 15 payments seeded");

  console.log("\n🎉 Seed complete! ISC Mbujimayi data ready.");
  console.log("   Facultés: 3 | Filières: 5 | Courses: 16 | Students: 20 | Teachers: 7");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
