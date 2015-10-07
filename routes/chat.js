var express = require("express"),
    app = express.Router(),
    path = require("path"),
    moment = require("moment"),
    passport = require("../passport.js");

app.route("/chat").get(function(req, res) {
    try {
        if (req.session.passport.user) {
            res.sendFile(path.join(__dirname + "/../html/chat.html"));
            var server = req.app.get("server");
            var io = req.app.get("socketio");

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
        } else {
            res.sendFile(path.join(__dirname + "/../html/index.html"));
        }
    } catch (e) {
        res.sendFile(path.join(__dirname + "/../html/index.html"));
    }


});
module.exports = app;
