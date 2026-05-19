import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { createAvatarConfigFromImage } from "../services/geminiAvatar.service.js";
import type { StyleSexHint } from "../services/geminiAvatar.service.js";
import { renderAvatarDebugRun } from "../services/avatarRender.service.js";
import { avatarConfigSchema, type AvatarConfig } from "../schemas/avatarConfig.schema.js";
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
      const providedConfig = getAvatarConfigFromRequest(request);
      const photo = getOptionalPhoto(request);
      const config = providedConfig ?? (await createAvatarConfigFromImageFromRequest(request));
      const artifacts = await renderAvatarDebugRun({
        imageBuffer: photo?.buffer ?? Buffer.from(`${JSON.stringify(config, null, 2)}\n`),
        originalExtension: photo ? extensionForMimeType(photo.mimetype) : ".json",
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

function getOptionalPhoto(request: Request): Express.Multer.File | undefined {
  return request.file;
}

function getAvatarConfigFromRequest(request: Request): AvatarConfig | undefined {
  const rawConfig =
    request.body?.config !== undefined
      ? request.body.config
      : request.body?.bodyShape !== undefined || request.body?.wearables !== undefined
        ? request.body
        : undefined;

  if (rawConfig === undefined || rawConfig === null || rawConfig === "") {
    return undefined;
  }

  const parsedJson = typeof rawConfig === "string" ? parseConfigJson(rawConfig) : rawConfig;
  const parsedConfig = avatarConfigSchema.safeParse(parsedJson);

  if (!parsedConfig.success) {
    throw new ApiError(
      400,
      "INVALID_AVATAR_CONFIG",
      'Expected a valid Decentraland avatar config JSON body, or a multipart field named "config".',
      parsedConfig.error
    );
  }

  return parsedConfig.data;
}

async function createAvatarConfigFromImageFromRequest(request: Request): Promise<AvatarConfig> {
  const photo = getPhoto(request);

  return createAvatarConfigFromImage({
    imageBuffer: photo.buffer,
    mimeType: photo.mimetype,
    styleSex: getStyleSexHint(request)
  });
}

function parseConfigJson(value: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new ApiError(400, "INVALID_AVATAR_CONFIG", 'Field "config" must be valid JSON.', error);
  }
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
