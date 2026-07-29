export interface PetAge {
  years: number;
  months: number;
}

export function calculatePetAge(
  birthDate: string | Date | null | undefined,
): PetAge | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const now = new Date();
  if (birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
}
