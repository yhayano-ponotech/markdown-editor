import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Paper } from '@mui/material';
import mermaid from 'mermaid';
import { v4 as uuidv4 } from 'uuid';
import { processMarkdown } from '../utils/markdownUtils';
import './Preview.css';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'default',
});

const MermaidDiagram = React.memo(({ code }) => {
  const containerRef = useRef(null);

  const renderDiagram = useCallback(async () => {
    if (containerRef.current) {
      const id = `mermaid-${uuidv4()}`;
      try {
        containerRef.current.innerHTML = `<div id="${id}"></div>`;
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering failed:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre>${code}</pre>`;
        }
      }
    }
  }, [code]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  return <div ref={containerRef} className="mermaid-diagram" />;
});

const Preview = React.memo(({ markdown }) => {
  const processedMarkdown = useMemo(() => processMarkdown(markdown), [markdown]);

  const components = useMemo(() => ({
    p: ({ children }) => {
      if (children[0] === '&nbsp;') {
        return <p className="preview-paragraph empty-paragraph">&nbsp;</p>;
      }
      return <p className="preview-paragraph">{children}</p>;
    },
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      if (match && match[1] === 'mermaid') {
        return <MermaidDiagram code={String(children).trim()} />;
      }
      return <code className={className} {...props}>{children}</code>;
    },
  }), []);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, minHeight: '100%' }}>
        <div id="preview-content">
          <ReactMarkdown components={components}>
            {processedMarkdown}
          </ReactMarkdown>
        </div>
      </Paper>
    </Box>
  );
});

export default Preview;