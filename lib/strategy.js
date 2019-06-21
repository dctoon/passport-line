/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Line authentication strategy authenticates requests by delegating to
 * Line using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `channelID`      your Line channel's id
 *   - `channelSecret`  your Line channel's secret
 *   - `callbackURL`   URL to which Line will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new LineStrategy({
 *         channelID: 'XXX',
 *         channelSecret: 'XXXX'
 *         callbackURL: 'https://www.example.net/auth/line/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};

  options.clientID = options.channelID;
  options.clientSecret = options.channelSecret;
  options.authorizationURL = options.authorizationURL || 'https://access.line.me/oauth2/v2.1/authorize';
  options.tokenURL = options.tokenURL || 'https://api.line.me/oauth2/v2.1/token';

  OAuth2Strategy.call(this, options, verify);

  this.name = 'line';
  this._profileURL = options.profileURL || 'https://api.line.me/v2/profile';

  // Use Authorization Header (Bearer with Access Token) for GET requests. Used to get User's profile.
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from Line.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         `line`
 *   - `id`               user's Line ID
 *   - `displayName`      user's full name
 *   - `pictureUrl`       user's picture url
 *   - `statusMessage`    user's status message
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {

  this._oauth2.get(this._profileURL, accessToken, function (err, body, res) {
    if (err) {
      return done(new InternalOAuthError('failed to fetch user profile', err));
    }

    try {
      var json = JSON.parse(body);

      var profile = { provider: this.name };
      profile.id = json.userId;
      profile.displayName = json.displayName;
      profile.pictureUrl = json.pictureUrl;
      profile.statusMessage = json.statusMessage;

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
