import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { Phase2Question } from '@/types/exam';

export interface ExamGenerateRequest {
  conceptTitle: string;
  anchorName: string;
  notes: string;
  attemptNumber: number;
  locale: string;
}

export interface ExamGenerateResponse {
  phase2Questions: Phase2Question[];
  phase3Prompt: string;
}

const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
];

/**
 * Fisher-Yates shuffle that randomizes option positions and dynamically updates `correctOptionIndex`
 * to eliminate any positional bias (e.g., Option A always being correct).
 */
function shuffleQuestionOptions(question: Phase2Question): Phase2Question {
  const rawOptions =
    Array.isArray(question.options) && question.options.length >= 4
      ? question.options.slice(0, 4)
      : ['Opción A', 'Opción B', 'Opción C', 'Opción D'];

  const safeCorrectIdx =
    typeof question.correctOptionIndex === 'number' &&
    question.correctOptionIndex >= 0 &&
    question.correctOptionIndex < rawOptions.length
      ? question.correctOptionIndex
      : 0;

  const tagged = rawOptions.map((text, idx) => ({
    text: text.trim(),
    isCorrect: idx === safeCorrectIdx,
  }));

  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = tagged[i];
    tagged[i] = tagged[j];
    tagged[j] = temp;
  }

  const newCorrectIdx = tagged.findIndex((item) => item.isCorrect);

  return {
    ...question,
    options: tagged.map((item) => item.text),
    correctOptionIndex: newCorrectIdx >= 0 ? newCorrectIdx : 0,
  };
}

/**
 * Estimates the maximum proportional question ceiling based on distinct substantive clauses,
 * never forcing filler questions when notes are brief.
 */
function getProportionalQuestionBounds(notes: string): {
  min: number;
  max: number;
} {
  const trimmed = notes.trim();
  const clauses = trimmed
    .split(/[.;:\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (clauses.length <= 2 || trimmed.length < 180) {
    return { min: 1, max: 2 };
  }
  if (clauses.length <= 5 || trimmed.length <= 500) {
    return { min: 2, max: 4 };
  }
  return { min: 3, max: Math.min(10, clauses.length) };
}

function buildFallbackExamQuestions(
  conceptTitle: string,
  notes: string,
  attemptNumber: number,
  locale: string
): ExamGenerateResponse {
  const cleanNotes = notes.trim() || conceptTitle;
  const clauses = cleanNotes
    .split(/(?<=[.!?;\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const primaryClause = (clauses[0] || cleanNotes).slice(0, 115);
  const targetLen = Math.max(65, primaryClause.length);

  const padOrTrim = (str: string): string => {
    if (str.length > targetLen + 12) {
      return `${str.slice(0, targetLen + 8).trim()}.`;
    }
    return str;
  };

  const questionsEs: Phase2Question[] = [
    shuffleQuestionOptions({
      id: 'q1',
      question: `En relación con el régimen sustantivo de "${conceptTitle}", señale la proposición técnicamente exacta:`,
      options: [
        padOrTrim(primaryClause),
        padOrTrim(
          `Opera exclusivamente mediante analogía in bonam partem bajo apreciación discrecional del órgano competente.`
        ),
        padOrTrim(
          `Admite excepción retroactiva in malam partem cuando concurran razones de interés público prevalente.`
        ),
        padOrTrim(
          `Su eficacia queda subordinada a convalidación reglamentaria posterior con alcance meramente declarativo.`
        ),
      ],
      correctOptionIndex: 0,
    }),
  ];

  if (clauses.length >= 2) {
    const secondaryClause = clauses[1].slice(0, 115);
    questionsEs.push(
      shuffleQuestionOptions({
        id: 'q2',
        question: `(Variante #${attemptNumber}) Respecto al alcance aplicativos y límites de "${conceptTitle}", indique el criterio correcto:`,
        options: [
          padOrTrim(secondaryClause),
          padOrTrim(
            `Se restringe a supuestos de culpa consciente excluyendo expresamente las modalidades de comisión dolosa.`
          ),
          padOrTrim(
            `Requiere habilitación administrativa previa sin sujeción al principio de reserva jurisdiccional estricta.`
          ),
          padOrTrim(
            `Produce la nulidad radical únicamente cuando media requerimiento potestativo a instancia de parte legítima.`
          ),
        ],
        correctOptionIndex: 0,
      })
    );
  }

  const questionsCa: Phase2Question[] = [
    shuffleQuestionOptions({
      id: 'q1',
      question: `En relació amb el règim substantiu de "${conceptTitle}", assenyaleu la proposició tècnicament exacta:`,
      options: [
        padOrTrim(primaryClause),
        padOrTrim(
          `Opera exclusivament mitjançant analogia in bonam partem sota apreciació discrecional de l'òrgan competent.`
        ),
        padOrTrim(
          `Admet excepció retroactiva in malam partem quan concorrin raons d'interès públic prevalent.`
        ),
        padOrTrim(
          `La seva eficàcia queda subordinada a convalidació reglamentària posterior amb abast merament declaratiu.`
        ),
      ],
      correctOptionIndex: 0,
    }),
  ];

  if (clauses.length >= 2) {
    const secondaryClause = clauses[1].slice(0, 115);
    questionsCa.push(
      shuffleQuestionOptions({
        id: 'q2',
        question: `(Variant #${attemptNumber}) Respecte a l'abast aplicatiu i límits de "${conceptTitle}", indiqueu el criteri correcte:`,
        options: [
          padOrTrim(secondaryClause),
          padOrTrim(
            `Es restringeix a supòsits de culpa conscient excloent expressament les modalitats de comissió dolosa.`
          ),
          padOrTrim(
            `Requereix habilitació administrativa prèvia sense subjecció al principi de reserva jurisdiccional estricta.`
          ),
          padOrTrim(
            `Produeix la nul·litat radical únicament quan hi ha requeriment potestatiu a instància de part legítima.`
          ),
        ],
        correctOptionIndex: 0,
      })
    );
  }

  const questionsEn: Phase2Question[] = [
    shuffleQuestionOptions({
      id: 'q1',
      question: `Regarding the substantive doctrine and scope of "${conceptTitle}", identify the technically accurate statement:`,
      options: [
        padOrTrim(primaryClause),
        padOrTrim(
          `It operates exclusively through discretionary analogy in bonam partem without statutory reservation limits.`
        ),
        padOrTrim(
          `It permits retroactive enforcement in malam partem whenever overriding public policy exceptions are invoked.`
        ),
        padOrTrim(
          `Its binding force remains suspended pending subsequent regulatory ratification of a purely declaratory nature.`
        ),
      ],
      correctOptionIndex: 0,
    }),
  ];

  if (clauses.length >= 2) {
    const secondaryClause = clauses[1].slice(0, 115);
    questionsEn.push(
      shuffleQuestionOptions({
        id: 'q2',
        question: `(Variant #${attemptNumber}) Concerning the operational conditions and boundaries of "${conceptTitle}", select the valid rule:`,
        options: [
          padOrTrim(secondaryClause),
          padOrTrim(
            `It applies solely to conscious negligence while expressly excluding intentional or reckless conduct.`
          ),
          padOrTrim(
            `It requires prior administrative authorization exempt from strict jurisdictional review guarantees.`
          ),
          padOrTrim(
            `It triggers voidability only upon discretionary petition filed by an affected third-party intervenor.`
          ),
        ],
        correctOptionIndex: 0,
      })
    );
  }

  const pool =
    locale === 'ca'
      ? questionsCa
      : locale === 'en'
      ? questionsEn
      : questionsEs;

  const phase3Prompt =
    locale === 'ca'
      ? `Desenvolupa amb rigor tècnic els elements, garanties i límits de "${conceptTitle}".`
      : locale === 'en'
      ? `Explain with technical precision the core elements, guarantees, and boundaries of "${conceptTitle}".`
      : `Desarrolla con rigor técnico los elementos, garantías y límites de "${conceptTitle}".`;

  return {
    phase2Questions: pool,
    phase3Prompt,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ExamGenerateRequest>;
    const conceptTitle = (body.conceptTitle ?? '').trim();
    const notes = (body.notes ?? '').trim();
    const attemptNumber = Number(body.attemptNumber) || 1;
    const locale = (body.locale ?? 'es').trim();

    if (!conceptTitle) {
      return NextResponse.json(
        { error: 'conceptTitle is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const effectiveNotes = notes || conceptTitle;
    const { min, max } = getProportionalQuestionBounds(effectiveNotes);

    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      return NextResponse.json(
        buildFallbackExamQuestions(
          conceptTitle,
          effectiveNotes,
          attemptNumber,
          locale
        ),
        { status: 200 }
      );
    }

    const targetLanguage =
      locale === 'ca' ? 'Catalan' : locale === 'en' ? 'English' : 'Spanish';

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a senior competitive-examination ("Oposiciones" / Bar / Medical Board) tribunal examiner.
Write ALL questions, options, and prompts strictly in ${targetLanguage}.

INPUT DATA:
- Concept Title: "${conceptTitle}"
- Authoritative Study Notes: "${effectiveNotes}"
- Attempt Number: #${attemptNumber} (Vary angles, sub-clauses, and perspectives from prior attempts).

MANDATORY EXAMINER RULES:
1. ZERO SPATIAL OR MNEMONIC QUESTIONS:
   - NEVER ask where the pin is located, what physical room object/anchor was used, or anything about rooms/furniture. Phase 1 already tested spatial location.
   - Phase 2 MUST be 100% substantive academic/legal/scientific domain content.

2. DYNAMIC & PROPORTIONAL QUESTION COUNT (${min} to ${max} questions):
   - Do NOT force artificial quotas or filler questions.
   - If the notes contain only 1 or 2 distinct substantive ideas, generate ONLY 1 or 2 high-level questions.
   - Only generate more questions (up to ${max}) if there are genuinely distinct, verifiable sub-concepts in the notes.

3. OPPOSITION-GRADE DISTRACTORS & STRICT LENGTH EQUALIZATION:
   - Every question must have EXACTLY 4 options.
   - All 4 options (A, B, C, D) MUST have approximately the SAME character length (within +/- 15% of each other).
   - The correct option must NEVER be longer, more detailed, or more qualified than the 3 distractors.
   - Construct distractors using authoritative technical terminology and subtle doctrinal pitfalls:
     * Swap crucial qualifiers (e.g., "in malam partem" vs "in bonam partem", "potestativo" vs "preceptivo", "dolo eventual" vs "culpa consciente", "nulidad de pleno derecho" vs "anulabilidad").
     * Alter exceptions, deadlines, or procedural guarantees, or pull closely related concepts from the same discipline to create plausible confusion.

4. PHASE 3 PROMPT:
   - Provide a concise, rigorous essay prompt ("phase3Prompt") asking the candidate to synthesize the exact technical elements of "${conceptTitle}".

Return raw, valid JSON matching the schema.`;

      for (const modelName of MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.75,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  phase2Questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctOptionIndex: { type: Type.INTEGER },
                      },
                      required: [
                        'id',
                        'question',
                        'options',
                        'correctOptionIndex',
                      ],
                    },
                  },
                  phase3Prompt: { type: Type.STRING },
                },
                required: ['phase2Questions', 'phase3Prompt'],
              },
            },
          });

          const rawText = response.text;
          if (rawText) {
            const cleaned = rawText
              .replace(/^```json\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim();
            const parsed = JSON.parse(cleaned) as ExamGenerateResponse;

            if (
              Array.isArray(parsed.phase2Questions) &&
              parsed.phase2Questions.length > 0 &&
              typeof parsed.phase3Prompt === 'string'
            ) {
              // Apply Fisher-Yates shuffle to every question's options to guarantee zero positional bias
              const sanitizedAndShuffled: Phase2Question[] =
                parsed.phase2Questions.map((q, idx) =>
                  shuffleQuestionOptions({
                    id: q.id || `q${idx + 1}`,
                    question: q.question,
                    options:
                      Array.isArray(q.options) && q.options.length >= 4
                        ? q.options.slice(0, 4)
                        : ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
                    correctOptionIndex:
                      typeof q.correctOptionIndex === 'number'
                        ? q.correctOptionIndex
                        : 0,
                  })
                );

              return NextResponse.json(
                {
                  phase2Questions: sanitizedAndShuffled,
                  phase3Prompt: parsed.phase3Prompt.trim(),
                },
                { status: 200 }
              );
            }
          }
        } catch (attemptErr) {
          console.warn(
            `[/api/exam/generate] Model "${modelName}" failed (503/404/error), trying next candidate:`,
            attemptErr instanceof Error ? attemptErr.message : attemptErr
          );
          continue;
        }
      }
    } catch (geminiErr) {
      console.warn(
        '[/api/exam/generate] Gemini API error, using fallback questions:',
        geminiErr instanceof Error ? geminiErr.message : geminiErr
      );
    }

    return NextResponse.json(
      buildFallbackExamQuestions(
        conceptTitle,
        effectiveNotes,
        attemptNumber,
        locale
      ),
      { status: 200 }
    );
  } catch (err) {
    console.error('[/api/exam/generate] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error generating exam questions' },
      { status: 500 }
    );
  }
}
