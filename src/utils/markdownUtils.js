export const processMarkdown = (markdown) => {
  return markdown
    .split(/\n\n+/)
    .map(paragraph => {
      if (paragraph.startsWith('```mermaid')) {
        return paragraph;
      }
      return paragraph.replace(/(?<!\n)\n(?!\n)/g, '  \n');
    })
    .join('\n\n');
};