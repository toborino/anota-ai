var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://guspvkqxycxsnv:kD0Fa0qf60sPeh6cO11pGrSdld@ec2-54-221-240-149.compute-1.amazonaws.com:5432/d658pgg0rdoqhg';
var client = new pg.Client(connectionString);
client.connect();
module.exports = client


