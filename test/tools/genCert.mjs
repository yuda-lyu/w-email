import crypto from 'crypto'


//DER編碼之最小輔助, 僅涵蓋產生自簽憑證所需之型別
function derLen(n) {
    if (n < 0x80) {
        return Buffer.from([n])
    }
    if (n < 0x100) {
        return Buffer.from([0x81, n])
    }
    return Buffer.from([0x82, n >> 8, n & 0xff])
}


function tlv(tag, buf) {
    return Buffer.concat([Buffer.from([tag]), derLen(buf.length), buf])
}


function seq(...items) {
    return tlv(0x30, Buffer.concat(items))
}


function oid(s) {
    let ns = s.split('.').map(Number)
    let bytes = [ns[0] * 40 + ns[1]]
    for (let n of ns.slice(2)) {
        let enc = [n & 0x7f]
        n = Math.floor(n / 128)
        while (n > 0) {
            enc.unshift((n & 0x7f) | 0x80)
            n = Math.floor(n / 128)
        }
        bytes.push(...enc)
    }
    return tlv(0x06, Buffer.from(bytes))
}


function int(buf) {
    //正整數, 最高位元為1時補0
    if (buf[0] & 0x80) {
        buf = Buffer.concat([Buffer.from([0]), buf])
    }
    return tlv(0x02, buf)
}


function time(d) {
    //2050年(含)以後須用GeneralizedTime
    let p = (v) => String(v).padStart(2, '0')
    let s = `${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
    if (d.getUTCFullYear() >= 2050) {
        return tlv(0x18, Buffer.from(`${d.getUTCFullYear()}${s}`, 'ascii'))
    }
    return tlv(0x17, Buffer.from(`${p(d.getUTCFullYear() % 100)}${s}`, 'ascii'))
}


/**
 * 以Node內建crypto產生localhost自簽憑證(EC P-256, SAN含localhost與127.0.0.1), 供測試之TLS伺服器使用
 *
 * 於測試執行時產生, 不需openssl與第三方套件, 亦不必將私鑰納入版控或發布之套件
 *
 * @returns {Object} 回傳物件，含key(私鑰PEM)與cert(憑證PEM)
 */
function genCert() {
    let { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    let spki = publicKey.export({ type: 'spki', format: 'der' })
    let sigAlg = seq(oid('1.2.840.10045.4.3.2')) //ecdsa-with-SHA256
    let name = seq(tlv(0x31, seq(oid('2.5.4.3'), tlv(0x0c, Buffer.from('localhost', 'utf8'))))) //CN=localhost
    let now = Date.now()
    let validity = seq(time(new Date(now - 60 * 60 * 1000)), time(new Date(now + 24 * 60 * 60 * 1000)))
    let san = seq(tlv(0x82, Buffer.from('localhost', 'ascii')), tlv(0x87, Buffer.from([127, 0, 0, 1]))) //dNSName, iPAddress
    let extensions = tlv(0xa3, seq(
        seq(oid('2.5.29.19'), tlv(0x01, Buffer.from([0xff])), tlv(0x04, seq(tlv(0x01, Buffer.from([0xff]))))), //basicConstraints critical CA:TRUE
        seq(oid('2.5.29.17'), tlv(0x04, san)), //subjectAltName
    ))
    let tbs = seq(
        tlv(0xa0, int(Buffer.from([2]))), //v3
        int(Buffer.from([1])), //序號固定為1, 每次執行皆為新金鑰對故無衝突
        sigAlg,
        name,
        validity,
        name,
        spki,
        extensions,
    )
    let sig = crypto.sign('sha256', tbs, { key: privateKey, dsaEncoding: 'der' })
    let certDer = seq(tbs, sigAlg, tlv(0x03, Buffer.concat([Buffer.from([0]), sig])))
    let b64 = certDer.toString('base64').match(/.{1,64}/g).join('\n')
    return {
        key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
        cert: `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`,
    }
}


export default genCert
