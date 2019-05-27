var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

// Database models for RawData and DataSets
var RawData = require("../models/DataModels").RawData;
var DataSet = require("../models/DataModels").DataSet;

// Database configuration settings
var config = require('../config/database');

var path = require('path');
var pause = require('connect-pause');

// Load username and password
var secrets = require("../config/secrets");

// Load python script paths
var scriptData = require("../config/pythonconfig");

// Load text-to-speech settings
var tts = require("../config/texttospeechsettings");

/*
 * /////////////////////////////////////////////////////////////////
 * Imports for saving punch-data to filesystem
 * /////////////////////////////////////////////////////////////////
 */
var fs = require("fs");
var dataPaths = require("../config/stats_data_pathes");
let punch_data_path = dataPaths.punch_data_path;
let clear_punch_recognition_stats_path = dataPaths.clear_punch_recognition_stats_path;
let punch_recognition_stats_path = dataPaths.punch_recognition_stats_path;

/*
 * /////////////////////////////////////////////////////////////////
 * Imports for live classification:
 * /////////////////////////////////////////////////////////////////
 */

// For calling the classification scripts (python)
let myPythonScript = scriptData.scriptPath;
let pythonExecutable = scriptData.pythonExecutable;
const spawn = require('child_process').spawn;
const scriptExecution = spawn(pythonExecutable, [myPythonScript]);

// Interval (in ms) for checking prediction messages to be finished
refreshCycleIntervallMS = 100;

// Handle classified (script) output
let predictedReturnMessage = "";
let prediction_message_to_speak = "";
let predictionFinished = false;
let predictedLabel = "";
let predictedHand = "";

/**
 * On-handler for new data available from python script. Creates the text-to-speech string
 */
scriptExecution.stdout.on('data', function (data) {
  predictedReturnMessage += data.toString();
  if (predictedReturnMessage.includes("[py_end]")) {
    pred_lab = predictedReturnMessage.split("[py_predicted_label]")[1].replace("[", "").replace("]", "").trim();
    pred_hand = predictedReturnMessage.split("[py_predicted_hand]")[1].replace("[", "").replace("]", "").trim();
    console.log("Label:" + pred_lab);
    console.log("Hand:" + pred_hand);
    predictedLabel = pred_lab;
    predictedHand = pred_hand;

    switch (pred_lab) {
      case "0":
        prediction_message_to_speak += tts.talk_label_noAction;
        break;
      case "1":
        prediction_message_to_speak += tts.talk_label_upperCut;
        break;
      case "2":
        prediction_message_to_speak += tts.talk_label_sideCut;
        break;
      case "3":
        prediction_message_to_speak += tts.talk_label_frontal;
        break;
      default:
        console.log("Error, default switch-case statement in pred_lab found!");
    }

    switch (pred_hand) {
      case "0":
        prediction_message_to_speak += tts.talk_hand_right;
        break;
      case "1":
        prediction_message_to_speak += tts.talk_hand_left;
        break;
      default:
        console.log("Error, default switch-case statement in pred_hand found!");
    }

    if (pred_lab == "0") {
      prediction_message_to_speak = tts.talk_noMove_detected;
      prediction_message_to_speak += pred_hand == 0 ? tts.talk_right : tts.talk_left;
      prediction_message_to_speak += tts.talk_isWorn;
    }
    predictedReturnMessage = "";
    predictionFinished = true;
  }
});


/**
 * Err-handler for error while script execution.
 *  -> do nothing for now
 */
scriptExecution.stderr.on('data', (data) => { });

/**
 * Exit-handler if child process terminates normally
 */
scriptExecution.on('exit', (code) => {
  console.log("Classification script terminated with code : " + code);
});

/*
 * /////////////////////////////////////////////////////////////////
 * Helper functions:
 * /////////////////////////////////////////////////////////////////
 */

/**
 * Saves new punch data to the filesystem.
 * @param {*} dataObj Object containing punch data
 * @returns void
 */
function savePunchData(dataObj) {
  try {
    fs.writeFile(punch_data_path, JSON.stringify(dataObj), () => {
    });
  } catch (err) {
    console.log("Error while storing punch-data to filesystem.");
  }
}

/**
 * Loads the punch data from the filesystem. (Remember: In this version, only the last punch is stored!)
 * @returns void
*/
async function loadPunchData() {
  return new Promise(function (resolve, reject) {
    fs.readFile(punch_data_path, (err, data) => {
      if (err) {
        console.log("Error while reading punch-data from filesystem: " + err.message);
        reject(null);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

/**
 * Loads the recognition statistics from the filesystem and returns this as a object.
 * @param {*} path Path (as string) to a file
 * @returns StatisticsObject
 */
async function loadRecognitionStatistics(path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, (err, data) => {
      if (err) {
        console.log("Error while reading punch-data from filesystem: " + err.message);
        reject(null);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

/**
 * Updates the recognition statistics with a new object in the notation:
 * { predLabel: X, predHand: X, factLabel: Y, factHand: Y, resultLabel: false/true, resultHand: false/true}
 * @param {*} dataObj Recognition statistic object
 * @returns dataObj in Notation: { predLabel: X, predHand: X, factLabel: Y, factHand: Y, resultLabel: false/true, resultHand: false/true}
 */
async function updateRecognitionStatistic(dataObj) {
  return new Promise(async function (resolve, reject) {
    if (dataObj != null) {
      fs.writeFile(punch_recognition_stats_path, JSON.stringify(dataObj), (err) => {
        if (err) {
          console.log("Error while updating punch recognition statistics: " + err.message);
          reject(null);
        } else {
          resolve(dataObj);
        }
      });
    } else {
      reject(null);
    }
  });
}

/*
 * /////////////////////////////////////////////////////////////////
 * API routes:
 * /////////////////////////////////////////////////////////////////
 */

/**
 * Deletes the statistics with replacing the current stats file with a empty file.
 */
router.post('/deletestats', async (req, res) => {
  try {
    // set Headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // authorization
    if (req.body.username == secrets.APIUSER &&
      req.body.password == secrets.APIACCESS) {

      loadRecognitionStatistics(clear_punch_recognition_stats_path).then((clearStatsData) => {

        updateRecognitionStatistic(clearStatsData).then((result) => {

          // delete current punch data
          savePunchData({});

          res.status(200).send({ result: true });
        }).catch(err => {
          res.status(500).send({ result: false, msg: 'Error while updating stats data!' });
        });
      }).catch(err => {
        console.log("Error while requesting punch-data.");
        res.status(500).send({
          message: "Could-not-load-data"
        });
      });
    }
    else {
      // authentication failed
      res.status(511).send({ result: false, msg: 'Authentication failed. Wrong password.' });
    }
  } catch (err) {
    // undefined error.
    console.log("Error report: " + err.message);
    res.status(500).send({
      message: "Could-not-load-data"
    });
  }
});


/**
 * Updates the statistics file on filesystem.
 */
router.post('/updatestats', async (req, res) => {
  try {
    let result = true;

    // Set Headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log("received: " + req);

    // Check Authorization
    if (req.body.username == secrets.APIUSER &&
      req.body.password == secrets.APIACCESS) {
      console.log("[js] received update stats request.");

      console.log(JSON.stringify(req.body));
      let statsData = (req.body.statsData);

      updateRecognitionStatistic(statsData).then((result) => {

        // Delete current punch data
        savePunchData({});

        res.status(200).send(JSON.stringify(statsData));
      }).catch(err => {
        res.status(500).send({ statsdata: false, msg: 'Error while updating stats data!' });
      });
    }
    else {
      // Authentication failed
      res.status(511).send({ statsdata: false, msg: 'Authentication failed. Wrong password.' });
    }
  } catch (err) {
    // Undefined error.
    console.log("Error report: " + err.message);
  }
});

/**
 * Returns the current recognition statistic.
 */
router.get('/recognitionstats', async (req, res) => {
  loadRecognitionStatistics(punch_recognition_stats_path).then((result) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.stringify(result));
  }).catch(err => {
    console.log("Error while requesting punch-data.");
    res.status(500).send({
      message: "Could-not-load-data"
    });
  });
});

/**
 * Returns the punch data (accelerometer data) of the
 * last punch.
 */
router.get('/punchdata', async (req, res) => {
  loadPunchData().then((result) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.stringify(result));
  }).catch(err => {
    console.log("Error while requesting punch-data.");
    res.status(500).send({
      message: "Could-not-load-data"
    });
  });
});


/**
 * Checks wheater the backend api routes are available.
 */
router.get('/servercheck', function (req, res) {
  try {
    res.status(200).send({
      message: "OK"
    });
  } catch (err) {
    // error - backend not ready
    res.status(500).send(null);
  }
});

/**
 * Checking wheater the username and password of the webinterface is valid.
 */
router.post('/apicheck', async (req, res) => {
  try {
    // Set Headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Authorization
    if (req.body.username == secrets.APIUSER &&
      req.body.password == secrets.APIACCESS) {

      res.status(200).send({ result: true, msg: 'API connected!' });
    }
    else {
      // Authentication failed
      res.status(511).send({ result: false, msg: 'Authentication failed. Wrong password.' });
    }
  } catch (err) {
    // Undefined error
    console.log("Error report: " + err.message);
    res.status(500).send({ result: false, msg: 'Error while calling api!' });
  }
});


/**
 * Stores new annotation data in database. Make sure that a database connection is established.
 */
router.post('/newannodata', function (req, res) {
  try {
    let result = true;

    // Check authorization
    if (req.body.username == secrets.APIUSER &&
      req.body.password == secrets.APIACCESS) {
      console.log("received datasets: " + req.body.gen_ds_size);

      // Get dataset size
      let datasetCount = req.body.gen_ds_size;
      let newDatabaseEntry;

      // For each received rawdata create a RawData Model and store all
      // RawDatas in an array. Then create a new DataSet Model and import the
      // rawdata array to that model. See model declaration for more.
      for (let i = 0; i < datasetCount; i++) {
        newRaws = [];

        // Fetch all raws
        for (let rawI = 0; rawI < req.body.data_datasets[i].raws.length; rawI++) {

          let newRaw = new RawData({
            timestamp: req.body.data_datasets[i].raws[rawI].timestamp,
            x: req.body.data_datasets[i].raws[rawI].x,
            y: req.body.data_datasets[i].raws[rawI].y,
            z: req.body.data_datasets[i].raws[rawI].z
          });

          // Append raw to raw array
          newRaws.push(newRaw);
        }

        // Create new dataset obj
        newDatabaseEntry = new DataSet({
          label: req.body.data_datasets[i].label,
          hand: req.body.data_datasets[i].hand,
          annotator: req.body.data_datasets[i].annotator,
          count: req.body.data_datasets[i].count,
          periodNS: req.body.data_datasets[i].periodNS,
          raws: newRaws
        });

        // Save entry in database
        DataSet.create(newDatabaseEntry, function (err, post) {
          if (err) {
            console.log("saving new database entry failed. message: " + err.message);
            result = false;
          } else {
            console.log("Saved dataset: " + cheatedCurrentAnnotationsNumber + " for: " + cheatedAnnotator[cheatedAnnotatorNumb] + "with " + cheatedHands[cheatedHandsNumb] + " hand.");
          }
        });
      }

      // Everything ok
      if (result) {
        res.status(200).send("insert-ok");
      } else {
        // Error while saving new dataset(s)
        console.log("operation failed!");
        res.status(500).send(null);
      }
    }
    else {
      // Authentication failed
      res.status(511).send({ success: false, msg: 'Authentication failed. Wrong password.' });
    }
  } catch (err) {
    // Undefined error.
    console.log(err.message);
    res.status(500).send(null);
  }
});

/**
 * Route to classify punch data directly from the watch.
 */
router.post('/classify', async (req, res) => {
  try {
    let result = true;

    // Check authorization
    if (req.body.username == secrets.APIUSER &&
      req.body.password == secrets.APIACCESS) {
      console.log("[js] received classification request.");

      // Get dataset size
      let datasetCount = req.body.gen_ds_size;
      let newDatabaseEntry;

      // For each received rawdata create a RawData Model and store all
      // RawDatas in an array. Then create a new DataSet Model and import the
      // rawdata array to that model. See model declaration for more.
      for (let i = 0; i < datasetCount; i++) {
        newRaws = [];

        // fetch all raws
        for (let rawI = 0; rawI < req.body.data_datasets[i].raws.length; rawI++) {

          let newRaw = new RawData({
            timestamp: req.body.data_datasets[i].raws[rawI].timestamp,
            x: req.body.data_datasets[i].raws[rawI].x,
            y: req.body.data_datasets[i].raws[rawI].y,
            z: req.body.data_datasets[i].raws[rawI].z
          });

          // append raw to raw array
          newRaws.push(newRaw);
        }

        // create new dataset obj
        newDatabaseEntry = new DataSet({
          label: req.body.data_datasets[i].label,
          hand: req.body.data_datasets[i].hand,
          annotator: req.body.data_datasets[i].annotator,
          count: req.body.data_datasets[i].count,
          periodNS: req.body.data_datasets[i].periodNS,
          raws: newRaws
        });

        // // save entry in database
        // DataSet.create(newDatabaseEntry, function (err, post) {
        //   if (err) {
        //     console.log("saving new database entry failed. message: " + err.message);
        //     result = false;
        //   } else {
        //     //console.log("saved new dataset(s) to db. Annotator: " + req.body.data_datasets[i].annotator);
        //     console.log("Saved dataset: " + cheatedCurrentAnnotationsNumber + " for: " + cheatedAnnotator[cheatedAnnotatorNumb] + "with " + cheatedHands[cheatedHandsNumb] + " hand.");
        //   }
        // });
      }

      // Object to send to python script: 
      let buffer = [];
      buffer.push(newDatabaseEntry);

      // Send punch data in json notation to script
      scriptExecution.stdin.write(JSON.stringify(buffer) + '\n');

      let waiting_buffer = setInterval(() => {
        if (predictionFinished) {
          clearInterval(waiting_buffer);
          console.log("finished waiting");
          predictionFinished = false;
          res.status(200).send({ success: true, class: prediction_message_to_speak });

          // Save punch data and prediction results to filesystem
          buffer.push({ 'predictedLabel': predictedLabel, 'predictedHand': predictedHand });
          savePunchData(buffer);
          prediction_message_to_speak = "";
          return;
        }
      }, refreshCycleIntervallMS);
    }
    else {
      // Authentication failed
      res.status(511).send({ success: false, msg: 'Authentication failed. Wrong password.' });
    }
  } catch (err) {
    // Undefined error.
    console.log("Error report: " + err.message);
    res.status(500).send(null);
  }
});


module.exports = router;
