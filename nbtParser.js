const fs = require('fs');
const ftp = require('basic-ftp');
const nbt = require('prismarine-nbt');
const path = require('path');
const config = require('./config.json');

async function downloadNBTFile() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: config.ftp.host,
      user: config.ftp.user,
      password: config.ftp.password,
      secure: config.ftp.secure
    });
    const localPath = path.join(__dirname, 'create_tracks.dat');
    await client.downloadTo(localPath, config.ftp.remoteFilePath);
    return localPath;
  } catch (error) {
    console.error('FTP Error:', error);
    throw error;
  } finally {
    client.close();
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
