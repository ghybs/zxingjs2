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

    _initialize: function (width) {
        this._imageWidth = width;
        this._pixelsLuminance = new Uint8Array(width);
        // Luminance histogram buckets are Uint32, i.e. they can count up to 2**32 - 1 = 4,294,967,295.
        this._pixelsLuminanceBuckets = new Uint32Array(this.statics.LUMINANCE_BUCKETS_NB);
        this._bitRow = new this.BitArray(width);
    },

    _clear: function () {
        var imageWidth = this._imageWidth,
            pixelsLuminance = this._pixelsLuminance,
            buckets_nb = this.statics.LUMINANCE_BUCKETS_NB,
            pixelsLuminanceBuckets = this._pixelsLuminanceBuckets,
            i = 0;

        for (; i < imageWidth; i += 1) {
            pixelsLuminance[i] = 0;
        }

        for (; i < buckets_nb; i += 1) {
            pixelsLuminanceBuckets[i] = 0;
        }
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

        for (; i < imax; i += 1) {
            // Red + 2 * Green + Blue) / 4.
            outputPixelsLuminance[i] = (data[j] + 2 * data[j + 1] + data[j + 2]) / 4;
            j += 4;
        }

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
        var leftPixelLuminance = inputPixelsLuminance[0],
            centerPixelLuminance = inputPixelsLuminance[1],
            x = 1,
            rightPixelLuminance, averagedLuminance;

        for (; x < width - 1; x += 1) {
            rightPixelLuminance = inputPixelsLuminance[x + 1];
            averagedLuminance = Math.floor(((centerPixelLuminance * 4) - leftPixelLuminance - rightPixelLuminance) / 2);

            if (averagedLuminance < bwThreshold) {
                outputBitArray.setBit(x);
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

    _decode: function () {
        var rowStepsAboveOrBelow, isAbove, rowNumber;
    }
};

// Typed array to store bits in a compact and fast manner.
zxing.BitArray = function (size) {
    // Make sure to use an extra Uint if `size` is not a multiple of Uint's size.
    this._bitGroups = new Uint32Array(Math.floor((size + 31) / 32));
    this.clear();
};

zxing.BitArray.prototype.setBit = function (x) {
    var group = Math.floor(x / 32),
        remainder = x % 32; // Remainder is as fast as bitwise mask: http://jsperf.com/math-floor-vs-modulo/9

    this._bitGroups[group] |= 1 << remainder;
};

zxing.BitArray.prototype.clear = function () {
    var groups = this._bitGroups;
    for (var i = 0; i < groups.length; i += 1) {
        groups[i] = 0;
    }
};
