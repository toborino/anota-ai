var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://rufrithjryhxzn:k0LK1Sh6X4or-QK6SD4qJ-2cTx@ec2-54-225-91-215.compute-1.amazonaws.com:5432/d3hjpsasdd9q8d';
var client = new pg.Client(connectionString);
client.connect();
module.exports = client


