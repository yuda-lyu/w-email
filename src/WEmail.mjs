import nodemailer from 'nodemailer'
import get from 'lodash/get'
import genPm from 'wsemi/src/genPm.mjs'
import isstr from 'wsemi/src/isstr.mjs'
import isobj from 'wsemi/src/isobj.mjs'


function isEmail(email) {
    let r = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return r.test(String(email).toLowerCase())
}


/**
 * 寄送email
 *
 * @param {*} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.srcName='system by w-email'] 輸入寄件人顯示名稱字串，預設'system by w-email'
 * @param {String} opt.srcEmail 輸入寄件人email信箱字串
 * @param {String} opt.srcPW 輸入寄件人email密碼字串
 * @param {String} [opt.srcHost='smtp.gmail.com'] 輸入郵件伺服器位址，預設'smtp.gmail.com'
 * @param {String} [opt.srcPort=587] 輸入郵件伺服器連接埠，預設587
 * @param {String} [opt.emTitle=''] 輸入郵件名稱字串，預設''
 * @param {String} [opt.emContent=''] 輸入郵件訊息字串，預設''
 * @param {String|Array} [opt.emEmails=[]] 輸入收件人email字串或陣列，預設[]
 * @param {String|Array} [opt.emEmailsCC=[]] 輸入副本收件人email字串或陣列，預設[]
 * @param {String|Array} [opt.emEmailsBCC=[]] 輸入密件副本收件人email字串或陣列，預設[]
 * @param {Object|Array} [opt.attachments=[]] 輸入附件物件或陣列，預設[]，物件內需包含filename與path
 * @example
 * import WEmail from 'w-eamil'
 * 
 * //opt
 * let opt = {
 *     srcName: 'test name',
 *     srcEmail: 'your email',
 *     srcPW: 'your password',
 *     emTitle: 'test title',
 *     emContent: '<h4>test head</h4>'+'<div>test content</div>',
 *     emEmails: 'to email',
 *     //emEmailsCC: 'to email',
 *     //emEmailsBCC: 'to email',
 *     attachments: {
 *         filename: 'your filename',
 *         path: 'your filepath'
 *     }
 * }
 * 
 * //WEmail
 * new WEmail(opt)
 *     .then((msg)=>{
 *         console.log('then',msg)
 *     })
 *     .catch((err)=>{
 *         console.log('catch',err)
 *     })
 */
function email(opt = {}) {
    let pm = genPm()

    //寄件人顯示名稱
    let srcName = get(opt, 'srcName', 'system by w-email')

    //寄件人email信箱
    let srcEmail = get(opt, 'srcEmail', '')
    if (!isEmail(srcEmail)) {
        pm.reject('srcEmail is not email')
        return pm
    }

    //寄件人email密碼
    let srcPW = get(opt, 'srcPW', '')

    //郵件伺服器位址
    let srcHost = get(opt, 'srcHost', 'smtp.gmail.com')

    //郵件伺服器連接埠
    let srcPort = get(opt, 'srcPort', 587)

    //郵件名稱
    let emTitle = get(opt, 'emTitle', '')

    //郵件訊息
    let emContent = get(opt, 'emContent', '')

    //收件人email
    let emEmails = get(opt, 'emEmails', [])
    if (isstr(emEmails)) {
        emEmails = [emEmails]
    }

    //副本收件人email
    let emEmailsCC = get(opt, 'emEmailsCC', [])
    if (isstr(emEmailsCC)) {
        emEmailsCC = [emEmailsCC]
    }

    //密件副本收件人email
    let emEmailsBCC = get(opt, 'emEmailsBCC', [])
    if (isstr(emEmailsBCC)) {
        emEmailsBCC = [emEmailsBCC]
    }

    //附件
    let attachments = get(opt, 'attachments', [])
    if (isobj(attachments)) {
        attachments = [attachments]
    }
    // [{
    //     filename: 'text01.txt',
    //     content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
    // }, {
    //     filename: 'unnamed.jpg',
    //     path: '/Users/Weiju/Pictures/unnamed.jpg'
    // }]

    //transporter
    let transporter = nodemailer.createTransport({
        host: srcHost,
        secureConnecton: true,
        port: srcPort,
        auth: {
            user: srcEmail,
            pass: srcPW
        }
    })

    //optt
    let optt = {
        from: `${srcName} <${srcEmail}>`,
        to: emEmails.join(','),
        cc: emEmailsCC.join(','),
        bcc: emEmailsBCC.join(','),
        subject: emTitle,
        html: emContent,
        attachments: attachments
    }

    //sendMail
    transporter.sendMail(optt, function(err, info) {
        if (err) {
            pm.reject(err)
        }
        else {
            pm.resolve(info.response)
        }
    })

    return pm
}


export default email
