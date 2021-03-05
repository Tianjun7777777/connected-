const express = require('express');
const app = express();
const bodyParser = require("body-parser");
var messages=[];
var dataToSend;
var realTimeData;

//parse the request format from query string to json, so we can get data from request.body, if not, we might read that from request.query and parse them to data by coding ourselves
//query string format: https://www.google.com/imgres?imgurl=http://images.mxpnl.com/blog/2014-10-17%252000:30:48.190268-jnurl1.png&imgrefurl=https://mixpanel.com/blog/community-tip-adding-properties-into-the-url/&tbnid=oPB_c1FnTMvDLM&vet=1&docid=79b9CEdtjjLagM&w=728&h=222&hl=en-us&source=sh/x/im
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//server the file in "public" when server IP address is visited from browser
app.use(express.static('public'));

//get handler for html
app.get("/",function(request,response){
  //FIXME: how to set content type to json from a data.json file
  // const rawdata=fs.readFileSync(logFileName);
  // let dataToSend=JSON.parse(rawdata);
  // response.sendData(dataToSend);
  // console.log("Sent data:"+logFileName);

  ////send message array-1

    response.send("connected!");

  
  ////send parsed data
  // dataToSend=JSON.parse(messages);
  // response.send(dataToSend);
  // console.log("res="+dataToSend);
  
});

//post handler for arduino client
app.post("/", function (request, response) {
  let data = request.body; 
  // add a timestamp
  let dt = new Date();
  data.timestamp = dt.getTime();
  // add the remote address
  let remoteAddress = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  data.remoteAddress = remoteAddress;
  //push date to array
  messages.push(data);
  realTimeData=data;
  console.log("post="+data);
  response.send(data);
  //http req-res circle end
});

//// cannot delete const if you want console.log listener.address().port
// const listener = app.listen(process.env.PORT || '3000', function() {
//   console.log('Server is listening on port ' + listener.address().port);
// });

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Server is listening on port:'+port);
});
