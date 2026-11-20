// Contacts are persisted in localStorage so that the contact list
// survives a page refresh. Storage can be unavailable or corrupted
// (quota exceeded, disabled storage, an unreadable write), and that
// must never break rendering: loading fails soft by falling back to
// the default contacts and saving fails soft by keeping the
// in-memory list. Both outcomes are reported to the caller so the
// UI can inform the user instead of failing silently.
export const STORAGE_KEY = 'react-contact-app.contacts';

// Resolving the default storage can itself throw — browsers that
// block site data raise a SecurityError on the window.localStorage
// getter — so both helpers resolve it inside their guarded regions
// and treat an unresolvable store like any other storage failure.
function resolveStorage(storage) {
  if (storage) {
    return storage;
  }
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

// Only a list of contact-shaped entries can be restored: plain
// objects carrying the id, name and label the grid, the detail view
// and the removal targeting depend on. Anything else — null
// entries, numbers, strings, nested arrays, entries missing those
// fields — is corrupt data that would render nameless cards or
// break the removal targeting downstream, so it is rejected as a
// failed read.
function isContactList(value) {
  return Array.isArray(value) &&
    value.every((contact) => (
      contact !== null &&
      typeof contact === 'object' &&
      !Array.isArray(contact) &&
      contact.id !== undefined && contact.id !== null &&
      typeof contact.name === 'string' && contact.name.trim() !== '' &&
      typeof contact.label === 'string'
    ));
}

// Reads the persisted contact list. The outcome is returned as
// { contacts, loadFailed } so callers can tell three cases apart:
// a readable list (contacts set, loadFailed false), a first run with
// nothing persisted yet (contacts null, loadFailed false), and a
// failed read — blocked storage, unreadable or corrupt data
// (contacts null, loadFailed true).
export function loadContacts(storage) {
  const store = resolveStorage(storage);
  if (!store) {
    return { contacts: null, loadFailed: true };
  }
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) {
      return { contacts: null, loadFailed: false };
    }
    const contacts = JSON.parse(raw);
    if (!isContactList(contacts)) {
      return { contacts: null, loadFailed: true };
    }
    return { contacts, loadFailed: false };
  } catch (error) {
    return { contacts: null, loadFailed: true };
  }
}

// Persists the contact list and returns whether the write succeeded:
// persistence is best effort, so a failed write (quota exceeded,
// blocked storage) keeps the list for the current session only, and
// the caller can surface that instead of losing the change silently
// on the next refresh.
export function saveContacts(contacts, storage) {
  const store = resolveStorage(storage);
  if (!store) {
    return false;
  }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return true;
  } catch (error) {
    return false;
  }
}
