import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface EvaluateRecallRequest {
  pinId: string;
  targetConcept: string;
  notes?: string;
  userRecallText: string;
  locale?: string;
}

export interface EvaluateRecallResponse {
  score: number; // 0 to 100
  status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED';
  feedback: string;
  suggestedImprovement?: string;
}

// Comprehensive stop-words in ES, EN, CA — strictly excluded from keyword matching
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'under', 'between',
  'out', 'against', 'during', 'without', 'before', 'around', 'among', 'across',
  'through', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
  'must', 'can', 'could', 'that', 'this', 'these', 'those', 'what', 'which', 'who',
  'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'every', 'either',
  'neither', 'while', 'their', 'there', 'here', 'it', 'its', 'they', 'them', 'we',
  'us', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'my', 'me', 'our',
  'occurs', 'occur', 'make', 'makes', 'made', 'use', 'used', 'using', 'allows',
  // Spanish
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del', 'de',
  'en', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'hacia',
  'segun', 'tras', 'durante', 'mediante', 'y', 'e', 'ni', 'o', 'u', 'pero', 'mas',
  'sino', 'aunque', 'como', 'cuando', 'donde', 'quien', 'quienes', 'cual', 'cuales',
  'cuyo', 'cuya', 'que', 'si', 'no', 'ya', 'muy', 'tambien', 'solo', 'todo', 'toda',
  'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'cada',
  'este', 'esta', 'esto', 'estos', 'estas', 'ese', 'esa', 'eso', 'esos', 'esas',
  'aquel', 'aquella', 'aquello', 'aquellos', 'aquellas', 'mi', 'mis', 'tu', 'tus',
  'su', 'sus', 'nuestro', 'nuestra', 'yo', 'te', 'se', 'me', 'nos', 'le', 'les',
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'ser', 'estar', 'esta', 'estan',
  'ha', 'han', 'hay', 'haber', 'tiene', 'tienen', 'tener', 'hace', 'hacen', 'hacer',
  'puede', 'pueden', 'poder', 'porque', 'pues', 'algo', 'nada', 'nadie', 'alguien',
  'vez', 'veces', 'asi', 'bien', 'mal', 'menos', 'tan', 'tanto',
  // Catalan
  'els', 'les', 'uns', 'unes', 'dels', 'pels', 'pel', 'per', 'amb', 'sense',
  'fins', 'des', 'cap', 'vers', 'com', 'quan', 'on', 'qui', 'quin', 'quina',
  'quins', 'quines', 'aquest', 'aquesta', 'aquests', 'aquestes', 'aquell', 'aquella',
  'pero', 'perque', 'molt', 'tambe', 'tot', 'tota', 'tots', 'totes', 'altre', 'altra',
  'altres', 'mateix', 'mateixa', 'seu', 'seva', 'seus', 'seves', 'meu', 'meva',
  'teu', 'teva', 'nostre', 'nostra', 'son', 'era', 'eren', 'va', 'van', 'fer',
  'pot', 'poden', 'poder', 'res', 'ningu', 'algu', 'vegada', 'aix', 'aixo',
]);

// Domain-specific technical short acronyms that ARE valid 2-3 char keywords
const ALLOWED_SHORT_ACRONYMS = new Set([
  'atp', 'adp', 'pi', 'dna', 'rna', 'adn', 'arn', 'cap', 'cpu', 'gpu', 'ram',
  'tcp', 'udp', 'ip', 'sql', 'api', 'http', 'ssh', 'tls', 'ssl', 'ph', 'co2', 'o2',
]);

// Strict synonym groups: only exact member matches count
const SYNONYM_GROUPS: string[][] = [
  ['mitochondria', 'mitochondrial', 'mitocondria', 'mitocondrial', 'mitocondrias'],
  ['atp', 'adenosine', 'triphosphate', 'trifosfato', 'adenosina'],
  ['synthase', 'sintasa', 'synthesis', 'sintesis', 'sintetizar'],
  ['phosphorylation', 'fosforilacion'],
  ['oxidative', 'oxidativa', 'oxidation', 'oxidacion'],
  ['proton', 'protons', 'protones', 'gradient', 'gradiente'],
  ['membrane', 'membrana', 'inner', 'interna'],
  ['consistency', 'consistent', 'consistencia', 'consistente'],
  ['availability', 'available', 'disponibilidad', 'disponible'],
  ['partition', 'particion', 'tolerance', 'tolerant', 'tolerancia', 'tolerante'],
  ['distributed', 'distribuido', 'distribuidos', 'distribuida'],
  ['heisenberg', 'uncertainty', 'incertidumbre', 'incertesa'],
  ['quantum', 'cuantico', 'cuantica', 'cuanticos', 'particle', 'particula', 'particulas'],
  ['position', 'posicion', 'posicio', 'ubicacion'],
  ['momentum', 'momento', 'impulso', 'velocidad', 'velocity'],
  ['simultaneously', 'simultaneamente', 'simultaniament', 'simultaneo'],
];

const COFFEE_EVASION_PATTERNS = [
  /\bcafe\b/,
  /\bcafecito\b/,
  /\bcoffee\b/,
  /\bespresso\b/,
  /\bcapuchino\b/,
  /\bcappuccino\b/,
  /\blatte\b/,
  /\bcerveza\b/,
  /\bbeer\b/,
  /\btomar algo\b/,
  /\binvito\b/,
  /\bquedamos\b/,
  /\bcharlar\b/,
];

const IDK_EVASION_PATTERNS = [
  /\bno se\b/,
  /\bno lo se\b/,
  /\bni idea\b/,
  /\bno me acuerdo\b/,
  /\bno recuerdo\b/,
  /\bidk\b/,
  /\bdont know\b/,
  /\bi dont know\b/,
  /\bno clue\b/,
  /\bpass\b/,
  /\bpaso\b/,
  /\bhola\b/,
  /\bhello\b/,
  /\btest\b/,
  /\bprueba\b/,
  /\basdf/,
  /\bajaj/,
  /\bhaha/,
  /\blol\b/,
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStem(word: string): string {
  if (word.length <= 5) return word;
  return word
    .replace(
      /(izaciones|izacion|amientos|amiento|imientos|imiento|aciones|acion|iciones|icion|mente|idades|idad|ances|ance|ences|ence|ations|ation|ments|ment|nesses|ness|ables|able|ibles|ible|icals|ical|ally)$/i,
      ''
    )
    .replace(/(ando|iendo|aron|ieron|aban|ian|ing|ed|es|er|ly|al|ic|os|as)$/i, '');
}

interface ExtractedToken {
  raw: string;
  norm: string;
  stem: string;
}

function extractSignificantTokens(text: string): ExtractedToken[] {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];

  const words = cleaned.split(' ');
  const seen = new Set<string>();
  const result: ExtractedToken[] = [];

  for (const w of words) {
    if (!w) continue;
    if (STOP_WORDS.has(w)) continue;

    if (w.length < 3 && !ALLOWED_SHORT_ACRONYMS.has(w)) {
      continue;
    }

    const stem = getStem(w);
    if (seen.has(stem)) continue;
    seen.add(stem);
    result.push({ raw: w, norm: w, stem });
  }

  return result;
}

function tokensMatch(targetToken: ExtractedToken, userTokens: ExtractedToken[]): boolean {
  for (const u of userTokens) {
    if (u.norm === targetToken.norm) {
      return true;
    }

    if (targetToken.stem.length >= 4 && u.stem.length >= 4 && u.stem === targetToken.stem) {
      return true;
    }

    if (targetToken.stem.length >= 5 && u.stem.length >= 5) {
      if (
        u.norm.startsWith(targetToken.stem) ||
        targetToken.norm.startsWith(u.stem)
      ) {
        return true;
      }
    }

    for (const group of SYNONYM_GROUPS) {
      if (group.includes(targetToken.norm) && group.includes(u.norm)) {
        return true;
      }
    }
  }
  return false;
}

function buildZeroScoreFeedback(
  targetConcept: string,
  normUserText: string,
  topMissing: string[],
  locale = 'es'
): EvaluateRecallResponse {
  const isHeisenberg = normalizeText(targetConcept).includes('heisenberg');
  const isCoffeeEvasion = COFFEE_EVASION_PATTERNS.some((rx) => rx.test(normUserText));
  const isIdkEvasion = IDK_EVASION_PATTERNS.some((rx) => rx.test(normUserText));

  if (isCoffeeEvasion) {
    const feedback = isHeisenberg
      ? 'Agradecemos la invitación al café, pero Heisenberg sigue sin poder medir la posición y el momento lineal a la vez. 0% de física cuántica, 100% de procrastinación.'
      : `Agradecemos la invitación al café, pero "${targetConcept}" no se va a memorizar solo mirando la taza. 0% de precisión conceptual, 100% de procrastinación.`;

    return {
      score: 0,
      status: 'FAILED',
      feedback,
      suggestedImprovement:
        topMissing.length > 0
          ? `Deja el café un segundo y ancla estos conceptos clave al objeto: ${topMissing.join(', ')}.`
          : `Revisa el concepto "${targetConcept}" en el modo Estudio antes de volver a intentarlo.`,
    };
  }

  if (isIdkEvasion) {
    const feedback =
      locale === 'en'
        ? `Honesty is a virtue, but blanking on "${targetConcept}" still scores a strict 0%. Your spatial locus needs a far more absurd mnemonic hook.`
        : `La sinceridad te honra, pero dejar "${targetConcept}" en blanco otorga un 0% estricto. Tu ancla espacial necesita una escena mnemotécnica mucho más absurda e inolvidable.`;

    return {
      score: 0,
      status: 'FAILED',
      feedback,
      suggestedImprovement:
        topMissing.length > 0
          ? `Términos clave que debes recuperar: ${topMissing.join(', ')}.`
          : `Repasa "${targetConcept}" en el modo Estudio.`,
    };
  }

  const defaultFeedback =
    locale === 'en'
      ? `Zero semantic overlap with "${targetConcept}". None of the required conceptual pillars were detected in your response—0% awarded.`
      : `Cero coincidencia semántica con "${targetConcept}". No se detectó ninguno de los conceptos clave anclados en este punto—0% de puntuación.`;

  return {
    score: 0,
    status: 'FAILED',
    feedback: defaultFeedback,
    suggestedImprovement:
      topMissing.length > 0
        ? `Conceptos clave requeridos en este pin: ${topMissing.join(', ')}.`
        : `Vuelve al modo Estudio y repasa "${targetConcept}".`,
  };
}

function evaluateWithHeuristic(payload: EvaluateRecallRequest): EvaluateRecallResponse {
  const { targetConcept, notes = '', userRecallText, locale = 'es' } = payload;

  const normUser = normalizeText(userRecallText);
  const conceptTokens = extractSignificantTokens(targetConcept);
  const notesTokens = extractSignificantTokens(notes);
  const userTokens = extractSignificantTokens(userRecallText);

  const missingConceptTerms: string[] = [];
  let matchedConceptCount = 0;

  for (const ct of conceptTokens) {
    if (tokensMatch(ct, userTokens)) {
      matchedConceptCount++;
    } else {
      missingConceptTerms.push(ct.raw);
    }
  }

  const missingNotesTerms: string[] = [];
  let matchedNotesCount = 0;

  for (const nt of notesTokens) {
    if (tokensMatch(nt, userTokens)) {
      matchedNotesCount++;
    } else {
      missingNotesTerms.push(nt.raw);
    }
  }

  const topMissing = [...missingConceptTerms, ...missingNotesTerms.slice(0, 4)]
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 5);

  if (
    userTokens.length === 0 ||
    (matchedConceptCount === 0 && matchedNotesCount === 0)
  ) {
    return buildZeroScoreFeedback(targetConcept, normUser, topMissing, locale);
  }

  const conceptRatio =
    conceptTokens.length > 0
      ? matchedConceptCount / conceptTokens.length
      : matchedNotesCount > 0
      ? 0.5
      : 0;

  const rawNotesRatio =
    notesTokens.length > 0
      ? matchedNotesCount / notesTokens.length
      : conceptRatio;
  const adjustedNotesRatio = Math.min(1, rawNotesRatio / 0.55);

  let rawScore = conceptRatio * 65 + adjustedNotesRatio * 35;

  if (matchedConceptCount === 0 && matchedNotesCount === 1) {
    rawScore = Math.min(rawScore, 30);
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED' =
    score >= 80 ? 'MASTERED' : score >= 50 ? 'NEEDS_REVIEW' : 'FAILED';

  let feedback = '';
  let suggestedImprovement: string | undefined;

  if (status === 'MASTERED') {
    feedback =
      locale === 'en'
        ? 'Sharp spatial retrieval! You unlocked the core concept and key mechanisms anchored to this locus with high semantic fidelity.'
        : '¡Recuperación espacial impecable! Has desbloqueado el concepto central y los mecanismos clave anclados en este objeto con alta precisión.';
    if (topMissing.length > 0) {
      suggestedImprovement =
        score < 100
          ? `Para alcanzar el 100%, incluye también: ${topMissing.join(', ')}.`
          : `Detalles adicionales de precisión: ${topMissing.join(', ')}.`;
    }
  } else if (status === 'NEEDS_REVIEW') {
    feedback =
      locale === 'en'
        ? 'Partial retrieval: you captured the main idea, but several load-bearing technical details remained in the shadows.'
        : 'Recuperación parcial: capturaste la idea general, pero varios detalles técnicos clave se quedaron en el tintero.';
    suggestedImprovement =
      topMissing.length > 0
        ? `Refuerza tu mnemotecnia visual para incluir estos conceptos omitidos: ${topMissing.join(', ')}.`
        : `Amplía tu explicación con los mecanismos específicos de "${targetConcept}".`;
  } else {
    feedback =
      locale === 'en'
        ? 'Insufficient conceptual accuracy. Only isolated fragments were detected—your memory anchor needs reinforcement.'
        : 'Precisión conceptual insuficiente. Solo mencionaste fragmentos aislados; necesitas reforzar el gancho mnemotécnico de este objeto.';
    suggestedImprovement =
      topMissing.length > 0
        ? `Debes anclar explícitamente estos términos clave: ${topMissing.join(', ')}.`
        : `Repasa "${targetConcept}" en el modo Estudio.`;
  }

  return {
    score,
    status,
    feedback,
    suggestedImprovement,
  };
}

async function evaluateWithGeminiSDK(
  payload: EvaluateRecallRequest,
  apiKey: string
): Promise<EvaluateRecallResponse | null> {
  const languageName =
    payload.locale === 'en'
      ? 'English'
      : payload.locale === 'ca'
      ? 'Catalan'
      : 'Spanish';

  const prompt = `You are the Semantic Recall Evaluator for LociPalace, an interactive 2D Memory Palace app.
Grade the user's active retrieval attempt against the Target Concept and Detailed Notes.

STRICT GRADING INSTRUCTIONS:
1. If the user's answer is unrelated, evasive, gibberish, or a humorous deflection (e.g., inviting for coffee, saying "no sé"), return score: 0 and status: "FAILED" with sharp, witty feedback (e.g., "Agradecemos la invitación al café, pero Heisenberg sigue sin poder medir la posición y el momento lineal a la vez. 0% de física cuántica, 100% de procrastinación.").
2. Award 80-100 ("MASTERED") for accurate core concept retention and key mechanisms.
3. Award 50-79 ("NEEDS_REVIEW") for partial or vague retention where key details are missing.
4. Award 0-49 ("FAILED") for inaccurate or minimal recall.
5. Write "feedback" and "suggestedImprovement" in ${languageName}.

Target Concept: "${payload.targetConcept}"
Detailed Notes: "${payload.notes || 'N/A'}"
User Recall Text: "${payload.userRecallText}"`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: 'Numeric score from 0 to 100.',
            },
            status: {
              type: Type.STRING,
              enum: ['MASTERED', 'NEEDS_REVIEW', 'FAILED'],
              description: '>= 80 MASTERED, 50-79 NEEDS_REVIEW, < 50 FAILED',
            },
            feedback: {
              type: Type.STRING,
              description:
                'Sharp, pedagogical, slightly witty feedback on the recall attempt.',
            },
            suggestedImprovement: {
              type: Type.STRING,
              description:
                'Optional tip on which missing key points to reinforce in the memory palace.',
            },
          },
          required: ['score', 'status', 'feedback'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    const status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED' =
      score >= 80 ? 'MASTERED' : score >= 50 ? 'NEEDS_REVIEW' : 'FAILED';

    return {
      score,
      status,
      feedback: String(parsed.feedback || ''),
      suggestedImprovement: parsed.suggestedImprovement
        ? String(parsed.suggestedImprovement)
        : undefined,
    };
  } catch (err) {
    console.warn(
      'Gemini evaluate-recall fallback to strict local heuristic:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<EvaluateRecallRequest>;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON payload.' },
        { status: 400 }
      );
    }

    const { pinId, targetConcept, notes, userRecallText, locale } = body;

    if (!pinId || typeof pinId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "pinId" parameter.' },
        { status: 400 }
      );
    }

    if (!targetConcept || typeof targetConcept !== 'string' || !targetConcept.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty "targetConcept" parameter.' },
        { status: 400 }
      );
    }

    if (typeof userRecallText !== 'string' || !userRecallText.trim()) {
      return NextResponse.json(
        { error: 'Please provide your recall attempt in "userRecallText".' },
        { status: 400 }
      );
    }

    const payload: EvaluateRecallRequest = {
      pinId: pinId.trim(),
      targetConcept: targetConcept.trim(),
      notes: typeof notes === 'string' ? notes.trim() : '',
      userRecallText: userRecallText.trim(),
      locale: typeof locale === 'string' ? locale : 'es',
    };

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey && apiKey !== 'TU_CLAVE_AQUI') {
      const aiResult = await evaluateWithGeminiSDK(payload, apiKey);
      if (aiResult) {
        return NextResponse.json(aiResult, { status: 200 });
      }
    }

    const heuristicResult = evaluateWithHeuristic(payload);
    return NextResponse.json(heuristicResult, { status: 200 });
  } catch (err) {
    console.error('Error in /api/evaluate-recall:', err);
    return NextResponse.json(
      {
        error:
          'Failed to evaluate active recall attempt. Please check your request format and try again.',
      },
      { status: 500 }
    );
  }
}
