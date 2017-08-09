/*
  saveImage.js
  Adds an object to the escheme-images bucket on S3
  **Not currently utilized**
*/

//configure AWS
let AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json'); //more configuration items or permissions may be needed
let s3 = new AWS.S3();

let saveImage = (schematic) => {
  let params = {
    Bucket: "escheme-images",
    Key: schematic.schematicName, //must be unique
    Body: schematic.imageFile
  };
  s3.upload(params, (err, data) => {
    if(err)
      console.error("Image for", schematic.schematicName, "not uploaded due to error:", JSON.stringify(err, null, 2));
    else
      console.log("Image for", schematic.schematicName, "uploaded.");
  });
};

module.exports = saveImage;
