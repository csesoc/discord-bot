#!/bin/sh
node deploy-commands.js
npx puppeteer browsers install chrome
node index.js