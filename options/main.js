function saveLogin() {
  var login = document.querySelector("#loginBox").value;
  localStorage["authentication.login"] = JSON.stringify(login);
}

function savePassword() {
  var password = document.querySelector("#passwordBox").value;
  localStorage["authentication.password"] = JSON.stringify(password);
}

function saveServerUrl() {
  var serverUrl = document.querySelector("#serverUrlBox").value;
  localStorage["serverUrl"] = JSON.stringify(serverUrl);
}

function fill() {
  var password = localStorage["authentication.password"];
  if (null !== password && undefined !== password) {
    document.querySelector("#passwordBox").value = JSON.parse(password);
  }
  var login = localStorage["authentication.login"];
  if (null !== login && undefined !== login) {
    document.querySelector("#loginBox").value = JSON.parse(login);
  }
  var serverUrl = localStorage["serverUrl"];
  if (null !== serverUrl && undefined !== serverUrl) {
    var serverUrlClear = JSON.parse(serverUrl);
    document.querySelector("#serverUrlBox").value = serverUrlClear;
    if ("https://streaming.one.ubuntu.com" === serverUrlClear) {
      selectOption($("#backendSelection"), "ubuntuone");
    } else {
      selectOption($("#backendSelection"), "subsonic");
    }
    initBackend(null);
  }
  var lastFmLogin = localStorage["audica.lastfm.login"];
  if (null !== lastFmLogin && undefined !== lastFmLogin) {
    document.querySelector("#lastfmUserLink").innerHTML = lastFmLogin;
    document.querySelector("#lastfmUserLink").style.display = "block";
    document.querySelector("#lastfmUserLabel").style.display = "block";
    document.querySelector("#lastfmLogoutLink").style.display = "block";
    document.querySelector("#lastfmLoginLink").style.display = "none";
  } else {
    document.querySelector("#lastfmLoginLink").style.display = "block";
    document.querySelector("#lastfmLogoutLink").style.display = "none";
    document.querySelector("#lastfmUserLink").style.display = "none";
    document.querySelector("#lastfmUserLabel").style.display = "none";
  }
  document.querySelector("#backend").onclick = selectTab;
  document.querySelector("#scrobble").onclick = selectTab;
  document.querySelector("#about").onclick = selectTab;
}

function selectTab() {
  var currentTab = document.querySelector("li.navbar-item-selected")
  currentTab.classList.remove("navbar-item-selected");
  document.querySelector("#" + currentTab.id + "Page").style.display = "none";
  this.classList.add("navbar-item-selected");
  document.querySelector("#" + this.id + "Page").style.display = "block";
}

function initBackend(event) {
  if ($("#backendSelection :selected").length > 0 && "ubuntuone" === $("#backendSelection :selected")[0].value) {
    document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "block";
    document.querySelector("#subsonicAuthParams").style.display = "none";
  } else {
    document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "none";
    document.querySelector("#subsonicAuthParams").style.display = "block";
  }
}

function selectOption(selectElement, optionValue) {
  var children = selectElement.children();
  for (var i = 0; i < children.length; i++) {
    if (optionValue === children[i].value) {
      selectElement.selectedIndex = children[i].index;
    }
  }
}

function logoutFromLastFm() {
  delete localStorage["audica.lastfm.sessionKey"];
  delete localStorage["audica.lastfm.login"];
}

function lastFmLoginClick(e) {
  e.target.href = (new Scrobbler(null, null)).getTokenUrl();
}

function lastfmUserLink(e) {
  e.target.href = 'http://last.fm/user/' + e.target.innerHTML;
}

$(function() {
  fill();

  document.querySelector('#lastfmLoginLink').addEventListener('click', lastFmLoginClick);
  document.querySelector('#lastfmLogoutLink').addEventListener('click', logoutFromLastFm);
  document.querySelector('#lastfmUserLink').addEventListener('click', lastfmUserLink);
  document.querySelector('#backendSelection').addEventListener('change', initBackend);
  document.querySelector('#serverUrlBox').addEventListener('change', saveServerUrl);
  document.querySelector('#loginBox').addEventListener('change', saveLogin);
  document.querySelector('#passwordBox').addEventListener('change', savePassword);

  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    var pattLastFM = new RegExp("^chrome-extension://.+/options/authenticate_lastfm\.html.token=(.+)$");
    var patt = new RegExp("^ubuntuone://(.+):(.+)@syncml\.one\.ubuntu\.com$");
    if (patt.test(request.url)) {
      var match = patt.exec(request.url);
      document.querySelector("#loginBox").value = match[1];
      document.querySelector("#passwordBox").value = match[2];
      document.querySelector("#serverUrlBox").value = "https://streaming.one.ubuntu.com";
      saveLogin();
      savePassword();
      saveServerUrl();
    } else if (pattLastFM.test(request.url)) {
      var match = pattLastFM.exec(request.url);
      (new Scrobbler(null, null)).getSession(match[1], function(data, textStatus, jqXHR) {
        if (undefined === data.error) {
          localStorage["audica.lastfm.sessionKey"] = data.session.key;
          localStorage["audica.lastfm.login"] = data.session.name;
          document.querySelector("#lastfmUserLink").innerHTML = data.session.name;
          document.querySelector("#lastfmUserLink").style.display = "block";
          document.querySelector("#lastfmLogoutLink").style.display = "block";
          document.querySelector("#lastfmLoginLink").style.display = "none";
          document.querySelector("#lastfmUserLabel").style.display = "block";
        } else {
          alert("It failed to get a session key." + data.error + " - " + data.message);
        }
      }, null);
    } else {
      alert("It failed to retreive the authentication credentials. The returned url is invalid '" + request.url + "'.");
    }
    chrome.tabs.remove(sender.tab.id);
  });
})