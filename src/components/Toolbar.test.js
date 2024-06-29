import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from './Toolbar';

test('renders toolbar buttons', () => {
  render(
    <Toolbar
      onSave={() => {}}
      onExportPDF={() => {}}
      onFormatText={() => {}}
      darkMode={false}
      setDarkMode={() => {}}
    />
  );
  expect(screen.getByText(/Save/i)).toBeInTheDocument();
  expect(screen.getByText(/Export PDF/i)).toBeInTheDocument();
});

test('calls onSave when save button is clicked', () => {
  const mockOnSave = jest.fn();
  render(
    <Toolbar
      onSave={mockOnSave}
      onExportPDF={() => {}}
      onFormatText={() => {}}
      darkMode={false}
      setDarkMode={() => {}}
    />
  );
  fireEvent.click(screen.getByText(/Save/i));
  expect(mockOnSave).toHaveBeenCalled();
});