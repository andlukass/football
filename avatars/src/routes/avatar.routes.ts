import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { createAvatarConfigFromImage } from "../services/geminiAvatar.service.js";
import type { StyleSexHint } from "../services/geminiAvatar.service.js";
import { renderAvatarDebugRun } from "../services/avatarRender.service.js";
import { ApiError } from "../utils/apiError.js";

const maxUploadSizeBytes = 50 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadSizeBytes,
    files: 1
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new ApiError(
          400,
          "INVALID_UPLOAD",
          'Expected multipart field "photo" with a JPEG, PNG, or WebP image up to 50 MB.'
        )
      );
      return;
    }

    callback(null, true);
  }
});

export const avatarRouter = Router();

avatarRouter.post(
  "/",
  upload.single("photo"),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const photo = getPhoto(request);
      const config = await createAvatarConfigFromImage({
        imageBuffer: photo.buffer,
        mimeType: photo.mimetype,
        styleSex: getStyleSexHint(request)
      });

      response.json({ config });
    } catch (error) {
      next(normalizeUploadError(error));
    }
  }
);

avatarRouter.post(
  "/render",
  upload.single("photo"),
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const photo = getPhoto(request);
      const config = await createAvatarConfigFromImage({
        imageBuffer: photo.buffer,
        mimeType: photo.mimetype,
        styleSex: getStyleSexHint(request)
      });
      const artifacts = await renderAvatarDebugRun({
        imageBuffer: photo.buffer,
        originalExtension: extensionForMimeType(photo.mimetype),
        config
      });

      response.json({ config, artifacts });
    } catch (error) {
      next(normalizeUploadError(error));
    }
  }
);

function getPhoto(request: Request): Express.Multer.File {
  if (!request.file) {
    throw new ApiError(
      400,
      "INVALID_UPLOAD",
      'Expected multipart field "photo" with a JPEG, PNG, or WebP image up to 50 MB.'
    );
  }

  return request.file;
}

function getStyleSexHint(request: Request): StyleSexHint {
  const value = request.body?.styleSex;

  if (value === undefined || value === "" || value === "auto") {
    return "auto";
  }

  if (value === "man" || value === "woman") {
    return value;
  }

  throw new ApiError(400, "INVALID_UPLOAD", 'Optional field "styleSex" must be "auto", "man", or "woman".');
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

function normalizeUploadError(error: unknown) {
  if (error instanceof multer.MulterError) {
    return new ApiError(
      400,
      "INVALID_UPLOAD",
      'Expected multipart field "photo" with a JPEG, PNG, or WebP image up to 50 MB.',
      error
    );
  }

  return error;
}
