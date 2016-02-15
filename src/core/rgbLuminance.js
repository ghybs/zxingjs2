zxing.rgbLuminance = {

    init: function (pixelsNb) {
        if (this.pixelsLuminance === undefined || pixelsNb > this.pixelsLuminance.length) {
            this.pixelsLuminance = new Uint8Array(pixelsNb);
        } // No need to clear data.

        return this;
    },

    getLuminance: function (start, stop, inputRGBA) {
        var pixelsLuminance = this.pixelsLuminance,
            data = inputRGBA.data,
            iMax = (stop - start) / 4,
            i = 0,
            j = start;

        // Compute and record pixels luminance.
        for (; i < iMax; i += 1) {
            // Calculate luminance cheaply, favoring green.
            // (Red + 2 * Green + Blue) / 4.
            pixelsLuminance[i] = (data[j] + 2 * data[j + 1] + data[j + 2]) / 4;
            j += 4;
        }

        return pixelsLuminance;
    }

};
