var img = document.getElementById("codabar-1_01"),
    imgs = [
        "codabar-1_01",
        "codabar-1_02",
        "codabar-1_03",
        "codabar-1_04",
        "codabar-1_09",
        "codabar-1_10",
        "codabar-1_11",
        "codabar-1_12",
        "codabar-1_13",
        "codabar-1_14",
        "codabar-1_15"
    ],
    canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    width = img.width,
    height = img.height,
    ul = document.getElementById("resultsList");

canvas.width = width;
canvas.height = height;
context.strokeStyle = "#FF0000";

var imax = 10;
var data = {
    "codabar-1_01": {
        "expectedResult": "1234567890",
        "cumulatedDuration": 0
    },
    "codabar-1_02": {
        "expectedResult": "1234567890",
        "cumulatedDuration": 0
    },
    "codabar-1_03": {
        "expectedResult": "294/586",
        "cumulatedDuration": 0
    },
    "codabar-1_04": {
        "expectedResult": "123455",
        "cumulatedDuration": 0
    },
    "codabar-1_09": {
        "expectedResult": "12345",
        "cumulatedDuration": 0
    },
    "codabar-1_10": {
        "expectedResult": "123456",
        "cumulatedDuration": 0
    },
    "codabar-1_11": {
        "expectedResult": "3419500",
        "cumulatedDuration": 0
    },
    "codabar-1_12": {
        "expectedResult": "31117013206375",
        "cumulatedDuration": 0
    },
    "codabar-1_13": {
        "expectedResult": "12345",
        "cumulatedDuration": 0
    },
    "codabar-1_14": {
        "expectedResult": "31117013206375",
        "cumulatedDuration": 0
    },
    "codabar-1_15": {
        "expectedResult": "123456789012",
        "cumulatedDuration": 0
    }
};

/*elIdAddListener("decodeImage", "click", function () {
    context.drawImage(img, 0, 0, width, height);
    decode();
});*/

var perfInitStart = Date.now();

zxing.init(width);

zxing.oneD.codabar.reader.init();

console.log("Init: " + (Date.now() - perfInitStart) + " ms");


var data1, key, result;

var perfDecodeStart ;
for (var i = 0; i < imax; i += 1) {
    for (key in data) {
        perfDecodeStart = Date.now();
        data1 = data[key];
        img = getElById(key);
        width = img.width;
        height = img.height;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(img, 0, 0, width, height);

        //perfDecodeStart = Date.now();
        zxing.init(width);
        result = decodeSimple();
        data1.cumulatedDuration += (Date.now() - perfDecodeStart);
        if (result.text !== data1.expectedResult) {
            console.log("Decoding error: expected " + data1.expectedResult + ", got " + result.text);
        }
    }
}
for (key in data) {
    data1 = data[key];
    console.log(key + ": " + (data1.cumulatedDuration / imax) + " ms");
}

/*var perfDecodeStart ;
for (var i = 0; i < imgs.length; i += 1) {
    img = getElById(imgs[i]);
    width = img.width;
    height = img.height;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(img, 0, 0, width, height);

    perfDecodeStart = Date.now();
    zxing.init(width);
    decodeSimple();
    console.log(imgs[i] + ": " + (Date.now() - perfDecodeStart) + " ms");
}*/

function decodeSimple() {
    return zxing.oneDReader._decode(zxing._getCanvasImageRGBAData(canvas));
    //console.log(result.result);
    //console.log(result);
    /*console.log(result.text);
    console.log(result.type);*/
}

/*function decode() {
    var result = zxing.oneDReader._decode(zxing._getCanvasImageRGBAData(canvas)),
        lines = result.lines;

    var li, text, line, result2;

    for (var i = 0; i < lines.length; i += 1) {
        line = lines[i];
        li = document.createElement("li");
        text = document.createTextNode(line.bits || "(empty)");
        result2 = document.createTextNode(JSON.stringify(line.result, null, 2));
        li.appendChild(text);
        li.appendChild(result2);
        ul.appendChild(li);
        //console.log("bitRow length: " + line.bits.length);

        context.strokeRect(0, line.rowNumber, width, 0);
    }
}*/

var v = getElById("v"),
    videoSelect = getElById("videoSource"),
    n = navigator,
    capturing = false,
    constraints = {
        video: {
            mandatory: {
                maxWidth: 1280,
                    maxHeight: 720
            },
            optional: [{
                sourceId: true
            }]
        },
        audio: false
    },
    stream, mediaDevices;

mediaDevices = n.mediaDevices;
if (mediaDevices && mediaDevices.getUserMedia) {
    //mediaDevices = n.mediaDevices;
} else {
    mediaDevices = n.getUserMedia || n.mozGetUserMedia || n.webkitGetUserMedia;
    if (mediaDevices) {
        mediaDevices = {
            getUserMedia: function(c) {
                return new Promise(function(y, n2) {
                    (n.getUserMedia || n.mozGetUserMedia || n.webkitGetUserMedia).call(n, c, y, n2);
                });
            },
            /*enumerateDevices: function(c) {
                return new Promise(function(c, y, n) {
                    (MediaStreamTrack.getSources).call(n, c, y, n);
                });
            }*/
            enumerateDevices: MediaStreamTrack.getSources
        }
    } else {
        mediaDevices = null;
        alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
    }
}

if (mediaDevices) {
    mediaDevices.enumerateDevices(gotSources);
}

var streamSrc = ('srcObject' in HTMLVideoElement.prototype) ?
    function (video, stream) {
        video.srcObject = !!stream ? stream : null;
    } :
    function (video, stream) {
        video.src = !!stream ? (window.URL || window.webkitURL).createObjectURL(stream) : new String();
    };

function gotSources(sourceInfos) {
    var i = 0,
        sourceInfo, option;

    for (; i < sourceInfos.length; i += 1) {
        sourceInfo = sourceInfos[i];
        option = document.createElement('option');
        option.value = sourceInfo.id || sourceInfo.deviceId;
        if (sourceInfo.kind === 'audio') {
            /*option.text = sourceInfo.label || 'microphone ' +
                (audioSelect.length + 1);
            audioSelect.appendChild(option);*/
        } else if (sourceInfo.kind === 'video') {
            option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source: ', sourceInfo);
        }
    }
}

function init() {
    constraints = changeConstraints();
    try {
        mediaDevices.getUserMedia(constraints).then(success).catch(error);
    } catch (error) {
        //options.getUserMediaError(error);
        console.log("No camera support found");
        return false;
    }
    return true;
}

function changeConstraints() {
    if (videoSelect && videoSelect.length !== 0) {
        switch (videoSelect[videoSelect.selectedIndex].value.toString()) {
            case 'true':
                constraints.video.optional = [{
                    sourceId: true
                }];
                break;
            case 'false':
                constraints.video = false;
                break;
            default:
                constraints.video.optional = [{
                    sourceId: videoSelect[videoSelect.selectedIndex].value
                }];
                break;
        }
    }
    constraints.audio = false;
    return constraints;
}

function start() {
    if (stream) {
        v.pause();
        streamSrc(v, null);
        var tracks = stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
    }
    if (!stream) {
        init();
    }
}

elIdAddListener("startCam", "click", start);

elIdAddListener("stopCam", "click", function () {
    capturing = false;
    v.pause();
    v.src = null;
    if (stream) {
        var tracks = stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
    }
});

function captureToCanvas() {
    if (capturing)
    {
        try {
            context.drawImage(v, 0, 0);
            try {
                decode();
                setTimeout(captureToCanvas, 500);
            }
            catch (e) {
                console.log(e);
                setTimeout(captureToCanvas, 500);
            }
        } catch(e){
            console.log(e);
            setTimeout(captureToCanvas, 500);
        }
    }
}

function success(streamIn) {
    stream = streamIn;
    streamSrc(v, stream);
    v.play();
    capturing = true;
    console.log("Camera started!");
    setTimeout(captureToCanvas, 500);
}

function error(error) {
    capturing = false;
    console.log("No camera available");
}

function elIdAddListener(id, listenerType, listenerCallback) {
    var el = getElById(id);

    if (el) {
        el.addEventListener(listenerType, listenerCallback);
        return true;
    }

    return false;
}

function getElById(id) {
    return document.getElementById(id);
}
