import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export interface GenerateMnemonicRequest {
  physicalObject?: string;
  objectTitle?: string;
  targetConcept: string;
  notes?: string;
  locale?: string;
}

export interface GenerateMnemonicResponse {
  mnemonicHook: string;
  suggestedVisualization: string;
  narrativeStyle?: string;
  mnemonic?: string;
}

const NARRATIVE_STYLES = [
  'Absurd 1990s Late-Night Infomercial Disaster',
  'Over-dramatic Latin Telenovela Betrayal',
  'Kafkaesque Bureaucratic Catastrophe with Paperwork',
  'Gordon Ramsay Kitchen Meltdown Nightmare',
  '1950s Black-and-White Noir Detective Monologue',
  'Chaotic Cartoon Slapstick with Physics Glitches',
] as const;

let lastStyleIdx = -1;
let lastVerbIdx = -1;
let lastModifierIdx = -1;
let lastScenarioIdx = -1;

function pickRandomDistinctIndex(length: number, lastIndex: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * length);
  if (idx === lastIndex) {
    idx = (idx + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return idx;
}

const FALLBACK_ES = {
  verbs: [
    'demanda judicialmente a gritos a',
    'intenta cocinar al baño maría a',
    'le exige el pasaporte sellado por triplicado a',
    'descubre una traición telenovelesca oculta dentro de',
    'subasta en una teletienda de madrugada averiada a',
    'interroga bajo un foco humeante de detective noir a',
    'envuelve en plástico de burbujas industrial a',
    'reta a un duelo de esgrima con baguettes rancias a',
  ],
  modifiers: [
    'cubierto de mostaza antigua y sellos notariales',
    'mientras llora lágrimas de tinta china espesa',
    'con acento de chef furioso golpeando una sartén de cobre',
    'vestido con gabardina empapada y bigote postizo torcido',
    'atascado dentro de una fotocopiadora burocrática que escupe multas',
    'con música de órgano dramático y zoom brusco de cámara ochentera',
    'resbalando sobre tres cáscaras de plátano de plomo macizo',
    'oliendo intensamente a café recalentado de comisaría y pergamino viejo',
  ],
  scenarios: [
    'Obliga al objeto físico a firmar un contrato hipotecario donde cada cláusula explica el mecanismo paso a paso.',
    'El objeto abre un compartimento secreto lleno de miniaturas teatrales que representan físicamente el concepto en tu habitación.',
    'Un inspector con lupa gigante mide el objeto con una regla de madera y le grita cada término clave del concepto porque está crudo.',
    'El objeto se convierte en el presentador de un infomercial caótico que lanza los componentes del concepto por toda la mesa.',
    'En blanco y negro granulado, el objeto confiesa entre humo de pipa cómo funciona exactamente el concepto para no ir a prisión.',
    'El objeto empieza a derretirse como un reloj de Dalí de queso manchego mientras esculpe las piezas clave del concepto.',
    'Una banda de mariachis diminutos sale del interior del objeto cantando a pleno pulmón la definición exacta del concepto.',
    'El objeto sufre un fallo de gravedad estilo dibujo animado clásico, quedando suspendido a medio metro mientras escupe etiquetas con las notas clave.',
  ],
};

const FALLBACK_EN = {
  verbs: [
    'slaps a notarized eviction notice onto',
    'furiously juliennes and flambés',
    'dramatically accuses of a soap-opera betrayal',
    'attempts to hawk on a malfunctioning 3 AM infomercial',
    'interrogates under a smoky 1950s detective desk lamp',
    'forces through a jammed bureaucratic fax machine',
    'challenges to an absurd slapstick anvil-drop duel',
    'audits with a giant magnifying glass and rubber stamps',
  ],
  modifiers: [
    'while drenched in Dijon mustard and red wax seals',
    'screaming like a Michelin-star chef over raw risotto',
    'wearing a soaked trench coat and a crooked fake mustache',
    'accompanied by a sudden zoom-in and melodramatic organ chords',
    'buried under forty-seven triplicate carbon-copy forms',
    'smelling strongly of burnt espresso, wet cardboard, and old parchment',
    'bouncing with cartoon accordion physics across the floorboards',
    'while a faulty teleprompter scrolls the technical notes backward',
  ],
  scenarios: [
    'Touch the surface of the object and feel the embossed textures of each mechanism from your notes.',
    'Watch the object split open like a wooden suitcase, revealing a miniature courtroom arguing the core concept.',
    'Hear the object monologue in gritty black-and-white noir voiceover, spelling out the exact scientific definition.',
    'See a tiny bureaucratic clerk inside the object stamping every keyword of the concept onto your desk.',
    'Picture the object slipping on a cartoon banana peel and juggling the core components of the concept in mid-air.',
    'Watch a furious chef inspect the object with tongs, shouting the missing technical details until it is cooked to perfection.',
    'Imagine an infomercial host emerging from behind the object, demonstrating how the concept solves an absurd household disaster.',
    'Visualize the object weeping dramatic soap-opera tears that crystallize into the exact formula and key terms.',
  ],
};

const FALLBACK_CA = {
  verbs: [
    'demanda judicialment amb papers segellats a',
    'intenta cuinar al bany maria amb fúria de xef a',
    'acusa d’una traïció de telenovel·la dramàtica a',
    'intenta vendre en una teletienda de matinada espatllada',
    'interroga sota un llum de detectiu noir dels anys 50 a',
    'encalla dins d’una fotocopiadora burocràtica kafkiana',
    'repta a un duel de slapstick amb encluses de dibuixos animats a',
    'inspecciona amb una lupa gegant i tres segells de goma a',
  ],
  modifiers: [
    'cobert de mostassa antiga i lacre vermell',
    'mentre plora llàgrimes de tinta xinesa espessa',
    'cridant com un xef enfurismat colpejant una paella de coure',
    'amb gavardina xopa de pluja i bigoti postís tort',
    'envoltat de quaranta-set formularis oficials per triplicat',
    'amb música d’orgue melodramàtic i un zoom brusc de càmera',
    'relliscant amb física de dibuixos animats sobre el terra',
    'fent una olor intensa de cafè recalfat i pergamí humit',
  ],
  scenarios: [
    'L’objecte obre un calaix secret ple de figures teatrals que representen físicament cada detall del concepte.',
    'Un inspector amb lupa gegant revisa l’objecte i recita en veu alta tots els punts clau de les teves notes.',
    'En blanc i negre de cinema negre, l’objecte confessa com funciona exactament el concepte.',
    'Un funcionari diminut surt de l’objecte i segella cada paraula clau del concepte sobre la taula.',
    'L’objecte pateix un glitch de gravetat de dibuixos animats i deixa flotant a l’aire l’esquema del concepte.',
    'Un presentador de teletienda surt de darrere l’objecte demostrant el mecanisme del concepte pas a pas.',
    'L’objecte es fon com un rellotge de formatge mentre modela les peces fonamentals del concepte.',
    'Un xef furioso prova l’objecte amb una cullera de fusta i exigeix que recitis el concepte complet.',
  ],
};

function buildDynamicHeuristicMnemonic(
  physicalObject: string,
  targetConcept: string,
  notes = '',
  locale = 'es',
  styleName: string
): GenerateMnemonicResponse {
  lastVerbIdx = pickRandomDistinctIndex(8, lastVerbIdx);
  lastModifierIdx = pickRandomDistinctIndex(8, lastModifierIdx);
  lastScenarioIdx = pickRandomDistinctIndex(8, lastScenarioIdx);

  const cleanNotes = notes ? ` (${notes.slice(0, 110)})` : '';

  if (locale === 'en') {
    const verb = FALLBACK_EN.verbs[lastVerbIdx];
    const mod = FALLBACK_EN.modifiers[lastModifierIdx];
    const scen = FALLBACK_EN.scenarios[lastScenarioIdx];
    const mnemonicHook = `[${styleName}] Your "${physicalObject}" suddenly ${verb} "${targetConcept}"${cleanNotes}, ${mod}.`;
    const suggestedVisualization = `${scen}`;
    return {
      mnemonicHook,
      suggestedVisualization,
      narrativeStyle: styleName,
      mnemonic: `${mnemonicHook}\n\n👁️ ${suggestedVisualization}`,
    };
  }

  if (locale === 'ca') {
    const verb = FALLBACK_CA.verbs[lastVerbIdx];
    const mod = FALLBACK_CA.modifiers[lastModifierIdx];
    const scen = FALLBACK_CA.scenarios[lastScenarioIdx];
    const mnemonicHook = `[${styleName}] El teu "${physicalObject}" de sobte ${verb} "${targetConcept}"${cleanNotes}, ${mod}.`;
    const suggestedVisualization = `${scen}`;
    return {
      mnemonicHook,
      suggestedVisualization,
      narrativeStyle: styleName,
      mnemonic: `${mnemonicHook}\n\n👁️ ${suggestedVisualization}`,
    };
  }

  const verb = FALLBACK_ES.verbs[lastVerbIdx];
  const mod = FALLBACK_ES.modifiers[lastModifierIdx];
  const scen = FALLBACK_ES.scenarios[lastScenarioIdx];
  const mnemonicHook = `[${styleName}] Tu "${physicalObject}" de repente ${verb} "${targetConcept}"${cleanNotes}, ${mod}.`;
  const suggestedVisualization = `${scen}`;
  return {
    mnemonicHook,
    suggestedVisualization,
    narrativeStyle: styleName,
    mnemonic: `${mnemonicHook}\n\n👁️ ${suggestedVisualization}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateMnemonicRequest> & {
      title?: string;
      concept?: string;
      detailedNotes?: string;
    };

    const physicalObject = (
      body.physicalObject ??
      body.objectTitle ??
      body.title ??
      ''
    ).trim();
    const targetConcept = (body.targetConcept ?? body.concept ?? '').trim();
    const notes = (body.notes ?? body.detailedNotes ?? '').trim();
    const locale = (body.locale ?? 'es').trim();

    if (!physicalObject || !targetConcept) {
      return NextResponse.json(
        {
          error:
            'Both "physicalObject" (or "objectTitle") and "targetConcept" are required to generate a mnemonic hook.',
        },
        { status: 400 }
      );
    }

    lastStyleIdx = pickRandomDistinctIndex(NARRATIVE_STYLES.length, lastStyleIdx);
    const selectedStyle = NARRATIVE_STYLES[lastStyleIdx];

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === 'TU_CLAVE_AQUI') {
      console.warn(
        '[Mnemonic Generator] GEMINI_API_KEY is not loaded. Ensure Next.js was restarted after editing .env.local.'
      );
    } else {
      console.log('[Mnemonic Generator] Calling Gemini 2.0 Flash...');
      try {
        const ai = new GoogleGenAI({ apiKey });

        const languageName =
          locale === 'en' ? 'English' : locale === 'ca' ? 'Catalan' : 'Spanish';

        const prompt = `Act as an eccentric, pedagogical memory champion.
Combine the physical object and target concept into a bizarre, vivid, and sarcastic narrative anchor adhering strictly to the Method of Loci.
Respond in ${languageName}.

MANDATORY NARRATIVE STYLE FOR THIS GENERATION:
"${selectedStyle}"

DIRECT SEMANTIC ANCHORING REQUIREMENT:
You MUST create a direct, physical cause-and-effect interaction between the specific properties of "${physicalObject}" and the core mechanism of "${targetConcept}".

NEGATIVE CONSTRAINTS:
FORBIDDEN: Never use 'chispas de neón', 'ruido ensordecedor', 'rayos láser', or generic futuristic glowing tropes. Each hook must feature an ultra-specific, physical, sensory-rich interaction between the object and the concept.

INPUTS:
- Physical Object (Locus Anchor): "${physicalObject}"
- Target Concept: "${targetConcept}"
- Detailed Notes: "${notes || 'N/A'}"
- Unique Entropy Seed: ${Date.now()}_${Math.random().toString(36).slice(2, 9)}

Return strict JSON with:
- "mnemonicHook": A sharp, ironic, unforgettable 1-2 sentence narrative hook in the "${selectedStyle}" style directly anchoring "${physicalObject}" to "${targetConcept}".
- "suggestedVisualization": Concrete tactile & multisensory imagery instructions (textures, smells, physical comedy, absurd mechanics) to lock the scene into spatial memory.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 1.2,
            topP: 0.95,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mnemonicHook: {
                  type: Type.STRING,
                  description:
                    'Bizarre, vivid, and sarcastic narrative anchor in the requested style.',
                },
                suggestedVisualization: {
                  type: Type.STRING,
                  description:
                    'Tactile, sensory-rich mental imagery instructions adhering to the Method of Loci.',
                },
              },
              required: ['mnemonicHook', 'suggestedVisualization'],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as Partial<GenerateMnemonicResponse>;
          if (
            parsed.mnemonicHook &&
            typeof parsed.mnemonicHook === 'string' &&
            parsed.suggestedVisualization &&
            typeof parsed.suggestedVisualization === 'string'
          ) {
            console.log(
              '[Gemini Hook] Generated fresh mnemonic via Gemini 2.0 Flash for:',
              physicalObject,
              '->',
              targetConcept
            );
            const hook = parsed.mnemonicHook.trim();
            const viz = parsed.suggestedVisualization.trim();
            return NextResponse.json(
              {
                mnemonicHook: hook,
                suggestedVisualization: viz,
                narrativeStyle: selectedStyle,
                mnemonic: `${hook}\n\n👁️ ${viz}`,
              },
              { status: 200 }
            );
          }
        }
      } catch (aiError) {
        console.warn(
          '[Mnemonic Generator] Gemini call failed, falling back to randomized heuristic generator:',
          aiError instanceof Error ? aiError.message : aiError
        );
      }
    }

    const fallback = buildDynamicHeuristicMnemonic(
      physicalObject,
      targetConcept,
      notes,
      locale,
      selectedStyle
    );
    return NextResponse.json(fallback, { status: 200 });
  } catch (err) {
    console.error('Error in /api/generate-mnemonic:', err);
    return NextResponse.json(
      { error: 'Failed to generate mnemonic hook.' },
      { status: 500 }
    );
  }
}
