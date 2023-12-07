
const express = require('express');
const app = express();
const config = require('./config.js');
const dbConnection = require('./database.js')
const { HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
// const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');
var startTime;

app.listen(config.service_port, () => {
  startTime = Date.now();
  console.log('web service running on:', config.service_port);
  
  process.env.AWS_SHARED_CREDENTIALS_FILE = config.xtrip_config;
});

app.get('/', (req, res) => {

  var uptime = Math.round((Date.now() - startTime) / 1000);

  res.json({
    "status": "running",
    "uptime-in-secs": uptime,
    "dbConnection": dbConnection.state
  });
});

//
// functions:
//
var register = require('./apis/register.js');
var generate = require('./apis/generate.js');


app.get('/register', register.register_user);
app.post('/generate', generate.generate_recommendation);
