/*
 * ask.js: Handles package.json writing
 *
 * Copyright © 2011 Pavan Kumar Sunkara. All rights reserved
 */

var ask = module.exports;

/*
 * Requiring modules
 */
var path = require('path')
  , fs = require('fs')
  , police = require('../police');

/*
 * Properties of fields
 */
var prop = [];

/*
 * Weights of fields
 */
var weights = {
  'name': 15,
  'version': 14,
  'author': 13,
  'description': 12,
  'contributors': 6,
  'main': 11,
  'scripts': 7,
  'repository': 10,
  'keywords': 9,
  'homepage': 8,
  'dependencies': 5,
  'devDependencies': 4,
  'bugs': 2,
  'licenses': 1,
  'engines': 3
};

/*
 * Github data for fields
 */
ask.gh = {};

/*
 * Lock until we get github data
 */
var ghlock = false;

/*
 * Build prompt properties
 */
ask.properties = function (pkg, gh) {
  ghlock = true;
  police.github.get('/users/' + gh.user, function (user) {
    ask.gh.user = user;

    police.github.get('/repos/' + gh.name, function (repo) {
      ask.gh.repo = repo;

      police.github.v2('/repos/show/' + gh.name + '/contributors', function (contrib) {
        if (contrib.contributors) {
          ask.gh.contrib = contrib.contributors;
        } else {
          ask.gh.contrib = [ask.gh.user];
        }

        ask.gh.name = gh.name;
        ask.gh.tree = gh.tree;
        ask.gh.mode = gh.mode;
        ask.gh.commit = gh.commit;
        ask.gh.content = gh.content;

        ghlock = false;
      });
    });
  });
}

/*
 * The main function which asks fields and writes them
 */
ask.fields = function (pkg, fields, callback) {
  ask.release(function () {
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.devDependencies) pkg.devDependencies = {};
    if (!pkg.scripts) pkg.scripts = {};

    if (!pkg.name || police.edit) {
      prop.push({
        description: 'Module name',
        name: 'name',
        pattern: /^[a-zA-Z0-9\-_\.]+$/,
        message: 'Module name must be valid',
        required: true,
        default: ask.gh.repo.name
      });
    }

    if (!pkg.version || police.edit) {
      prop.push({
        description: 'Version',
        name: 'version',
        conform: function (v) { return police.semver.valid(v); },
        message: 'Version must conform to semver',
        required: true,
        default: '0.1.0'
      });
    }

    if (!pkg.author || police.edit) {
      prop.push({
        description: 'Author',
        name: 'author',
        required: true,
        default: ask.gh.user.name + ' <' + ask.gh.user.email + '> (' + ask.gh.user.blog + ')'
      });
    }

    if (!pkg.description || police.edit) {
      prop.push({
        description: 'Description',
        name: 'description',
        default: ask.gh.repo.description
      });
    }

    if (!pkg.main || police.edit) {
      prop.push({
        description: 'Main script',
        name: 'main',
      });
    }

    if (!pkg.homepage || police.edit) {
      prop.push({
        description: 'Homepage',
        name: 'homepage',
        default: 'http://' + ask.gh.user.login + '.github.com/' + ask.gh.repo.name
      });
    }

    if (!pkg.keywords || police.edit) {
      prop.push({
        description: 'Keywords (space seperated)',
        name: 'keywords'
      });
    }

    if (!pkg.licenses || police.edit) {
      prop.push({
        description: 'Licenses (MIT/Apache2/GPL3)',
        name: 'licenses',
        default: 'MIT'
      });
    }

    if (!pkg.engines || !pkg.engines.node || police.edit) {
      prop.push({
        description: 'Node version',
        name: 'node',
        default: '>=0.4'
      });
    }

    police.prompt.start();

    police.prompt.addProperties(pkg, prop, function (err) {
      pkg.contributors = ask.gh.contrib.map(function (e) { return {name: e.name, email: e.email}; });
      pkg.repository = {type: 'git', url: ask.gh.repo.git_url};
      pkg.bugs = {url: ask.gh.repo.html_url + '/issues'}

      if (typeof pkg.keywords == 'string') {
        pkg.keywords = pkg.keywords.split(' ');
      } else if (!pkg.keywords) {
        pkg.keywords = [];
      }

      if (pkg.node) {
        if (pkg.engines) {
          pkg.engines.node = pkg.node;
        } else {
          pkg.engines = {node: pkg.node};
        }
        delete pkg.node;
      }

      if (typeof pkg.licenses == 'string') {
        pkg.licenses = [{type: pkg.licenses, url: ask.gh.repo.html_url + '/raw/master/LICENSE'}];
      }

      if (pkg.license) {
        if (typeof pkg.license == 'object') pkg.licenses = pkg.license;
        delete pkg.license;
      }

      if (pkg.engine) {
        pkg.engines = pkg.engine;
        delete pkg.engine;
      }

      police.github.write(JSON.stringify(ask.sort(pkg), null, 2) + '\n', function () {
        prop = [];
        callback();
      });
    });
  });
}

/*
 * Updates the package.json dependencies only
 */
ask.update = function (pkg, callback) {
  ask.release(function () {
    police.github.write(JSON.stringify(pkg, null, 2) + '\n', function () {
      callback();
    });
  });
}

/*
 * Weights for package.json fields
 */
ask.weight = function (i) {
  return weights[i] || 0;
}

/*
 * Sort package.json fields
 */
ask.sort = function (o) {
  var newo = {};
  Object.keys(o).sort(function (a,b) { return ask.weight(b) - ask.weight(a); }).forEach(function(k) { newo[k]=o[k]; });
  return newo;
}

/*
 * Wait until lock is released
 */
ask.release = function (callback) {
  if (ghlock) {
    setTimeout(ask.release, 1000, callback);
  } else {
    callback();
  }
}

/*
 * The main function which write dependencies
 */
ask.packages = function () {

}
