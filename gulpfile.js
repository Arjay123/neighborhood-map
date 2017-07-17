var gulp = require('gulp');

var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var rename = require('gulp-rename');
var htmlreplace = require('gulp-html-replace');


gulp.task('html', function(){
    return gulp.src('dev/templates/*.html')
        .pipe(gulp.dest('prod/templates'));
});

gulp.task('python', function(){
    return gulp.src(['dev/app.py', 'dev/yelp_auth.json'])
        .pipe(gulp.dest('prod/'))
})


gulp.task('scripts', function(){
    return gulp.src(['!dev/static/js/keys.js', 'dev/static/js/*.js'])
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('prod/static/js'));
});

gulp.task('styles', function(){
    return gulp.src('dev/static/css/*.css')
        .pipe(rename({suffix: '.min'}))
        .pipe(minify())
        .pipe(gulp.dest('prod/static/css'));
});


// gulp.task('buildIndex', ['scripts', 'html', 'styles'], function(){
//     return gulp.src('./prod/index.html')
//         .pipe(inject(gulp.src(['./prod/js/*.min.js', './prod/css/*.min.css'], {read: false}), {relative: true}))
//         .pipe(gulp.dest('./prod'));
// });

gulp.task('htmlreplace', ['scripts', 'html'], function() {
  gulp.src('prod/templates/index.html')
    .pipe(htmlreplace({
        'css': '<link rel="stylesheet" href="{{url_for(\'static\', filename=\'css/style.min.css\')}}">',
        'js': '<script src="{{url_for(\'static\', filename=\'js/app.min.js\')}}"></script>'
    }))
    .pipe(gulp.dest('prod/templates/'));
});


gulp.task('default', ['htmlreplace', 'html', 'python', 'scripts', 'styles']);
