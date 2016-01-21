'use strict';

var gulp = require('gulp-param')(require('gulp'), process.argv);
var eslint = require('gulp-eslint');
var jsbeautify = require('gulp-jsbeautifier');
var mocha = require('gulp-mocha');
var cover = require('gulp-coverage');

var paths = {
    js: [
        './lib/**/*.js',
        './gulpfile.js',
        './index.js',
        './service.js'
    ],
    test: [
        './test/**/*.js'
    ]
};

gulp.task('beautify', function () {
    var srcOptions = {
        base: './'
    };
    return gulp.src(paths.js, srcOptions)
        .pipe(jsbeautify({
            config: '.jsbeautifyrc',
            mode: 'VERIFY_AND_WRITE'
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('lint-js', ['beautify'], function () {
    var src = [
        './test/**/*.js'
    ];
    return gulp.src(paths.js.concat(src))
        .pipe(eslint({
            useEslintrc: true
        }))
        .pipe(eslint.formatEach())
        .pipe(eslint.failAfterError());
});

gulp.task('test', function () {
    var srcOptions = {
        read: false
    };
    return gulp.src(paths.test, srcOptions)
        .pipe(cover.instrument({
            pattern: paths.js,
            debugDirectory: 'debug'
        }))
        .pipe(mocha({
            reporter: 'nyan'
        }))
        .pipe(cover.gather())
        .pipe(cover.format({
            reporter: 'html',
            outFile: 'coverage.html'
        }))
        .pipe(gulp.dest('reports'))
        .pipe(cover.format({
            reporter: 'json',
            outFile: 'coverage.json'
        }))
        .pipe(gulp.dest('reports'));
});

gulp.task('default', [
    'lint-js',
    'test'
]);
