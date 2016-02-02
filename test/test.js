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
    capturing = false,
    stream;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

if (MediaStreamTrack === undefined ||
    MediaStreamTrack.getSources === undefined) {
    alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
} else {
    MediaStreamTrack.getSources(gotSources);
}

function gotSources(sourceInfos) {
    for (var i = 0; i !== sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement('option');
        option.value = sourceInfo.id;
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

function start() {
    if (stream) {
        v.src = null;
        stream.stop();
    }
    var videoSource = videoSelect.value;
    var constraints = {
        audio: false,
        video: {
            optional: [{
                sourceId: videoSource
            }]
        }
    };
    var n = navigator;
    if (n.mediaDevices.getUserMedia) {
        n.mediaDevices.getUserMedia(constraints)
            .then(success)
            .catch(error);
    } else if(n.getUserMedia) {
        n.getUserMedia(constraints, success, error);
    } else {
        console.log("No camera support found");
    }
}

elIdAddListener("startCam", "click", function () {
    var n = navigator;
    console.log("trying to start camera");

    if (n.mediaDevices.getUserMedia) {
        n.mediaDevices.getUserMedia({video: {facingMode: {exact: "environment"}}, audio: false})
            .then(success)
            .catch(error);
    } else if(n.getUserMedia) {
        n.getUserMedia({video: true, audio: false}, success, error);
    } else {
        console.log("No camera support found");
    }
});

elIdAddListener("stopCam", "click", function () {
    capturing = false;
    if (stream && stream.stop) {
        stream.stop();
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

function success(stream) {
    v.src = window.URL.createObjectURL(stream);
    stream = stream;
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
