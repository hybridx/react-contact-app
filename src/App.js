import React from 'react';
import './App.css';



class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'John Doe',
      email: 'jdoe@redhat.com',
      phone: 9988776655,
      address: 'JDoe 1120',
      birthday: '11-1-2020',
    };
  }
  handleClick(contactInfo) {
    this.setState({
      ...contactInfo
    })
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
                                phone: 9988776655,
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
                  <input type="number" id="contact" defaultValue={ phone }/>
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
