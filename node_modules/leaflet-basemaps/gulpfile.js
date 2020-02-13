var gulp = require("gulp");
var minify = require("gulp-minify");

gulp.task("build", function() {
    return gulp
        .src("L.Control.Basemaps.js")
        .pipe(minify({ noSource: true }))
        .pipe(gulp.dest("./"));
});

gulp.task("watch", function() {
    gulp.watch("L.Control.Basemaps.js", gulp.series("build"));
});

gulp.task("default", gulp.series("build", "watch"));
