export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "ISC Mbujimayi Platform API",
    description:
      "API REST complète pour la plateforme numérique de l'Institut Supérieur de Commerce de Mbujimayi (DRC). Gestion académique, e-learning, paiements Mobile Money.",
    version: "1.0.0",
    contact: {
      name: "ISC Mbujimayi",
      email: "info@isc-mbujimayi.ac.cd",
      url: "https://www.isc-mbujimayi.ac.cd",
    },
  },
  servers: [{ url: "/api", description: "API Server" }],
  tags: [
    { name: "Health", description: "Vérification de l'état du serveur" },
    { name: "Users", description: "Gestion des utilisateurs et authentification" },
    { name: "Filieres", description: "Gestion des filières (programmes d'études)" },
    { name: "Students", description: "Gestion des étudiants" },
    { name: "Teachers", description: "Gestion des enseignants" },
    { name: "Inscriptions", description: "Gestion des inscriptions académiques" },
    { name: "Courses", description: "Gestion des cours, modules et chapitres" },
    { name: "Enrollments", description: "Inscriptions aux cours et suivi de progression" },
    { name: "Payments", description: "Paiements Mobile Money (MTN, Airtel, Orange)" },
    { name: "Certificates", description: "Certificats de réussite" },
    { name: "Evaluations", description: "Évaluations et examens (QCM + questions ouvertes)" },
    { name: "Forum", description: "Forum de discussion par cours" },
    { name: "Chatbot", description: "Assistant IA ISC" },
    { name: "Analytics", description: "Statistiques et tableaux de bord" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT Clerk. Obtenez-le via /api/clerk-proxy.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Ressource non trouvée" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      Filiere: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string", example: "INFO" },
          name: { type: "string", example: "Informatique de Gestion" },
          description: { type: "string" },
          duration: { type: "integer", example: 4 },
          studentCount: { type: "integer" },
          courseCount: { type: "integer" },
        },
      },
      Student: {
        type: "object",
        properties: {
          id: { type: "string" },
          numEtudiant: { type: "string", example: "ISC24001" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string", example: "+243812345678" },
          filiereId: { type: "string", nullable: true },
          filiere: { $ref: "#/components/schemas/Filiere", nullable: true },
        },
      },
      Teacher: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string", example: "PROF001" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          specialty: { type: "string" },
          grade: { type: "string" },
          courseCount: { type: "integer" },
        },
      },
      Course: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          level: { type: "string", example: "L1" },
          duration: { type: "integer", description: "Durée en minutes" },
          teacher: { $ref: "#/components/schemas/Teacher" },
          filiere: { $ref: "#/components/schemas/Filiere", nullable: true },
          enrollmentCount: { type: "integer" },
          moduleCount: { type: "integer" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          reference: { type: "string", example: "ISC-1716000000000-ABCDEF" },
          amount: { type: "string", example: "75000" },
          currency: { type: "string", example: "CDF" },
          type: {
            type: "string",
            enum: ["INSCRIPTION_FEE", "COURSE_FEE", "EXAM_FEE", "LATE_FEE", "CERTIFICATE_FEE", "OTHER"],
          },
          operator: {
            type: "string",
            enum: ["MTN_MONEY", "AIRTEL_MONEY", "ORANGE_MONEY"],
          },
          phoneNumber: { type: "string", example: "+243812345678" },
          status: {
            type: "string",
            enum: ["INITIATED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED", "REFUNDED"],
          },
          operatorRef: { type: "string", nullable: true },
        },
      },
      Certificate: {
        type: "object",
        properties: {
          id: { type: "string" },
          hash: { type: "string" },
          studentId: { type: "string" },
          courseId: { type: "string" },
          issuedAt: { type: "string", format: "date-time" },
          course: { $ref: "#/components/schemas/Course" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Vérification de l'état",
        security: [],
        responses: {
          "200": { description: "Serveur opérationnel", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" } } } } } },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Profil utilisateur courant",
        responses: {
          "200": { description: "Profil utilisateur" },
          "401": { description: "Non authentifié", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Mettre à jour son profil",
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" } } } } } },
        responses: { "200": { description: "Profil mis à jour" } },
      },
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Liste des utilisateurs (Admin)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "role", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Liste des utilisateurs" } },
      },
    },
    "/filieres": {
      get: {
        tags: ["Filieres"],
        summary: "Liste des filières",
        security: [],
        responses: { "200": { description: "Filières disponibles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Filiere" } } } } } },
      },
      post: {
        tags: ["Filieres"],
        summary: "Créer une filière (Admin)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" }, description: { type: "string" }, duration: { type: "integer" } } } } },
        },
        responses: {
          "201": { description: "Filière créée" },
          "400": { description: "Données invalides" },
        },
      },
    },
    "/students": {
      get: {
        tags: ["Students"],
        summary: "Liste des étudiants (Service Académique)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "filiereId", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Liste des étudiants" } },
      },
    },
    "/teachers": {
      get: {
        tags: ["Teachers"],
        summary: "Liste des enseignants",
        security: [],
        responses: { "200": { description: "Liste des enseignants", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Teacher" } } } } } },
      },
    },
    "/courses": {
      get: {
        tags: ["Courses"],
        summary: "Liste des cours",
        security: [],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "filiereId", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Liste des cours" } },
      },
      post: {
        tags: ["Courses"],
        summary: "Créer un cours (Enseignant/Admin)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, status: { type: "string" }, level: { type: "string" }, duration: { type: "integer" }, filiereId: { type: "string" } } } } } },
        responses: { "201": { description: "Cours créé" } },
      },
    },
    "/courses/{id}": {
      get: {
        tags: ["Courses"],
        summary: "Détail d'un cours",
        security: [],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Détail du cours" }, "404": { description: "Non trouvé" } },
      },
    },
    "/courses/{courseId}/enroll": {
      post: {
        tags: ["Enrollments"],
        summary: "S'inscrire à un cours",
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Inscription créée" } },
      },
    },
    "/courses/{courseId}/progress": {
      put: {
        tags: ["Enrollments"],
        summary: "Mettre à jour la progression",
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { chapterId: { type: "string" }, completed: { type: "boolean" } } } } } },
        responses: { "200": { description: "Progression mise à jour" } },
      },
    },
    "/payments/initiate": {
      post: {
        tags: ["Payments"],
        summary: "Initier un paiement Mobile Money",
        description: "Initie un paiement et déclenche la simulation asynchrone MTN/Airtel/Orange (délai 2–4 sec selon opérateur, taux de succès 90%).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "type", "operator", "phoneNumber"],
                properties: {
                  amount: { type: "string", example: "75000", description: "Montant en CDF" },
                  type: { type: "string", enum: ["INSCRIPTION_FEE", "COURSE_FEE", "EXAM_FEE", "LATE_FEE", "CERTIFICATE_FEE", "OTHER"] },
                  operator: { type: "string", enum: ["MTN_MONEY", "AIRTEL_MONEY", "ORANGE_MONEY"] },
                  phoneNumber: { type: "string", example: "+243812345678" },
                  studentId: { type: "string", description: "Requis pour les agents du service financier" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Paiement initié, simulation en cours", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
        },
      },
    },
    "/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Détail d'un paiement",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Détail du paiement" }, "404": { description: "Non trouvé" } },
      },
    },
    "/payments/{id}/receipt": {
      get: {
        tags: ["Payments"],
        summary: "Télécharger le reçu PDF d'un paiement",
        description: "Génère et retourne un reçu de paiement au format PDF. Disponible uniquement pour les paiements confirmés.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Reçu PDF", content: { "application/pdf": {} } },
          "400": { description: "Paiement non confirmé" },
          "404": { description: "Paiement non trouvé" },
        },
      },
    },
    "/payments/callback/{operator}": {
      post: {
        tags: ["Payments"],
        summary: "Callback opérateur Mobile Money (Webhook)",
        description: "Endpoint appelé par les opérateurs Mobile Money pour confirmer/rejeter un paiement.",
        parameters: [{ name: "operator", in: "path", required: true, schema: { type: "string", enum: ["MTN_MONEY", "AIRTEL_MONEY", "ORANGE_MONEY"] } }],
        security: [],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reference", "status"],
                properties: {
                  reference: { type: "string" },
                  status: { type: "string", enum: ["SUCCESS", "FAILED"] },
                  operatorRef: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Paiement mis à jour" } },
      },
    },
    "/certificates": {
      get: {
        tags: ["Certificates"],
        summary: "Certificats de l'étudiant courant",
        responses: { "200": { description: "Liste des certificats" } },
      },
    },
    "/certificates/{id}": {
      get: {
        tags: ["Certificates"],
        summary: "Détail d'un certificat",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Certificat" }, "404": { description: "Non trouvé" } },
      },
    },
    "/certificates/{id}/download": {
      get: {
        tags: ["Certificates"],
        summary: "Télécharger un certificat en PDF",
        description: "Génère et retourne un certificat de réussite au format PDF (A4 paysage).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Certificat PDF", content: { "application/pdf": {} } },
          "404": { description: "Non trouvé" },
        },
      },
    },
    "/certificates/verify/{hash}": {
      get: {
        tags: ["Certificates"],
        summary: "Vérifier l'authenticité d'un certificat",
        security: [],
        parameters: [{ name: "hash", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Résultat de la vérification" } },
      },
    },
    "/courses/{courseId}/forum": {
      get: {
        tags: ["Forum"],
        summary: "Posts du forum d'un cours",
        security: [],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Liste des posts" } },
      },
      post: {
        tags: ["Forum"],
        summary: "Publier un message dans le forum",
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { content: { type: "string" }, parentId: { type: "string" } } } } } },
        responses: { "201": { description: "Post créé" } },
      },
    },
    "/chatbot": {
      post: {
        tags: ["Chatbot"],
        summary: "Envoyer un message à l'assistant ISC",
        description: "Répond d'abord depuis la FAQ. Si la question est hors sujet, escalade vers GPT-4o-mini.",
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, sessionId: { type: "string" } } } } } },
        responses: { "200": { description: "Réponse de l'assistant" } },
      },
    },
    "/analytics/summary": {
      get: {
        tags: ["Analytics"],
        summary: "Résumé statistique (tableau de bord)",
        responses: { "200": { description: "Statistiques globales" } },
      },
    },
    "/inscriptions": {
      get: {
        tags: ["Inscriptions"],
        summary: "Liste des inscriptions",
        responses: { "200": { description: "Inscriptions" } },
      },
      post: {
        tags: ["Inscriptions"],
        summary: "Créer une inscription",
        responses: { "201": { description: "Inscription créée" } },
      },
    },
  },
};
