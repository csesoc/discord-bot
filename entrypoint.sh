#!/bin/sh
node node_modules/puppeteer/install.js

node deploy-commands.js
node index.js