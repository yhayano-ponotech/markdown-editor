import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Transition } from 'react-transition-group';
import RichEditor from './components/RichEditor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import ErrorDisplay from './components/ErrorDisplay';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import { saveDocument, loadDocument, loadDocumentList } from './utils/api';
import { saveToLocalStorage, loadFromLocalStorage, saveAutoSaveState, loadAutoSaveState } from './utils/localStorage';
import { lintMarkdown } from './utils/markdownLinter';
import 'svg2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from './utils/supabaseClient';
import mermaid from 'mermaid';
import './fonts.css';
import { installFont } from './utils/fontUtils';

const duration = 300;

const defaultStyle = {
  transition: `width ${duration}ms ease-in-out`,
  width: 0,
};

const transitionStyles = {
  entering: { width: '250px' },
  entered: { width: '250px' },
  exiting: { width: 0 },
  exited: { width: 0 },
};

function App() {
  const [session, setSession] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [errors, setErrors] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [autoSave, setAutoSave] = useState(() => loadAutoSaveState());
  const [isSaving, setIsSaving] = useState(false);
  const [fonts, setFonts] = useState([]);
  const [currentFont, setCurrentFont] = useState('');

  const autoSaveTimerRef = useRef(null);
  const editorRef = useRef(null);
  const currentFileRef = useRef(null);
  const autoSaveRef = useRef(autoSave);
  const currentFontRef = useRef(currentFont);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: darkMode ? 'dark' : 'default',
    });
  }, [darkMode]);

  useEffect(() => {
    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (session) {
      loadDocumentList().then(setFiles).catch(console.error);
      const lastSelectedFile = loadFromLocalStorage('last-selected-file');
      if (lastSelectedFile) {
        loadDocument(lastSelectedFile).then(({ content, font }) => {
          setMarkdown(content);
          setCurrentFont(font || 'Arial');
          setCurrentFile(lastSelectedFile);
        }).catch(console.error);
      }
    } else {
      const localContent = loadFromLocalStorage('markdown-content');
      if (localContent) {
        setMarkdown(localContent);
      }
    }
  }, [session]);

  useEffect(() => {
    console.log('Auto-save status changed:', autoSave);
    autoSaveRef.current = autoSave;
    saveAutoSaveState(autoSave);
  }, [autoSave]);

  useEffect(() => {
    currentFileRef.current = currentFile;
    console.log('Current file updated:', currentFile);
  }, [currentFile]);

  useEffect(() => {
    currentFontRef.current = currentFont;
  }, [currentFont]);

  useEffect(() => {
    // フォントリストを取得
    const fontContext = require.context('./assets/fonts', false, /\.ttf$/);
    const fontFiles = fontContext.keys().map(key => key.replace('./', ''));
    const fontNames = fontFiles.map(file => file.replace('.ttf', ''));
    setFonts(fontNames);
    
    if (fontNames.length > 0) {
      setCurrentFont(fontNames[0]);
    }
  }, []);

  const handleAutoSaveToggle = useCallback((value) => {
    console.log('Setting auto-save to:', value);
    setAutoSave(value);
  }, []);

  const handleMarkdownChange = useCallback(async (newMarkdown) => {
    setMarkdown(newMarkdown);
    const lintErrors = await lintMarkdown(newMarkdown);
    setErrors(lintErrors);
    saveToLocalStorage('markdown-content', newMarkdown);

    console.log('Markdown changed. Auto-save:', autoSaveRef.current, 'Current file:', currentFileRef.current);

    if (autoSaveRef.current && currentFileRef.current) {
      console.log('Preparing to auto-save...');
      setIsSaving(true);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(async () => {
        console.log('Auto-save timer triggered');
        try {
          await saveDocument(newMarkdown, currentFileRef.current, currentFontRef.current);
          console.log('Auto-saved successfully');
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    } else {
      console.log('Auto-save conditions not met');
    }
  }, []);

  const handleSave = useCallback(async (saveType) => {
    console.log('Manual save triggered:', saveType);
    try {
      setIsSaving(true);
      let fileName = currentFileRef.current;
      if (saveType === 'saveAs' || !fileName) {
        fileName = prompt('Enter file name:');
        if (!fileName) {
          setIsSaving(false);
          return;
        }
      }
      console.log('Saving document with font:', currentFontRef.current);
      await saveDocument(markdown, fileName, currentFontRef.current);
      setCurrentFile(fileName);
      currentFileRef.current = fileName;
      saveToLocalStorage('last-selected-file', fileName);
      const updatedFiles = await loadDocumentList();
      setFiles(updatedFiles);
      if (saveType !== 'auto') {
        alert('Document saved successfully!');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [markdown]);

  const handleFileSelect = async (fileName) => {
    try {
      const { content, font } = await loadDocument(fileName);
      setMarkdown(content);
      setCurrentFont(font || 'Arial');
      setCurrentFile(fileName);
      currentFileRef.current = fileName;
      saveToLocalStorage('last-selected-file', fileName);
      console.log('File selected:', fileName);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('preview-content');
    const pdf = new jsPDF('p', 'pt', 'a4');
    
    // カスタムフォントをインストール
    const fontInstalled = await installFont(pdf, currentFont, `/assets/fonts/${currentFont}.ttf`);
    
    if (fontInstalled) {
      pdf.setFont(currentFont);
    } else {
      console.warn('Failed to load custom font. Using default font.');
    }
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    let verticalOffset = margin;

    pdf.setFontSize(12);
  
    const processElement = async (el) => {
      if (el.classList.contains('mermaid-diagram')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = el.innerHTML;
        document.body.appendChild(tempDiv);
        
        const canvas = await html2canvas(tempDiv, {
          scale: 4,
          logging: false,
          useCORS: true
        });
        
        document.body.removeChild(tempDiv);
  
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        if (verticalOffset + imgHeight > pdfHeight - margin) {
          pdf.addPage();
          verticalOffset = margin;
        }
  
        pdf.addImage(imgData, 'PNG', margin, verticalOffset, imgWidth, imgHeight);
        verticalOffset += imgHeight + 20;
      } else if (el.tagName === 'P') {
        const text = el.textContent;
        const splitText = pdf.splitTextToSize(text, pdfWidth - 2 * margin);

        if (verticalOffset + pdf.getTextDimensions(splitText).h > pdfHeight - margin) {
          pdf.addPage();
          verticalOffset = margin;
        }

        pdf.text(splitText, margin, verticalOffset);
        verticalOffset += pdf.getTextDimensions(splitText).h + 10;
      }
    };
  
    const processChildren = async (parent) => {
      for (const child of parent.children) {
        await processElement(child);
        if (child.children.length > 0) {
          await processChildren(child);
        }
      }
    };
  
    await processChildren(element);
  
    pdf.save('document.pdf');
  };

  const handleFontChange = useCallback((newFont) => {
    console.log('Changing font to:', newFont);
    setCurrentFont(newFont);
    currentFontRef.current = newFont;
    if (autoSave && currentFile) {
      handleSave('auto');
    }
  }, [autoSave, currentFile, handleSave]);

  if (!session) {
    return <Auth onLogin={ async () => { 
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Toolbar
          onSave={() => handleSave('save')}
          onSaveAs={() => handleSave('saveAs')}
          onExportPDF={handleExportPDF}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          currentFile={currentFile}
          autoSave={autoSave}
          setAutoSave={handleAutoSaveToggle}
          isSaving={isSaving}
          currentFont={currentFont}
          fonts={fonts}
          onFontChange={handleFontChange}
        />
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Transition in={showSidebar} timeout={duration}>
            {state => (
              <Box style={{
                ...defaultStyle,
                ...transitionStyles[state]
              }}>
                <Sidebar files={files} onFileSelect={handleFileSelect} currentFile={currentFile} />
              </Box>
            )}
          </Transition>
          <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <RichEditor
                  ref={editorRef}
                  value={markdown}
                  onChange={handleMarkdownChange}
                  currentFont={currentFont}
                  fonts={fonts}
                  onFontChange={handleFontChange}
                />
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Preview markdown={markdown} font={currentFont} />
              </Box>
            </Box>
          </Box>
        </Box>
        <ErrorDisplay errors={errors} />
      </Box>
    </ThemeProvider>
  );
}

export default App;