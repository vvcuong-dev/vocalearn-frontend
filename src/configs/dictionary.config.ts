export const dictionaryConfig = {
  suggestPath: "/dictionary/suggest",
  lookupPath: "/dictionary/lookup",
  audioFileBaseUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/",
  audioSourceBaseUrl: "https://commons.wikimedia.org/wiki/File:",
};

export function dictionaryQuery(path: string, term: string) {
  return `${path}?q=${encodeURIComponent(term.trim())}`;
}

export function pronunciationSourceUrl(audioUrl: string): string | null {
  return audioUrl.startsWith(dictionaryConfig.audioFileBaseUrl)
    ? dictionaryConfig.audioSourceBaseUrl + audioUrl.slice(dictionaryConfig.audioFileBaseUrl.length)
    : null;
}
