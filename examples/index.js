/**
 * @file index.js
 * @description
 * This file gets ran when the `examples`
 * npm script is executed.
 */

import util from './util';

const exampleModuleNames = ['basic', 'extend', 'exclude'];

exampleModuleNames.map(exampleModuleName => {
  const execute = require(`./${exampleModuleName}`);

  util.printExampleBanner(exampleModuleName);

  execute();
});
