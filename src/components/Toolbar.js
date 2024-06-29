import React from 'react';
import { supabase } from '../utils/supabaseClient';
import { AppBar, Toolbar as MuiToolbar, Button, IconButton, Typography } from '@mui/material';
import { 
  Save, 
  PictureAsPdf, 
  Brightness4, 
  Brightness7, 
  Logout,
  Menu,
  SaveAlt
} from '@mui/icons-material';

const Toolbar = ({ onSave, onSaveAs, onExportPDF, darkMode, setDarkMode, onToggleSidebar, currentFile }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppBar position="static">
      <MuiToolbar>
        <IconButton color="inherit" onClick={onToggleSidebar} edge="start" sx={{ mr: 2 }}>
          <Menu />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {currentFile || 'Untitled'}
        </Typography>
        <Button color="inherit" startIcon={<Save />} onClick={onSave}>
          Save
        </Button>
        <Button color="inherit" startIcon={<SaveAlt />} onClick={onSaveAs}>
          Save As
        </Button>
        <Button color="inherit" startIcon={<PictureAsPdf />} onClick={onExportPDF}>
          Export PDF
        </Button>
        <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
        <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
          Logout
        </Button>
      </MuiToolbar>
    </AppBar>
  );
};

export default Toolbar;