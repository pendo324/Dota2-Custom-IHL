var concatArraysUniqueWithSort = function(thisArray, otherArray) {
    var newArray = thisArray.concat(otherArray).sort(function(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
    });
    return newArray.filter(function(item, index) {
        return newArray.indexOf(item) === index;
    });
};

var socket = io();

var inLobby = false;
var lobby = {
    id: 0,
    mode: "",
    name: ""
}

var addGame = function addGame() {
    // parse the modal options
    var gameName = $("#inputGameName").val();
    var password = $("#inputPassword").val();
    var gameMode = $("input[name=gameModePicker]:checked").val();
    var region = $("input[name=regionPicker]:checked").val();
    var ranked = $("input[name=ranked]:checked").val();

    // reset the modal when we're done
    $(".modal").on("hidden.bs.modal", function() {
        $(this).find("form")[0].reset();
    });

    // change region and game mode into something Dota understands

    if (region === "USEast") {
        region = 1;
    } else if (region === "USWest") {
        region = 2;
    }

    if (gameMode === "allPick") {
        gameMode = 1;
    } else if (gameMode === "captainsMode") {
        gameMode = 2;
    }

    socket.emit("add game", {
        name: gameName,
        password: password,
        mode: gameMode,
        region: region
    });
};

var joinGame = function joinGame() {
    var id = event.target.id;
    id = id.replace(/\⌘/g, " "); //add back the spaces
    id = id.replace(/\⌥/g, "'"); //add back the ''

    console.log(id);

    var mode = id.split(":")[0];
    var name = id.split(" ")[2];

    console.log(id);
    console.log("join game: ", name + " mode: " + mode);

    socket.emit("join game", {
        name: name,
        mode: mode
    });
};

var leaveGame = function leaveGame() {
    var id = event.target.id;

};

var specGame = function specGame() {
    var id = event.target.id;

};

$("form").submit(function() {
    socket.emit("chat message", $("#m").val());
    $("#m").val("");
    return false;
});

var firstConnect = true;

socket.on("first connect", function(history) {
    if (firstConnect) {
        firstConnect = false;
        $("#messages").append($("<li>").text("Last 10 messages: ").addClass("messageHistory"));
        $(history).each(function(index, value) {
            $("#messages").append($("<li class='list-group-item'>").text(value).css("color", "#806126"));
        });
        var elem = document.getElementById("messages");
        elem.scrollTop = elem.scrollHeight;

    }
});

socket.on("chat message", function(msg) {
    // unpack message
    var moment = msg.moment;
    var sender = msg.sender;
    var message = msg.message;

    var oldPos = document.getElementById("messages");
    var scroll = false;

    if ((oldPos.scrollTop + 300) === oldPos.scrollHeight) {
        scroll = true;
    }

    if ((sender === "") || (sender === undefined)) {
        $("#messages").append("<li class='list-group-item'>" + moment + message + "</li>");

    } else {
        $("#messages").append("<li class='list-group-item'>" + moment + sender + ": " + message + "</li>");
    }

    var elem = document.getElementById("messages");

    if (scroll) {
        elem.scrollTop = elem.scrollHeight;
    }
});

socket.on("users", function(users) {
    var _users = [];

    $("#users > li").each(function(index, value) {
        _users.push($(value).text());
    });

    console.log(_users);

    var combined = concatArraysUniqueWithSort(users, _users);

    $("#users").empty();

    $(combined).each(function(index, value) {
        $("#users").append($("<li class='list-group-item'>").text(value));
    });
});

socket.on("game added", function(msg) {
    var success = msg.success;
    var name = msg.name;
    var mode = msg.mode;

    if (mode === 1) {
        mode = "All Pick";
    } else if (mode === 2) {
        mode = "Captain's Mode";
    }

    if (success) {
        console.log("cf join game: " + name + " mode: " + mode);
        socket.emit("join game", {
            name: name,
            mode: mode
        });
    }
});

socket.on("game", function(games) {
    if (games === " ") {
        alert("Game with that name already exists, please enter another name.");
        return;
    }

    var _games = [];
    var g = [];

    $("#games > li").each(function(index, value) {
        _games.push($(value).text());
    });

    console.log("_games: " + _games);

    $(games).each(function(index, value) {
        var region = value.region;
        var gameMode = value.mode;
        var leader = value.leader.name;

        console.log(value);

        if (region === 1) {
            region = "USEast";
        } else if (region === 2) {
            region = "USWest";
        }

        if (gameMode === 1) {
            gameMode = "All Pick";
        } else if (gameMode === 2) {
            gameMode = "Captain's Mode";
        }

        g.push(gameMode + ": " + value.name + " Leader: " + leader);
    });

    //console.log("g: " + g);

    //var combined = concatArraysUniqueWithSort(g, _games);

    //console.log("combined " + combined);

    $("#games").empty();

    if (inLobby) {
        $(g).each(function(index, value) {
            var id = value.split(" Leader:")[0].replace(/\s+/g, "⌘").replace(/\'/g, "⌥");
            console.log(id + " === " + lobby.id);

            if (id === lobby.id) {
                $("li[id='" + lobby.id + "']").replaceWith("<li class='list-group-item' id='" + lobby.id + "'>" + lobby.mode + ": " + lobby.name + "<button name='Leave' style='margin-left: 20px' id='Join' type='button' onclick='leaveGame();' class='btn btn-danger'>Leave</button></li>");
            } else {
                $("#games").append("<li class='list-group-item' id='" + id + "'>" + value + "<button name='Join' style='margin-left: 20px' id='" + id + "' type='button' onclick='joinGame();' class='btn btn-success'>Join</button> <button name='Spectate' id='" + id + "' type='button' onclick='specGame();' class='btn btn-primary'>Spectate</button></li>");
            }
        });
    } else {
        $(g).each(function(index, value) {
            var id = value.split(" Leader:")[0].replace(/\s+/g, "⌘").replace(/\'/g, "⌥");

            $("#games").append("<li class='list-group-item' id='" + id + "'>" + value + "<button name='Join' style='margin-left: 20px' id='" + id + "' type='button' onclick='joinGame();' class='btn btn-success'>Join</button> <button name='Spectate' id='" + id + "' type='button' onclick='specGame();' class='btn btn-primary'>Spectate</button></li>");
        });
    }

});

socket.on("join request", function(msg) {
    var success = msg.success;
    var name = msg.name;
    var mode = msg.mode;

    if (mode === 1) {
        mode = "All Pick";
    } else if (mode === 2) {
        mode = "Captain's Mode";
    }

    var id = mode + ": " + name;

    // reconstruct the ID
    id = id.replace(/\s+/g, "⌘");
    id = id.replace(/\'/g, "⌥");

    if (success === true) {
        // set global lobby = id so we can easily select it when we update the game list
        lobby["id"] = id;
        lobby["name"] = name;
        lobby["mode"] = mode;

        inLobby = true;

        socket.emit("lobby details", {
            name: name
        });
        $("#currentLobby").removeClass("invisible");
        console.log("ID: " + id);
        $("li[id='" + id + "']").replaceWith("<li class='list-group-item' id='" + id + "'>" + mode + ": " + name + "<button name='Leave' style='margin-left: 20px' id='Leave' type='button' onclick='leaveGame();' class='btn btn-danger'>Leave</button></li>")
    } else {
        alert("Failed to locate lobby " + name + ". It may have been closed already.")
    }
});

socket.on("lobby update", function(msg) {
    var success = msg.success;
    var members = msg.members;
    var leader = msg.leader;
    var radiant = msg.radiant;
    var dire = msg.dire;

    console.log(success);

    var id;

    if (success) {
        $("#playersList").empty();
        $(members).each(function(index, value) {
            id = value.id;
            if (msg.isLeader) {
                $("#playersList").append("<li class='list-group-item'>" + value.name + "<button style='margin-left: 20px' id='" + id + "' type='button' onclick='kickPlayer();' class='btn btn-danger'>Kick</button></li>");
            } else {
                $("#playersList").append("<li class='list-group-item'>" + value.name + "</li>");
            }
        });
        $("#radiantList").empty();
        $(radiant).each(function(index, value) {
            id = value.id;
            if (msg.isLeader) {
                $("#radiantList").append("<li class='list-group-item'>" + value.name + "<button style='margin-left: 20px' id='" + id + "' type='button' onclick='kickPlayer();' class='btn btn-danger'>Kick</button></li>");
            } else {
                $("#radiantList").append("<li class='list-group-item'>" + value.name + "</li>");
            }
        });
        $("#direList").empty();
        $(dire).each(function(index, value) {
            id = value.id;
            if (msg.isLeader) {
                $("#direList").append("<li class='list-group-item'>" + value.name + "<button style='margin-left: 20px' id='" + id + "' type='button' onclick='kickPlayer();' class='btn btn-danger'>Kick</button></li>");
            } else {
                $("#direList").append("<li class='list-group-item'>" + value.name + "</li>");
            }
        });
    }
});
