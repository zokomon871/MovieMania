const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  try {
    const upper = code.toUpperCase();
    return String.fromCodePoint(
      0x1f1e6 + upper.charCodeAt(0) - 65,
      0x1f1e6 + upper.charCodeAt(1) - 65
    );
  } catch {
    return '🏳️';
  }
}

export function getCountryName(code: string): string {
  if (!code) return 'Unknown';
  if (code.toUpperCase() === 'INT') return 'International';
  if (code.toUpperCase() === 'ALL') return 'All Countries';
  try {
    return regionNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
