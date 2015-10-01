var config = require("./app.js"),
    passport = require("./passport.js"),
    parseurl = require("parseurl"),
    utility = require("./utility.js"),
    sess = require("cookie-session"),
    csurf = require("csurf"),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    sharedsession = require("express-socket.io-session"),
    moment = require("moment"),
    sassMiddleware = require("node-sass-middleware"),
    path = require("path"),
    socket = require("socket.io"),
    util = require("util"),
    fs = require("fs"),
    express = require("express"),
    app = express(),
    scheduler = require("./scheduler.js");

var scssOptions = {
    /* Options */
    src: __dirname + "/scss",
    dest: __dirname + "/public/css",
    debug: true,
    outputStyle: "compressed",
    prefix: "/css/" // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
};

app.use(sassMiddleware(scssOptions));

app.use("/", express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.locals.moment = moment;

var sessOptions = {
    maxAge: 52 * 7 * 24 * 60 * 60 * 1000, // how long the cookies will last
    secret: config.secret, // cookie secret
    keys: ["kek", "lul"],
    resave: false,
    saveUninitialized: false
};

app.use(cookieParser());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(sess(sessOptions));

app.use(passport.initialize());

app.use(passport.session());

// Auth logic
app.use("/", require("./routes/auth.js"));

// Chat page
app.use("/", require("./routes/chat.js"));

// Home page
app.use("/", require("./routes/chat.js"));

// init Poet
var Poet = require("poet");
var poet = new Poet(app, {
    posts: "./_posts",
    postsPerPage: 5,
    metaFormat: "json",
    routes: {
        "/blog/:post": "post",
        "/blog/:page": "page",
        "/blog/:tag": "tag",
        "/blog/:category": "category"
    }
});
poet.watch(function() {
    // watcher reloaded
}).init().then(function() {
    // Ready to go!
});

// robots.txt request
app.get("/robots.txt", function(req, res) {
    res.type("ext/plain");
    res.send("User-agent: *\nDisallow: /players");
});

var port = config.web_settings.port;
util.log(port);

// express server
var server = app.listen(port, function() {
    console.log("[WEB] listening on %s", port);
});

app.set("server", server);

// Socket.io server for the chat stuff

var io = socket();

io.use(sharedsession(sess(sessOptions), cookieParser()));
io.attach(server);

app.set("socketio", io);

module.exports = app;
