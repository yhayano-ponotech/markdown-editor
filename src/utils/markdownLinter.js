export const lintMarkdown = async (markdown) => {
  const errors = [];
  const lines = markdown.split('\n');

  lines.forEach((line, index) => {
    // 見出しのチェック（すべてのレベルの見出しに対応）
    if (/^#+/.test(line)) {
      const headingMatch = line.match(/^(#+)(.*)$/);
      if (headingMatch) {
        const [, hashes, content] = headingMatch;
        if (!content.startsWith(' ')) {
          errors.push({
            line: index + 1,
            column: hashes.length + 1,
            reason: 'Heading should have a space after #',
          });
        } else if (content.trim() === '') {
          errors.push({
            line: index + 1,
            column: hashes.length + 2,
            reason: 'Heading should have content',
          });
        }
      }
    }



    // リンクの簡易チェック
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      if (match[1].trim() === '') {
        errors.push({
          line: index + 1,
          column: match.index + 1,
          reason: 'Link text should not be empty',
        });
      }
      if (match[2].trim() === '') {
        errors.push({
          line: index + 1,
          column: match.index + match[1].length + 3,
          reason: 'Link URL should not be empty',
        });
      }
    }

    // その他のチェックをここに追加できます
  });

  return errors;
};