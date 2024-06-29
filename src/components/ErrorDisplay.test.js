import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

test('renders error messages', () => {
  const errors = [
    { line: 1, column: 5, reason: 'Test error 1' },
    { line: 2, column: 10, reason: 'Test error 2' },
  ];
  render(<ErrorDisplay errors={errors} />);
  expect(screen.getByText(/Test error 1/)).toBeInTheDocument();
  expect(screen.getByText(/Test error 2/)).toBeInTheDocument();
});

test('does not render when there are no errors', () => {
  render(<ErrorDisplay errors={[]} />);
  expect(screen.queryByText(/Markdown Errors:/)).not.toBeInTheDocument();
});