const express = require("express");
const morgan = require("morgan");
const app = express();
const path = require("path");
app.use(morgan("dev"));

app.use(function (req, res, next) {
  res.setHeader("Cache-Control", "no-cache");
  return next();
});
app.use(express.static(path.join(__dirname, "static")));
app.listen(8001);
