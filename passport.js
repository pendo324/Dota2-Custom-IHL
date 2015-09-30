var passport = require("passport"),
    config = require("./app.js"),
    api_key = config.web_settings.apikey,
    SteamStrategy = require("passport-steam").Strategy,
    host = config.web_settings.baseurl + ":" + config.web_settings.port;

//passport.serializeUser(function(user, done) {
//    //console.log("TEST user: " + JSON.stringify(user));
//    done(null, user.account_id);
//});
//
//passport.deserializeUser(function(obj, done) {
//    //console.log("TEST obj: " + JSON.stringify(obj));
//    done(null, obj);
//});

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new SteamStrategy({
    returnURL: host + "/return",
    realm: host,
    apiKey: api_key
}, function initializeUser(identifier, profile, done) {
    //console.log("TEST profile: " + JSON.stringify(profile));
    return done(null, profile);
}));

module.exports = passport;
