import { GoogleGenAI } from "@google/genai";
import {
  avatarConfigSchema,
  geminiAvatarResponseSchema,
  type AvatarConfig
} from "../schemas/avatarConfig.schema.js";
import { ApiError } from "../utils/apiError.js";

export type StyleSexHint = "auto" | "man" | "woman";

const basePrompt = `
Create a stylized react-nice-avatar configuration from visible non-sensitive appearance traits in the image.

Optimize for resemblance over variety. Do not choose decorative or random-looking colors when the photo clearly shows the trait. Match the dominant visible hair color, shirt/top color, and background color as closely as the react-nice-avatar options allow.

Do not identify the person. Do not infer sensitive attributes. Treat "sex" only as a react-nice-avatar visual style option, not as the person's identity.

Selection rules:
- Do not use "woman" or women-coded styles only because the subject has long hair, braids, dreadlocks, tied hair, or a ponytail.
- If the subject presents as an adult man or the request provides styleSex "man", use sex "man", eyeBrowStyle "up", and choose the closest masculine hair option: "thick" for full/tied/braided/dreadlocked hair, "normal" for short/simple hair, or "mohawk" only for mohawk-like hair.
- Use hairStyle "womanLong" only when the overall avatar style should be woman-coded and the hair is long or shoulder-length; use "womanShort" only for woman-coded bob/short hair.
- Use hairColorRandom false whenever hair is visible.
- Use hatStyle "none" unless a clear hat, beanie, turban, or head covering is visible.
- Use glassesStyle "none" unless glasses are clearly visible.
- Use mouthStyle "peace" for a neutral or closed mouth, "smile" only for a visible smile, and "laugh" only for an open/laughing mouth.
- Use shirtColor from the visible shirt/top. If the shirt is black or very dark, use a near-black HEX color.
- Use bgColor from the original photo background when visible. Prefer a neutral/light background if the photo background is neutral/light.
- Use isGradient false unless the photo background is clearly gradient-like.

Choose only values allowed by the response schema. Use 6-digit HEX colors. Return only the structured JSON object required by the schema.
`;

export async function createAvatarConfigFromImage(params: {
  imageBuffer: Buffer;
  mimeType: string;
  styleSex?: StyleSexHint;
}): Promise<AvatarConfig> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "GEMINI_API_KEY_MISSING", "GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });
  const styleSex = params.styleSex || "auto";
  const prompt = createPrompt(styleSex);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.imageBuffer.toString("base64")
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: geminiAvatarResponseSchema
      }
    });

    if (!response.text) {
      throw new ApiError(502, "GEMINI_REQUEST_FAILED", "Gemini returned an empty response.");
    }

    const parsedJson = JSON.parse(response.text);
    const parsedConfig = avatarConfigSchema.safeParse(parsedJson);

    if (!parsedConfig.success) {
      throw new ApiError(
        502,
        "STRUCTURED_OUTPUT_INVALID",
        "Gemini response did not match the avatar config schema.",
        parsedConfig.error
      );
    }

    return applyStyleSexHint(parsedConfig.data, styleSex);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new ApiError(502, "STRUCTURED_OUTPUT_INVALID", "Gemini returned invalid JSON.", error);
    }

    throw new ApiError(502, "GEMINI_REQUEST_FAILED", "Gemini request failed.", error);
  }
}

function createPrompt(styleSex: StyleSexHint) {
  if (styleSex === "man") {
    return `${basePrompt}

User-provided style override: styleSex is "man". The JSON must use sex "man". Do not use woman-coded eyebrow or hair styles. Long, tied, braided, or dreadlocked hair should still be represented with the closest man-compatible style, usually "thick".`;
  }

  if (styleSex === "woman") {
    return `${basePrompt}

User-provided style override: styleSex is "woman". The JSON must use sex "woman".`;
  }

  return `${basePrompt}

No styleSex override was provided. Choose the react-nice-avatar sex style from the full visual presentation, not from hair length alone.`;
}

function applyStyleSexHint(config: AvatarConfig, styleSex: StyleSexHint): AvatarConfig {
  if (styleSex === "man") {
    return {
      ...config,
      sex: "man",
      eyeBrowStyle: "up",
      hairStyle:
        config.hairStyle === "womanLong" || config.hairStyle === "womanShort"
          ? "thick"
          : config.hairStyle
    };
  }

  if (styleSex === "woman") {
    return {
      ...config,
      sex: "woman"
    };
  }

  return config;
}
