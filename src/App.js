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

export class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'John Doe',
      email: 'jdoe@redhat.com',
      phone: '9988776655',
      address: 'JDoe 1120',
      birthday: '11-1-2020',
      // Whether the user has typed in the phone field; a card click
      // must never clobber a value the user is editing.
      phoneEdited: false,
    };
  }
  handleClick(contactInfo) {
    const { phone, ...contact } = contactInfo;
    this.setState((prevState) => ({
      ...contact,
      // Gate: an invalid phone value is never persisted — when one is
      // passed, the update is refused and the current value is kept.
      // A valid phone is only applied while the user has not edited the
      // field, so a card click cannot clobber the value being typed.
      phone:
        phone !== undefined && isValidPhone(phone) && !prevState.phoneEdited
          ? phone
          : prevState.phone,
      // Reset the edit latch together with the card's fields so the
      // next card click can apply its phone. The gate above still
      // reads the pre-click flag, so a value the user is actively
      // typing (the keystroke that armed the latch between clicks)
      // is never clobbered by this click.
      phoneEdited: false,
    }));
  }

  handlePhoneChange(event) {
    this.setState({ phone: event.target.value, phoneEdited: true });
  }

renderModal() {
  const names = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  ].map( (initial, i) => <div key={i} className="contact__card" data-toggle="modal" data-target=".contact-modal"
                           onClick={
                             () => {
                               this.handleClick({
                                name: 'Deepesh Nair',
                                email: 'denair@redhat.com',
                                phone: '9988776655',
                                address: 'JDoe 1120',
                                birthday: '11-1-2020',
                               })
                             }
                           }>{initial} </div>);
  
  const name = this.state.name;
  const email = this.state.email;
  const phone = this.state.phone;
  const address = this.state.address;
  const birthday = this.state.birthday;
  const isPhoneInvalid = !isValidPhone(phone);
  return (
    <div className="contact">
      { names }
      <div className="modal fade contact-modal" tabIndex="-1" role="dialog" aria-labelledby="contactModal" aria-hidden="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <button className="btn"><i className="fa fa-edit"></i> Edit</button> 
              <button className="btn"><i className="far fa-trash-alt"></i> Remove</button>
            </div>
            <div className="modal-body">
              <h1>
                { name }
              </h1>
              <div className="contact-information">
                <div className="contact-information__item">
                  <label htmlFor="email">
                    Email
                  </label>
                  <input type="email" id="email" defaultValue={ email }/>
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
