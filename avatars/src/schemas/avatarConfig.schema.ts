import { Type, type Schema } from "@google/genai";
import { z } from "zod";

export const sexOptions = ["man", "woman"] as const;
export const earSizeOptions = ["small", "big"] as const;
export const hairStyleOptions = ["normal", "thick", "mohawk", "womanLong", "womanShort"] as const;
export const hatStyleOptions = ["beanie", "turban", "none"] as const;
export const eyeStyleOptions = ["circle", "oval", "smile"] as const;
export const glassesStyleOptions = ["round", "square", "none"] as const;
export const noseStyleOptions = ["short", "long", "round"] as const;
export const mouthStyleOptions = ["laugh", "smile", "peace"] as const;
export const shirtStyleOptions = ["hoody", "short", "polo"] as const;
export const eyeBrowStyleOptions = ["up", "upWoman"] as const;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a 6-digit HEX color such as #F9C9B6.");

export const avatarConfigSchema = z.object({
  sex: z.enum(sexOptions),
  faceColor: hexColorSchema,
  earSize: z.enum(earSizeOptions),
  hairColor: hexColorSchema,
  hairStyle: z.enum(hairStyleOptions),
  hairColorRandom: z.boolean(),
  hatColor: hexColorSchema,
  hatStyle: z.enum(hatStyleOptions),
  eyeStyle: z.enum(eyeStyleOptions),
  eyeBrowStyle: z.enum(eyeBrowStyleOptions),
  glassesStyle: z.enum(glassesStyleOptions),
  noseStyle: z.enum(noseStyleOptions),
  mouthStyle: z.enum(mouthStyleOptions),
  shirtStyle: z.enum(shirtStyleOptions),
  shirtColor: hexColorSchema,
  bgColor: hexColorSchema,
  isGradient: z.boolean()
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

const enumString = (values: readonly string[], description: string): Schema => ({
  type: Type.STRING,
  format: "enum",
  enum: [...values],
  description
});

const hexColor = (description: string): Schema => ({
  type: Type.STRING,
  pattern: "^#[0-9A-Fa-f]{6}$",
  description
});

export const avatarConfigPropertyOrder = [
  "sex",
  "faceColor",
  "earSize",
  "hairColor",
  "hairStyle",
  "hairColorRandom",
  "hatColor",
  "hatStyle",
  "eyeStyle",
  "eyeBrowStyle",
  "glassesStyle",
  "noseStyle",
  "mouthStyle",
  "shirtStyle",
  "shirtColor",
  "bgColor",
  "isGradient"
] as const satisfies readonly (keyof AvatarConfig)[];

export const geminiAvatarResponseSchema: Schema = {
  type: Type.OBJECT,
  required: [...avatarConfigPropertyOrder],
  propertyOrdering: [...avatarConfigPropertyOrder],
  properties: {
    sex: enumString(sexOptions, "Avatar style sex option. Treat as a visual style choice, not identity."),
    faceColor: hexColor("Approximate visible skin tone as a 6-digit HEX color."),
    earSize: enumString(earSizeOptions, "Ear size style."),
    hairColor: hexColor("Dominant visible hair color as a 6-digit HEX color. Preserve brown, black, blonde, or dyed tones from the image."),
    hairStyle: enumString(
      hairStyleOptions,
      "Closest available hair shape. Use womanLong for long or shoulder-length hair, womanShort for bob/short hair, normal for short simple hair, thick for fuller short hair, mohawk only for mohawk-like hair."
    ),
    hairColorRandom: {
      type: Type.BOOLEAN,
      description: "Use false whenever hair is visible. Use true only when there is no usable hair color signal."
    },
    hatColor: hexColor("Approximate hat color if present; otherwise choose a neutral HEX color."),
    hatStyle: enumString(hatStyleOptions, "Closest visible hat/headwear option, or none."),
    eyeStyle: enumString(
      eyeStyleOptions,
      "Closest eye expression style. Use oval for elongated/relaxed open eyes, circle for round open eyes, smile for closed smiling eyes."
    ),
    eyeBrowStyle: enumString(
      eyeBrowStyleOptions,
      "Closest eyebrow style. Use upWoman for more arched/feminine brows, up for simpler brows."
    ),
    glassesStyle: enumString(glassesStyleOptions, "Closest glasses option, or none."),
    noseStyle: enumString(noseStyleOptions, "Closest nose shape style."),
    mouthStyle: enumString(
      mouthStyleOptions,
      "Closest mouth expression style. Use peace for neutral/closed mouth, smile for visible smile, laugh for open/laughing mouth."
    ),
    shirtStyle: enumString(
      shirtStyleOptions,
      "Closest shirt/top style. Use short for a plain t-shirt/top, polo for a collar, hoody for hoodie/sweatshirt."
    ),
    shirtColor: hexColor("Dominant visible shirt/top color as a 6-digit HEX color. Preserve black or very dark clothing with a near-black HEX color."),
    bgColor: hexColor("Dominant visible photo background color as a 6-digit HEX color. Prefer neutral/light colors when the original background is neutral/light."),
    isGradient: {
      type: Type.BOOLEAN,
      description: "Use false unless the original photo background is clearly gradient-like."
    }
  }
};
