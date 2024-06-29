import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { supabase } from './utils/supabaseClient';

jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      session: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

jest.mock('./utils/markdownLinter', () => ({
  lintMarkdown: jest.fn().mockResolvedValue([]),
}));

test('renders login form when not authenticated', () => {
  supabase.auth.session.mockReturnValue(null);
  render(<App />);
  expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test('renders editor when authenticated', () => {
  supabase.auth.session.mockReturnValue({ user: { id: '123' } });
  render(<App />);
  expect(screen.getByText(/Save/i)).toBeInTheDocument();
});