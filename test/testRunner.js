var page = require('webpage').create();

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000,
        //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function () {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof (testFx) === "string" ? eval(testFx) : testFx());
            } else {
                if (!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof (onReady) === "string" ? eval(onReady) : onReady();
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250);
}

page.open('./test/example/SpecRunner.html', function (status) {
    page.viewportSize = {
        width: 1280,
        height: 800
    };
    if (status !== 'success') {
        console.log('Unable to access the network!');
    } else {
        waitFor(function () {
            return page.evaluate(function () {
                return $("span.finished-at").is(":visible");
            });
        }, function () {
            page.render('result.png');
            phantom.exit();
        }, 30000);
    }
});