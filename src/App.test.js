import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App, { isValidEmail, isValidPhone, Modal } from './App';

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
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });

    expect(phoneInput.value).toBe('abc123');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/phone number can only contain/i)).toBeInTheDocument();
  });

  test('associates the inline error with the phone input as polite feedback', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });

    expect(phoneInput).toHaveAttribute('aria-errormessage', 'contact-error');
    const error = getByText(/phone number can only contain/i);
    expect(error).toHaveAttribute('id', 'contact-error');
    expect(error).toHaveAttribute('role', 'status');
  });

  test('clears the inline error once the value is fixed', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    expect(queryByText(/phone number can only contain/i)).toBeInTheDocument();

    fireEvent.change(phoneInput, { target: { value: '9988776655' } });
    expect(queryByText(/phone number can only contain/i)).not.toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('accepts a formatted phone number without showing an error', () => {
    const { getByLabelText, queryByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

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
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: '+91 99887 76655' } });
    fireEvent.click(getByText('A'));

    expect(phoneInput.value).toBe('+91 99887 76655');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('clicking a contact card keeps an invalid phone value and its error', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    fireEvent.click(getByText('B'));

    expect(phoneInput.value).toBe('abc123');
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    expect(getByText(/phone number can only contain/i)).toBeInTheDocument();
  });

  test('applies the card phone again on the next card click after an edit', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    fireEvent.click(getByText('A'));
    expect(phoneInput.value).toBe('555-1234');

    fireEvent.click(getByText('B'));
    expect(phoneInput.value).toBe('9988776655');
  });

  test('protects a second in-progress edit after a card click reset the latch', () => {
    const { getByLabelText, getByText } = render(<App />);
    const phoneInput = getByLabelText(/contact/i);

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

describe('remove confirmation', () => {
  test('clicking Remove asks for confirmation instead of deleting the contact', () => {
    const { getByText, getByRole } = render(<App />);

    fireEvent.click(getByText('A'));
    fireEvent.click(getByText('Remove'));

    expect(getByRole('alertdialog')).toBeInTheDocument();
    expect(getByText(/remove deepesh nair from your contacts\?/i)).toBeInTheDocument();
    expect(getByText('A')).toBeInTheDocument();
  });

  test('canceling the confirmation keeps the contact', () => {
    const { getByText, getByRole, queryByRole } = render(<App />);

    fireEvent.click(getByText('B'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Cancel' }));

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(getByText('B')).toBeInTheDocument();
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

    const removeButton = getByText('Remove');
    expect(removeButton).toBeDisabled();

    fireEvent.click(removeButton);

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('Remove is unavailable again after a confirmed removal and the detail view is reset', () => {
    const { getByText, getByRole, queryByRole, queryByText } = render(<App />);

    fireEvent.click(getByText('E'));
    fireEvent.click(getByText('Remove'));
    fireEvent.click(getByRole('button', { name: 'Remove contact' }));

    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(queryByText('E')).not.toBeInTheDocument();
    // The detail view no longer shows the removed contact's data.
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

    // Escape cancels and returns focus to the Remove button.
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(getByText('Remove')).toHaveFocus();
  });

  test('shows an empty state once every contact has been removed', () => {
    const { getByText, getByRole } = render(<App />);

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach((initial) => {
      fireEvent.click(getByText(initial));
      fireEvent.click(getByText('Remove'));
      fireEvent.click(getByRole('button', { name: 'Remove contact' }));
    });

    expect(getByText('No contacts yet')).toBeInTheDocument();
  });
});

describe('handleClick phone gate', () => {
  test('refuses an invalid phone passed to handleClick and keeps the current value', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/contact/i);
    expect(phoneInput.value).toBe('9988776655');

    act(() => { modal.handleClick({ phone: 'abc123' }); });

    expect(phoneInput.value).toBe('9988776655');
  });

  test('applies a valid phone passed to handleClick while the field is unedited', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/contact/i);

    act(() => { modal.handleClick({ phone: '+91 555 0100' }); });

    expect(phoneInput.value).toBe('+91 555 0100');
  });

  test('never applies a passed phone once the user has edited the field', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/contact/i);

    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    act(() => { modal.handleClick({ phone: '+91 555 0100' }); });

    expect(phoneInput.value).toBe('555-1234');
  });

  test('applies a different passed phone on the click after an edit-time refusal', () => {
    let modal;
    const { getByLabelText } = render(<Modal ref={ (instance) => { modal = instance; } } />);
    const phoneInput = getByLabelText(/contact/i);

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
