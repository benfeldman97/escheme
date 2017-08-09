/*
  uploadParts.js
  Converts an Excel spreadsheet to JSON
  Calls addPart controller for each returned object
*/

//load controller
let addPart = require('./addPart'); //relative filepath may need to be changed when running locally vs. deploying on Amazon Elastic Beanstalk
//load dependency
let convertExcel = require('excel-as-json').processFile;

//configure AWS
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
let dynamodb = new AWS.DynamoDB();

let uploadParts = (parts) => {
  let partsFile = './static/excel/' + parts.partsFile; //assumes spreadsheet is in this folder
  //convertExcel(source, destination, options, callback)
  convertExcel(partsFile, null, null, (err, data) => {
    if(err){
      console.log("Parts not uploaded due to error:", JSON.stringify(err, null, 2));
    }else{
      data.map(part => addPart(part)); //add each part individually
    }
  });
};

module.exports = uploadParts;
