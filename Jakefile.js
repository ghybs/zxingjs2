/*
 ZXingJS2 building, testing and linting scripts.

 To use, install Node, then run the following commands in the project root:

 npm install -g jake
 npm install

 To check the code for errors and build from source, run "jake".
 To run only the tests, run "jake test".
 */

var build = require('./build/build.js'),
    version = require('./src/zxing.js').version,
    copyrightYear = require("./src/copyrightYear.js");

function hint(msg, args) {
    return function () {
        console.log(msg);
        jake.exec('node node_modules/eslint/bin/eslint.js ' + args,
            {printStdout: true}, function () {
                console.log('\tCheck passed.\n');
                complete();
            });
    };
}

desc('Check source for errors with ESLint');
task('lint', {async: true}, hint('Checking for JS errors...', 'src --config .eslintrc'));

desc('Combine and compress source files');
task('build', {async: true}, function (compsBase32, buildName) {
    var v;

    jake.exec('git log -1 --pretty=format:"%h"', {breakOnError: false}, function () {
        build.build(complete, v, copyrightYear, compsBase32, buildName);

    }).on('stdout', function (data) {
        v = version + ' (' + data.toString() + ')';
    }).on('error', function () {
        v = version;
    });
});

desc('Test');
task('test', ['lint'], {async: true}, function () {
    build.test(complete);
});

task('default', ["test", 'build']);

jake.addListener('complete', function () {
    process.exit();
});
