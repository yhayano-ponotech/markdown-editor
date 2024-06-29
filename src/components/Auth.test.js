import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from './Auth';
import { supabase } from '../utils/supabaseClient';

jest.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signIn: jest.fn(),
    },
  },
}));

beforeAll(() => {
  global.alert = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('handles login submission', async () => {
  supabase.auth.signIn.mockResolvedValue({ error: null });
  render(<Auth onLogin={() => {}} />);
  
  fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Send magic link/i }));

  await waitFor(() => {
    expect(supabase.auth.signIn).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  expect(global.alert).toHaveBeenCalledWith('Check your email for the login link!');
});