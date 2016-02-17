zxing.oneD = {

    init: function (width) {
        // Keep some instance variables to avoid re-allocations.
        if (this.bwBits === undefined || width > this.bwBits.getSize()) {
            this.bwBits = new zxing.BitArray(width || 600); // 600 pixels width by default?
        } else {
            this.bwBits.clear();
        }

        return this;
    }

};
