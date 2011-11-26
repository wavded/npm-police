/*
 * auth.js: Handles police's authentication
 *
 * Copyright © 2011 Pavan Kumar Sunkara. All rights reserved
 */

var auth = module.exports;

/*
 * Requiring modules
 */
var prompt = require('prompt')
    , police = require('../police');

/*
 * Fields for authentication
 */
var properties = [
  {
    name: 'username',
    validator: /^[a-zA-Z0-9][a-zA-Z\-]+$/,
    warning: 'Username must be a github username',
    empty: false
  },
  {
    name: 'password',
    hidden: true
  }
];

auth.prompt = function () {
  /*
   * Start the prompt
   */
  prompt.start();

  /*
   * Get the username and password from the user
   */
  prompt.get(properties, function (err, result) {
    if (err) throw err;
    police.winston.silly('Authenicating to github.'.cyan);
    police.github.token(result);
  });
}

auth.logout = function () {
  police.config.set('_id', null);
  police.config.set('name', null);
  police.config.set('token', null);
  police.winston.info('User has been logged out');
  police.config.save(police);
}