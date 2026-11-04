// Small jokes that pop up next to the chat button now and then, so learners
// notice the chat exists. Same cheeky tone as prompts/ask-french.md.
// Claude draft for Jerry: edit freely, one line each, keep them short.

export const ASK_TEASERS = [
  "Need help with French? I don't sigh like your teacher did.",
  "Can I help? You look confused. Lovingly.",
  "Stuck on a word? Ask me. I'll only laugh a little.",
  "Got a French question? I have answers and mild judgement.",
  "How can I help? Cheaper than a trip to Paris.",
  "Lost in French? I'm your GPS. No sighing when you miss a turn.",
  "Need a hand? I have none, but I know French.",
  "Le, la or les? Ask me before you guess again.",
  "I can help with French. Your life choices, less so.",
  "Psst. Questions about French? I'm right here, judging quietly.",
] as const;

/** One teaser at random. `random` is a parameter so tests can fix it. */
export function pickTeaser(random: () => number = Math.random): string {
  return ASK_TEASERS[Math.floor(random() * ASK_TEASERS.length)];
}
