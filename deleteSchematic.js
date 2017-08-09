/*
  deleteSchematic.js
  Deletes an item from the Drawings table in DynamoDB
*/

//configure AWS
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
let dynamodb = new AWS.DynamoDB();

let deleteSchematic = (schematic) => {
  let params = {
    TableName: "Drawings",
    Key: {
      id: {S: schematic.id} //partition key is the only property needed
    }
  };
  dynamodb.deleteItem(params, (err, data) => {
    if(err){
      console.error(schematic.name, "not deleted due to error:", JSON.stringify(err, null, 2));
    }else{
      console.log(schematic.name, "deleted.");
    }
  });
};

module.exports = deleteSchematic;
