// Karma configuration
module.exports = function (config) {

	var libSources = require(__dirname + '/../build/build.js').getFiles();

	var files = [
		"spec/sinon-1.17.3.js"
	].concat(libSources, [
		"node_modules/happen/happen.js",
        "spec/resources/results.js",
		"spec/suites/**/*.js"
	]);

    var exclude = [
    ];

	console.log("config karma!" + JSON.stringify(files, null, 4));

	config.set({
		// base path, that will be used to resolve files and exclude
		basePath: '../',

		plugins: [
			require('karma-mocha'),
			require('karma-coverage'),
			require('karma-phantomjs-launcher'),
			require('karma-chrome-launcher'),
			require('karma-safari-launcher'),
			require('karma-firefox-launcher')
        ],

		// frameworks to use
		frameworks: ['mocha'],

		// list of files / patterns to load in the browser
		files: files,
		exclude: exclude,

		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['dots'],

		// web server port
		port: 9876,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_WARN,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		//browsers: ['PhantomJS'],
        browsers: ['test'],
        //browsers: [__dirname +  "../node_modules/phantomjs-prebuilt/phantomjs"],


        // If browser does not capture in given timeout [ms], kill it
		captureTimeout: 5000,

		// Workaround for PhantomJS random DISCONNECTED error
		//browserDisconnectTimeout: 10000, // default 2000
		//browserDisconnectTolerance: 1, // default 0

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true
	});

    console.log("config karma done!");
};
