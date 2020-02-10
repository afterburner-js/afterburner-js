const fs = require('fs');
const gulp = require('gulp');
const minifyCSS = require('gulp-csso');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const globArray = require('glob-array');
const proxy = require('./middleware/proxy');
const shelly = require('./middleware/shelly');
const { hostname, origin } = require('./middleware/common');

const { afterburnerRootDir, devTest, testPage } = process.env; // eslint-disable-line no-process-env

let afterburnerModulePath = devTest ? '..' : 'node_modules/@afterburner-js/afterburner-js';
let smokeTest;

if (afterburnerRootDir) {
  // will have a value if smoke test is running
  smokeTest = true;
  afterburnerModulePath = afterburnerRootDir;
}

if (!fs.existsSync(afterburnerModulePath)) {
  console.log(afterburnerModulePath);
  throw new Error(`can't find afterburner module path: ${afterburnerModulePath}`);
}

const dist = 'dist';

gulp.task('html', () => {

  return gulp.src('*.html')
    .pipe(gulp.dest(dist));

});

gulp.task('img', () => {

  return gulp.src('*.gif')
    .pipe(gulp.dest(dist));

});

gulp.task('libCSS', () => {

  return gulp.src('node_modules/qunit/qunit/qunit.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest(`${dist}/css`));

});

gulp.task('css', () => {

  return gulp.src('master.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest(`${dist}/css`));

});

gulp.task('sourceMaps', () => {

  return gulp.src(['node_modules/source-map-support/browser-source-map-support.js'])
    .pipe(gulp.dest(`${dist}/js`));

});

gulp.task('libs', () => {

  return browserify()
    .require('qunit')
    .bundle()
    .pipe(source('libs.js'))
    .pipe(gulp.dest(`${dist}/js`));

});

gulp.task('init', () => {

  return gulp.src(['node_modules/source-map-support/browser-source-map-support.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('init.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${dist}/js`));

});

gulp.task('js', gulp.series(() => {

  return gulp.src(
    [
      `${afterburnerModulePath}/src/classes/**/*.js`,
      `${afterburnerModulePath}/src/helpers/**/*.js`
    ])
    .pipe(gulp.dest('tmp'));

}, done => {

  if (devTest || smokeTest) {
    return gulp.src([`${afterburnerModulePath}/test-site-tests/**/*.js`])
      .pipe(gulp.dest('tests/test-site-tests'));
  }

  return done();

}, () => {

  const files = globArray.sync(['tests/**/*.js']);

  return browserify({ entries: files, debug: true })
    // when adding new aliased modules, you must add a corresponding entry in the jsconfig.json files
    .require('./afterburner-config', { expose: '@afterburner/config' })
    .require('./afterburner-helper-hooks', { expose: '@afterburner/helper-hooks' })
    .require('./afterburner-lifecycle', { expose: '@afterburner/lifecycle' })
    .require('./tmp/assertions', { expose: '@afterburner/assertions' })
    .require('./tmp/stacky-error', { expose: '@afterburner/stacky-error' })
    .require('./tmp/test-helpers', { expose: '@afterburner/test-helpers' })
    .require('./tmp/test-init', { expose: '@afterburner/test' })
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${dist}/js`));

}));

gulp.task('browserSync', done => {

  browserSync.init({
    server: {
      baseDir: dist,
      middleware: [
        shelly,
        proxy(origin)
      ],
      routes: {
        '/afterburner': dist
      },
    },
    startPath: testPage,
  });

  done();

});

gulp.task('watch', done => {

  const watchFiles = [
    './afterburner-config.js',
    './afterburner-helper-hooks.js',
    './afterburner-lifecycle.js',
    'tests/**/*.js'
  ];

  if (devTest) {
    watchFiles.push(
      '../src/classes/*.js',
      '../src/helpers/*.js',
      '../test-site-tests/**/*.js',
      '!tests/test-site-tests/**/*',
      'master.css');
  }

  gulp.watch(watchFiles, gulp.series('liveReload'));

  done();

});

function reloadBrowser(done) {
  browserSync.reload();
  done();
}

gulp.task('liveReload', gulp.series(gulp.parallel('css', 'js'), reloadBrowser));

gulp.task('ci', gulp.series('html', 'img', 'libCSS', 'css', 'sourceMaps', 'libs', 'init', 'js'));

gulp.task('default', gulp.series('ci', 'browserSync', 'watch'));
