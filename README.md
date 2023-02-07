# CSESoc Discord Bot

## Installation

-   Install Node.js and npm from https://nodejs.org/en/download/
-   Clone the repository with `git clone https://github.com/csesoc/discord-bot`
-   Go to `.env` and fill in
    -   `DISCORD_TOKEN` with the token of the bot
    -   `APP_ID` with the ID of the bot application
-   Install dependencies with `npm install`
-   Register slash commands with `node deploy-commands.js` or `npm run de`
-   Start the bot with `node index.js`

## Running the bot with Nodemon

-   Nodemon has been installed, this addition allows for continuous integration with and hot reloads the bot upon saving.
-   Run the bot with Nodemon using npm run server