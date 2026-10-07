export const CONTACTS_KEY = "contact_details";

export const defaultContacts = {
  address: "<p>Via Nazionale, 34<br>98077 Santo Stefano di Camastra (ME)</p>",
  phone: "0921 995719",
  email: "gianninobistrotcafe@gmail.com",
  instagram: "giannino.bistrot",
  hours: "<p>Lunedì – Domenica</p><p>Giovedì chiuso</p>",
  mapAddress: "Via Nazionale 34, 98077 Santo Stefano di Camastra ME",
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