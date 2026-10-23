/** Everything up to and including the last space, so the last word can stay with the ↗ arrow. */
export const lead = (text: string) => text.slice(0, text.lastIndexOf(' ') + 1);
export const lastWord = (text: string) => text.slice(text.lastIndexOf(' ') + 1);
