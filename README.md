# Welcome to the E-Scheme 1.0

### Table of Contents

- [Introduction](#introduction)
- [Configuring AWS](#configuring-aws)
- [Running the app locally](#running-the-app-locally)
- [How it works](#how-it-works)
- [Known issues](#known-issues)
- [Future improvements](#future-improvements)
- [Cost analysis](#cost-analysis)
- [Dependencies](#dependencies)
- [External scripts](#external-scripts)

### Introduction

The E-Scheme is a serverless single page web application where [Virginia Space](http://vaspace.org) engineers can easily view and manage interactive versions of the MARS Pad 0A FGSE Schematic.

All the files in this repository are written in JavaScript, HTML, and CSS... but you don't need to know how to code in order to manipulate the data on the page. The front-end viewer content is 100% dynamic and gets loaded through three familiar components: an Excel spreadsheet, a CAD drawing, and an image.

On the back-end, the application uses the [NodeJS](https://nodejs.org/en/) platform, [Express](https://expressjs.com/) framework, [Jquery](https://jquery.com/) library, and some [Bootstrap](http://getbootstrap.com/) styling to build a simple, scalable app that is deployed to [AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/) and then virtually hosted on an [Amazon EC2](aws.amazon.com/ec2/) instance. The application currently stores data on [Amazon DynamoDB](http://aws.amazon.com/dynamodb/) and has the [potential](#future-improvements) to hold static files on [Amazon S3](http://aws.amazon.com/s3) and handle different users on [Amazon Cognito](aws.amazon.com/cognito/).

### Configuring AWS

#### Getting your credentials

1.  If you don't already have an account, [sign up for AWS](https://aws.amazon.com/) under the **Free Tier**.
2.  Go to the [Identity Access Management Console](https://aws.amazon.com/iam/).
3.  Navigate to the **Users** tab and click **Add User**.
4.  Create a username and select both options under **access type**.
5.  Attach at the very least the following policies to the user:

- **AmazonEC2FullAccess**
- **AmazonDynamoDBFullAccess**
- **AWSElasticBeanstalkFullAccess**

6.  Review and submit.
7.  Make note of your **Access Key ID** and **Secret Access ID** and input these into the [config.json](config.json) file along with the AWS **region** in which you plan to deploy. *Your Secret Access ID will not be available again once you leave this page*.

#### Setting up the database

1.  Go to the [DynamoDB Console](https://aws.amazon.com/dynamodb).
2.  Navigate to the **Tables** tab and click **Create Table**.
3.  For **Table name**, enter *Parts*.
4.  For **Primary key**, enter *findNumber* and select **String** from the dropdown menu.
5.  Check the **Use default settings** box.
6.  Repeat the steps to create a second table, using *Drawings* as the **Table Name** and *id* as the **Primary Key**.

#### Deploying the app

1. When you're ready to deploy the application, right-click on the *escheme* directory folder on your computer and select **Send to...** > **Compressed (zipped) folder**.
2. Go to the [Elastic Beanstalk Console](http://aws.amazon.com/elasticbeanstalk/).
3. Select **Create New Application**, then within that application **create a new environment**.
4. Choose **Web server environment** for the environment tier.
5. For **Platform**, select **Preconfigured platform** and choose **node.js**.
6. For **Application code**, select **Upload your code** and choose the *escheme* zip file.
7. Once the environment is created, the application should be live at your chosen domain. You can redeploy updated versions of the application to this same environment at any time.

### Running the app locally

1. Navigate to the *escheme* directory on your computer in the command line.
2. Ensure that **Node** is installed by running `npm install`.
3. Install each of your [dependencies](#dependencies) by running `npm install --save` plus the dependency name.
4. When you want to start the application, run `npm start`.
5. The application should be live in your local web browser at http://127.0.0.1:3000/.
6. To stop the application, simply press **Ctrl + C** in the command line window, then enter **y** when prompted.

### How it works

The E-Scheme can generate any version of the schematic in a matter of seconds based on three simple components: [parts](#parts), [drawings](#drawings), and [images](#images). First, all the parts and their information gets automatically loaded into the **View All Parts** tab, regardless of whether or not they're featured in any of the stored schematics. Next, the application loops through each schematic listed in the tab navigation panel and creates an [image map](https://www.w3schools.com/tags/tag_map.asp). If the *Find Number* of a part matches up with the value of a *text entity* in a drawing, a rectangular area is created at the pixel coordinates of the text on the image that corresponds to the drawing, which is then linked to the respective part BOM.

None of these components are hard-coded into the application--everything is in terms of variables. Every time the page refreshes, the application does a [scan](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) of the DynamoDB tables and updates the parts, drawings, and images arrays.

#### Parts

Parts are contained in an array of JSON objects that match the *Item* [formatting for a DynamoDB parameter](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html#API_PutItem_RequestSyntax). Each object represents an individual part with a find number, type, and any other specified attributes.

You can change the parts list by manually editing the *Parts* table in the [Amazon DynamoDB Console](https://aws.amazon.com/dynamodb), using the website interface to add, edit, and delete parts, or uploading an Excel spreadsheet containing a bill of materials. The BOM you upload can have any number of parts and any combination of attributes in the column header; the only requirement is that one of those attributes be some variation of *Find Number* and one be some variation of *Type*. The spreadsheet must also be located in the [escheme/static/excel](static/excel) folder to be uploaded (*[see why](#file-uploads)*).

Note that parts are uniquely identified in the database by their find numbers. The application will not allow more than one part with the same find number to be added. If an attempt is made to add a part with an existing find number, that new part will override the existing part. This is actually quite useful for uploading BOM revisions without having to pick out just the revised parts, because all the parts that haven't changed won't be duplicated.

#### Drawings

Drawings are contained in an array of JSON objects that match the *Item* [formatting for a DynamoDB parameter](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html#API_PutItem_RequestSyntax). Each object represents an individual drawing with an ID, name, drawing file reference, image file reference, drawing width, drawing height, image width, image height, and an array of text entities. Each text entity represents an individual piece of text from the drawing with its value, height, width, and exact positioning in the [CAD object coordinate system](https://www.autodesk.com/techpubs/autocad/acadr14/dxf/object_coordinate_systems_40ocs41_al_u05_c.htm). These properties are all extracted from a [specific output through the parsing of the CAD file](http://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf).

You can change the drawings list by manually editing the *Drawings* table in the [Amazon DynamoDB Console](https://aws.amazon.com/dynamodb) or using the website interface to create and delete schematics. Uploading schematics requires only a CAD file with a DXF extension, an image file, and a name for the schematic. The drawing file must be located in the [escheme/static/drawings](static/drawings) folder and the image file must be located in the [escheme/static/images](static/images) folder (*[see why](#file-uploads)*).

Note that drawings are uniquely identified in the database by an ID, given by the CAD finger print ID. The application will not allow more than one drawing with the same ID to be added. If an attempt is made to add a drawing with an existing ID, that new drawing will override the existing drawing. Beware of this when editing an existing drawing on AutoCAD in its original file copy.

#### Images

Images are not actually contained as separate components. Their relevant properties (file reference, width, and height) are stored in the *Drawings* database along with their corresponding drawings. Unlike the parts list, you can't have a drawing without an image, and vice versa. The optimal way to contain image files and their properties would be through [Amazon S3](https://aws.amazon.com/s3) as described [here](#storing-static-files).

Before uploading an image, you must follow these specific instructions to ensure that the application accurately converts between the [CAD object coordinate system](https://www.autodesk.com/techpubs/autocad/acadr14/dxf/object_coordinate_systems_40ocs41_al_u05_c.htm) and the pixels on the image:

1. Convert the DXF drawing file to a PNG at http://www.zamzar.com/convert/dxf-to-png/.
2. Open the PNG image file from your computer at https://pixlr.com/editor/.
3. Select the **Wand tool** from the toolbar on the left (keyboard shortcut is **w**).
4. With the wand cursor, click the area of the image *outside the black outline of the schematic*.
5. Go to **Edit** > **Invert selection** so that the schematic itself is selected as shown by the dashed lines.
6. Go to **Image** > **Crop**. The area outside the border should disappear.
7. Go to **File** > **Save** and save the new file in the *escheme* directory [images](static/images) folder

### Known issues

There are a few very minor bugs in the E-Scheme that slightly limit its capabilities, but do not by any means prevent it from being a fully-functioning prototype application. Most of these bugs should have quick fixes and may also be resolved by implementation of some of the [future improvements](#future-improvements).

#### Relative file paths

For some reason, the relative file paths that Node accepts for importing modules seems to differ when [running the app locally](#Running-the-app-locally) versus [deploying the app](#Deploying-the-app) to [AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/). This error specifically comes up for the [controllers](/controllers) as they are referenced out of [app.js](app.js) and occasionally for static file references in the [views](/views) files. The fix is usually just adding or removing a "**.**" at the front of the file path, but more insight should be obtained on why the problem occurs in the first place.

#### Page refresh on database updates

Every time the page gets refreshed, the functions [getParts](app.js:42) and [getDrawings](app.js:56) are called to perform scans of the respective [DynamoDB](http://aws.amazon.com/dynamodb/) tables, so that the most updated parts and drawings lists are passed to the [index](views/index.html) page on render. Unfortunately, the page render will always finish before the [DynamoDB scan](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) completes, causing the data on the front-end to be "one step behind" the data on the back-end. Whenever a part or drawing is added, edited, or deleted, it takes one or two refreshes for the website interface to actually display the update. Attempts have been made to make the scan function calls redundantly throughout [app.js](app.js) with no luck. Possible solutions to this problem include making use of [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), the [async library](https://github.com/caolan/async), or looking into the service [Amazon API Gateway](http://aws.amazon.com/API-Gateway/) to directly handle all [DynamoDB](http://aws.amazon.com/dynamodb/) requests.

#### Active tabs

You might notice that right after the page is refreshed, the **View All Parts** tab has a big empty area you can scroll down to underneath the parts list. What's really in that area is the schematic images from the other tabs with their *visibility* set to *hidden*. Once you click another tab, the [makeVisible](views/scripts/makeVisibleScript.html) function toggles the *visibility* style to its default and the **View All Parts** tab will only display the parts list. This is a temporary fix to prevent an error on the page render caused by the [Bootstrap tab navigation template](https://www.w3schools.com/bootstrap/bootstrap_tabs_pills.asp). If you look at the *tab-content div* in [tabs.html](views/partials/tabs.html), you'll notice that all its interior *divs* include the class name *in active*. This class ensures that the data within each tab is loaded on the initial render, and consequently, the content for all the tabs is technically displayed under the *home* tab...its just set to be invisible.

#### Image map initialization

Sometimes, when you first click on a tab, the image map coordinates are incorrect. Changing the window size or clicking on another tab and returning to the desired schematic will eliminate the issue, but the initialization error has to do with the [image map resizer library](https://github.com/davidjbradshaw/image-map-resizer).

#### File uploads

When uploading parts, drawings, or images files to the site, they must already be located in the [excel](static/excel), [drawings](static/drawings), or [images](static/images) folder, respectively, within the *escheme* directory. This was a cheat implemented to demonstrate the user ability to convert familiar file types into web content on the front-end. In the [uploadParts](views/scripts/uploadPartsScript.html) and [createSchematic](views/scripts/createSchematicScript.html) script tags, when we get the value for file *form input* elements from the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), it only returns a fake path, such as *C:\fakepath\spreadsheet-name.xlsx*. The [modules](#dependencies) required to convert these files to JSON take in a file path parameter, thus that file path must be relative to the [controller functions](controllers). The correct way to pass the file data would be to use a [File Reader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) object or something similar to the [Jquery fileupload library](https://github.com/blueimp/jQuery-File-Upload), then temporarily store the data in an uploads folder in the *escheme* directory. You can also take advantage of some of the storage features offered by [Amazon S3](http://aws.amazon.com/s3/) (see [this](#storing-static-files) improvement).

### Future improvements

#### Increasing database efficiency

Right now, the application [scans](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) the [DynamoDB](http://aws.amazon.com/dynamoDB/) tables every time the page refreshes. The number of requests made to DynamoDB directly drives the [cost](#cost-analysis) of its service and makes the application run slower. It would therefore be more efficient to only perform these scans conditionally on whether or not an update has just occurred. The scan would still of course need to take place on the initial page render. This improvement relates to the [page refresh](#page-refresh-on-database-updates) issue, and could also be carried out using [Amazon API Gateway](http://aws.amazon.com/API-Gateway/). Regardless of if the improvement is implemented, the functions [getAll](app.js:87), [getParts](app.js:42), and [getDrawings](app.js:56) should be refactored into separate [controller](controllers) files.

#### Storing static files

[Amazon S3](http://aws.amazon.com/API-Gateway/), which stands for *Simple Storage Service*, offers the ability to upload, store, and retrieve static files by making requests similar to those used for DynamoDB. This service would be extremely useful for holding our image files so that they can be uploaded from any source and then retrieved by any user. You could also use S3 to temporarily store Excel spreadsheets and CAD drawings, but once the data is extracted from those files there's no need to keep them any longer. S3 does require some more complicated [configurations](#configuring-AWS) in AWS, including the option to only grant certain users the permission to upload files, but once implemented it will definitely save storage space and streamline the [file upload](#file-uploads) process.

#### Expanding the image map

There are several ways you can add to the image map functionality to enhance how an engineer can interact with a schematic. One useful addition would be a search bar, similar to the one on the **View All Parts** tab, that automatically zooms in on the image to the location of the desired part. The [Panzoom]((https://github.com/timmywil/jquery.panzoom)) library may offer the capability for this feature. You may also want to add the feature for each part to be highlighted when the mouse hovers over it, which is available in the [image-mapster](https://github.com/jamietre/ImageMapster) or [mapify](https://github.com/etienne-martin/mapify) libraries. These libraries include many other interactive possibilities for the image map, but beware that their implementation could interfere with the [image-map-resizer](https://github.com/davidjbradshaw/image-map-resizer) library, which is much more essential to the application. Other additional features to consider would be the ability to interact with elements besides just the text, for example clicking on the manual valve icon to get information or visually open or close it, and the ability to edit the drawings within the application through a [CAD library](https://www.npmjs.com/search?q=cad&page=1&ranking=optimal).

#### Tracking commodity levels, RV spares, and more

The BOM information that pops up when you click on a part does not have a hard-coded set of attributes (aside from *Type* and *Find Number*). The attributes are simply taken from the column headers of the Excel spreadsheet you upload. This feature could be utilized to display and update information that engineers need daily access to beyond the traditional BOM, such as the commodity levels for storage tanks, spare parts for RVs, etc. It would also be useful to add a button for *Adding or deleting an attribute* within a part on the website interface.

#### Designing CCBs

Users have the ability to upload unique, customized schematics, which could be useful for the configuration change process. As engineers create schematic designs for their proposed change, they could upload those designs to the E-Scheme and include information about the parts in their new configuration. You could update the tab navigation panel to have a CCB dropdown menu for unofficial schematics, or make it so users can only see their generated schematics and have the option to share their schematics with others. You might also want to find a library to parse Visio files similar to how the [dxf-parser](https://www.npmjs.com/package/dxf-parser) currently handles CAD files.

#### Simulating operations

At its core, this application is really just a platform for storing and managing parts. That idea could quite easily be extended to incorporate the *relationships* between parts as they're physically laid out on the schematic, and then storing those connections in a data structure. The data structure that readily comes to mind is a [graph](https://www.tutorialspoint.com/data_structures_algorithms/graph_data_structure.htm).

A graph is made up of different vertices that are connected by edges. In this case, the vertices would be parts and the edges would be lines (such as the *GN2 Supply Line*). Parts that are immediately connected through a line would be considered adjacent vertices, and the path between two parts anywhere on the schematic would be generated by traversing from part to part. Most graph implementations already have basic operations for adding and deleting vertices or finding the shortest path from one vertex to another. For the schematic, however, you could customize your own operations, that apply to real-life pad operations from isolating an single relief valve for testing to performing a leak check on an entire line.

The logic behind these operations really shouldn't be too complicated; the hardest part of creating a graph would be loading in all the vertex data... and that's already done. With the addition of an upstream and downstream attribute for each part, the E-Scheme could transform into a full-force pad simulator to open up insight into all kinds of optimization techniques.

### Cost analysis

Running a web application without a server is basically free, or very, very cheap. When you sign up for Amazon Web Services under the Free Tier, you get the following benefits applicable to the services used by the E-Scheme:

*  [EC2](https://aws.amazon.com/ec2/pricing/) - 750 hours of hosting per month
* [DynamoDB](https://aws.amazon.com/dynamodb/pricing/) - 25 GB of storage, 25 [write capacity units (WCU)](https://aws.amazon.com/dynamodb/faqs/#What_is_a_readwrite_capacity_unit) and 25 [read capacity units (RCU)](https://aws.amazon.com/dynamodb/faqs/#What_is_a_readwrite_capacity_unit) (up to 200 million requests per month)
* [S3](https://aws.amazon.com/s3/pricing/) - 5 GB of storage, 20,000 GET request, 2000 PUT requests

The Free Tier pricing only lasts for the first year, with the exception of DynamoDB, which is always free for under 25 GB of storage. After the first year, or if you go over any of the above limits in the first year, the pricing is as follows:

* [EC2](https://aws.amazon.com/ec2/pricing/) - $0.017 per hour of hosting
* [DynamoDB](https://aws.amazon.com/dynamodb/pricing/) - 0.00065 per [WCU](https://aws.amazon.com/dynamodb/faqs/#What_is_a_readwrite_capacity_unit) and $0.00013 per [RCU](https://aws.amazon.com/dynamodb/faqs/#What_is_a_readwrite_capacity_unit)
* [S3](https://aws.amazon.com/s3/pricing/) - $0.023 per GB of storage, $0.004 per 10,000 GET requests, $0.005 per 1,000 PUT requests

So let's do a long-term cost analysis of the E-Scheme:

* Assume that the first year pricing limits have expired and the application is...

  - constantly running 24 hours a day
  - storing the full BOM (about 1600 parts)
  - a full schematic and a separate schematic for each panel (about 20 total drawings and images)
  
* Per month, we'd need about 720 hours of hosting our EC2 instance for a total of $12.24.
* One part takes up 0.39 KB and one drawing takes up 9.24 KB of storage on DynamoDB. For all the parts and drawings, that adds up to 808.8 KB, which is well within the limits of the free storage.
* In the worst case scenario, we'd need the capacity to read/write all of our DynamoDB items every second. That's 1620 WCU and 1620 RCU for a total of $1.27.
* One image takes up 26 bytes of storage on S3. For all the images, that adds up to 520 bytes or 5.2e-7 GB, which costs tiny fractions of a penny not worth writing out.
* Estimate that there are 1000 GET requests and 1000 PUT requests to S3 throughout the office per day, or about 30,000 of each per month. That adds up to $0.162.

**The total monthly cost of the E-Scheme is $13.67**, even after making some pretty extreme assumptions. For more information on AWS pricing, click [here](https://aws.amazon.com/pricing/).

### Dependencies

* [aws-sdk](https://github.com/aws/aws-sdk-js) - Link application to AWS account and make calls to DynamoDB
* [body-parser](https://github.com/expressjs/body-parser) - NodeJS and Express body parsing middleware for requests
* [dxf-parser](https://www.npmjs.com/package/dxf-parser) - Convert a CAD file with dxf extension to JSON
* [ejs](https://github.com/mde/ejs) - Embedded JavaScript used to add logic within HTML files
* [event](https://github.com/Gozala/event) - Handle reactive style events
* [excel-as-json](https://github.com/stevetarver/excel-as-json) - Convert an Excel file with xlsx extension to JSON
* [express](https://github.com/expressjs/express) - API framework for our router [app.js](app.js)
* [image-size](https://github.com/image-size/image-size) - Get the dimensions of an image from its file

### External scripts

* [AJAX](http://api.jquery.com/jquery.ajax/) - Update web page without reloading and send data to the server
* [Bootstrap](http://getbootstrap.com/) - Used for styling, pop-up modals, and navigation tabs
* [Image Map Resizer](https://github.com/davidjbradshaw/image-map-resizer) - Adjust image map area coordinates based on window size
* [Panzoom](https://github.com/timmywil/jquery.panzoom) - Zoom on an image by scrolling and pan by dragging the mouse

### [Back to top](#Table-of-contents)
