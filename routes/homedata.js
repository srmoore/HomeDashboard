/**
 * Created by Steve on 4/12/2016.
 */
var express = require('express');
var router = express.Router();
var http = require("http");

var keysFilename = "../api_keys.json";
var keys
    try {
        keys = require(keysFilename);
    } catch (err) {
        keys = {};
        console.log("Unable to read file '" + keysFilename + "': ", err)
        console.log("See api_keys_sample.json for an example.")
    }

var fieldCount = 5;
var fieldTitles = ["Living Room Temp","Bedroom Temp","Outside Temp","Storage Temp","Study Temp"];
var fieldColors = ['green','red','yellow','black','blue']
var dataSeries = [];

function initDataSeries() {
    dataSeries = [];
    for (i = 0; i < fieldCount; i++) {
        newSeries = {};
        newSeries.name = fieldTitles[i];
        newSeries.color = fieldColors[i];
        newSeries.data = [];
        dataSeries.push(newSeries);
    }
}
function dateTimeToEpochSeconds(datetime){
    return Math.floor(new Date(datetime) / 1000);
}

function parseFeed(feedObj) {
    initDataSeries();
    for (i = 0; i < feedObj.feeds.length; i++) {
        var dataTime = dateTimeToEpochSeconds(feedObj.feeds[i].created_at);
        for (j = 1; j <= fieldCount; j++) {
            if (feedObj.feeds[i]['field' + j] != null){
                dataSeries[j-1].data.push({x: dataTime, y: parseFloat(feedObj.feeds[i]['field'+j])});
            }
        }
    }
}

router.get('/',function(req, res, next) {
    var obj = null;
    //TODO: Use a window of time rather than just the last 50 entries
    //TODO: Reformat feed to match Chart.js format
    //TODO: PERHAPS use a last updated time input to just get new updates (Maybe... maybe not.)
    // Default is the prior day's worth of data
    var options = {host:'api.thingspeak.com',
                    port:80,
                    path: '/channels/' + keys.thingspeak_channel_id + "/feeds.json?api_key=" + keys.thingspeak_api_key,
                    method: 'GET'};
    console.log(options);
    var ts_req = http.request(options,function (ts_res){
       var output = ' ';
        ts_res.on('data', function (chunk) {
            output += chunk;
            console.log("Got Data: " + chunk);
        });
        ts_res.on('end',function() {
            console.log("END");
            obj = JSON.parse(output);
            parseFeed(obj);
            console.log("OBJ: " + JSON.stringify(dataSeries));
            res.json(dataSeries);
            //res.render('data',{data:JSON.stringify(dataSeries)});
        });
        //TODO: detect something going wrong and throw error of some sort.
    }).on('error', function(e){
        return next(e);
    });
    ts_req.end();
    //res.json(obj);
});

module.exports = router;