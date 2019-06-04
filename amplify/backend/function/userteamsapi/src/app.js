/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/
const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "userteamstable";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "username";
const partitionKeyType = "S";
const sortKeyName = "timestamp";
const sortKeyType = "N";
const hasSortKey = sortKeyName !== "";
const path = "/userteams";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
const versionKey = "v1";
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

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + hashKeyPath, function(req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }

  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }
  //console.log(condition);
  let queryParams = {
    TableName: tableName,
    KeyConditions: condition,
    ScanIndexForward:false,
    ConsistentRead:false,
    Limit:1,
  }

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json(data.Items);
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params
  }

  dynamodb.get(getItemParams,(err, data) => {
    if(err) {
      res.json({error: 'Could not load items: ' + err.message});
    } else {
      if (data.Item) {
        res.json(data.Item);
      } else {
        res.json(data) ;
      }
    }
  });
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path, function(req, res) {

  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.json({error: err, url: req.url, body: req.body});
    } else{
      res.json({success: 'put call succeed!', url: req.url, data: data})
    }
  });
});

/************************************
* HTTP post method for insert object *
*************************************/

app.post(path, function(req, res) {
  if(!req.body.hasOwnProperty('version') || req.body.version!=versionKey || !req.body.hasOwnProperty('lockedTeam'))
  {
    console.log("ERROR:Please clear your cache and try again");
    console.log("ERROR:"+req.body);
    res.json({error: "Please clear your cache and try again", url: req.url, body: req.body});
    return;
  }

  var lockedTeam = req.body.lockedTeam;
  if(req.body.team.length!=11)
  {
    console.log("ERROR:Team doesnt have 11 players");
    console.log("ERROR:"+req.body);
    res.json({error: "Team doesn't have 11 players", url: req.url, body: req.body});
    return;
  }
  var teamCatMap = req.body.team.reduce((a,b)=>{(a[b.category]=a[b.category]+1||1);return a},{});
  if(teamCatMap.Batsman<3||teamCatMap.Bowler<3||teamCatMap['Wicket-Keeper']<1||teamCatMap['All-Rounder']<2)
  {
    console.log("ERROR:Team doesnt have proper composition:"+teamCatMap);
    console.log("ERROR:"+req.body);
    res.json({error: "Team doesn't have valid composition", url: req.url, body: req.body});
    return;
  }
  
  var numberOfDraftedPlayers = req.body.team.reduce(function(a,b){return a+(b.drafted==true?1:0)},0);
  if(numberOfDraftedPlayers!=2)
  {
    console.log("ERROR:Cannot drop drafted player, total drafted players:"+numberOfDraftedPlayers);
    console.log("ERROR:"+JSON.stringify(req.body.team));
    res.json({error: "Cannot drop drafted player", url: req.url, body: req.body});
    return;
  }
  if(!req.body.isNewteam && lockedTeam!=null)
  {
    var subCount = req.body.team.filter(function(player){
      return lockedTeam.team.map(function(e) { return e.name; }).indexOf(player.name) ===-1;
    }).length;

    var newSubCount=lockedTeam.subs-subCount;
    if(newSubCount<0)
    {
        console.log("Insufficient subs:"+req.body);
        res.json({error: "Insufficient subs", url: req.url, body: req.body});
        return;
    }
    if(req.body.subs!=newSubCount)
    {
      console.log("SUB COUNT DIFFERENCE!! Req SUB:"+req.body.subs+"  API Subs:"+newSubCount);
      req.body.subs = newSubCount;
    }

    console.log("Updating the points to:"+lockedTeam.points);
    console.log("updating the phase to:"+lockedTeam.phase);
    req.body.points = lockedTeam.points;
    req.body.phase = lockedTeam.phase;
    req.body.matchpoints = lockedTeam.matchpoints;
  }
  else {
    req.body.points = 0;
  }
  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }
  delete req.body.version;
  delete req.body.lockedTeam;
  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.json({error: err, url: req.url, body: req.body});
    } else{
      res.json({success: 'post call succeed!', url: req.url, data: data})
    }
  });
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete(path + '/object' + hashKeyPath + sortKeyPath, function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
     try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let removeItemParams = {
    TableName: tableName,
    Key: params
  }
  dynamodb.delete(removeItemParams, (err, data)=> {
    if(err) {
      res.json({error: err, url: req.url});
    } else {
      res.json({url: req.url, data: data});
    }
  });
});
app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
