import WEmail from './src/WEmail.mjs'
//import WEmail from './dist/w-email.umd.js'
import fs from 'fs'

//ad
let j=fs.readFileSync('D:\\開源-Javascript-w-email\\ad.txt', 'utf8')
let ad=JSON.parse(j)

//opt
let opt = {
    srcName: 'test name',
    srcEmail: ad.srcEmail,
    srcPW:ad.srcPW,
    emTitle: 'test title',
    emContent: '<h4>test head</h4>'+'<div>test content</div>',
    emEmails: 'firsemisphere@gmail.com',
    //emEmailsCC: 'firsemisphere@gmail.com',
    //emEmailsBCC: 'firsemisphere@gmail.com',
    attachments: {
        filename: 'att.txt',
        path: 'D:\\開源-Javascript-w-email\\att.txt'
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