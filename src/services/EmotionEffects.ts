
export const EMOTION_EFFECTS = {
  // Core emotional markers (must be at sentence beginning for English)
  emotional: [
    '(angry)', '(sad)', '(disdainful)', '(excited)', '(surprised)', '(satisfied)', 
    '(unhappy)', '(anxious)', '(hysterical)', '(delighted)', '(scared)', '(worried)', 
    '(indifferent)', '(upset)', '(impatient)', '(nervous)', '(guilty)', '(scornful)', 
    '(frustrated)', '(depressed)', '(panicked)', '(furious)', '(empathetic)', 
    '(embarrassed)', '(reluctant)', '(disgusted)', '(keen)', '(moved)', '(proud)', 
    '(relaxed)', '(grateful)', '(confident)', '(interested)', '(curious)', '(confused)', 
    '(joyful)', '(disapproving)', '(negative)', '(denying)', '(astonished)', '(serious)', 
    '(sarcastic)', '(conciliative)', '(comforting)', '(sincere)', '(sneering)', 
    '(hesitating)', '(yielding)', '(painful)', '(awkward)', '(amused)'
  ],

  // Tone control markers (can be placed anywhere)
  toneControl: [
    '(in a hurry tone)', '(shouting)', '(screaming)', '(whispering)', '(soft tone)'
  ],

  // Paralinguistic markers (can be placed anywhere) - with vocal sounds
  paralinguistic: [
    '(laughing) hahaha!', '(chuckling) hmmhmm.', '(sobbing)', '(crying loudly)', '(sighing)', 
    '(panting)', '(groaning)', '(crowd laughing)', '(background laughter)', '(audience laughing)'
  ]
};

export const EMOTION_USAGE_RULES = `
EMOTION CONTROL RULES:
- Use ONLY the approved emotion effects from the available list
- Emotional markers must be placed at the beginning of sentences
- Tone control and paralinguistic markers can be placed anywhere
- Always include parentheses around effect words - ALL LOWERCASE LETTERS ONLY
- (laughing) automatically includes "hahaha!" - (chuckling) includes "hmmhmm."
- Don't overuse - use purposefully for maximum impact
- CRITICAL: All emotion words must be lowercase (angry, not Angry)

EXAMPLES:
- When he heard the punchline, he couldn't help it, (laughing) hahaha!
- That's quite amusing, (chuckling) hmmhmm.
- (shouting) This is our chance! (NOT: This is our chance (shouting)!)
`;
