import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App, { isValidEmail, isValidPhone, Modal } from './App';
import { STORAGE_KEY, loadContacts, saveContacts } from './contactsStorage';

function fakeStorage(initial) {
  const store = { ...initial };
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
  };
}

// The contact list persists in localStorage, so a test that adds or
// removes a contact would leak into every later render in this file.
// Clear the storage before each test so all suites start from the
// demo contacts.
beforeEach(() => {
  window.localStorage.clear();
});

describe('isValidPhone', () => {
  test('accepts digit-only phone numbers', () => {
    expect(isValidPhone('9988776655')).toBe(true);
  });

  test('accepts digits with common separators and spaces', () => {
    expect(isValidPhone('+91 99887 76655')).toBe(true);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
    expect(isValidPhone('555-1234')).toBe(true);
  });

  test('treats an empty value as valid (field is optional)', () => {
    expect(isValidPhone('')).toBe(true);
    expect(isValidPhone('   ')).toBe(true);
  });

  test('rejects values containing letters', () => {
    expect(isValidPhone('abc123')).toBe(false);
  });

  test('rejects separator-only input', () => {
    expect(isValidPhone('---')).toBe(false);
    expect(isValidPhone('+ ()')).toBe(false);
  });
});

describe('isValidEmail', () => {
  test('accepts a regular email address', () => {
    expect(isValidEmail('jdoe@redhat.com')).toBe(true);
    expect(isValidEmail('name.surname+tag@example.co.uk')).toBe(true);
  });

  test('treats an empty value as valid (field is optional)', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('   ')).toBe(true);
  });

  test('rejects an address without a dot in the domain', () => {
    expect(isValidEmail('foo@bar')).toBe(false);
  });

  test('rejects an address without an @ or with an empty part', () => {
    expect(isValidEmail('foobar')).toBe(false);
    expect(isValidEmail('foo@')).toBe(false);
    expect(isValidEmail('@bar.com')).toBe(false);
  });

  test('rejects an address containing whitespace', () => {
    expect(isValidEmail('foo bar@example.com')).toBe(false);
    expect(isValidEmail('foo@ bar')).toBe(false);
  });

  test('rejects a domain with consecutive or trailing dots', () => {
    expect(isValidEmail('a@b..com')).toBe(false);
    expect(isValidEmail('a@b.com.')).toBe(false);
  });
});

describe('phone input validation', () => {
  test('shows an inline error for an invalid phone value and keeps the value', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });

    expect(phoneInput.value).toBe('abc123');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/phone number can only contain/i)).toBeInTheDocument();
  });

  test('associates the inline error with the phone input as polite feedback', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });

    expect(phoneInput).toHaveAttribute('aria-errormessage', 'phone-error');
    const error = getByText(/phone number can only contain/i);
    expect(error).toHaveAttribute('id', 'phone-error');
    expect(error).toHaveAttribute('role', 'status');
  });

  test('clears the inline error once the value is fixed', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    expect(queryByText(/phone number can only contain/i)).toBeInTheDocument();

    fireEvent.change(phoneInput, { target: { value: '9988776655' } });
    expect(queryByText(/phone number can only contain/i)).not.toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('accepts a formatted phone number without showing an error', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '+91 99887 76655' } });

    expect(queryByText(/phone number can only contain/i)).not.toBeInTheDocument();
  });
});

describe('email input validation', () => {
  test('shows an inline error for an invalid email value and keeps the value', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });

    expect(emailInput.value).toBe('foo@bar');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  test('associates the inline error with the email input as polite feedback', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });

    expect(emailInput).toHaveAttribute('aria-errormessage', 'email-error');
    const error = getByText(/enter a valid email address/i);
    expect(error).toHaveAttribute('id', 'email-error');
    expect(error).toHaveAttribute('role', 'status');
  });

  test('clears the inline error once the value is fixed', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });
    expect(queryByText(/enter a valid email address/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(queryByText(/enter a valid email address/i)).not.toBeInTheDocument();
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('accepts a valid email address without showing an error', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(queryByText(/enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('clearing the email field shows no error (field is optional)', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });
    expect(queryByText(/enter a valid email address/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: '' } });

    expect(emailInput.value).toBe('');
    expect(queryByText(/enter a valid email address/i)).not.toBeInTheDocument();
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });
});

describe('contact card interaction with the phone input', () => {
  test('clicking a contact card does not clobber the phone value being edited', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '+91 99887 76655' } });
    fireEvent.click(getByText('A'));

    expect(phoneInput.value).toBe('+91 99887 76655');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card keeps an invalid phone value and its error', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    fireEvent.click(getByText('B'));

    expect(phoneInput.value).toBe('abc123');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/phone number can only contain/i)).toBeInTheDocument();
  });

  test('applies the card phone again on the next card click after an edit', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    fireEvent.click(getByText('A'));
    expect(phoneInput.value).toBe('555-1234');

    fireEvent.click(getByText('B'));
    expect(phoneInput.value).toBe('9988776655');
  });

  test('protects a second in-progress edit after a card click reset the latch', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    fireEvent.click(getByText('A'));
    expect(phoneInput.value).toBe('555-1234');

    fireEvent.change(phoneInput, { target: { value: '555-9876' } });
    fireEvent.click(getByText('B'));

    expect(phoneInput.value).toBe('555-9876');
  });
});

describe('contact card interaction with the email input', () => {
  test('clicking a contact card applies the valid email while the field is unedited', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.click(getByText('A'));

    expect(emailInput.value).toBe('denair@redhat.com');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card does not clobber the email value being edited', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(getByText('A'));

    expect(emailInput.value).toBe('test@example.com');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card keeps an invalid email value and its error', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });
    fireEvent.click(getByText('B'));

    expect(emailInput.value).toBe('foo@bar');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  test('applies the card email again on the next card click after an edit', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'custom@example.org' } });
    fireEvent.click(getByText('A'));
    expect(emailInput.value).toBe('custom@example.org');

    fireEvent.click(getByText('B'));
    expect(emailInput.value).toBe('denair@redhat.com');
  });

  test('protects a second in-progress edit after a card click reset the latch', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'custom@example.org' } });
    fireEvent.click(getByText('A'));
    expect(emailInput.value).toBe('custom@example.org');

    fireEvent.change(emailInput, { target: { value: 'other@example.org' } });
    fireEvent.click(getByText('B'));

    expect(emailInput.value).toBe('other@example.org');
  });

  test('keeps an invalid edited email on the first click, then applies the card email on the next', () => {
    const { getByLabelText, getByText, queryByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });
    fireEvent.click(getByText('A'));
    expect(emailInput.value).toBe('foo@bar');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/enter a valid email address/i)).toBeInTheDocument();

    fireEvent.click(getByText('B'));

    expect(emailInput.value).toBe('denair@redhat.com');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(queryByText(/enter a valid email address/i)).not.toBeInTheDocument();
  });
});

describe('modal dialog labeling', () => {
  test('names the modal dialog via the contact-name heading', () => {
    const { getByRole } = render(<App />);
    // The modal markup is aria-hidden until Bootstrap shows it, so the
    // role queries must include hidden elements.
    const dialog = getByRole('dialog', { hidden: true });
    const heading = getByRole('heading', { level: 1, hidden: true });

    expect(heading).toHaveAttribute('id', 'contact-modal-title');
    expect(dialog).toHaveAttribute('aria-labelledby', 'contact-modal-title');
  });
});

describe('contact card interaction with the email input', () => {
  test('clicking a contact card applies the valid email while the field is unedited', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.click(getByText('A'));

    expect(emailInput.value).toBe('denair@redhat.com');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card does not clobber the email value being edited', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(getByText('A'));

    expect(emailInput.value).toBe('test@example.com');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card keeps an invalid email value and its error', () => {
    const { getByLabelText, getByText } = render(<App />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'foo@bar' } });
    fireEvent.click(getByText('B'));

    expect(emailInput.value).toBe('foo@bar');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/enter a valid email address/i)).toBeInTheDocument();
  });
});

describe('remove confirmation', () => {
  test('clicking Remove asks for confirmation instead of deleting the contact', () => {
    const { getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('A'));
    fireEvent.click(getByText('Remove'));

    expect(getByRole('alertdialog')).toBeInTheDocument();
    expect(getByText(/remove deepesh nair from your contacts\?/i)).toBeInTheDocument();
    expect(getByText('A')).toBeInTheDocument();
    // The detail dialog is exposed to assistive technology (no static
    // aria-hidden), labelled by the contact name heading, and open.
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('dialog')).toHaveClass('show');
  });

  test('canceling the confirmation keeps the contact and the detail modal open', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('B'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Cancel' }));

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(getByText('B')).toBeInTheDocument();
    expect(getByRole('dialog')).toHaveClass('show');
  });

  test('confirming the removal deletes only the selected contact', () => {
    const { getByText, getByRole, queryByText } = render(<App />);

    fireEvent.click(getByText('C'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(queryByText('C')).not.toBeInTheDocument();
    expect(getByText('D')).toBeInTheDocument();
  });

  test('a removal can be started again after being canceled', () => {
    const { getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('D'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Cancel' }));
    fireEvent.click(getByText('Remove'));

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });

  test('Remove is unavailable before any card is selected', () => {
    const { getByText, queryByRole } = render(<App />);

    // The detail modal is closed while no card is selected.
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    const removeButton = getByText('Remove');
    expect(removeButton).toBeDisabled();

    fireEvent.click(removeButton);

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('confirming a removal closes the detail modal and resets the detail view', () => {
    const { getByText, getByRole, queryByRole, queryByText } = render(<App />);

    fireEvent.click(getByText('E'));
    expect(getByRole('dialog')).toHaveClass('show');

    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(queryByText('E')).not.toBeInTheDocument();
    // The detail modal is closed after a confirmed removal, and the
    // detail view behind it is reset to the defaults.
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(queryByText('Deepesh Nair')).not.toBeInTheDocument();

    const removeButton = getByText('Remove');
    expect(removeButton).toBeDisabled();
    fireEvent.click(removeButton);

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('confirming a removal announces it via a status message', () => {
    const { getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('F'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(getByRole('status')).toHaveTextContent(
      'Deepesh Nair was removed from your contacts.'
    );
  });

  test('confirming a removal moves focus to the grid instead of the disabled Remove button', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('H'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    // The detail modal is closed and its Remove button disabled after
    // a confirmed removal, so focus moves to the first remaining card.
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByText('Remove')).toBeDisabled();
    expect(getByText('A')).toHaveFocus();
  });

  test('the confirmation dialog moves focus in, traps Tab, and cancels on Escape', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('G'));
    fireEvent.click(getByText('Remove'));

    const dialog = getByRole('alertdialog');
    const cancelButton = getByRole('button', { name: 'Cancel' });
    const confirmButton = getByRole('button', { name: 'Remove contact' });

    // Focus moves into the dialog when it opens.
    expect(cancelButton).toHaveFocus();

    // Tab cycles within the dialog instead of reaching the page behind it.
    confirmButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();

    // The focusable dialog container counts as the first tab stop, so
    // Shift+Tab from it wraps to the last button instead of escaping.
    dialog.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();

    // Escape cancels and returns focus to the Remove button.
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(getByText('Remove')).toHaveFocus();
  });

  test('a canceled confirmation followed by another card removes only the new selection', () => {
    const { getByText, getByRole, queryByRole, queryByText } = render(<App />);

    fireEvent.click(getByText('A'));
    fireEvent.click(getByText('Remove'));
    expect(getByRole('alertdialog')).toBeInTheDocument();

    // Dismiss the confirmation through channels that work at
    // runtime: Escape cancels the confirmation dialog, then Escape
    // closes the detail modal, so the grid is reachable again.
    fireEvent.keyDown(getByRole('alertdialog'), { key: 'Escape' });
    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(queryByRole('dialog')).not.toBeInTheDocument();

    // The next removal applies to the newly selected contact only.
    fireEvent.click(getByText('B'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(queryByText('B')).not.toBeInTheDocument();
    expect(getByText('A')).toBeInTheDocument();
  });

  test('activating another card dismisses an open confirmation (no Bootstrap CSS)', () => {
    const { getByText, getByRole, queryByRole, queryByText } = render(<App />);

    fireEvent.click(getByText('A'));
    fireEvent.click(getByText('Remove'));
    expect(getByRole('alertdialog')).toBeInTheDocument();

    // The backdrop that normally blocks grid clicks comes from
    // Bootstrap's CSS; when it fails to load, clicks reach the cards
    // again. handleCardClick still guards that environment: the card
    // click dismisses the pending confirmation, so it can never
    // retarget to a contact the user did not ask to remove.
    fireEvent.click(getByText('B'));
    expect(queryByRole('alertdialog')).not.toBeInTheDocument();

    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(queryByText('B')).not.toBeInTheDocument();
    expect(getByText('A')).toBeInTheDocument();
  });

  test('clicking a card after a confirmed removal applies the new contact details', () => {
    const { getByLabelText, getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('E'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    // The removal reset the edited-field latches, so the phone and
    // email of the newly selected contact are applied again.
    fireEvent.click(getByText('D'));

    expect(getByRole('dialog')).toHaveClass('show');
    expect(getByLabelText(/email/i).value).toBe('denair@redhat.com');
    expect(getByLabelText(/phone/i).value).toBe('9988776655');
  });

  test('a custom address and birthday are reset after a confirmed removal', () => {
    const { getByLabelText, getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('E'));
    const addressInput = getByLabelText(/address/i);
    const birthdayInput = getByLabelText(/birthday/i);

    fireEvent.change(addressInput, { target: { value: 'Custom 123' } });
    fireEvent.change(birthdayInput, { target: { value: '2001-02-03' } });
    expect(addressInput.value).toBe('Custom 123');

    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    // The inputs are controlled, so the reset to the defaults is
    // reflected in the displayed values.
    expect(addressInput.value).toBe('JDoe 1120');
    expect(birthdayInput.value).not.toBe('2001-02-03');
  });

  test('shows an empty state once every contact has been removed', () => {
    const { getByText, getByRole } = render(<App />);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach((initial) => {
      fireEvent.click(getByText(initial));
      fireEvent.click(getByText('Remove'));
      fireEvent.click(getByRole('button', { name: 'Remove contact' }));
    });

    expect(getByText('No contacts yet')).toBeInTheDocument();
    // With no cards left, focus lands on the focusable empty state.
    expect(getByText('No contacts yet')).toHaveFocus();
  });
});

describe('contact card accessibility', () => {
  test('cards expose a unique accessible name per contact', () => {
    const { container } = render(<App />);

    const cards = container.querySelectorAll('.contact__card');
    expect(cards).toHaveLength(10);
    const initials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    cards.forEach((card, index) => {
      // The name includes the distinguishing initial, so ten cards
      // sharing one demo record are still told apart (WCAG 4.1.2).
      expect(card).toHaveAttribute(
        'aria-label', 'Deepesh Nair, contact ' + initials[index]
      );
    });
  });
});

describe('detail modal interaction', () => {
  test('the detail modal can be closed without removing the contact', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('A'));
    expect(getByRole('dialog')).toHaveClass('show');

    fireEvent.click(getByRole('button', { name: 'Close' }));

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByText('A')).toBeInTheDocument();
    // With the modal closed the selection is cleared, so Remove can
    // no longer be triggered.
    expect(getByText('Remove')).toBeDisabled();
  });

  test('opening the detail modal moves focus in and closing returns it to the card', () => {
    const { getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('A'));

    // Focus moves into the dialog when it opens.
    expect(getByRole('button', { name: 'Close' })).toHaveFocus();

    fireEvent.click(getByRole('button', { name: 'Close' }));

    expect(getByText('A')).toHaveFocus();
  });

  test('Escape closes the detail modal and returns focus to the opening card', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('B'));
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByText('B')).toHaveFocus();
  });

  test('clicking the backdrop closes the detail modal', () => {
    const { getByText, queryByRole, container } = render(<App />);

    fireEvent.click(getByText('C'));

    fireEvent.click(container.querySelector('.modal-backdrop'));

    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(getByText('C')).toBeInTheDocument();
  });

  test('the detail modal traps Tab while it is open', () => {
    const { getByText, getByRole, getByLabelText } = render(<App />);

    fireEvent.click(getByText('D'));
    const dialog = getByRole('dialog');
    const editButton = getByRole('button', { name: 'Edit' });
    const birthdayInput = getByLabelText(/birthday/i);

    // Tab from the last focusable element wraps to the first.
    birthdayInput.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(editButton).toHaveFocus();

    // Shift+Tab from the first focusable element wraps to the last.
    editButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(birthdayInput).toHaveFocus();
  });
});

describe('contacts storage helpers', () => {
  test('loadContacts returns null when nothing has been persisted', () => {
    expect(loadContacts(fakeStorage())).toBeNull();
  });

  test('saveContacts and loadContacts round-trip a contact list', () => {
    const storage = fakeStorage();
    const contacts = [
      { id: 'a', label: 'A', name: 'Jane Roe', email: 'jane@example.com' },
    ];

    saveContacts(contacts, storage);

    expect(storage.getItem(STORAGE_KEY)).toBe(JSON.stringify(contacts));
    expect(loadContacts(storage)).toEqual(contacts);
  });

  test('loadContacts returns null for unreadable or non-list data', () => {
    expect(loadContacts(fakeStorage({ [STORAGE_KEY]: 'not json' }))).toBeNull();
    expect(loadContacts(fakeStorage({ [STORAGE_KEY]: '{"a":1}' }))).toBeNull();
  });

  test('saveContacts keeps going when the storage write fails', () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota exceeded'); },
      removeItem: () => {},
    };

    expect(() => saveContacts([], storage)).not.toThrow();
  });
});

describe('contact list persistence', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test('shows the demo contacts when nothing has been persisted', () => {
    const { getByText, getAllByTitle } = render(<App />);

    expect(getByText('A')).toBeInTheDocument();
    expect(getByText('J')).toBeInTheDocument();
    expect(getAllByTitle('Deepesh Nair')).toHaveLength(10);
  });

  test('restores the contact list from localStorage instead of the demo list', () => {
    saveContacts([
      { id: 'zed', label: 'Z', name: 'Zed Zane', email: 'zed@example.com',
        phone: '555-0100', address: '1 Main St', birthday: '2000-01-01' },
    ]);

    const { getByText, getByTitle, queryByTitle } = render(<App />);

    expect(getByText('Z')).toBeInTheDocument();
    expect(getByTitle('Zed Zane')).toBeInTheDocument();
    expect(queryByTitle('Deepesh Nair')).toBeNull();
  });

  test('clicking Add Contact appends the current contact and persists it', () => {
    const { getByLabelText, getByText, getByTitle } = render(<App />);

    fireEvent.change(getByLabelText(/name/i), { target: { value: 'Jane Roe' } });
    fireEvent.change(getByLabelText(/email/i), { target: { value: 'jane@example.com' } });
    fireEvent.click(getByText('Add Contact'));

    expect(getByTitle('Jane Roe')).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(stored).toHaveLength(11);
    expect(stored[10]).toMatchObject({
      name: 'Jane Roe',
      email: 'jane@example.com',
      phone: '9988776655',
    });
  });

  test('an added contact is still listed after remounting the app', () => {
    const first = render(<App />);
    fireEvent.change(first.getByLabelText(/name/i), { target: { value: 'Jane Roe' } });
    fireEvent.click(first.getByText('Add Contact'));
    first.unmount();

    const second = render(<App />);
    const restored = second.getByTitle('Jane Roe');
    expect(restored).toBeInTheDocument();

    fireEvent.click(restored);
    expect(second.getByLabelText(/name/i).value).toBe('Jane Roe');
    expect(second.getByLabelText(/email/i).value).toBe('jdoe@redhat.com');
  });

  test('Add Contact refuses to persist an invalid email or phone value', () => {
    const { getByLabelText, getByText, queryByTitle } = render(<App />);

    fireEvent.change(getByLabelText(/email/i), { target: { value: 'foo@bar' } });
    fireEvent.click(getByText('Add Contact'));

    expect(queryByTitle('John Doe')).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('card clicks load the values of a restored contact', () => {
    saveContacts([
      { id: 'zed', label: 'Z', name: 'Zed Zane', email: 'zed@example.com',
        phone: '+91 99887 76655', address: '1 Main St', birthday: '2000-01-01' },
    ]);

    const { getByText, getByLabelText } = render(<App />);

    fireEvent.click(getByText('Z'));

    expect(getByLabelText(/name/i).value).toBe('Zed Zane');
    expect(getByLabelText(/email/i).value).toBe('zed@example.com');
    expect(getByLabelText(/phone/i).value).toBe('+91 99887 76655');
  });
});

describe('handleClick phone gate', () => {
  test('refuses an invalid phone passed to handleClick and keeps the current value', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/phone/i);
    expect(phoneInput.value).toBe('9988776655');

    act(() => { modal.handleClick({ phone: 'abc123' }); });

    expect(phoneInput.value).toBe('9988776655');
  });

  test('applies a valid phone passed to handleClick while the field is unedited', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/phone/i);

    act(() => { modal.handleClick({ phone: '+91 555 0100' }); });

    expect(phoneInput.value).toBe('+91 555 0100');
  });

  test('never applies a passed phone once the user has edited the field', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    act(() => { modal.handleClick({ phone: '+91 555 0100' }); });

    expect(phoneInput.value).toBe('555-1234');
  });

  test('applies a different passed phone on the click after an edit-time refusal', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/phone/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    act(() => { modal.handleClick({ phone: '+91 555 0100' }); });
    expect(phoneInput.value).toBe('555-1234');

    act(() => { modal.handleClick({ phone: '+91 555 0199' }); });

    expect(phoneInput.value).toBe('+91 555 0199');
  });
});

describe('handleClick email gate', () => {
  test('refuses an invalid email passed to handleClick and keeps the current value', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const emailInput = getByLabelText(/email/i);
    expect(emailInput.value).toBe('jdoe@redhat.com');

    act(() => { modal.handleClick({ email: 'foo@bar' }); });

    expect(emailInput.value).toBe('jdoe@redhat.com');
  });

  test('applies a valid email passed to handleClick while the field is unedited', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const emailInput = getByLabelText(/email/i);

    act(() => { modal.handleClick({ email: 'denair@redhat.com' }); });

    expect(emailInput.value).toBe('denair@redhat.com');
  });

  test('never applies a passed email once the user has edited the field', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'custom@example.org' } });
    act(() => { modal.handleClick({ email: 'denair@redhat.com' }); });

    expect(emailInput.value).toBe('custom@example.org');
  });

  test('applies a different passed email on the click after an edit-time refusal', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const emailInput = getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'custom@example.org' } });
    act(() => { modal.handleClick({ email: 'denair@redhat.com' }); });
    expect(emailInput.value).toBe('custom@example.org');

    act(() => { modal.handleClick({ email: 'other@example.com' }); });

    expect(emailInput.value).toBe('other@example.com');
  });
});
