'use strict';

/* this file is interpreted by substance-make */
/* globals rule */

var fs = require('fs');
var fse = require('fs-promise');
var path = require('path');

var buildDir = path.join(__dirname, 'build');
var distDir = path.join(__dirname, 'dist');
var examplesDir = path.join(__dirname, 'examples');

var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
// var vfs = require('vinyl-fs');

/* clean */

rule('clean', function() {
  return Promise.all([
    fse.remove(buildDir),
    fse.remove(distDir),
  ]);
});

/* assets */

rule('assets', ['assets:examples', 'assets:data', 'assets:fontawesome']);

rule('assets:examples', {
  src: 'examples/**/*.html',
  file: function(file) {
    return fse.copy(
      file,
      path.join(distDir, path.relative(examplesDir, file))
    );
  }
});

rule('assets:data', {
  src: 'examples/data/*',
  file: function(file) {
    return fse.copy(
      file,
      path.join(distDir, 'data', path.basename(file))
    );
  }
});

rule('assets:fontawesome', {
  src: 'node_modules/font-awesome/fonts/*',
  file: function(file) {
    return fse.copy(
      file,
      path.join(distDir, 'fonts', path.basename(file))
    );
  }
});

var browserifyCache = {};
var browserifyPackageCache = {};

function _browserify(state, file, dest) {
  fse.mkdirsSync(path.dirname(dest));
  return new Promise(function(resolve, reject) {
    var b = browserify(file, {
      debug: true,
      extensions: ['.js', '.jsx'],
      cache: browserifyCache,
      packageCache: browserifyPackageCache
    })
    .transform(babelify, {
      presets: ['es2015'],
      plugins: [
        "external-helpers",
        'syntax-jsx',
        [ 'transform-react-jsx', { "pragma": "$$" } ]
      ]
    });
    if (state._watch) {
      b.plugin(watchify);
    }
    b.on('update', bundle);
    function bundle() {
      var startTime = Date.now();
      return b.bundle()
        .pipe(fs.createWriteStream(dest))
        .on('finish', function() {
          console.info('bundled %s in %s ms', dest, Date.now()-startTime);
        });
    }
    bundle().on('finish', resolve).on('error', reject);
  });
}

rule('bundle:author', function(state) {
  var file = path.join(__dirname, 'examples', 'author', 'app.js');
  var dest = path.join(distDir, 'author', 'app.js');
  return _browserify(state, file, dest);
});

rule('bundle:publisher', function(state) {
  var file = path.join(__dirname, 'examples', 'publisher', 'app.js');
  var dest = path.join(distDir, 'publisher', 'app.js');
  return _browserify(state, file, dest);
});

rule('bundle', ['assets', 'bundle:author', 'bundle:publisher']);
