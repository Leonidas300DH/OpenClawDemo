import fs from 'fs/promises';
import path from 'path';

/**
 * Read and parse JSON file
 * @param {string} filePath 
 * @returns {Promise<any>} Parsed JSON data
 */
export async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty structure based on filename
      if (filePath.includes('feeds.json')) {
        return { feeds: [] };
      } else if (filePath.includes('tags.json')) {
        return { tagsByEpisodeId: {} };
      }
      return {};
    }
    throw error;
  }
}

/**
 * Write JSON data to file atomically (temp file + rename)
 * @param {string} filePath 
 * @param {any} data 
 */
export async function writeJsonAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  const jsonData = JSON.stringify(data, null, 2);
  
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write to temp file
    await fs.writeFile(tempPath, jsonData, 'utf8');
    
    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}