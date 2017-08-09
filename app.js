/*
  app.js
  Router for GET and POST requests
  Renders HTML pages and calls controller functions
  Also performs a DynamoDB scan to load the data and pass it as HTML variables (this should be refactored into its own controller)
*/

//load dependencies
let express = require('express');
let bodyParser = require('body-parser');

//load controller functions
let addPart = require('./controllers/addPart');
let deletePart = require('./controllers/deletePart');
let uploadParts = require('./controllers/uploadParts');
let createSchematic = require('./controllers/createSchematic');
let saveImage = require('./controllers/saveImage');
let deleteSchematic = require('./controllers/deleteSchematic');

//configure Express web framework
let app = express();
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('static'));

//configure Amazon Web Services
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
let dynamodb = new AWS.DynamoDB();
let s3 = new AWS.S3();

//variables that we will pass into HTML template
let parts = [];
let drawings = [];
let images = [];
let params;

//load items from Parts table on DynamoDB
let getParts = () => {
  console.log("Loading parts.");
  params = {TableName: "Parts"};
  dynamodb.scan(params, (err, data) => {
    if(err)
      console.error("Parts not loaded due to error:", JSON.stringify(err, null, 2));
    else{
      console.log(data.Count + " parts loaded.");
      parts = data.Items;
    }
  });
};

//load items from Drawings table on DynamoDB
let getDrawings = () => {
  console.log("Loading drawings.");
  params = {TableName: "Drawings"};
  dynamodb.scan(params, (err, data) => {
    if(err)
      console.error("Drawings not loaded due to error:", JSON.stringify(err, null, 2));
    else{
      console.log(data.Count + " drawings loaded.");
      drawings = data.Items;
    }
  });
};

//load items from escheme-images bucket on S3
//this is where images should be stored instead of directory static folder
//excel spreadsheets and CAD drawings can also be stored on S3 if necessary
/*
let getImages = () => {
  params = {Bucket: "escheme-images"};
  s3.listObjects(params, (err, data) => {
    if(err)
      console.error("Images not loaded due to error:", JSON.stringify(err, null, 2));
    else{
      console.log(data.Contents.length + " images loaded.");
      images = data.Contents;
    }
  });
};
*/

//called each time page is rendered
let getAll = () => {
  getParts();
  getDrawings();
  //getImages();
};

//HTML renders before DynamoDB scan is complete
//temporary solution is to perform a scan on server initialization so the application has data
getAll();

//GET request to render index.html
app.get('/', (req, res) => {
  getAll();
  res.render('index', {
    parts: parts,
    drawings: drawings,
    images: images
  });
});

//POST request to call uploadParts controller
app.post('/uploadParts', (req, res) => {
  console.log("Uploading parts.");
  uploadParts(req.body);
  getAll();
});

//POST request to call addPart controller
app.post('/addPart', (req, res) => {
  console.log("Adding/editing part.");
  addPart(req.body);
  getAll();
});

//POST request to call deletePart controller
app.post('/deletePart', (req, res) => {
  console.log("Deleting part.");
  deletePart(req.body);
  getAll();
});

//POST request to call createSchematic controller
app.post('/createSchematic', (req, res) => {
  console.log("Creating schematic.");
  createSchematic(req.body);
  //saveImage(req.body);
  getAll();
});

//POST request to call deleteSchematic controller
app.post('/deleteSchematic', (req, res) => {
  console.log("Deleting schematic.");
  deleteSchematic(req.body);
  getAll();
});

//run application locally
let port = process.env.PORT || 3000;
let server = app.listen(port, () => {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});
