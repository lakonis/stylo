'use strict';
/* eslint-disable no-console, no-invalid-this */

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpFile = require('gulp-file');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');
var tape = require('gulp-tape');
var tapSpec = require('tap-spec');
var bundleStyles = require('substance/util/bundleStyles');

var buildDir = path.join(__dirname, 'build');
var distDir = path.join(__dirname, 'dist');
var examples = require('./examples/config').examples;

function assets() {
  // copy example index.html files
  var subtasks = examples.map(function(exampleFolder) {
    gulp.src(path.join('examples', exampleFolder, 'index.html'))
      .pipe(gulp.dest(path.join(distDir, exampleFolder)));
  });
  // copy example assets
  gulp.src('examples/data/*')
    .pipe(gulp.dest(path.join(distDir, 'data')));
  // copy font-awesome fonts
  gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest(path.join(distDir, 'fonts')));
}

function sass() {
  var subtasks = examples.map(function(exampleFolder) {
    return bundleStyles({
      rootDir: __dirname,
      configuratorPath: require.resolve('./packages/common/BaseConfigurator'),
      configPath: require.resolve('./examples/'+exampleFolder+'/package'),
      sass: {
        sourceMap: false,
        outputStyle: 'compressed'
      }
    }).then(function(css) {
      gulpFile('app.css', css, { src: true })
        .pipe(gulp.dest(path.join(distDir, exampleFolder)));
    }).catch(function(err) {
      console.error(err);
    });
  });
  return Promise.all(subtasks);
}

function bundle()

gulp.task('browserify', function() {
  examples.forEach(function(exampleFolder) {
    gulp.src(path.join('examples', exampleFolder, 'app.js'))
      .pipe(through2.obj(function (file, enc, next) {
        browserify(file.path)
          .bundle(function (err, res) {
            if (err) { return next(err); }
            file.contents = res;
            next(null, file);
          });
      }))
      .on('error', function (error) {
        console.log(error.stack);
        this.emit('end');
      })
      .pipe(uglify().on('error', function(err){console.log(err); }))
      .pipe(gulp.dest('./dist/'+exampleFolder));
  });
});

// copies assets into dist folder (e.g., index.html, fonts)
gulp.task('assets', assets);
gulp.task('sass', sass);

gulp.task('lint', function() {
  return gulp.src([
    './examples/**/*.js',
    './packages/**/*.js',
    './test/**/*.js',
  ]).pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test:server', ['lint'], function() {
  return gulp.src([
    'test/jats/*.test.js'
  ])
  .pipe(tape({
    reporter: tapSpec()
  }));
});

gulp.task('test', ['test:server']);

gulp.task('default', ['assets', 'sass', 'browserify']);
