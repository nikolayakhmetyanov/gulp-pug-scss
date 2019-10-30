global.$ = {
  fs: require('fs'),
};

const gulp = require('gulp'),
      del = require('del'),
      autoprefixer = require('gulp-autoprefixer'),
      browserSync = require('browser-sync'),
      sass = require('gulp-sass'),
      pug = require('gulp-pug'),
      htmlValidator = require('gulp-w3c-html-validator'),
      concat = require("gulp-concat"),
      rename = require("gulp-rename"),
      newer = require('gulp-newer'),
      responsive = require('gulp-responsive'),
      plumber = require('gulp-plumber');

const paths = {
  dirs: {
    build: './build'
  },
  html: {
    src: './src/pages/*.pug',
    dest: './build',
    watch: ['./src/pages/*.pug', './src/templates/*.pug', './src/blocks/**/*.pug']
  },
  css: {
    src: './src/styles/style.scss',
    dest: './build/css',
    watch: ['./src/blocks/**/*.scss', './src/styles/**/*.scss', './src/styles/*.scss']
  },
  js: {
    src: ['./src/js/common.js'],
    dest: './build/js',
    watch: ['./src/js/common.js'],
    watchPlugins: './src/plugins/*.js'
  },
  images: {
    src: './src/assets/img/src/**/*',
    dest: './build/img/',
    watch: ['./src/assets/img/**/*']
  },
  svg: {
    src: './src/assets/img/svg/**/*',
    dest: './build/img/',
    watch: ['./src/assets/img/**/*']
  },
  fonts: {
    src: './src/assets/fonts/*',
    dest: './build/fonts',
    watch: './src/assets/fonts/*'
  }
};

gulp.task('clean', function () {
  return del(paths.dirs.build);
});

gulp.task('templates', function () {
  return gulp.src(paths.html.src)
    .pipe(plumber())
    .pipe(pug({
      locals : {
        nav: JSON.parse($.fs.readFileSync('./src/assets/navigation.json', 'utf8'))
      },
      pretty: true
    }))
    .pipe(htmlValidator()) 
    .pipe(gulp.dest(paths.html.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('styles', function () {
  return gulp.src(paths.css.src)
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer({
      grid: true,
      overrideBrowserslist: ['last 10 versions']
    }))
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('scripts', function () {
  return gulp.src(paths.js.src)
    .pipe(plumber())
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest(paths.js.dest));
});

// Responsive Images
var quality = 50; // Responsive images quality

// Produce @1x images
gulp.task('img-responsive-1x', async function() {
  return gulp.src(paths.images.src + '.{png,jpg,jpeg,webp,raw}')
    .pipe(newer(paths.images.dest + '@1x'))
    .pipe(responsive({
      '**/*': { width: '50%', quality: quality }
    })).on('error', function (e) { console.log(e) })
    .pipe(rename(function (path) {path.extname = path.extname.replace('jpeg', 'jpg')}))
    .pipe(gulp.dest(paths.images.dest + '@1x'))
});

// Produce @2x images
gulp.task('img-responsive-2x', async function() {
  return gulp.src(paths.images.src + '.{png,jpg,jpeg,webp,raw}')
    .pipe(newer(paths.images.dest + '@2x'))
    .pipe(responsive({
      '**/*': { width: '100%', quality: quality }
    })).on('error', function (e) { console.log(e) })
    .pipe(rename(function (path) {path.extname = path.extname.replace('jpeg', 'jpg')}))
    .pipe(gulp.dest(paths.images.dest + '@2x'))
});

// Clean @*x IMG's
gulp.task('cleanimg', function() {
  return del([paths.images.dest + '@*'], { force: true })
});

gulp.task('svg', function () {
  return gulp.src(paths.svg.src)
    .pipe(gulp.dest(paths.svg.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('images', gulp.series('svg', 'img-responsive-1x', 'img-responsive-2x'));

gulp.task('fonts', function () {
  return gulp.src(paths.fonts.src)
    .pipe(plumber())
    .pipe(gulp.dest(paths.fonts.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: paths.dirs.build
    },
    reloadOnRestart: true
  });
  gulp.watch(paths.html.watch, gulp.parallel('templates'));
  gulp.watch(paths.css.watch, gulp.parallel('styles'));
  gulp.watch(paths.js.watch, gulp.parallel('scripts'));
  gulp.watch(paths.js.watchPlugins, gulp.parallel('scripts'));
  gulp.watch(paths.images.watch, gulp.parallel('images'));
  gulp.watch(paths.fonts.watch, gulp.parallel('fonts'));
});


gulp.task('build', gulp.series(
  'clean',
  'templates',
  'styles',
  'scripts',
  'images',
  'fonts'
));

gulp.task('dev', gulp.series(
  'build', 'server'
));