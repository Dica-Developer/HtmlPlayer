/*global $:true, Scrobbler:true, FileImporter:true, alert:true, chrome:true */

(function(){
  "use strict";
function saveLogin() {
  var login = $("#loginBox").val();
  localStorage.authentication_login = JSON.stringify(login);
}

function savePassword() {
  var password = $("#passwordBox").val();
  localStorage.authentication_password = JSON.stringify(password);
}

function saveServerUrl() {
  var serverUrl = $("#serverUrlBox").val();
  localStorage.serverUrl = JSON.stringify(serverUrl);
}

function fill() {
  var password = localStorage.authentication_password;
  if (null !== password && undefined !== password) {
    $("#passwordBox").val(JSON.parse(password));
  }
  var login = localStorage.authentication_login;
  if (null !== login && undefined !== login) {
    $("#loginBox").val(JSON.parse(login));
  }
  var serverUrl = localStorage.serverUrl;
  if (null !== serverUrl && undefined !== serverUrl) {
    var serverUrlClear = JSON.parse(serverUrl);
    $("#serverUrlBox").val(serverUrlClear);
    var selectElement = $("#backendSelection");
    if ("https://streaming.one.ubuntu.com" === serverUrlClear) {
      selectOption(selectElement, "ubuntuone");
    } else {
      selectOption(selectElement, "subsonic");
    }
    initBackend();
  }

  var gracenoteClient_ID = localStorage.gracenoteClient_ID;
  var gracenoteWepAPI_ID = localStorage.gracenoteWepAPI_ID;

  if(gracenoteWepAPI_ID){
    $('#gracenoteWepAPI_ID').val(JSON.parse(gracenoteWepAPI_ID));
  }
  if(gracenoteClient_ID){
    $('#gracenoteClient_ID').val(JSON.parse(gracenoteClient_ID));
  }

  var lastFmLogin = localStorage["audica.lastfm.login"];
  var $lastfmUserLink = $("#lastfmUserLink");
  var $lastfmUserLabel = $("#lastfmUserLabel");
  var $lastLoginLink = $("#lastfmLoginLink");
  var $lastfmLogoutLink = $("#lastfmLogoutLink");
  if (null !== lastFmLogin && undefined !== lastFmLogin) {
    $lastfmUserLink.text(lastFmLogin);
    $lastfmUserLink.show();
    $lastfmUserLabel.show();
    $lastfmLogoutLink.show();
    $lastLoginLink.hide();
  } else {
    $lastLoginLink.show();
    $lastfmLogoutLink.hide();
    $lastfmUserLink.hide();
    $lastfmUserLabel.hide();
  }
  $("#backend, #scrobble, #gracenote, #about").on('click', selectTab);
}

function selectTab(event) {
  var currentTab = $("li.navbar-item-selected");
  //noinspection JSUnresolvedVariable
  currentTab.removeClass("navbar-item-selected");
  $("#" + currentTab.attr('id') + "Page").hide();
  //noinspection JSUnresolvedVariable
  var currentTarget = $(event.currentTarget);
  currentTarget.addClass("navbar-item-selected");
  $("#" + currentTarget.attr('id') + "Page").show();
}

function initBackend() {
  var value = $('#backendSelection').find(':selected').val();
  var $ubuntuoneAuthenticationHelp = $("#ubuntuoneAuthenticationHelp");
  var $subsonicAuthParams = $("#subsonicAuthParams");
  var $fileImporterFields = $("#fileImporterFields");
  if ("ubuntuone" === value) {
    $ubuntuoneAuthenticationHelp.show();
    $subsonicAuthParams.hide();
    $fileImporterFields.hide();
  } else if ("subsonic" === value) {
    $ubuntuoneAuthenticationHelp.hide();
    $subsonicAuthParams.show();
    $fileImporterFields.hide();
  } else {
    $ubuntuoneAuthenticationHelp.hide();
    $subsonicAuthParams.show();
    $fileImporterFields.hide();
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
  delete localStorage.audica_lastfm_sessionKey;
  delete localStorage.audica_lastfm_login;
  $("#lastfmUserLink").show();
  $("#lastfmLogoutLink").hide();
  $("#lastfmLoginLink").show();
  $("#lastfmUserLabel").hide();
}

function lastFmLoginClick(e) {
  e.target.href = (new Scrobbler(null, null)).getTokenUrl();
}

function lastfmUserLink(e) {
  e.target.href = 'http://last.fm/user/' + e.target.innerHTML;
}

var saveField = function(){
  localStorage[$(this).attr('id')] = JSON.stringify($(this).val());
};

$(function() {
  fill();

  $('#lastfmLoginLink').on('click', lastFmLoginClick);
  $('#lastfmLogoutLink').on('click', logoutFromLastFm);
  $('#lastfmUserLink').on('click', lastfmUserLink);
  $('#backendSelection').on('change', initBackend);
  $('#serverUrlBox').on('change', saveServerUrl);
  $('#loginBox').on('change', saveLogin);
  $('#passwordBox').on('change', savePassword);
  $('#gracenoteClient_ID, #gracenoteWepAPI_ID').on('change', saveField);

  var fileImporter = new FileImporter();
  fileImporter.init();

  document.querySelector('#fileImporter_dropZone').addEventListener('drop', function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      fileImporter.writeFiles(event.dataTransfer.files);
    }, false);
  document.querySelector('#fileImporter_upload').addEventListener('change', function(event) {
      fileImporter.writeFiles(event.target.files);
    }, false);

  //noinspection JSUnresolvedVariable,JSUnresolvedFunction
  chrome.extension.onRequest.addListener(function(request, sender) {
    var pattLastFM = new RegExp("^chrome-extension://.+/options/authenticate_lastfm\\.html.token=(.+)$");
    var patt = new RegExp("^ubuntuone://(.+):(.+)@syncml\\.one\\.ubuntu\\.com$");
    var match = null;
    if (patt.test(request.url)) {
      match = patt.exec(request.url);
      $("#loginBox").val(match[1]);
      $("#passwordBox").val(match[2]);
      $("#serverUrlBox").val("https://one.ubuntu.com/music/api/1.0");
      saveLogin();
      savePassword();
      saveServerUrl();
    } else if (pattLastFM.test(request.url)) {
      match = pattLastFM.exec(request.url);
      (new Scrobbler(null, null)).getSession(match[1], function(data) {
        if (undefined === data.error) {
          /** @namespace data.session */
          localStorage.audica_lastfm_sessionKey = data.session.key;
          localStorage.audica_lastfm_login = data.session.name;
          var $lastfmUserLink = $("#lastfmUserLink");
          $lastfmUserLink.text(data.session.name);
          $lastfmUserLink.show();
          $("#lastfmLogoutLink").show();
          $("#lastfmLoginLink").hide();
          $("#lastfmUserLabel").show();
        } else {
          alert("It failed to get a session key." + data.error + " - " + data.message);
        }
      }, null);
    } else {
      alert("It failed to retreive the authentication credentials. The returned url is invalid '" + request.url + "'.");
    }
    //noinspection JSUnresolvedVariable
    chrome.tabs.remove(sender.tab.id);
  });
});
})();
