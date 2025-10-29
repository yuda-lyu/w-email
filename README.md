# w-email
A wrapper nodemailer for email.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-email.svg?style=flat)](https://npmjs.org/package/w-email) 
[![license](https://img.shields.io/npm/l/w-email.svg?style=flat)](https://npmjs.org/package/w-email) 
[![npm download](https://img.shields.io/npm/dt/w-email.svg)](https://npmjs.org/package/w-email) 
[![npm download](https://img.shields.io/npm/dm/w-email.svg)](https://npmjs.org/package/w-email) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-email.svg)](https://www.jsdelivr.com/package/npm/w-email)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-email/global.html).

## Installation

### Using npm(ES6 module):
```alias
npm i w-email
```

#### Example:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-email/blob/master/g.mjs)]
```alias
import WEmail from 'w-email'

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
