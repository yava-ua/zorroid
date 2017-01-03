import gulp from "gulp";
import browserify from "browserify";
import babelify from "babelify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import livereload from "gulp-livereload";
import sass from "gulp-sass";
import concatCss from "gulp-concat-css";

gulp.task('build', ['build-scss', 'copy'], () => {
    return browserify({
        entries: ['./js/app.js'],
        debug: true
    })
        .transform(babelify, {
            presets: ["es2015"]
        })
        .bundle()
        .on('error', function (err) {
            console.error(err);
            this.emit('end');
        })
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('build/js'))
        .pipe(livereload());
});

gulp.task('build-scss', (callback) => {
    gulp.src(['./css/**/*.scss'])
        .pipe(sass().on('error', sass.logError))
        .pipe(concatCss('bundle.css'))
        .pipe(gulp.dest('build/css'));
    callback();
});

gulp.task('copy', () => {
    gulp.src(['index.html']).pipe(gulp.dest('build'));
    gulp.src(['json/*.json']).pipe(gulp.dest('build/json'));
    gulp.src(['fonts/*.*']).pipe(gulp.dest('build/fonts'));
    gulp.src(['images/*.*']).pipe(gulp.dest('build/images'));

});

gulp.task('watch', ['build'], () => {
    livereload.listen();
    gulp.watch('./js/**/*.js', ['build']);
    gulp.watch('./css/**/*.scss', ['build']);
    gulp.watch('./fonts/*.*', ['build']);
    gulp.watch('./images/**/*.*', ['build']);
    gulp.watch('./*.html', ['build']);
});

gulp.task('default', ['build', 'watch']);
