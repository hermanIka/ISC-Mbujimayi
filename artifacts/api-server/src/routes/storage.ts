import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAuth } from "../middlewares/auth";

const ALLOWED_CONTENT_TYPES = [
  "video/mp4", "video/webm", "video/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const DOC_MAX_BYTES = 20 * 1024 * 1024;

const RequestUploadUrlBody = z.object({
  name: z.string(),
  size: z.number(),
  contentType: z.string(),
});

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Champs requis : name, size, contentType" });
    return;
  }
  const { name, size, contentType } = parsed.data;

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    res.status(400).json({ error: `Type de fichier non autorisé : ${contentType}. Types acceptés : vidéo MP4/WebM/Ogg, PDF, DOC/DOCX.` });
    return;
  }
  const maxBytes = contentType.startsWith("video/") ? VIDEO_MAX_BYTES : DOC_MAX_BYTES;
  if (size > maxBytes) {
    const maxMB = maxBytes / (1024 * 1024);
    res.status(400).json({ error: `Fichier trop volumineux. Maximum : ${maxMB} Mo pour ce type.` });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (error) {
    req.log.error({ err: error }, "Erreur génération URL upload");
    res.status(500).json({ error: "Impossible de générer l'URL d'upload" });
  }
});

router.get("/storage/chapter-content", requireAuth, async (req: Request, res: Response) => {
  const rawPath = req.query.path;
  if (typeof rawPath !== "string" || !rawPath.startsWith("/objects/")) {
    res.status(400).json({ error: "Paramètre 'path' invalide ou manquant" });
    return;
  }
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(rawPath);
    const response = await objectStorageService.downloadObject(objectFile, 0);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
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
      req.log.error({ err }, "Erreur service chapter-content");
      res.status(500).json({ error: "Erreur lors du téléchargement" });
    }
  }
});

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) { res.status(404).json({ error: "Fichier non trouvé" }); return; }
    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Erreur service objet public");
    res.status(500).json({ error: "Impossible de servir le fichier" });
  }
});

export default router;
