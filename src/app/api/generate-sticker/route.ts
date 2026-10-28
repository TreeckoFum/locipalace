import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export interface GenerateStickerRequest {
  physicalObject?: string;
  targetConcept?: string;
  mnemonicHook?: string;
  anchor?: string;
  concept?: string;
  prompt?: string;
}

export interface GenerateStickerResponse {
  success: boolean;
  imageUrl: string;
  promptUsed: string;
  cooldownSeconds?: number;
  source?: 'imagen' | 'svg-fallback';
  error?: string;
}

const COLOR_PALETTES = [
  { bg1: '#1e1b4b', bg2: '#0f172a', accent1: '#22d3ee', accent2: '#818cf8' },
  { bg1: '#042f2e', bg2: '#090d16', accent1: '#34d399', accent2: '#38bdf8' },
  { bg1: '#3b0764', bg2: '#0f172a', accent1: '#f472b6', accent2: '#c084fc' },
  { bg1: '#451a03', bg2: '#0f172a', accent1: '#fbbf24', accent2: '#fb923c' },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a colorful, high-contrast die-cut vector SVG sticker as a base64 data URL
 * whenever the API key lacks Imagen access or hits quota limits.
 */
function buildVectorStickerSvgDataUrl(
  physicalObject: string,
  targetConcept: string
): string {
  const hash = (physicalObject + targetConcept)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const palette = COLOR_PALETTES[hash % COLOR_PALETTES.length];

  const objLabel = escapeXml(physicalObject.slice(0, 22).toUpperCase());
  const conceptWords = targetConcept.trim().split(/\s+/);
  const line1 = escapeXml(conceptWords.slice(0, 3).join(' ').slice(0, 22));
  const line2 = escapeXml(conceptWords.slice(3, 7).join(' ').slice(0, 24));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>
    <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.accent1}"/>
      <stop offset="100%" stop-color="${palette.accent2}"/>
    </linearGradient>
    <filter id="stickerShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
  </defs>

  <!-- Pure Dark Backdrop -->
  <rect width="512" height="512" rx="64" fill="#020617"/>

  <!-- Die-Cut White Vinyl Sticker Outer Border -->
  <g filter="url(#stickerShadow)">
    <rect x="34" y="34" width="444" height="444" rx="84" fill="#ffffff"/>
    <rect x="48" y="48" width="416" height="416" rx="72" fill="url(#bgGrad)" stroke="url(#rimGrad)" stroke-width="6"/>
  </g>

  <!-- Decorative Sparkles & Memory Nodes -->
  <circle cx="110" cy="115" r="10" fill="${palette.accent1}" opacity="0.8"/>
  <circle cx="405" cy="125" r="7" fill="${palette.accent2}" opacity="0.8"/>
  <circle cx="395" cy="390" r="9" fill="${palette.accent1}" opacity="0.6"/>

  <!-- Central Classical Arch & Anchor Emblem -->
  <polygon points="156,195 256,120 356,195" fill="none" stroke="url(#rimGrad)" stroke-width="10" stroke-linejoin="round"/>
  <line x1="144" y1="198" x2="368" y2="198" stroke="${palette.accent1}" stroke-width="8" stroke-linecap="round"/>

  <!-- Center Neon Pin Medallion -->
  <circle cx="256" cy="242" r="46" fill="#020617" stroke="url(#rimGrad)" stroke-width="7"/>
  <circle cx="256" cy="242" r="20" fill="${palette.accent1}"/>
  <circle cx="256" cy="242" r="8" fill="#ffffff"/>

  <!-- Anchor Object Ribbon Pill -->
  <rect x="76" y="314" width="360" height="44" rx="22" fill="#020617" stroke="${palette.accent2}" stroke-width="3"/>
  <text x="256" y="342" text-anchor="middle" fill="${palette.accent1}" font-family="system-ui, sans-serif" font-size="19" font-weight="900" letter-spacing="1.5">
    ${objLabel}
  </text>

  <!-- Concept Label -->
  <text x="256" y="395" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="800">
    ${line1}
  </text>
  ${
    line2
      ? `<text x="256" y="425" text-anchor="middle" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${line2}</text>`
      : ''
  }
</svg>`;

  const base64Svg = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateStickerRequest;

    const physicalObject = (
      body.physicalObject ??
      body.anchor ??
      'Objeto'
    ).trim();
    const targetConcept = (
      body.targetConcept ??
      body.concept ??
      'Concepto'
    ).trim();
    const mnemonicHook = (body.mnemonicHook ?? body.prompt ?? '').trim();

    if (!physicalObject || !targetConcept) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Both physical anchor object and target concept are required to generate a sticker.',
        },
        { status: 400 }
      );
    }

    const cleanPrompt = `Die-cut 3D cartoon vinyl sticker with thick white border, witty visual fusion of "${physicalObject}" and "${targetConcept}"${
      mnemonicHook ? ` (${mnemonicHook.slice(0, 90)})` : ''
    }, vibrant vector icon style, isolated on solid black background`;

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Attempt Gemini Imagen 3 generation if API key is configured
    if (apiKey && apiKey !== 'TU_CLAVE_AQUI') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const imagenRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: cleanPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
        });

        const base64Bytes =
          imagenRes?.generatedImages?.[0]?.image?.imageBytes;
        if (base64Bytes) {
          return NextResponse.json(
            {
              success: true,
              imageUrl: `data:image/jpeg;base64,${base64Bytes}`,
              promptUsed: cleanPrompt,
              cooldownSeconds: 10,
              source: 'imagen',
            } satisfies GenerateStickerResponse,
            { status: 200 }
          );
        }
      } catch (imagenError) {
        console.error(
          '[/api/generate-sticker] Imagen-3 generation failed or unavailable on this API key; falling back to vector SVG sticker:',
          imagenError instanceof Error ? imagenError.message : imagenError
        );
      }
    }

    // 2. Resilient Vector SVG Sticker Fallback (never hangs or fails silently)
    const fallbackSvgDataUrl = buildVectorStickerSvgDataUrl(
      physicalObject,
      targetConcept
    );

    return NextResponse.json(
      {
        success: true,
        imageUrl: fallbackSvgDataUrl,
        promptUsed: cleanPrompt,
        cooldownSeconds: 5,
        source: 'svg-fallback',
      } satisfies GenerateStickerResponse,
      { status: 200 }
    );
  } catch (err) {
    console.error('[/api/generate-sticker] Unexpected server error:', err);
    return NextResponse.json(
      {
        success: false,
        imageUrl: '',
        promptUsed: '',
        error:
          err instanceof Error
            ? err.message
            : 'No se pudo generar la imagen. Comprueba la cuota de la API.',
      },
      { status: 500 }
    );
  }
}
