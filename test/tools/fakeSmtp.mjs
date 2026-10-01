import net from 'net'
import tls from 'tls'


/**
 * 啟動本機假SMTP伺服器，記錄客戶端送出之指令、AUTH、信封與信件原文，供測試斷言
 *
 * 連接埠自portStart起循序嘗試，遇占用則試下一號至portEnd為止(自動配發，不隨機)，僅綁定127.0.0.1
 *
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Number} [opt.portStart=8025] 輸入起始連接埠，預設8025
 * @param {Number} [opt.portEnd=8999] 輸入結束連接埠，預設8999
 * @param {String} [opt.auth='accept'] 輸入AUTH行為，'accept'為接受，'reject'為回覆535，'none'為不宣告AUTH，'xoauth2only'為僅宣告XOAUTH2，未宣告之機制一律回覆504，預設'accept'
 * @param {Object} [opt.tls=null] 輸入STARTTLS用之憑證物件{key, cert}，給予時宣告STARTTLS且於升級TLS前不宣告AUTH(同Gmail)，預設null
 * @param {Array} [opt.rcptReject=[]] 輸入以550拒收之收件地址(小寫)陣列，預設[]
 * @param {Boolean} [opt.dataReject=false] 輸入DATA結束後是否回覆554，預設false
 * @param {String} [opt.dropAt=''] 輸入伺服器端強制斷線時機，''為不斷線，'connect'為連線即斷，'mailfrom'為收到MAIL FROM即斷，'middata'為收到部分信件內容即斷，預設''
 * @returns {Promise} 回傳Promise，resolve回傳物件，含port(實際連接埠)、sessions(各連線紀錄陣列)、close(關閉函數)
 */
async function startFakeSmtp(opt = {}) {
    let portStart = opt.portStart || 8025
    let portEnd = opt.portEnd || 8999
    let auth = opt.auth || 'accept'
    let optTls = opt.tls || null
    let rcptReject = opt.rcptReject || []
    let dataReject = opt.dataReject === true
    let dropAt = opt.dropAt || ''

    let sessions = []
    let sockets = new Set()

    let onConnection = (socket) => {
        sockets.add(socket)
        socket.on('close', () => {
            sockets.delete(socket)
        })
        socket.on('error', () => {})

        //sess, tls為是否已升級TLS, cmds為指令(AUTH之初始回應已遮蔽), auth為解出之帳密, mailFrom與rcptTo為信封地址, data為信件原文Buffer
        let sess = {
            tls: false,
            cmds: [],
            auth: null,
            mailFrom: null,
            rcptTo: [],
            data: null,
        }
        sessions.push(sess)

        if (dropAt === 'connect') {
            socket.destroy()
            return
        }

        let sock = socket //升級TLS後改為TLSSocket
        let buf = '' //以latin1保留原始位元組
        let inData = false
        let dataLines = []
        let authStep = ''
        let loginUser = ''

        let send = (s) => {
            if (!sock.destroyed) {
                sock.write(s + '\r\n')
            }
        }

        let b64 = (s) => {
            return Buffer.from(s, 'base64').toString('utf8')
        }

        let addrOf = (s) => {
            let m = s.match(/<([^>]*)>/)
            return m ? m[1] : s
        }

        //advertised, 目前宣告之AUTH機制, 有STARTTLS時須升級TLS後才宣告
        let advertised = () => {
            if (optTls && !sess.tls) {
                return []
            }
            if (auth === 'accept' || auth === 'reject') {
                return ['PLAIN', 'LOGIN']
            }
            if (auth === 'xoauth2only') {
                return ['XOAUTH2']
            }
            return []
        }

        let setAuth = (mech, user, pass) => {
            sess.auth = { mech, user, pass }
            if (auth === 'reject') {
                send('535 5.7.8 Username and Password not accepted')
            }
            else {
                send('235 2.7.0 Accepted')
            }
        }

        let onLine = (line) => {

            //信件內容
            if (inData) {
                if (line === '.') {
                    inData = false
                    sess.data = Buffer.from(dataLines.join('\r\n'), 'latin1')
                    if (dataReject) {
                        send('554 5.6.0 Message rejected')
                    }
                    else {
                        send('250 2.0.0 OK queued')
                    }
                    return
                }
                dataLines.push(line.startsWith('.') ? line.slice(1) : line)
                if (dropAt === 'middata' && dataLines.length >= 3) {
                    sock.destroy()
                }
                return
            }

            //AUTH後續回應
            if (authStep !== '') {
                let step = authStep
                authStep = ''
                if (step === 'login-user') {
                    loginUser = b64(line)
                    authStep = 'login-pass'
                    send('334 UGFzc3dvcmQ6')
                }
                else if (step === 'login-pass') {
                    setAuth('LOGIN', loginUser, b64(line))
                }
                else if (step === 'plain') {
                    let p = b64(line).split('\0')
                    setAuth('PLAIN', p[1], p[2])
                }
                return
            }

            let text = Buffer.from(line, 'latin1').toString('utf8')
            sess.cmds.push(text.replace(/^(AUTH\s+\S+)\s+.*$/i, '$1 <initial-response>'))
            let cmd = text.split(' ')[0].toUpperCase()
            let arg = text.slice(cmd.length).trim()

            if (cmd === 'EHLO') {
                let ext = ['8BITMIME', 'SMTPUTF8']
                if (optTls && !sess.tls) {
                    ext.push('STARTTLS')
                }
                let mechs = advertised()
                if (mechs.length > 0) {
                    ext.push(`AUTH ${mechs.join(' ')}`)
                }
                let lines = ['localhost', ...ext]
                lines.forEach((l, i) => {
                    send(`250${i === lines.length - 1 ? ' ' : '-'}${l}`)
                })
            }
            else if (cmd === 'HELO') {
                send('250 localhost')
            }
            else if (cmd === 'STARTTLS') {
                if (!optTls || sess.tls) {
                    send('503 5.5.1 STARTTLS not available')
                    return
                }
                send('220 2.0.0 Ready to start TLS')
                socket.removeAllListeners('data')
                let ts = new tls.TLSSocket(socket, { isServer: true, key: optTls.key, cert: optTls.cert })
                ts.on('error', () => {})
                ts.on('secure', () => {
                    sess.tls = true
                })
                ts.on('data', onData)
                sock = ts
                buf = ''
            }
            else if (cmd === 'AUTH') {
                let [mech, init] = arg.split(/\s+/)
                mech = (mech || '').toUpperCase()
                if (!advertised().includes(mech)) {
                    //未宣告之機制, 同真實伺服器回覆504
                    sess.auth = { mech }
                    send('504 5.5.4 Unrecognized authentication type')
                }
                else if (mech === 'PLAIN') {
                    if (init) {
                        let p = b64(init).split('\0')
                        setAuth('PLAIN', p[1], p[2])
                    }
                    else {
                        authStep = 'plain'
                        send('334 ')
                    }
                }
                else if (mech === 'LOGIN') {
                    if (init) {
                        loginUser = b64(init)
                        authStep = 'login-pass'
                        send('334 UGFzc3dvcmQ6')
                    }
                    else {
                        authStep = 'login-user'
                        send('334 VXNlcm5hbWU6')
                    }
                }
                else {
                    sess.auth = { mech }
                    send('535 5.7.8 Authentication failed')
                }
            }
            else if (cmd === 'MAIL') {
                if (dropAt === 'mailfrom') {
                    sock.destroy()
                    return
                }
                sess.mailFrom = addrOf(arg)
                send('250 2.1.0 OK')
            }
            else if (cmd === 'RCPT') {
                let a = addrOf(arg)
                sess.rcptTo.push(a)
                if (rcptReject.includes(a.toLowerCase())) {
                    send('550 5.1.1 User unknown')
                }
                else {
                    send('250 2.1.5 OK')
                }
            }
            else if (cmd === 'DATA') {
                inData = true
                dataLines = []
                send('354 Go ahead')
            }
            else if (cmd === 'RSET' || cmd === 'NOOP') {
                send('250 2.0.0 OK')
            }
            else if (cmd === 'QUIT') {
                send('221 2.0.0 Bye')
                sock.end()
            }
            else {
                send('502 5.5.2 Command not recognized')
            }
        }

        let onData = (chunk) => {
            buf += chunk.toString('latin1')
            let i = buf.indexOf('\r\n')
            while (i >= 0) {
                let line = buf.slice(0, i)
                buf = buf.slice(i + 2)
                onLine(line)
                if (sock.destroyed) {
                    return
                }
                i = buf.indexOf('\r\n')
            }
        }

        socket.on('data', onData)
        send('220 localhost ESMTP fakeSmtp')
    }

    for (let port = portStart; port <= portEnd; port++) {
        let server = net.createServer(onConnection)
        let r = await new Promise((resolve) => {
            server.once('error', (err) => {
                resolve(err)
            })
            server.listen(port, '127.0.0.1', () => {
                resolve(null)
            })
        })
        if (r === null) {
            let close = () => {
                return new Promise((resolve) => {
                    for (let s of sockets) {
                        s.destroy()
                    }
                    server.close(() => {
                        resolve()
                    })
                })
            }
            return { port, sessions, close }
        }
        if (r.code !== 'EADDRINUSE' && r.code !== 'EACCES') {
            throw r
        }
    }
    throw new Error(`no free port in ${portStart}-${portEnd}`)
}


/**
 * 取得一個當下無服務監聽之連接埠(自8025起循序配發後立即關閉)，供測試連線被拒之情境
 *
 * @returns {Promise} 回傳Promise，resolve回傳連接埠數字
 */
async function getClosedPort() {
    let srv = await startFakeSmtp()
    await srv.close()
    return srv.port
}


export { startFakeSmtp, getClosedPort }
