 # GuildbankSync discord bot
 
 This bot takes an CSV export from the addon Guild Bank List Creator Plus in the CSV format
 
 Install the addon then use `/gblc csv true` to enable CSV exports, then `/gblc` to do an export
 
 Copy the export string, move to Discord and use the command `/importbank` then paste the exported string
 
 The bot will then process the export and post it into the desired channel.
 
 ## Installation
 
 - Clone the repository, install with `npm install`
 
 - Copy the `config.example.json`, and rename to `config.json` - fill out the necessary fields
 
 - If this is for a new server, or commands in the bot have changed, you may need to run `npm run deploy-changes` to register slash commands into the server
 
 - Run the server with `npm run start-bot`
 
 - The `/importbank` command should now function while this is running
 
 - If deploying to a server for permanant usage, install as a service
 
 