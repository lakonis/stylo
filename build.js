'use strict';
/* eslint-disable no-console, no-invalid-this */

var fs = require('fs');
var fse = require('fs-promise');
var path = require('path');

var eslint = require("eslint");
var uglify = require("uglify-js");
var sass = require('node-sass');

var Bundler = require('./Bundler');

var argv = require('yargs')
  .boolean('d').alias('d', 'debug').default('d', false)
  .boolean('w').alias('w', 'watch').default('w', false);

var debug = argv.d;
var watch = argv.w;

var distDir = path.join(__dirname, 'dist');
var examples = require('./examples/config').examples;
var bundler = new Bundler({ watch: watch });

// TODO: maybe we want something more sophisticated later
// for now this is just a script
all();

function all() {
  var t = Date.now();
  var p = clean()
    .then(lint)
    .then(assets);
  examples.forEach(function(exampleFolder) {
    p = p.then(makeExampleJS.bind(null, exampleFolder))
         .then(makeExampleCSS.bind(null, exampleFolder));
  });
  p.then(function() {
    console.info('Build finished in %s ms', Date.now()-t);
    process.exit(0);
  }).catch(function(err) {
    console.error(err);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(-1);
  });
}

function clean() {
  return fse.remove('./dist');
}

function lint() {
  return new Promise(function(resolve, reject) {
    console.info('Running eslint...');
    var t = Date.now();
    var cli = new eslint.CLIEngine();
    var report = cli.executeOnFiles([
      "examples/", "packages/", "test/"
    ]);
    if (report.errorCount > 0) {
      var formatter = cli.getFormatter();
      reject(formatter(report.results));
    } else {
      console.info('eslint finished in %s ms', Date.now()-t);
      resolve();
    }
  });
}

function assets() {
  console.info('Copying assets...');
  var t = Date.now();
  return fse.mkdirs(distDir)
  .then(function() {
    return fse.copy('examples/data', path.join(distDir, 'data'));
  })
  .then(function() {
    return fse.copy('node_modules/font-awesome/fonts',
      path.join(distDir, 'fonts'));
  })
  .then(function() {
    return Promise.all(examples.map(function(exampleFolder) {
      return fse.mkdirs(path.join(distDir, exampleFolder))
      .then(function() {
        return fse.copy(path.join('examples', exampleFolder, 'index.html'),
          path.join(distDir, exampleFolder, 'index.html'));
      });
    }));
  })
  .then(function() {
    console.info('  finished in %s ms', Date.now()-t);
  });
}

function makeExampleJS(exampleFolder) {
  var entry = path.join('examples', exampleFolder, 'app.js');
  var dest = path.join(distDir, exampleFolder, 'app.js');
  console.info('Creating %s...', path.join(exampleFolder, 'app.js'));
  var t = Date.now();
  // create the output folder
  fse.mkdirsSync(path.dirname(dest));
  var result = bundler.bundle(entry)
    .then(function(buf) {
      return fse.writeFile(dest, buf);
    });
  if (!debug) {
    result.then(function() {
      var res = uglify.minify(dest);
      return fse.writeFile(dest, res.code);
    });
  }
  result.then(function() {
    console.info('  finished in %s ms', Date.now()-t);
  });
  return result;
}

function makeExampleCSS(exampleFolder) {
  var cssFile = path.join(distDir, exampleFolder, 'app.css');
  var mapFile = path.join(distDir, exampleFolder, 'app.map.css');
  console.info('Creating %s...', cssFile);
  var t = Date.now();
  var result = bundler.getStyles({
    rootDir: __dirname,
    configuratorPath: './packages/texture/TextureConfigurator',
    configurationPath: './examples/'+exampleFolder+'/package'
  }).then(function(scssFiles) {
    var scss = scssFiles.map(function(scssFile) {
      return "@import '."+scssFile+"';";
    }).join('\n');
    var sassOptions = {
      data: scss,
      sourceMap: true
    };
    fse.mkdirsSync(path.dirname(cssFile));
    return new Promise(function(resolve, reject) {
      sass.render(sassOptions, function(err, result) {
        if (err) reject(err);
        else {
          fs.writeFileSync(cssFile, result.css);
          fs.writeFileSync(mapFile, result.map);
          resolve();
        }
      });
    });
  });
  result.then(function() {
    console.info('  finished in %s ms', Date.now()-t);
  });
  return result;
}
