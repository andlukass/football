# football

API Express em TypeScript para transformar uma foto em uma configuração de avatar baseada em [`decentraland/avatar-assets`](https://github.com/decentraland/avatar-assets) usando Gemini Structured Output.

## Setup

```bash
npm install
cp .env.example .env
```

Preencha `GEMINI_API_KEY` no `.env`.

```env
PORT=3000
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## Scripts

```bash
npm run dev
npm run build
npm start
```

## Endpoints

### Health

```bash
curl http://localhost:3000/health
```

### Gerar JSON do avatar

Retorna apenas o JSON de config.

```bash
curl -X POST http://localhost:3000/api/avatar \
  -F "photo=@/absolute/path/to/photo.jpg"
```

Se você já souber o estilo visual esperado, pode passar um override opcional:

```bash
curl -X POST http://localhost:3000/api/avatar \
  -F "photo=@/absolute/path/to/photo.jpg" \
  -F "styleSex=man"
```

Resposta:

```json
{
  "config": {
    "bodyShape": "BaseMale",
    "skin": { "color": { "r": 0.78, "g": 0.55, "b": 0.42, "a": 1 } },
    "hair": { "color": { "r": 0.08, "g": 0.06, "b": 0.04, "a": 1 } },
    "eyes": { "color": { "r": 0.12, "g": 0.1, "b": 0.08, "a": 1 } },
    "wearables": {
      "hair": "relaxed_hair",
      "eyes": "eyes_00",
      "eyebrows": "eyebrows_00",
      "mouth": "mouth_03",
      "upper_body": "simple_blue_tshirt",
      "lower_body": "soccer_pants",
      "feet": "sneakers",
      "facial_hair": "none"
    },
    "backgroundColor": "#E5E7EB"
  }
}
```

### Debug: gerar JSON e PNG

Chama Gemini, salva a foto original, salva o JSON, salva um `decentraland-profile.json` com URNs `urn:decentraland:off-chain:base-avatars:*` e renderiza um PNG 3x4 de debug com Playwright.

```bash
curl -X POST http://localhost:3000/api/avatar/render \
  -F "photo=@/absolute/path/to/photo.jpg"
```

Com override:

```bash
curl -X POST http://localhost:3000/api/avatar/render \
  -F "photo=@/absolute/path/to/photo.jpg" \
  -F "styleSex=man"
```

Também pode receber a configuração Decentraland pronta como JSON e pular Gemini:

```bash
curl -X POST http://localhost:3000/api/avatar/render \
  -H "Content-Type: application/json" \
  -d '{"bodyShape":"BaseMale","skin":{"color":{"r":0.58,"g":0.38,"b":0.25,"a":1}},"hair":{"color":{"r":0.15,"g":0.12,"b":0.1,"a":1}},"eyes":{"color":{"r":0.18,"g":0.1,"b":0.05,"a":1}},"wearables":{"hair":"semi_afro","eyes":"eyes_00","eyebrows":"eyebrows_00","mouth":"mouth_00","upper_body":"simple_blue_tshirt","lower_body":"soccer_pants","feet":"sneakers","facial_hair":"beard"},"backgroundColor":"#BEAA82"}'
```

Resposta:

```json
{
  "config": {},
  "artifacts": {
    "runId": "2026-05-18T21-55-00-000Z-abc123",
    "runDir": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/...",
    "inputPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../input.jpg",
    "configPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../avatar-config.json",
    "profilePath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../decentraland-profile.json",
    "previewPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../avatar-preview.html",
    "avatarPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../avatar.png"
  }
}
```

## Uploads

O campo `photo` aceita `image/jpeg`, `image/png` e `image/webp` até 50 MB.

Erros usam o formato:

```json
{
  "error": {
    "code": "INVALID_UPLOAD",
    "message": "Expected multipart field \"photo\" with a JPEG, PNG, or WebP image up to 50 MB."
  }
}
```

## Config

A configuração usa apenas assets de `decentraland/avatar-assets`. O catálogo curado fica em `avatars/src/services/decentralandAssets.catalog.ts`; para cada wearable selecionado, a API gera o URN Decentraland correspondente no arquivo de perfil salvo pelo endpoint `/render`.
