# ZXingJS2
Yet another port to JavaScript of [ZXing](https://github.com/zxing/zxing) multi-format 1D/2D barcode image processing library.

Many 1D and/or 2D code image processing libraries exist.



## Rationale


### Mobile application target

Mobile application (smartphone) is a big usage:

- Manual input is tedious.
- Smartphone is ubiquitous / almost always readily available.
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


## Performance benchmark

Let's compare an early implementation of ZXingJS2 with zxingjs, from the performance point of view.

We expect the speed difference to highlight the drawbacks of Require.js dynamic modules loading, and the overhead of class emulation.

quaggaJS configuration: no locator, 0 workers.

Desktop Firefox:

| Operation | zxingjs duration (ms) | ZXingJS2 duration (ms) | Factor | Decoded value | quaggaJS duration (ms) |
| :-------- | :-------------------: | :--------------------: | :----: | :------------ | :--------------------: |
| Initialization | 1,091 | 1 | 1,000+ |N/A | 350 |
| Decode `codabar-1/01.png` | 27.7 | 3.9 | 7.1 | `1234567890` | 6 to 11 |
| Decode `codabar-1/02.png` | 10.3 | 2.6 | 4.0 | `1234567890` | 4 to 12 |
| Decode `codabar-1/03.png` | 8.5 | 2.3 | 3.7 |`294/586` | 4 to 8 |
| Decode `codabar-1/04.png` | 3.9 | 0.8 | 4.9 |`123455` | 1 to 4 |
| Decode `codabar-1/09.png` | 4.6 | 0.9 | 5.1 | `12345` | 1 to 3 |
| Decode `codabar-1/10.png` | 4.3 | 0.8 | 5.4 |`123456` | ? |
| Decode `codabar-1/11.png` | 4.9 | 0.9 | 5.4 | `3419500` | ? |
| Decode `codabar-1/12.png` | 16.8 | 3.4 | 4.9 | `31117013206375` | ? |
| Decode `codabar-1/13.png` | 5.1 | 1.0 | 5.1 | `12345` | ? |
| Decode `codabar-1/14.png` | 5.2 | 1.1 | 4.7 | `31117013206375` | ? |
| Decode `codabar-1/15.png` | 6.4 | 0.8 | 8.0 | `123456789012` | ? |

Desktop Chromium:

| Operation | zxingjs duration (ms) | ZXingJS2 duration (ms) | Factor | Decoded value | quaggaJS duration (ms) |
| :-------- | :-------------------: | :--------------------: | :----: | :------------ | :--------------------: |
| Initialization | 250 | 1 | 250 |N/A | ? |
| Decode `codabar-1/01.png` | 15.0 | 5.0 | 3.0 | `1234567890` | 5 to 8 |
| Decode `codabar-1/02.png` | 8.0 | 2.4 | 3.3 | `1234567890` | 4 to 12 |
| Decode `codabar-1/03.png` | 4.5 | 1.5 | 3.0 |`294/586` | 3 to 6 |
| Decode `codabar-1/04.png` | 1.9 | 0.4 | 4.8 |`123455` | 1 to 3 |
| Decode `codabar-1/09.png` | 2.5 | 0.5 | 5.0 | `12345` | 0 to 3 |
| Decode `codabar-1/10.png` | 2.0 | 0.3 | 6.7 |`123456` | ? |
| Decode `codabar-1/11.png` | 2.5 | 0.3 | 8.3 | `3419500` | ? |
| Decode `codabar-1/12.png` | 9.5 | 3.0 | 3.1 | `31117013206375` | ? |
| Decode `codabar-1/13.png` | 2.5 | 0.5 | 5.0 | `12345` | ? |
| Decode `codabar-1/14.png` | 3.0 | 0.4 | 7.5 | `31117013206375` | ? |
| Decode `codabar-1/15.png` | 3.5 | 0.6 | 5.8 | `123456789012` | ? |

If we include the canvas update in ZXingJS2 test, it increases the duration by less than 1 ms.

Pre-loading the modules does not change the initialization time: the measured duration reflects the situation where modules come straight from browser cache.

The measured processing durations are an average of 10 operations, not performed in a row. Indeed, browser optimizations sometimes detect identical results when the same image is processed multiple times in a row, which cuts down the processing duration.

Conclusions:

- Getting rid of the Require.js scheme saves about 1 second initialization in Firefox, 0.25s in Chromium.
- Porting to JavaScript without Java class emulation speeds up the processing by a factor of 4 to 8 in Firefox, 3 to 8 in Chromium, at least in the case of 1D Codabar.

Faster processing means support of less performant devices, and for a given device, increased processing rate, hence the ability to process more frames and more opportunities to capture a good image.

## Other barcode image processing libraries (related to JavaScript)

- Original ZXing (1D/2D, Java, Apache-2.0): https://github.com/zxing/zxing (based on luminance binarization)
    * ZXing Emscripten build (1D/2D?, JavaScript, Apache-2.0, forked from ZXing on 30-Nov-2013): https://github.com/kig/zxing-cpp-emscripten
    * jsqrcode (QR, JavaScript, Apache-2.0, no encoding): https://github.com/LazarSoft/jsqrcode
        - zxing (QR, JavaScript, Apache-2.0): https://www.npmjs.com/package/zxing (port to npm of jsqrcode)
        - qrcode-reader (QR, JavaScript, MIT): https://www.npmjs.com/package/qrcode-reader (port to npm of jsqrcode)
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
