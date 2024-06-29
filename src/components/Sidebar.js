import React from 'react';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';

const Sidebar = ({ files, onFileSelect, currentFile }) => {
  const groupedFiles = files.reduce((acc, file) => {
    const date = new Date(file.updated_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(file);
    return acc;
  }, {});

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', bgcolor: 'background.paper' }}>
      {Object.entries(groupedFiles).sort(([a], [b]) => b.localeCompare(a)).map(([date, files]) => (
        <Box key={date}>
          <Typography variant="subtitle2" sx={{ p: 1, bgcolor: 'background.default' }}>
            {new Date(date).toLocaleDateString()}
          </Typography>
          <List dense>
            {files.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).map((file) => (
              <ListItem
                button
                key={file.id}
                selected={currentFile === file.name}
                onClick={() => onFileSelect(file.name)}
              >
                <ListItemText 
                  primary={file.name}
                  secondary={new Date(file.updated_at).toLocaleTimeString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar;