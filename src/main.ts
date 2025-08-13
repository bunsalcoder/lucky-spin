/* eslint-disable vue/multi-word-component-names */
/* eslint-disable vue/no-reserved-component-names */

/*
 * I have noticed that there are malicious individuals who steal our website content and add malicious code to collect user location and send back to the their own server.
 * To protect against such actions, we will implement a mechanism to verify the host when the webpage is being loaded, and if necessary, redirect users to the appropriate website when they access the proxy site.
 * Please be aware that you are solely permitted to distribute this project under the "AGPL-3.0" license.
 * If you have adhered to the terms of this license, you are welcome to make modifications to this section as needed.
 */
if (
  !window.location.hostname.endsWith('spin-wheel.click') &&
  window.location.hostname !== 'localhost'
) {
  window.location.href =
    'https://unfair.spin-wheel.click' + window.location.pathname + window.location.search;
}

import { createApp } from 'vue';
import App from '@/App.vue';
import PrimeVue from 'primevue/config';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DynamicDialog from 'primevue/dynamicdialog';
import DialogService from 'primevue/dialogservice';

//theme
import 'primevue/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.scss';
import 'shareon/css';
import '@/assets/app.scss';
import '@/assets/OBS.scss';
if (navigator.userAgent.indexOf('OBS') !== -1) {
  document.body.classList.add('obs');
}

import SpinWheel from '@/components/SpinWheel.vue';
import Footer from '@/components/Footer.vue';

const app = createApp(App);
app.use(PrimeVue, {
  ripple: true,
  pt: {
    tabPanel: {
      headerTitle: {
        style: {
          fontWeight: '400'
        }
      }
    }
  }
});
app.use(DialogService);

app.component('Button', Button);
app.component('Dialog', Dialog);
app.component('DynamicDialog', DynamicDialog);

app.component('SpinWheel', SpinWheel);
app.component('Footer', Footer);

app.mount('#app');
