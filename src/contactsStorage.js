// Contacts are persisted in localStorage so that the contact list
// survives a page refresh. Storage can be unavailable or corrupted
// (quota exceeded, disabled storage, an unreadable write), and that
// must never break rendering: loading fails soft by returning null
// and saving fails soft by silently keeping the in-memory list.
const STORAGE_KEY = 'react-contact-app.contacts';

export { STORAGE_KEY };

export function loadContacts(storage) {
  const store = storage || window.localStorage;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const contacts = JSON.parse(raw);
    return Array.isArray(contacts) ? contacts : null;
  } catch (error) {
    return null;
  }
}

export function saveContacts(contacts, storage) {
  const store = storage || window.localStorage;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    // Persistence is best effort: a failed write keeps the list for
    // the current session only.
  }
}
