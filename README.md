# CSESoc Discord Bot

## Installation
* Install Node.js and npm from https://nodejs.org/en/download/
* Clone the repository with `git clone https://github.com/csesoc/discord-bot`
* Rename `.env.example` to `.env` and fill in
  - `DISCORD_TOKEN` with the token of the bot
  - `APP_ID` with the ID of the bot application
* Install dependencies with `npm install`
* Register slash commands with `node deploy-commands.js`
* Start the bot with `node index.js`
