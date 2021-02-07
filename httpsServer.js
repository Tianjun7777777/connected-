var https = require('https');
var fs = require('fs'); // Using the filesystem module

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

var httpServer = https.createServer(options, requestHandler);
httpServer.listen(8080);

var url = require('url');
console.log('Server listening on port 8080');

function requestHandler(req, res) {

  var parsedUrl = url.parse(req.url);
  console.log("The Request is: " + parsedUrl.pathname);

  // Read in the file they requested
  fs.readFile(__dirname + parsedUrl.pathname,
    // Callback function, called when reading is complete
    function(err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + parsedUrl.pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200);
      res.end(data);
    }
  );
}