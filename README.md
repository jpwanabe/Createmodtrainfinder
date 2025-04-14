# Createmodtrainfinder
Create mod train locator discord bot



This is a bot I made to detect some info about create trains and their current status!

Using this bot you can locate where your train is in the world, the dimension, it's speed, if it is in a deadlock(not moving but navigating), if it has derailed, and if it is schedule or in maunal mode.

It also has a catch if you search a train that is not found or if you search something that has too many results.

![image](https://github.com/user-attachments/assets/ff63b7c9-c2b4-4baa-920d-2b669204f9d1)



This bot uses FTP to get the current version of the create_tracks.dat file to find out where trains were when the file was last save(every 5 min or so). So this is not 100% accurate for moving trains.


To use the bot, make sure you have node.js installed and just run `npm install` to have it add the 3 dependacies needed to run.
They are 
`basic-ftp`
`discord.js`
`prismarine-nbt`

as outlined in the pacakge.json.

Feel free to reach out to me if you have any suggestions on discord if you have suggestions or need help. 
