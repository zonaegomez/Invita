export interface FamilyEntry {
  id: string;
  familyLabel: string;
  names: string[];
  normalizedNames: string[];
  maxGuests: number;
  phone?: string | null;
}

export interface FamilyImportRow {
  familyLabel: string;
  names: string[];
  maxGuests: number;
  phone?: string;
}
