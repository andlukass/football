# react-nice-avatar config

Fonte da verdade: tipos publicados em `react-nice-avatar@1.5.0`, arquivo `node_modules/react-nice-avatar/dist/index.d.ts`.

O backend pede ao Gemini um objeto JSON 100% obrigatório. Props de React como `id`, `className`, `style` e `shape` não fazem parte do JSON gerado pela IA.

## Schema obrigatório

| Campo | Tipo | Valores aceitos |
| --- | --- | --- |
| `sex` | enum | `man`, `woman` |
| `faceColor` | HEX | `#RRGGBB` |
| `earSize` | enum | `small`, `big` |
| `hairColor` | HEX | `#RRGGBB` |
| `hairStyle` | enum | `normal`, `thick`, `mohawk`, `womanLong`, `womanShort` |
| `hairColorRandom` | boolean | `true`, `false` |
| `hatColor` | HEX | `#RRGGBB` |
| `hatStyle` | enum | `beanie`, `turban`, `none` |
| `eyeStyle` | enum | `circle`, `oval`, `smile` |
| `eyeBrowStyle` | enum | `up`, `upWoman` |
| `glassesStyle` | enum | `round`, `square`, `none` |
| `noseStyle` | enum | `short`, `long`, `round` |
| `mouthStyle` | enum | `laugh`, `smile`, `peace` |
| `shirtStyle` | enum | `hoody`, `short`, `polo` |
| `shirtColor` | HEX | `#RRGGBB` |
| `bgColor` | HEX | `#RRGGBB` |
| `isGradient` | boolean | `true`, `false` |

## Interpretação para a LLM

Use apenas características visuais observáveis e não sensíveis da foto. Não identifique a pessoa. Não infira atributos sensíveis. O campo `sex` deve ser tratado apenas como opção visual do pacote, não como identidade da pessoa.

Priorize semelhança, não variedade. Quando a foto mostra uma característica claramente, copie a característica para o JSON em vez de escolher uma cor ou opção decorativa.

Escolha sempre o valor disponível mais próximo:

| Campo | Como escolher |
| --- | --- |
| `sex` | Estilo visual mais próximo entre `man` e `woman`; não representa identidade real. |
| `faceColor` | Cor aproximada da pele visível em HEX. |
| `earSize` | Use `small` por padrão; `big` se o rosto/estilo pede orelhas mais destacadas. |
| `hairColor` | Cor aproximada do cabelo em HEX; use neutro escuro se não houver cabelo visível. |
| `hairStyle` | Não use `womanLong` ou `womanShort` apenas porque a pessoa tem cabelo longo, tranças, dreadlocks, cabelo preso ou rabo de cavalo. Para estilo `man`, use `thick` para cabelo volumoso/preso/trançado/dreadlocks, `normal` para curto simples e `mohawk` só para moicano. Use `womanLong` somente quando o estilo geral do avatar for `woman` e o cabelo for longo. |
| `hairColorRandom` | Use `false` sempre que houver cabelo visível; `true` só se não houver sinal útil. |
| `hatColor` | Cor do acessório de cabeça; se não houver, use uma cor neutra. |
| `hatStyle` | `beanie` ou `turban` se houver acessório parecido; caso contrário `none`. |
| `eyeStyle` | Use `oval` para olhos abertos alongados/relaxados, `circle` para olhos redondos e `smile` para olhos fechados sorrindo. |
| `eyeBrowStyle` | `up` para estilo simples; `upWoman` para sobrancelhas mais arqueadas. |
| `glassesStyle` | Tipo de óculos visível; caso contrário `none`. |
| `noseStyle` | Formato mais próximo entre curto, longo e arredondado. |
| `mouthStyle` | Use `peace` para boca neutra/fechada, `smile` só para sorriso visível e `laugh` só para boca aberta/riso. |
| `shirtStyle` | Use `short` para camiseta/top simples, `polo` para gola e `hoody` para moletom/capuz. |
| `shirtColor` | Cor predominante da roupa superior em HEX; preserve roupa preta com cor quase preta. |
| `bgColor` | Cor dominante do fundo original quando visível; preserve fundo claro/neutro quando for o caso. |
| `isGradient` | Use `false` salvo quando o fundo original parecer claramente um gradiente. |

## Limites do pacote

`react-nice-avatar` não tem opções para cabelo repartido ao meio, piercing, maquiagem, formato exato dos lábios ou cor dos olhos. Nesses casos, escolha a opção disponível mais próxima e preserve melhor os sinais que o pacote consegue representar: comprimento/cor do cabelo, roupa, fundo, óculos, acessório de cabeça e expressão geral.

Para casos em que a IA confunde o estilo `sex`, a API aceita o campo multipart opcional `styleSex=man|woman|auto`. Com `styleSex=man`, o backend força `sex: "man"`, `eyeBrowStyle: "up"` e troca `womanLong`/`womanShort` por `thick`.

## Exemplo completo

```json
{
  "sex": "man",
  "faceColor": "#F9C9B6",
  "earSize": "small",
  "hairColor": "#1F1A17",
  "hairStyle": "normal",
  "hairColorRandom": false,
  "hatColor": "#2F2F2F",
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
```
