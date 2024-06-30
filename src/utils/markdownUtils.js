export const processMarkdown = (markdown) => {
  return markdown
    .split('\n')
    .map(line => line.trim() === '' ? '&nbsp;' : line)
    .join('\n');
};