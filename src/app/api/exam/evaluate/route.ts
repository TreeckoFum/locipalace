import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface ExamEvaluateRequest {
  conceptTitle: string;
  originalNotes: string;
  phase3Prompt: string;
  userExplanation: string;
  locale: string;
}

export interface ExamEvaluateResponse {
  scorePercentage: number;
  feedback: string;
}

const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

function formatSynthesizedFeedback(
  summarySentence: string,
  missingConcepts: string[],
  locale: string
): string {
  const cleanSummary = summarySentence.trim();
  const cleanMissing = missingConcepts
    .map((item) => item.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  if (cleanMissing.length === 0) {
    return cleanSummary;
  }

  const header =
    locale === 'ca'
      ? 'Conceptes clau omesos:'
      : locale === 'en'
      ? 'Missing key concepts:'
      : 'Conceptos clave omitidos:';

  const bullets = cleanMissing.map((c) => `• ${c}`).join('\n');
  return `${cleanSummary}\n\n${header}\n${bullets}`;
}

function buildFallbackEvaluation(
  conceptTitle: string,
  originalNotes: string,
  userExplanation: string,
  locale: string
): ExamEvaluateResponse {
  const cleanUser = userExplanation.trim().toLowerCase();
  const cleanRef = (originalNotes || conceptTitle).trim();

  const clauses = cleanRef
    .split(/[.;:\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  if (cleanUser.length < 10) {
    const missing = clauses.slice(0, 4);
    const summary =
      locale === 'ca'
        ? `Resposta insuficient sobre ${conceptTitle}.`
        : locale === 'en'
        ? `Insufficient recall of ${conceptTitle}.`
        : `Respuesta insuficiente sobre ${conceptTitle}.`;

    return {
      scorePercentage: 10,
      feedback: formatSynthesizedFeedback(
        summary,
        missing.length > 0 ? missing : [conceptTitle],
        locale
      ),
    };
  }

  const missingClauses = clauses
    .filter((clause) => {
      const keywords = clause
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      if (keywords.length === 0) return false;
      const hits = keywords.filter((kw) => cleanUser.includes(kw));
      return hits.length / keywords.length < 0.4;
    })
    .map((c) => (c.length > 55 ? `${c.slice(0, 52).trim()}...` : c))
    .slice(0, 4);

  const totalClauses = Math.max(1, clauses.length);
  const coveredCount = Math.max(0, totalClauses - missingClauses.length);
  const scorePercentage = Math.max(
    20,
    Math.min(100, Math.round((coveredCount / totalClauses) * 100))
  );

  const summary =
    scorePercentage >= 85
      ? locale === 'ca'
        ? `Excel·lent assimilació tècnica dels elements de ${conceptTitle}.`
        : locale === 'en'
        ? `Strong technical assimilation of ${conceptTitle}.`
        : `Buena asimilación técnica de los elementos de ${conceptTitle}.`
      : locale === 'ca'
      ? `Assimilació parcial de ${conceptTitle}, però incompleta en elements clau.`
      : locale === 'en'
      ? `Partial assimilation of ${conceptTitle}, but incomplete on key technical points.`
      : `Asimilación parcial de ${conceptTitle}, pero incompleta en puntos clave.`;

  return {
    scorePercentage,
    feedback: formatSynthesizedFeedback(summary, missingClauses, locale),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ExamEvaluateRequest>;
    const conceptTitle = (body.conceptTitle ?? '').trim();
    const originalNotes = (body.originalNotes ?? '').trim();
    const phase3Prompt = (body.phase3Prompt ?? '').trim();
    const userExplanation = (body.userExplanation ?? '').trim();
    const locale = (body.locale ?? 'es').trim();

    if (!conceptTitle) {
      return NextResponse.json(
        { error: 'conceptTitle is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      return NextResponse.json(
        buildFallbackEvaluation(
          conceptTitle,
          originalNotes,
          userExplanation,
          locale
        ),
        { status: 200 }
      );
    }

    const targetLanguage =
      locale === 'ca' ? 'Catalan' : locale === 'en' ? 'English' : 'Spanish';

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Act as a strict, concise competitive-exam evaluator grading a candidate's active recall response in ${targetLanguage}.

INPUTS:
- Concept Title: "${conceptTitle}"
- Authoritative Pin Notes: "${originalNotes || conceptTitle}"
- Prompt Asked: "${phase3Prompt}"
- Candidate's Explanation: "${userExplanation}"

STRICT ULTRA-SYNTHESIZED FEEDBACK RULES:
1. "scorePercentage": Integer from 0 to 100 based on conceptual accuracy, technical precision, and coverage of the Authoritative Pin Notes.
2. "summarySentence": Exactly ONE brief sentence (max 18 words) in ${targetLanguage} summarizing the overall quality of the answer (e.g., "Buena asimilación de las garantías procesales, pero incompleta en los límites de aplicación.").
3. "missingConcepts": An array of short technical terms/concepts (2 to 6 words each, in ${targetLanguage}) from the Authoritative Pin Notes that the candidate omitted or stated inaccurately. If the candidate covered 100% of the notes, return an empty array [].
4. FORBIDDEN: Do NOT write long explanations, textbook definitions, or pedagogical lectures. Output ONLY the short summary sentence and the exact missing technical concept labels.

Return raw JSON only.`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  scorePercentage: { type: Type.INTEGER },
                  summarySentence: { type: Type.STRING },
                  missingConcepts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'scorePercentage',
                  'summarySentence',
                  'missingConcepts',
                ],
              },
            },
          });

          const rawText = response.text;
          if (rawText) {
            const cleaned = rawText
              .replace(/^```json\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim();
            const parsed = JSON.parse(cleaned) as {
              scorePercentage?: number;
              summarySentence?: string;
              missingConcepts?: string[];
            };

            if (
              typeof parsed.scorePercentage === 'number' &&
              typeof parsed.summarySentence === 'string'
            ) {
              const formattedFeedback = formatSynthesizedFeedback(
                parsed.summarySentence,
                Array.isArray(parsed.missingConcepts)
                  ? parsed.missingConcepts
                  : [],
                locale
              );

              return NextResponse.json(
                {
                  scorePercentage: Math.max(
                    0,
                    Math.min(100, Math.round(parsed.scorePercentage))
                  ),
                  feedback: formattedFeedback,
                },
                { status: 200 }
              );
            }
          }
        } catch (attemptErr) {
          console.warn(
            `[/api/exam/evaluate] Model "${modelName}" failed (503/404/error), trying next candidate:`,
            attemptErr instanceof Error ? attemptErr.message : attemptErr
          );
          continue;
        }
      }
    } catch (geminiErr) {
      console.warn(
        '[/api/exam/evaluate] Gemini API error, using fallback evaluation:',
        geminiErr instanceof Error ? geminiErr.message : geminiErr
      );
    }

    return NextResponse.json(
      buildFallbackEvaluation(
        conceptTitle,
        originalNotes,
        userExplanation,
        locale
      ),
      { status: 200 }
    );
  } catch (err) {
    console.error('[/api/exam/evaluate] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error evaluating explanation' },
      { status: 500 }
    );
  }
}
