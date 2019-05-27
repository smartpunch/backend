/**
 * DataSet object schema
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Database model for RawData
var RawData = new Schema({
  timestamp: {
    type: String,
    unique: false,
    required: true
  },
  x: {
    type: Number,
    required: true,
    unique: false,
  },
  y: {
    type: Number,
    required: true,
    unique: false,
  },
  z: {
    type: Number,
    required: true,
    unique: false,
  }
});

// Database model for DataSet
var DataSetSchema = new Schema({
  label: {
    type: String,
    required: true
  },
  hand: {
    type: String,
    required: true
  },
  annotator: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  periodNS: {
    type: Number,
    required: true
  },
  raws: [RawData]
}, { timestamps: true });

module.exports = {
  // Sets the collection for the DataSet Schema. Collection: nativeannotateddatasets (in database specified in database.js (config))
  DataSet: mongoose.model('DataSet', DataSetSchema, 'nativeannotateddatasets'),
  // RawData has no own collection because the rawdata is embedded in the DataSet(s). So only the Schema is exported
  RawData: mongoose.model('RawData', RawData)
}