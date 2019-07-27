import nodemailer from 'nodemailer'
import get from 'lodash/get'
import genPm from 'wsemi/src/genPm.mjs'
import isstr from 'wsemi/src/isstr.mjs'
import isobj from 'wsemi/src/isobj.mjs'
import isEmail from 'wsemi/src/isEmail.mjs'


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
 * @param {String|Array} [opt.toEmails=[]] 輸入收件人email字串或陣列，預設[]
 * @param {String|Array} [opt.toEmailsCC=[]] 輸入副本收件人email字串或陣列，預設[]
 * @param {String|Array} [opt.toEmailsBCC=[]] 輸入密件副本收件人email字串或陣列，預設[]
 * @param {Object|Array} [opt.emAttachments=[]] 輸入附件物件或陣列，預設[]，物件內需包含filename與path
 * @returns {Promise} 回傳Promise，resolve回傳成功訊息，reject回傳錯誤訊息
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
 *     toEmails: 'to email',
 *     //toEmailsCC: 'to email',
 *     //toEmailsBCC: 'to email',
 *     emAttachments: {
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

    //附件
    let emAttachments = get(opt, 'emAttachments', [])
    if (isobj(emAttachments)) {
        emAttachments = [emAttachments]
    }

    //收件人email
    let toEmails = get(opt, 'toEmails', [])
    if (isstr(toEmails)) {
        toEmails = [toEmails]
    }

    //副本收件人email
    let toEmailsCC = get(opt, 'toEmailsCC', [])
    if (isstr(toEmailsCC)) {
        toEmailsCC = [toEmailsCC]
    }

    //密件副本收件人email
    let toEmailsBCC = get(opt, 'toEmailsBCC', [])
    if (isstr(toEmailsBCC)) {
        toEmailsBCC = [toEmailsBCC]
    }

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
        to: toEmails.join(','),
        cc: toEmailsCC.join(','),
        bcc: toEmailsBCC.join(','),
        subject: emTitle,
        html: emContent,
        attachments: emAttachments
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
