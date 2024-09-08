"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
// Middleware to parse JSON request bodies
app.use(express.json());
app.get('/', function (req, res, next) {
    var data = (0, rxjs_1.interval)(1000).pipe((0, rxjs_1.switchMap)(function () { return (0, rxjs_1.of)(1, 2, 3, 4, 5); }), (0, rxjs_1.take)(5));
    data.subscribe({
        next: function (value) {
            console.log("Received value: ".concat(value));
            res.write(JSON.stringify(value));
        },
        error: function (error) {
            console.error("Error: ".concat(error));
        },
        complete: function () {
            console.log('Request processed');
            res.end('finally');
        }
    });
});
app.post('/login/', function (req, res, next) {
    console.log('Received POST request');
});
app.listen(port, function () { return console.log('listening on port' + port); });
