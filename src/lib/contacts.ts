export const CONTACTS_KEY = "contact_details";

export const defaultContacts = {
  address: "<p>Via Garibaldi, 14<br>98077 Santo Stefano di Camastra (ME)</p>",
  phone: "0921 331748",
  email: "trattoriadagiannino1974@gmail.com",
  instagram: "trattoriadagiannino1974",
  hours: "<p>Lun - Sab: 12:30 - 14:30 | 19:30 - 21:30</p><p>Dom: 12:30 - 14:30</p><p>Chiuso il Giovedì </p>",
  mapAddress: "Via Garibaldi, 14 98077 Santo Stefano di Camastra (ME)",
  addressVisible: true,
  phoneVisible: true,
  emailVisible: true,
  instagramVisible: true,
  hoursVisible: true,
  mapVisible: true,
};

export type ContactDetails = typeof defaultContacts;

export function parseContacts(value?: string): ContactDetails {
  if (!value) return { ...defaultContacts };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return { ...defaultContacts };
    const result = { ...defaultContacts };
    for (const key of Object.keys(defaultContacts) as (keyof ContactDetails)[]) {
      const candidate = (parsed as Record<string, unknown>)[key];
      if (typeof candidate === typeof defaultContacts[key]) {
        Object.assign(result, { [key]: candidate });
      }
    }
    return result;
  } catch {
    return { ...defaultContacts };
  }
}

export function mapsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}