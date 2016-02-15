describe("codabar reader", function () {

    it("does nothing", function () {

        console.log("nothing");
        expect(true).to.equal(true);

    });

    function checkTestsNb(done) {
        testsDone += 1;

        if (testsDone === testsNb) {
            console.log("Reached " + testsDone);
            done();
        }
    }

    var tests = expectedResults["codabar-1"],
        PATH = "resources/codabar-1/",
        imageNames = Object.keys(tests),
        testsNb = imageNames.length,
        testsDone = 0,
        imageName, img;

    if (tests) {

        it ("decodes all " + testsNb + " test images", function (done) {

            for (imageName in tests) {
                img = document.createElement("img");
                img.name = imageName;
                img.result = tests[imageName];
                img.onload = function () {
                    var result = zxing.readImage(this);
                    expect(result).to.be.an("object");
                    expect(result.text).to.equal(this.result);
                    console.log("Found " + result.text + ", expected: " + this.result);
                    checkTestsNb(done);
                };
                img.src = PATH + imageName;
                document.body.appendChild(img);
            }

        });
    }

});
