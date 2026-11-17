import React from 'react';
import './App.css';

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

// The contact details shown when no card is open; also the state the
// detail view is reset to after a contact has been removed.
const DEFAULT_CONTACT = {
  name: 'John Doe',
  email: 'jdoe@redhat.com',
  phone: '9988776655',
  address: 'JDoe 1120',
  birthday: '11-1-2020',
};

// The demo record every card opens. Kept separate from the card list
// so a card's identity is never conflated with the record it shows.
const CONTACT_DETAILS = {
  name: 'Deepesh Nair',
  email: 'denair@redhat.com',
  phone: '9988776655',
  address: 'JDoe 1120',
  birthday: '11-1-2020',
};

// The cards shown in the grid. Each card carries a stable id next to
// the initial rendered on it, so a removal targets exactly one card
// and never depends on the displayed text.
const CONTACT_CARDS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
].map((initial, index) => ({ id: index + 1, initial }));

export class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...DEFAULT_CONTACT,
      // The contact cards currently shown; removals delete from this
      // list so the grid stays in sync with the modal actions.
      cards: CONTACT_CARDS,
      // The id of the card whose details are displayed in the modal;
      // this is the contact the Remove action targets. It is null
      // while no card is open, and Remove is gated on a selection.
      selectedCardId: null,
      // Whether the remove-confirmation dialog is shown. Deletion is
      // two-step by design: the Remove button only opens this dialog
      // and the contact is deleted solely on an explicit confirm.
      confirmingRemove: false,
      // Status message announcing a completed removal; rendered with
      // role="status" so assistive technology picks it up.
      removalNotice: null,
      // Whether the user has typed in the phone or email field; a card
      // click must never clobber a value the user is editing.
      phoneEdited: false,
      emailEdited: false,
  }
  handleClick(contactInfo) {
    const { phone, email, ...contact } = contactInfo;
    this.setState((prevState) => ({
      ...contact,
      // Gate: an invalid phone or email value is never persisted — when
      // one is passed, the update is refused and the current value is
      // kept. A valid value is only applied while the user has not
      // edited the field, so a card click cannot clobber the value
      // being typed.
      phone:
        phone !== undefined && isValidPhone(phone) && !prevState.phoneEdited
          ? phone
          : prevState.phone,
      email:
        email !== undefined && isValidEmail(email) && !prevState.emailEdited
          ? email
          : prevState.email,
      // Reset the phone and email edit latches together with the card's
      // fields so the next card click can apply its values. The gate above
      // still reads the pre-click flag, so a value the user is actively
      // typing (the keystroke that armed the latch between clicks) is
      // never clobbered by this click.
      phoneEdited: false,
      emailEdited: false,
    }));
  }

  handlePhoneChange(event) {
    this.setState({ phone: event.target.value, phoneEdited: true });
  }

  handleEmailChange(event) {
    this.setState({ email: event.target.value, emailEdited: true });
  }

  handleCardClick(card) {
    this.setState({ selectedCardId: card.id, removalNotice: null });
    this.handleClick(CONTACT_DETAILS);
  }

  handleRemoveRequest() {
    // Gate: the confirmation dialog only opens when a card is
    // selected — with no selection there is nothing to remove, and
    // opening the dialog would present a no-op as a real removal.
    if (this.state.selectedCardId === null) {
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
    if (this.state.selectedCardId === null) {
      this.setState({ confirmingRemove: false });
      return;
    }
    this.setState((prevState) => ({
      cards: prevState.cards.filter(
        (card) => card.id !== prevState.selectedCardId
      ),
      selectedCardId: null,
      confirmingRemove: false,
      // Reset the detail view to the defaults so the removed
      // contact's data is no longer presented as current.
      ...DEFAULT_CONTACT,
      phoneEdited: false,
      // Announce the removal so screen reader users learn that the
      // contact was deleted (rendered with role="status").
      removalNotice: `${prevState.name} was removed from your contacts.`,
    }));
    this.focusRemoveButton();
  }

  // Return keyboard focus to the Remove button that opened the
  // confirmation dialog.
  focusRemoveButton() {
    if (this.removeButton) {
      this.removeButton.focus();
    }
  }

  // Stable ref callbacks (class properties keep their identity across
  // renders, so React only invokes them on mount/unmount).
  setRemoveButtonRef = (button) => {
    this.removeButton = button;
  };

  setConfirmDialogRef = (dialog) => {
    this.confirmDialog = dialog;
  };

  setCancelButtonRef = (button) => {
    this.cancelButton = button;
    // Move focus into the dialog as soon as it opens.
    if (button) {
      button.focus();
    }
  };

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
      const focusable = this.confirmDialog
        ? this.confirmDialog.querySelectorAll('button')
        : [];
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

renderModal() {
  const cardElements = this.state.cards.map((card) =>
    <div
      key={ card.id }
      className="contact__card"
      data-toggle="modal"
      data-target=".contact-modal"
      onClick={ () => { this.handleCardClick(card); } }
    >{ card.initial } </div>);

  const name = this.state.name;
  const email = this.state.email;
  const phone = this.state.phone;
  const address = this.state.address;
  const birthday = this.state.birthday;
  const confirmingRemove = this.state.confirmingRemove;
  const hasSelection = this.state.selectedCardId !== null;
  const isPhoneInvalid = !isValidPhone(phone);
  const isEmailInvalid = !isValidEmail(email);
  return (
    <div className="contact">
      { this.state.cards.length === 0
        ? <p className="contact__empty">No contacts yet</p>
        : cardElements }
      { this.state.removalNotice &&
        <p className="contact__removal-notice" role="status">
          { this.state.removalNotice }
        </p> }
      <div className="modal fade contact-modal" tabIndex="-1" role="dialog" aria-labelledby="contactModal" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <button className="btn"><i className="fa fa-edit"></i> Edit</button>
              <button
                className="btn"
                disabled={ !hasSelection }
                onClick={ () => { this.handleRemoveRequest(); } }
                ref={ this.setRemoveButtonRef }
              ><i className="far fa-trash-alt"></i> Remove</button>
            </div>
            <div className="modal-body">
              <h1 id="contact-modal-title">
                { name }
              </h1>
              <div className="contact-information">
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
                  <label htmlFor="contact">
                    Contact
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    value={ phone }
                    onChange={ (event) => this.handlePhoneChange(event) }
                    aria-invalid={ isPhoneInvalid }
                    aria-errormessage={ isPhoneInvalid ? 'contact-error' : undefined }
                  />
                  { isPhoneInvalid &&
                    <span id="contact-error" className="contact-information__error" role="status">
                      Phone number can only contain digits, spaces and the
                      separators + - ( )
                    </span>
                  }
                </div>
                <div className="contact-information__item">
                  <label htmlFor="address">
                    Address
                  </label>
                  <input type="text" id="address" defaultValue={ address }/>
                </div>
                <div className="contact-information__item">
                  <label htmlFor="date">
                    Birthday
                  </label>
                  <input type="date" id="date" defaultValue={ birthday }/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      { confirmingRemove &&
        <div
          className="modal fade confirm-modal show"
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
                  Remove { name } from your contacts? This cannot be undone.
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
      }
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
