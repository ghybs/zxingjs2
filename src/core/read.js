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

    var optionsDefault = {
        scanLinesNb: 15,
        format: zxing.oneD.codabar.reader
    };

    options = zxing.util.extend({}, optionsDefault, options);

    var width = options.width,
        height = options.height,
        rowNumber = Math.round(height / 2),
        scanLinesNb = options.scanLinesNb,
        rowStep = Math.ceil(height / scanLinesNb / 2),
        i = 0,
        isAbove = false,
        reader = zxing.oneD.codabar.reader,
        decodeRow3 = reader.decodeRow.bind(reader),
        oneD = zxing.oneD.init(width),
        bitRow = oneD.bwBits,
        rgbLuminance = zxing.rgbLuminance.init(),
        pixelsLuminance = rgbLuminance.pixelsLuminance,
        binarizer = zxing.globalHistogramBinarizer.init(),
        imageData = canvas.getContext("2d").getImageData(0, 0, width, height),
        bwThreshold, start, stop, result;

    for (; i < scanLinesNb; i += 1) {
        // Scanning from middle out.
        rowNumber += rowStep * i * (isAbove ? 1 : -1);
        rowNumber = Math.floor(rowNumber);
        isAbove = !isAbove;
        if (rowNumber < 0 || rowNumber >= height) {
            break;
        }
        start = rowNumber * width * 4;
        stop = start + width * 4;
        console.log("start: " + start + " / stop: " + stop);

        // Analyze line (row).
        rgbLuminance.init(width);
        rgbLuminance.getLuminance(start, stop, imageData);

        binarizer._fillHistogramBuckets(width, pixelsLuminance);
        bwThreshold = binarizer._estimateBWThreshold();

        oneD.init();
        binarizer._getBWRow(width, bwThreshold, pixelsLuminance, bitRow);

        var test = bwThreshold + ": ";
        for (var k = 0; k < width; k += 1) {
            test += bitRow.getBit(k) ? "#" : " ";
        }
        console.log(test);

        reader.init();
        result = decodeRow3(bitRow);
        if (result !== -1) {
            console.log("Found " + result.text + " after iteration " + i);
            return result;
        }
        console.log("Not found at iteration " + i);
    }

    return result;

};

zxing.init = function (options) {

    options = options || {};

    zxing._luminanceConverter = zxing.rgbLuminance.init(options.width || 600);
    zxing._binarizer = zxing.globalHistogramBinarizer.init();

};
