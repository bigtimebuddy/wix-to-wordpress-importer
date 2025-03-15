import path from 'node:path';
import fs from 'fs-extra';
import { isURL } from './stringUtils.js';
import minimist from 'minimist';
import chalk from 'chalk';

/** Error messages to show */
const ErrorMessages = {
  InvalidSource: 'ERROR: Missing source or destination in configuration!',
  InvalidURL: 'ERROR: Invalid source or destination URL in configuration!',
  MissingConfig: 'ERROR: Missing configuration JSON file!',
  MissingConfigInput: 'ERROR: Missing configuration file input!',
  BatchType: 'ERROR: batchSize must be a number in configuration file!',
};

/** Log an error message and exit */
function fatalError(message) {
  console.error(chalk.red(message));
  process.exit(1);
}

/** Load the configuration file, validate */
export async function ensureConfig() {
  const { config: configInput } = minimist(process.argv.slice(2), {
    strings: ['config'],
    alias: {
      c: 'config',
    },
  });

  if (!configInput) {
    fatalError(ErrorMessages.MissingConfigInput);
  }

  const configFile = path.resolve(process.cwd(), configInput);

  if (!(await fs.pathExists(configFile))) {
    fatalError(ErrorMessages.MissingConfig);
  }
  const config = Object.assign(
    {
      batchSize: Number.MAX_SAFE_INTEGER,
      source: '',
      destination: '',
    },
    await fs.readJson(configFile),
  );
  if (!config.source || !config.destination) {
    fatalError(ErrorMessages.InvalidSource);
  }
  if (config.batchSize !== undefined && typeof config.batchSize !== 'number') {
    fatalError(ErrorMessages.BatchType);
  }
  if (!isURL(config.source) || !isURL(config.destination)) {
    fatalError(ErrorMessages.InvalidURL);
  }
  return config;
}
