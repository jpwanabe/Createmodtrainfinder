const fs = require('fs');
const zlib = require('zlib');
const nbt = require('prismarine-nbt');

async function showTrainData() {
  const file = fs.readFileSync('./create_tracks.dat');

  let decompressed;
  try {
    decompressed = zlib.gunzipSync(file);
    console.log("File was compressed, successfully decompressed it.");
  } catch {
    console.log("File was not compressed.");
    decompressed = file;
  }

  const { parsed } = await nbt.parse(decompressed);
  const trains = parsed.value?.data?.value?.Trains?.value?.value;

  if (!trains || typeof trains !== 'object') {
    console.log("❌ Trains is not a compound or object.");
    return;
  }

  const firstKey = Object.keys(trains)[0];
  const train = trains[firstKey]; // <-- No more .value.value here

  if (!train) {
    console.log("❌ Train structure not found.");
    return;
  }

  // Extract and print values
  let name = '';
  try {
    name = JSON.parse(train?.Name?.value)?.text || '';
  } catch {
    name = train?.Name?.value || '';
  }

  const speed = train?.Speed?.value ?? 'N/A';
  const derailed = train?.Derailed?.value ?? 'N/A';
  const throttle = train?.Throttle?.value ?? 'N/A';
  const fuel = train?.Fuel?.value ?? 'N/A';
  const backwards = train?.Backwards?.value ?? 'N/A';
  const doubleEnded = train?.DoubleEnded?.value ?? 'N/A';

  console.log(`🚂 Train ID: ${firstKey}`);
  console.log(`Name: ${name}`);
  console.log(`Speed: ${speed}`);
  console.log(`Derailed: ${derailed}`);
  console.log(`Throttle: ${throttle}`);
  console.log(`Fuel: ${fuel}`);
  console.log(`Backwards: ${backwards}`);
  console.log(`DoubleEnded: ${doubleEnded}`);
}

showTrainData().catch(console.error);
