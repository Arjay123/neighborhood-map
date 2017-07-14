var gulp = require('gulp');

var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var rename = require('gulp-rename');


gulp.task('html', function(){
    return gulp.src('dev/index.html')
        .pipe(gulp.dest('prod/'));
});

gulp.task('scripts', function(){
    return gulp.src('dev/js/*.js')
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('prod/js'));
});

gulp.task('styles', function(){
    return gulp.src('dev/css/*.css')
        .pipe(rename({suffix: '.min'}))
        .pipe(minify())
        .pipe(gulp.dest('prod/css'));
});


gulp.task('buildIndex', ['scripts', 'html', 'styles'], function(){
    return gulp.src('./prod/index.html')
        .pipe(inject(gulp.src(['./prod/js/*.min.js', './prod/css/*.min.css'], {read: false}), {relative: true}))
        .pipe(gulp.dest('./prod'));
});


gulp.task('default', ['html', 'scripts', 'styles', 'buildIndex']);
