const cluster = require('cluster');
const os = require('os');
const http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// simple in-memory usage store
var visits = [];
app.visits = visits;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// API
if (cluster.isMaster) {
    // Keep track of http requests
      let numReqs = 0;
      setInterval(() => {
        console.log(`numReqs = ${numReqs}`);
      }, 1000);

      // Count requests
      function messageHandler(msg) {
        if (msg.cmd && msg.cmd === 'notifyRequest') {
          numReqs += 1;
        }
      }
    const cpuCount = os.cpus().length;
    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

     for (const id in cluster.workers) {
        cluster.workers[id].on('message', messageHandler);
      }
    // Restarting the fork process as they will terminate due to exceptions
    cluster.on('exit', (worker) => {
        console.log(worker.id, ' is terminated!');
        cluster.fork();
    });
}
else{
        http.Server((req, res) => {
        res.end('The Bee Hive');
            // Notify master about the request
            process.send({ cmd: 'notifyRequest' });
          }).listen(3000);

    console.log(`Worker ${process.pid} started`);
}
require('./routes/api/visits')(app);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
