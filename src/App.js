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

// The single demo contact every card opens in the modal. The cards
// currently share one contact, so both the activation data and the
// cards' accessible names come from this constant.
const CONTACT = {
  name: 'Deepesh Nair',
  email: 'denair@redhat.com',
  phone: '9988776655',
  address: 'JDoe 1120',
  birthday: '11-1-2020',
};

export class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'John Doe',
      email: 'jdoe@redhat.com',
      phone: '9988776655',
      address: 'JDoe 1120',
      birthday: '11-1-2020',
      // Whether the user has typed in the phone or email field; a card
      // click must never clobber a value the user is editing.
      phoneEdited: false,
      emailEdited: false,
    };
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
      // Reset the edit latches together with the card's fields so the
      // next card click can apply its phone and email. The gates above
      // still read the pre-click flags, so values the user is actively
      // typing (the keystrokes that armed the latches between clicks)
      // are never clobbered by this click.
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

  handleCardActivate() {
    this.handleClick(CONTACT);
    // Bootstrap's `data-toggle="modal"` delegation only fires on real
    // mouse clicks, so an Enter/Space activation never reaches it and
    // the dialog would not open for keyboard users. Show it explicitly
    // here; jQuery and Bootstrap are loaded globally by
    // public/index.html, and Bootstrap ignores a redundant show when
    // the dialog is already open or opening (e.g. after a mouse click).
    // The guard keeps jQuery-less environments (the test runtime)
    // working.
    if (typeof window !== 'undefined' && window.jQuery) {
      window.jQuery('.contact-modal').modal('show');
    }
  }

  handleCardKeyDown(event) {
    // The contact cards are divs styled as cards, so they need an
    // explicit keyboard activation path alongside role="button".
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleCardActivate();
    }
  }

renderModal() {
  const names = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  ].map( (initial, i) => <div key={i} className="contact__card" data-toggle="modal" data-target=".contact-modal"
                           role="button" tabIndex={0} aria-label={ `Contact ${initial}: ${CONTACT.name}` }
                           onClick={ () => { this.handleCardActivate(); } }
                           onKeyDown={ (event) => { this.handleCardKeyDown(event); } }>{initial} </div>);
  
  const name = this.state.name;
  const email = this.state.email;
  const phone = this.state.phone;
  const address = this.state.address;
  const birthday = this.state.birthday;
  const isPhoneInvalid = !isValidPhone(phone);
  const isEmailInvalid = !isValidEmail(email);
  return (
    <div className="contact">
      { names }
      <div className="modal fade contact-modal" tabIndex="-1" role="dialog" aria-labelledby="contact-modal-title" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <button className="btn"><i className="fa fa-edit" aria-hidden="true"></i> Edit</button> 
              {/* Removal is not implemented yet; keep the control
                  disabled rather than offering a dead destructive
                  action. */}
              <button className="btn" disabled><i className="far fa-trash-alt" aria-hidden="true"></i> Remove</button>
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
                      Contact number can only contain digits, spaces and the
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
