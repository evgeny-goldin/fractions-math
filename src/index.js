'use strict';

const {map} = require('lodash');

const DevNodeVersion = 13;
const NodeVersion = ((process.versions.node || '').split('.') || [])[0] || 0;

if (NodeVersion < DevNodeVersion) {
    console.warn(` -=-= Warning: this application was developed and tested using Node.js ${DevNodeVersion} - ` +
                 `but your Node version is ${process.versions.node} =-=-`);
}