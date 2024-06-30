import { jsPDF } from 'jspdf';

async function loadFont(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.error(`Failed to fetch font: ${response.statusText}`);
      return undefined;
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export async function installFont(pdf, name, path, style = 'normal') {
  console.log(`Installing font: ${name} from ${path}`);
  const fontData = await loadFont(path);
  if (!fontData) return false;

  console.log(`Font data loaded, size: ${fontData.length} bytes`);
  const fileName = `${name}.ttf`;
  
  try {
    const base64Font = btoa(String.fromCharCode.apply(null, fontData));
    pdf.addFileToVFS(fileName, base64Font);
    console.log('Font added to VFS');
    pdf.addFont(fileName, name, style);
    console.log('Font added to PDF');
    return true;
  } catch (error) {
    console.error('Error installing font:', error);
    return false;
  }
}