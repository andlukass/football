import { GoogleGenAI } from "@google/genai";
import {
	avatarConfigSchema,
	geminiAvatarResponseSchema,
	type AvatarConfig,
} from "../schemas/avatarConfig.schema.js";
import { catalogForPrompt } from "./decentralandAssets.catalog.js";
import { ApiError } from "../utils/apiError.js";

export type StyleSexHint = "auto" | "man" | "woman";

const basePrompt = `
Create a Decentraland avatar profile configuration from visible non-sensitive appearance traits in the image.

Use only assets from decentraland/avatar-assets. Optimize for resemblance over variety. Do not choose decorative or random-looking wearables when the photo clearly shows a trait. Match the dominant visible hair color, eye color, skin tone, shirt/top, lower body, shoes, and background as closely as the available Decentraland assets allow.

Do not identify the person. Do not infer sensitive attributes. Treat bodyShape only as a Decentraland rig/fit selection, not as identity.

Selection rules:
- Do not choose BaseFemale only because the subject has long hair, braids, dreadlocks, tied hair, or a ponytail.
- If the request provides styleSex "man", use bodyShape "BaseMale"; if it provides "woman", use bodyShape "BaseFemale".
- Prefer hair ids by shape: relaxed_hair or short_hair for short/simple hair, semi_afro for afro/curly volume, rasta for dreadlocks/braids, slicked_hair for slicked-back hair, tall_front_01 for pompadour/tall-front hair.
- Use hair traits strictly. Do not choose assets described as long, shoulder-length, ponytail, pigtails, bun, or tied-back when the visible hair is short above the ears or cropped at the sides.
- For short curly or wavy hair with volume on top and short sides, prefer short_hair, relaxed_hair, tall_front_01, or semi_afro over long/shoulder-length styles.
- Use facial_hair "none" unless facial hair is clearly visible.
- Use the available upper_body, lower_body, and feet ids from the catalog. These categories may have only one valid option.
- Colors must use Decentraland RGBA floats from 0 to 1 with a = 1.
- backgroundColor must be a 6-digit HEX color from the original background when visible.

Available Decentraland asset ids:
${JSON.stringify(catalogForPrompt(), null, 2)}

Choose only values allowed by the response schema. Return only the structured JSON object required by the schema.
`;

export async function createAvatarConfigFromImage(params: {
	imageBuffer: Buffer;
	mimeType: string;
	styleSex?: StyleSexHint;
}): Promise<AvatarConfig> {
	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		throw new ApiError(
			500,
			"GEMINI_API_KEY_MISSING",
			"GEMINI_API_KEY is not configured.",
		);
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
								data: params.imageBuffer.toString("base64"),
							},
						},
					],
				},
			],
			config: {
				temperature: 0.2,
				responseMimeType: "application/json",
				responseSchema: geminiAvatarResponseSchema,
			},
		});

		if (!response.text) {
			throw new ApiError(
				502,
				"GEMINI_REQUEST_FAILED",
				"Gemini returned an empty response.",
			);
		}

		const parsedJson = JSON.parse(response.text);
		const parsedConfig = avatarConfigSchema.safeParse(parsedJson);

		if (!parsedConfig.success) {
			throw new ApiError(
				502,
				"STRUCTURED_OUTPUT_INVALID",
				"Gemini response did not match the avatar config schema.",
				parsedConfig.error,
			);
		}

		return applyStyleSexHint(parsedConfig.data, styleSex);
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}

		if (error instanceof SyntaxError) {
			throw new ApiError(
				502,
				"STRUCTURED_OUTPUT_INVALID",
				"Gemini returned invalid JSON.",
				error,
			);
		}

		throw new ApiError(
			502,
			"GEMINI_REQUEST_FAILED",
			"Gemini request failed.",
			error,
		);
	}
}

function createPrompt(styleSex: StyleSexHint) {
	if (styleSex === "man") {
		return `${basePrompt}

User-provided style override: styleSex is "man". The JSON must use bodyShape "BaseMale". Long, tied, braided, or dreadlocked hair should still be represented with the closest Decentraland hair asset.`;
	}

	if (styleSex === "woman") {
		return `${basePrompt}

User-provided style override: styleSex is "woman". The JSON must use bodyShape "BaseFemale".`;
	}

	return `${basePrompt}

No styleSex override was provided. Choose the Decentraland bodyShape from the full visual presentation, not from hair length alone.`;
}

function applyStyleSexHint(
	config: AvatarConfig,
	styleSex: StyleSexHint,
): AvatarConfig {
	if (styleSex === "man") {
		return {
			...config,
			bodyShape: "BaseMale",
		};
	}

	if (styleSex === "woman") {
		return {
			...config,
			bodyShape: "BaseFemale",
		};
	}

	return config;
}
