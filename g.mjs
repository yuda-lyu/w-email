import WEmail from './src/WEmail.mjs'
//import WEmail from './dist/w-email.umd.js'
import fs from 'fs'


//ad
let j = fs.readFileSync('D:\\開源-JS-003-2-w-email\\ad.txt', 'utf8')
let ad = JSON.parse(j)

//opt
let opt = {
    srcName: 'test name',
    srcEmail: ad.srcEmail,
    srcPW: ad.srcPW,
    emTitle: 'test title',
    emContent: '<h4>test head</h4>' + '<div>test content</div>',
    toEmails: 'firsemisphere@gmail.com',
    //toEmailsCC: 'firsemisphere@gmail.com',
    //toEmailsBCC: 'firsemisphere@gmail.com',
    emAttachments: {
        filename: 'att.txt',
        path: 'D:\\開源-JS-003-2-w-email\\att.txt'
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
