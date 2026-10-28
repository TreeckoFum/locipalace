import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface GenerateHookRequest {
  conceptTitle?: string;
  anchorName?: string;
  concept?: string;
  anchor?: string;
  notes?: string;
  locale?: string;
}

export interface GenerateHookResponse {
  success: boolean;
  hook: string;
  triggerWord: string;
  stickerSvg: string;
  hookText?: string;
  modelUsed?: string;
  error?: string;
}

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];
const ATTEMPT_TIMEOUT_MS = 15_000;
const BACKOFF_503_MS = 1_500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is503OrOverloaded(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('overloaded') ||
    msg.includes('high demand')
  );
}

function is404OrNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateHookRequest>;
    const conceptTitle = (body.conceptTitle ?? body.concept ?? '').trim();
    const anchorName = (body.anchorName ?? body.anchor ?? '').trim();
    const notes = (body.notes ?? '').trim();
    const locale = (body.locale ?? 'es').trim();

    if (!conceptTitle || !anchorName) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === 'ca'
              ? "Cal indicar tant l'objecte físic (àncora) com el concepte."
              : locale === 'en'
              ? 'Both physical anchor object and concept title are required.'
              : 'Debes indicar tanto el objeto físico (ancla) como el concepto.',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === 'ca'
              ? 'Manca la clau GEMINI_API_KEY al servidor (.env.local).'
              : locale === 'en'
              ? 'Missing GEMINI_API_KEY in server environment (.env.local).'
              : 'Falta configurar GEMINI_API_KEY en el servidor (.env.local).',
        },
        { status: 500 }
      );
    }

    const targetLanguage =
      locale === 'ca' ? 'Catalan' : locale === 'en' ? 'English' : 'Spanish';

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an elite cognitive memory specialist and SVG vector illustrator.
Write "hook" and "triggerWord" strictly in ${targetLanguage}.

INPUT DATA:
- Concept Title: "${conceptTitle}"
- Physical Anchor Object: "${anchorName}"
- Detailed Study Notes: "${notes || conceptTitle}"

ANALYTICAL & MNEMONIC TASK:
1. READ & SYNTHESIZE: Analyze "Concept Title", "Physical Anchor Object", and specifically the "Detailed Study Notes". Identify the exact operational technical mechanism in the notes (e.g., if notes explain dolo vs imprudencia/culpa or imputabilidad, focus on intentional sabotage vs clumsy accident; if notes explain procedural guarantees, focus on the exact legal lock/mechanism).
2. RULE OF SPECIFICITY: Ignore generic filler words like "Principio", "Teoría", or "Artículo". Ground the hook directly in the distinctive technical/factual terms from the notes.
3. WITTY MNEMONIC HOOK ("hook"): Write a funny, punchy 1–2 sentence scene where "${anchorName}" physically interacts with that exact technical mechanism from the notes.
   - STRICT PROHIBITION: Zero neon signs, zero labels, zero screaming posters, zero generic templates.
4. TRIGGER WORD ("triggerWord"): A punchy 2–5 word humorous keyword or phonetic bridge encapsulating the scene.
5. VECTOR STICKER GENERATOR ("stickerSvg"):
   - Return a clean, modern, colorful inline SVG string (<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>...</svg>) representing the comic scene or symbolic icon of the hook.
   - Use viewBox="0 0 100 100", vibrant vector shapes, bold outlines, and rich colors ready to render on canvas as a sticker pin.

Return ONLY valid JSON: { "hook": string, "triggerWord": string, "stickerSvg": string }`;

    let lastError: Error | null = null;

    for (const modelName of CANDIDATE_MODELS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        ATTEMPT_TIMEOUT_MS
      );

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            abortSignal: controller.signal,
            responseMimeType: 'application/json',
            temperature: 0.85,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hook: {
                  type: Type.STRING,
                  description:
                    '1-2 sentence witty mnemonic scene grounded in the specific technical terms of the notes.',
                },
                triggerWord: {
                  type: Type.STRING,
                  description:
                    'Short punchy humorous keyword or phonetic bridge.',
                },
                stickerSvg: {
                  type: Type.STRING,
                  description:
                    'Complete valid inline <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">...</svg> vector illustration of the hook.',
                },
              },
              required: ['hook', 'triggerWord', 'stickerSvg'],
            },
          },
        });

        clearTimeout(timeoutId);

        const rawText = response.text;
        if (!rawText) {
          throw new Error(`Empty response from ${modelName}`);
        }

        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        const parsed = JSON.parse(cleaned) as {
          hook?: string;
          triggerWord?: string;
          stickerSvg?: string;
        };

        if (!parsed.hook || !parsed.triggerWord || !parsed.stickerSvg) {
          throw new Error(`Incomplete JSON payload from ${modelName}`);
        }

        const cleanHook = parsed.hook.trim();
        const cleanTrigger = parsed.triggerWord.trim();
        const cleanSvg = parsed.stickerSvg.trim();

        return NextResponse.json(
          {
            success: true,
            hook: cleanHook,
            triggerWord: cleanTrigger,
            stickerSvg: cleanSvg,
            hookText: cleanHook,
            modelUsed: modelName,
          } satisfies GenerateHookResponse,
          { status: 200 }
        );
      } catch (attemptErr) {
        clearTimeout(timeoutId);
        lastError =
          attemptErr instanceof Error
            ? attemptErr
            : new Error(String(attemptErr));

        console.error(
          `[/api/generate-hook] Model "${modelName}" failed:`,
          lastError.message
        );

        // If 404 Not Found, immediately jump to next candidate model
        if (is404OrNotFound(attemptErr)) {
          continue;
        }

        // If 503 Unavailable, brief pause before trying next candidate model
        if (is503OrOverloaded(attemptErr)) {
          await sleep(BACKOFF_503_MS);
        }

        continue;
      }
    }

    console.error(
      '[/api/generate-hook] All candidate models failed:',
      lastError?.message || lastError
    );

    return NextResponse.json(
      {
        success: false,
        error: `IA saturada temporalmente. Último detalle: ${lastError?.message || 'Timeout'}`,
      },
      { status: 503 }
    );
  } catch (err) {
    const fallbackErr = err instanceof Error ? err : new Error(String(err));
    console.error('[/api/generate-hook] Unexpected server error:', fallbackErr);
    return NextResponse.json(
      {
        success: false,
        error: `IA saturada temporalmente. Último detalle: ${fallbackErr.message || 'Timeout'}`,
      },
      { status: 503 }
    );
  }
}
