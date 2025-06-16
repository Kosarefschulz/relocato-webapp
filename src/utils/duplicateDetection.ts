import { Customer } from '../types';

// Normalisierung von Telefonnummern für besseren Vergleich
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)\/\+]/g, '');
};

// Normalisierung von E-Mail-Adressen
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Berechnung der Levenshtein-Distanz für ähnliche Namen
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
};

// Ähnlichkeitsprüfung für Namen
const areNamesSimilar = (name1: string, name2: string, threshold: number = 0.85): boolean => {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  // Exakte Übereinstimmung
  if (n1 === n2) return true;
  
  // Levenshtein-basierte Ähnlichkeit
  const maxLen = Math.max(n1.length, n2.length);
  const distance = levenshteinDistance(n1, n2);
  const similarity = 1 - distance / maxLen;
  
  return similarity >= threshold;
};

// Duplikat-Score berechnen
export interface DuplicateScore {
  customer: Customer;
  score: number;
  matchedFields: string[];
  isExactMatch: boolean;
}

export const calculateDuplicateScore = (
  newCustomer: Partial<Customer>,
  existingCustomer: Customer
): DuplicateScore => {
  let score = 0;
  const matchedFields: string[] = [];
  
  // E-Mail-Vergleich (höchste Gewichtung)
  if (newCustomer.email && existingCustomer.email) {
    if (normalizeEmail(newCustomer.email) === normalizeEmail(existingCustomer.email)) {
      score += 40;
      matchedFields.push('E-Mail');
    }
  }
  
  // Telefonnummer-Vergleich (hohe Gewichtung)
  if (newCustomer.phone && existingCustomer.phone) {
    if (normalizePhone(newCustomer.phone) === normalizePhone(existingCustomer.phone)) {
      score += 35;
      matchedFields.push('Telefonnummer');
    }
  }
  
  // Namen-Vergleich (mittlere Gewichtung)
  if (newCustomer.name && existingCustomer.name) {
    if (areNamesSimilar(newCustomer.name, existingCustomer.name)) {
      score += 25;
      matchedFields.push('Name');
    }
  }
  
  // Adress-Vergleich (zusätzliche Punkte)
  if (newCustomer.fromAddress && existingCustomer.fromAddress) {
    if (newCustomer.fromAddress.toLowerCase().includes(existingCustomer.fromAddress.toLowerCase()) ||
        existingCustomer.fromAddress.toLowerCase().includes(newCustomer.fromAddress.toLowerCase())) {
      score += 10;
      matchedFields.push('Aktuelle Adresse');
    }
  }
  
  if (newCustomer.toAddress && existingCustomer.toAddress) {
    if (newCustomer.toAddress.toLowerCase().includes(existingCustomer.toAddress.toLowerCase()) ||
        existingCustomer.toAddress.toLowerCase().includes(newCustomer.toAddress.toLowerCase())) {
      score += 10;
      matchedFields.push('Zieladresse');
    }
  }
  
  // Umzugsdatum (wenn sehr nah beieinander)
  if (newCustomer.movingDate && existingCustomer.movingDate) {
    const date1 = new Date(newCustomer.movingDate);
    const date2 = new Date(existingCustomer.movingDate);
    const diffDays = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      score += 5;
      matchedFields.push('Umzugsdatum (±7 Tage)');
    }
  }
  
  const isExactMatch = score >= 75; // 75% oder mehr = sehr wahrscheinlich Duplikat
  
  return {
    customer: existingCustomer,
    score,
    matchedFields,
    isExactMatch
  };
};

// Hauptfunktion zur Duplikat-Erkennung
export const findPotentialDuplicates = (
  newCustomer: Partial<Customer>,
  existingCustomers: Customer[],
  scoreThreshold: number = 30 // Mindestens 30% Übereinstimmung
): DuplicateScore[] => {
  const duplicates: DuplicateScore[] = [];
  
  for (const existingCustomer of existingCustomers) {
    const duplicateScore = calculateDuplicateScore(newCustomer, existingCustomer);
    
    if (duplicateScore.score >= scoreThreshold) {
      duplicates.push(duplicateScore);
    }
  }
  
  // Nach Score sortieren (höchster zuerst)
  return duplicates.sort((a, b) => b.score - a.score);
};

// Empfehlung basierend auf Duplikat-Score
export const getDuplicateRecommendation = (score: DuplicateScore): {
  severity: 'high' | 'medium' | 'low';
  message: string;
  action: string;
} => {
  if (score.score >= 75) {
    return {
      severity: 'high',
      message: `Sehr wahrscheinlich ein Duplikat! Übereinstimmung bei: ${score.matchedFields.join(', ')}`,
      action: 'Bitte prüfen Sie, ob dieser Kunde bereits existiert.'
    };
  } else if (score.score >= 50) {
    return {
      severity: 'medium',
      message: `Mögliches Duplikat gefunden. Übereinstimmung bei: ${score.matchedFields.join(', ')}`,
      action: 'Vergleichen Sie die Kundendaten sorgfältig.'
    };
  } else {
    return {
      severity: 'low',
      message: `Ähnlicher Kunde gefunden. Teilweise Übereinstimmung bei: ${score.matchedFields.join(', ')}`,
      action: 'Möglicherweise ein anderer Kunde mit ähnlichen Daten.'
    };
  }
};