import React from 'react';
import './App.css';
import { loadContacts, saveContacts } from './contactsStorage';

// A phone number is valid when it contains at least one digit and no
// characters outside digits, spaces and the common separators + - ( ).
// An empty value is allowed: the field is optional.
export function isValidPhone(value) {
  const digits = String(value).replace(/[\s+()-]/g, '');
  if (digits === '') {
    return String(value).trim() === '';
  }
  return /^\d+$/.test(digits);
}

// An email address is valid when it has a local part and a domain,
// separated by a single @, and a well-formed dotted domain (e.g.
// name@example.com). Values like "foo@bar" are rejected, as are
// domains with consecutive or trailing dots ("a@b..com", "a@b.com.").
// An empty value is allowed: the field is optional, like the phone field.
export function isValidEmail(value) {
  const trimmed = String(value).trim();
  if (trimmed === '') {
    return true;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return false;
  }
  // The shape check above lets the dot-containing character classes
  // absorb extra dots, so reject malformed domains explicitly.
  const domain = trimmed.slice(trimmed.indexOf('@') + 1);
  return !domain.includes('..') && !domain.endsWith('.');
}

// The demo details opened for every contact card and inherited by the
// default record below, so the shared values exist exactly once.
const DEMO_CONTACT = {
  phone: '9988776655',
  address: 'JDoe 1120',
  birthday: '11-1-2020',
};

// The contact details shown when no card is open; also the state the
// detail view is reset to after a contact has been removed.
const DEFAULT_CONTACT = {
  name: 'John Doe',
  email: 'jdoe@redhat.com',
  ...DEMO_CONTACT,
};

// The contacts shown in the grid. Each contact carries a stable id and
// the label rendered on its card, so a removal targets exactly one
// card. The list doubles as the first-run demo list: it is restored
// from localStorage so it survives a page refresh, and once a contact
// is added the persisted list (which starts from these entries)
// becomes the source of truth.
const DEFAULT_CONTACTS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
].map((label, index) => ({
  id: index + 1,
  label,
  name: 'Deepesh Nair',
  email: 'denair@redhat.com',
  ...DEMO_CONTACT,
}));

// Status notices for the persistence outcomes, rendered with
// role="status" so assistive technology announces them.
const LOAD_FAILED_NOTICE =
  'Your saved contacts could not be read. Showing the default contacts.';
const SAVE_FAILED_NOTICE =
  'Contacts could not be saved. Your changes will be lost when the ' +
  'page is refreshed. Try again, or copy your contacts before ' +
  'leaving the page.';

// Contacts added at runtime get their id from a timestamp paired
// with a monotonic counter, so two adds within the same millisecond
// (e.g. a rapid double-click reading the same state twice) can
// never produce colliding ids.
let addedContactSeq = 0;

export class Modal extends React.Component {
  constructor(props) {
    super(props);
    // Read the persisted list before building the state, so a
    // failed read (blocked storage, corrupt data) can be reported
    // while the demo contacts keep the app usable.
    const stored = loadContacts();
    this.state = {
      ...DEFAULT_CONTACT,
      // The contact cards currently shown; removals delete from this
      // list so the grid stays in sync with the modal actions. The
      // list is restored from localStorage so it survives a page
      // refresh; the demo contacts are the first-run default.
      contacts: stored.contacts || DEFAULT_CONTACTS,
      // Non-blocking notice shown when the persisted list could not
      // be read: the demo contacts are shown instead, and the user
      // is told rather than left to discover the swap silently.
      storageNotice: stored.loadFailed ? LOAD_FAILED_NOTICE : null,
      // The id of the contact whose details are displayed in the modal;
      // this is the contact the Remove action targets. It is null
      // while no card is open, and Remove is gated on a selection.
      selectedContactId: null,
      // Whether the remove-confirmation dialog is shown. Deletion is
      // two-step by design: the Remove button only opens this dialog
      // and the contact is deleted solely on an explicit confirm.
      confirmingRemove: false,
      // Status message announcing a completed removal; rendered with
      // role="status" so assistive technology picks it up.
      removalNotice: null,
      // Status message announcing a completed add; rendered with
      // role="status" like the removal notice.
      addNotice: null,
      // Whether the contact detail modal is shown. Its open state is
      // managed here in React rather than via Bootstrap's data-toggle,
      // so the modal can also be closed programmatically — notably
      // after a confirmed removal, before focus moves back to the
      // grid. This also keeps Bootstrap's own modal focus enforcement
      // out of the way of the confirmation dialog's focus handling.
      detailModalOpen: false,
      // Whether the user has typed in a field; a card click must never
      // clobber a value the user is editing.
      nameEdited: false,
      phoneEdited: false,
      emailEdited: false,
      addressEdited: false,
      birthdayEdited: false,
    };
  }
  handleClick(contactInfo) {
    const { phone, email, ...contact } = contactInfo;
    this.setState((prevState) => ({
      // Gate: an invalid phone or email value is never persisted — when
      // one is passed, the update is refused and the current value is
      // kept. A valid value is only applied while the user has not
      // edited the field, so a card click cannot clobber the value
      // being typed. The same protection applies to the free-form
      // fields.
      name:
        contact.name !== undefined && !prevState.nameEdited
          ? contact.name
          : prevState.name,
      phone:
        phone !== undefined && isValidPhone(phone) && !prevState.phoneEdited
          ? phone
          : prevState.phone,
      email:
        email !== undefined && isValidEmail(email) && !prevState.emailEdited
          ? email
          : prevState.email,
      address:
        contact.address !== undefined && !prevState.addressEdited
          ? contact.address
          : prevState.address,
      birthday:
        contact.birthday !== undefined && !prevState.birthdayEdited
          ? contact.birthday
          : prevState.birthday,
      // Reset the edit latches together with the card's fields so the
      // next card click can apply its values. The gates above still
      // read the pre-click flags, so a value the user is actively
      // typing (the keystroke that armed a latch between clicks) is
      // never clobbered by this click.
      nameEdited: false,
      phoneEdited: false,
      emailEdited: false,
      addressEdited: false,
      birthdayEdited: false,
    }));
  }

  // Adds the contact currently shown in the modal to the contact list
  // and persists the list to localStorage, so it survives a page
  // refresh. An empty name or an invalid phone or email value is
  // never persisted. The add is announced via a status message, the
  // form resets to the defaults for the next entry, and a failed
  // write is reported instead of silently losing the change on the
  // next refresh.
  handleAddContact() {
    const { contacts, name, email, phone, address, birthday } = this.state;
    if (String(name).trim() === '' ||
        !isValidEmail(email) || !isValidPhone(phone)) {
      return;
    }
    const contact = {
      id: `contact-${Date.now()}-${addedContactSeq++}`,
      label: String(name).trim().charAt(0).toUpperCase() || '?',
      name,
      email,
      phone,
      address,
      birthday,
    };
    const nextContacts = [...contacts, contact];
    const saved = saveContacts(nextContacts);
    this.setState({
      contacts: nextContacts,
      // The form reset to the defaults no longer shows the selected
      // contact, so the selection must not survive the add: Remove
      // is disabled until a card is clicked again, and a pending
      // confirmation is dismissed so it can never name one contact
      // while deleting another.
      selectedContactId: null,
      confirmingRemove: false,
      // Reset the detail form to the defaults so the next contact
      // starts from a clean slate, and re-arm the edit latches so a
      // card click applies its values again.
      ...DEFAULT_CONTACT,
      nameEdited: false,
      phoneEdited: false,
      emailEdited: false,
      addressEdited: false,
      birthdayEdited: false,
      // Announce the add so screen reader users and users behind
      // the modal overlay learn that the contact was appended.
      addNotice: `${name} was added to your contacts.`,
      storageNotice: saved ? null : SAVE_FAILED_NOTICE,
    });
  }

  handleNameChange(event) {
    this.setState({ name: event.target.value, nameEdited: true });
  }

  handlePhoneChange(event) {
    this.setState({ phone: event.target.value, phoneEdited: true });
  }

  handleEmailChange(event) {
    this.setState({ email: event.target.value, emailEdited: true });
  }

  // The address and birthday inputs are controlled so their displayed
  // values follow the detail-view resets (after a removal or a modal
  // close) instead of keeping whatever the user last typed. The edit
  // latches keep a card click from clobbering a value being edited,
  // and make an added contact capture what the user typed.
  handleAddressChange(event) {
    this.setState({ address: event.target.value, addressEdited: true });
  }

  handleBirthdayChange(event) {
    this.setState({ birthday: event.target.value, birthdayEdited: true });
  }

  handleCardClick(contact, event) {
    // Remember which card opened the dialog so focus can return to it
    // when the detail modal is closed again.
    this.openerCard = event ? event.currentTarget : null;
    // Selecting a card opens the detail modal and dismisses any
    // pending remove confirmation, so an open confirmation can never
    // retarget to a contact the user did not ask to remove.
    this.setState({
      selectedContactId: contact.id,
      removalNotice: null,
      addNotice: null,
      confirmingRemove: false,
      detailModalOpen: true,
    }, () => {
      // Move focus into the dialog when it opens, so keyboard users
      // are not left on the grid behind the modal backdrop.
      this.focusDetailModal();
    });
    this.handleClick(contact);
  }

  // Close the detail modal without removing anything: any pending
  // remove confirmation is dismissed, the detail view is reset to
  // the defaults, and focus returns to the card that opened the
  // dialog so the user can continue from where they left the grid.
  handleDetailModalClose() {
    this.setState({
      detailModalOpen: false,
      confirmingRemove: false,
      selectedContactId: null,
      ...DEFAULT_CONTACT,
      nameEdited: false,
      phoneEdited: false,
      emailEdited: false,
      addressEdited: false,
      birthdayEdited: false,
    });
    if (this.openerCard && document.contains(this.openerCard)) {
      this.openerCard.focus();
    }
  }

  // Move keyboard focus into the detail modal when it opens; the
  // Close button is its first non-destructive control.
  focusDetailModal() {
    if (this.detailCloseButton) {
      this.detailCloseButton.focus();
    }
  }

  handleRemoveRequest() {
    // Gate: the confirmation dialog only opens when a card is
    // selected — with no selection there is nothing to remove, and
    // opening the dialog would present a no-op as a real removal.
    if (this.state.selectedContactId === null) {
      return;
    }
    this.setState({ confirmingRemove: true });
  }

  handleRemoveCancel() {
    this.setState({ confirmingRemove: false });
    this.focusRemoveButton();
  }

  handleRemoveConfirm() {
    // Gate: confirming without a selection deletes nothing; the only
    // effect is closing the dialog.
    if (this.state.selectedContactId === null) {
      this.setState({ confirmingRemove: false });
      return;
    }
    const nextContacts = this.state.contacts.filter(
      (contact) => contact.id !== this.state.selectedContactId
    );
    // Persist the removal so the contact stays gone after a page
    // refresh; the persisted list is the source of truth. A failed
    // write is reported instead of silently resurfacing the contact
    // after the next refresh.
    const saved = saveContacts(nextContacts);
    this.setState((prevState) => ({
      contacts: nextContacts,
      selectedContactId: null,
      confirmingRemove: false,
      // Close the detail modal: the contact it showed is gone, and
      // with the modal closed, moving focus back to the grid no
      // longer breaks the focus containment of an open dialog.
      detailModalOpen: false,
      // Reset the detail view to the defaults so the removed
      // contact's data is no longer presented as current.
      ...DEFAULT_CONTACT,
      nameEdited: false,
      phoneEdited: false,
      emailEdited: false,
      addressEdited: false,
      birthdayEdited: false,
      // Announce the removal so screen reader users learn that the
      // contact was deleted (rendered with role="status").
      removalNotice: `${prevState.name} was removed from your contacts.`,
      storageNotice: saved ? null : SAVE_FAILED_NOTICE,
    }), () => {
      // The Remove button is disabled once the selection is cleared,
      // so focus moves on to the grid instead of the trigger (see
      // focusAfterRemoval).
      this.focusAfterRemoval();
    });
  }

  // Return keyboard focus to the Remove button that opened the
  // confirmation dialog. Only used on the cancel path: after a
  // confirmed removal the button is disabled and cannot take focus,
  // so focusAfterRemoval picks an enabled target instead.
  focusRemoveButton() {
    if (this.removeButton) {
      this.removeButton.focus();
    }
  }

  // After a confirmed removal no card is selected, so the Remove
  // button is disabled and cannot receive focus. Move focus to the
  // first remaining contact card, or to the empty-state message once
  // the grid is empty, so focus does not fall to the document body.
  focusAfterRemoval() {
    if (!this.contactGrid) {
      return;
    }
    const target = this.contactGrid.querySelector('.contact__card') ||
      this.contactGrid.querySelector('.contact__empty');
    if (target) {
      target.focus();
    }
  }

  // Stable ref callbacks (class properties keep their identity across
  // renders, so React only invokes them on mount/unmount).
  setRemoveButtonRef = (button) => {
    this.removeButton = button;
  };

  setContactGridRef = (grid) => {
    this.contactGrid = grid;
  };

  setConfirmDialogRef = (dialog) => {
    this.confirmDialog = dialog;
  };

  setDetailModalRef = (dialog) => {
    this.detailModal = dialog;
  };

  setDetailCloseButtonRef = (button) => {
    this.detailCloseButton = button;
  };

  setCancelButtonRef = (button) => {
    this.cancelButton = button;
    // Move focus into the dialog as soon as it opens.
    if (button) {
      button.focus();
    }
  };

  // Keep Tab (and Shift+Tab) cycling inside a dialog instead of
  // reaching the content behind aria-modal. The dialog container
  // itself is focusable (tabIndex="-1"); treat it as the first tab
  // stop so Shift+Tab from it wraps to the last focusable element
  // instead of escaping to the page behind.
  trapTabIn(container, event) {
    const focusable = container
      ? container.querySelectorAll('button, input, select, textarea, a[href]')
      : [];
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey &&
        (document.activeElement === first ||
         document.activeElement === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Keyboard interaction for the confirmation dialog: Escape cancels,
  // and Tab cycles within the dialog instead of reaching the content
  // behind aria-modal.
  handleConfirmDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleRemoveCancel();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTabIn(this.confirmDialog, event);
    }
  }

  // Keyboard interaction for the detail modal: Escape closes it
  // without removing anything, and Tab stays inside the modal. While
  // the remove-confirmation dialog is open it handles its own
  // keyboard interaction — focus is inside it, so this handler is
  // not reached; the guard keeps the two dialogs from ever racing.
  handleDetailModalKeyDown(event) {
    if (this.state.confirmingRemove) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleDetailModalClose();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTabIn(this.detailModal, event);
    }
  }

  renderModal() {
    // Each card's accessible name carries a positional suffix so it
    // stays unique even when contacts share a name and label (e.g.
    // two adds of the same name), letting screen-reader users tell
    // the cards apart (WCAG 4.1.2).
    const contactCount = this.state.contacts.length;
    const cardElements = this.state.contacts.map((contact, index) =>
      <button
        key={ contact.id }
        type="button"
        className="contact__card"
        aria-label={ `${contact.name}, contact ${contact.label} ` +
          `(${index + 1} of ${contactCount})` }
        title={ contact.name }
        onClick={ (event) => { this.handleCardClick(contact, event); } }
      >{ contact.label } </button>);

    const name = this.state.name;
    const email = this.state.email;
    const phone = this.state.phone;
    const address = this.state.address;
    const birthday = this.state.birthday;
    const confirmingRemove = this.state.confirmingRemove;
    const hasSelection = this.state.selectedContactId !== null;
    const isPhoneInvalid = !isValidPhone(phone);
    const isEmailInvalid = !isValidEmail(email);
    return (
      <div className="contact" ref={ this.setContactGridRef }>
        { this.state.contacts.length === 0
          ? <p className="contact__empty" tabIndex="-1">No contacts yet</p>
          : cardElements }
        { this.state.removalNotice &&
          <p className="contact__notice" role="status">
            { this.state.removalNotice }
          </p> }
        { this.state.addNotice &&
          <p className="contact__notice" role="status">
            { this.state.addNotice }
          </p> }
        { this.state.storageNotice &&
          <p className="contact__notice" role="status">
            { this.state.storageNotice }
          </p> }
        <div
          className={ 'modal contact-modal' + (this.state.detailModalOpen ? ' show' : '') }
          style={ { display: this.state.detailModalOpen ? 'block' : 'none' } }
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          ref={ this.setDetailModalRef }
          onKeyDown={ (event) => { this.handleDetailModalKeyDown(event); } }
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <button className="btn"><i className="fa fa-edit"></i> Edit</button>
                <button
                  className="btn btn--danger"
                  disabled={ !hasSelection }
                  onClick={ () => { this.handleRemoveRequest(); } }
                  ref={ this.setRemoveButtonRef }
                ><i className="far fa-trash-alt"></i> Remove</button>
                <button
                  className="btn"
                  onClick={ () => { this.handleDetailModalClose(); } }
                  ref={ this.setDetailCloseButtonRef }
                ><i className="fa fa-times"></i> Close</button>
                <button
                  className="btn"
                  onClick={ () => { this.handleAddContact(); } }
                ><i className="fa fa-user-plus"></i> Add Contact</button>
              </div>
              <div className="modal-body">
                <h1 id="contact-modal-title">
                  { name }
                </h1>
                <div className="contact-information">
                  <div className="contact-information__item">
                    <label htmlFor="name">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={ name }
                      maxLength={ 80 }
                      onChange={ (event) => this.handleNameChange(event) }
                    />
                  </div>
                  <div className="contact-information__item">
                    <label htmlFor="email">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={ email }
                      onChange={ (event) => this.handleEmailChange(event) }
                      aria-invalid={ isEmailInvalid }
                      aria-errormessage={ isEmailInvalid ? 'email-error' : undefined }
                    />
                    { isEmailInvalid &&
                      <span id="email-error" className="contact-information__error" role="status">
                        Enter a valid email address such as name@example.com
                      </span>
                    }
                  </div>
                  <div className="contact-information__item">
                    <label htmlFor="phone">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={ phone }
                      onChange={ (event) => this.handlePhoneChange(event) }
                      aria-invalid={ isPhoneInvalid }
                      aria-errormessage={ isPhoneInvalid ? 'phone-error' : undefined }
                    />
                    { isPhoneInvalid &&
                      <span id="phone-error" className="contact-information__error" role="status">
                        Phone number can only contain digits, spaces and the
                        separators + - ( )
                      </span>
                    }
                  </div>
                  <div className="contact-information__item">
                    <label htmlFor="address">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={ address }
                      onChange={ (event) => this.handleAddressChange(event) }
                    />
                  </div>
                  <div className="contact-information__item">
                    <label htmlFor="date">
                      Birthday
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={ birthday }
                      onChange={ (event) => this.handleBirthdayChange(event) }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        { this.state.detailModalOpen &&
          <div
            className="modal-backdrop show"
            onClick={ () => { this.handleDetailModalClose(); } }
          /> }
        { confirmingRemove && this.renderConfirmDialog() }
      </div>
    );
  }

  // The remove-confirmation alertdialog, rendered while
  // confirmingRemove is true. Its keyboard interaction lives in
  // handleConfirmDialogKeyDown; the dialog is shown with an inline
  // display style because Bootstrap's own modal JS never manages it.
  renderConfirmDialog() {
    return (
      <div
        className="modal fade confirm-modal show"
        style={ { display: 'block' } }
        tabIndex="-1"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmRemoveTitle"
        ref={ this.setConfirmDialogRef }
        onKeyDown={ (event) => { this.handleConfirmDialogKeyDown(event); } }
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body">
              <h2 id="confirmRemoveTitle" className="confirm-modal__title">
                Remove contact
              </h2>
              <p>
                Remove { this.state.name } from your contacts? This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={ () => { this.handleRemoveCancel(); } }
                ref={ this.setCancelButtonRef }
              >Cancel</button>
              <button
                className="btn btn--danger"
                onClick={ () => { this.handleRemoveConfirm(); } }
              >Remove contact</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (this.renderModal()
    );
  }
}

function App() {
  return (
    <div>  
      <Modal />
    </div>
  );
}

export default App;
