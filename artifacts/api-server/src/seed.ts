import {
  db, usersTable, filieresTable, studentsTable, teachersTable,
  coursesTable, modulesTable, chaptersTable, inscriptionsTable, paymentsTable,
  enrollmentsTable,
  type InsertStudent, type InsertCourse, type InsertChapter,
  type InsertInscription, type InsertPayment,
} from "@workspace/db";
import { nanoid } from "nanoid";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function seed() {
  console.log("Seeding database...");

  // ── Filieres ─────────────────────────────────────────────────────────────
  const filiereData = [
    { id: nanoid(), code: "COMPTA", name: "Comptabilité", description: "Formation en comptabilité et finance d'entreprise", duration: 4 },
    { id: nanoid(), code: "MKT", name: "Marketing", description: "Formation en marketing et stratégie commerciale", duration: 4 },
    { id: nanoid(), code: "INFO", name: "Informatique de Gestion", description: "Formation en informatique et développement logiciel", duration: 4 },
    { id: nanoid(), code: "GRH", name: "Gestion des Ressources Humaines", description: "Formation en management et gestion du personnel", duration: 4 },
    { id: nanoid(), code: "FISC", name: "Fiscalité", description: "Formation en droit fiscal et optimisation fiscale", duration: 3 },
  ];
  for (const f of filiereData) {
    try { await db.insert(filieresTable).values(f).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 5 filieres seeded");

  // ── Staff Users ───────────────────────────────────────────────────────────
  const staffUsers = [
    { id: nanoid(), clerkId: "seed_admin_001", email: "admin@isc-mbujimayi.ac.cd", firstName: "Jean-Paul", lastName: "Kalumba", role: "ADMIN" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_director_001", email: "directeur@isc-mbujimayi.ac.cd", firstName: "Prosper", lastName: "Ngandu", role: "DIRECTOR" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_financial_001", email: "finance@isc-mbujimayi.ac.cd", firstName: "Marie", lastName: "Kabwe", role: "FINANCIAL_SERVICE" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_academic_001", email: "scolarite@isc-mbujimayi.ac.cd", firstName: "André", lastName: "Mutombo", role: "ACADEMIC_SERVICE" as const, isActive: true },
  ];
  for (const u of staffUsers) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }

  // ── Teacher Users (7) ─────────────────────────────────────────────────────
  const teacherUsers = [
    { id: nanoid(), clerkId: "seed_teacher_001", email: "prof.mukendi@isc-mbujimayi.ac.cd", firstName: "Patrick", lastName: "Mukendi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_002", email: "prof.tshiamala@isc-mbujimayi.ac.cd", firstName: "Cécile", lastName: "Tshiamala", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_003", email: "prof.kazadi@isc-mbujimayi.ac.cd", firstName: "Théodore", lastName: "Kazadi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_004", email: "prof.kabamba@isc-mbujimayi.ac.cd", firstName: "Joseph", lastName: "Kabamba", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_005", email: "prof.ntumba@isc-mbujimayi.ac.cd", firstName: "Henriette", lastName: "Ntumba", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_006", email: "prof.katanga@isc-mbujimayi.ac.cd", firstName: "Sylvain", lastName: "Katanga", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_007", email: "prof.ilunga@isc-mbujimayi.ac.cd", firstName: "Brigitte", lastName: "Ilunga", role: "TEACHER" as const, isActive: true },
  ];
  for (const u of teacherUsers) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Staff & teacher users seeded");

  // ── Teacher Profiles ──────────────────────────────────────────────────────
  const teachers = [
    { id: nanoid(), userId: teacherUsers[0].id, code: "PROF001", firstName: "Patrick", lastName: "Mukendi", specialty: "Gestion Commerciale & Marketing", grade: "Professeur Associé" },
    { id: nanoid(), userId: teacherUsers[1].id, code: "PROF002", firstName: "Cécile", lastName: "Tshiamala", specialty: "Informatique de Gestion & Bases de Données", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[2].id, code: "PROF003", firstName: "Théodore", lastName: "Kazadi", specialty: "Comptabilité & Finance OHADA", grade: "Professeur Ordinaire" },
    { id: nanoid(), userId: teacherUsers[3].id, code: "PROF004", firstName: "Joseph", lastName: "Kabamba", specialty: "Management & Leadership", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[4].id, code: "PROF005", firstName: "Henriette", lastName: "Ntumba", specialty: "Secrétariat & Bureautique", grade: "Assistant" },
    { id: nanoid(), userId: teacherUsers[5].id, code: "PROF006", firstName: "Sylvain", lastName: "Katanga", specialty: "Droit Fiscal & Fiscalité", grade: "Professeur Associé" },
    { id: nanoid(), userId: teacherUsers[6].id, code: "PROF007", firstName: "Brigitte", lastName: "Ilunga", specialty: "Ressources Humaines & Droit Social", grade: "Chargé de Cours" },
  ];
  for (const t of teachers) {
    try { await db.insert(teachersTable).values(t).onConflictDoNothing(); } catch {}
  }
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
  for (const u of studentUsers) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }

  const filieres = await db.select().from(filieresTable);
  const filiereIds = filieres.map(f => f.id);

  const students: InsertStudent[] = studentUserData.map((d, i) => ({
    id: nanoid(),
    userId: studentUsers[i].id,
    numEtudiant: `ISC24${String(i + 1).padStart(3, "0")}`,
    firstName: d.firstName,
    lastName: d.lastName,
    phone: d.phone,
    filiereId: filiereIds[i % filiereIds.length] ?? null,
  }));
  for (const s of students) {
    try { await db.insert(studentsTable).values(s).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 20 students seeded");

  // ── Courses (15 = 3 per filière) ──────────────────────────────────────────
  const courses: InsertCourse[] = [
    // COMPTA (filieres[0])
    { id: nanoid(), teacherId: teachers[2].id, filiereId: filiereIds[0], title: "Comptabilité Générale", description: "Principes fondamentaux OHADA: plan comptable, journal, grand-livre, balance et états financiers.", status: "PUBLISHED", level: "L1", duration: 80 },
    { id: nanoid(), teacherId: teachers[2].id, filiereId: filiereIds[0], title: "Comptabilité Analytique", description: "Méthodes de coût de revient, analyse de la rentabilité et tableaux de bord financiers.", status: "PUBLISHED", level: "L2", duration: 60 },
    { id: nanoid(), teacherId: teachers[2].id, filiereId: filiereIds[0], title: "Audit et Contrôle Interne", description: "Techniques d'audit financier, normes ISA et dispositifs de contrôle interne en entreprise.", status: "DRAFT", level: "L3", duration: 50 },
    // MKT (filieres[1])
    { id: nanoid(), teacherId: teachers[0].id, filiereId: filiereIds[1], title: "Gestion Commerciale Avancée", description: "Stratégies commerciales modernes, gestion de la relation client et techniques de vente.", status: "PUBLISHED", level: "L2", duration: 60 },
    { id: nanoid(), teacherId: teachers[0].id, filiereId: filiereIds[1], title: "Marketing Digital", description: "Réseaux sociaux, SEO, publicité en ligne et stratégie de contenu pour entreprises.", status: "PUBLISHED", level: "L2", duration: 40 },
    { id: nanoid(), teacherId: teachers[0].id, filiereId: filiereIds[1], title: "Étude de Marché", description: "Méthodologie d'enquête, analyse de la concurrence et segmentation du marché.", status: "PUBLISHED", level: "L1", duration: 35 },
    // INFO (filieres[2])
    { id: nanoid(), teacherId: teachers[1].id, filiereId: filiereIds[2], title: "Bases de Données et SQL", description: "Bases de données relationnelles, modèle Entité-Association et langage SQL avancé.", status: "PUBLISHED", level: "L1", duration: 45 },
    { id: nanoid(), teacherId: teachers[1].id, filiereId: filiereIds[2], title: "Développement Web", description: "HTML, CSS, JavaScript et frameworks modernes pour applications de gestion.", status: "PUBLISHED", level: "L2", duration: 50 },
    { id: nanoid(), teacherId: teachers[1].id, filiereId: filiereIds[2], title: "Systèmes d'Information en Gestion", description: "Architecture des SI, ERP, progiciels de gestion intégrée et sécurité informatique.", status: "DRAFT", level: "L3", duration: 55 },
    // GRH (filieres[3])
    { id: nanoid(), teacherId: teachers[6].id, filiereId: filiereIds[3], title: "Gestion des Ressources Humaines", description: "Recrutement, formation, évaluation des performances et droit du travail congolais.", status: "PUBLISHED", level: "L1", duration: 70 },
    { id: nanoid(), teacherId: teachers[3].id, filiereId: filiereIds[3], title: "Management et Leadership", description: "Théories du management, styles de leadership, motivation et dynamique de groupe.", status: "PUBLISHED", level: "L2", duration: 45 },
    { id: nanoid(), teacherId: teachers[6].id, filiereId: filiereIds[3], title: "Droit Social et du Travail", description: "Code du travail congolais, contrats, protection sociale et résolution des conflits.", status: "PUBLISHED", level: "L2", duration: 40 },
    // FISC (filieres[4])
    { id: nanoid(), teacherId: teachers[5].id, filiereId: filiereIds[4], title: "Fiscalité des Entreprises", description: "Impôt sur les bénéfices, TVA, taxe professionnelle et obligations déclaratives en RDC.", status: "PUBLISHED", level: "L2", duration: 65 },
    { id: nanoid(), teacherId: teachers[5].id, filiereId: filiereIds[4], title: "Droit Fiscal International", description: "Conventions fiscales bilatérales, prix de transfert et planification fiscale internationale.", status: "DRAFT", level: "L3", duration: 55 },
    { id: nanoid(), teacherId: teachers[5].id, filiereId: filiereIds[4], title: "Procédures Fiscales", description: "Contrôle fiscal, contentieux, réclamations et garanties du contribuable en RDC.", status: "PUBLISHED", level: "L2", duration: 40 },
  ];
  for (const c of courses) {
    try { await db.insert(coursesTable).values(c).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 15 courses seeded");

  // ── Modules & Chapters ────────────────────────────────────────────────────
  const moduleData = [
    // Comptabilité Générale (courses[0])
    { id: nanoid(), courseId: courses[0].id, title: "Le plan comptable OHADA", order: 1 },
    { id: nanoid(), courseId: courses[0].id, title: "Journal, grand-livre et balance", order: 2 },
    { id: nanoid(), courseId: courses[0].id, title: "États financiers annuels", order: 3 },
    // Gestion Commerciale (courses[3])
    { id: nanoid(), courseId: courses[3].id, title: "Fondamentaux de la gestion commerciale", order: 1 },
    { id: nanoid(), courseId: courses[3].id, title: "Techniques de vente et négociation", order: 2 },
    // Bases de Données (courses[6])
    { id: nanoid(), courseId: courses[6].id, title: "Introduction aux bases de données", order: 1 },
    { id: nanoid(), courseId: courses[6].id, title: "Langage SQL avancé", order: 2 },
    // Marketing Digital (courses[4])
    { id: nanoid(), courseId: courses[4].id, title: "Stratégie digitale et réseaux sociaux", order: 1 },
    { id: nanoid(), courseId: courses[4].id, title: "SEO et publicité en ligne", order: 2 },
    // GRH (courses[9])
    { id: nanoid(), courseId: courses[9].id, title: "Recrutement et intégration", order: 1 },
    { id: nanoid(), courseId: courses[9].id, title: "Évaluation et développement", order: 2 },
    // Fiscalité (courses[12])
    { id: nanoid(), courseId: courses[12].id, title: "Impôts directs en RDC", order: 1 },
    { id: nanoid(), courseId: courses[12].id, title: "TVA et taxes indirectes", order: 2 },
  ];
  for (const m of moduleData) {
    try { await db.insert(modulesTable).values(m).onConflictDoNothing(); } catch {}
  }

  const chapterData: InsertChapter[] = [
    // Module 0 — Plan comptable OHADA
    { id: nanoid(), moduleId: moduleData[0].id, title: "Classes de comptes et codification", type: "TEXT", content: "Le plan comptable OHADA classe les comptes en 9 classes numérotées de 1 à 9. La classe 1 regroupe les comptes de capitaux propres et emprunts; la classe 2 les immobilisations; la classe 3 les stocks; les classes 4 et 5 les tiers et trésorerie; les classes 6 et 7 les charges et produits.", duration: 45, order: 1 },
    { id: nanoid(), moduleId: moduleData[0].id, title: "Principes comptables fondamentaux", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 30, order: 2 },
    // Module 1 — Journal
    { id: nanoid(), moduleId: moduleData[1].id, title: "Passation des écritures au journal", type: "TEXT", content: "L'enregistrement chronologique des opérations dans le journal constitue la base de la comptabilité. Chaque écriture doit mentionner la date, les comptes débités, les comptes crédités et le libellé.", duration: 50, order: 1 },
    { id: nanoid(), moduleId: moduleData[1].id, title: "Du journal au grand-livre", type: "PDF", content: "/docs/journal-grandlivre.pdf", duration: 40, order: 2 },
    // Module 2 — États financiers
    { id: nanoid(), moduleId: moduleData[2].id, title: "Le bilan et ses composantes", type: "TEXT", content: "Le bilan présente la situation patrimoniale de l'entreprise à une date donnée. L'actif comprend les immobilisations et actifs circulants; le passif les capitaux propres et dettes.", duration: 60, order: 1 },
    // Module 3 — Gestion commerciale
    { id: nanoid(), moduleId: moduleData[3].id, title: "Introduction au commerce et à l'économie", type: "TEXT", content: "Ce chapitre présente les concepts fondamentaux du commerce: offre, demande, marché, prix d'équilibre et les différentes structures de marché en économie de gestion.", duration: 30, order: 1 },
    { id: nanoid(), moduleId: moduleData[3].id, title: "Gestion de la relation client (CRM)", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 45, order: 2 },
    // Module 4 — Vente
    { id: nanoid(), moduleId: moduleData[4].id, title: "Techniques de prospection commerciale", type: "PDF", content: "/docs/prospection.pdf", duration: 60, order: 1 },
    // Module 5 — SQL
    { id: nanoid(), moduleId: moduleData[5].id, title: "Concepts des bases de données relationnelles", type: "TEXT", content: "Une base de données relationnelle organise les données en tables reliées par des clés étrangères. Le modèle Entité-Association (E-A) permet de modéliser les besoins avant implémentation.", duration: 40, order: 1 },
    { id: nanoid(), moduleId: moduleData[5].id, title: "Introduction à SQL", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 50, order: 2 },
    { id: nanoid(), moduleId: moduleData[6].id, title: "Requêtes SQL avancées — JOIN et sous-requêtes", type: "TEXT", content: "Les jointures permettent de combiner des données de plusieurs tables: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN. Les sous-requêtes (subqueries) s'imbriquent dans SELECT, FROM ou WHERE.", duration: 70, order: 1 },
    // Module 7 — Marketing digital
    { id: nanoid(), moduleId: moduleData[7].id, title: "Réseaux sociaux et stratégie de contenu", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 35, order: 1 },
    // Module 8 — SEO
    { id: nanoid(), moduleId: moduleData[8].id, title: "Fondamentaux du référencement naturel", type: "TEXT", content: "Le SEO (Search Engine Optimization) regroupe l'ensemble des techniques visant à améliorer le positionnement d'un site web dans les résultats des moteurs de recherche.", duration: 40, order: 1 },
    // Module 9 — RH recrutement
    { id: nanoid(), moduleId: moduleData[9].id, title: "Processus de recrutement et sélection", type: "TEXT", content: "Le recrutement comprend: définition du poste, diffusion de l'offre, tri des CVs, entretiens, tests psychotechniques et vérification des références. Le droit congolais encadre les CDI et CDD.", duration: 55, order: 1 },
    // Module 11 — Fiscalité
    { id: nanoid(), moduleId: moduleData[11].id, title: "L'impôt sur les bénéfices des sociétés (IBS)", type: "TEXT", content: "L'IBS en RDC s'applique au résultat fiscal des sociétés résidentes au taux de 30%. La base imposable est déterminée en retraitant le résultat comptable selon les règles du Code des Impôts.", duration: 50, order: 1 },
    { id: nanoid(), moduleId: moduleData[12].id, title: "TVA: mécanisme et déclaration", type: "PDF", content: "/docs/tva-rdc.pdf", duration: 45, order: 1 },
  ];
  for (const c of chapterData) {
    try { await db.insert(chaptersTable).values(c).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 13 modules, 16 chapters seeded");

  // ── Inscriptions (12 across all statuses) ─────────────────────────────────
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
    { id: nanoid(), studentId: students[0].id, status: "APPROVED", notes: "Dossier complet — validé en commission", documents: doc3 },
    { id: nanoid(), studentId: students[1].id, status: "PENDING", notes: null, documents: doc1 },
    { id: nanoid(), studentId: students[2].id, status: "UNDER_REVIEW", notes: "En cours de vérification des diplômes", documents: doc2 },
    { id: nanoid(), studentId: students[3].id, status: "APPROVED", notes: "Dossier validé sans réserve", documents: doc3 },
    { id: nanoid(), studentId: students[4].id, status: "REJECTED", notes: "Carte nationale d'identité manquante", documents: doc1 },
    { id: nanoid(), studentId: students[5].id, status: "APPROVED", notes: "Dossier complet", documents: doc3 },
    { id: nanoid(), studentId: students[6].id, status: "PENDING", notes: null, documents: doc2 },
    { id: nanoid(), studentId: students[7].id, status: "UNDER_REVIEW", notes: "Vérification des antécédents académiques", documents: doc2 },
    { id: nanoid(), studentId: students[8].id, status: "APPROVED", notes: "Admis en L2", documents: doc3 },
    { id: nanoid(), studentId: students[9].id, status: "REJECTED", notes: "Diplôme non reconnu — réorientation conseillée", documents: doc1 },
    { id: nanoid(), studentId: students[10].id, status: "APPROVED", notes: "Dossier validé — bourse accordée", documents: doc3 },
    { id: nanoid(), studentId: students[11].id, status: "PENDING", notes: null, documents: doc2 },
  ];
  for (const ins of inscriptionData) {
    try { await db.insert(inscriptionsTable).values(ins).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 12 inscriptions seeded");

  // ── Enrollments (students who paid for courses) ───────────────────────────
  const enrollmentData = [
    { id: nanoid(), studentId: students[0].id, courseId: courses[0].id },
    { id: nanoid(), studentId: students[0].id, courseId: courses[3].id },
    { id: nanoid(), studentId: students[2].id, courseId: courses[6].id },
    { id: nanoid(), studentId: students[3].id, courseId: courses[0].id },
    { id: nanoid(), studentId: students[5].id, courseId: courses[9].id },
    { id: nanoid(), studentId: students[8].id, courseId: courses[12].id },
    { id: nanoid(), studentId: students[10].id, courseId: courses[4].id },
    { id: nanoid(), studentId: students[12].id, courseId: courses[7].id },
  ];
  for (const e of enrollmentData) {
    try { await db.insert(enrollmentsTable).values(e).onConflictDoNothing(); } catch {}
  }
  console.log("✓ 8 enrollments seeded");

  // ── Payments — 6 months of history ────────────────────────────────────────
  // Operators and statuses for realistic distribution
  const ops = ["MTN_MONEY", "AIRTEL_MONEY", "ORANGE_MONEY"] as const;
  const courseMetaFor = (idx: number) => JSON.stringify({ courseId: courses[idx].id });

  const paymentData: InsertPayment[] = [
    // Month 6 ago — Inscription fees wave
    { id: nanoid(), studentId: students[0].id, reference: "ISC-M6-001", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[0]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-A1B2C3D4", metadata: null },
    { id: nanoid(), studentId: students[1].id, reference: "ISC-M6-002", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[1]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-E5F6G7H8", metadata: null },
    { id: nanoid(), studentId: students[2].id, reference: "ISC-M6-003", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[2]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-I9J0K1L2", metadata: null },
    { id: nanoid(), studentId: students[3].id, reference: "ISC-M6-004", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[3]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-M3N4O5P6", metadata: null },
    { id: nanoid(), studentId: students[4].id, reference: "ISC-M6-005", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[4]?.phone ?? "", status: "FAILED", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[5].id, reference: "ISC-M6-006", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[5]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-Q7R8S9T0", metadata: null },
    { id: nanoid(), studentId: students[6].id, reference: "ISC-M6-007", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[6]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-U1V2W3X4", metadata: null },
    { id: nanoid(), studentId: students[7].id, reference: "ISC-M6-008", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[7]?.phone ?? "", status: "PENDING", operatorRef: null, metadata: null },
    // Month 5 ago — Course fees wave 1
    { id: nanoid(), studentId: students[0].id, reference: "ISC-M5-001", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[0]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-Y5Z6A7B8", metadata: courseMetaFor(0) },
    { id: nanoid(), studentId: students[0].id, reference: "ISC-M5-002", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[0]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-C9D0E1F2", metadata: courseMetaFor(3) },
    { id: nanoid(), studentId: students[2].id, reference: "ISC-M5-003", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "ORANGE_MONEY", phoneNumber: students[2]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-G3H4I5J6", metadata: courseMetaFor(6) },
    { id: nanoid(), studentId: students[3].id, reference: "ISC-M5-004", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[3]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-K7L8M9N0", metadata: courseMetaFor(0) },
    { id: nanoid(), studentId: students[5].id, reference: "ISC-M5-005", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[5]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-O1P2Q3R4", metadata: courseMetaFor(9) },
    { id: nanoid(), studentId: students[1].id, reference: "ISC-M5-006", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[1]?.phone ?? "", status: "FAILED", operatorRef: null, metadata: courseMetaFor(4) },
    // Month 4 ago — Exam fees + more course fees
    { id: nanoid(), studentId: students[0].id, reference: "ISC-M4-001", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "MTN_MONEY", phoneNumber: students[0]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-S5T6U7V8", metadata: null },
    { id: nanoid(), studentId: students[2].id, reference: "ISC-M4-002", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "ORANGE_MONEY", phoneNumber: students[2]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-W9X0Y1Z2", metadata: null },
    { id: nanoid(), studentId: students[3].id, reference: "ISC-M4-003", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "MTN_MONEY", phoneNumber: students[3]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-A3B4C5D6", metadata: null },
    { id: nanoid(), studentId: students[8].id, reference: "ISC-M4-004", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[8]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-E7F8G9H0", metadata: courseMetaFor(12) },
    { id: nanoid(), studentId: students[10].id, reference: "ISC-M4-005", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[10]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-I1J2K3L4", metadata: courseMetaFor(4) },
    { id: nanoid(), studentId: students[6].id, reference: "ISC-M4-006", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[6]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-M5N6O7P8", metadata: null },
    // Month 3 ago
    { id: nanoid(), studentId: students[12].id, reference: "ISC-M3-001", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[12]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-Q9R0S1T2", metadata: courseMetaFor(7) },
    { id: nanoid(), studentId: students[9].id, reference: "ISC-M3-002", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[9]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-U3V4W5X6", metadata: null },
    { id: nanoid(), studentId: students[11].id, reference: "ISC-M3-003", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[11]?.phone ?? "", status: "INITIATED", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[5].id, reference: "ISC-M3-004", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "ORANGE_MONEY", phoneNumber: students[5]?.phone ?? "", status: "CONFIRMED", operatorRef: "ORA-Y7Z8A9B0", metadata: null },
    { id: nanoid(), studentId: students[8].id, reference: "ISC-M3-005", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "MTN_MONEY", phoneNumber: students[8]?.phone ?? "", status: "FAILED", operatorRef: null, metadata: null },
    // Month 2 ago
    { id: nanoid(), studentId: students[13].id, reference: "ISC-M2-001", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[13]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-C1D2E3F4", metadata: null },
    { id: nanoid(), studentId: students[14].id, reference: "ISC-M2-002", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[14]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-G5H6I7J8", metadata: null },
    { id: nanoid(), studentId: students[15].id, reference: "ISC-M2-003", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[15]?.phone ?? "", status: "PENDING", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[10].id, reference: "ISC-M2-004", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "MTN_MONEY", phoneNumber: students[10]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-K9L0M1N2", metadata: null },
    { id: nanoid(), studentId: students[12].id, reference: "ISC-M2-005", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[12]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-O3P4Q5R6", metadata: courseMetaFor(10) },
    // Month 1 ago (most recent)
    { id: nanoid(), studentId: students[16].id, reference: "ISC-M1-001", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[16]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-S7T8U9V0", metadata: null },
    { id: nanoid(), studentId: students[17].id, reference: "ISC-M1-002", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[17]?.phone ?? "", status: "CONFIRMED", operatorRef: "AIR-W1X2Y3Z4", metadata: null },
    { id: nanoid(), studentId: students[18].id, reference: "ISC-M1-003", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: students[18]?.phone ?? "", status: "INITIATED", operatorRef: null, metadata: null },
    { id: nanoid(), studentId: students[19].id, reference: "ISC-M1-004", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MTN_MONEY", phoneNumber: students[19]?.phone ?? "", status: "CONFIRMED", operatorRef: "MTN-A5B6C7D8", metadata: null },
    { id: nanoid(), studentId: students[13].id, reference: "ISC-M1-005", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "MTN_MONEY", phoneNumber: students[13]?.phone ?? "", status: "PENDING", operatorRef: null, metadata: courseMetaFor(5) },
    { id: nanoid(), studentId: students[14].id, reference: "ISC-M1-006", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: students[14]?.phone ?? "", status: "INITIATED", operatorRef: null, metadata: courseMetaFor(1) },
  ];
  for (const p of paymentData) {
    try { await db.insert(paymentsTable).values(p).onConflictDoNothing(); } catch {}
  }
  console.log(`✓ ${paymentData.length} payments (6 months history) seeded`);

  console.log("\n✅ Database seeded successfully!");
  console.log("   — 5 filieres");
  console.log("   — 7 teachers, 20 students");
  console.log("   — 15 courses (3 per filière)");
  console.log("   — 13 modules, 16 chapters");
  console.log("   — 12 inscriptions, 8 enrollments");
  console.log(`   — ${paymentData.length} payments (6-month history, all operators)`);
}

seed().catch(console.error);
