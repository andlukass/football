import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import type { AvatarConfig } from "../schemas/avatarConfig.schema.js";
import {
  assetFileUrl,
  assetJsonUrl,
  decentralandAssetPathPrefix,
  findAsset,
  modelForBodyShape,
  toWearableUrn,
  type AssetCategory
} from "./decentralandAssets.catalog.js";
import { ApiError } from "../utils/apiError.js";

const localRendererOrigin = "https://avatar-renderer.local";
const decentralandLocalAssetRoot = path.resolve("src/assets");
const threeModulePath = path.resolve("node_modules/three/build/three.module.js");
const gltfLoaderModulePath = path.resolve("node_modules/three/examples/jsm/loaders/GLTFLoader.js");
const avatarRenderWidth = 384;
const avatarRenderHeight = 512;

export type AvatarRenderArtifacts = {
  runId: string;
  runDir: string;
  inputPath: string;
  configPath: string;
  profilePath: string;
  previewPath: string;
  avatarPath: string;
};

export async function renderAvatarDebugRun(params: {
  imageBuffer: Buffer;
  originalExtension: string;
  config: AvatarConfig;
}): Promise<AvatarRenderArtifacts> {
  const runId = createRunId();
  const runDir = path.resolve("tmp", "avatar-runs", runId);
  const inputPath = path.join(runDir, `input${params.originalExtension}`);
  const configPath = path.join(runDir, "avatar-config.json");
  const profilePath = path.join(runDir, "decentraland-profile.json");
  const avatarPath = path.join(runDir, "avatar.png");
  const previewPath = path.join(runDir, "avatar-preview.html");

  try {
    await mkdir(runDir, { recursive: true });
    await writeFile(inputPath, params.imageBuffer);
    await writeFile(configPath, `${JSON.stringify(params.config, null, 2)}\n`);
    await writeFile(profilePath, `${JSON.stringify(toDecentralandProfile(params.config), null, 2)}\n`);

    const html = createAvatarRendererHtml(params.config);
    await writeFile(previewPath, html);

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: avatarRenderWidth, height: avatarRenderHeight },
      deviceScaleFactor: 1
    });
    const browserLogs: string[] = [];
    page.on("console", (message) => browserLogs.push(`${message.type()}: ${message.text()}`));
    page.on("pageerror", (error) => browserLogs.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) =>
      browserLogs.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`)
    );
    await page.route(`${localRendererOrigin}/**`, async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      if (pathname === "/preview.html") {
        await route.fulfill({ body: html, contentType: "text/html" });
        return;
      }

      if (pathname === "/three.module.js") {
        await route.fulfill({ body: await readFile(threeModulePath, "utf8"), contentType: "text/javascript" });
        return;
      }

      if (pathname.startsWith("/three.") && pathname.endsWith(".js")) {
        const threeBuildPath = path.resolve("node_modules/three/build", pathname.slice(1));
        await route.fulfill({ body: await readFile(threeBuildPath, "utf8"), contentType: "text/javascript" });
        return;
      }

      if (pathname === "/GLTFLoader.js") {
        await route.fulfill({ body: await readFile(gltfLoaderModulePath, "utf8"), contentType: "text/javascript" });
        return;
      }

      if (pathname.startsWith("/utils/")) {
        const utilityPath = path.resolve("node_modules/three/examples/jsm", pathname.slice(1));
        await route.fulfill({ body: await readFile(utilityPath, "utf8"), contentType: "text/javascript" });
        return;
      }

      if (pathname.startsWith(`${decentralandAssetPathPrefix}/`)) {
        const assetRelativePath = pathname.slice(`${decentralandAssetPathPrefix}/`.length);
        const assetPath = path.resolve(decentralandLocalAssetRoot, assetRelativePath);

        if (!assetPath.startsWith(`${decentralandLocalAssetRoot}${path.sep}`)) {
          await route.abort();
          return;
        }

        await route.fulfill({
          body: await readFile(assetPath),
          contentType: contentTypeForAssetPath(assetPath)
        });
        return;
      }

      await route.abort();
    });

    try {
      await page.goto(`${localRendererOrigin}/preview.html`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction("window.__avatarReady === true", undefined, { timeout: 45000 });
      const avatarError = await page.evaluate("window.__avatarError || null");
      if (avatarError) {
        throw new Error(String(avatarError));
      }
      await page.locator("#avatar-canvas").screenshot({
        path: avatarPath,
        omitBackground: true
      });
    } catch (error) {
      throw new ApiError(500, "AVATAR_RENDER_FAILED", "Failed to render avatar debug PNG.", {
        error,
        browserLogs
      });
    } finally {
      await browser.close();
    }

    return {
      runId,
      runDir,
      inputPath,
      configPath,
      profilePath,
      previewPath,
      avatarPath
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "AVATAR_RENDER_FAILED", "Failed to render avatar debug PNG.", error);
  }
}

function createAvatarRendererHtml(config: AvatarConfig) {
  const sceneConfig = JSON.stringify(createSceneConfig(config));
  const importMap = JSON.stringify({
    imports: {
      three: `${localRendererOrigin}/three.module.js`
    }
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: ${avatarRenderWidth}px;
        height: ${avatarRenderHeight}px;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }

      #avatar-root {
        width: ${avatarRenderWidth}px;
        height: ${avatarRenderHeight}px;
        background: radial-gradient(circle at 50% 35%, rgba(255,255,255,0.96), rgba(255,255,255,0.18) 68%),
          ${escapeHtml(config.backgroundColor)};
      }

      #avatar-canvas {
        display: block;
        width: ${avatarRenderWidth}px;
        height: ${avatarRenderHeight}px;
      }
    </style>
  </head>
  <body>
    <div id="avatar-root">
      <canvas id="avatar-canvas" width="${avatarRenderWidth}" height="${avatarRenderHeight}"></canvas>
    </div>
    <script type="importmap">${escapeScript(importMap)}</script>
    <script type="module">
      import * as THREE from "three";
      import { GLTFLoader } from "${localRendererOrigin}/GLTFLoader.js";

      const config = ${sceneConfig};
      const canvas = document.getElementById("avatar-canvas");
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(${avatarRenderWidth}, ${avatarRenderHeight}, false);
      renderer.setPixelRatio(1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = null;

      const camera = new THREE.PerspectiveCamera(30, ${avatarRenderWidth / avatarRenderHeight}, 0.1, 100);
      camera.position.set(0, 1.55, 4.2);
      camera.lookAt(0, 1.45, 0);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8c8c, 1.6));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
      keyLight.position.set(2.5, 4, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
      fillLight.position.set(-3, 2, 4);
      scene.add(fillLight);

      const avatar = new THREE.Group();
      scene.add(avatar);

      const loader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();

      try {
        const body = await loadGltf(config.body.modelUrl);
        applyDefaultHiding(body.scene, config);
        tintSkinMeshes(body.scene, config.colors.skin);
        tintEyebrowMeshes(body.scene, config.colors.hair);
        tintMouthMeshes(body.scene, config.colors.mouth);
        prioritizeMouthMeshes(body.scene);
        avatar.add(body.scene);

        for (const wearable of config.wearables) {
          if (wearable.modelUrl.endsWith(".glb")) {
            const gltf = await loadGltf(wearable.modelUrl);
            tintSkinMeshes(gltf.scene, config.colors.skin);
            if (wearable.category === "hair" || wearable.category === "facial_hair") {
              tintMeshes(gltf.scene, config.colors.hair);
            }
            avatar.add(gltf.scene);
          } else if (wearable.modelUrl.endsWith(".png")) {
            await applyFaceTexture(body.scene, wearable);
          }
        }

        applyPortraitPose(avatar);
        frameAvatar(avatar, camera);
        renderer.render(scene, camera);
        window.__avatarReady = true;
      } catch (error) {
        console.error(error);
        window.__avatarError = error && error.message ? error.message : String(error);
        window.__avatarReady = true;
      }

      function loadGltf(url) {
        return new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      }

      function loadTexture(url) {
        return new Promise((resolve, reject) => {
          textureLoader.load(url, resolve, undefined, reject);
        });
      }

      async function applyFaceTexture(root, wearable) {
        const texture = await loadTexture(wearable.modelUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        const color = colorForFaceTexture(wearable.category);
        const category = wearable.category.toLowerCase();

        root.traverse((object) => {
          if (!object.isMesh || !object.material) {
            return;
          }

          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            const marker = ((material.name || "") + " " + (object.name || "")).toLowerCase();
            if (!marker.includes(category)) {
              continue;
            }

            material.map = texture;
            material.color.copy(color);
            material.transparent = true;
            material.depthTest = true;
            material.depthWrite = false;
            material.needsUpdate = true;
          }
        });
      }

      function colorForFaceTexture(category) {
        if (category === "eyes") {
          return new THREE.Color(1, 1, 1);
        }

        if (category === "eyebrows") {
          return createSrgbColor(config.colors.hair);
        }

        return createSrgbColor(config.colors.mouth);
      }

      function applyDefaultHiding(root, sceneConfig) {
        const hideUpperBody = sceneConfig.hiding.upperBody;
        const hideLowerBody = sceneConfig.hiding.lowerBody;
        const hideFeet = sceneConfig.hiding.feet;

        root.traverse((object) => {
          if (!object.isMesh) {
            return;
          }

          const name = object.name.toLowerCase();

          if (
            (hideUpperBody && name.includes("ubody_basemesh")) ||
            (hideLowerBody && name.includes("lbody_basemesh")) ||
            (hideFeet && name.includes("feet_basemesh"))
          ) {
            object.visible = false;
          }
        });
      }

      function tintSkinMeshes(root, rgba) {
        const skinColor = createSrgbColor(rgba);
        root.traverse((object) => {
          if (!object.isMesh || !object.material) {
            return;
          }

          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (!material.color || !(material.name || "").toLowerCase().includes("avatarskin")) {
              continue;
            }

            material.color.copy(skinColor);
            material.map = null;

            if (material.emissive) {
              material.emissive.copy(skinColor).multiplyScalar(0.16);
            }

            if ("roughness" in material) {
              material.roughness = 0.82;
            }

            if ("metalness" in material) {
              material.metalness = 0;
            }

            material.needsUpdate = true;
          }
        });
      }

      function tintEyebrowMeshes(root, rgba) {
        tintMeshes(root, rgba, (material, object) =>
          ((material.name || "") + " " + (object.name || "")).toLowerCase().includes("eyebrow")
        );
      }

      function tintMouthMeshes(root, rgba) {
        tintMeshes(root, rgba, (material, object) =>
          ((material.name || "") + " " + (object.name || "")).toLowerCase().includes("mouth")
        );
      }

      function prioritizeMouthMeshes(root) {
        root.traverse((object) => {
          if (
            !object.isMesh ||
            !((object.material?.name || "") + " " + (object.name || "")).toLowerCase().includes("mouth")
          ) {
            return;
          }

          object.renderOrder = 20;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            material.depthTest = false;
            material.depthWrite = false;
          }
        });
      }

      function tintMeshes(root, rgba, shouldTint = () => true) {
        const color = createSrgbColor(rgba);
        root.traverse((object) => {
          if (!object.isMesh || !object.material) {
            return;
          }
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (material.color && shouldTint(material, object)) {
              material.color.copy(color);
            }
          }
        });
      }

      function createSrgbColor(rgba) {
        const color = new THREE.Color();
        color.setRGB(rgba.r, rgba.g, rgba.b, THREE.SRGBColorSpace);
        return color;
      }

      function applyPortraitPose(root) {
        root.traverse((object) => {
          if (!object.isBone) {
            return;
          }

          const name = object.name.toLowerCase();
          const isLeft = name.includes("left") || name.includes("_l") || name.endsWith(".l");
          const isRight = name.includes("right") || name.includes("_r") || name.endsWith(".r");
          const isUpperArm =
            name.includes("upperarm") ||
            name.includes("upper_arm") ||
            name.endsWith("leftarm") ||
            name.endsWith("rightarm");

          if (isUpperArm) {
            if (isLeft || isRight) {
              object.rotation.z += 1.35;
            }
          }

          if (name.includes("forearm") || name.includes("lowerarm") || name.includes("lower_arm")) {
            if (isLeft || isRight) {
              object.rotation.z -= 0.35;
            }
          }
        });

        root.updateMatrixWorld(true);
      }

      function frameAvatar(root, activeCamera) {
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;

        const height = Math.max(size.y, 0.001);
        const scale = 4.85 / height;
        root.scale.setScalar(scale);
        root.rotation.y = 0;

        activeCamera.position.set(0, 4.25, 3.35);
        activeCamera.lookAt(0, 4.25, 0);
      }
    </script>
  </body>
</html>`;
}

function createRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
}

function toDecentralandProfile(config: AvatarConfig) {
  const wearables = Object.entries(config.wearables)
    .map(([category, id]) => toWearableUrn(category as AssetCategory, id))
    .filter((urn): urn is string => Boolean(urn));

  return {
    avatars: [
      {
        name: "",
        description: "",
        avatar: {
          bodyShape: `urn:decentraland:off-chain:base-avatars:${config.bodyShape}`,
          skin: config.skin,
          hair: config.hair,
          eyes: config.eyes,
          wearables,
          snapshots: {},
          emotes: []
        },
        hasClaimedName: false,
        tutorialStep: 1,
        version: 1
      }
    ]
  };
}

function createSceneConfig(config: AvatarConfig) {
  const bodySourcePath = `base-avatars/body_shape/${config.bodyShape}`;
  const bodyModel = `${config.bodyShape}.glb`;
  const wearables = Object.entries(config.wearables)
    .map(([category, id]) => toSceneWearable(category as AssetCategory, id, config.bodyShape))
    .filter((wearable): wearable is NonNullable<ReturnType<typeof toSceneWearable>> => Boolean(wearable));

  return {
    body: {
      modelUrl: `${decentralandAssetPathPrefix}/${bodySourcePath}/${bodyModel}`
    },
    colors: {
      skin: config.skin.color,
      hair: config.hair.color,
      eyes: config.eyes.color,
      mouth: mouthColorFromSkin(config.skin.color)
    },
    hiding: {
      upperBody: config.wearables.upper_body !== "none",
      lowerBody: config.wearables.lower_body !== "none",
      feet: config.wearables.feet !== "none"
    },
    wearables
  };
}

function mouthColorFromSkin(skinColor: AvatarConfig["skin"]["color"]) {
  return {
    r: Math.min(skinColor.r * 0.9 + 0.08, 1),
    g: Math.min(skinColor.g * 0.76 + 0.06, 1),
    b: Math.min(skinColor.b * 0.72 + 0.05, 1),
    a: 1
  };
}

function toSceneWearable(category: AssetCategory, id: string, bodyShape: AvatarConfig["bodyShape"]) {
  if (id === "none") {
    return undefined;
  }

  const assetItem = findAsset(category, id);
  const assetMetadataUrl = assetItem ? assetJsonUrl(assetItem) : undefined;
  const modelUrl = assetItem ? assetFileUrl(assetItem, bodyShape) : undefined;
  const model = assetItem ? modelForBodyShape(assetItem, bodyShape) : undefined;

  if (!assetItem || !assetMetadataUrl || !modelUrl || !model) {
    return undefined;
  }

  return {
    category,
    id,
    metadataUrl: assetMetadataUrl,
    modelUrl,
    ...scenePlacementForAsset(category)
  };
}

function scenePlacementForAsset(category: AssetCategory) {
  if (category === "eyes") {
    return { width: 0.54, height: 0.19, position: [0, 1.58, 0.34] as [number, number, number] };
  }

  if (category === "eyebrows") {
    return { width: 0.52, height: 0.16, position: [0, 1.7, 0.345] as [number, number, number] };
  }

  if (category === "mouth") {
    return { width: 0.34, height: 0.13, position: [0, 1.41, 0.35] as [number, number, number] };
  }

  return {
    width: 1,
    height: 1,
    position: [0, 0, 0] as [number, number, number]
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeScript(value: string) {
  return value.replaceAll("</script", "<\\/script");
}

function contentTypeForAssetPath(assetPath: string) {
  const extension = path.extname(assetPath).toLowerCase();

  if (extension === ".glb") {
    return "model/gltf-binary";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".json") {
    return "application/json";
  }

  return "application/octet-stream";
}
