/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/
const AWS = require('aws-sdk')
var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "matchpoints";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/points', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

app.get('/points/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/points',  function(req, res) {
  // Add your code here
  console.log("Updating points for:"+req.body.match);
  let timestamp = req.body.timestamp;
  let playerPoints = req.body.points;
  let matchTitle = req.body.match;
  let putItemParams = {
    TableName: 'matchpoints-iplfantasy',
    Item: req.body
  }
  let responseStatus = [];
  let users=["Caribbeankings","Chandu","Sreedhar","RamsPats",
        "sagartummala","vijaym","mailsrujan","ngkiran43",
        "pakkapeddi","raghukishore","rprativadi","sabarishv",
       "sagar1221","thotakuri","NareshBalija","KalaXI","apatti"]
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.json({error: err, url: req.url, body: req.body});
    } else{
      console.log("Updated match points");
      responseStatus.push("Updated match points");
      var userTeams=[]
      var condition = {}
      condition['username'] = {
        ComparisonOperator: 'EQ'
      }
      condition['timestamp'] = {
        ComparisonOperator: 'LE',
        AttributeValueList: [timestamp]
      }
      for(var i=0;i<users.length;i++)
      {
        condition['username']['AttributeValueList']=[users[i]];
        let queryItemParams={
          TableName: 'userteamstable-iplfantasy',
          KeyConditions: condition,
          ScanIndexForward:false,
          ConsistentRead:false,
          Limit:1
        }
        userTeams.push(dynamodb.query(queryItemParams).promise().then(function(data,err){
          var userData = data.Items[0];
          return {"user":userData.username,"team":userData.team,"c":userData.c,"vc":userData.vc};
        }).catch(e=>{console.log("Error:"+e);res.json({error: e, url: req.url, body: req.body});}));
      }
      var userRetPoints=[];
      Promise.all(userTeams).then(async function(values)
      {
        for(var i=0;i<values.length;i++)
        {
          //console.log(JSON.stringify(values[i]));
          var userData = values[i];
          var batPoints = 0;
          var bowlPoints = 0;
          var fieldPoints = 0;
          var momPoints = 0;
          var capPoints = 0;
          var vcPoints = 0;
          var totalPoints = 0;
          for(var j=0;j<userData.team.length;j++)
          {
            var player = userData.team[j];
            var name=player.name.trim().toLowerCase();
            if(!playerPoints.hasOwnProperty(name))
            {
              continue;
            }
            var captain = userData.c.trim().toLowerCase();
            var vc = userData.vc.trim().toLowerCase();
            var multipler = 1;
            if(name==captain)
            {
              multipler += 1;
              capPoints=playerPoints[name]["totalpoints"];
            }
            if(name==vc)
            {
              multipler += 0.5;
              vcPoints = playerPoints[name]["totalpoints"]*0.5;
            }
            batPoints   +=  playerPoints[name]["totalbat"];
            bowlPoints  +=  playerPoints[name]["totalbowl"];
            fieldPoints +=  playerPoints[name]["totalfield"];
            momPoints   +=  playerPoints[name]["mom"];

            totalPoints +=  playerPoints[name]["totalpoints"]*multipler;

          }
          let username = userData.user;
          //console.log("Pushing for "+username);
          userRetPoints.push({"name":username,"batPoints":batPoints,
                              "bowlPoints":bowlPoints,"fieldPoints":fieldPoints,
                              "capPoints":capPoints,"vcPoints":vcPoints,
                              "momPoints":momPoints,"totalPoints":totalPoints});

          var writeParams = {
                          TableName: "usermatchpoints-iplfantasy",
                          Item:{"username":username,
                                "match":matchTitle,
                                "points":{"batPoints":batPoints,"bowlPoints":bowlPoints,
                                          "fieldPoints":fieldPoints,"momPoints":momPoints,
                                          "capPoints":capPoints,"vcPoints":vcPoints,
                                          "totalPoints":totalPoints}}
                      };
          var userMatchData = dynamodb.put(writeParams).promise();

          var updateUserPointsParams = {
                          TableName: "users-iplfantasy",
                          Key:{
                              "username": username,
                              "league": "dukes"
                          },
                          UpdateExpression: "SET points = points + :updatedpoints, phase=phase + :updatedpoints, matchpoints=:updatedpoints",
                          ExpressionAttributeValues:{
                              ':updatedpoints': totalPoints
                          }
                      };

          //var userMatchData = dynamodb.put(writeParams).promise();
          var userPointsData = dynamodb.update(updateUserPointsParams).promise();
          await userMatchData;
          await userPointsData;
        }
        //console.log("User Points:"+userRetPoints);
        var smsMessageParams = {
          Message: "Scores updated for:\n"+matchTitle,
          TopicArn: "arn:aws:sns:us-west-2:923271942752:ScoreUpdated"
        };
        await new AWS.SNS({apiVersion: '2010-03-31'}).publish(smsMessageParams).promise();
        res.json({success: 'post call succeed!', url: req.url, data: userRetPoints});
      }).catch(e=>{console.log("Error:"+e);res.json({error: e, url: req.url, body: req.body});});

      //res.json({success: 'post call succeed!', url: req.url, data: data})
    }
  });
  //res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

app.post('/points/*', function(req, res) {
  // Add your code here

  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* Example post method *
****************************/

app.put('/points', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/points/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/points', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/points/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
