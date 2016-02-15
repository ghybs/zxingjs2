var fs = require('fs'),
    path = require ("path"),
    UglifyJS = require('uglify-js'),
    zlib = require('zlib'),
    MagicString = require('magic-string'),

    deps = require('./deps.js').deps;

function getFiles(compsBase32) {
    var memo = {},
        comps;

    if (compsBase32) {
        comps = parseInt(compsBase32, 32).toString(2).split('');
        console.log('Managing dependencies...');
    }

    function addFiles(srcs) {
        for (var i = 0, len = srcs.length; i < len; i++) {
            memo[srcs[i]] = true;
        }
    }

    for (var j = 0; j < deps.length; j++) {
        if (comps) {
            if (parseInt(comps.pop(), 2) === 1) {
                console.log(' * ' + j);
                addFiles(deps[j].src);
            } else {
                console.log('   ' + j);
            }
        } else {
            addFiles(deps[j].src);
        }
    }

    console.log('');

    var files = [];

    for (var src in memo) {
        files.push('src/' + src);
    }

    return files;
}

exports.getFiles = getFiles;

function getSizeDelta(newContent, oldContent, fixCRLF) {
    if (!oldContent) {
        return ' (new)';
    }
    if (newContent === oldContent) {
        return ' (unchanged)';
    }
    if (fixCRLF) {
        newContent = newContent.replace(/\r\n?/g, '\n');
        oldContent = oldContent.replace(/\r\n?/g, '\n');
    }
    var delta = newContent.length - oldContent.length;

    return delta === 0 ? '' : ' (' + (delta > 0 ? '+' : '') + delta + ' bytes)';
}

function loadSilently(path) {
    try {
        return fs.readFileSync(path, 'utf8');
    } catch (e) {
        return null;
    }
}

function bundleFiles(files, copyright) {
    var bundle = new MagicString.Bundle();

    for (var i = 0, len = files.length; i < len; i++) {
        bundle.addSource({
            filename: files[i],
            content: new MagicString( fs.readFileSync(files[i], 'utf8') + '\n\n' )
        });
    }

    bundle.prepend(
        copyright + "(function (window, document, undefined) {"
    ).append("})(window, document);");

    return bundle;
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(2) + " kB";
}

exports.build = function (callback, version, copyrightYear, compsBase32, buildName) {

    var files = getFiles(compsBase32);

    console.log("Bundling and compressing " + files.length + " files...");

    var copyrightSrc = fs.readFileSync("src/copyright-src.js", "utf8").replace("{VERSION}", version).replace("{YEAR}", copyrightYear),
        copyrightMin = fs.readFileSync("src/copyright.js", "utf8").replace("{VERSION}", version).replace("{YEAR}", copyrightYear),

        filenamePart = "zxing" + (buildName ? "-" + buildName : ""),
        pathPart = "dist/",
        srcFilename = filenamePart + "-src.js",
        mapFilename = filenamePart + "-src.map",
        srcPath = pathPart + srcFilename,
        mapPath = pathPart + mapFilename,

        bundle = bundleFiles(files, copyrightSrc),
        newSrc = bundle.toString() + "\n//# sourceMappingURL=" + mapFilename,

        oldSrc = loadSilently(srcPath),
        srcDelta = getSizeDelta(newSrc, oldSrc, true);

    pathPart += filenamePart;

    console.log("\tUncompressed: " + bytesToKB(newSrc.length) + srcDelta);

    if (newSrc !== oldSrc) {
        fs.writeFileSync(srcPath, newSrc);
        fs.writeFileSync(mapPath, bundle.generateMap({
            file: srcFilename,
            includeContent: true,
            hires: false
        }));
        console.log("\tSaved to " + srcPath);
    }

    var path = pathPart + ".js",
        oldCompressed = loadSilently(path),
        newCompressed = copyrightMin + UglifyJS.minify(newSrc, {
                warnings: true,
                fromString: true
            }).code,
        delta = getSizeDelta(newCompressed, oldCompressed);

    console.log("\tCompressed: " + bytesToKB(newCompressed.length) + delta);

    var newGzipped,
        gzippedDelta = '';

    function done() {
        if (newCompressed !== oldCompressed) {
            fs.writeFileSync(path, newCompressed);
            console.log("\tSaved to " + path);
        }
        console.log("\tGzipped: " + bytesToKB(newGzipped.length) + gzippedDelta);
        callback();
    }

    zlib.gzip(newCompressed, function (err, gzipped) {
        if (err) { return; }
        newGzipped = gzipped;
        if (oldCompressed && (oldCompressed !== newCompressed)) {
            zlib.gzip(oldCompressed, function (err, oldGzipped) {
                if (err) { return; }
                gzippedDelta = getSizeDelta(gzipped, oldGzipped);
                done();
            });
        } else {
            done();
        }
    });
};

exports.test = function(complete, fail) {
    // Re-generate the list of test images and their corresponding expected result.
    var RESOURCES = "spec/resources/",
        targetFilePath = RESOURCES + "results.js",
        dirs = fs.readdirSync(RESOURCES),
        d = 0,
        testImages = {},
        testImagesNb = 0,
        oldContent = loadSilently(targetFilePath),
        dir, files, currentPath, f, imageName, ext, currentTestImagesDir, resultPath, newContent;

    for (; d < dirs.length; d += 1) {
        dir = dirs[d];

        if (dir === "results.js") { // Skip that file.
            continue;
        }

        currentPath = RESOURCES + dir + "/";
        testImages[dir] = currentTestImagesDir = {};
        files = fs.readdirSync(currentPath);

        for (f = 0; f < files.length; f += 1) {
            imageName = files[f];
            ext = path.extname(imageName);
            if (ext === ".png" || ext === ".PNG") {
                // Look for the corresponding TXT file that contains the expected result.
                resultPath = currentPath + imageName.replace(ext, ".txt");
                try {
                    fs.accessSync(resultPath, fs.R_OK);
                    currentTestImagesDir[imageName] = fs.readFileSync(resultPath, "utf8");
                    testImagesNb += 1;
                } catch (e) {
                    // It is not readable.
                    resultPath = currentPath + imageName.replace(ext, ".TXT");
                    try {
                        fs.accessSync(resultPath, fs.R_OK);
                        currentTestImagesDir[imageName] = fs.readFileSync(resultPath, "utf8");
                        testImagesNb += 1;
                    } catch (e) {
                        // It is not readable.
                    }
                }
            }
        }
    }

    newContent = "var expectedResults = " + JSON.stringify(testImages, null, 4) + ";\n";
    if (newContent === oldContent) {
        console.log("No change in " + testImagesNb + " test image(s).");
    } else {
        fs.writeFileSync(targetFilePath, newContent);
        console.log("Listed " + testImagesNb + " test image(s).");
    }


    // Re-generate the list of spec suites for the manual test index.html file.
    var SUITES = "spec/suites/",
        specSuites = [];

    targetFilePath = "spec/specSuites.js";
    oldContent = loadSilently(targetFilePath);
    testImagesNb = 0;
    files = fs.readdirSync(SUITES);
    for (f = 0; f < files.length; f += 1) {
        specSuites.push("suites/" + files[f]);
        testImagesNb += 1;
    }
    newContent = "var specSuites = " + JSON.stringify(specSuites, null, 4) + ";\n";
    if (newContent === oldContent) {
        console.log("No change in " + testImagesNb + " spec suite(s).");
    } else {
        fs.writeFileSync(targetFilePath, newContent);
        console.log("Listed " + testImagesNb + " spec suite(s).");
    }


    // Start the test configuration.
    var karma = require('karma'),
        testConfig = {configFile : __dirname + '/../spec/karma.conf.js'};

    testConfig.browsers = ['PhantomJS'];

    function isArgv(optName) {
        return process.argv.indexOf(optName) !== -1;
    }

    if (isArgv('--chrome')) {
        testConfig.browsers.push('Chrome');
    }
    if (isArgv('--safari')) {
        testConfig.browsers.push('Safari');
    }
    if (isArgv('--ff')) {
        testConfig.browsers.push('Firefox');
    }
    if (isArgv('--ie')) {
        testConfig.browsers.push('IE');
    }

    if (isArgv('--cov')) {
        testConfig.preprocessors = {
            'src/**/*.js': 'coverage'
        };
        testConfig.coverageReporter = {
            type : 'html',
            dir : 'coverage/'
        };
        testConfig.reporters = ['coverage'];
    }

    console.log('Running tests...');

    var server = new karma.Server(testConfig, function(exitCode) {
        if (!exitCode) {
            console.log('\tTests ran successfully.\n');
            complete();
        } else {
            process.exit(exitCode);
        }
    });
    server.start();
};

