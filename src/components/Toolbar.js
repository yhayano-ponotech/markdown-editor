import React from 'react';
import { supabase } from '../utils/supabaseClient';
import { AppBar, Toolbar as MuiToolbar, Button, IconButton, Typography, Switch, FormControlLabel, CircularProgress } from '@mui/material';
import { 
  Save, 
  PictureAsPdf, 
  Brightness4, 
  Brightness7, 
  Logout,
  Menu,
  SaveAlt
} from '@mui/icons-material';

const Toolbar = ({ onSave, onSaveAs, onExportPDF, darkMode, setDarkMode, onToggleSidebar, currentFile, autoSave, setAutoSave, isSaving }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAutoSaveToggle = (event) => {
    const newValue = event.target.checked;
    console.log('Auto-save toggle clicked. New value:', newValue);
    setAutoSave(newValue);
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
        <Button 
          color="inherit" 
          onClick={() => onSave('save')}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : <Save />}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button color="inherit" startIcon={<SaveAlt />} onClick={onSaveAs}>
          Save As
        </Button>
        <Button color="inherit" startIcon={<PictureAsPdf />} onClick={onExportPDF}>
          Export PDF
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={autoSave}
              onChange={handleAutoSaveToggle}
              color="secondary"
            />
          }
          label="Auto Save"
        />
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

export default React.memo(Toolbar);