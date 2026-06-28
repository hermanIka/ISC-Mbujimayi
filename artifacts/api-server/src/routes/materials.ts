import { Router, type IRouter } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, courseMaterialsTable, chaptersTable, modulesTable, coursesTable, teachersTable, enrollmentsTable, studentsTable } from "@workspace/db";
import { requireAuth, requireTeacher, getCallerDbUser } from "../middlewares/auth";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const ALLOWED_CONTENT_TYPES = [
  "video/mp4", "video/webm", "video/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const DOC_MAX_BYTES = 20 * 1024 * 1024;

function getMaterialType(contentType: string): "VIDEO" | "PDF" | "DOC" {
  if (contentType.startsWith("video/")) return "VIDEO";
  if (contentType === "application/pdf") return "PDF";
  return "DOC";
}

function toDownloadUrl(materialId: string): string {
  return `/api/materials/${materialId}/download`;
}

function withDownloadUrl<T extends { id: string; url: string | null }>(mat: T): T & { url: string } {
  return { ...mat, url: toDownloadUrl(mat.id) };
}

async function assertChapterCourseOwner(
  req: import("express").Request,
  chapterId: string,
  res: import("express").Response,
): Promise<boolean> {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) { res.status(404).json({ error: "Chapitre non trouvé" }); return false; }
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, chapter.moduleId));
  if (!mod) { res.status(404).json({ error: "Module non trouvé" }); return false; }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) { res.status(401).json({ error: "Non authentifié" }); return false; }
  if (["ADMIN", "DIRECTOR"].includes(callerUser.role)) return true;
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, mod.courseId));
  if (!teacher || !course || course.teacherId !== teacher.id) {
    res.status(403).json({ error: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    return false;
  }
  return true;
}

router.get("/chapters/:chapterId/materials", requireAuth, async (req, res): Promise<void> => {
  const { chapterId } = req.params;
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) { res.status(401).json({ error: "Non authentifié" }); return; }

  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  const [mod] = chapter ? (await db.select().from(modulesTable).where(eq(modulesTable.id, chapter.moduleId))) : [null];
  if (!chapter || !mod) { res.status(404).json({ error: "Chapitre non trouvé" }); return; }

  if (!["ADMIN", "DIRECTOR"].includes(callerUser.role)) {
    if (callerUser.role === "TEACHER") {
      const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, mod.courseId));
      if (!teacher || !course || course.teacherId !== teacher.id) {
        res.status(403).json({ error: "Accès refusé : vous n'êtes pas l'auteur de ce cours" }); return;
      }
    } else {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
      if (!student) { res.status(403).json({ error: "Accès refusé : inscription requise" }); return; }
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.studentId, student.id));
      if (!enrollments.some((e) => e.courseId === mod.courseId)) {
        res.status(403).json({ error: "Accès refusé : vous n'êtes pas inscrit à ce cours" }); return;
      }
    }
  }

  const materials = await db.select().from(courseMaterialsTable).where(eq(courseMaterialsTable.chapterId, chapterId));
  res.json(materials.map(withDownloadUrl));
});

const CreateMaterialBody = z.object({
  objectPath: z.string().startsWith("/objects/"),
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
});

router.post("/chapters/:chapterId/materials", requireTeacher, async (req, res): Promise<void> => {
  const { chapterId } = req.params;
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Corps invalide : objectPath, fileName, fileSize, contentType requis" });
    return;
  }
  const { objectPath, fileName, fileSize, contentType } = parsed.data;

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    res.status(400).json({ error: `Type de fichier non autorisé : ${contentType}` });
    return;
  }
  const maxBytes = contentType.startsWith("video/") ? VIDEO_MAX_BYTES : DOC_MAX_BYTES;
  if (fileSize > maxBytes) {
    const maxMB = maxBytes / (1024 * 1024);
    res.status(400).json({ error: `Fichier trop volumineux. Maximum : ${maxMB} Mo pour ce type.` });
    return;
  }

  const authorized = await assertChapterCourseOwner(req, chapterId, res);
  if (!authorized) return;

  let actualContentType: string;
  let actualSize: number;
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const [metadata] = await objectFile.getMetadata();
    actualContentType = (metadata.contentType as string) || contentType;
    actualSize = Number(metadata.size ?? fileSize);
  } catch (err) {
    logger.warn({ err, objectPath }, "⚠️ [MATERIALS] Impossible de lire les métadonnées GCS");
    res.status(400).json({ error: "Objet introuvable dans le stockage. Veuillez ré-uploader le fichier." });
    return;
  }

  if (!ALLOWED_CONTENT_TYPES.includes(actualContentType)) {
    res.status(400).json({ error: `Type de fichier réel non autorisé (${actualContentType}). Types acceptés : vidéo MP4/WebM/Ogg, PDF, DOC/DOCX.` });
    return;
  }
  const actualMaxBytes = actualContentType.startsWith("video/") ? VIDEO_MAX_BYTES : DOC_MAX_BYTES;
  if (actualSize > actualMaxBytes) {
    const maxMB = actualMaxBytes / (1024 * 1024);
    res.status(400).json({ error: `Fichier réel trop volumineux (${(actualSize / (1024 * 1024)).toFixed(1)} Mo). Maximum : ${maxMB} Mo.` });
    return;
  }

  const matType = getMaterialType(actualContentType);
  const id = nanoid();
  const [material] = await db
    .insert(courseMaterialsTable)
    .values({ id, chapterId, type: matType, url: objectPath, fileName, fileSize: actualSize })
    .returning();

  logger.info({ chapterId, type: matType, fileName, actualContentType, actualSize }, "✅ [MATERIALS] Support ajouté (object storage)");
  res.status(201).json(withDownloadUrl(material));
});

router.delete("/materials/:id", requireTeacher, async (req, res): Promise<void> => {
  const { id } = req.params;
  const [material] = await db.select().from(courseMaterialsTable).where(eq(courseMaterialsTable.id, id));
  if (!material) { res.status(404).json({ error: "Support introuvable" }); return; }

  const authorized = await assertChapterCourseOwner(req, material.chapterId, res);
  if (!authorized) return;

  if (material.url && material.url.startsWith("/objects/")) {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(material.url);
      await objectFile.delete();
      logger.info({ id, objectPath: material.url }, "🗑️ [MATERIALS] Objet GCS supprimé");
    } catch (err) {
      if (!(err instanceof ObjectNotFoundError)) {
        logger.warn({ err, id }, "⚠️ [MATERIALS] Impossible de supprimer l'objet GCS");
      }
    }
  }

  await db.delete(courseMaterialsTable).where(eq(courseMaterialsTable.id, id));
  logger.info({ id, fileName: material.fileName }, "🗑️ [MATERIALS] Support supprimé");
  res.sendStatus(204);
});

router.get("/materials/:id/download", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const [material] = await db.select().from(courseMaterialsTable).where(eq(courseMaterialsTable.id, id));
  if (!material) { res.status(404).json({ error: "Support introuvable" }); return; }

  const callerUser = await getCallerDbUser(req);
  if (!callerUser) { res.status(401).json({ error: "Non authentifié" }); return; }

  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, material.chapterId));
  if (!chapter) { res.status(403).json({ error: "Accès refusé" }); return; }
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, chapter.moduleId));
  if (!mod) { res.status(403).json({ error: "Accès refusé" }); return; }

  if (!["ADMIN", "DIRECTOR"].includes(callerUser.role)) {
    if (callerUser.role === "TEACHER") {
      const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, mod.courseId));
      if (!teacher || !course || course.teacherId !== teacher.id) {
        res.status(403).json({ error: "Accès refusé : vous n'êtes pas l'auteur de ce cours" }); return;
      }
    } else {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
      if (!student) { res.status(403).json({ error: "Accès refusé" }); return; }
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.studentId, student.id));
      if (!enrollments.some((e) => e.courseId === mod.courseId)) {
        res.status(403).json({ error: "Accès refusé : inscription requise" }); return;
      }
    }
  }

  const objectPath = material.url;
  if (!objectPath || !objectPath.startsWith("/objects/")) {
    res.status(410).json({ error: "Ce support utilise l'ancien stockage (non disponible)" });
    return;
  }

  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile, 0);
    const isVideo = material.type === "VIDEO";
    const disposition = isVideo ? "inline" : `attachment; filename="${encodeURIComponent(material.fileName ?? "fichier")}"`;
    res.setHeader("Content-Disposition", disposition);
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key !== "content-disposition") res.setHeader(key, value);
    });
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Fichier non trouvé dans le stockage" });
    } else {
      logger.error({ err, id }, "Erreur streaming GCS");
      res.status(500).json({ error: "Erreur lors du téléchargement" });
    }
  }
});

export default router;
