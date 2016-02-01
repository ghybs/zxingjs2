var img = document.getElementById("ean8-1_1"),
    canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    width = img.width,
    height = img.height,
    ul = document.getElementById("resultsList");

canvas.width = width;
canvas.height = height;
context.drawImage(img, 0, 0, width, height);

zxing.init(width);

zxing.oneD.codabar.reader.init();

var result = zxing.oneDReader._decode(zxing._getCanvasImageRGBAData(canvas)),
    lines = result.lines;

var li, text, line, result2;
context.strokeStyle = "#FF0000";

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
