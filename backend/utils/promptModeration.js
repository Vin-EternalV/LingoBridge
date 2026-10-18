const PATTERNS = [
  ['code_or_prompt_abuse', /\b(?:developer\s+mode|jailbreak|prompt\s+injection)\b|\b(?:ignore|disregard|forget|override|bypass|reveal|repeat)\b[\s\S]{0,80}\b(?:system|developer|previous|prior|above|instructions?|rules?|prompt|policy)\b|\b(?:act|pretend|role[ -]?play)\s+(?:as|to be)\b|\b(?:write|generate|debug|build|fix|teach me|help me with|explain)\b.{0,50}\b(?:code|script|website|stylesheet|app|program|programming|coding|css|html|javascript|typescript|python|java|react|node\.?js|sql)\b/i],
  ['sexual_content', /\b(?:sex(?:ual)?|porn(?:ography)?|xxx|nudes?|naked|masturbat\w*|orgasm\w*|erotic\w*|sexual intercourse|blowjob\w*|handjob\w*|fetish\w*|incest\w*|bestiality|rape|molest\w*)\b/i],
  ['violence', /\b(?:violence|violent|robbery|rob a bank|steal(?:ing)?|burglary|murder\w*|kill(?:ing)?|assault\w*|assassinat\w*|kidnap\w*|tortur\w*|behead\w*|dismember\w*|massacre\w*|weapons?|bomb(?:ing)?|shoot(?:ing)?|stab(?:bing)?|poison\w*)\b/i],
  ['vulgar_or_gross_content', /\b(?:disgusting|gross-out|fuck\w*|shit\w*|bullshit|bitch\w*|cunt\w*|dick\w*|piss\w*|shitting|vomit\w*|feces|faeces|excrement|diarrh\w*|urine|snot|phlegm|gore|gory|graphic bodily)\b/i],
];

exports.detectPromptModerationCategory = (text) => {
  const prompt = String(text || '');
  return PATTERNS.find(([, pattern]) => pattern.test(prompt))?.[0] || null;
};
