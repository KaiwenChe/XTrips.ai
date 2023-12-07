//
// AWS.js
//
// Exports 
// s3: an S3Client object
//

const { S3Client } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-providers');

const fs = require('fs');
const ini = require('ini');

const config = require('./config.js');

const xtrip_config = ini.parse(fs.readFileSync(config.xtrip_config, 'utf-8'));
const s3_region_name = xtrip_config.s3.region_name; 
const s3_bucket_name = xtrip_config.s3.bucket_name; 

//
// create s3 object for communicating with S3 service, but
// this does not open the connection:
//
let s3 = new S3Client({
  region: s3_region_name,
  credentials: fromIni({ profile: 'xtrips_s3readwrite' })
});

module.exports = { s3, s3_bucket_name, s3_region_name };

