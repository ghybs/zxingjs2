// CLASS
// Typed array to store bits in a compact and fast manner.
zxing.BitArray = function (size) {
    this._size = size;

    // Make sure to use an extra Uint if `size` is not a multiple of Uint's size.
    this._bitGroups = new Uint32Array(Math.floor((size + 31) / 32));
    this.clear();
};

zxing.util.extendPrototype(zxing.BitArray, {
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

    getNextSet: function (from) {
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

    // Utility to quickly determine the number of trailing unset (0 value) bits in a Uint.
    _numberOfTrailingZeros: (function () {
        var lookup = [32, 0, 1, 26, 2, 23, 27, 0, 3, 16, 24, 30, 28, 11, 0, 13, 4, 7, 17, 0, 25, 22, 31, 15, 29, 10, 12, 6, 0, 21, 14, 9, 5, 20, 8, 19, 18];

        return function (Uint) {
            return lookup[(Uint & -Uint) % 37];
        };
    })()
});
