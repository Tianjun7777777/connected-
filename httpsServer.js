var https = require('https');
var fs = require('fs'); 

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var nedbstore = require('nedb-session-store')(session);
var Datastore = require('nedb');
var db = new Datastore({ filename: 'users.db', autoload: true });

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var bcrypt = require('bcrypt-nodejs');

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

var url = require('url');
console.log('Server listening on port 8080');

var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedBodyParser);
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static("public"));

// app.get('/',function(req,res){

//   var parsedUrl = url.parse(req.url);
//   console.log("The Request is: " + parsedUrl.pathname);

//   // Read in the file they requested
//   fs.readFile(__dirname + parsedUrl.pathname,
//     // Callback function, called when reading is complete
//     function(err, data) {
//       // if there is an error
//       if (err) {
//         res.writeHead(500);
//         return res.end('Error loading ' + parsedUrl.pathname);
//       }
//       // Otherwise, send the data, the contents of the file
//       res.writeHead(200);
//       res.end(data);
//     }
//   );

// });
app.get('/cookies', function (req, res) {
	// Log the cookies on the server side
	console.log(req.cookies);

	// Variable per request to keep track of visits
	var visits = 1;
	
	// If they have a "visits" cookie set, get the value and add 1 to it
	if (req.cookies.visits) {
		visits = Number(req.cookies.visits) + 1;
	}
	
	// Set the new or updated cookie
	res.cookie('visits', visits, {});
	
	// Send the info to the user
	res.send("You have visited this site " + visits + " times."+"the log of cookies is "+ JSON.stringify(req.cookies));
});

const { v1: uuidv1 } = require('uuid');

app.use(
	session(
		{
			secret: 'secret',
			cookie: {
				 maxAge: 365 * 24 * 60 * 60 * 1000   // e.g. 1 year
				},
			store: new nedbstore({
			 filename: 'sessions.db'
			})
		}
	)
);

app.get('/uuid', function(req, res) {
  if (!req.session.userid) {
  	req.session.userid = uuidv1();
  }
  
  res.send('session user-id: ' + req.session.userid + '. ');
});

app.post('/upload', upload.single('photo'), function (req, res) {
	console.log(req.file);
	res.send("uploaded: " + req.file);
	// req.file is the uploaded file information
  	// req.body will hold the other text fields
});

app.post('/register', function(req, res) {
	// We want to "hash" the password so that it isn't stored in clear text in the database
	var passwordHash = generateHash(req.body.password);

	// The information we want to store
	var registration = {
		"username": req.body.username,
		"password": passwordHash
	};

	// Insert into the database
	db.insert(registration);
	console.log("inserted " + registration);
	
	// Give the user an option of what to do next
	res.redirect('/login')
	
});	

app.post('/login', function(req, res) {

	// Check username and password in database
	db.findOne({"username": req.body.username},
		function(err, doc) {
			if (doc != null) {
				
				// Found user, check password				
				if (compareHash(req.body.password, doc.password)) {				
					// Set the session variable
					req.session.username = doc.username;

					// Put some other data in there
					req.session.lastlogin = Date.now();

					res.redirect('/main');
					
				} else {

					res.redirect('/register');

				}
			} 
		}
	);
});		

app.get('/main', function(req, res) {
	console.log(req.session.username);

	if (!req.session.username) {
		res.redirect('/login');
	} else {
		// Give them the main page
  		//res.send('session user-id: ' + req.session.userid + '. ');
		res.redirect('https://www.tiaanjun.com/');
	}
});

// app.get('/main',function(req,res){
//   var parsedUrl = url.parse(req.url);
//   console.log("The Request is: " + parsedUrl.pathname);

//   // Read in the file they requested
//   fs.readFile(__dirname + parsedUrl.pathname,
//     // Callback function, called when reading is complete
//     function(err, data) {
//       // if there is an error
//       if (err) {
//         res.writeHead(500);
//         return res.end('Error loading ' + parsedUrl.pathname);
//       }
//       // Otherwise, send the data, the contents of the file
//       res.writeHead(200);
//       res.end(data);
//     }
//   );

// });


var httpServer = https.createServer(options, app);
httpServer.listen(8080);

function generateHash(password) {
	return bcrypt.hashSync(password);
}

function compareHash(password, hash) {
    return bcrypt.compareSync(password, hash);
}	