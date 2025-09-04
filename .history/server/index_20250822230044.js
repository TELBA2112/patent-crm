const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // Auth routelari
const jobRoutes = require('./routes/jobs'); // Jobs routelari