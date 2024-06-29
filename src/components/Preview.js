import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Paper } from '@mui/material';
import mermaid from 'mermaid';
import { v4 as uuidv4 } from 'uuid';
import { processMarkdown } from '../utils/markdownUtils';
import './Preview.css';

// Mermaidの初期化（アプリケーションの起動時に一度だけ実行）
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'default',
});

const MermaidDiagram = ({ code }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = `mermaid-${uuidv4()}`;
    let isMounted = true;

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(id, code);
        if (isMounted) {
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        if (isMounted) {
          setError(err);
        }
      }
    };

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${id}"></div>`;
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (error) {
    return <pre>{code}</pre>;
  }

  return <div ref={containerRef} className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const Preview = ({ markdown }) => {
  const processedMarkdown = processMarkdown(markdown);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, minHeight: '100%' }}>
        <div id="preview-content">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="preview-paragraph">{children}</p>,
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                if (match && match[1] === 'mermaid') {
                  return <MermaidDiagram key={uuidv4()} code={String(children).trim()} />;
                }
                return <code className={className} {...props}>{children}</code>;
              },
            }}
          >
            {processedMarkdown}
          </ReactMarkdown>
        </div>
      </Paper>
    </Box>
  );
};

export default Preview;