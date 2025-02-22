#!/bin/bash
cd /opt/render/project/src/server/build
npm ci --production=true
node app.js
