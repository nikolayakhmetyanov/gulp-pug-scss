global.$ = {
  fs: require('fs'),
};

const gulp = require('gulp'),
      del = require('del'),
      autoprefixer = require('gulp-autoprefixer'),
      browserSync = require('browser-sync'),
      uglify = require('gulp-uglify-es').default;
      sass = require('gulp-sass'),
      cleancss = require('gulp-clean-css'),
      pug = require('gulp-pug'),
      htmlValidator = require('gulp-w3c-html-validator'),
      concat = require("gulp-concat"),
      rename = require("gulp-rename"),
      newer = require('gulp-newer'),
      imagemin = require('gulp-imagemin'),
      plumber = require('gulp-plumber'),
      rsync = require('gulp-rsync');

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
    src: ['./src/plugins/**/*.js', './src/js/common.js'],
    dest: './build/js',
    watch: ['./src/js/common.js'],
    watchPlugins: './src/plugins/*.js'
  },
  images: {
    src: './src/assets/img/**/*',
    dest: './build/img/',
    watch: ['./src/assets/img/**/*']
  },
  fonts: {
    src: './src/assets/fonts/*',
    dest: './build/fonts',
    watch: './src/assets/fonts/*'
  }
};

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
    .pipe(cleancss( {level: { 1: { specialComments: 0 } } }))
    .pipe(gulp.dest(paths.css.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('scripts', function () {
  return gulp.src(paths.js.src)
    .pipe(plumber())
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.js.dest));
});

gulp.task('images', async function() {
  return gulp.src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest(paths.images.dest))
});

// Clean IMG's
gulp.task('cleanimg', function() {
  return del([paths.images.dest], { force: true })
});

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

gulp.task('deploy', function() {
  return gulp.src('dist/**')
  .pipe(rsync({
    root: 'dist/',
    hostname: 'user666@mydomain.com',
    destination: 'www/mydomain.com/',
    // include: ['*.htaccess'], // Includes files to deploy
    exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
    recursive: true,
    archive: true,
    silent: false,
    compress: true
  }))
});

gulp.task('clean', function () {
  return del(paths.dirs.build);
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