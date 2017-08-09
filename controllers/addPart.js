/*
  addPart.js
  Adds a new item to the Parts table on DynamoDB
  If the table has an existing part with the same findNumber, the new part will override that part
*/

//configure AWS
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
let dynamodb = new AWS.DynamoDB();

let addPart = (part) => {
  console.log(part);
  let newPart = {}; //initialize newPart object before adding properties
  let newKey;
  for(let key in part){
    //check to make sure spreadsheet cell isn't empty
    if(key){
      //convert any variation of "type" in spreadsheet to match HTML variable
      if(key == "Type"){
        newKey = "type";
      //convert any variation of "findNumber" in spreadsheet to match HTML variable
      }else if(key.toLowerCase().includes("find") && key.toLowerCase().includes("number")){
        newKey = "findNumber";
      }else{
        newKey = key;
      }
    }
    newPart[newKey] = {}; //initialize newPart.newKey object before adding properties
    newPart[newKey]["S"] = part[key] ? part[key].toString() : "N/A"; //DynamoDB only accepts strings as attribute values
  };
  let params = {
    TableName: "Parts",
    Item: newPart
  };
  dynamodb.putItem(params, (err, data) => {
     if(err){
       console.error(newPart.type.S, newPart.findNumber.S, "not added/edited due to error:", JSON.stringify(err, null, 2));
     }else{
       console.log(newPart.type.S, newPart.findNumber.S, "added/edited.");
     }
  });
};

module.exports = addPart;
