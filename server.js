var express = require('express');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var app = express();

var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedBodyParser);
app.use(bodyParser.json());

app.use(express.static("public"));

var datas = [];

var db = new Datastore({filename:"feizaiData.db", autoload:true});

//get existing data into array
db.find({},function(err,docs){
   for (let i=0;i<docs.length;i++){
    datas.push(docs[i].message);
    console.dir('Get data from db ===>');
    console.dir(docs[i].message);
   }
});

const port = 3000;
const server = app.listen(port);
console.log("Server is running on port " + port);

app.get('/data',function(req, res){
  res.send(datas);
});

app.post('/inputdata', function (req, res) {
console.log('body ====>')
  console.dir(req.body)

  const dt = new Date();
  const dataToSave = {
    text: req.body.data,
    color: req.body.color,
    timestamp: dt.getTime(),
    remoteAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  };
  datas.push(dataToSave);

  //insert new data
  db.insert({"message":dataToSave},function(err, newDocs){
    if(err){ console.log("err:", err); }

    console.log('saved newDocs to db done!');
    // console.log('Data ====>')
    // console.dir(newDocs);
  });

  //send with raw dom
  // var output = `<h4>Submitted Data until+${dt}</h4>`;

  // for (var i = 0; i < datas.length; i++) {
  //   // res.send('color:'+ datas[i].color+'text:'+ datas[i].text+'/n');
  //   output += "<div style='color: " + datas[i].color + "''white-space:pre'>" + datas[i].text;
  //   output +=`    from+${remoteAddress}+</div>`;
  // }

  res.send(200);
});