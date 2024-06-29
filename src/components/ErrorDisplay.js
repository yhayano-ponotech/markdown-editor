import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const ErrorDisplay = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <Box sx={{ p: 2, bgcolor: 'error.main', color: 'error.contrastText' }}>
      <Typography variant="h6">Markdown Errors:</Typography>
      <List dense>
        {errors.map((error, index) => (
          <ListItem key={index}>
            <ListItemText primary={`Line ${error.line}, Column ${error.column}: ${error.reason}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ErrorDisplay;