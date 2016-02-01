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
        this._pixelsLuminanceBuckets = new Uint32Array(this.statics.LUMINANCE_BUCKETS_NB);
        this._bitRow = new this.BitArray(width);
    },

    options: {},

    _clear: function () {
        var imageWidth = this._imageWidth,
            pixelsLuminance = this._pixelsLuminance,
            buckets_nb = this.statics.LUMINANCE_BUCKETS_NB,
            pixelsLuminanceBuckets = this._pixelsLuminanceBuckets,
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
    },

    _getRowRGBLuminance: function (start, stop, inputRGBA, outputPixelsLuminance) {
        var data = inputRGBA.data,
            imax = (stop - start) / 4,
            i = 0,
            j = start;

        /*console.log("Image data length: " + data.length);
        console.log("Canvas height: " + inputRGBA.height + " pixels");
        console.log("Expected data length: " + inputRGBA.width * 4 * inputRGBA.height);*/

        var test = "", l;

        for (; i < imax; i += 1) {
            // Calculate luminance cheaply, favoring green. Red + 2 * Green + Blue) / 4.
            l = outputPixelsLuminance[i] = (data[j] + 2 * data[j + 1] + data[j + 2]) / 4;
            j += 4;
            if (l < 0x40) {
                test += "#";
            } else if (l < 0x80) {
                test += "+";
            } else if (l < 0xC0) {
                test += ".";
            } else {
                test += " ";
            }
        }
        //console.log(test + "/ " + test.length);

        return outputPixelsLuminance;
    },

    _estimateBWThreshold: function (buckets) {
        var bucketsNb = this.statics.LUMINANCE_BUCKETS_NB,
            peakAx = 0,
            peakACount = 0,
            peakBx = 0,
            peakBScore = 0,
            x = 0,
            distanceToPeakAx, score, valleyX;

        // Find highest count bucket (peakA).
        for (; x < bucketsNb; x += 1) {
            if (buckets[x] > peakACount) {
                peakACount = buckets[x];
                peakAx = x;
            }
        }

        // Find next highest count and farthest bucket (peakB).
        for (x = 0; x < bucketsNb; x += 1) {
            distanceToPeakAx = x - peakAx;
            score = buckets[x] * distanceToPeakAx * distanceToPeakAx;
            if (score > peakBScore) {
                peakBScore = score;
                peakBx = x;
            }
        }

        // peakAx should be lower than peakBx in order to be the black pixels.
        if (peakAx > peakBx) {
            var temp = peakAx;
            peakAx = peakBx;
            peakBx = temp;
            peakACount = buckets[peakAx];
        }

        // Fail if peakA and peakB are closer than BW_SEPARATION_THRESHOLD.
        if (peakBx - peakAx < this.statics.BW_SEPARATION_THRESHOLD) {
            return -1;
        }

        // Look for B/W threshold as valley of lowest count, very far from peakA (black), far from peakB (white).
        peakBScore = -1;
        x = valleyX = peakBx - 1;
        for (; x > peakAx; x--) {
            distanceToPeakAx = x - peakAx;
            score = distanceToPeakAx * distanceToPeakAx * (peakBx - x) * (peakACount - buckets[x]);

            if (score > peakBScore) {
                peakBScore = score;
                valleyX = x;
            }
        }

        return valleyX << this.statics.LUMINANCE_SHIFT;
    },

    _fillHistogramBuckets: function (width, inputPixelsLuminance, outputBuckets) {
        var x = 0,
            bitShift = this.statics.LUMINANCE_SHIFT,
            pixel;

        for (; x < width; x += 1) {
            pixel = inputPixelsLuminance[x];
            outputBuckets[pixel >> bitShift] += 1;
        }

        return outputBuckets;
    },

    _getBWRow: function (width, bwThreshold, inputPixelsLuminance, outputBitArray) {
        // No need to mask 8 bits as inputPixelsLuminance is already a typed Uint8Array.
        var leftPixelLuminance = inputPixelsLuminance[0],
            centerPixelLuminance = inputPixelsLuminance[1],
            x = 1,
            rightPixelLuminance, contrastedLuminance;

        for (; x < width - 1; x += 1) {
            rightPixelLuminance = inputPixelsLuminance[x + 1];
            contrastedLuminance = ((centerPixelLuminance * 4) - leftPixelLuminance - rightPixelLuminance) / 2;
            //console.log(contrastedLuminance);

            if (contrastedLuminance < bwThreshold) {
                //console.log("black");
                outputBitArray.setBit(x); // 1 for black, 0 for white.
            }

            leftPixelLuminance = centerPixelLuminance;
            centerPixelLuminance = rightPixelLuminance;
        }

        return outputBitArray;
    }
};

zxing.oneDReader = {
    statics: {
        SCAN_LINES_NB: 15
    },

    _decode: function (imageData) {
        var bitRow = zxing._bitRow,
            pixelsLuminance = zxing._pixelsLuminance,
            histogramBuckets = zxing._pixelsLuminanceBuckets,
            width = imageData.width,
            height = imageData.height,
            rowNumber = Math.round(height / 2),
            scanLinesNb = this.statics.SCAN_LINES_NB,
            rowStep = Math.ceil(height / scanLinesNb / 2),
            i = 0,
            isAbove = false,
            result = {
                lines: []
            },
            bwThreshold, start, stop;

        console.log("canvas width: " + width + " pixels");
        var b, bmax = zxing.statics.LUMINANCE_BUCKETS_NB, bs;

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
            zxing._getRowRGBLuminance(start, stop, imageData, pixelsLuminance);
            zxing._fillHistogramBuckets(width, pixelsLuminance, histogramBuckets);

            bs = "";
            for (b = 0; b < bmax; b += 1) {
                bs += histogramBuckets[b] + ", ";
            }
            //console.log("Histogram: " + bs);

            bwThreshold = zxing._estimateBWThreshold(histogramBuckets);

            //console.log("Estimated threshold: " + bwThreshold);

            zxing._getBWRow(width, bwThreshold, pixelsLuminance, bitRow);
            result.lines.push({
                "rowNumber": rowNumber
            });
            this._decodeRow(rowNumber, bitRow, result.lines[result.lines.length - 1]);
        }

        return result;
    },

    _decodeRow: function (rowNumber, bitRow, resultLine) {
        resultLine.bits = "";
        for (var i = 0; i < zxing._imageWidth; i += 1) {
            resultLine.bits += bitRow.getBit(i) ? "#" : " ";
        }

        var result = zxing.oneD.codabar.reader.decodeRow(rowNumber, bitRow);
        resultLine.result = result;
    }
};

// Typed array to store bits in a compact and fast manner.
zxing.BitArray = function (size) {
    this._size = size;

    // Make sure to use an extra Uint if `size` is not a multiple of Uint's size.
    this._bitGroups = new Uint32Array(Math.floor((size + 31) / 32));
    this.clear();
};

addToPrototype(zxing.BitArray, {
    setBit: function (x) {
        var group = Math.floor(x / 32),
            remainder = x % 32; // Remainder is as fast as bitwise mask: http://jsperf.com/math-floor-vs-modulo/9

        this._bitGroups[group] |= 1 << remainder; // Stored from LSb to MSb within a group.
    },

    getBit: function (x) {
        var group = Math.floor(x / 32),
            remainder = x % 32, // Remainder is as fast as bitwise mask (x & 0x1F): http://jsperf.com/math-floor-vs-modulo/9
            mask = 1 << remainder;

        return (this._bitGroups[group] & mask) !== 0;
    },

    clear: function () {
        var groups = this._bitGroups;

        for (var i = 0; i < groups.length; i += 1) {
            groups[i] = 0;
        }
    },

    getSize: function () {
        return this._size;
    },

    getNextSet : function (from) {
        if (from >= this._size) {
            return this._size;
        }

        var groupOffset  = Math.floor(from / 32),
            bitGroups = this._bitGroups,
            currentGroup = bitGroups[groupOffset],
            remainder = from % 32,
            groupMax = bitGroups.length;

        currentGroup &= ~((1 << remainder) - 1);
        while (currentGroup === 0) {
            groupOffset += 1;
            if (groupOffset === groupMax) {
                return this._size;
            }
            currentGroup = bitGroups[groupOffset];
        }

        var result = (groupOffset * 32) + this._numberOfTrailingZeros(currentGroup);

        // Math.min is faster than conditional assignment and if condition in FF, same in Chrome.
        // https://jsperf.com/math-min-max-vs-ternary-vs-if
        return Math.min(this._size, result);
    },

    getNextUnset: function (from) {
        if (from >= this._size) {
            return this._size;
        }

        var groupOffset = Math.floor(from / 32),
            bitGroups = this._bitGroups,
            currentGroup = ~bitGroups[groupOffset],
            remainder = from % 32,
            groupMax = bitGroups.length;

        currentGroup &= ~((1 << remainder) - 1);
        while (currentGroup === 0) {
            groupOffset += 1;
            if (groupOffset === groupMax) {
                return this._size;
            }
            currentGroup = ~bitGroups[groupOffset];
        }
        var result = (groupOffset * 32) + this._numberOfTrailingZeros(currentGroup);
        return Math.min(this._size, result);
    },

    // Utility to quickly determine the number of trailing unset bits in a Uint.
    _numberOfTrailingZeros: (function () {
        var lookup = [32, 0, 1, 26, 2, 23, 27, 0, 3, 16, 24, 30, 28, 11, 0, 13, 4, 7, 17, 0, 25, 22, 31, 15, 29, 10, 12, 6, 0, 21, 14, 9, 5, 20, 8, 19, 18];

        return function (Uint) {
            return lookup[(Uint & -Uint) % 37];
        };
    })()
});

function addToPrototype(constructor, methods) {
    var proto = constructor.prototype;

    for (var name in methods) {
        proto[name] = methods[name];
    }
}

function dec2bin(dec){
    return dec.toString(2);
}
