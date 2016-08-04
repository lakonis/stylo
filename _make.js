'use strict';

var extend = require('lodash/extend');
var forEach = require('lodash/forEach');
var isArray = require('lodash/isArray');
var isPlainObject = require('lodash/isPlainObject');
var path = require('path');
var glob = require('glob');
var gaze = require('gaze');
var vfs = require('vinyl-fs');

var cwd = process.cwd();

var make = {
  targets: {},
  state: {
    _done: {},
    _started: {},
    _watched: {},
    _watch: false
  },
};

// rule(targetName, [deps,] [options,] handler)
make.rule = function(targetName, deps, options, handler) {
  if (!isArray(deps)) {
    handler = options;
    options = deps;
    deps = [];
  }
  if (!isPlainObject(options)) {
    handler = options;
    options = {};
  }
  this.targets[targetName] = extend({
    name: targetName,
    run: handler,
    dependencies: deps,
    base: cwd,
  }, options);
};

function _watch(state, target, err, watcher) {
  watcher.on('all', function(event, filepath) {
    if (event === 'added' || event === 'changed') {
      console.info('Updating %s using target "%s"', path.relative(cwd, filepath), target.name);
      if (target.file) {
        var startTime = Date.now();
        var res = target.file(filepath, state);
        if (res) {
          res.then(function() {
            console.info('... finished after %s ms', Date.now()-startTime);
          });
        }
      } else if (target.stream) {
        target.stream(vfs.src(filepath, { base: target.base }));
      }
    }
  });
}

function _startWatch(state, target, file) {
  if (!state._watch) return;
  if (!state._watched[file]) {
    // console.log('watching file', file);
    gaze(file, _watch.bind(this, state, target)); // eslint-disable-line no-invalid-this
    state._watched[file] = true;
  }
}

make._startWatch = function() {
  var state = this.state;
  if (!state._watch) return;
  var targets = this.targets;
  forEach(targets, function(target) {
    var src = target.src;
    if (!src) return;
    var pattern = path.join(cwd, src);
    _startWatch.bind(this)(state, target, pattern);
  }.bind(this));
};

make._run = function(targetName) {
  var state = this.state;
  var target = this.targets[targetName];
  if (!target) throw new Error('Unknown target ' + targetName);
  // if already done return a resolved promise
  if (state._done[targetName]) return Promise.resolve();
  // prevent cyclic calls
  if (state._started[targetName]) throw new Error('Cyclic dependency detected in target: ' + targetName);
  state._started[targetName] = true;
  // call dependencies first
  var result;
  var deps = target.dependencies;
  if (deps) {
    result = Promise.all(deps.map(function(depName) {
      return this._run(depName);
    }.bind(this)));
  } else {
    result = Promise.resolve();
  }
  var src = target.src;
  // console.info('Making target %s', targetName);
  var startTime = Date.now();
  if (!src && target.run) {
    result = result.then(function() {
      return target.run(state);
    });
  } else {
    if (target.stream) {
      result = result.then(function() {
        return new Promise(function(resolve, reject) {
          var res = target.stream(vfs.src(src));
          if (res) {
            res.on('end', resolve)
              .on('error', reject);
          } else {
            resolve();
          }
        });
      });
    } else if (target.file) {
      result = result.then(function() {
        var files = glob.sync(src, target.base);
        return Promise.all(files.map(function(file) {
          return target.file(file, state, _startWatch.bind(this, state, target));
        }.bind(this)));
      }.bind(this));
    }
  }
  return result.then(function() {
    console.info('Finished target %s in %s ms', targetName, (Date.now()-startTime));
    state._done[targetName] = true;
  });
};

// expose API globally
global.rule = make.rule.bind(make);

// load local makefile
var makefile = require.resolve('./makefile');
require(makefile);

// extract command-line args
var argv = require('yargs')
  .boolean('w')
  .alias('w', 'watch')
  .argv;

var targetNames = argv._;
if (argv.w || argv.watch) {
  make.state._watch = true;
}

// run tasks
function next() {
  if (targetNames.length === 0) {
    return _finally();
  }
  var targetName = targetNames.shift();
  make._run(targetName).then(function() {
    next();
  }).catch(function(err) {
    console.error(err);
  });
}
function _finally() {
  if (make.state._watch) {
    console.info('Starting to watch files...');
    make._startWatch();
  }
}
next();
