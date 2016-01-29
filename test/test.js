var img = document.getElementById("ean8-1_1"),
    canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    width = img.width,
    height = img.height,
    ul = document.getElementById("resultsList");

canvas.width = width;
canvas.height = height;
context.drawImage(img, 0, 0, width, height);

zxing._initialize(width);

var result = zxing.oneDReader._decode(zxing._getCanvasImageRGBAData(canvas)),
    lines = result.lines;

var li, text, line;
context.strokeStyle = "#FF0000";

for (var i = 0; i < lines.length; i += 1) {
    line = lines[i];
    li = document.createElement("li");
    text = document.createTextNode(line.bits);
    li.appendChild(text);
    ul.appendChild(li);
    //console.log("bitRow length: " + line.bits.length);

    context.strokeRect(0, line.rowNumber, width, 0);
}
