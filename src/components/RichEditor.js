import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react';
import { EditorView, minimalSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { Box, Button, ButtonGroup } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LinkIcon from '@mui/icons-material/Link';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import './RichEditor.css';

const RichEditor = forwardRef(({ value, onChange }, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleChange = useCallback((v) => {
    if (v.docChanged) {
      onChange(v.state.doc.toString());
    }
  }, [onChange]);

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        minimalSetup,
        markdown(),
        keymap.of(defaultKeymap),
        EditorView.updateListener.of(handleChange),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { minHeight: "100%", padding: "10px" },
          ".cm-line": { padding: "0 4px", lineHeight: "1.6", fontSize: "16px" },
          ".cm-cursor": { borderLeftColor: "#000", borderLeftWidth: "2px" },
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    setIsEditorReady(true);

    return () => {
      viewRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (isEditorReady && viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const currentPos = viewRef.current.state.selection.main.head;
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value },
        selection: { anchor: currentPos, head: currentPos },
      });
    }
  }, [value, isEditorReady]);

  useImperativeHandle(ref, () => ({
    getEditor: () => viewRef.current,
    focus: () => viewRef.current?.focus(),
  }));

  const insertMarkdown = useCallback((prefix, suffix = '') => {
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);
    const replacement = `${prefix}${selectedText}${suffix}`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length, head: to + prefix.length },
    });
    view.focus();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ButtonGroup variant="contained" sx={{ mb: 1 }}>
        <Button onClick={() => insertMarkdown('**', '**')}><FormatBoldIcon /></Button>
        <Button onClick={() => insertMarkdown('*', '*')}><FormatItalicIcon /></Button>
        <Button onClick={() => insertMarkdown('[', '](url)')}><LinkIcon /></Button>
        <Button onClick={() => insertMarkdown('- ')}><FormatListBulletedIcon /></Button>
        <Button onClick={() => insertMarkdown('1. ')}><FormatListNumberedIcon /></Button>
        <Button onClick={() => insertMarkdown('```mermaid\n', '\n```')}><AccountTreeIcon /></Button>
      </ButtonGroup>
      <Box ref={editorRef} className="editor-container" sx={{ flexGrow: 1, overflow: 'auto' }} />
    </Box>
  );
});

export default React.memo(RichEditor);
