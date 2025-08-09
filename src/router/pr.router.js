'use strict';

const express = require('express');
const prController = require('../controller/prController');
const prRouter = express.Router();

prRouter
    .post('/processPR', prController.processPR.bind(prController))
    .get('/getPR/:id', prController.getPR.bind(prController))
    .get('/getAllPRs', prController.getAllPRs.bind(prController))
    .put('/updatePR/:id', prController.updatePR.bind(prController))
    .delete('/deletePR/:id', prController.deletePR.bind(prController));

module.exports = prRouter;
