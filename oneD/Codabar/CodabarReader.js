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

zxing.oneD.codabar.reader = {
    // https://en.wikipedia.org/wiki/Codabar

    statics : {
        // These values are critical for determining how permissive the decoding
        // will be. All stripe sizes must be within the window these define, as
        // compared to the average stripe size.
        MAX_ACCEPTABLE: 2.0,
        PADDING: 1.5,

        ALPHABET_STRING: "0123456789-$:/.+ABCD",
        ALPHABET: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 45, 36, 58, 47, 46, 43, 65, 66, 67, 68],

        /**
         * These represent the encodings of characters, as patterns of wide and narrow bars. The 7 least-significant bits of
         * each int correspond to the pattern of wide and narrow, with 1s representing "wide" and 0s representing narrow.
         */
        CHARACTER_ENCODINGS: [
            0x003, 0x006, 0x009, 0x060, 0x012, 0x042, 0x021, 0x024, 0x030, 0x048, // 0-9
            0x00C, 0x018, 0x045, 0x051, 0x054, 0x015, 0x01A, 0x029, 0x00B, 0x00E], // -$:/.+ABCD

        // Minimal number of characters that should be present (including start and stop characters)
        // under normal circumstances this should be set to 3, but can be set higher
        // as a last-ditch attempt to reduce false positives.
        MIN_CHARACTER_LENGTH: 3,

        // Official start and end patterns.
        START_END_ENCODINGS: [65, 66, 67, 68]
    },

    init: function () {
        // Keep some instance variables to avoid re-allocations.
        this._counters = new Uint16Array(80);
        this._counterLength = 0;
        this._maxs = new Float32Array(4);
        this._mins = new Float32Array(4);

        return this;
    },

    decodeRow: function (rowNumber, bitRow, options) {
        this._setCounters(bitRow);

        var startOffset = this._findStartPattern(),
            nextStart = startOffset,
            chars = [],
            start_end_encodings = this.statics.START_END_ENCODINGS,
            alphabet = this.statics.ALPHABET,
            alphabet_string = this.statics.ALPHABET_STRING,
            theCounters = this._counters,
            theLength = this._counterLength,
            charOffset, i;

        if (startOffset === -1) {
            return -1;
        }

        do {
            charOffset = this._toNarrowWidePattern(nextStart);
            if (charOffset === -1) {
                return -1;
            }

            // Hack: We store the position in the alphabet table into an array,
            // so that we can access the decoded patterns in
            // _validatePattern. We'll translate to the actual characters later.
            chars.push(charOffset);
            nextStart += 8;

            // Stop as soon as we see the end character.
            if (chars.length > 1 && start_end_encodings.indexOf(alphabet[charOffset]) !== -1) {
                break;
            }
        } while (nextStart < theLength); // no fixed end pattern so keep on reading while data is available.

        // Look for whitespace after pattern:
        var trailingWhitespace = theCounters[nextStart - 1],
            lastPatternSize = 0;

        for (i = -8; i < -1; i++) {
            lastPatternSize += theCounters[nextStart + i];
        }

        // We need to see whitespace equal to 50% of the last pattern size,
        // otherwise this is probably a false positive. The exception is if we are
        // at the end of the row. (I.e. the barcode barely fits.)
        if (nextStart < theLength && trailingWhitespace < Math.floor(lastPatternSize / 2)) {
            return -1;
        }

        if (this._validatePattern(startOffset, chars) === -1) {
            return -1;
        }

        // Ensure valid start and end characters.
        if (start_end_encodings.indexOf(alphabet[chars[0]]) === -1 ||
            start_end_encodings.indexOf(alphabet[chars[chars.length - 1]]) === -1 ||
            // Remove stop/start characters character and check if a long enough string is contained.
            chars.length <= this.statics.MIN_CHARACTER_LENGTH
        ) {
            // Almost surely a false positive ( start + stop + at least 1 character)
            return -1;
        }

        // Translate character table offsets to actual characters.
        for (i = 0; i < chars.length; i++) {
            chars[i] = alphabet_string.charAt(chars[i]);
        }

        options = options || {};
        // Remove start and end characters, unless required not to.
        if (!options[zxing.options.RETURN_CODABAR_START_END]) {
            chars.shift();
            chars.pop();
        }

        // Convert the text data.
        var text = "";

        for (i = 0; i < chars.length; i += 1) {
            text += chars[i];
        }

        // Prepare the text object.
        var runningCount = 0;
        for (i = 0; i < startOffset; i++) {
            runningCount += theCounters[i];
        }
        var left = runningCount;
        for (i = startOffset; i < nextStart - 1; i++) {
            runningCount += theCounters[i];
        }

        return {
            text: text,
            startPoint: [left, rowNumber],
            endPoint: [runningCount, rowNumber],
            type: zxing.barcodeFormat.CODABAR
        };

        /*return new zxing.Result(
            text,
            null,
            [
                [left, rowNumber],
                [runningCount, rowNumber]
            ],
            zxing.barcodeFormat.CODABAR
        );*/
    },

    _validatePattern : function (start, chars) {
        var sizes = new Uint32Array([0, 0, 0, 0]),
            counts = new Uint32Array([0, 0, 0, 0]),
            end = chars.length - 1,
            theCounters = this._counters,
            char_encoding = this.statics.CHARACTER_ENCODINGS,
            max_acceptable = this.statics.MAX_ACCEPTABLE,
            padding = this.statics.PADDING,
            pattern, i, j, category;

        var pos = start;

        for (i = 0; true; i++) {
            pattern = char_encoding[chars[i]];
            for (j = 6; j >= 0; j--) {
                category = (j & 1) + (pattern & 1) * 2;
                sizes[category] += theCounters[pos + j];
                counts[category]++;
                pattern = pattern >> 1;
            }
            if (i >= end) {
                break;
            }

            pos += 8;
        }

        var maxes = this._maxs,
            mins = this._mins;

        for (i = 0; i < 2; i++) {
            mins[i] = 0.0;
            mins[i + 2] = (sizes[i] / counts[i] + sizes[i + 2] / counts[i + 2]) / 2.0;
            maxes[i] = mins[i + 2];
            maxes[i + 2] = (sizes[i + 2] * max_acceptable + padding) / counts[i + 2];
        }

        pos = start;

        for (i = 0; true; i++) {
            pattern = char_encoding[chars[i]];
            for (j = 6; j >= 0; j--) {
                category = (j & 1) + (pattern & 1) * 2;
                var size = theCounters[pos + j];
                if (size < mins[category] || size > maxes[category]) {
                    return -1;
                }
                pattern = pattern >> 1;
            }
            if (i >= end) {
                break;
            }
            pos += 8;
        }

        return 0;
    },

    _findStartPattern: function () {
        var start_end_encodings = this.statics.START_END_ENCODINGS,
            alphabet = this.statics.ALPHABET,
            i = 1,
            charOffset;

        for (; i < this._counterLength; i += 2) {
            charOffset = this._toNarrowWidePattern(i);
            if (charOffset !== -1 && start_end_encodings.indexOf(alphabet[charOffset]) !== -1) {
                var patternSize = 0;
                for (var j = i; j < i + 7; j++) {
                    patternSize += this._counters[j];
                }
                if (i == 1 || this._counters[i - 1] >= patternSize / 2) {
                    return i;
                }
            }
        }

        return -1;
    },

    _setCounters : function (bitRow) {
        var result = bitRow.toCounts(this._counters);
        this._counters = result.result;
        this._counterLength = result.length;
    },

    _toNarrowWidePattern : function (position) {
        var end = position + 7,
            char_encoding = this.statics.CHARACTER_ENCODINGS,
            i, currentCounter, threshold;

        if (end >= this._counterLength) {
            return -1;
        }

        var theCounters = this._counters,
            maxBar = 0,
            minBar = Infinity;

        for (i = position; i < end; i += 2) {
            currentCounter = theCounters[i];
            if (currentCounter < minBar) {
                minBar = currentCounter;
            }
            if (currentCounter > maxBar) {
                maxBar = currentCounter;
            }
        }

        var thresholdBar = Math.floor((minBar + maxBar) / 2),
            maxSpace = 0,
            minSpace = Infinity;

        for (i = position + 1; i < end; i += 2) {
            currentCounter = theCounters[i];
            if (currentCounter < minSpace) {
                minSpace = currentCounter;
            }
            if (currentCounter > maxSpace) {
                maxSpace = currentCounter;
            }
        }

        var thresholdSpace = Math.floor((minSpace + maxSpace) / 2),
            bitmask = 1 << 7,
            pattern = 0;

        for (i = 0; i < 7; i++) {
            threshold = (i & 1) === 0 ? thresholdBar : thresholdSpace;
            bitmask = bitmask >> 1;
            if (theCounters[position + i] > threshold) {
                pattern |= bitmask;
            }
        }

        for (i = 0; i < char_encoding.length; i++) {
            if (char_encoding[i] === pattern) {
                return i;
            }
        }

        return -1;
    }

};

zxing.BitArray.prototype.toCounts = function (outputCounts) {
    // We do not know in advance the number of counts (B/W alternations + 1), so using a typed array to store the result is tricky.
    // Let's use a standard array first, then convert it into a typed array.
    var result = [],
        bitNo = 0,
        i = 0,
        group = 0,
        currentGroup = this._bitGroups[0],
        count = 0,
        // Start from the first white bit.
        countingBorW = false, // true for black, false for white.
        passedInitialBlack = false,
        bit;

    for (; bitNo < this._size; bitNo += 1) {
        if (i === 32) {
            i = 0;
            group += 1;
            currentGroup = this._bitGroups[group];
        }
        bit = (currentGroup & 1 << i) !== 0;
        // Comparison is MUCH faster than bitwise XOR (^) in Chrome.
        // http://jsperf.com/neq-versus-bitwise-xor-for-boolean-comparison
        if (bit === countingBorW) {
            count += 1;
            passedInitialBlack = true;
        } else if (passedInitialBlack) {
            result.push(count);
            count = 1;
            countingBorW = !countingBorW;
        }
        i += 1;
    }
    result.push(count);

    // Check if the outputCounts typed array is big enough.
    var length = result.length;

    if (outputCounts.length < length) {
        outputCounts = new Uint16Array(length);
    }

    // Now transfer the result into the outputCounts typed array.
    for (i = 0; i < length; i += 1) {
        outputCounts[i] = result[i];
    }

    return {
        result: outputCounts,
        length: length
    };
};

zxing.options.RETURN_CODABAR_START_END = "return_codabar_start_end";
