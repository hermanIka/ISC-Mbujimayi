import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, courseMaterialsTable, chaptersTable, modulesTable, coursesTable, teachersTable } from "@workspace/db";
import { requireTeacher, getCallerDbUser } from "../middlewares/auth";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid()}-${Date.now()}${ext}`);
  },
});

const VIDEO_MAX = 50 * 1024 * 1024;
const DOC_MAX = 20 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: VIDEO_MAX },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "video/mp4", "video/webm", "video/ogg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

function getMaterialType(mimetype: string): "VIDEO" | "PDF" | "DOC" {
  if (mimetype.startsWith("video/")) return "VIDEO";
  if (mimetype === "application/pdf") return "PDF";
  return "DOC";
}

async function assertChapterCourseOwner(
  req: import("express").Request,
  chapterId: string,
  res: import("express").Response,
  uploadedFilePath?: string
): Promise<boolean> {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
    res.status(404).json({ error: "Chapitre non trouvé" });
    return false;
  }
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, chapter.moduleId));
  if (!mod) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
    res.status(404).json({ error: "Module non trouvé" });
    return false;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
    res.status(401).json({ error: "Non authentifié" });
    return false;
  }
  if (["ADMIN", "DIRECTOR"].includes(callerUser.role)) return true;
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, mod.courseId));
  if (!teacher || !course || course.teacherId !== teacher.id) {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
    res.status(403).json({ error: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    return false;
  }
  return true;
}

router.get("/chapters/:chapterId/materials", async (req, res): Promise<void> => {
  const { chapterId } = req.params;
  const materials = await db
    .select()
    .from(courseMaterialsTable)
    .where(eq(courseMaterialsTable.chapterId, chapterId));
  res.json(materials);
});

router.post("/chapters/:chapterId/materials", requireTeacher, (req, res): void => {
  const { chapterId } = req.params;

  upload.single("file")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Erreur d'upload" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Aucun fichier fourni" });
      return;
    }

    const matType = getMaterialType(req.file.mimetype);
    if ((matType === "PDF" || matType === "DOC") && req.file.size > DOC_MAX) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "Fichier PDF/DOC trop volumineux (max 20 MB)" });
      return;
    }

    const authorized = await assertChapterCourseOwner(req, chapterId, res, req.file.path);
    if (!authorized) return;

    const url = `/api/uploads/${req.file.filename}`;
    const [material] = await db
      .insert(courseMaterialsTable)
      .values({
        id: nanoid(),
        chapterId,
        type: matType,
        url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      })
      .returning();

    logger.info({ chapterId, type: matType, fileName: req.file.originalname }, "✅ [MATERIALS] Fichier uploadé");
    res.status(201).json(material);
  });
});

router.delete("/materials/:id", requireTeacher, async (req, res): Promise<void> => {
  const { id } = req.params;
  const [material] = await db
    .select()
    .from(courseMaterialsTable)
    .where(eq(courseMaterialsTable.id, id));

  if (!material) {
    res.status(404).json({ error: "Support introuvable" });
    return;
  }

  const authorized = await assertChapterCourseOwner(req, material.chapterId, res);
  if (!authorized) return;

  const filename = material.url.split("/").pop();
  if (filename) {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  await db.delete(courseMaterialsTable).where(eq(courseMaterialsTable.id, id));
  logger.info({ id, fileName: material.fileName }, "🗑️ [MATERIALS] Support supprimé");
  res.sendStatus(204);
});

export default router;
