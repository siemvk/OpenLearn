// Eenvoudige typfoutdetectie: Levensvatbare suggestie voor kleine fouten
export function detectTypfout(userInput: string, answer: string): boolean {
  // Normaliseer: lowercase, trim, geen accenten
  const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const a = normalize(userInput);
  const b = normalize(answer);
  if (a === b) return false; // geen typfout, gewoon goed
  // Levenshtein-afstand <= 1: kleine typfout toestaan
  return levenshtein(a, b) === 1;
}

// Levenshtein distance (minimale bewerkingen)
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // verwijderen
          matrix[i][j - 1] + 1,    // invoegen
          matrix[i - 1][j - 1] + 1 // vervangen
        );
      }
    }
  }
  return matrix[a.length][b.length];
}
