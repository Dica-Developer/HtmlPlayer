"use strict";

/*global phantom, $, console, require, setInterval, clearInterval*/
var page = require('webpage').create();
var colors = require('colors');

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

var parseResultPage = function () {
  var msgFailure = '';
  var msgGenral = '';
  var passed = $('.spec.passed');
  var failedSpecs = $('.spec.failed');
  var failedSuites = $('.suite.failed');
  msgGenral = msgGenral + passed.length + ' passed tests of ' + (passed.length + failedSpecs.length) + '\n';
  msgGenral = msgGenral + failedSpecs.length + ' failed tests of ' + (passed.length + failedSpecs.length) + '\n';


  if (failedSuites.length !== 0) {
    failedSuites.each(function () {
      var suite = $(this).find('.description').eq(0).text();
      msgFailure = msgFailure + 'Suite: "' + suite + '"\n';
      $(this).find('.spec.failed').each(function () {
        var spec = $(this).find('.description').eq(0).text();
        var message = $(this).find('.resultMessage').eq(0).text();
        var stack = $(this).find('.messages').find('.stackTrace').eq(0).text() || 'No Stack available!';
        msgFailure = msgFailure + ' Spec: "' + spec + '"\n';
        msgFailure = msgFailure + '     "' + message + '"\n';
        msgFailure = msgFailure + '     "' + stack + '"\n';
      });

    });
  }

  msgGenral = msgGenral + $("span.finished-at").text();
  var error = (failedSpecs.length > 0);
  return {
    'msg':{
      'general':msgGenral,
      'failures':msgFailure
    },
    'error':error
  };
};

page.open('./test/SpecRunner.html', function (status) {
  page.viewportSize = {
    width:1280,
    height:800
  };
  if (status !== 'success') {
    console.log('Unable to access the network!');
  } else {
    waitFor(function () {
      return page.evaluate(function () {
        return $("span.finished-at").is(":visible");
      });
    }, function () {
      var result = page.evaluate(parseResultPage);

      console.log(result.msg.general.green);
      console.error(result.msg.failures.red);
      phantom.exit(result.error);

    }, 30000);
  }
});