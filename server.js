var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedBodyParser);

app.use(express.static("public"));

var datas = [];

const port = 3000;
const server = app.listen(port);
console.log("Server is running on port" + port);

const io = require("socket.io")().listen(server);

io.sockets.on('connection', function (socket) {
  console.log("We have a new client: " + socket.id);
});

app.get('/', function (req, res) {
  res.send('say something here!');
});

app.post('/inputdata', function (req, res) {

  var dataToSave = {
    text: req.body.data,
    color: req.body.color,
  };

  let dt = new Date();
  dataToSave.timestamp = dt.getTime();
  let remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  dataToSave.remoteAddress = remoteAddress;


  datas.push(dataToSave);

  //send with raw dom
  var output = `<h4>Submitted Data until+${dt}</h4>`;

  for (var i = 0; i < datas.length; i++) {
    // res.send('color:'+ datas[i].color+'text:'+ datas[i].text+'/n');
    output += "<div style='color: " + datas[i].color + "''white-space:pre'>" + datas[i].text;
    output +=`    from+${remoteAddress}+</div>`;
  }

  console.log("output:" + output);
  io.sockets.emit('update', output);

  //send json

  /////send html
  // var output = "<html><body>";
  // output += "<h1>Submitted Data</h1>";

  // for(var i=0;i<datas.length;i++){
  //   // res.send('color:'+ datas[i].color+'text:'+ datas[i].text+'/n');
  //   output += "<div style='color: " + datas[i].color + "'>" + datas[i].text + "</div>";
  //   }

  // output += "</body></html>";

  /////send without html
  // var output = "<h2>Submitted Data</h2>";

  // for(var i=0;i<datas.length;i++){
  //   // res.send('color:'+ datas[i].color+'text:'+ datas[i].text+'/n');
  //   output += "<div style='color: " + datas[i].color + "'>" + datas[i].text + "</div>";
  //   }

  // console.log(output);
  // res.send(output);

});

