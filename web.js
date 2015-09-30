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

app.use("/", require("./routes/auth.js"));

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

app.route("/").get(function(req, res, next) {
    if (req.session.passport.user) {
        res.sendFile(path.join(__dirname + "/html/chat.html"));
    } else {
        res.sendFile(path.join(__dirname + "/html/index.html"));
    }
});

module.exports = app;

var port = config.web_settings.port;
util.log(port);

// express server
var server = app.listen(port, function() {
    console.log("[WEB] listening on %s", port);
});


// Socket.io server for the chat stuff

var io = socket();

io.use(sharedsession(sess(sessOptions), cookieParser()));

app.io = io;

io.attach(server);

var users = [];
var messageHistory = ["[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: Yo yo yo yo", "[00:00:00 AM] DankMemer420: Welcome to dis chat", "[00:00:00 AM] DankMemer420: Looks like no one's talked here in a long time", "[00:00:00 AM] DankMemer420: Maybe you can help with that?"];
var games = [];

io.on("connection", function(socket) {

    var pName = socket.handshake.session.passport.user.displayName;

    if (!users.includes(pName)) {
        users.push(pName);
    }

    console.log(users.sort());

    io.emit("first connect", messageHistory);
    io.emit("game", games);

    io.emit("chat message", {
        moment: "[" + moment().format("hh:mm:ss A") + "] ",
        sender: "",
        message: pName + " connected."
    });


    io.emit("users", users.sort());

    socket.on("disconnect", function() {
        var user = socket.handshake.session.passport.user.displayName;
        io.emit("chat message", {
            moment: "[" + moment().format("hh:mm:ss A") + "] ",
            sender: user,
            message: " disconnected"
        });
        users = users.filter(function(el) {
            return el !== socket.handshake.session.passport.user.displayName;
        });

        io.emit("users", users.sort());

        io.emit("game", games);

        console.log(users);
    });

    socket.on("chat message", function(msg) {
        if (messageHistory.length < 11) {
            messageHistory.push("[" + moment().format("hh:mm:ss A") + "] " + socket.handshake.session.passport.user.displayName + ": " + msg);
        } else {
            messageHistory.shift();
            messageHistory.push("[" + moment().format("hh:mm:ss A") + "] " + socket.handshake.session.passport.user.displayName + ": " + msg);
        }

        console.log(messageHistory);

        io.emit("chat message", {
            moment: "[" + moment().format("hh:mm:ss A") + "] ",
            sender: socket.handshake.session.passport.user.displayName,
            message: msg
        });
    });

    socket.on("add game", function(msg) {
        var name = msg.name;
        var password = msg.password;
        var mode = msg.mode;
        var region = msg.region;
        var leader = {
            id: socket.handshake.session.passport.user.id,
            name: socket.handshake.session.passport.user.displayName,
            sessionID: socket.id
        };

        msg["members"] = new Array();
        msg["spectators"] = new Array();

        msg["leader"] = leader;

        var err = false;

        for (var i in games) {
            if (games[i]["name"] === name) {
                io.emit("game", " ");
                err = true;
            }
        }

        //scheduler.newGame(name, password, mode, region, leader);

        if (!err) {
            msg["members"].push(leader);
            games.push(msg);
            io.emit("game", games);
            socket.emit("game added", {
                success: true,
                name: name,
                mode: mode
            });
        }

    });

    socket.on("join game", function(msg) {
        var name = msg.name;
        var mode = msg.mode;
        var user = {
            name: socket.handshake.session.passport.user.displayName,
            id: socket.handshake.session.passport.user.id
        };

        var err = true;

        if (mode === "Captain's Mode") {
            for (var i in games) {
                if (games[i]["name"] === name) {
                    if (games[i]["leader"]["id"] === socket.handshake.session.passport.user.id) {
                        user["isLeader"] = true;
                    }
                    games[i]["members"].push(user);
                    socket.join("'" + name + "'");
                    err = false;
                }
            }
        }

        if (!err) {
            socket.emit("join request", {
                success: true,
                name: name,
                mode: mode
            });
        } else {
            socket.emit("join request", {
                success: false,
                name: name,
                mode: mode
            });
        }
    });

    socket.on("lobby details", function(msg) {
        var name = msg.name;
        var members;
        var leader;
        var radiant;
        var dire;
        var game;

        var sessionID;

        for (var i in games) {
            util.log(games[i]["name"] + " === " + name);
            if (games[i]["name"] === name) {
                members = games[i]["members"];
                leader = games[i]["leader"];
                radiant = games[i]["radiant"] || null;
                dire = games[i]["dire"] || null;

                sessionID = games[i]["leader"]["sessionID"];
            }
        }


        io.to(socket.room).emit("lobby update", {
            success: true,
            isLeader: false,
            members: members,
            leader: leader,
            radiant: radiant,
            dire: dire
        });

        io.sockets.connected[sessionID].emit("lobby update", {
            success: true,
            isLeader: true,
            members: members,
            leader: leader,
            radiant: radiant,
            dire: dire
        });
    });


});
