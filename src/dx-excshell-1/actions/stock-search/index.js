/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');
const { Ims } = require('@adobe/aio-lib-ims');
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils');

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action');

    // Log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Check for missing request input parameters and headers
    const requiredParams = ['words'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // Return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    // Extract the user Bearer token from the Authorization header
    const token = getBearerToken(params);
    
    // Validate token
    const ims = new Ims();
    const imsValidation = await ims.validateToken(token);
    
    if (imsValidation.valid) {
      const apiEndpoint = 'https://stock.adobe.io/Rest/Media/1/Search/Files';
      
      const results = [];
      results.push('result_columns[]=title');
      results.push('result_columns[]=details_url');
      results.push('result_columns[]=thumbnail_html_tag');
      results.push('result_columns[]=thumbnail_width',);
      
      // Call Stock API
      const res = await fetch(`${apiEndpoint}?search_parameters[words]=${params.words}&${results.join('&')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': params.STOCK_API_KEY,
          'X-Product': params.STOCK_X_PRODUCT
        }
      });
      if (!res.ok) {
        return errorResponse(res.status, `failed fetching ${apiEndpoint}`, logger);
      }
      const body = await res.json();
      const response = {
        statusCode: 200,
        body
      };
  
      // Log the response status code
      logger.info(`${response.statusCode}: successful request`);
      return response
    }
    else {
      // Return and log client errors
      return errorResponse(403, 'invalid token', logger);
    }
  } catch (error) {
    // Log any server errors
    logger.error(error);
    // Return with 500
    return errorResponse(500, 'server error', logger);
  }
}

exports.main = main;
