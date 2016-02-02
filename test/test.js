var img = document.getElementById("ean8-1_1"),
    canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    width = img.width,
    height = img.height,
    ul = document.getElementById("resultsList");

canvas.width = width;
canvas.height = height;
context.strokeStyle = "#FF0000";

zxing.init(width);

zxing.oneD.codabar.reader.init();

elIdAddListener("decodeImage", "click", function () {
    context.drawImage(img, 0, 0, width, height);
    decode();
});

function decode() {
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
}

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
        var getUserMedia1 = n.getUserMedia || n.mozGetUserMedia || n.webkitGetUserMedia;
        mediaDevices = {
            getUserMedia: function(c) {
                return new Promise(function(y, n) {
                    getUserMedia1.call(n, c, y, n);
                    //(n.getUserMedia || n.mozGetUserMedia || n.webkitGetUserMedia).call(n, c, y, n);
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
