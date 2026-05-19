export const decentralandRepository = "https://github.com/decentraland/avatar-assets";
export const decentralandAssetPathPrefix = "/assets";
export const decentralandUrnPrefix = "urn:decentraland:off-chain:base-avatars:";

export type BodyShape = "BaseMale" | "BaseFemale";
export type AssetCategory =
  | "hair"
  | "eyes"
  | "eyebrows"
  | "mouth"
  | "upper_body"
  | "lower_body"
  | "feet"
  | "facial_hair";

export type DecentralandAsset = {
  id: string;
  urn: string;
  category: AssetCategory;
  label: string;
  sourcePath: string;
  models: Partial<Record<BodyShape, string>>;
  optional?: boolean;
};

const asset = (
  category: AssetCategory,
  id: string,
  label: string,
  sourcePath: string,
  models: Partial<Record<BodyShape, string>>,
  optional = false
): DecentralandAsset => ({
  id,
  urn: `${decentralandUrnPrefix}${id}`,
  category,
  label,
  sourcePath,
  models,
  optional
});

export const bodyShapeOptions = ["BaseMale", "BaseFemale"] as const;

export const decentralandAssets = {
  hair: [
    asset("hair", "moptop", "Moptop", "base-avatars/hair/M_Hair_Beatle_01", {"BaseMale":"Hair_Beatle.glb","BaseFemale":"Hair_Beatle.glb"}),
    asset("hair", "curtained_hair", "Curtained hair", "base-avatars/hair/M_Hair_BookStyle", {"BaseMale":"Hair_BookStyle.glb","BaseFemale":"Hair_BookStyle.glb"}),
    asset("hair", "cool_hair", "Cool Hair", "base-avatars/hair/M_Hair_Cool_01", {"BaseMale":"Hair_Cool.glb","BaseFemale":"Hair_Cool.glb"}),
    asset("hair", "keanu_hair", "Keanu Hair Style", "base-avatars/hair/M_Hair_Keanu", {"BaseMale":"Hair_Keanu.glb","BaseFemale":"Hair_Keanu.glb"}),
    asset("hair", "slicked_hair", "Slicked hairstyle", "base-avatars/hair/M_Hair_Lamas", {"BaseMale":"Hair_Lamas.glb","BaseFemale":"Hair_Lamas.glb"}),
    asset("hair", "hair_oldie", "Oldie", "base-avatars/hair/M_Hair_Oldie_01", {"BaseMale":"Hair_Oldie_01.glb","BaseFemale":"Hair_Oldie_01.glb"}),
    asset("hair", "punk", "Punk Mohawk", "base-avatars/hair/M_Hair_Punk_01", {"BaseMale":"Mohawk.glb","BaseFemale":"Mohawk.glb"}),
    asset("hair", "rasta", "Dreads", "base-avatars/hair/M_Hair_Rasta_01", {"BaseMale":"Hair_Rasta_01.glb","BaseFemale":"Hair_Rasta_01.glb"}),
    asset("hair", "semi_afro", "Small Afro", "base-avatars/hair/M_Hair_SemiAfro_01", {"BaseMale":"Hair_SemiAfro_01.glb","BaseFemale":"Hair_SemiAfro_01.glb"}),
    asset("hair", "semi_bold", "Bald On Top", "base-avatars/hair/M_Hair_SemiBald_01", {"BaseMale":"Hair_SemiBald_01.glb","BaseFemale":"Hair_SemiBald_01.glb"}),
    asset("hair", "short_hair", "Short Hair", "base-avatars/hair/M_Hair_ShortHair_01", {"BaseMale":"Hair_ShortHair_01.glb","BaseFemale":"Hair_ShortHair_01.glb"}),
    asset("hair", "relaxed_hair", "Layered textured medium-length with defined angled strands swept back", "base-avatars/hair/M_Hair_Standard_00", {"BaseMale":"Hair_relaxed_hair.glb","BaseFemale":"Hair_relaxed_hair.glb"}),
    asset("hair", "casual_hair_01", "Medium-length textured top with sharp defined fringe and clean tapered sides", "base-avatars/hair/M_Hair_Standard_01", {"BaseMale":"M_Hair_Standard_01.glb"}),
    asset("hair", "casual_hair_02", "Short thick wavy hair with raised front", "base-avatars/hair/M_Hair_Standard_02", {"BaseMale":"Hair_Standard_02.glb","BaseFemale":"Hair_Standard_02.glb"}),
    asset("hair", "tall_front_01", "Pompadour hair", "base-avatars/hair/M_Hair_TallFront_01", {"BaseMale":"Hair_TallFront.glb","BaseFemale":"Hair_TallFront.glb"})
  ],
  eyes: [
    asset("eyes", "eyes_00", "Eyes_00", "base-avatars/eyes/M_Eyes_00", {"BaseMale":"M_Eyes_00.png","BaseFemale":"M_Eyes_00.png"})
  ],
  eyebrows: [
    asset("eyebrows", "eyebrows_8", "Eyebrows_8", "base-avatars/eyebrows/Eyebrows_08", {"BaseFemale":"Eyebrows_08.png","BaseMale":"Eyebrows_08.png"}),
    asset("eyebrows", "eyebrows_09", "Eyebrows_09", "base-avatars/eyebrows/Eyebrows_09", {"BaseFemale":"Eyebrows_09.png","BaseMale":"Eyebrows_09.png"}),
    asset("eyebrows", "eyebrows_10", "Eyebrows_10", "base-avatars/eyebrows/Eyebrows_10", {"BaseFemale":"Eyebrows_10.png","BaseMale":"Eyebrows_10.png"}),
    asset("eyebrows", "eyebrows_13", "Eyebrows_13", "base-avatars/eyebrows/Eyebrows_13", {"BaseFemale":"Eyebrows_13.png","BaseMale":"Eyebrows_13.png"}),
    asset("eyebrows", "eyebrows_14", "Eyebrows_14", "base-avatars/eyebrows/Eyebrows_14", {"BaseFemale":"Eyebrows_14.png","BaseMale":"Eyebrows_14.png"}),
    asset("eyebrows", "eyebrows_17", "Eyebrows_17", "base-avatars/eyebrows/Eyebrows_17", {"BaseFemale":"Eyebrows_17.png","BaseMale":"Eyebrows_17.png"}),
    asset("eyebrows", "eyebrows_00", "EyeBrows_00", "base-avatars/eyebrows/M_Eyebrows_00", {"BaseMale":"M_EyeBrows_00.png","BaseFemale":"M_EyeBrows_00.png"}),
    asset("eyebrows", "eyebrows_01", "EyeBrows_01", "base-avatars/eyebrows/M_Eyebrows_01", {"BaseMale":"M_EyeBrows_01.png","BaseFemale":"M_EyeBrows_01.png"}),
    asset("eyebrows", "eyebrows_02", "EyeBrows_02", "base-avatars/eyebrows/M_Eyebrows_02", {"BaseMale":"M_EyeBrows_02.png","BaseFemale":"M_EyeBrows_02.png"})
  ],
  mouth: [
    asset("mouth", "mouth_00", "Mouth_00", "base-avatars/mouth/M_Mouth_00", {"BaseMale":"M_Mouth_00.png","BaseFemale":"M_Mouth_00.png"}),
    asset("mouth", "mouth_01", "Mouth_01", "base-avatars/mouth/M_Mouth_01", {"BaseMale":"M_Mouth_01.png","BaseFemale":"M_Mouth_01.png"}),
    asset("mouth", "mouth_02", "Mouth_02", "base-avatars/mouth/M_Mouth_02", {"BaseMale":"M_Mouth_02.png","BaseFemale":"M_Mouth_02.png"}),
    asset("mouth", "mouth_03", "Mouth_03", "base-avatars/mouth/M_Mouth_03", {"BaseMale":"M_Mouth_03.png","BaseFemale":"M_Mouth_03.png"}),
    asset("mouth", "mouth_05", "Mouth_05", "base-avatars/mouth/M_Mouth_05", {"BaseMale":"M_Mouth_05.png","BaseFemale":"M_Mouth_05.png"}),
    asset("mouth", "mouth_06", "Mouth_06", "base-avatars/mouth/M_Mouth_06", {"BaseMale":"M_Mouth_06.png","BaseFemale":"M_Mouth_06.png"}),
    asset("mouth", "mouth_07", "Mouth_07", "base-avatars/mouth/M_Mouth_07", {"BaseMale":"M_Mouth_07.png","BaseFemale":"M_Mouth_07.png"})
  ],
  upper_body: [
    asset("upper_body", "simple_blue_tshirt", "Simple Blue T-shirt", "base-avatars/upper_body/M_uBody_BlueBasicTShirt", {"BaseMale":"M_uBody_BlueBasicTShirt.glb"})
  ],
  lower_body: [
    asset("lower_body", "soccer_pants", "Soccer Pants", "base-avatars/lower_body/M_lBody_SoccerPants", {"BaseMale":"M_lBody_SoccerPants.glb"})
  ],
  feet: [
    asset("feet", "sneakers", "Sneakers", "base-avatars/feet/Sneakers_01", {"BaseMale":"Sneakers_01.glb","BaseFemale":"Sneakers_01.glb"})
  ],
  facial_hair: [
    asset("facial_hair", "none", "No facial hair", "", {}, true),
    asset("facial_hair", "balbo_beard", "Balbo", "base-avatars/facial_hair/BalbooBeard", {"BaseMale":"M_FacialHair_BalboBeard.glb"}),
    asset("facial_hair", "lincoln_beard", "Lincoln", "base-avatars/facial_hair/BeardGoatee", {"BaseMale":"M_FacialHair_BeardGoatee.glb"}),
    asset("facial_hair", "beard", "Beard", "base-avatars/facial_hair/Beard_01", {"BaseMale":"M_Beard.glb"}),
    asset("facial_hair", "chin_beard", "Soul Patch", "base-avatars/facial_hair/ChinBeard", {"BaseMale":"M_FacialHair_ChinBeard.glb"}),
    asset("facial_hair", "french_beard", "French Moustache", "base-avatars/facial_hair/FrenchMustache", {"BaseMale":"M_FacialHair_FrenchMoustache.glb"}),
    asset("facial_hair", "full_beard", "Full Beard", "base-avatars/facial_hair/FullBeard", {"BaseMale":"M_FacialHair_FullBeard.glb"}),
    asset("facial_hair", "goatee_beard", "Goatee", "base-avatars/facial_hair/Goatee", {"BaseMale":"M_FacialHair_Goatee.glb"}),
    asset("facial_hair", "granpa_beard", "Walrus", "base-avatars/facial_hair/GrandPaMustache", {"BaseMale":"M_FacialHair_GrandPaMoustache.glb"}),
    asset("facial_hair", "horseshoe_beard", "Horseshoe", "base-avatars/facial_hair/LongMustache", {"BaseMale":"M_FacialHair_LongMoustache.glb"}),
    asset("facial_hair", "handlebar", "Handlebar", "base-avatars/facial_hair/Moustache_01", {"BaseMale":"M_Moustache.glb"}),
    asset("facial_hair", "Mustache_Short_Beard", "Anchor Beard", "base-avatars/facial_hair/MustacheShortBeard", {"BaseMale":"M_FacialHair_MoustacheShortBeard.glb"}),
    asset("facial_hair", "short_boxed_beard", "Short Boxed", "base-avatars/facial_hair/MustacheSmallBeard", {"BaseMale":"M_FacialHair_MoustacheSmallBeard.glb"}),
    asset("facial_hair", "old_mustache_beard", "Chevron", "base-avatars/facial_hair/OldMustache", {"BaseMale":"M_FacialHair_OldMoustache.glb"})
  ]
} as const satisfies Record<AssetCategory, readonly DecentralandAsset[]>;

export const wearableCategories = Object.keys(decentralandAssets) as AssetCategory[];

export function assetsForCategory(category: AssetCategory): readonly DecentralandAsset[] {
  return decentralandAssets[category];
}

export function assetIdsForCategory(category: AssetCategory): readonly string[] {
  return assetsForCategory(category).map((item) => item.id);
}

export function findAsset(category: AssetCategory, id: string): DecentralandAsset | undefined {
  return assetsForCategory(category).find((item) => item.id === id);
}

export function toWearableUrn(category: AssetCategory, id: string): string | undefined {
  if (id === "none") {
    return undefined;
  }

  return findAsset(category, id)?.urn;
}

export function thumbnailUrl(assetItem: DecentralandAsset): string | undefined {
  if (!assetItem.sourcePath) {
    return undefined;
  }

  return `${decentralandAssetPathPrefix}/${assetItem.sourcePath}/thumbnail.png`;
}

export function assetJsonUrl(assetItem: DecentralandAsset): string | undefined {
  if (!assetItem.sourcePath) {
    return undefined;
  }

  return `${decentralandAssetPathPrefix}/${assetItem.sourcePath}/asset.json`;
}

export function modelForBodyShape(assetItem: DecentralandAsset, bodyShape: BodyShape): string | undefined {
  return assetItem.models[bodyShape] || assetItem.models.BaseMale || assetItem.models.BaseFemale;
}

export function assetFileUrl(assetItem: DecentralandAsset, bodyShape: BodyShape): string | undefined {
  const model = modelForBodyShape(assetItem, bodyShape);

  if (!assetItem.sourcePath || !model) {
    return undefined;
  }

  return `${decentralandAssetPathPrefix}/${assetItem.sourcePath}/${model}`;
}

export function catalogForPrompt() {
  return Object.fromEntries(
    wearableCategories.map((category) => [
      category,
      assetsForCategory(category).map((item) => ({
        id: item.id,
        label: item.label
      }))
    ])
  );
}
