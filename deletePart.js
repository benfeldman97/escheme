/*
  deletePart.js
  Deletes an item from the Parts table in DynamoDB
*/

//configure AWS
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
let dynamodb = new AWS.DynamoDB();

let deletePart = (part) => {
  let params = {
    TableName: "Parts",
    Key: {
      findNumber: {S: part.findNumber} //partition key is the only property needed
    }
  };
  dynamodb.deleteItem(params, (err, data) => {
    if(err){
      console.error(part.type, part.findNumber, "not deleted due to error:", JSON.stringify(err, null, 2));
    }else{
      console.log(part.type, part.findNumber, "deleted.");
    }
  });
};

module.exports = deletePart;
