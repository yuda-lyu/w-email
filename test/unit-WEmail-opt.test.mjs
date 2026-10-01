import assert from 'assert'
import nodemailer from 'nodemailer'
import WEmail from '../src/WEmail.mjs'


//settle, 執行WEmail並記錄結果, 區分同步拋出(thrown)、resolve(fulfilled)與reject(rejected)
async function settle(opt) {
    let p
    try {
        p = new WEmail(opt)
    }
    catch (err) {
        return { state: 'thrown', value: err }
    }
    try {
        let v = await p
        return { state: 'fulfilled', value: v }
    }
    catch (err) {
        return { state: 'rejected', value: err }
    }
}


let base = {
    srcName: 'test name',
    srcEmail: 'sender@example.com',
    srcPW: 'pw-123',
    srcHost: '127.0.0.1',
    srcPort: 8025,
    emTitle: 'test title',
    emContent: '<div>test content</div>',
    toEmails: 'to1@example.com',
}


describe('unit-WEmail-opt', function() {
    //spec(src/WEmail.mjs JSDoc): opt各欄位給予undefined或null時皆視為未給定而使用預設值;
    //欄位型別或值不合規時, 不連線即reject錯誤訊息字串; 不論輸入為何皆回傳Promise而不同步拋出

    //攔截nodemailer.createTransport: 與src/WEmail.mjs所import者為同一ESM預設匯出物件,
    //記錄transport與mail選項並以stub回呼成功而不連線; mocha --parallel之worker會跨檔重用, 故每案後必還原
    let calls = []
    let createTransportOri = null
    beforeEach(function() {
        calls = []
        createTransportOri = nodemailer.createTransport
        nodemailer.createTransport = (transportOptions) => {
            let call = { transportOptions, mailOptions: null }
            calls.push(call)
            return {
                sendMail: (mailOptions, cb) => {
                    call.mailOptions = mailOptions
                    cb(null, { response: '250 stub response' })
                },
            }
        }
    })
    afterEach(function() {
        nodemailer.createTransport = createTransportOri
    })

    it('正向對照: 合法輸入時建立1個transport並resolve其回應', async function() {
        //攔截若未生效, 下方「不建立連線」之斷言將恆真, 故先確認攔截生效
        let r = await settle(base)
        assert.strict.deepEqual(r, { state: 'fulfilled', value: '250 stub response' }) //spec: resolve回傳郵件伺服器回應字串
        assert.strict.equal(calls.length, 1)
    })

    describe('輸入檢核失敗: reject錯誤訊息字串且不建立連線', function() {

        let att = { filename: 'x.txt' }

        //[案例id, 說明, opt, 預期reject字串]
        let cases = [
            ['E0', 'srcEmail未給定', { ...base, srcEmail: undefined }, 'srcEmail is not email'],
            ['E1', 'srcEmail為null', { ...base, srcEmail: null }, 'srcEmail is not email'],
            ['E3', 'srcEmail非email', { ...base, srcEmail: 'not-an-email' }, 'srcEmail is not email'],
            ['E4', 'srcEmail為數字', { ...base, srcEmail: 123 }, 'srcEmail is not email'],
            ['N3', 'srcName為物件', { ...base, srcName: {} }, 'srcName is not string'],
            ['NB5', 'srcName為布林', { ...base, srcName: true }, 'srcName is not string'],
            ['W5', 'srcPW為物件', { ...base, srcPW: {} }, 'srcPW is not string'],
            ['W5b', 'srcPW為布林', { ...base, srcPW: true }, 'srcPW is not string'],
            ['H1', 'srcHost為空字串', { ...base, srcHost: '' }, 'srcHost is not effective string'],
            ['H4', 'srcHost為空白字串', { ...base, srcHost: '  ' }, 'srcHost is not effective string'],
            ['H5', 'srcHost為數字(原會使行程崩潰)', { ...base, srcHost: 123 }, 'srcHost is not effective string'],
            ['HB1', 'srcHost為true(原會使行程崩潰)', { ...base, srcHost: true }, 'srcHost is not effective string'],
            ['HB2', 'srcHost為物件(原會使行程崩潰)', { ...base, srcHost: {} }, 'srcHost is not effective string'],
            ['HB3', 'srcHost為陣列', { ...base, srcHost: ['127.0.0.1'] }, 'srcHost is not effective string'],
            ['HB5', 'srcHost為0(原會改連localhost)', { ...base, srcHost: 0 }, 'srcHost is not effective string'],
            ['HB6', 'srcHost為false(原會改連localhost)', { ...base, srcHost: false }, 'srcHost is not effective string'],
            ['P7', 'srcPort為空字串', { ...base, srcPort: '' }, 'srcPort is not valid port'],
            ['P2', 'srcPort為0', { ...base, srcPort: 0 }, 'srcPort is not valid port'],
            ['P3', 'srcPort為負數', { ...base, srcPort: -1 }, 'srcPort is not valid port'],
            ['P4', 'srcPort為65536', { ...base, srcPort: 65536 }, 'srcPort is not valid port'],
            ['P5', 'srcPort為小數', { ...base, srcPort: 8025.5 }, 'srcPort is not valid port'],
            ['P6', 'srcPort為非數字字串', { ...base, srcPort: 'abc' }, 'srcPort is not valid port'],
            ['PB1', 'srcPort為true(原會連到埠1)', { ...base, srcPort: true }, 'srcPort is not valid port'],
            ['Q5', 'srcPort為物件', { ...base, srcPort: {} }, 'srcPort is not valid port'],
            ['Q7', 'srcPort為陣列', { ...base, srcPort: [8025] }, 'srcPort is not valid port'],
            ['Q8', 'srcPort為Infinity', { ...base, srcPort: Infinity }, 'srcPort is not valid port'],
            ['S3', 'emTitle為物件', { ...base, emTitle: {} }, 'emTitle is not string'],
            ['SB1', 'emTitle為布林', { ...base, emTitle: true }, 'emTitle is not string'],
            ['C3', 'emContent為物件', { ...base, emContent: {} }, 'emContent is not string'],
            ['C5', 'emContent為內容物件{path}(原會讀取本機檔案)', { ...base, emContent: { path: './package.json' } }, 'emContent is not string'],
            ['M2', 'emAttachments為字串', { ...base, emAttachments: '/path/a.txt' }, 'emAttachments is not object or array'],
            ['M3', 'emAttachments為數字', { ...base, emAttachments: 123 }, 'emAttachments is not object or array'],
            ['M4', 'emAttachments為空物件', { ...base, emAttachments: {} }, 'emAttachments is not valid attachment'],
            ['M6', 'emAttachments含空物件', { ...base, emAttachments: [{}] }, 'emAttachments[0] is not valid attachment'],
            ['M7', '附件僅有filename無內容來源', { ...base, emAttachments: att }, 'emAttachments is not valid attachment'],
            ['M9', '附件path為空字串', { ...base, emAttachments: { filename: 'x.txt', path: '' } }, 'emAttachments is not valid attachment'],
            ['MB6', '附件href為空字串', { ...base, emAttachments: { filename: 'x.txt', href: '' } }, 'emAttachments is not valid attachment'],
            ['MB8', '附件path為false', { ...base, emAttachments: { path: false } }, 'emAttachments is not valid attachment'],
            ['M10', '附件content為數字', { ...base, emAttachments: { filename: 'x.txt', content: 123 } }, 'emAttachments is not valid attachment'],
            ['M11', '附件path為數字', { ...base, emAttachments: { filename: 'x.txt', path: 123 } }, 'emAttachments is not valid attachment'],
            ['M12', '附件filename為數字', { ...base, emAttachments: [{ filename: 'a.txt', content: 'a' }, { filename: 123, content: 'x' }] }, 'emAttachments[1] is not valid attachment'],
            ['T2', 'toEmails為數字', { ...base, toEmails: 123 }, 'toEmails is not string or array'],
            ['T3', 'toEmails為位址物件', { ...base, toEmails: { name: 'A', address: 'a@example.com' } }, 'toEmails is not string or array'],
            ['A08', 'toEmails為逗號串接', { ...base, toEmails: 'a@example.com,b@example.com' }, 'toEmails is not email'],
            ['TB1', 'toEmails為分號串接', { ...base, toEmails: 'a@example.com;b@example.com' }, 'toEmails is not email'],
            ['TB3', 'toEmails為空白分隔(原會遺失收件人)', { ...base, toEmails: 'a@example.com b@example.com' }, 'toEmails is not email'],
            ['A26', 'toEmails帶顯示名稱', { ...base, toEmails: 'Alice <alice@example.com>' }, 'toEmails is not email'],
            ['A27', 'toEmails帶註解', { ...base, toEmails: 'bob@example.com (Bob)' }, 'toEmails is not email'],
            ['A28', 'toEmails為引號local-part', { ...base, toEmails: '"john..doe"@example.com' }, 'toEmails is not email'],
            ['A33', 'toEmails含CRLF與群組語法', { ...base, toEmails: 'x@example.com\r\nRCPT TO:<evil@example.com>' }, 'toEmails is not email'],
            ['TB4', 'toEmails無頂級網域', { ...base, toEmails: 'user@localhost' }, 'toEmails is not email'],
            ['TB6', 'toEmails之帳號含非ASCII', { ...base, toEmails: 'Ünïcödé@example.com' }, 'toEmails is not email'],
            ['TB12', 'toEmails之國際化網域含URL剖析會截斷之字元', { ...base, toEmails: 'user@例子.測試/evil.example' }, 'toEmails is not email'],
            ['T14', 'toEmails陣列含數字', { ...base, toEmails: [123] }, 'toEmails[0] is not email'],
            ['TB2', 'toEmails為巢狀陣列', { ...base, toEmails: [['a@example.com']] }, 'toEmails[0] is not email'],
            ['T15', 'toEmails陣列含位址物件', { ...base, toEmails: ['a@example.com', { name: 'B', address: 'b@example.com' }] }, 'toEmails[1] is not email'],
            ['CC1', 'toEmailsCC非email', { ...base, toEmailsCC: 'not-an-email' }, 'toEmailsCC is not email'],
            ['CC2', 'toEmailsCC為數字', { ...base, toEmailsCC: 123 }, 'toEmailsCC is not string or array'],
            ['BCC1', 'toEmailsBCC陣列含非email', { ...base, toEmailsBCC: ['ok@example.com', 'bad'] }, 'toEmailsBCC[1] is not email'],
            ['BCC2', 'toEmailsBCC為物件', { ...base, toEmailsBCC: {} }, 'toEmailsBCC is not string or array'],
            ['A07', '收件人皆為空陣列', { ...base, toEmails: [] }, 'no recipients'],
            ['T1', 'toEmails為null且無副本與密件(原會同步拋出)', { ...base, toEmails: null }, 'no recipients'],
            ['T7', 'toEmails為空白字串', { ...base, toEmails: '   ' }, 'no recipients'],
            ['T16', 'toEmails為false', { ...base, toEmails: false }, 'no recipients'],
            ['T17', 'toEmails陣列元素皆略過', { ...base, toEmails: [null, '', ' ', false, 0] }, 'no recipients'],
        ]

        for (let [id, desc, opt, msg] of cases) {
            it(`${id}: ${desc}`, async function() {
                let r = await settle(opt)
                assert.strict.deepEqual(r, { state: 'rejected', value: msg })
                assert.strict.equal(calls.length, 0) //spec: 不連線即reject
            })
        }

    })

    describe('異常值: 不同步拋出', function() {

        //R-never-throw: 各欄位給予Symbol、null-prototype物件、BigInt或函式時, 皆reject錯誤訊息字串
        let keys = ['srcName', 'srcEmail', 'srcPW', 'srcHost', 'srcPort', 'emTitle', 'emContent', 'toEmails', 'toEmailsCC', 'toEmailsBCC', 'emAttachments']
        let values = [
            ['Symbol', Symbol('s')],
            ['null-prototype物件', Object.create(null)],
            ['BigInt', 10n],
            ['函式', () => 1],
        ]
        for (let key of keys) {
            it(`${key}: 異常值皆reject字串`, async function() {
                for (let [name, v] of values) {
                    let opt = { ...base, [key]: v }
                    if (key === 'toEmailsCC' || key === 'toEmailsBCC') {
                        opt.toEmails = 'to1@example.com'
                    }
                    let r = await settle(opt)
                    assert.strict.equal(r.state, 'rejected', `${key}=${name}`)
                    assert.strict.equal(typeof r.value, 'string', `${key}=${name}`)
                }
                assert.strict.equal(calls.length, 0)
            })
        }

        it('T23/T24: 收件人陣列含Symbol或null-prototype物件時reject字串(原會同步拋出)', async function() {
            for (let e of [Symbol('s'), Object.create(null)]) {
                let r = await settle({ ...base, toEmails: [e] })
                assert.strict.deepEqual(r, { state: 'rejected', value: 'toEmails[0] is not email' })
            }
        })

        it('T1/T2/T3/T10/T11: 原會同步拋出之收件人輸入一律回傳Promise', async function() {
            let opts = [
                { ...base, toEmails: null, toEmailsCC: 'cc@example.com' },
                { ...base, toEmails: 123 },
                { ...base, toEmails: { name: 'A', address: 'a@example.com' } },
                { ...base, toEmailsCC: null },
                { ...base, toEmailsBCC: null },
            ]
            for (let opt of opts) {
                let r = await settle(opt)
                assert.strict.notEqual(r.state, 'thrown')
            }
        })

        it('OB1: opt之getter拋錯時reject該錯誤而不同步拋出', async function() {
            let opt = { ...base }
            Object.defineProperty(opt, 'srcName', {
                get() {
                    throw new Error('getter boom')
                },
            })
            let r = await settle(opt)
            assert.strict.equal(r.state, 'rejected')
            assert.strict.ok(r.value instanceof Error) //spec: 輸入檢核以外之錯誤為Error物件
            assert.strict.equal(r.value.message, 'getter boom')
            assert.strict.equal(calls.length, 0)
        })

    })

    describe('transport選項', function() {

        //[案例id, 說明, srcPort輸入, 預期port, 預期secure]; spec: srcPort可為正整數或其字串, 範圍1至65535, 465使用SSL/TLS連線, 預設587
        let portCases = [
            ['P0', '未給定', undefined, 587, false],
            ['P8', 'null', null, 587, false],
            ['Q1', '數字587', 587, 587, false],
            ['Q1s', '字串587', '587', 587, false],
            ['Q2', '數字465', 465, 465, true],
            ['Q3', '字串465(原會以明文連TLS埠)', '465', 465, true],
            ['Q4', '前後空白之字串465', ' 465 ', 465, true],
            ['P1', '字串8025', '8025', 8025, false],
            ['QB1', '下界1', 1, 1, false],
            ['QB2', '上界65535', 65535, 65535, false],
        ]

        for (let [id, desc, srcPort, port, secure] of portCases) {
            it(`${id}: srcPort為${desc} → port ${port}、secure ${secure}`, async function() {
                let r = await settle({ ...base, srcPort })
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.equal(calls[0].transportOptions.port, port)
                assert.strict.equal(calls[0].transportOptions.secure, secure)
            })
        }

        it('H0/H2/HB4: srcHost未給定或null用smtp.gmail.com, 前後空白去除後使用', async function() {
            let exps = [
                [undefined, 'smtp.gmail.com'],
                [null, 'smtp.gmail.com'],
                [' 127.0.0.1 ', '127.0.0.1'],
            ]
            for (let [srcHost, host] of exps) {
                calls = []
                let r = await settle({ ...base, srcHost })
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.equal(calls[0].transportOptions.host, host)
            }
        })

        it('W/E2: 登入帳號為去除前後空白之srcEmail, 密碼為srcPW, 未給定或null時為空字串, 數字轉為字串', async function() {
            let exps = [
                [{ srcEmail: ' sender@example.com ' }, { user: 'sender@example.com', pass: 'pw-123' }],
                [{ srcPW: undefined }, { user: 'sender@example.com', pass: '' }],
                [{ srcPW: null }, { user: 'sender@example.com', pass: '' }],
                [{ srcPW: 0 }, { user: 'sender@example.com', pass: '0' }],
                [{ srcPW: 123456 }, { user: 'sender@example.com', pass: '123456' }],
            ]
            for (let [o, auth] of exps) {
                calls = []
                let r = await settle({ ...base, ...o })
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.deepEqual(calls[0].transportOptions.auth, auth)
            }
        })

        it('TLS: 不停用憑證驗證與STARTTLS', async function() {
            //spec: 465使用SSL/TLS, 其他連接埠於伺服器支援時使用STARTTLS; 不得以tls.rejectUnauthorized:false或ignoreTLS停用
            for (let srcPort of [465, 587]) {
                calls = []
                await settle({ ...base, srcPort })
                let t = calls[0].transportOptions
                assert.strict.equal(t.tls === undefined || t.tls.rejectUnauthorized !== false, true)
                assert.strict.notEqual(t.ignoreTLS, true)
            }
        })

    })

    describe('通過檢核之輸入', function() {

        it('文字欄位接受有限數字, emContent接受Buffer', async function() {
            let opts = [
                { ...base, srcName: 123 },
                { ...base, emTitle: 123 },
                { ...base, emContent: 123 },
                { ...base, emContent: Buffer.from('<p>buffer</p>') },
            ]
            for (let opt of opts) {
                let r = await settle(opt)
                assert.strict.equal(r.state, 'fulfilled')
            }
        })

        it('A29/M8/R08b: 國際化網域、附件以href或raw給予、filename為false時通過檢核', async function() {
            //href需實際下載故僅驗檢核, 寄送行為由api測試驗raw與國際化網域
            let opts = [
                { ...base, toEmails: 'user@例子.測試' },
                { ...base, emAttachments: { filename: 'c.txt', href: 'https://example.com/c.txt' } },
                { ...base, emAttachments: { raw: 'Content-Type: text/plain\r\n\r\nd' } },
                { ...base, emAttachments: { filename: false, content: 'x' } },
            ]
            for (let opt of opts) {
                calls = []
                let r = await settle(opt)
                assert.strict.equal(r.state, 'fulfilled')
                assert.strict.equal(calls.length, 1)
            }
        })

    })

})
