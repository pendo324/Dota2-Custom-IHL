var express = require("express");
var app = express.Router();
var passport = require("../passport.js");

app.route("/login").get(passport.authenticate("steam", {
    failureRedirect: "/"
}));

app.route("/return").get(passport.authenticate("steam", {
    failureRedirect: "/"
}), function(req, res) {
	console.log(req.session);
    res.redirect("/chat");
});

app.route("/logout").get(function(req, res) {
    req.logout();
    req.session = null;
    res.redirect("/");
});

module.exports = app;