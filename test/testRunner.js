"use strict";

/*global phantom, $, console, require, setInterval, clearInterval*/

var page = require('webpage').create();

function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis || 3000;
  var start = new Date().getTime(),
    condition = false,
    interval = setInterval(function () {
      if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
        condition = testFx();
      } else {
        if (!condition) {
          console.log("'waitFor()' timeout");
          phantom.exit(1);
        } else {
          console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
          onReady();
          clearInterval(interval);
        }
      }
    }, 250);
}

page.open('./test/SpecRunner.html', function (status) {
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
      var result = page.evaluate(function () {
        var msg = '';
        var passed = $('.suite .passed');
        var failed = $('.suite .failed');
        msg = msg + passed.length + ' passed tests of ' + (passed.length + failed.length) + '\n';
        msg = msg + failed.length + ' failed tests of ' + (passed.length + failed.length) + '\n';
        msg = msg + $("span.finished-at").text();
        var error = failed.length > 0 ? true : false;
        return {
          'msg': msg,
          'error': error
        };
      });
      console.log(result.msg);
      if (result.error) {
        phantom.exit(1);
      } else {
        phantom.exit(0);
      }
    }, 30000);
  }
});