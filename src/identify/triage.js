// ============================================================
//  Triage — pure. Maps a user's reported tinnitus PATTERN to
//  "when to see a clinician" guidance. This is EDUCATION + TRIAGE,
//  never a diagnosis: we surface possibilities and red flags, and
//  we never name a cause. Severity drives urgency, not certainty.
//
//  Sources: AAO-HNS 2014 CPG; standard ENT red-flag guidance
//  (pulsatile → vascular workup; unilateral → MRI/acoustic neuroma;
//  sudden + hearing loss → urgent SSNHL window). See docs/BACKBONE.md §3.2.
// ============================================================

export const SEVERITY_RANK = { emergency: 3, urgent: 2, 'see-clinician': 1, info: 0 };

const ONE_SIDED = new Set(['left', 'right']);

/**
 * @param {{character, laterality, timing, onset, symptoms: string[]}} input
 * @returns {{ flags: Array, topSeverity: string }}
 */
export function triage(input = {}) {
  const { character, laterality, timing, onset } = input;
  const symptoms = new Set(input.symptoms || []);
  const flags = [];
  const add = (id, severity, title, message, action) => flags.push({ id, severity, title, message, action });

  // ── EMERGENCY ──
  if (onset === 'sudden' && symptoms.has('hearingLoss')) {
    add('sudden-hearing-loss', 'emergency',
      'Sudden tinnitus with hearing loss',
      'Sudden hearing loss alongside new tinnitus can be a medical emergency that is most treatable within the first days.',
      'Seek urgent medical care now (same day).');
  }
  if (symptoms.has('neuro')) {
    add('neuro', 'emergency',
      'Tinnitus with neurological symptoms',
      'New weakness, facial droop, severe sudden headache, or difficulty speaking alongside tinnitus needs emergency assessment.',
      'Call emergency services.');
  }

  // ── URGENT ──
  if (timing === 'pulsatile' || character === 'pulsatile') {
    add('pulsatile', 'urgent',
      'Pulsatile tinnitus (in time with your heartbeat)',
      'A whooshing that pulses with your heartbeat can reflect a blood-flow (vascular) cause that benefits from investigation.',
      'See a doctor and mention "pulsatile tinnitus".');
  }

  // ── SEE A CLINICIAN ──
  if (ONE_SIDED.has(laterality)) {
    add('unilateral', 'see-clinician',
      'One-sided (asymmetric) tinnitus',
      'Tinnitus clearly in only one ear is usually benign, but asymmetry is worth checking to rule out treatable causes.',
      'Ask a doctor/audiologist about asymmetric tinnitus (they may suggest a hearing test or MRI).');
  }
  if (symptoms.has('vertigo') || symptoms.has('fullness')) {
    add('meniere-pattern', 'see-clinician',
      'Tinnitus with vertigo or ear fullness',
      'Tinnitus combined with spinning dizziness, fullness, or fluctuating hearing is a pattern an ENT can evaluate.',
      'See an ENT or audiologist.');
  }
  if (symptoms.has('earPainOrDischarge') || symptoms.has('fever')) {
    add('infection', 'see-clinician',
      'Tinnitus with ear pain, discharge or fever',
      'These can accompany an ear infection, which is treatable.',
      'See a doctor — your ear can be examined.');
  }
  if (symptoms.has('blockedMuffled')) {
    add('earwax', 'see-clinician',
      'Recent tinnitus with a blocked or muffled feeling',
      'A blocked sensation can accompany earwax build-up — often simple to check and frequently reversible.',
      'A clinician or pharmacist can check for earwax.');
  }

  // ── INFO ──
  if (character === 'clicking' || timing === 'rhythmic') {
    add('somatic-clicking', 'info',
      'Clicking or rhythmic sound (not your heartbeat)',
      'A regular clicking can come from tiny muscle or jaw (TMJ) activity rather than the inner ear. Sound therapy is usually less relevant for this type.',
      'Mention it to a clinician if it persists or bothers you.');
  }

  // Always present.
  add('not-a-diagnosis', 'info',
    'This is not a diagnosis',
    'Tinnitus is a symptom, not a disease, and the sound you hear cannot reliably identify its cause. These notes describe possibilities and when to get checked.',
    'If in doubt, or if anything changes, see a professional.');

  flags.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const topSeverity = flags.reduce((m, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[m] ? f.severity : m), 'info');
  return { flags, topSeverity };
}
