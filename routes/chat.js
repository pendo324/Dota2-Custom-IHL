var express = require("express"),
    app = express.Router(),
    path = require("path"),
    moment = require("moment"),
    util = require("util"),
    passport = require("../passport.js");

app.route("/chat").get(function(req, res) {
    try {
        if (req.session.passport.user) {
            res.sendFile(path.join(__dirname + "/../html/chat.html"));
            var server = req.app.get("server");
            var io = req.app.get("socketio");

            var users = [];
            // Fake message history
            var messageHistory = ["[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: ", "[00:00:00 AM] DankMemer420: Yo yo yo yo", "[00:00:00 AM] DankMemer420: Welcome to dis chat", "[00:00:00 AM] DankMemer420: Looks like no one's talked here in a long time", "[00:00:00 AM] DankMemer420: Maybe you can help with that?"];
            var games = [];

            io.on("connection", function(socket) {
                // Some quality of life variables to reduce typing later and increase clarity, hopefully
                var displayName = socket.handshake.session.passport.user.displayName;
                var userId = socket.handshake.session.passport.user.id;

                // Add the user to the users array if they are not already in it
                if (!users.includes(displayName)) {
                    users.push(displayName);
                }

                console.log(users.sort());

                /* Event fired upon first connection.
                   Send message history
                */
                io.emit("first connect", messageHistory);
                io.emit("game", games);

                /* Sends a message to the clients when someone connects for the first time
                   so that it can be displayed in the chat
                */
                io.emit("chat message", {
                    moment: "[" + moment().format("hh:mm:ss A") + "] ",
                    sender: "",
                    message: displayName + " connected."
                });


                io.emit("users", users.sort());

                /* Event fired when a socket is disconnected.
                   Sends a message to the other clients so that we can display in chat
                   that the user hasd disconnected. 
                   Also removes the user from the users array and sends an update of
                   current games.
                */
                socket.on("disconnect", function() {
                    var user = displayName;
                    io.emit("chat message", {
                        moment: "[" + moment().format("hh:mm:ss A") + "] ",
                        sender: user,
                        message: " disconnected"
                    });
                    users = users.filter(function(el) {
                        return el !== displayName;
                    });

                    io.emit("users", users.sort());

                    io.emit("game", games);

                    console.log(users);
                });

                /* This is the actual chat part of the server. The server saves the message
                   history, so that anyone that joins will be able to see the last few
                   messages and not be totally out of the loop. This section also formats all
                   messages with a date and sender. The dates are synced to the server, so no
                   messages should come out of order (hopefully)
                */
                socket.on("chat message", function(msg) {
                    if (messageHistory.length < 11) {
                        messageHistory.push("[" + moment().format("hh:mm:ss A") + "] " + displayName + ": " + msg);
                    } else {
                        messageHistory.shift();
                        messageHistory.push("[" + moment().format("hh:mm:ss A") + "] " + displayName + ": " + msg);
                    }

                    console.log(messageHistory);

                    io.emit("chat message", {
                        moment: "[" + moment().format("hh:mm:ss A") + "] ",
                        sender: displayName,
                        message: msg
                    });
                });
                /* What adding a game actually means:
                   1. Getting the name and id of the user that is requesting to add the game.
                      This user now becomes designated as the leader of the game
                   2. A new game must be assembled in the games array. It contains:
                         * The mode
                         * The region
                         * The leader
                         * The name
                         * The password
                         * The spectators (empty upon creation)
                         * The members/players (has only the leader on creation)
                   3. If there's a problem, the client will be made aware and handle it
                      accordingly
                */
                socket.on("add game", function(msg) {
                    var name = msg.name;
                    var password = msg.password;
                    var mode = msg.mode;
                    var region = msg.region;
                    var leader = {
                        id: userId,
                        name: displayName,
                        //sessionID: socket.id
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
                
                /* What joining a game actually means:
                   1. You get put on a server side list of people that are in the game
                   2. Everyone that goes on that list can be a player, spectator, or
                      the person who created ('initiated' is the better term) the game
                   3. The client gets a response back depending on if the request to 
                      join was successful or not. If there's an issue, the client handles
                      it
                */
                socket.on("join game", function(msg) {
                    var name = msg.name;
                    var mode = msg.mode;
                    var user = {
                        name: displayName,
                        id: userId
                    };

                    var err = true;

                    if (mode === "Captain's Mode") {
                        for (var i in games) {
                            if (games[i]["name"] === name) {
                                if (games[i]["leader"]["id"] === userId) {

                                    /* Add an extra property to user if they are the one that
                                       created (initiated) the game. The bots do all of the
                                       'creating'
                                    */
                                    user["isLeader"] = true;
                                }

                                /* Store all of the members of a game server-side. This lets
                                   use do things like automatic kicking if you are not supposed
                                   to be in the game. We will have to do the same thing for
                                   in-game spectators
                                */
                                games[i]["members"].push(user);

                                /* When you join a game you get put in a 'room' (socketio term)
                                   This allows for an easy way to send a message to only people
                                   the game
                                */
                                socket.join("'" + name + "'");
                                err = false;
                            }
                        }
                    }

                    /* Let the client know if something went wrong. It should handle the error
                       accordingly
                    */
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

                    var isLeader = false;
                    //var sessionID;

                    for (var i in games) {
                        util.log(games[i]["name"] + " === " + name);
                        if (games[i]["name"] === name) {
                            members = games[i]["members"];
                            leader = games[i]["leader"];
                            radiant = games[i]["radiant"] || null;
                            dire = games[i]["dire"] || null;
                            /* Let the client know if its the leader so it can
                               display the lobby controls (kick, close, etc...)
                            */
                            if (userId === leader["id"]) {
                                isLeader = true;
                            }
                            // Deprecated for reasons below
                            //sessionID = games[i]["leader"]["sessionID"];
                        }
                    }

                    /* When a socket is in a room, the room is stored in socket.room
                       and we use 'io.to' to send messages only to that room (socket can
                       only have one room at a time)
                    */
                    io.to(socket.room).emit("lobby update", {
                        success: true,
                        isLeader: isLeader,
                        members: members,
                        leader: leader,
                        radiant: radiant,
                        dire: dire
                    });

                    /* An idea I had of sending to unique lobbies before I realized
                       that rooms were a thing. Deprecated and also not working (I think)

                    io.sockets.connected[sessionID].emit("lobby update", {
                        success: true,
                        isLeader: true,
                        members: members,
                        leader: leader,
                        radiant: radiant,
                        dire: dire
                    });

                    */
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
