/*
 *
 * This uses code from a template for multiplayer three.js scenes with integrated WebRTC capabilities by Aidan Nelson
 * https://github.com/AidanNelson/threejs-webrtc
 * And a THREE.js Multiplayer boilerplate made by Or Fleisher:
 * https://github.com/juniorxsound/THREE.Multiplayer
 * And a WEBRTC chat app made by Mikołaj Wargowski:
 * https://github.com/Miczeq22/simple-chat-app
 * And a three.js sky and water example 
 * https://threejs.org/examples/?q=water#webgl_shaders_ocean
 *
 */

//express and data handler
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var messages = [];
var dataToSend;
var realTimeData;

var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const http = https.createServer(options, app);

const port = process.env.PORT || 8080;

//Server
const server = http.listen(port);
console.log("Server is running on http://localhost:" + port);

//get route
app.get("/data", function (req, res) {
  res.send(realTimeData);
  console.log("res=" + realTimeData);
});

//post route
app.post("/", function (req, res) {
  let data = req.body;

  let dt = new Date();
  data.timestamp = dt.getTime();

  let remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  data.remoteAddress = remoteAddress;

  messages.push(data);
  realTimeData = data;
  console.log("post=" + data.humidity);
  res.send(data);

  io.sockets.emit(
    "change", data
  );
});

/////Database////////
var usermessages = [];
var Datastore = require('nedb');
var db = new Datastore({ filename: "feizaiData.db", autoload: true });

db.find({}, function (err, docs) {
  for (let i = 0; i < docs.length; i++) {
    usermessages.push(docs[i].message);
  }
});


/////SOCKET.IO///////
const io = require("socket.io")().listen(server);

// Network Traversal
// Could also use network traversal service here (Twilio, for example):
let iceServers = [
  { url: "stun:stun.l.google.com:19302" },
  { url: "stun:stun1.l.google.com:19302" },
  { url: "stun:stun2.l.google.com:19302" },
  { url: "stun:stun3.l.google.com:19302" },
  { url: "stun:stun4.l.google.com:19302" },
];

// an object where we will store innformation about active clients
let clients = {};

function main() {
  setupSocketServer();

  setInterval(function () {
    // update all clients of positions
    io.sockets.emit("userPositions", clients);
  }, 100);
}

main();

function setupSocketServer() {

  // Set up each socket connection
  io.on("connection", (client) => {
    // Get Date
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    let datalog =
      "User " +
      client.id +
      " connected, there are " +
      io.engine.clientsCount +
      " clients connected" + " at " + date;

    // let myState = clients[client.id];

    // console.log(datalog);

    db.insert({ "message": datalog }, function (err, newDocs) {
      console.log("err:" + err);
      console.log("datalog:" + newDocs);
    });

    // db.insert({ "state": myState }, function (err, newDocs) {
    //   console.log("err:" + err);
    //   console.log("mystate:" + newDocs);
    // });

    //Add a new client indexed by their socket id
    clients[client.id] = {
      position: [0, 0.5, 0],
      rotation: [0, 0, 0, 1], // stored as XYZW values of Quaternion
    };

    //send the client their ID and a list of ICE servers for WebRTC network traversal
    client.emit(
      "introduction",
      client.id,
      io.engine.clientsCount,
      Object.keys(clients),
      iceServers
    );

    // give the client all existing clients positions:
    client.emit("userPositions", clients);

    //Update everyone that the number of users has changed
    io.sockets.emit(
      "newUserConnected",
      io.engine.clientsCount,
      client.id,
      Object.keys(clients)
    );

    // whenever the client moves, update their movements in the clients object
    client.on("move", (data) => {
      if (clients[client.id]) {
        clients[client.id].position = data[0];
        clients[client.id].rotation = data[1];
      }
    });

    //Handle the disconnection
    client.on("disconnect", () => {
      //Delete this client from the object
      delete clients[client.id];
      //Tell everyone
      io.sockets.emit(
        "userDisconnected",
        io.engine.clientsCount,
        client.id,
        Object.keys(clients)
      );

      let today = new Date();
      let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  
      let datalog =
        "User " +
        client.id +
        " disconnected, there are " +
        io.engine.clientsCount +
        " clients connected" + " at " + date;

      let myState = clients[client.id];

      console.log(datalog);

      db.insert({ "message": datalog }, function (err, newDocs) {
        console.log("err:" + err);
        console.log("Disconnect:" + newDocs);
      });
    });

    // from simple chat app:
    // WEBRTC Communications
    client.on("call-user", (data) => {
      console.log(
        "Server forwarding call from " + client.id + " to " + data.to
      );
      client.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: client.id,
      });
    });

    client.on("make-answer", (data) => {
      client.to(data.to).emit("answer-made", {
        socket: client.id,
        answer: data.answer,
      });
    });

    // ICE Setup
    client.on("addIceCandidate", (data) => {
      client.to(data.to).emit("iceCandidateFound", {
        socket: client.id,
        candidate: data.candidate,
      });
    });

    //position related interations
    client.on("send text", (data) => {
      io.sockets.emit("text", data);
      console.log("broadcast text:" + data);
    });


    client.on("send mark", (data) => {
      io.sockets.emit("mark", data);
      console.log("broadcast mark:" + data);
    });

    client.on("send trace", (data) => {
      io.sockets.emit("trace", data);
      console.log("broadcast trace:" + data);
    });

    client.on("addCollideMark", (position) => {
      io.sockets.emit("collideMark", position);
    });

  });
}

