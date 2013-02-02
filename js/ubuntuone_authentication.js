/*global chrome:true*/
chrome.extension.sendRequest({url: document.querySelector("form").action}, function(response) {});
