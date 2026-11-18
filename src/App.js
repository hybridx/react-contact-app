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

// The cards shown in the grid. Each card carries a stable id and the
// initial rendered on it, so a removal targets exactly one card. The
// contact record is the demo record the base app opened for every
// card, so this change does not alter the app's existing demo data.
const CONTACT_CARDS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
].map((initial, index) => ({
  id: index + 1,
  initial,
  contact: {
    name: 'Deepesh Nair',
    email: 'denair@redhat.com',
    ...DEMO_CONTACT,
  },
}));

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
      // Whether the contact detail modal is shown. Its open state is
      // managed here in React rather than via Bootstrap's data-toggle,
      // so the modal can also be closed programmatically — notably
      // after a confirmed removal, before focus moves back to the
      // grid. This also keeps Bootstrap's own modal focus enforcement
      // out of the way of the confirmation dialog's focus handling.
      detailModalOpen: false,
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
    // Selecting a card opens the detail modal and dismisses any
    // pending remove confirmation, so an open confirmation can never
    // retarget to a contact the user did not ask to remove.
    this.setState({
      selectedCardId: card.id,
      removalNotice: null,
      confirmingRemove: false,
      detailModalOpen: true,
    });
    this.handleClick(card.contact);
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
      // Close the detail modal: the contact it showed is gone, and
      // with the modal closed, moving focus back to the grid no
      // longer breaks the focus containment of an open dialog.
      detailModalOpen: false,
      // Reset the detail view to the defaults so the removed
      // contact's data is no longer presented as current.
      ...DEFAULT_CONTACT,
      phoneEdited: false,
      // Announce the removal so screen reader users learn that the
      // contact was deleted (rendered with role="status").
      removalNotice: `${prevState.name} was removed from your contacts.`,
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
      // The dialog container itself is focusable (tabIndex="-1");
      // treat it as the first focusable so Shift+Tab from it wraps to
      // the last button instead of escaping to the page behind.
      if (event.shiftKey &&
          (document.activeElement === first ||
           document.activeElement === this.confirmDialog)) {
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
      <button
        key={ card.id }
        type="button"
        className="contact__card"
        aria-label={ card.contact.name }
        onClick={ () => { this.handleCardClick(card); } }
      >{ card.initial } </button>);

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
      <div className="contact" ref={ this.setContactGridRef }>
        { this.state.cards.length === 0
          ? <p className="contact__empty" tabIndex="-1">No contacts yet</p>
          : cardElements }
        { this.state.removalNotice &&
          <p className="contact__removal-notice" role="status">
            { this.state.removalNotice }
          </p> }
        <div
          className={ 'modal contact-modal' + (this.state.detailModalOpen ? ' show' : '') }
          style={ { display: this.state.detailModalOpen ? 'block' : 'none' } }
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contactName"
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
              </div>
              <div className="modal-body">
                <h1 id="contactName">
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
        { this.state.detailModalOpen && <div className="modal-backdrop show" /> }
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
