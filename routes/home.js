var express = require("express"),
	path = require("path"),
	app = express.Router();

app.route("/").get(function(req, res) {
    res.sendFile(path.join(__dirname + "/../html/index.html"));
});

module.exports = app;
