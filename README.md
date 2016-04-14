# ZXingJS2
Yet another port to JavaScript of [ZXing](https://github.com/zxing/zxing) multi-format 1D/2D barcode image processing library.

Many 1D and/or 2D code image processing libraries exist.


## == Disclaimer ==

**This library is far from being fully functional now.
Unfortunately I do not plan to work further on it for the time being.
Please feel free to re-use the work and extend it.
You can open issues to mention your extended work.**



## Rationale


### Mobile application target

Mobile application (smartphone) is a big usage:

- Manual input is tedious.
- Smartphone is almost always readily available.
- Input data is very likely printed on paper (usage of other storage like RFID and NFC is limited to appropriately organized domains, whereas paper can be printed by anyone) or on a screen.

Since we target mobile usage, we can build a native application (Java in Android, Objective-C in iOS), hybrid application (HTML, CSS and JavaScript with Cordova / PhoneGap / Ionic), or a web application / pure online service.


### Commodity service

Barcode scanning is today a commodity service (dozens, maybe hundreds of free and even ad-free applications are available, if not already shipped with the OS).
Hence there is no business model to build a paid dedicated software, and even less for a dedicated hardware! Unless very specific requirements are needed (scanning speed being probably the only reason to keep laser-based technology).
Many open source libraries are available on the Internet, and even full mobile applications (Barcode Scanner, based on ZXing).

With no business model, there is no point in fragmenting the libraries.

- OS convergence is achieved by using Java language (as chosen by ZXing team).
- However, web application and full online service cannot be achieved easily with Java.
- If the library were based on JavaScript, everything would be achievable: online service, web application, hybrid application.
- Current JavaScript libraries are not as complete and at the same time as powerful as ZXing. E.g. quaggaJS is less orientation dependent, but it reads only 1D barcodes and is slower. ZXingjs was also promising, but porting stopped at the most popular 1D barcodes.

This is the rationale to attempt a new full port of ZXing to JavaScript.


### Why not simply continuing the work from ZXingjs?

It does a brilliant job at porting exactly the Java ZXing structure (interfaces, classes, etc.) despite the differences between Java and JavaScript.

- Advantages:
    * Keeps exact same public and private API.
    * Decreases conversion barrier from ZXing to zxingjs.
    * Facilitates porting of future updates from Java ZXing.
- Drawbacks:
    * Does not leave room for code and algorithm optimizations, made possible by JavaScript difference and simpler use case.
    * Requires dependencies to "emulate" Java classes in JavaScript.



## Strategy

- Use canvas.
    * Very wide [browsers support for canvas](http://caniuse.com/#feat=canvas).
    * Pixels RGBA values are already accessible as a `Uint8ClampedArray`.
- tst



## Other barcode image processing libraries (related to JavaScript)

- Original ZXing (1D/2D, Java, Apache-2.0): https://github.com/zxing/zxing (based on luminance binarization)
    * ZXing Emscripten build (1D/2D?, JavaScript, Apache-2.0, forked from ZXing on 30-Nov-2013): https://github.com/kig/zxing-cpp-emscripten
    * jsqrcode (QR, JavaScript, Apache-2.0, no encoding): https://github.com/LazarSoft/jsqrcode
        - zxing (QR, JavaScript, Apache-2.0): https://www.npmjs.com/package/zxing (port to npm of jsqrcode)
        - HTML5 QR Code Reader (QR, JavaScript jQuery plugin, MIT): https://github.com/dwa012/html5-qrcode
    * zxingjs (1D, JavaScript, Apache 2.0): https://github.com/wojciechszela/zxingjs (several dependencies)
    * phonegap-plugin-barcodescanner (1D/2D, JavaScript wrapper for Cordova, MIT): https://github.com/phonegap/phonegap-plugin-barcodescanner
- quaggaJS (1D, JavaScript, MIT, parallel Web Workers, any orientation): https://serratus.github.io/quaggaJS/ (uses a first-step locator to achieve orientation independence and multi codes reading, but it is much slower than ZXing)
- BarcodeReader (1D, JavaScript, MIT): https://github.com/EddieLa/JOB
- quirc (2D, C, BSD): https://github.com/dlbeer/quirc
    * Quirc.js (2D, JavaScript, BSD): https://github.com/zz85/quirc.js (article: http://www.lab4games.net/zz85/blog/2015/12/03/quirc-js-an-alternative-javascript-qrcode-decoder/)
- WebCodeCamJS (1D/2D, JavaScript, MIT): https://github.com/andrastoth/WebCodeCamJS (wrap of BarcodeReader and jsqrcode)
- QR Code Scanner and Generator (QR, JavaScript, proprietary): http://codecanyon.net/item/qr-code-scanner-and-generator/7646726



## License

ZXingJS2 is distributed under the [Apache 2.0 License](http://choosealicense.com/licenses/apache-2.0/), like ZXing.
