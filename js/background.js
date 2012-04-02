var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url' : 'https://one.ubuntu.com/oauth/apps/request',
  'authorize_url' : 'https://one.ubuntu.com/oauth/apps/authorize',
  'access_url' : 'https://one.ubuntu.com/oauth/apps/access',
  'consumer_key' : 'anonymous',
  'consumer_secret' : 'anonymous',
  'scope' : 'scope=music=readwrite',
  'app_name' : 'player'
});

oauth.authorize(function() {
    console.log("on authorize");
}
