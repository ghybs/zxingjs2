/**
 * Copyright 2016 Boris Seang
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

zxing = {
    version: "0.0.1",

    statics: {
        LUMINANCE_BITS: 5,
        LUMINANCE_SHIFT: 8 - 5, // Uint8's size - LUMINANCE_BITS
        LUMINANCE_BUCKETS_NB: 1 << 5, // 1 << LUMINANCE_BITS
        BW_SEPARATION_THRESHOLD: 2
    },

    init: function (width) {
        this._imageWidth = width;
        this._pixelsLuminance = new Uint8Array(width);
        // Luminance histogram buckets are Uint32, i.e. they can count up to 2**32 - 1 = 4,294,967,295.
        this._luminanceBuckets = new Uint32Array(this.statics.LUMINANCE_BUCKETS_NB);
        this._bitRow = new this.BitArray(width);
    },

    options: {},

    _clear: function () {
        var imageWidth = this._imageWidth,
            pixelsLuminance = this._pixelsLuminance,
            buckets_nb = this.statics.LUMINANCE_BUCKETS_NB,
            pixelsLuminanceBuckets = this._luminanceBuckets,
            i = 0;

        for (; i < imageWidth; i += 1) {
            pixelsLuminance[i] = 0;
        }

        for (i = 0; i < buckets_nb; i += 1) {
            pixelsLuminanceBuckets[i] = 0;
        }

        this._bitRow.clear();
    },

    _getCanvasImageRGBAData: function (canvasEl) {
        var context = canvasEl.getContext("2d"),
            width = canvasEl.width,
            height = canvasEl.height;

        return context.getImageData(0, 0, width, height);
    }
};

zxing.oneDReader = {
    statics: {
        scanLinesNb: 15
    },

    _decode: function (imageData) {
        var bitRow = zxing._bitRow,
            pixelsLuminance = zxing._pixelsLuminance,
            histogramBuckets = zxing._luminanceBuckets,
            width = imageData.width,
            height = imageData.height,
            rowNumber = Math.round(height / 2),
            scanLinesNb = this.statics.scanLinesNb,
            rowStep = Math.ceil(height / scanLinesNb / 2),
            i = 0,
            isAbove = false,
            reader = zxing.oneD.codabar.reader,
            decodeRow3 = reader.decodeRow.bind(reader),
            bwThreshold, start, stop, result;

        console.log("canvas width: " + width + " pixels");

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

            // Analyze line (row).
            zxing._clear();
            zxing.getLuminance(start, stop, imageData, pixelsLuminance);
            zxing._fillHistogramBuckets(width, pixelsLuminance, histogramBuckets);

            bwThreshold = zxing._estimateBWThreshold(histogramBuckets);

            zxing._getBWRow(width, bwThreshold, pixelsLuminance, bitRow);

            result = decodeRow3(bitRow);
            if (result !== -1) {
                return result;
            }
        }

        return result;
    },

    _decodeRow: function (rowNumber, bitRow) {
        var result = zxing.oneD.codabar.reader.decodeRow(bitRow);
    }
};
