const https = require('https');
const fs = require('fs');
const file = fs.createWriteStream("public/logo.jpg");
https.get("https://i.ibb.co/MxsSzdwY/1781130888674-2.jpg", function(response) {
  response.pipe(file);
});
