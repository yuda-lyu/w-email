import path from 'path'
import fs from 'fs'
import WEmail from './src/WEmail.mjs'
//import WEmail from './dist/w-email.umd.js'


//ad
let fp = path.resolve('../', 'ad.txt')
let j = fs.readFileSync(fp, 'utf8')
let ad = JSON.parse(j)
console.log(ad)

//opt
let opt = {
    srcName: 'test name',
    srcEmail: ad.srcEmail,
    srcPW: ad.srcPW,
    srcHost: ad.srcHost,
    srcPort: ad.srcPort,
    emTitle: 'test title',
    emContent: '<h4>test head</h4>' + '<div>test content</div>',
    toEmails: 'firsemisphere@gmail.com',
    //toEmailsCC: 'firsemisphere@gmail.com',
    //toEmailsBCC: 'firsemisphere@gmail.com',
    emAttachments: {
        filename: 'att.txt',
        path: path.resolve('../', 'att.txt')
    }
}

//WEmail
new WEmail(opt)
    .then((msg) => {
        console.log('then', msg)
    })
    .catch((err) => {
        console.log('catch', err)
    })

//node --experimental-modules --es-module-specifier-resolution=node g.mjs
