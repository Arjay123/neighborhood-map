var gulp = require('gulp');
var inject = require('gulp-inject');
var minify = require('gulp-minify-css');
var rename = require('gulp-rename');
var htmlreplace = require('gulp-html-replace');


gulp.task('html', function(){
    return gulp.src('dev/templates/*.html')
        .pipe(gulp.dest('prod/templates'));
});

gulp.task('json', function(){
    return gulp.src('dev/*.json')
        .pipe(gulp.dest('prod/'));
});

gulp.task('python', function(){
    return gulp.src('dev/app.py')
        .pipe(gulp.dest('prod/'))
});

gulp.task('scripts', function(){
    return gulp.src('dev/static/js/*.js')
        .pipe(gulp.dest('prod/static/js'));
});

gulp.task('styles', function(){
    return gulp.src('dev/static/css/*.css')
        .pipe(rename({suffix: '.min'}))
        .pipe(minify())
        .pipe(gulp.dest('prod/static/css'));
});

gulp.task('imgs', function(){
    return gulp.src('dev/static/img/*.png')
        .pipe(gulp.dest('prod/static/img/'));
});

gulp.task('htmlreplace', ['scripts', 'html'], function() {
    gulp.src('prod/templates/index.html')
        .pipe(htmlreplace({
            'css': '<link rel="stylesheet" href="{{url_for(\'static\', filename=\'css/style.min.css\')}}">'
        }))
        .pipe(gulp.dest('prod/templates/'));
});


gulp.task('default', ['htmlreplace', 'html', 'python', 'styles', 'json', 'scripts', 'imgs']);
