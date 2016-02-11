zxing.util = {

    // extend an object with properties of one or more other objects
    extend: function (dest) {
        var argNo = 1,
            key, arg;

        for (; argNo < arguments.length; argNo++) {
            arg = arguments[argNo];
            for (key in arg) {
                dest[key] = arg[key];
            }
        }
        return dest;
    },

    extendPrototype: function (constructor, methods) {
        this.extend(constructor.prototype, methods);
    }

};
