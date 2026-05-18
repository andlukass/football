import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import niceAvatarPackage from "react-nice-avatar";
import type { AvatarConfig } from "../schemas/avatarConfig.schema.js";
import { ApiError } from "../utils/apiError.js";

const Avatar = niceAvatarPackage.default;

export type AvatarRenderArtifacts = {
  runId: string;
  runDir: string;
  inputPath: string;
  configPath: string;
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
  const avatarPath = path.join(runDir, "avatar.png");

  try {
    await mkdir(runDir, { recursive: true });
    await writeFile(inputPath, params.imageBuffer);
    await writeFile(configPath, `${JSON.stringify(params.config, null, 2)}\n`);

    const avatarMarkup = renderToStaticMarkup(
      React.createElement(Avatar, {
        ...params.config,
        style: { width: "512px", height: "512px" }
      })
    );

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html,
      body {
        width: 512px;
        height: 512px;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }
      #avatar-root {
        width: 512px;
        height: 512px;
      }
    </style>
  </head>
  <body>
    <div id="avatar-root">${avatarMarkup}</div>
  </body>
</html>`;

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 512, height: 512 },
      deviceScaleFactor: 1
    });

    try {
      await page.setContent(html, { waitUntil: "load" });
      await page.locator("#avatar-root").screenshot({
        path: avatarPath,
        omitBackground: true
      });
    } finally {
      await browser.close();
    }

    return {
      runId,
      runDir,
      inputPath,
      configPath,
      avatarPath
    };
  } catch (error) {
    throw new ApiError(500, "AVATAR_RENDER_FAILED", "Failed to render avatar debug PNG.", error);
  }
}

function createRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
}
