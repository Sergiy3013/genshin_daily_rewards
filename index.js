core = require('@actions/core');
require('dotenv').config()
hoyolab = require("./hoyolab")

hoyolab.start(JSON.parse(process.env.HOYOLAB_COOKIES))