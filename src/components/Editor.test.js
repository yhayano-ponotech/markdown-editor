import React from 'react';
import { render, screen } from '@testing-library/react';
import Editor from './Editor';

test('renders editor with initial value', () => {
  const initialValue = '# Test Markdown';
  render(<Editor value={initialValue} onChange={() => {}} />);
  expect(screen.getByText('Test Markdown')).toBeInTheDocument();
});