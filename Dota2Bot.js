var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    dota2 = require("dota2"),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    dota2 = require("dota2"),
    Dota2 = new dota2.Dota2Client(steamClient, true),
    randomstring = require("randomstring"),
    utility = require("./utility.js");
    
var dotaReady = false;
var steamReady = false;

// this is the object we are going to give back to scheduler
// if our match actually starts
var match = {};

var logOnDetails = JSON.parse(process.argv[2]),
    sentryNum = process.argv[3],
    botname = process.argv[4],
    mode = process.argv[5],
    commands_dota = JSON.parse(process.argv[6]),
    commandChar = process.argv[7],
    region = process.argv[8],
    name = process.argv[9],
    lobby = JSON.parse(process.argv[10]);

util.log("Mode-after: " + mode);

/*util.log("logOnDetails =" + logOnDetails);
util.log("sentryNum =" + sentryNum);
util.log("botname =" + botname);
util.log("commands_dota =" + commands_dota);
util.log("commandChar =" + commandChar);
util.log("region =" + region);
util.log("name =" + name);
util.log("lobby =" + lobby);*/

// constructor, just in case we need an instance
/*function Dota2Bot(logOnDetails, sentryNum, botname, commands_dota, commandChar, region) {
    this.logOnDetails = logOnDetails;
    this.botname = botname;
    this.commands_dota = commands_dota;
    this.commandChar = commandChar;
    this.region = region;
    this.sentryNum = sentryNum;
}

/*Dota2Bot.prototype.logOn = function logOn() {
    bot.logOn(logOnDetails);
}

Dota2Bot.prototype.hostGame = function hostGame() {
    
}

// Handles all IPC with the scheduler
/*process.on("message", function(data){
    if (data.msg === "done") {

    }
});*/

// Handles all of the steam communication
var onSteamLogOn = function onSteamLogOn(logonResp) {
        if (logonResp.eresult == steam.EResult.OK) {
            steamReady = true;
            steamFriends.setPersonaState(steam.EPersonaState.Online); // to display your bot"s status as "Online"
            steamFriends.setPersonaName(botname); // to change its nickname
            util.log("Logged on.");
            Dota2.launch();
            Dota2.on("ready", function() {
                dotaReady = true;
                Dota2.leavePracticeLobby(); // just incase we have a lingering lobby open from a network DC or something
                Dota2.leavePracticeLobby(); // just incase we have a lingering lobby open from a network DC or something
                Dota2.leavePracticeLobby(); // just incase we have a lingering lobby open from a network DC or something
                Dota2.leavePracticeLobby(); // just incase we have a lingering lobby open from a network DC or something

                console.log("Node-dota2 ready.");
                host(name, mode, region, lobby);
            });
            Dota2.on("unready", function onUnready() {
                dotaReady = false;
                console.log("Node-dota2 unready.");
            });
            Dota2.on("unhandled", function(kMsg) {
                util.log("UNHANDLED MESSAGE " + kMsg);
            });
        }
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        util.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        util.log("Connection closed by server.");
    };
// Dota 2 event handlers
var onPracticeLobbyUpdate = function onPracticeLobbyUpdate(practiceLobbyUpdate, lobby) {
        var lobbyId = utility.bigInt(lobby["lobbyId"]["high"], lobby["lobbyId"]["low"]);
        if (lobby["gameName"] !== undefined) {
            Dota2.joinChat("Lobby_" + lobbyId, 3); // 3 is a lobby
            //Dota2.sendMessage("Lobby_" + lobbyId, "Waiting for lobby to fill up with the proper members. Will await confirmation from leader when full.");
        }

        util.log(lobby);

        if (match["lobbyId"] !== undefined) {
            match["lobbyId"] = lobbyId;
        }

        // If the lobby has a matchId, it means the lobby has been launched, which means we need the bot to leave the lobby and send
        // the match Object to the scheduler. Before we do that, we have to make a note of what the Match ID is though, so we can 
        // see who won later on.
        if (lobby["matchId"] !== null) {
            if (match["matchId"] === undefined) {
                match["matchId"] = lobby["matchId"];

            }
        }

        util.log("Lobby " + lobby["gameName"] + " with ID " + lobbyId + " updated.");
    },
    onPracticeLobbyCreateResponse = function onPracticeLobbyCreateResponse(practiceLobbyCreateResponse, id) {
        //Dota2.joinChat(practiceLobbyCreateResponse.channelName, 3);
    },
    onChatMessage = function onChatMessage(channelName, personaName, text, chatData) {
        //util.log(JSON.stringify(chatData));
        util.log(personaName + "(" + chatData["accountId"] + ") in channel: " + utility.bigInt(chatData["channelId"]["high"], chatData["channelId"]["low"]) + " said: " + text);

        if (text.lastIndexOf(commandChar, 0) === 0) { // checks if string starts with ., which means command
            for (var command of Object.keys(commands_dota)) {
                if (text.lastIndexOf(command, 0) === 0) { // compare the entire list of commands to the message.
                    if (match["leaderId"] === utility.steam3To64(chatData["accountId"])) {
                        handles[command.substr(1)](text.split(command)[1], lobby["leaderId"]);
                    }
                }
            }
        }
    };

var host = function host(name, mode, region, lobby) {
    Dota2.leavePracticeLobby();
    Dota2.leavePracticeLobby();

    util.log("inside host func, lobby.password: " + lobby.password);

    util.log("name: " + name);
    util.log("mode: " + mode);
    util.log("region: " + region)
        /*Available regions
            UNSPECIFIED: 0,
            USWEST: 1,
            USEAST: 2,
            EUROPE: 3,
            KOREA: 4,
            SINGAPORE: 5,
            EUWEST: 6,
            AUSTRALIA: 7,
            STOCKHOLM: 8,
            AUSTRIA: 9,
            BRAZIL: 10,
            SOUTHAFRICA: 11,
            PERFECTWORLDTELECOM: 12,
            PERFECTWORLDUNICOM: 13,
            CHILE: 14,
            PERU: 15
        */

    /*var servers = {
        "USW": 1,
        "USE": 2,
        "EUE": 3,
        "EUW": 6,
        "RUS": 8,
        "PW": 12,
        "KR": 4,
        "SEA": 5,
        "AUS": 9,
        "PER": 15,
        "BRA": 10,
        "CHI": 14,
        "SA": 11
    };*/

    //var mode = 2;
    // This is where we actually do the logic for hosting the lobby
    Dota2.createPracticeLobby(name, lobby.password, parseInt(mode), parseInt(region), function(success, response) {
        if (success == 1) {
            util.log("Lobby successfully created.");
        } else { // find out why we are not getting a 1 response (no idea why this would happen)
            Dota2.practiceLobbyListRequest(function(isNull, response) {
                util.log(response["lobbies"]);
            });
        }
        //util.log(success + " " + response["lobby_details"]);
    });

    match = {
        "name": name,
        "password": lobby.password,
        "leaderId": lobby.leaderId,
        "members": [lobby.leaderId]
    };
};

var sendMatch = function sendMatch() {
    process.send({
        sentry: sentryNum,
        match: match
    });
}

// handlers for the in-game lobby chat commands
var handles = {};

handles.start = function start(message, sender) {
    Dota2.launchPracticeLobby(function() {});
    sendMatch();
};

handles.stop = function stop(message, sender) {

};

// When Ctrl+C is registered, run this before termination of the process
process.on("exit", function(code) {
    console.log("\n");
    util.log("Exiting gracefully.");
    Dota2.leavePracticeLobby();
});

steamClient.connect();
steamClient.on("connected", function() {
    steamUser.logOn(logOnDetails);
});

steamUser.on('updateMachineAuth', function(sentry, callback) {
    fs.writeFileSync('sentry_' + sentryNum, sentry.bytes)
    util.log("sentryfile saved");
    callback({
        sha_file: crypto.createHash('sha1').update(sentry.bytes).digest()
    });
});

// binding listeners
steamClient.on('logOnResponse', onSteamLogOn)
    .on('loggedOff', onSteamLogOff)
    .on('error', onSteamError)
    .on('servers', onSteamServers);

Dota2.on("practiceLobbyUpdate", onPracticeLobbyUpdate)
    .on("practiceLobbyCreateResponse", onPracticeLobbyCreateResponse)
    .on("chatMessage", onChatMessage);
