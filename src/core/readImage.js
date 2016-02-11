zxing.readImage = function (image, options) {

    options = options || {};

    var canvas = options.canvas || document.createElement("canvas");

    if (typeof image === "string") {
        image = document.getElementById(image);
    }
    if (!(image instanceof HTMLImageElement)) {
        throw new Error("1st argument of zxing.readImage must be an HTMLImageElement or a string corresponding to the id of that image.");
    }

    if (typeof canvas === "string") {
        canvas = document.getElementById(canvas);
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("options.canvas must be an HTMLCanvasElement or a string corresponding to the id of that canvas.");
    }

    canvas.width = image.width;
    canvas.height = image.height;

    return zxing.read(canvas, options);

};
