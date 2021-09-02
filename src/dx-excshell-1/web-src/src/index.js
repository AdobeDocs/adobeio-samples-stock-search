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

import '@adobe/focus-ring-polyfill';
import { connectToParent } from 'penpal';
import config from './config.json';

let parent;

const setParentHeight = () => parent && parent.setHeight(`${document.body.scrollHeight}px`);

const showSign = () => {
  signIn.hidden = false;
  
  signInButton.onclick = () => parent && parent.signIn();
};

window.addEventListener('load', async () => {
  // Init connection
  parent = await connectToParent({
    methods: {
      onShow: () => {},
      onHide: () => {}
    },
    timeout: 5000,
    debug: true
  }).promise;
  
  // Get User Info
  const user = await parent.getIMSAccessToken();
  
  if (user?.token) {
    search.hidden = false;
    
    // Handle search form
    search.onsubmit = async (event) => {
      event.preventDefault();
      
      loading.hidden = false;
      results.hidden = true;
  
      const formData = new FormData(search);
      const searchParams = new URLSearchParams(formData).toString();
  
      const headers = {};
      if (window.location.hostname === 'localhost') {
        headers['x-ow-extra-logging'] = 'on'
      }
      
      headers['Authorization'] = `Bearer ${user.token}`;
      
      // Call I/O Runtime Action
      const req = await fetch(`${config['stock-search']}?${searchParams}`, {
        headers
      });
      const res = await req.json();
      
      if (res?.files) {
        if (res.files.length) {
          results.innerHTML = res.files.map(({details_url, thumbnail_html_tag, thumbnail_width, title}) => `
          <div style="max-width: ${thumbnail_width}px;">
            <a target="_blank" href="${details_url}">${thumbnail_html_tag}</a>
            <p class="spectrum-Body spectrum-Body--sizeS">${title}</p>
          </div>
        `).join('');
        }
        else {
          results.innerHTML = `<p class="spectrum-Body spectrum-Body--sizeM">No results found for <strong>${formData.get('words')}</strong></p>`;
        }
  
        loading.hidden = true;
        results.hidden = false;
  
        // 1s for images to load
        setTimeout(() => {
          setParentHeight();
        }, 1000);
      }
      else if (req.status === 403) {
        showSign();
        
        loading.hidden = true;
        search.hidden = true;
        results.hidden = true;
  
        setParentHeight();
      }
    };
  }
  else {
    showSign()
  }
});