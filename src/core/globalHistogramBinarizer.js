zxing.globalHistogramBinarizer = {

    LUMINANCE_BITS: 5, // 2**5 = 32 different values of luminance.
    LUMINANCE_SHIFT: 8 - 5, // Uint8's size - LUMINANCE_BITS.
    LUMINANCE_BUCKETS_NB: 1 << 5, // 1 << LUMINANCE_BITS.
    BW_SEPARATION_THRESHOLD: 2,

    init: function () { // No need to re-init.
        // Luminance histogram buckets are Uint32, i.e. they can count up to 2**32 - 1 = 4,294,967,295.
        if (this._luminanceBuckets === undefined) {
            this._luminanceBuckets = new Uint32Array(this.LUMINANCE_BUCKETS_NB);
        } // No need to clear data.

        return this;
    },

    _estimateBWThreshold: function () {
        var buckets = this._luminanceBuckets,
            bucketsNb = this.LUMINANCE_BUCKETS_NB,
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
        if (peakBx - peakAx < this.BW_SEPARATION_THRESHOLD) {
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

        return valleyX << this.LUMINANCE_SHIFT;
    },

    _fillHistogramBuckets: function (width, inputPixelsLuminance) {
        var buckets = this._luminanceBuckets,
            x = 0,
            bitShift = this.LUMINANCE_SHIFT,
            pixel;

        // Clear histogram buckets.
        //buckets.fill(0);
        for (; x < buckets.length; x += 1) {
            buckets[x] = 0;
        }

        // Fill buckets.
        for (x = 0; x < width; x += 1) {
            pixel = inputPixelsLuminance[x];
            buckets[pixel >> bitShift] += 1;
        }

        return buckets;
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
