var deps = {

    core: {
        src: [
            'zxing.js',
            'core/util.js',
            'core/BitArray.js',
            'core/rgbLuminance.js',
            'core/globalHistogramBinarizer.js',
            'core/read.js',
            'core/readImage.js'
        ],
        desc: 'The core of the library.'
    },

    oneD: {
        src: [
            "oneD/oneD.js",
            "oneD/codabar.js",
            "oneD/codabar/codabarReader.js"
        ],
        desc: "Uni-dimensional plugins.",
        heading: "1D"
    }

};

if (typeof exports !== "undefined") {
    exports.deps = deps;
}
