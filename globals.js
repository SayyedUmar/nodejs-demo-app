global._ = require(`lodash`)
global.__basedir = __dirname
global.router = express.Router()
global.multer = require(`multer`)
global.upload = multer()
global.Sequelize = require('sequelize')
global.Op = Sequelize.Op

global.moment = require('moment');
global.db = require(`./config/db/billHubdbConn`)
// global.response = require('./helper/formatResponse')
global.apiResponse = require('./helper/formatResponse')

global.errorCode = require(`./config/errorCode/errorCode`)
global.errorResponse = require(`./helper/errorResponse`).errorResponse
global.request = require('request')

global.fs = require(`fs`)
global.json2xls = require('json2xls');
global.path = require(`path`)
global.mkdirp = require(`mkdirp`)
// global.FileType = require('file-type')
global.excelToJson = require('convert-excel-to-json')
global.Excel = require('exceljs')
global.JWT = require('jsonwebtoken')
global.Config = require('./configVariable')