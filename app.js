global.express = require(`express`)
const bodyParser = require(`body-parser`)
const expressValidator = require(`express-validator`)
const helmet = require('helmet')
const cors = require(`cors`)

require('dotenv').config()
require(`./globals`)
const app = express()
//app.use(cors());
// const mongoDb = require(`./config/db/mongoDbConn`)

// parse application/x-www-form-urlencoded
//app.use(helmet.frameguard())
//app.use(helmet.frameguard({  action: 'allow-from',  domain: 'http//13.126.117.178:8081'}))
//app.use(helmet());
/*
app.use(
  helmet.frameguard({
    action: "SAMEORIGIN",
  })
);
*/
app.use((req, res, next) => {
  bodyParser.json()(req, res, err => {
    if (err) {
      console.error(err)
      let errObj = {
        code: 400,
        status: 'fail',
        message: 'Invalid request/Bad request'
      }
      return res.send(errObj) // Bad request
    }
    next()
  })
})
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '20mb'
}))
app.set('etag', false)

// cors
app.use(function (req, res, next) {
  res.removeHeader('X-Powered-By')

  var allowedOrigins = ['http://13.235.195.93:3003', 'http://13.235.195.93:8081', 'http://13.235.195.93:3001', 'http://13.235.195.93:3006', 'http://13.235.195.93:8080', 'http://localhost:4200', 'http://billhubfrontend.devmll.com']
  var origin = req.headers.origin
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST,OPTIONS') //, PUT, UPDATE, DELETE, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, userid, authToken, appid, appToken, deviceType, responsetype,accesstoken')
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'")
  res.setHeader("X-Frame-Options", "SAMEORIGIN")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next()
})

app.use(express.static('public/uploads/'))

app.use(expressValidator())

global.__basedir = __dirname

// ping api to check application status
app.get('/ping', (req, res) => res.send('Hello World'))

// route to router.js file
app.use('/api/v1', require('./router'))

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`app listening on ${port} port!!`))