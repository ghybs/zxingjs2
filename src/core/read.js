zxing.read = function (canvas, options) {

    options = options || {};

    if (typeof canvas === "string") {
        canvas = document.getElementById(canvas);
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("options.canvas must be an HTMLCanvasElement or a string corresponding to the id of that canvas.");
    }

    if (typeof options.offsetX !== "number") {
        options.offsetX = 0;
    }
    if (typeof options.width !== "number") {
        options.width = canvas.width;
    }
    if (typeof options.offsetY !== "number") {
        options.offsetY = 0;
    }
    if (typeof options.height !== "number") {
        options.height = canvas.height;
    }

    return zxing._read(canvas, options);

};

zxing._read = function (canvas, options) {

    console.log(options);

};

zxing.init = function (options) {

    options = options || {};

    zxing.pixelsLuminance = zxing.pixelsLuminance || new Uint8Array(options.width || 600);

};
