"use strict";
const crypto  = require('crypto');

/*
    @succes_url: https://proexchanger.net/payments/check/success/liqpay
    @fail_url: https://proexchanger.net/payments/check/error/liqpay
    @status_url: https://proexchanger.net/payments/check/status/liqpay
 */
class Merchant {
    constructor(public_key, private_key, options) {
        this.name = 'liqpay';
        this.version = '3';
        if (!public_key) throw Error('m_shop is not correct (Merchant settings ID:)');
        if (!private_key) throw Error('m_key is not correct (Merchant settings Secret key:)');

        if (!options || !options.db) {
            //fs
            this.db = null;
            this.db_type = 'fs';

        } else {
            this.db = options.db;
            this.db_mongoose = require("mongoose");
            this.db_type = 'mongodb';
            //mongodb
        }

        if (options && options.express) {
            //create express route
        }
        this.debug = false;
        if (options && options.debug === true)
            this.debug = true;
        if (options && options.version)
            this.version = options.version;
        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'constructor', public_key, private_key);


        this.public_key = public_key;
        this.private_key = private_key;
    }


    checkOptions(options) {
        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'checkOptions', options);

        if (!this.version) return Promise.reject('version undefined');
        if (isNaN(+options.amount)) return Promise.reject('amount NaN');
        if (+options.amount < 0) return Promise.reject('amount < 0');
        if (!options.currency) return Promise.reject('currency undefined');
        if (!options.order_id) return Promise.reject('order_id undefined');
        if (['USD', 'EUR', 'RUB','UAH'].indexOf(options.currency.toUpperCase()) === -1) return Promise.reject('currency is not valid [UAH,USD, EUR, RUB]');
        return Promise.resolve(options);
    }

    async formaterData(options) {

        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'formaterData in', options);
        let checkOptions = await this.checkOptions(options);
        if (!checkOptions) {
            console.error('[Pay]->Merchant->' + this.name + ', Error function getHash! return checkOptions:', checkOptions);
            return Promise.reject('[Pay]->Merchant->' + this.name + ', Error function getHash! return checkOptions#1');
        }
        let desc = '';
        if (options.m_desc)
            desc = new Buffer(options.m_desc).toString('base64');
        let result = {
            version: this.version,
            public_key: this.public_key,
            action: 'pay',
            amount: (+options.amount).toFixed(2),
            currency: options.currency.toUpperCase(),
            description: options.description ,
            order_id: options.order_id,
            type:"buy",
            language:"ru"

        };
        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'formaterData result', result);
        return Promise.resolve(result);
    }

    async getHash(options) {
        let data = await this.formaterData(options);
        if (data === null) {
            console.error('getHash null ^^^');
            return Promise.reject('[Pay]->Merchant->' + this.name + ', Error function getHash! return checkOptions:'+JSON.stringify(options));


        }

        let string_hash = new Buffer(JSON.stringify(data)).toString('base64');
        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'string_to_hash', string_hash);

        let sha1 = crypto.createHash('sha1').update(this.private_key + string_hash + this.private_key).digest('base64');
        if (this.debug) console.log('[Pay]->Merchant->' + this.name + ',' + 'hash_sha1', sha1);
        return Promise.resolve(sha1);

    }

    getOrderId(options) {
        return new Promise((resolve, reject) => {
            options.order_id = 'ORDER_'+(new Date().getTime());
            resolve(options);
        });
    }

    async createPaymet(options) {
        if (!options.order_id)
            options.order_id = await this.getOrderId(options);
        let form = await this.formaterData(options);
        let hash = await this.getHash(options);

        let data = {
            data:new Buffer(JSON.stringify(form)).toString('base64'),
            signature: hash
        };
        let res = {action: 'redirect', metod: 'post', data: data, url: 'https://www.liqpay.ua/api/3/checkout'};
        return res;
    }

    checkPayment(options) {
        return options;
    }


}


module.exports = Merchant;