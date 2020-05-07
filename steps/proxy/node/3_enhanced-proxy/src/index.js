/*
 * Copyright (C) 2017 CriticalBlue, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const api = require('./api/nasa');
const app = require('express')();
const config = require('./config');
const approov = require('./approov-token-check')
const log = require('./logging')

const proxyPort = config.PROXY_PORT
const approovHeaderName = config.APPROOV_HEADER_NAME;

function log_request(req, res, next) {

  log.raw('-------------------------------- NEW REQUEST --------------------------------')

  const request = JSON.stringify({
    originalUrl: req.originalUrl,
    params: req.params,
    headers: req.headers,
  }, null, '  ')

  log.debug(request);

  next()
}

app.use('*', log_request);

// Handles request to the root entry point.
app.get('/', (req, res) => {
  log.info('ENDPOINT: /');
  res.status(200).send('Astropik Reverse Proxy...');
});

// Handles errors in the request
app.use((err, req, res, next) => {
  log.fatalError(`Internal Server Error: ${err}`);
  res.status(500).send('Internal Server Error');
});

app.use('/*', approov.checkApproovToken)

app.use('/*', approov.handlesApproovTokenError)

app.use('/*', approov.handlesApproovTokenSuccess)

// preprocess all proxy requests
api.routes(app)

// Starts the proxy server
app.listen(proxyPort, (err) => {
  if (err) {
    return log.fatalError(`Unexpected error tryng to listen on ${proxyPort}:`, err);
  }

  log.success(`Api proxy server is listening on ${proxyPort}`);
});
