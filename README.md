# w-email
A wrapper nodemailer for email.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-email.svg?style=flat)](https://npmjs.org/package/w-email) 
[![Build Status](https://travis-ci.org/yuda-lyu/w-email.svg?branch=master)](https://travis-ci.org/yuda-lyu/w-email) 
[![license](https://img.shields.io/npm/l/w-email.svg?style=flat)](https://npmjs.org/package/w-email) 
[![gzip file size](http://img.badgesize.io/yuda-lyu/w-email/master/dist/w-email.umd.js.svg?compression=gzip)](https://github.com/yuda-lyu/w-email)
[![npm download](https://img.shields.io/npm/dt/w-email.svg)](https://npmjs.org/package/w-email) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-email.svg)](https://www.jsdelivr.com/package/npm/w-email)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-email/global.html).

## Installation
### Using npm(ES6 module):
> **Note:** `w-email` depends on `nodemailer`.
```alias
npm i w-email
```
#### Example:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-email/blob/master/srv.mjs)]
```alias
import WEmail from 'w-eamil'

//opt
let opt = {
    srcName: 'test name',
    srcEmail: 'your email',
    srcPW: 'your password',
    emTitle: 'test title',
    emContent: '<h4>test head</h4>'+'<div>test content</div>',
    toEmails: 'to email',
    //toEmailsCC: 'to email',
    //toEmailsBCC: 'to email',
    emAttachments: {
        filename: 'your filename',
        path: 'your filepath'
    }
}

//WEmail
new WEmail(opt)
    .then((msg)=>{
        console.log('then',msg)
    })
    .catch((err)=>{
        console.log('catch',err)
    })
```
