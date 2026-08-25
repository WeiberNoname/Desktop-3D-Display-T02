const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'scratch_create_locales.js');
let code = fs.readFileSync(targetFile, 'utf8');

// Ensure all 12 translation files are generated and checked for key parity
const createLocales = require('./scratch_create_locales.js');
