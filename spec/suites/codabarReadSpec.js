describe("codabar reader", function () {

    it("does nothing", function () {

        console.log("nothing");
        expect(true).to.equal(true);

    });

    function generateTestImageFunction(imageName) {
        return function (done) {
            var img = document.createElement("img");
            img.name = imageName;
            img.result = tests[imageName];
            img.onload = function () {
                var result = zxing.readImage(this);
                expect(result).to.be.an("object");
                expect(result.text).to.equal(this.result);
                done();
            };
            img.src = PATH + imageName;
        };
    }

    var tests = expectedResults["codabar-1"],
        PATH = "resources/codabar-1/",
        imageName, img;

    if (tests) {

        for (imageName in tests) {

            it ("decodes test image `" + imageName + "`", generateTestImageFunction(imageName));
        }
    }

});
