function saveLogin(){
  var login = document.querySelector("#loginBox").value;
	localStorage["authentication.login"] = JSON.stringify(login);
}

function savePassword(){
  var password = document.querySelector("#passwordBox").value;
	localStorage["authentication.password"] = JSON.stringify(password);
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
	document.querySelector("#authentication").onclick = selectTab;
	document.querySelector("#about").onclick = selectTab;
}

function selectTab() {
  var currentTab = document.querySelector("li.navbar-item-selected")
  currentTab.classList.remove("navbar-item-selected");
  document.querySelector("#"+ currentTab.id +"Page").style.display = "none";
  this.classList.add("navbar-item-selected");
  document.querySelector("#"+ this.id +"Page").style.display = "block";
}

function authenticate() {
  // get oauth params from here: https://login.ubuntu.com/api/1.0/authentications?ws.op=authenticate&token_name=Ubuntu%20One%20@%20chrome
  // use result in signatures map plus '"shared_secret": ""'
  var url = 'https://one.ubuntu.com/phones/creds'
  var oauthObject = OAuthSimple().sign({path:url,
                                          parameters: 'platform=chrome&manufacturer=chrome&model=chrome&redirect_url=http://bla',
                                          signatures:{
                                            "consumer_secret": "lIcNthyZddYcKuKgtpoGZfvETxkLVV", 
                                            "token": "yiuVcpRrgWzLqFOHojNZmVBijyxmStsldHVMRXipBmsVKUfctd", 
"consumer_key": "TpM4bem", 
"name": "Ubuntu One @ chrome", 
"token_secret": "uhNJUjjtJMUJhnbgOUjViOKuaQljPpRTldGfAOWmvLBQJyYtCR",
"shared_secret": ""
                                         }});
  console.log(oauthObject.signed_url);
  // call signed url to get mobile login and password
  console.log("https://streaming.one.ubuntu.com/rest/ping.view?u=" +localStorage["authentication.login"]+ "&p=" + localStorage["authentication.password"] + "&v=1&c=HtmlPlayer");
  // get credentials from https://one.ubuntu.com/phones/
}

