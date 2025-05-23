const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const { downloadNBTFile, parseNBTFile } = require('./nbtParser');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});


const commands = [
  new SlashCommandBuilder()
    .setName('findtrain')
    .setDescription('Search for your train in the world.')
    .addStringOption(option =>
      option.setName('train_name')
        .setDescription('The name of the train that is missing')
        .setRequired(true))
    .toJSON(),
	
	new SlashCommandBuilder()
    .setName('derailed')
    .setDescription('List all derailed trains in the world.')
    .toJSON(),
	
	
  new SlashCommandBuilder()
    .setName('deadlock')
    .setDescription('List all trains currently stuck waiting for a signal (deadlocked).')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(config.botToken);

(async () => {
  try {
    console.log('Registering slash commands...');
await rest.put(
  Routes.applicationCommands(config.clientId),
  { body: commands }
);
    console.log('Slash commands registered.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'findtrain') {
    try {
      await interaction.deferReply();
      const searchParam = interaction.options.getString('train_name').toLowerCase();

      const filePath = await downloadNBTFile();
      const nbtData = await parseNBTFile(filePath);
      const trains = nbtData.value?.data?.value?.Trains?.value?.value || {};

      const results = [];

		for (const train of Object.values(trains)) {
		  const rawName = train?.Name?.value;
		let name = '';
		if (typeof rawName === 'string') {//Create 5 train names
		  try {
			const parsed = JSON.parse(rawName);
			name = typeof parsed?.text === 'string' ? parsed.text : rawName;
		  } catch {
			name = rawName; // Create 6 train names
		  }
		}

			//derail
		  if (name && name.toLowerCase().includes(searchParam)) {
			const derailedRaw = train?.Derailed?.value ?? 0;
			const derailed = derailedRaw === 1 ? 'Yes' : 'No';

			//pos
			let position = 'N/A';
			try {
			  const posTag = train
				?.Carriages?.value?.value?.[0]
				?.Entity?.value
				?.Pos;

			  const posList = posTag?.value?.value;

			  if (Array.isArray(posList) && posList.length === 3) {
				const [x, y, z] = posList.map(n => Math.round(n));
				position = `${x} ${y} ${z}`;
			  } else {
				console.log(`❌ Pos list invalid for "${name}":`, posTag);
			  }
			} catch (err) {
			  console.log(`⚠️ Error reading position for "${name}":`, err);
			}
			
			//dead lock
			
			let deadlock = 'No';
			try {
			  const ticks = train?.Navigation?.value?.TicksWaitingForSignal?.value;
			  if (typeof ticks === 'number' && ticks > 500) {
				deadlock = 'Yes';
			  }
			} catch {
			  deadlock = 'No';
			}
			
			// I am SPEEED
			const speed = typeof train?.Speed?.value === 'number'
			  ? train.Speed.value.toFixed(2)
			  : 'N/A';
			  
			  // on a schedule?
			  
			const navEntries = train?.Navigation?.value;
			const hasNavigation = navEntries && Object.keys(navEntries).length > 0 ? 'Yes' : 'No';
			
			
			
			  //where in the world

			let dimId;
			try {
			  const carriage = train?.Carriages?.value?.value?.[0];
			  const positioningList = carriage?.EntityPositioning?.value?.value; // should be an array
			  const firstEntry = positioningList?.[0];
			  dimId = firstEntry?.Dim?.value;
			} catch {
			  dimId = undefined;
			}
			const epList = train
			  ?.Carriages?.value?.value?.[0]
			  ?.Entity?.value
			  ?.EntityPositioning;



			const dimension = {
			  0: 'Overworld',
			  [-1]: 'The End',
			  [1]: 'Nether'
			}[dimId] || (dimId !== undefined ? `Unknown (${dimId})` : 'N/A');



			results.push({
			  name,
			  derailed,
			  position,
			  deadlock,
			  speed,
			  dimension,
			  navigation: hasNavigation
			});
		  }
		}


if (results.length === 0) {
  return await interaction.editReply('❌ No matching trains found.');
}

if (results.length >= 5) {
  return await interaction.editReply('⚠️ Too many matches! Please refine your search.');
}

const embed = new EmbedBuilder()
    .setTitle(`Found ${results.length} train${results.length > 1 ? 's' : ''}`)
    .setColor(0x00AEEF);

  for (const result of results) {
embed.addFields({
  name: result.name,
  value:
    `📍 Position: \`${result.position}\`\n` +
    `🌎 World: \`${result.dimension}\`\n` +
    `⚡ Speed: \`${result.speed}\`\n` +
    `🛑 Deadlock: \`${result.deadlock}\`\n`+
	`🚆 Derailed: \`${result.derailed}\`\n`+
	`📡 Navigation Active: \`${result.navigation}\``
});  }

  await interaction.editReply({ embeds: [embed] });


    } catch (err) {
      console.error("❌ Error handling /findtrain:", err);
      try {
        await interaction.editReply('❌ An error occurred while processing the request.');
      } catch {}
    }
  };
  
  if (interaction.commandName === 'derailed') {
  try {
    await interaction.deferReply();

    const filePath = await downloadNBTFile();
    const nbtData = await parseNBTFile(filePath);
    const trains = nbtData.value?.data?.value?.Trains?.value?.value || {};

    const derailedTrains = [];

    for (const train of Object.values(trains)) {
      const rawName = train?.Name?.value;
      let name = '';
      try {
        const parsed = JSON.parse(rawName);
        name = typeof parsed?.text === 'string' ? parsed.text : rawName;
      } catch {
        name = rawName;
      }

      const isDerailed = train?.Derailed?.value === 1;
      if (!isDerailed) continue;

      // 🗺️ Get dimension ID
      let dimId;
      try {
        const carriage = train?.Carriages?.value?.value?.[0];
        const positioningList = carriage?.EntityPositioning?.value?.value;
        const firstEntry = positioningList?.[0];
        dimId = firstEntry?.Dim?.value;
      } catch {
        dimId = undefined;
      }

      const dimension = {
        0: 'Overworld',
        [-1]: 'The End',
        1: 'Nether'
      }[dimId] || (dimId !== undefined ? `Unknown (${dimId})` : 'N/A');

      let position = 'N/A';
      const posList = train?.Carriages?.value?.value?.[0]?.Entity?.value?.Pos?.value?.value;
      if (Array.isArray(posList) && posList.length === 3) {
        const [x, y, z] = posList.map(n => Math.round(n));
        position = `${x} ${y} ${z}`;
      }

      derailedTrains.push({ name, position, dimension });
    }

    if (derailedTrains.length === 0) {
      return await interaction.editReply('✅ No trains are currently derailed.');
    }

    const chunks = [];
    for (let i = 0; i < derailedTrains.length; i += 10) {
      chunks.push(derailedTrains.slice(i, i + 10));
    }

    const embeds = chunks.map((group, i) => {
      const embed = new EmbedBuilder()
        .setTitle(`🚨 Derailed Trains (${i * 10 + 1}–${i * 10 + group.length} of ${derailedTrains.length})`)
        .setColor(0xFF5555);

      for (const train of group) {
        embed.addFields({
          name: train.name || 'Unnamed Train',
          value: `📍 Position: \`${train.position}\`\n🌎 Dimension: \`${train.dimension}\``
        });
      }

      return embed;
    });

    await interaction.editReply({ embeds });

  } catch (err) {
    console.error("❌ Error handling /derailed:", err);
    try {
      await interaction.editReply('❌ An error occurred while processing the request.');
    } catch {}
  }
}

  if (interaction.commandName === 'deadlock') {
  try {
    await interaction.deferReply();

    const filePath = await downloadNBTFile();
    const nbtData = await parseNBTFile(filePath);
    const trains = nbtData.value?.data?.value?.Trains?.value?.value || {};

    const deadlockedTrains = [];

    for (const train of Object.values(trains)) {
      const rawName = train?.Name?.value;
      let name = '';
      try {
        const parsed = JSON.parse(rawName);
        name = typeof parsed?.text === 'string' ? parsed.text : rawName;
      } catch {
        name = rawName;
      }

      const ticks = train?.Navigation?.value?.TicksWaitingForSignal?.value;
      const isDeadlocked = typeof ticks === 'number' && ticks > 500;
      if (!isDeadlocked) continue;

      // 📍 Position
      let position = 'N/A';
      const posList = train?.Carriages?.value?.value?.[0]?.Entity?.value?.Pos?.value?.value;
      if (Array.isArray(posList) && posList.length === 3) {
        const [x, y, z] = posList.map(n => Math.round(n));
        position = `${x} ${y} ${z}`;
      }

      // 🌍 Dimension
      let dimId;
      try {
        const carriage = train?.Carriages?.value?.value?.[0];
        const positioningList = carriage?.EntityPositioning?.value?.value;
        const firstEntry = positioningList?.[0];
        dimId = firstEntry?.Dim?.value;
      } catch {
        dimId = undefined;
      }

      const dimension = {
        0: 'Overworld',
        [-1]: 'The End',
        1: 'Nether'
      }[dimId] || (dimId !== undefined ? `Unknown (${dimId})` : 'N/A');

      deadlockedTrains.push({ name, position, dimension });
    }

    if (deadlockedTrains.length === 0) {
      return await interaction.editReply('✅ No trains are currently in a deadlock state.');
    }

    const chunks = [];
    for (let i = 0; i < deadlockedTrains.length; i += 10) {
      chunks.push(deadlockedTrains.slice(i, i + 10));
    }

    const embeds = chunks.map((group, i) => {
      const embed = new EmbedBuilder()
        .setTitle(`🚦 Deadlocked Trains (${i * 10 + 1}–${i * 10 + group.length} of ${deadlockedTrains.length})`)
        .setColor(0xFF8800);

      for (const train of group) {
        embed.addFields({
          name: train.name || 'Unnamed Train',
          value: `📍 Position: \`${train.position}\`\n🌎 Dimension: \`${train.dimension}\``
        });
      }

      return embed;
    });

    await interaction.editReply({ embeds });

  } catch (err) {
    console.error("❌ Error handling /deadlock:", err);
    try {
      await interaction.editReply('❌ An error occurred while processing the request.');
    } catch {}
  }
}

  
});

client.login(config.botToken);
