/*global chrome*/
chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('main.html', {
    'state': 'maximized'
  }, function () {
  });
});
