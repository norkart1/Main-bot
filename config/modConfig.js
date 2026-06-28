const SPAM_LINK_PATTERNS = [
  /discord\.gg\/(?!official)[a-zA-Z0-9]+/i,
  /discordapp\.com\/invite\//i,
  /bit\.ly\//i,
  /tinyurl\.com\//i,
  /free\s*nitro/i,
  /steam\s*gift/i,
  /click\s*here\s*to\s*claim/i,
  /you\s*won\s*a/i,
];

const SPAM_PATTERNS = [
  /(.)\1{9,}/,
  /^[A-Z\s!?.]{30,}$/,
];

function quickCheck(content) {
  for (const p of SPAM_LINK_PATTERNS) {
    if (p.test(content)) return { violation: true, reason: 'Spam link or invite detected', action: 'delete' };
  }
  for (const p of SPAM_PATTERNS) {
    if (p.test(content)) return { violation: true, reason: 'Spam message detected', action: 'delete' };
  }
  return null;
}

const AI_MOD_ENABLED = true;
const AI_MOD_MIN_LENGTH = 4;

module.exports = { quickCheck, AI_MOD_ENABLED, AI_MOD_MIN_LENGTH };
