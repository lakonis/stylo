'use strict';

var oo = require('substance/util/oo');

var through = require('through2');
var path = require('path');
var chokidar = require('chokidar');
var xtend = require('xtend');
var anymatch = require('anymatch');

function Watcher(opts) {
  opts = opts || {};

  this.cache = {};
  this.packageCache = {};
  this.fwatchers = {};
  this.fwatcherFiles = {};
  this.ignoredFiles = {};

  this.updating = false;

  this.shouldWatch = (opts.watch !== false);
  this.ignored = '**/node_modules/**';

  // make sure that watchers are disposed on exit
  process.on('exit', this.dispose.bind(this));
}

Watcher.Prototype = function() {

  this.dispose = function () {
    var fwatchers = this.fwatchers;
    Object.keys(fwatchers).forEach(function (id) {
      fwatchers[id].forEach(function (w) { w.close(); });
    });
  };

  this.watch = function(b) {

    var self = this;
    var packageCache = this.packageCache;

    // b.on('reset', this._collect.bind(this, b));
    // Note: this registers a hook that updates the cache
    this._collect(b);

    // watch all files that are processed
    b.on('file', function (file) {
      self._watchFile(file);
    });

    // watch all package.json files of all visited modules
    b.on('package', function (pkg) {
      var file = path.join(pkg.__dirname, 'package.json');
      self._watchFile(file);
      packageCache[file] = pkg;
    });

    // TODO: why is this necessary?
    b.on('transform', function (tr, mfile) {
      tr.on('file', function (dep) {
        self._watchFile(mfile, dep);
      });
    });

    // managing a semaphore to avoid rebundling while
    // we are updating
    b.on('bundle', function (bundle) {
      self.updating = true;
      bundle.on('error', onend);
      bundle.on('end', onend);
      function onend () { self.updating = false; }
    });

    return b;
  };


  this._collect = function(b) {
    var cache = this.cache;
    b.pipeline.get('deps').push(through.obj(function(row, enc, next) {
      var file = row.expose ? b._expose[row.id] : row.file;
      cache[file] = {
        source: row.source,
        deps: xtend(row.deps)
      };
      this.push(row); // eslint-disable-line no-invalid-this
      next();
    }));
  };

  this._invalidate = function(id) {
    delete this.cache[id];
    delete this.packageCache[id];
    if (!this.updating && this.fwatchers[id]) {
      this.fwatchers[id].forEach(function (w) {
        w.close();
      });
      delete this.fwatchers[id];
      delete this.fwatcherFiles[id];
    }
  };

  // taken from watchify, dunno the details
  this._watchFile = function(file, dep) {
    dep = dep || file;
    if (!this.shouldWatch) return;
    if (!this.ignoredFiles.hasOwnProperty(file)) {
      this.ignoredFiles[file] = anymatch(this.ignored, file);
    }
    if (this.ignoredFiles[file]) return;

    if (!this.fwatchers[file]) this.fwatchers[file] = [];
    if (!this.fwatcherFiles[file]) this.fwatcherFiles[file] = [];
    if (this.fwatcherFiles[file].indexOf(dep) >= 0) return;

    var w = chokidar.watch(dep, { persistent: true });
    w.setMaxListeners(0);
    w.on('error', function(err) {
      console.error(err);
    });
    w.on('change', function () {
      this.invalidate(file);
    }.bind(this));
    this.fwatchers[file].push(w);
    this.fwatcherFiles[file].push(dep);
  };

};

oo.initClass(Watcher);

module.exports = Watcher;
