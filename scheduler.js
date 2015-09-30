var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    childProcess = require("child_process"),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    config = require("./app.js"),
    utility = require("./utility.js"),
    botname = config.botname,
    logOnDetails = config.logOnDetails,
    commands = config.commands,
    commands_dota = config.commands_dota,
    commandChar = config.commandChar,
    dota_bots = config.dota_bots,
    chatID = config.chatID,
    region = config.region,
    randomstring = require("randomstring");
    
var isReady = true; // just in case you want to check if steam is ready for some reason
var introMsg = false;
var lobbies = []; // manage all lobbies from the steam group, remove lobbies when the game is sent back as started
var matches = []; // add games when they are sent back by the bots, remove them when stats are checked
var bots = {}; // Add bots when they are spawned to this object using the botname as the identifier

// count how many bots we can have maximally
var maxBots = Object.keys(dota_bots).length;

// the handler that all IPC messages should be bound to
var messageHandler = function messageHandler(data) {
    var sentry = data.sentry;
    var match = data.match;

    if (data.match !== undefined) {
        matches.push(match);
        dotaBots[sentry].inuse = "false";
        bots[sentry].kill();
    } else {
        dotaBots[sentry].inuse = "false";
        bots[sentry].kill();
    }

    console.log(JSON.stringify(match));
};

var onSteamLogOn = function onSteamLogOn(logonResp) {
        if (logonResp.eresult == steam.EResult.OK) {
            initBots();
            steamFriends.setPersonaState(steam.EPersonaState.Online); // to display your bot"s status as "Online"
            steamFriends.setPersonaName(botname); // to change its nickname
            steamFriends.joinChat(chatID); // ID for the group chat
            util.log("Logged on.");
        }
    },
    onSteamSentry = function onSteamSentry(sentry) {
        util.log("Received sentry.");
        require("fs").writeFileSync("sentry", sentry);
    },
    onSteamServers = function onSteamServers(servers) {
        util.log("Received servers.");
        fs.writeFile("servers", JSON.stringify(servers));
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        util.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        util.log("Connection closed by server.");
    },
    onWebSessionID = function onWebSessionID(webSessionID) {
        util.log("Received web session id.");
        // steamTrade.sessionID = webSessionID;
        steamFriends.webLogOn(function onWebLogonSetTradeCookies(cookies) {
            util.log("Received cookies.");
            for (var i = 0; i < cookies.length; i++) {
                // steamTrade.setCookie(cookies[i]);
            }
        });
    },
    onChatEnter = function onChatEnter(id, response) {
        util.log("Entered chat with ID: " + id + " with response: " + response);
    },
    onChatMsg = function onChatMsg(chatID, message, type, sender) {
        util.log("Recieved message: " + message + " from: " + sender + " in chatroom: " + chatID);
        if (message.lastIndexOf(config.commandChar, 0) === 0) { // checks if string starts with ., which means command
            for (var command of Object.keys(commands)) {
                if (message.lastIndexOf(command, 0) === 0) { // compare the entire list of commands to the message
                    if (steamFriends.chatRooms[chatID][sender].permissions & commands[command]) { // kick permission is all you need to use commands
                        handles[command.substr(1)](message.split(command)[1], sender);
                    }
                }
            }
        }
        //util.log(bot.chatRooms);
    },
    onChatStateChange = function onChatStateChange(stateChange, doeeID, chatID, doerID) {
        util.log(doeeID + " has been " + stateChange + " by " + doerID + " in group: " + chatID);
    };

var handles = {};

handles.test = function(message, sender) {
    util.log("Test command. The rest of the message was: " + message);
    steamFriends.sendMessage(chatID, "Test command. The rest of the message was: " + message);
};

handles.host = function(message, sender) {
    // check if there is even a bot available to make a lobby
    var b = getNextBot();

    if (b !== "") {
        //util.log("Host command. The rest of the message was: " + message);
        var name = "MyLeague_" + randomstring.generate(3); // format should be " name region (garbage text)"
        var password = randomstring.generate(6);

        steamFriends.sendMessage(chatID, "Hosting Lobby with name: " + name);
        steamFriends.sendMessage(sender, name + " password is: " + password);

        lobbies[name] = {
            "password": password,
            "leaderId": sender,
            "members": [sender]
        };

        // This is where we actually do the logic for hosting the lobby
        // Dota2Bot(logOnDetails, sentryNum, botname, commands_dota, commandChar, region, name, lobby)

        var args = ["./Dota2Bot.js", b.logOnDetails, b.sentryNum, b.botname, commands_dota, commandChar, region, name, lobbies[name]];
        bots[b.sentryNum] = childProcess.spawn(process.execPath, args, {
            stdio: [null, null, null, "ipc"]
        });

        bots[b.sentryNum].on("message", messageHandler);

        b.inuse = true;
    } else {
        bot.sendMessage(sender, "All bots are currently occupied, please try again later.")
    }
};

var newGame = function newGame(name, password, mode, region, leader) {
    var b = getNextBot();

    if (b !== "") {
        //util.log("Host command. The rest of the message was: " + message);
        var name = name || "MyLeague_" + randomstring.generate(3); // format should be " name region (garbage text)"
        var password = password || randomstring.generate(6);

        //bot.sendMessage(chatID, "Hosting Lobby with name: " + name);
        //bot.sendMessage(sender, name + " password is: " + password);

        lobbies[name] = {
            "password": password,
            "leaderId": leader,
            "members": [leader]
        };

        // This is where we actually do the logic for hosting the lobby
        // Dota2Bot(logOnDetails, sentryNum, botname, commands_dota, commandChar, region, name, lobby)

        util.log("logOnDetails pre-spawn: " + JSON.stringify(b.logOnDetails));
        util.log("mode pre-spawm: " + JSON.stringify(mode));
        /*util.log("sentryNum " + b.sentryNum)
        util.log("botname " + b.botname)
        util.log("commands_dota " + commands_dota)
        util.log("commandChar " + commandChar)
        util.log("region " + region)
        util.log("name " + name)
        util.log("lobbies " + lobbies[name])*/

        var args = ["./Dota2Bot.js", JSON.stringify(b.logOnDetails), b.sentryNum, b.botname, mode, JSON.stringify(commands_dota), commandChar, region, name, JSON.stringify(lobbies[name])];
        bots[b.sentryNum] = childProcess.spawn(process.execPath, args, {
            stdio: [process.stdin, process.stdout, process.stderr, "ipc"]
        });

        bots[b.sentryNum].on("message", messageHandler);

        b.inuse = true;

        return true;
    } else {
        util.log("All bots are currently occupied, please try again later.")
        return -1;
    }

}

handles.join = function(message, sender) {
    for (var lobby of lobbies) {
        if (message.split(" ")[0] === lobby) {
            for (var member of lobby["members"]) {
                if (member !== sender) {
                    lobby["members"].push(sender);
                    steamFriends.sendMessage(sender, "Password for " + lobby + " is " + lobby["password"]);
                }
            }
        } else {
            steamFriends.sendMessage(sender, "Lobby not found.");
        }
    }
};

// init steam instances for bots
// Dota2Bot(logOnDetails, sentryNum, botname, commands_dota, commandChar, region)
var dotaBots = {};
var initBots = function initBots() {
    for (var i = 0; i < maxBots; i++) {
        dotaBots[i] = {
            inuse: "false",
            logOnDetails: dota_bots["" + i + ""],
            botname: "IHB_" + i,
            sentryNum: i
        };
    }
};

var getNextBot = function getNextBot() {
    var b;
    for (var i = 0; i < maxBots; i++) {
        if (dotaBots[i]["inuse"] === "false") {
            b = dotaBots[i];
        } else {
            b = "";
        }
    }
    return b;
};

process.on("exit", function(code) {
    console.log("\n");
    util.log("Exiting gracefully.");
});

steamClient.connect();
steamClient.on("connected", function() {
    steamUser.logOn(logOnDetails);
});

steamUser.on('updateMachineAuth', function(sentry, callback) {
    fs.writeFileSync('sentry', sentry.bytes)
    util.log("sentryfile saved");
    callback({
        sha_file: crypto.createHash('sha1').update(sentry.bytes).digest()
    });
});

steamClient.on('logOnResponse', onSteamLogOn)
    .on('loggedOff', onSteamLogOff)
    .on('error', onSteamError)
    .on('servers', onSteamServers);

steamFriends.on("webSessionID", onWebSessionID)
    .on('chatEnter', onChatEnter)
    .on('chatMsg', onChatMsg)
    .on('chatStateChange', onChatStateChange);

module.exports.newGame = newGame;
