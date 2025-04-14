const fs = require('fs');
const ftp = require('basic-ftp');
const nbt = require('prismarine-nbt');
const path = require('path');
const config = require('./config.json');

const NBT_FILE_PATH = path.join(__dirname, '..', 'create_tracks.dat');
const MAX_FILE_AGE_MS = 5 * 60 * 1000; 

async function downloadNBTFile() {
  try {
    if (fs.existsSync(NBT_FILE_PATH)) {
      const stats = fs.statSync(NBT_FILE_PATH);
      const ageMs = Date.now() - stats.mtimeMs;

      if (ageMs < MAX_FILE_AGE_MS) {
        console.log(`⏳ Skipping download (file age: ${(ageMs / 1000).toFixed(1)}s)`);
        return NBT_FILE_PATH;
      }
    }

    const client = new ftp.Client();
    client.ftp.verbose = false;

    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: config.ftp.secure ?? false
    });

    await client.downloadTo(NBT_FILE_PATH, config.ftp.remoteFilePath);
    console.log('✅ NBT file downloaded successfully.');
    client.close();

    return NBT_FILE_PATH;
  } catch (err) {
    console.error('❌ Error downloading NBT file:', err);
    throw err;
  }
}
async function parseNBTFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const { parsed } = await nbt.parse(buffer);
  return parsed;
}

module.exports = {
  downloadNBTFile,
  parseNBTFile
};
