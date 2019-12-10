/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const api_helper = require('./api_Helper');

var client_id = '61c7611fd57e442f9486d0fef89d0fc6'; // Your client id
var client_secret = '2c097dc4fea84435b240ec4a590fa27d'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
app.get('/search',function(req,res){
  var accessToken='BQA2SBmDbICd6k9M7a24ANNOAKzB1Og4pr1qnEGyh4DhISfHI2CYRX63WUVzY8T0ad20VyVEacPi-HMvXwhf1xrc4Nmgl0b5unmgTl3fWI955Vil6Ef9tJxCyJtfehTXSvOcZo2ZG-0kdPR0eB_ckmzXR2X9mODG95U'

  var options = {
    url: 'https://api.spotify.com/v1/search?q=Daft+Punk&type=artist',
    headers: { 'Authorization': 'Bearer ' + accessToken},
    json: true
  };
  request.get(options, function(error,response,body){
    res.json(body)
    console.log(body)
  })
})
app.get('/artist', function (req, res) {

  var accessToken='BQA2SBmDbICd6k9M7a24ANNOAKzB1Og4pr1qnEGyh4DhISfHI2CYRX63WUVzY8T0ad20VyVEacPi-HMvXwhf1xrc4Nmgl0b5unmgTl3fWI955Vil6Ef9tJxCyJtfehTXSvOcZo2ZG-0kdPR0eB_ckmzXR2X9mODG95U'
  var options = {
    url: 'https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    console.log(body);
    res.json(body)
    // response.send(body);
  });

  // api_helper.make_API_call('https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF').then(response => {
  //   res.json(response)
  // })
  // .catch(error => {
  //   res.send(error)
  // })
  // res.send('response artist')
})

console.log('Listening on 8888');
app.listen(8888);
