import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Transition } from 'react-transition-group';
import RichEditor from './components/RichEditor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import ErrorDisplay from './components/ErrorDisplay';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import { saveDocument, loadDocument, loadDocumentList } from './utils/api';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/localStorage';
import { lintMarkdown } from './utils/markdownLinter';
import 'svg2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from './utils/supabaseClient';
import mermaid from 'mermaid';

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
  const editorRef = useRef(null);

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
        loadDocument(lastSelectedFile).then((content) => {
          setMarkdown(content);
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

  const handleMarkdownChange = async (newMarkdown) => {
    setMarkdown(newMarkdown);
    const lintErrors = await lintMarkdown(newMarkdown);
    setErrors(lintErrors);
    saveToLocalStorage('markdown-content', newMarkdown);
  };

  const handleSave = async (saveType) => {
    try {
      let fileName = currentFile;
      if (saveType === 'saveAs' || !fileName) {
        fileName = prompt('Enter file name:');
        if (!fileName) return;
      }
      await saveDocument(markdown, fileName);
      setCurrentFile(fileName);
      saveToLocalStorage('last-selected-file', fileName);
      const updatedFiles = await loadDocumentList();
      setFiles(updatedFiles);
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  };

  const handleFileSelect = async (fileName) => {
    try {
      const content = await loadDocument(fileName);
      setMarkdown(content);
      setCurrentFile(fileName);
      saveToLocalStorage('last-selected-file', fileName);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('preview-content');
    const pdf = new jsPDF();
    let verticalOffset = 10;

    const processMermaidDiagrams = async () => {
      const mermaidDiagrams = element.querySelectorAll('.mermaid-diagram');
      for (const diagram of mermaidDiagrams) {
        try {
          const canvas = await html2canvas(diagram, {
            scale: 2,
            logging: false,
            useCORS: true
          });
          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          if (verticalOffset + pdfHeight > pdf.internal.pageSize.getHeight() - 10) {
            pdf.addPage();
            verticalOffset = 10;
          }

          pdf.addImage(imgData, 'PNG', 10, verticalOffset, pdfWidth, pdfHeight);
          verticalOffset += pdfHeight + 10;
        } catch (error) {
          console.error('Error processing Mermaid diagram:', error);
        }
      }
    };

    const processTextElements = () => {
      const textElements = element.querySelectorAll('p');
      for (const textElement of textElements) {
        pdf.setFontSize(12);
        const splittedText = pdf.splitTextToSize(textElement.textContent, pdf.internal.pageSize.getWidth() - 20);
        
        if (verticalOffset + splittedText.length * 7 > pdf.internal.pageSize.getHeight() - 10) {
          pdf.addPage();
          verticalOffset = 10;
        }

        pdf.text(splittedText, 10, verticalOffset);
        verticalOffset += splittedText.length * 7 + 5;
      }
    };

    processTextElements();
    await processMermaidDiagrams();

    pdf.save('document.pdf');
  };

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
                <RichEditor ref={editorRef} value={markdown} onChange={handleMarkdownChange} />
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Preview markdown={markdown} />
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