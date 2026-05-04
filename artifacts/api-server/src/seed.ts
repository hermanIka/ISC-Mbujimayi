import {
  db, usersTable, filieresTable, studentsTable, teachersTable,
  coursesTable, modulesTable, chaptersTable, inscriptionsTable, paymentsTable,
  type InsertStudent, type InsertCourse, type InsertChapter,
  type InsertInscription, type InsertPayment,
} from "@workspace/db";
import { nanoid } from "nanoid";

async function seed() {
  console.log("Seeding database...");

  const filiereData = [
    { id: nanoid(), code: "COMPTA", name: "Comptabilité", description: "Formation en comptabilité et finance d'entreprise", duration: 4 },
    { id: nanoid(), code: "MKT", name: "Marketing", description: "Formation en marketing et stratégie commerciale", duration: 4 },
    { id: nanoid(), code: "INFO", name: "Informatique de Gestion", description: "Formation en informatique de gestion et développement", duration: 4 },
    { id: nanoid(), code: "GRH", name: "Gestion des Ressources Humaines", description: "Formation en gestion des ressources humaines et management", duration: 4 },
    { id: nanoid(), code: "FISC", name: "Fiscalité", description: "Formation en fiscalité, droit fiscal et optimisation fiscale", duration: 3 },
  ];

  for (const f of filiereData) {
    try {
      await db.insert(filieresTable).values(f).onConflictDoNothing();
    } catch {}
  }
  console.log("✓ Filieres seeded");

  const adminUser = {
    id: nanoid(), clerkId: "seed_admin_001", email: "admin@isc-mbujimayi.ac.cd",
    firstName: "Jean-Paul", lastName: "Kalumba", role: "ADMIN" as const, isActive: true,
  };
  const directorUser = {
    id: nanoid(), clerkId: "seed_director_001", email: "directeur@isc-mbujimayi.ac.cd",
    firstName: "Prosper", lastName: "Ngandu", role: "DIRECTOR" as const, isActive: true,
  };
  const financialUser = {
    id: nanoid(), clerkId: "seed_financial_001", email: "finance@isc-mbujimayi.ac.cd",
    firstName: "Marie", lastName: "Kabwe", role: "FINANCIAL_SERVICE" as const, isActive: true,
  };
  const academicUser = {
    id: nanoid(), clerkId: "seed_academic_001", email: "scolarite@isc-mbujimayi.ac.cd",
    firstName: "André", lastName: "Mutombo", role: "ACADEMIC_SERVICE" as const, isActive: true,
  };

  for (const u of [adminUser, directorUser, financialUser, academicUser]) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }

  const teacherUsers = [
    { id: nanoid(), clerkId: "seed_teacher_001", email: "prof.mukendi@isc-mbujimayi.ac.cd", firstName: "Patrick", lastName: "Mukendi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_002", email: "prof.tshiamala@isc-mbujimayi.ac.cd", firstName: "Cécile", lastName: "Tshiamala", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_003", email: "prof.kazadi@isc-mbujimayi.ac.cd", firstName: "Théodore", lastName: "Kazadi", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_004", email: "prof.kabamba@isc-mbujimayi.ac.cd", firstName: "Joseph", lastName: "Kabamba", role: "TEACHER" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_teacher_005", email: "prof.ntumba@isc-mbujimayi.ac.cd", firstName: "Henriette", lastName: "Ntumba", role: "TEACHER" as const, isActive: true },
  ];
  for (const u of teacherUsers) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Users seeded");

  const teachers = [
    { id: nanoid(), userId: teacherUsers[0].id, code: "PROF001", firstName: "Patrick", lastName: "Mukendi", specialty: "Gestion Commerciale & Marketing", grade: "Professeur Associé" },
    { id: nanoid(), userId: teacherUsers[1].id, code: "PROF002", firstName: "Cécile", lastName: "Tshiamala", specialty: "Informatique de Gestion & Bases de Données", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[2].id, code: "PROF003", firstName: "Théodore", lastName: "Kazadi", specialty: "Comptabilité & Finance", grade: "Professeur Ordinaire" },
    { id: nanoid(), userId: teacherUsers[3].id, code: "PROF004", firstName: "Joseph", lastName: "Kabamba", specialty: "Management & Leadership", grade: "Chargé de Cours" },
    { id: nanoid(), userId: teacherUsers[4].id, code: "PROF005", firstName: "Henriette", lastName: "Ntumba", specialty: "Secrétariat & Bureautique", grade: "Assistant" },
  ];
  for (const t of teachers) {
    try { await db.insert(teachersTable).values(t).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Teachers seeded");

  const studentUsers = [
    { id: nanoid(), clerkId: "seed_student_001", email: "etudiant.kalenga@isc-mbujimayi.ac.cd", firstName: "Emmanuel", lastName: "Kalenga", role: "STUDENT" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_student_002", email: "etudiant.mbuyi@isc-mbujimayi.ac.cd", firstName: "Thérèse", lastName: "Mbuyi", role: "STUDENT" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_student_003", email: "etudiant.tshiongo@isc-mbujimayi.ac.cd", firstName: "Albert", lastName: "Tshiongo", role: "STUDENT" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_student_004", email: "etudiant.kaseba@isc-mbujimayi.ac.cd", firstName: "Claudine", lastName: "Kaseba", role: "STUDENT" as const, isActive: true },
    { id: nanoid(), clerkId: "seed_student_005", email: "etudiant.kabongo@isc-mbujimayi.ac.cd", firstName: "Gabriel", lastName: "Kabongo", role: "STUDENT" as const, isActive: true },
  ];
  for (const u of studentUsers) {
    try { await db.insert(usersTable).values(u).onConflictDoNothing(); } catch {}
  }

  const filieres = await db.select().from(filieresTable);
  const students: InsertStudent[] = [
    { id: nanoid(), userId: studentUsers[0].id, numEtudiant: "ISC24001", firstName: "Emmanuel", lastName: "Kalenga", phone: "+243812345678", filiereId: filieres[0]?.id ?? null },
    { id: nanoid(), userId: studentUsers[1].id, numEtudiant: "ISC24002", firstName: "Thérèse", lastName: "Mbuyi", phone: "+243823456789", filiereId: filieres[1]?.id ?? null },
    { id: nanoid(), userId: studentUsers[2].id, numEtudiant: "ISC24003", firstName: "Albert", lastName: "Tshiongo", phone: "+243834567890", filiereId: filieres[2]?.id ?? null },
    { id: nanoid(), userId: studentUsers[3].id, numEtudiant: "ISC24004", firstName: "Claudine", lastName: "Kaseba", phone: "+243845678901", filiereId: filieres[0]?.id ?? null },
    { id: nanoid(), userId: studentUsers[4].id, numEtudiant: "ISC24005", firstName: "Gabriel", lastName: "Kabongo", phone: "+243856789012", filiereId: filieres[1]?.id ?? null },
  ];
  for (const s of students) {
    try { await db.insert(studentsTable).values(s).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Students seeded");

  const courses: InsertCourse[] = [
    {
      id: nanoid(), teacherId: teachers[0].id, filiereId: filieres[0]?.id ?? null, title: "Gestion Commerciale Avancée",
      description: "Ce cours couvre les stratégies commerciales modernes, la gestion de la relation client et les techniques de vente avancées.",
      status: "PUBLISHED", level: "L2", duration: 60,
    },
    {
      id: nanoid(), teacherId: teachers[1].id, filiereId: filieres[1]?.id ?? null, title: "Bases de Données et SQL",
      description: "Introduction complète aux bases de données relationnelles, SQL et aux systèmes de gestion de bases de données modernes.",
      status: "PUBLISHED", level: "L1", duration: 45,
    },
    {
      id: nanoid(), teacherId: teachers[2].id, filiereId: filieres[2]?.id ?? null, title: "Comptabilité Générale",
      description: "Principes fondamentaux de la comptabilité générale, plan comptable OHADA et élaboration des états financiers.",
      status: "PUBLISHED", level: "L1", duration: 80,
    },
    {
      id: nanoid(), teacherId: teachers[0].id, filiereId: filieres[3]?.id ?? null, title: "Marketing Digital",
      description: "Stratégies de marketing digital pour les entreprises modernes: réseaux sociaux, SEO, publicité en ligne.",
      status: "PUBLISHED", level: "L2", duration: 40,
    },
    {
      id: nanoid(), teacherId: teachers[1].id, filiereId: filieres[1]?.id ?? null, title: "Développement Web",
      description: "Introduction au développement web moderne avec HTML, CSS et JavaScript pour les applications de gestion.",
      status: "DRAFT", level: "L2", duration: 50,
    },
  ];
  for (const c of courses) {
    try { await db.insert(coursesTable).values(c).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Courses seeded");

  const moduleData = [
    { id: nanoid(), courseId: courses[0].id, title: "Fondamentaux de la gestion commerciale", order: 1 },
    { id: nanoid(), courseId: courses[0].id, title: "Techniques de vente et négociation", order: 2 },
    { id: nanoid(), courseId: courses[1].id, title: "Introduction aux bases de données", order: 1 },
    { id: nanoid(), courseId: courses[1].id, title: "Langage SQL avancé", order: 2 },
    { id: nanoid(), courseId: courses[2].id, title: "Principes comptables OHADA", order: 1 },
    { id: nanoid(), courseId: courses[2].id, title: "Élaboration des états financiers", order: 2 },
  ];
  for (const m of moduleData) {
    try { await db.insert(modulesTable).values(m).onConflictDoNothing(); } catch {}
  }

  const chapterData: InsertChapter[] = [
    { id: nanoid(), moduleId: moduleData[0].id, title: "Introduction au commerce et à l'économie", type: "TEXT", content: "Ce chapitre introduit les concepts fondamentaux du commerce...", duration: 30, order: 1 },
    { id: nanoid(), moduleId: moduleData[0].id, title: "Gestion de la relation client (CRM)", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 45, order: 2 },
    { id: nanoid(), moduleId: moduleData[1].id, title: "Techniques de prospection commerciale", type: "PDF", content: "/docs/prospection.pdf", duration: 60, order: 1 },
    { id: nanoid(), moduleId: moduleData[2].id, title: "Concepts des bases de données relationnelles", type: "TEXT", content: "Une base de données relationnelle est un ensemble de données...", duration: 40, order: 1 },
    { id: nanoid(), moduleId: moduleData[2].id, title: "Introduction à SQL", type: "VIDEO", content: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: 50, order: 2 },
    { id: nanoid(), moduleId: moduleData[3].id, title: "Requêtes SQL avancées", type: "TEXT", content: "Les requêtes SQL avancées incluent les JOIN, sous-requêtes...", duration: 70, order: 1 },
    { id: nanoid(), moduleId: moduleData[4].id, title: "Le plan comptable OHADA", type: "PDF", content: "/docs/ohada.pdf", duration: 90, order: 1 },
    { id: nanoid(), moduleId: moduleData[5].id, title: "Bilan comptable et compte de résultat", type: "TEXT", content: "Le bilan comptable représente la situation financière...", duration: 80, order: 1 },
  ];
  for (const c of chapterData) {
    try { await db.insert(chaptersTable).values(c).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Modules and chapters seeded");

  const now = new Date().toISOString();
  const inscriptionData: InsertInscription[] = [
    { id: nanoid(), studentId: students[0].id, status: "APPROVED", notes: "Dossier complet et validé", documents: [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }, { type: "photo", name: "photo.jpg", url: "/docs/photo.jpg", uploadedAt: now }, { type: "cni", name: "cni.pdf", url: "/docs/cni.pdf", uploadedAt: now }] },
    { id: nanoid(), studentId: students[1].id, status: "PENDING", notes: null, documents: [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }] },
    { id: nanoid(), studentId: students[2].id, status: "UNDER_REVIEW", notes: "En cours de vérification", documents: [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }, { type: "photo", name: "photo.jpg", url: "/docs/photo.jpg", uploadedAt: now }] },
    { id: nanoid(), studentId: students[3].id, status: "APPROVED", notes: "Dossier validé", documents: [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }, { type: "photo", name: "photo.jpg", url: "/docs/photo.jpg", uploadedAt: now }, { type: "cni", name: "cni.pdf", url: "/docs/cni.pdf", uploadedAt: now }] },
    { id: nanoid(), studentId: students[4].id, status: "REJECTED", notes: "Documents manquants: carte nationale d'identité requise", documents: [{ type: "diplome", name: "diplome.pdf", url: "/docs/diplome.pdf", uploadedAt: now }] },
  ];
  for (const ins of inscriptionData) {
    try { await db.insert(inscriptionsTable).values(ins).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Inscriptions seeded");

  const paymentData: InsertPayment[] = [
    { id: nanoid(), studentId: students[0].id, reference: "ISC-001-ABCD", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "ORANGE_MONEY", phoneNumber: "+243812345678", status: "CONFIRMED", operatorRef: "MTN001" },
    { id: nanoid(), studentId: students[0].id, reference: "ISC-002-EFGH", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "AIRTEL_MONEY", phoneNumber: "+243812345678", status: "CONFIRMED", operatorRef: "AIR001" },
    { id: nanoid(), studentId: students[1].id, reference: "ISC-003-IJKL", amount: "75000", currency: "CDF", type: "INSCRIPTION_FEE", operator: "MPESA", phoneNumber: "+243823456789", status: "INITIATED", operatorRef: null },
    { id: nanoid(), studentId: students[2].id, reference: "ISC-004-MNOP", amount: "150000", currency: "CDF", type: "COURSE_FEE", operator: "ORANGE_MONEY", phoneNumber: "+243834567890", status: "CONFIRMED", operatorRef: "MTN002" },
    { id: nanoid(), studentId: students[3].id, reference: "ISC-005-QRST", amount: "25000", currency: "CDF", type: "EXAM_FEE", operator: "AIRTEL_MONEY", phoneNumber: "+243845678901", status: "PENDING", operatorRef: null },
  ];
  for (const p of paymentData) {
    try { await db.insert(paymentsTable).values(p).onConflictDoNothing(); } catch {}
  }
  console.log("✓ Payments seeded");

  console.log("✅ Database seeded successfully!");
}

seed().catch(console.error);
