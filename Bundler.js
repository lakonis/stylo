'use strict';

var oo = require('substance/util/oo');
var isPlainObject = require('lodash/isPlainObject');
var isString = require('lodash/isString');
var browserify = require('browserify');
var path = require('path');
var vm = require('vm');
var Watcher = require('./Watcher');

function Bundler(opts) {
  opts = opts || {};
  // one shared watcher which collects a cache
  // for all required files shared by all entry points
  this.watcher = new Watcher(opts);
}

Bundler.Prototype = function() {

  /*

  bundler.bundle([
    './foo', // used as entry, but will not be exposed
    {
      // this is just another file part of the bundle
      // not used as an entry, but exposed under the name 'bar'
      file: './bar'
      entry: false, // default: true
      expose: 'bar' // default: false
    }
  ]);

  */
  this.bundle = function(entries, opts) {
    entries = _prepareEntries(entries);
    // console.log('### entries', entries);
    var watcher = this.watcher;

    // var startTime = Date.now();
    return new Promise(function(resolve, reject) {
      opts = Object.assign({
        // cache and packageCache are used by `module-deps`
        // Note: it is important to provide that here
        // as browserify will deliver a copy of this hash
        // to `module-deps` during construction
        cache: watcher.cache,
        packageCache: watcher.packageCache
      }, opts);
      var b = browserify(opts);
      entries.forEach(function(entry) {
        b.require(entry.file, entry);
      });
      // this starts watching but also does the caching
      watcher.watch(b);
      b.bundle(function(err, buf) {
        if (err) return reject(err);
        else {
          // console.info('Bundling took %s ms', Date.now()-startTime);
          return resolve(buf);
        }
      });
    });
  };

  this.getStyles = function(opts) {
    var rootDir = opts.rootDir || process.cwd();
    var configuratorPath = opts.configuratorPath;
    var configurationPath = opts.configurationPath;
    if (!configuratorPath) {
      throw new Error("'configuratorPath' is required");
    }
    if (!configurationPath) {
      throw new Error("'configurationPath' is required");
    }
    return this.bundle([{
      file: path.join(rootDir, configuratorPath),
      expose: 'Configurator'
    }, {
      file: path.join(rootDir, configurationPath),
      expose: 'Package'
    }])
    .then(function(buf) {
      var sandbox = {};
      var context = new vm.createContext(sandbox);
      var script = new vm.Script(buf);
      script.runInContext(context);
      var s2 = new vm.Script([
        "var Configurator = require('Configurator');",
        "var Package = require('Package');",
        "var config = new Configurator().import(Package);",
        "styles = config.getStyles();"
      ].join('\n'));
      s2.runInContext(context);
      return sandbox.styles;
    });
  };

  function _prepareEntries(entries) {
    if (isString(entries)) {
      entries = [entries];
    }
    return entries.map(function(entry) {
      var _entry;
      if (isString(entry)) {
        _entry = {
          file: entry,
          entry: true,
          expose: false,
        };
      } else if (isPlainObject(entry)) {
        if (!entry.file) {
          throw new Error("'file' is required.");
        }
        _entry = Object.assign({
          entry: true,
          expose: false
        }, entry);
      } else {
        throw new Error('Illegal argument.');
      }
      // HACK: browserify has a strange semantic regarding 'expose' and 'entry'
      // 'entry=true' leads to 'expose=false' implicitly
      if (_entry.expose) {
        _entry.entry = false;
      }
      return _entry;
    });
  }

};

oo.initClass(Bundler);

module.exports = Bundler;
