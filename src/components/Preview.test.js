import React from 'react';
import { render, screen } from '@testing-library/react';
import Preview from './Preview';

jest.mock('react-markdown', () => {
  return ({ children }) => <div data-testid="markdown">{children}</div>;
});

test('renders markdown preview', () => {
  const markdown = '# Test Header\n\nThis is a test paragraph.';
  render(<Preview markdown={markdown} />);
  const markdownElement = screen.getByTestId('markdown');
  expect(markdownElement).toHaveTextContent('# Test Header');
  expect(markdownElement).toHaveTextContent('This is a test paragraph.');
});