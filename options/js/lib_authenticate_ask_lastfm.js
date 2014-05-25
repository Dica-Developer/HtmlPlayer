function initLastfmInlineLink() {
  var webview = document.getElementById('lastfmInline');
  webview.src = 'http://www.last.fm/api/auth/?api_key=ac2f676e5b95231ac4706b3dcb5d379d&' + location.search;
}

window.onload = initLastfmInlineLink;
