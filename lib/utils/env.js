/**
 * Environment variable loader and validator.
 * Must be called once at startup before any other module.
 */

const path = require('path');
const fs = require('fs');

const REQUIRED_VARS = ['APIFY_TOKEN', 'DEEPSEEK_TOKEN'];

function load() {
  require('dotenv').config();

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Add them to your .env file:');
    missing.forEach((key) => console.error(`  ${key}=your_value_here`));
    process.exit(1);
  }
}

/**
 * Get a validated env var. Exits if missing.
 */
function requireVar(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: ${name} is not set in environment.`);
    process.exit(1);
  }
  return value;
}

/**
 * Get an optional env var with a default fallback.
 */
function optionalVar(name, fallback) {
  return process.env[name] || fallback;
}

module.exports = { load, requireVar, optionalVar };
