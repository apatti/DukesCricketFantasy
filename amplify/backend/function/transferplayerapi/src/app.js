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

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

AWS.config.update({ region: process.env.TABLE_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();



/**********************
 * Example get method *
 **********************/

app.get('/transferplayer', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

app.get('/transferplayer/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/transferplayer', async function(req, res) {
  // Add your code here
  console.log("Transfering player as per:"+JSON.stringify(req.body));
  let allOwners = ["Caribbeankings","Chandu","Sreedhar","RamsPats",
        "sagartummala","vijaym","mailsrujan","ngkiran43",
        "pakkapeddi","raghukishore","rprativadi","sabarishv",
       "sagar1221","thotakuri","NareshBalija","KalaXI","apatti"];
  let manager = req.body.owner;

  let retMessages = [];

  var playerAddDbEntry = null;

  //Phase 0: Get the transfer Request.
  var transferRequestParam = {
    TableName : "transferresults-iplfantasy",
    KeyConditionExpression: "#name = :username",
    ExpressionAttributeNames:{
        "#name": "user"
    },
    ExpressionAttributeValues: {
        ":username": manager
    },
    ScanIndexForward:false,
    Limit:1
  };
  let transferRequestItems = await dynamodb.query(transferRequestParam).promise();
  if(transferRequestItems.Items.length==0||transferRequestItems.Items[0].user!=manager)
  {
    console.log("No transfer request");
    res.json({error: "No transfer request", url: req.url, body: req.body});
    return;
  }
  var transferRequest = transferRequestItems.Items[0];
  if(transferRequest.status!="Pending")
  {
    console.log("No pending transfer request");
    res.json({error: "No pending transfer request", url: req.url, body: req.body});
    return;
  }
  let playerAddName = transferRequest.add;
  let playerAddTeam = transferRequest.playerAdd.team;
  let bidAmount = transferRequest.bidAmount;

  let playerRemoveName = transferRequest.playerRemove.name;
  let playerRemoveTeam = transferRequest.playerRemove.team;

  //Phase 1: Update player details in playersTable

  //Set the drafted flag to true,bid price, owner for playerToadd.
  var playerAddUpdateParams = {
            TableName: "playersTable-iplfantasy",
            Key:{
                "name": playerAddName,
                "team": playerAddTeam
            },
            UpdateExpression: "SET drafted = :drafted, manager= :manager, draftprice=:draftprice",
            ExpressionAttributeValues:{
                ':drafted': true,
                ':manager': manager,
                ':draftprice': bidAmount
            },
            ReturnValues:"ALL_NEW"
        };
  var playerAddUpdatePromise = dynamodb.update(playerAddUpdateParams).promise();
  //Set the drafted flat to flase for playerToRemove.
  var playerRemoveUpdateParams = {
            TableName: "playersTable-iplfantasy",
            Key:{
                "name": playerRemoveName,
                "team": playerRemoveTeam
            },
            UpdateExpression: "SET drafted = :drafted, manager= :manager, draftprice=:draftprice",
            ExpressionAttributeValues:{
                ':drafted': false,
                ':manager': "Available",
                ':draftprice': 0
            }
        };
  var playerRemoveUpdatePromise = dynamodb.update(playerRemoveUpdateParams).promise();
  await Promise.all([playerAddUpdatePromise,playerRemoveUpdatePromise]).then(ret=>{
    console.log("RET:"+JSON.stringify(ret));
    for(var i=0;i<ret.length;i++)
    {
      if(ret!=null&&ret[i].Attributes!=undefined)
      {
        playerAddDbEntry = ret[i].Attributes;
      }
    }
  });
  console.log("PlayerADD:"+JSON.stringify(playerAddDbEntry));
  retMessages.push(playerAddDbEntry);
  console.log(playerAddName + " & "+playerRemoveName+" updated in player DB ")
  retMessages.push(playerAddName + " & "+playerRemoveName+" updated in player DB ");

  var managerIndex = allOwners.indexOf(manager);
  allOwners.splice(managerIndex,1);
  //Phase 2: Update the sub count and teams of the owners who have the player to remove in locked state.

  //get the list of users who have the player to add in locked state.
  const queryParams = {
    TableName: "users-iplfantasy"
  };
  var userTeams = await dynamodb.scan(queryParams).promise();

  var playerExistUsers = userTeams.Items.filter(userTeam=>{return userTeam.team.find(t=> t.name==playerAddName)!=undefined});
  console.log(JSON.stringify(playerExistUsers));

  var subCost = playerExistUsers.length*2;
  retMessages.push("The transfer costs:"+subCost);
  var lockedUsersUpdatePromise=[];
  if(subCost>0)
  {
    for(var lu=0;lu<playerExistUsers.length;lu++)
    {
      let lUserName = playerExistUsers[lu].username;
      let playerToRemoveIndex = playerExistUsers[lu].team.findIndex(p=>p.name===playerAddName);
      if(playerToRemoveIndex<0)
      {
        console.log("Player add index is -ve for"+lUserName+ " .. check!!!:"+playerAddName);
        continue;
      }
      var luIndex = allOwners.indexOf(lUserName);
      if(luIndex>-1)
      {
        allOwners.splice(luIndex,1);
      }
      //currentTeamUpdateRequired.push(lUserName);
      playerExistUsers[lu].team.splice(playerToRemoveIndex,1);
      playerExistUsers[lu].subs +=2;
      if(playerExistUsers[lu].c==playerAddName)
      {
        playerExistUsers[lu].c = playerExistUsers[lu].team[0].name;
      }
      if(playerExistUsers[lu].vc==playerAddName)
      {
        playerExistUsers[lu].vc = playerExistUsers[lu].team[0].name;
      }
      var lockedPlayerUpdateParams = {
                TableName: "users-iplfantasy",
                Key:{
                    "username": lUserName,
                    "league": "dukes"
                },
                UpdateExpression: "SET subs = :subs, team = :team,c = :c,vc = :vc",
                ExpressionAttributeValues:{
                    ':subs': playerExistUsers[lu].subs,
                    ':team': playerExistUsers[lu].team,
                    ':c' : playerExistUsers[lu].c,
                    ':vc' : playerExistUsers[lu].vc
                },
                ReturnValues:"ALL_NEW"
            };
      lockedUsersUpdatePromise.push(dynamodb.update(lockedPlayerUpdateParams).promise());
      console.log("Updating owner:"+lUserName+" new SubCount:"+playerExistUsers[lu].subs);
      retMessages.push("Updating owner:"+lUserName+" new SubCount:"+playerExistUsers[lu].subs);
      retMessages.push(lockedPlayerUpdateParams);
    }
    //await Promise.all(lockedUsersUpdatePromise);
    //console.log("All locked teams are updated");
  }
  // Phase 3: Update the owner team i.e. replace the player.
  let ownerTeam = userTeams.Items.find(userTeam=>{return userTeam.username===manager});
  let playerToRemoveIndex = ownerTeam.team.findIndex(p=>p.name===playerRemoveName);
  ownerTeam.team.splice(playerToRemoveIndex,1,playerAddDbEntry);
  ownerTeam.subs -= subCost;
  if(ownerTeam.c==playerRemoveName)
  {
    ownerTeam.c = ownerTeam.team[0].name;
  }
  if(ownerTeam.vc==playerRemoveName)
  {
    ownerTeam.vc = ownerTeam.team[0].name;
  }
  var ownerUpdateParams = {
            TableName: "users-iplfantasy",
            Key:{
                "username": manager,
                "league": "dukes"
            },
            UpdateExpression: "SET subs = :subs, team = :team,c = :c,vc = :vc",
            ExpressionAttributeValues:{
                ':subs': ownerTeam.subs,
                ':team': ownerTeam.team,
                ':c' : ownerTeam.c,
                ':vc' : ownerTeam.vc
            },
            ReturnValues:"ALL_NEW"
        };
  lockedUsersUpdatePromise.push(dynamodb.update(ownerUpdateParams).promise());
  //await Promise.all(lockedUsersUpdatePromise).then()
  console.log("Owner team is updated");
  retMessages.push("Owner team is updated");
  retMessages.push(ownerUpdateParams);

  //Phase 4: reset all current team owners who have player to be added.
  var date = new Date();
  var timestamp = Math.floor(date.getTime()/1000);
  for(var al=0;al<allOwners.length;al++)
  {
    //var date = new Date();
    //var timestamp = Math.floor(date.getTime()/1000);
    var latestTeamParam = {
      TableName : "userteamstable-iplfantasy",
      KeyConditionExpression: "#name = :username and #ts <= :timestamp",
      ExpressionAttributeNames:{
          "#name": "username",
          "#ts" : "timestamp"
      },
      ExpressionAttributeValues: {
          ":username": allOwners[al],
          ":timestamp": timestamp
      },
      ScanIndexForward:false,
      Limit:1
    };
    lockedUsersUpdatePromise.push(dynamodb.query(latestTeamParam).promise());
  }

  await Promise.all(lockedUsersUpdatePromise).then(async function(ret){
    var currentUserTeamUpdatePromise = [];
    for(var i=0;i<ret.length;i++)
    {
      if(ret!=null)
      {
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
        var writeParams = {
                        TableName: "userteamstable-iplfantasy"
                    };
        //var userMatchData =
        if(ret[i].Attributes!=undefined)
        {
          ret[i].Attributes.timestamp = timestamp;
          writeParams.Item = ret[i].Attributes;
          retMessages.push("Resetting:"+ret[i].Attributes.username);
          console.log("Resetting:"+ret[i].Attributes.username);
          currentUserTeamUpdatePromise.push(dynamodb.put(writeParams).promise());
          continue;
        }
        if(ret[i].Items!=undefined && ret[i].Items[0]!=null)
        {
          if(ret[i].Items[0].team.findIndex(p=>p.name===playerAddName)!=-1)
          {
            let resetTeamOwner = ret[i].Items[0].username;
            let resetTeam = userTeams.Items.find(userTeam=>{return userTeam.username===resetTeamOwner});
            resetTeam.timestamp = timestamp;
            writeParams.Item = resetTeam;
            retMessages.push("Resetting:"+resetTeamOwner);
            console.log("Resetting:"+resetTeamOwner);
            currentUserTeamUpdatePromise.push(dynamodb.put(writeParams).promise());
          }
        }
      }
    }
    await Promise.all(currentUserTeamUpdatePromise);
  }).catch(e=>{console.log("Error:"+e);res.json({error: e, url: req.url, body: req.body});});

  //Phase 5: Update the transferResults Table
  var updateTransferRequestParams = {
                  TableName: "transferresults-iplfantasy",
                  Key:{
                      "user": transferRequest.user,
                      "timestamp": transferRequest.timestamp
                  },
                  UpdateExpression: "SET #st = :status",
                  ExpressionAttributeNames:{
                      "#st" : "status"
                  },
                  ExpressionAttributeValues:{
                      ':status': "Success"
                  }
              };

  await dynamodb.update(updateTransferRequestParams).promise();
  res.json({success: 'post call succeed!', url: req.url, body: req.body, data: retMessages});
});

app.post('/transferplayer/*', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* Example post method *
****************************/

app.put('/transferplayer', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/transferplayer/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/transferplayer', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/transferplayer/*', function(req, res) {
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
