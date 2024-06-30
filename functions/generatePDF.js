const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const util = require('util');

const execPromise = util.promisify(exec);

async function processMermaidDiagrams(markdown) {
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  let processedMarkdown = markdown;
  let match;

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    const mermaidCode = match[1];
    try {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-'));
      const inputFile = path.join(tempDir, 'input.mmd');
      const outputFile = path.join(tempDir, 'output.svg');

      await fs.writeFile(inputFile, mermaidCode);

      await execPromise(`npx mmdc -i ${inputFile} -o ${outputFile}`);

      const svg = await fs.readFile(outputFile, 'utf-8');
      processedMarkdown = processedMarkdown.replace(match[0], `<div class="mermaid-diagram">${svg}</div>`);

      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error converting mermaid to SVG:', error);
      processedMarkdown = processedMarkdown.replace(match[0], '<p>Error rendering diagram</p>');
    }
  }

  return processedMarkdown;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let browser = null;
  try {
    const { markdown } = JSON.parse(event.body);

    const processedMarkdown = await processMermaidDiagrams(markdown);
    const html = marked(processedMarkdown);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.CHROME_EXECUTABLE_PATH || await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        body { font-family: Arial, sans-serif; }
        .mermaid-diagram { max-width: 100%; height: auto; }
      `;
      document.head.appendChild(style);
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=document.pdf'
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'PDF generation failed', details: error.message })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};