import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App, { isValidPhone, Modal } from './App';

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
