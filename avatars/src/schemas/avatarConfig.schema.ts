import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import {
  assetIdsForCategory,
  bodyShapeOptions,
  type AssetCategory
} from "../services/decentralandAssets.catalog.js";

const colorChannelSchema = z.number().min(0).max(1);
const rgbaColorSchema = z.object({
  r: colorChannelSchema,
  g: colorChannelSchema,
  b: colorChannelSchema,
  a: colorChannelSchema.default(1)
});

const enumForCategory = (category: AssetCategory) => {
  const values = assetIdsForCategory(category);
  return z.enum(values as [string, ...string[]]);
};

export const bodyShapeSchema = z.enum(bodyShapeOptions);

export const avatarConfigSchema = z.object({
  bodyShape: bodyShapeSchema,
  skin: z.object({ color: rgbaColorSchema }),
  hair: z.object({ color: rgbaColorSchema }),
  eyes: z.object({ color: rgbaColorSchema }),
  wearables: z.object({
    hair: enumForCategory("hair"),
    eyes: enumForCategory("eyes"),
    eyebrows: enumForCategory("eyebrows"),
    mouth: enumForCategory("mouth"),
    upper_body: enumForCategory("upper_body"),
    lower_body: enumForCategory("lower_body"),
    feet: enumForCategory("feet"),
    facial_hair: enumForCategory("facial_hair")
  }),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a 6-digit HEX color such as #F9C9B6.")
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

const enumString = (values: readonly string[], description: string): Schema => ({
  type: Type.STRING,
  format: "enum",
  enum: [...values],
  description
});

const rgbaColor = (description: string): Schema => ({
  type: Type.OBJECT,
  required: ["r", "g", "b", "a"],
  propertyOrdering: ["r", "g", "b", "a"],
  description,
  properties: {
    r: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    g: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    b: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    a: { type: Type.NUMBER, minimum: 0, maximum: 1 }
  }
});

const categoryEnum = (category: AssetCategory, description: string): Schema =>
  enumString(assetIdsForCategory(category), description);

const hexColor = (description: string): Schema => ({
  type: Type.STRING,
  pattern: "^#[0-9A-Fa-f]{6}$",
  description
});

export const avatarConfigPropertyOrder = [
  "bodyShape",
  "skin",
  "hair",
  "eyes",
  "wearables",
  "backgroundColor"
] as const satisfies readonly (keyof AvatarConfig)[];

export const geminiAvatarResponseSchema: Schema = {
  type: Type.OBJECT,
  required: [...avatarConfigPropertyOrder],
  propertyOrdering: [...avatarConfigPropertyOrder],
  properties: {
    bodyShape: enumString(bodyShapeOptions, "Decentraland base body shape. Use only as a visual rig selection."),
    skin: {
      type: Type.OBJECT,
      required: ["color"],
      propertyOrdering: ["color"],
      properties: {
        color: rgbaColor("Approximate visible skin tone in Decentraland RGBA float format.")
      }
    },
    hair: {
      type: Type.OBJECT,
      required: ["color"],
      propertyOrdering: ["color"],
      properties: {
        color: rgbaColor("Dominant visible hair color in Decentraland RGBA float format.")
      }
    },
    eyes: {
      type: Type.OBJECT,
      required: ["color"],
      propertyOrdering: ["color"],
      properties: {
        color: rgbaColor("Dominant visible eye color in Decentraland RGBA float format.")
      }
    },
    wearables: {
      type: Type.OBJECT,
      required: [
        "hair",
        "eyes",
        "eyebrows",
        "mouth",
        "upper_body",
        "lower_body",
        "feet",
        "facial_hair"
      ],
      propertyOrdering: [
        "hair",
        "eyes",
        "eyebrows",
        "mouth",
        "upper_body",
        "lower_body",
        "feet",
        "facial_hair"
      ],
      properties: {
        hair: categoryEnum("hair", "Closest Decentraland hair wearable id."),
        eyes: categoryEnum("eyes", "Closest Decentraland eyes wearable id."),
        eyebrows: categoryEnum("eyebrows", "Closest Decentraland eyebrows wearable id."),
        mouth: categoryEnum("mouth", "Closest Decentraland mouth wearable id."),
        upper_body: categoryEnum("upper_body", "Closest visible shirt/top wearable id."),
        lower_body: categoryEnum("lower_body", "Closest pants/lower-body wearable id."),
        feet: categoryEnum("feet", "Closest shoes/feet wearable id."),
        facial_hair: categoryEnum("facial_hair", "Facial hair wearable id, or none.")
      }
    },
    backgroundColor: hexColor("Dominant visible photo background color as a 6-digit HEX color.")
  }
};
