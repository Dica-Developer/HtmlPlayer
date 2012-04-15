function saveLogin(){
  var login = document.querySelector("#loginBox").value;
	localStorage["authentication.login"] = JSON.stringify(login);
}

function savePassword(){
  var password = document.querySelector("#passwordBox").value;
	localStorage["authentication.password"] = JSON.stringify(password);
}

function saveServerUrl(){
  var serverUrl = document.querySelector("#serverUrlBox").value;
	localStorage["serverUrl"] = JSON.stringify(serverUrl);
}

function fill(){
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
	  document.querySelector("#serverUrlBox").value = JSON.parse(serverUrl);
	}
	document.querySelector("#backend").onclick = selectTab;
	document.querySelector("#scrobble").onclick = selectTab;
	document.querySelector("#about").onclick = selectTab;
}

function selectTab() {
  var currentTab = document.querySelector("li.navbar-item-selected")
  currentTab.classList.remove("navbar-item-selected");
  document.querySelector("#"+ currentTab.id +"Page").style.display = "none";
  this.classList.add("navbar-item-selected");
  document.querySelector("#"+ this.id +"Page").style.display = "block";
}

function initBackend(event) {
  if ($("#backendSelection :selected").length > 0 && "ubuntuone" === $("#backendSelection :selected")[0].value) {
    document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "block";
    document.querySelector("#serverUrlBox").disabled = "disabled";
    document.querySelector("#loginBox").disabled = "disabled";
    document.querySelector("#passwordBox").disabled = "disabled";
  } else {
    document.querySelector("#ubuntuoneAuthenticationHelp").style.display = "none";
    document.querySelector("#serverUrlBox").disabled = "";
    document.querySelector("#loginBox").disabled = "";
    document.querySelector("#passwordBox").disabled = "";
  }
}

