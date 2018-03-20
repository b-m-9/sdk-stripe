'use strict';
const install_npm = require('npm-install-package');
const KEY_PAY = __dirname.split('payments/')[1];
module.exports.name = 'Stripe';
module.exports.description = '';
module.exports.key = KEY_PAY;
module.exports.currency = ['USD', 'EUR'];
module.exports.MerchantClass = require('./lib/merchant');
module.exports.ApiClass = require('./lib/api');
module.exports.config = require('./config');
module.exports.install = new Promise((resolve, reject) => {
    install_npm(['stripe'], {}, err => {
        if (err) return reject(err);
        return resolve(KEY_PAY);
    });
});
