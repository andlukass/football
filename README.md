# football

API Express em TypeScript para transformar uma foto em um JSON de configuração do `react-nice-avatar` usando Gemini Structured Output.

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
    "sex": "man",
    "faceColor": "#F9C9B6",
    "earSize": "small",
    "hairColor": "#000000",
    "hairStyle": "normal",
    "hairColorRandom": false,
    "hatColor": "#000000",
    "hatStyle": "none",
    "eyeStyle": "circle",
    "eyeBrowStyle": "up",
    "glassesStyle": "none",
    "noseStyle": "short",
    "mouthStyle": "smile",
    "shirtStyle": "hoody",
    "shirtColor": "#6BD9E9",
    "bgColor": "#9287FF",
    "isGradient": false
  }
}
```

### Debug: gerar JSON e PNG

Chama Gemini, salva a foto original, salva o JSON e renderiza um PNG 512x512 com Playwright.

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

Resposta:

```json
{
  "config": {},
  "artifacts": {
    "runId": "2026-05-18T21-55-00-000Z-abc123",
    "runDir": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/...",
    "inputPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../input.jpg",
    "configPath": "/Users/lucas/Documents/MINES/football/tmp/avatar-runs/.../avatar-config.json",
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

As opções aceitas estão documentadas em [docs/react-nice-avatar-config.md](docs/react-nice-avatar-config.md).
