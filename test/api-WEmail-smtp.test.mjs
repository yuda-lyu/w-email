import assert from 'assert'
import fs from 'fs'
import path from 'path'
import tls from 'tls'
import crypto from 'crypto'
import { simpleParser } from 'mailparser'
import WEmail from '../src/WEmail.mjs'
import { startFakeSmtp, getClosedPort } from './tools/fakeSmtp.mjs'
import genCert from './tools/genCert.mjs'


let fdTmp = path.resolve('./test/_tmp/api-WEmail-smtp')
let fpAtt = path.join(fdTmp, 'att.txt')
let fpAttZh = path.join(fdTmp, '附件.txt')
let fpBin = path.join(fdTmp, 'b.bin')


let sha1 = (b) => {
    return crypto.createHash('sha1').update(b).digest('hex')
}


let sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}


let settle = (p) => {
    return p.then((value) => {
        return { state: 'fulfilled', value }
    }, (value) => {
        return { state: 'rejected', value }
    })
}


let base = {
    srcName: 'test name',
    srcEmail: 'sender@example.com',
    srcPW: 'pw-123',
    emTitle: 'test title',
    emContent: '<div>test content</div>',
    toEmails: 'to1@example.com',
}


//send, 啟動假SMTP並以WEmail寄送, 回傳結果、各連線紀錄、含信件之連線與解析後信件
async function send(opt, srvOpt = {}) {
    let srv = await startFakeSmtp(srvOpt)
    let r
    try {
        r = await settle(new WEmail({ srcHost: '127.0.0.1', srcPort: srv.port, ...opt }))
        await sleep(100) //待客戶端送出QUIT
    }
    finally {
        await srv.close()
    }
    let sess = srv.sessions.find((s) => s.data !== null) || srv.sessions[0] || null
    let mail = sess && sess.data !== null ? await simpleParser(sess.data) : null
    return { r, sessions: srv.sessions, sess, mail }
}


describe('api-WEmail-smtp', function() {
    //spec(src/WEmail.mjs JSDoc): 以srcEmail與srcPW登入srcHost:srcPort寄信; 寄件人顯示名稱為srcName; 收件人、副本、密件為toEmails、toEmailsCC、toEmailsBCC;
    //主旨為emTitle, 內容以html寄送emContent, 附件為emAttachments; resolve回傳郵件伺服器回應字串(部分收件人被拒仍為resolve);
    //寄送失敗時reject Error物件(通常帶code); 輸入檢核失敗時不連線

    before(function() {
        fs.mkdirSync(fdTmp, { recursive: true })
        fs.writeFileSync(fpAtt, 'hello att 測試附件\nline2\n', 'utf8')
        fs.writeFileSync(fpAttZh, '中文檔名附件內容\n', 'utf8')
        fs.writeFileSync(fpBin, Buffer.from(Array.from({ length: 1024 }, (_, i) => (i * 37) % 256)))
    })

    after(function() {
        fs.rmSync(fdTmp, { recursive: true, force: true })
    })

    describe('寄送內容', function() {

        it('A01: 基本寄送, resolve伺服器回應, 以srcEmail登入, 信封與標頭正確', async function() {
            let { r, sess, mail } = await send(base)
            assert.strict.deepEqual(r, { state: 'fulfilled', value: '250 2.0.0 OK queued' }) //spec: resolve回傳郵件伺服器回應字串
            assert.strict.equal(sess.auth.user, 'sender@example.com')
            assert.strict.equal(sess.auth.pass, 'pw-123')
            assert.strict.equal(sess.mailFrom, 'sender@example.com')
            assert.strict.deepEqual(sess.rcptTo, ['to1@example.com'])
            assert.strict.deepEqual(mail.from.value, [{ address: 'sender@example.com', name: 'test name' }])
            assert.strict.deepEqual(mail.to.value, [{ address: 'to1@example.com', name: '' }])
            assert.strict.equal(mail.subject, 'test title')
            assert.strict.equal(mail.html, '<div>test content</div>')
            assert.strict.deepEqual(mail.attachments, [])
        })

        it('A02: 真實呼叫端形狀(w-web-sso server/srEmail.mjs), 中文寄件名、主旨與內容', async function() {
            let { r, sess, mail } = await send({
                ...base,
                srcName: 'SSO之寄信系統',
                emTitle: '使用者登入通知',
                emContent: '使用者已於時間ooo裝置xxx登入',
                toEmails: ['to1@example.com'],
            })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(sess.rcptTo, ['to1@example.com'])
            assert.strict.deepEqual(mail.from.value, [{ address: 'sender@example.com', name: 'SSO之寄信系統' }])
            assert.strict.equal(mail.subject, '使用者登入通知')
            assert.strict.equal(mail.html, '使用者已於時間ooo裝置xxx登入')
        })

        it('A09-A14/NB1/NB2/NB7/NB8/NB9/NB10: 寄件人名稱含特殊字元時原樣保留, 寄件地址仍為srcEmail', async function() {
            let names = ['Acme, Inc.', 'He said "hi"', 'System (test)', 'evil@attacker.com', 'A <x@y.com> B', '系統 通知 🚀', 'Team: Ops', 'a;b', 'a"b', 'C:\\dir\\x', 'a < b', 'a  b\tc']
            for (let srcName of names) {
                let { r, sess, mail } = await send({ ...base, srcName })
                assert.strict.equal(r.state, 'fulfilled', srcName)
                assert.strict.equal(sess.mailFrom, 'sender@example.com', srcName) //spec: 寄件地址為srcEmail
                assert.strict.deepEqual(mail.from.value, [{ address: 'sender@example.com', name: srcName }], srcName) //spec: 寄件人顯示名稱為srcName
            }
        })

        it('N4/NB3/NB4/NB6: 寄件人名稱之換行轉為空白並去除前後空白, 不產生Bcc標頭', async function() {
            let exps = [
                ['a\r\nBcc: evil@example.com', 'a Bcc: evil@example.com'],
                ['a\r\nb', 'a b'],
                [' test name ', 'test name'],
                ['   ', ''],
            ]
            for (let [srcName, name] of exps) {
                let { r, sess, mail } = await send({ ...base, srcName })
                assert.strict.equal(r.state, 'fulfilled', srcName)
                assert.strict.deepEqual(mail.from.value, [{ address: 'sender@example.com', name }], srcName)
                assert.strict.deepEqual(sess.rcptTo, ['to1@example.com'], srcName)
                assert.strict.equal(mail.headers.has('bcc'), false, srcName)
            }
        })

        it('N0/N1/N5: srcName未給定或為null時顯示名稱為system by w-email, 空字串時不顯示名稱', async function() {
            let exps = [
                [undefined, 'system by w-email'],
                [null, 'system by w-email'],
                ['', ''],
            ]
            for (let [srcName, name] of exps) {
                let { r, mail } = await send({ ...base, srcName })
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.deepEqual(mail.from.value, [{ address: 'sender@example.com', name }], String(srcName)) //spec: 預設'system by w-email', 空字串則不顯示名稱
            }
        })

        it('S0/S1/S4/K0/C1: emTitle與emContent未給定、為null或空字串時, 信件無主旨與內容', async function() {
            for (let v of [undefined, null, '']) {
                let { r, mail } = await send({ ...base, emTitle: v, emContent: v })
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.equal(mail.subject || '', '', String(v)) //spec: emTitle預設''
                assert.strict.equal(mail.html || '', '', String(v)) //spec: emContent預設''
            }
        })

        it('N2/S2/C2/C4/WB1: 文字欄位之數字轉為字串, emContent可為Buffer', async function() {
            let r1 = await send({ ...base, srcName: 123, emTitle: 456, emContent: 789, srcPW: 0 })
            assert.strict.equal(r1.r.state, 'fulfilled')
            assert.strict.deepEqual(r1.mail.from.value, [{ address: 'sender@example.com', name: '123' }])
            assert.strict.equal(r1.mail.subject, '456')
            assert.strict.equal(r1.mail.html, '789')
            assert.strict.equal(r1.sess.auth.pass, '0')
            let r2 = await send({ ...base, emContent: Buffer.from('<p>buffer body</p>', 'utf8') })
            assert.strict.equal(r2.r.state, 'fulfilled')
            assert.strict.equal(r2.mail.html, '<p>buffer body</p>')
        })

    })

    describe('收件人', function() {

        it('A05/A06: 收件人、副本、密件皆在信封內, 標頭不含Bcc', async function() {
            let { r, sess, mail } = await send({
                ...base,
                toEmails: ['to1@example.com', 'to2@example.com'],
                toEmailsCC: 'cc1@example.com',
                toEmailsBCC: ['bcc1@example.com', 'bcc2@example.com'],
            })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(sess.rcptTo, ['to1@example.com', 'to2@example.com', 'cc1@example.com', 'bcc1@example.com', 'bcc2@example.com'])
            assert.strict.deepEqual(mail.to.value.map((v) => v.address), ['to1@example.com', 'to2@example.com'])
            assert.strict.deepEqual(mail.cc.value.map((v) => v.address), ['cc1@example.com'])
            assert.strict.equal(mail.headers.has('bcc'), false) //spec: 密件副本不得出現於信件標頭
        })

        it('T9: 只有密件收件人時可寄送', async function() {
            let { r, sess, mail } = await send({ ...base, toEmails: '', toEmailsBCC: 'bcc1@example.com' })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(sess.rcptTo, ['bcc1@example.com'])
            assert.strict.equal(mail.headers.has('bcc'), false)
        })

        it('T4/T5/T8/A30/T12: 收件人逐筆去除前後空白, 略過null與空字串', async function() {
            let { r, sess, mail } = await send({
                ...base,
                toEmails: [' a@example.com ', null, '', ' To1@Example.COM '],
                toEmailsCC: '',
                toEmailsBCC: null,
            })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(sess.rcptTo, ['a@example.com', 'To1@example.com']) //網域由nodemailer轉小寫
            assert.strict.deepEqual(mail.to.value.map((v) => v.address), ['a@example.com', 'To1@example.com'])
            assert.strict.equal(mail.cc, undefined)
        })

        it('A29/E2: 國際化網域轉為punycode寄送, srcEmail去除前後空白後寄送與登入', async function() {
            let { r, sess } = await send({ ...base, srcEmail: ' sender@example.com ', toEmails: 'user@例子.測試' })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(sess.rcptTo, ['user@xn--fsqu00a.xn--g6w251d']) //spec: 國際化網域轉為punycode
            let header = sess.data.toString('utf8').split('\r\n\r\n')[0]
            assert.strict.match(header, /^To: user@xn--fsqu00a\.xn--g6w251d$/m) //標頭與信封一致; mailparser解析時會把punycode轉回Unicode, 故以原始標頭斷言
            assert.strict.equal(sess.mailFrom, 'sender@example.com')
            assert.strict.equal(sess.auth.user, 'sender@example.com')
        })

        it('A33: 收件人檢核失敗時不建立連線', async function() {
            let { r, sessions } = await send({ ...base, toEmails: 'x@example.com\r\nRCPT TO:<evil@example.com>' })
            assert.strict.deepEqual(r, { state: 'rejected', value: 'toEmails is not email' }) //spec: 輸入檢核失敗時為錯誤訊息字串
            assert.strict.equal(sessions.length, 0) //spec: 不連線即reject
        })

    })

    describe('附件', function() {

        it('A19/A20/A22: 附件以path(含中文檔名與二進位內容)或content給予, 檔名與內容正確', async function() {
            let { r, mail } = await send({
                ...base,
                emAttachments: [
                    { filename: 'att.txt', path: fpAtt },
                    { filename: '附件.txt', path: fpAttZh },
                    { filename: 'b.bin', path: fpBin },
                    { filename: 'inline.txt', content: '文字內容' },
                ],
            })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(mail.attachments.map((a) => [a.filename, sha1(a.content)]), [
                ['att.txt', sha1(fs.readFileSync(fpAtt))],
                ['附件.txt', sha1(fs.readFileSync(fpAttZh))],
                ['b.bin', sha1(fs.readFileSync(fpBin))],
                ['inline.txt', sha1(Buffer.from('文字內容', 'utf8'))],
            ])
        })

        it('M1/M13/M14/MB1-MB3/M5/MB9/M8/R08b: 附件為falsy時無附件, 陣列內falsy略過, raw與filename為false可寄送', async function() {
            for (let emAttachments of [null, false, '', 0]) {
                let { r, mail } = await send({ ...base, emAttachments })
                assert.strict.equal(r.state, 'fulfilled', String(emAttachments))
                assert.strict.deepEqual(mail.attachments, [], String(emAttachments))
            }
            let { r, mail } = await send({
                ...base,
                emAttachments: [
                    null,
                    '',
                    { filename: 'n.txt', content: 'n' },
                    { raw: 'Content-Type: text/plain; name="r.txt"\r\nContent-Disposition: attachment; filename="r.txt"\r\n\r\nraw-body' },
                    { filename: false, content: 'no-name' },
                ],
            })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.deepEqual(mail.attachments.map((a) => a.content.toString('utf8')), ['n', 'raw-body', 'no-name'])
            assert.strict.deepEqual(mail.attachments.map((a) => a.filename), ['n.txt', 'r.txt', undefined])
        })

        it('A23: 附件path不存在, reject Error', async function() {
            let { r } = await send({ ...base, emAttachments: { filename: 'x.txt', path: path.join(fdTmp, 'not-exist.txt') } })
            assert.strict.equal(r.state, 'rejected')
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'ESTREAM')
        })

    })

    describe('伺服器回應與錯誤', function() {

        it('B01: 伺服器拒絕登入, reject Error EAUTH', async function() {
            let { r } = await send(base, { auth: 'reject' })
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'EAUTH')
            assert.strict.equal(r.value.responseCode, 535)
        })

        it('B02: 唯一收件人被拒, reject Error EENVELOPE', async function() {
            let { r } = await send(base, { rcptReject: ['to1@example.com'] })
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'EENVELOPE')
        })

        it('B03: 兩位收件人其一被拒, 仍resolve', async function() {
            let { r, sess } = await send({ ...base, toEmails: ['a@example.com', 'b@example.com'] }, { rcptReject: ['b@example.com'] })
            assert.strict.deepEqual(r, { state: 'fulfilled', value: '250 2.0.0 OK queued' }) //spec: 部分收件人被伺服器拒收時仍為resolve
            assert.strict.deepEqual(sess.rcptTo, ['a@example.com', 'b@example.com'])
        })

        it('B04: 信件內容被拒, reject Error EMESSAGE', async function() {
            let { r } = await send(base, { dataReject: true })
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'EMESSAGE')
        })

        it('B05: 連不上郵件伺服器, reject Error ESOCKET', async function() {
            let port = await getClosedPort()
            let r = await settle(new WEmail({ ...base, srcHost: '127.0.0.1', srcPort: port }))
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'ESOCKET')
        })

        it('B06/B07/B08: 伺服器於連線時、MAIL FROM時或信件傳送中斷線, reject Error ECONNECTION', async function() {
            for (let dropAt of ['connect', 'mailfrom', 'middata']) {
                let { r } = await send(base, { dropAt })
                assert.strict.ok(r.value instanceof Error, dropAt)
                assert.strict.equal(r.value.code, 'ECONNECTION', dropAt)
            }
        })

        it('B09: 伺服器僅提供XOAUTH2, reject Error EAUTH', async function() {
            let { r } = await send(base, { auth: 'xoauth2only' })
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'EAUTH')
        })

        it('W1/B10: 伺服器未要求登入且srcPW為空字串, 不登入即寄送', async function() {
            let { r, sess } = await send({ ...base, srcPW: '' }, { auth: 'none' })
            assert.strict.equal(r.state, 'fulfilled') //spec: 郵件伺服器未要求登入時srcPW可為空字串
            assert.strict.equal(sess.auth, null)
            assert.strict.deepEqual(sess.rcptTo, ['to1@example.com'])
        })

    })

    describe('STARTTLS', function() {
        //spec: 465以外之連接埠於伺服器支援時使用STARTTLS; 伺服器未宣告STARTTLS時以明文連線與登入
        //測試憑證於執行時以Node內建crypto產生(test/tools/genCert.mjs), 並暫時加入預設信任憑證, 每案後還原

        let cert = null
        let caOri = null

        before(function() {
            if (typeof tls.setDefaultCACertificates !== 'function' || typeof tls.getCACertificates !== 'function') {
                this.skip() //Node版本不支援暫時信任憑證
            }
            cert = genCert()
        })

        afterEach(function() {
            if (caOri !== null) {
                tls.setDefaultCACertificates(caOri)
                caOri = null
            }
        })

        it('TLS1: 伺服器宣告STARTTLS且憑證受信任, 升級TLS後才登入並寄送', async function() {
            caOri = tls.getCACertificates('default')
            tls.setDefaultCACertificates([...caOri, cert.cert])
            let { r, sess, mail } = await send(base, { tls: cert })
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.equal(sess.tls, true)
            let iTls = sess.cmds.indexOf('STARTTLS')
            let iAuth = sess.cmds.findIndex((c) => c.startsWith('AUTH '))
            assert.strict.ok(iTls >= 0 && iAuth > iTls) //帳密於升級TLS後才送出
            assert.strict.equal(sess.auth.pass, 'pw-123')
            assert.strict.equal(mail.subject, 'test title')
        })

        it('TLS2: 憑證不受信任時reject Error ESOCKET, 且未送出帳密', async function() {
            let { r, sess } = await send(base, { tls: cert })
            assert.strict.ok(r.value instanceof Error)
            assert.strict.equal(r.value.code, 'ESOCKET')
            assert.strict.equal(sess.auth, null)
            assert.strict.equal(sess.cmds.includes('STARTTLS'), true)
        })

        it('TLS3: 伺服器未宣告STARTTLS時以明文登入(已知限制)', async function() {
            let { r, sess } = await send(base)
            assert.strict.equal(r.state, 'fulfilled')
            assert.strict.equal(sess.tls, false)
            assert.strict.equal(sess.auth.pass, 'pw-123')
        })

    })

})
