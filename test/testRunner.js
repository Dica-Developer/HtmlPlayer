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
  var failed = $('.spec.failed');
  msgGenral = msgGenral + passed.length + ' passed tests of ' + (passed.length + failed.length) + '\n';
  msgGenral = msgGenral + failed.length + ' failed tests of ' + (passed.length + failed.length) + '\n';
  msgFailure = msgFailure + 'Failed specs :\n';

  if(failed.length !== 0){
    failed.each(function(){
      var spec = $(this).find('.description').text();
      var message = $(this).find('.resultMessage').text();
      var stack = $(this).find('.stackTrace').text();
      msgFailure = msgFailure + ' "'+ spec + '"\n';
      msgFailure = msgFailure + ' "'+ message + '"\n';
      msgFailure = msgFailure + ' "'+ stack + '"\n';
    });
  }

  msgGenral = msgGenral + $("span.finished-at").text();
  var error = (failed.length > 0);
  return {
    'msg': {
      'general': msgGenral,
      'failures': msgFailure
    },
    'error': error
  };
};

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
      var result = page.evaluate(parseResultPage);
      console.log(result.msg.general.green);
      if (result.error) {
        console.error(result.msg.failures.red);
        phantom.exit(1);
      } else {
        phantom.exit(0);
      }
    }, 30000);
  }
});