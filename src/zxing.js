var zxing = {

    version: "0.0.1",

    optionNames: {},

    barcodeFormat: {}

};

// Define as an AMD module.
if (typeof define === "function" && define.amd) {
    define(zxing);

// Define for Node module pattern loaders, including Browserify.
} else if (typeof module === "object" && module.exports) {
    module.exports = zxing;
}

// Define as a global zxing variable, saving the original zxing to restore later if needed.
if (window !== undefined) {
    var oldZxing = window.zxing;

    zxing.noConflict = function () {
        window.zxing = oldZxing;
        return this;
    };

    window.zxing = zxing;
}
