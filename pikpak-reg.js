//小白脸
let scriptName = 'Pikpak'
    , $ = new Env(scriptName)
    , emailToken = ''
function http(t, e = "post") {
    e = e.toLowerCase();
    return new Promise((resolve, reject) => {
        $[e](t, (err, response, data) => {
            if (err) {
                const error = data.match(/[\u4e00-\u9fff]+/g)?.join(" ") + "\n" + t.url;
                reject(`err: ${err || error}`);
            } else resolve(typeof data == "string" && !/<div/.test(data) ? JSON.parse(data) : data);
        })
    })
}

class Pikpak {
    constructor(pikpak_id) {
        this.captcha_token = pikpak_id[2];
        this.timestamp = pikpak_id[3];
        this.captcha_sign = pikpak_id[4];
        this.body = {
            client_id: pikpak_id[0],
            device_id: pikpak_id[1],
        };
        this.headers = {
            origin: "https://mypikpak.com",
            referer: "https://mypikpak.com/",
            "x-client-id": pikpak_id[0],
            "x-device-id": pikpak_id[1],
        };
        this.email = "";
    }

    async getEmailCode() {
        await this.getEmailToken(); //获取emailToken
        $.log('=========================', '邮箱token：', emailToken, '=========================')
        await this.newMail(); //获取邮件
        $.log('=========================', '邮箱：', this.email, '=========================')
        const captchaToken = await this.getCaptchaToken("POST:/v1/auth/verification", this.captcha_token); //获取安全认证token
        const verificationId = await this.sendVerificationRequest(captchaToken); //发送验证码
        const verificationCode = await this.getVerificationCode(); //获取验证码
        $.log('=========================', '验证码：', verificationCode, '=========================')
        const verificationToken = await this.getVerificationToken(verificationId, verificationCode); //获取注册token
        await this.gregister(verificationToken, verificationCode, captchaToken); //模拟注册
        $.msg($.name, "注册成功", `账号: ${this.email}`);
    }
    async getEmailToken() {
        let resp = await $.http.get('https://www.emailnator.com/');
        let cookie = $.isNode() ? resp.headers['set-cookie'] : resp.headers['Set-Cookie'];
        emailToken = decodeURIComponent(cookie.toString().match(/XSRF-TOKEN=(.*?);/)[1]);
    }
    async newMail() {
        let t = await http({
            url: "https://www.emailnator.com/generate-email",
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
                , 'X-Xsrf-Token': emailToken
            },
            body: '{"email":["domain","plusGmail","dotGmail","googleMail"]}'
        });
        this.email = t.email[0]
    }
    async getCaptchaToken(actions, captcha_tokens, user_id = "") {

        const tokens = captcha_tokens
            ? { captcha_token: captcha_tokens }
            : {};
        const meta = actions.includes("vip")
            ? {
                meta: {
                    captcha_sign: this.captcha_sign,
                    timestamp: `${this.timestamp}`,
                    user_id: `${user_id}`,           //未获取
                    client_version: "1.0.0",
                    package_name: "mypikpak.com",
                },
            }
            : { meta: { email: this.email } };
        const init = {
            url: "https://user.mypikpak.com/v1/shield/captcha/init",
            headers: this.headers,
            body: JSON.stringify({
                ...this.body,
                ...tokens,
                ...meta,
                action: actions,
            }),
        };

        const { captcha_token } = await http(init);
        return captcha_token;
    }

    async sendVerificationRequest(token) {
        const verifcation = {
            url: "https://user.mypikpak.com/v1/auth/verification",
            headers: { ...this.headers, "x-captcha-token": token },
            body: JSON.stringify({
                client_id: this.body.client_id,
                email: this.email,
                usage: "REGISTER",
                selected_channel: "VERIFICATION_EMAIL",
                target: "ANY",
            }),
        };
        const { verification_id } = await http(verifcation);
        return verification_id;
    }

    async getVerificationCode() {
        for (; ;) {
            await new Promise(t => setTimeout(t, 500));
            let t = (await http({
                url: "https://www.emailnator.com/message-list",
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                    , 'X-Xsrf-Token': emailToken
                },
                body: `{"email":"${this.email}"}`
            })).messageData;
            // console.log(t)
            if (t.length > 1) {
                let { messageID: i } = t.find(_t => _t.from.includes('PikPak'));
                let $ = (await http({
                    url: "https://www.emailnator.com/message-list",
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                        , 'X-Xsrf-Token': emailToken
                    },
                    body: `{"email":"${this.email}","messageID":"${i}"}`
                }));
                if ($) {
                    let e = $.match(/(\d{6})/)[0];
                    return e
                }
            }

        }
    }

    async getVerificationToken(id, code) {
        const verify = {
            url: "https://user.mypikpak.com/v1/auth/verification/verify",
            headers: this.headers,
            body: JSON.stringify({
                verification_id: id,
                verification_code: code,
                client_id: this.body.client_id,
            }),
        };
        const { verification_token } = await http(verify);
        return verification_token;
    }

    async gregister(vtoken, code, ctoken) {
        const signup = {
            url: "https://user.mypikpak.com/v1/auth/signup",
            headers: this.headers,
            body: JSON.stringify({
                email: this.email,
                password: "Aa147258",
                client_id: this.body.client_id,
                verification_token: vtoken,
                verification_code: code,
            }),
        };
        return await http(signup);
    }

    async signin(captcha_token) {
        const list = {
            url: "https://user.mypikpak.com/v1/auth/signin",
            headers: {
                ...this。headers,
                "x-captcha-token": captcha_token,
            },
            内容: JSON.stringify({
                username: this。email,
                密码: "Aa147258",
                client_id: "YUMx5nI8ZU8Ap8pm",
            }),
        }
        const { access_token, sub } = await http(list);
        return [`Bearer ${access_token}`, sub];
    }

    async invite(access_token) {
        let invitation = {
            url: "https://api-drive.mypikpak.com/vip/v1/activity/invite",
            headers: {
                ...this。headers,
                authorization: access_token,
            },
            内容: `{"activation_code":"${this。invitation_Code}","page":"invite"}`
        }
        const resp = await http(invitation);
        console.log(JSON.stringify(resp, null, 2))
        let { add_days } = resp;
        console.log(this。email);
        console.log(`获得vip ${add_days}天`);
        $.msg(`获得vip ${add_days}天`, this。email, "邮件在日志里看")
        //结束
    }

}


const pikpak_id = Data();

新建 Pikpak(pikpak_id)。getEmailCode()。catch((err) => {
    $.msg("", "", err);
    console.log(err);
})
    。finally(() => $.已完成());


// prettier-ignore
function Data() { let $ = Date.now(), t = { clientId: "YUMx5nI8ZU8Ap8pm", clientVersion: "1.0.0", packageName: "mypikpak.com", timestamp: `${$}`, algorithms: [{ alg: "md5", salt: "mg3UtlOJ5/6WjxHsGXtAthe" }, { alg: "md5", salt: "kRG2RIlL/eScz3oDbzeF1" }, { alg: "md5", salt: "uOIOBDcR5QALlRUUK4JVoreEI0i3RG8ZiUf2hMOH" }, { alg: "md5", salt: "wa+0OkzHAzpyZ0S/JAnHmF2BlMR9Y" }, { alg: "md5", salt: "ZWV2OkSLoNkmbr58v0f6U3udtqUNP7XON" }, { alg: "md5", salt: "Jg4cDxtvbmlakZIOpQN0oY1P0eYkA4xquMY9/xqwZE5sjrcHwufR" }, { alg: "md5", salt: "XHfs" }, { alg: "md5", salt: "S4/mRgYpWyNGEUxVsYBw8n//zlywe5Ga1R8ffWJSOPZnMqWb4w" },] }, _ = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function ($) { var t = 16 * Math.random() | 0; return ("x" == $ ? t : 3 & t | 8).toString(16) }), r = function ($) { "use strict"; var t = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]; function _($, t) { var _ = $[0], r = $[1], e = $[2], n = $[3]; r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[0] - 680876936 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[1] - 389564586 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[2] + 606105819 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[3] - 1044525330 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[4] - 176418897 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[5] + 1200080426 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[6] - 1473231341 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[7] - 45705983 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[8] + 1770035416 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[9] - 1958414417 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[10] - 42063 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[11] - 1990404162 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[12] + 1804603682 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[13] - 40341101 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[14] - 1502002290 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[15] + 1236535329 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[1] - 165796510 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[6] - 1069501632 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[11] + 643717713 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[0] - 373897302 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[5] - 701558691 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[10] + 38016083 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[15] - 660478335 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[4] - 405537848 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[9] + 568446438 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[14] - 1019803690 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[3] - 187363961 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[8] + 1163531501 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[13] - 1444681467 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[2] - 51403784 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[7] + 1735328473 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[12] - 1926607734 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[5] - 378558 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[8] - 2022574463 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[11] + 1839030562 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[14] - 35309556 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[1] - 1530992060 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[4] + 1272893353 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[7] - 155497632 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[10] - 1094730640 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[13] + 681279174 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[0] - 358537222 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[3] - 722521979 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[6] + 76029189 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[9] - 640364487 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[12] - 421815835 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[15] + 530742520 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[2] - 995338651 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[0] - 198630844 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[7] + 1126891415 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[14] - 1416354905 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[5] - 57434055 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[12] + 1700485571 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[3] - 1894986606 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[10] - 1051523 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[1] - 2054922799 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[8] + 1873313359 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[15] - 30611744 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[6] - 1560198380 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[13] + 1309151649 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[4] - 145523070 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[11] - 1120210379 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[2] + 718787259 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[9] - 343485551 | 0) << 21 | r >>> 11) + e | 0, $[0] = _ + $[0] | 0, $[1] = r + $[1] | 0, $[2] = e + $[2] | 0, $[3] = n + $[3] | 0 } function r($) { var t, _ = []; for (t = 0; t < 64; t += 4)_[t >> 2] = $.charCodeAt(t) + ($.charCodeAt(t + 1) << 8) + ($.charCodeAt(t + 2) << 16) + ($.charCodeAt(t + 3) << 24); return _ } function e($) { var t, _ = []; for (t = 0; t < 64; t += 4)_[t >> 2] = $[t] + ($[t + 1] << 8) + ($[t + 2] << 16) + ($[t + 3] << 24); return _ } function n($) { var t, e, n, f, h, i, a = $.length, s = [1732584193, -271733879, -1732584194, 271733878]; for (t = 64; t <= a; t += 64)_(s, r($.substring(t - 64, t))); for (e = ($ = $.substring(t - 64)).length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], t = 0; t < e; t += 1)n[t >> 2] |= $.charCodeAt(t) << (t % 4 << 3); if (n[t >> 2] |= 128 << (t % 4 << 3), t > 55) for (_(s, n), t = 0; t < 16; t += 1)n[t] = 0; return h = parseInt((f = (f = 8 * a).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), i = parseInt(f[1], 16) || 0, n[14] = h, n[15] = i, _(s, n), s } function f($) { var _, r = ""; for (_ = 0; _ < 4; _ += 1)r += t[$ >> 8 * _ + 4 & 15] + t[$ >> 8 * _ & 15]; return r } function h($) { var t; for (t = 0; t < $.length; t += 1)$[t] = f($[t]); return $.join("") } function i($) { return /[\u0080-\uFFFF]/.test($) && ($ = unescape(encodeURIComponent($))), $ } function a($) { var t, _ = [], r = $.length; for (t = 0; t < r - 1; t += 2)_.push(parseInt($.substr(t, 2), 16)); return String.fromCharCode.apply(String, _) } function s() { this.reset() } return h(n("hello")), "undefined" == typeof ArrayBuffer || ArrayBuffer.prototype.slice || function () { function $($, t) { return ($ = 0 | $ || 0) < 0 ? Math.max($ + t, 0) : Math.min($, t) } ArrayBuffer.prototype.slice = function (t, _) { var r, e, n, f, h = this.byteLength, i = $(t, h), a = h; return void 0 !== _ && (a = $(_, h)), i > a ? new ArrayBuffer(0) : (r = a - i, e = new ArrayBuffer(r), n = new Uint8Array(e), f = new Uint8Array(this, i, r), n.set(f), e) } }(), s.prototype.append = function ($) { return this.appendBinary(i($)), this }, s.prototype.appendBinary = function ($) { this._buff += $, this._length += $.length; var t, e = this._buff.length; for (t = 64; t <= e; t += 64)_(this._hash, r(this._buff.substring(t - 64, t))); return this._buff = this._buff.substring(t - 64), this }, s.prototype.end = function ($) { var t, _, r = this._buff, e = r.length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; for (t = 0; t < e; t += 1)n[t >> 2] |= r.charCodeAt(t) << (t % 4 << 3); return this._finish(n, e), _ = h(this._hash), $ && (_ = a(_)), this.reset(), _ }, s.prototype.reset = function () { return this._buff = "", this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this }, s.prototype.getState = function () { return { buff: this._buff, length: this._length, hash: this._hash.slice() } }, s.prototype.setState = function ($) { return this._buff = $.buff, this._length = $.length, this._hash = $.hash, this }, s.prototype.destroy = function () { delete this._hash, delete this._buff, delete this._length }, s.prototype._finish = function ($, t) { var r, e, n, f = t; if ($[f >> 2] |= 128 << (f % 4 << 3), f > 55) for (_(this._hash, $), f = 0; f < 16; f += 1)$[f] = 0; e = parseInt((r = (r = 8 * this._length).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), n = parseInt(r[1], 16) || 0, $[14] = e, $[15] = n, _(this._hash, $) }, s.hash = function ($, t) { return s.hashBinary(i($), t) }, s.hashBinary = function ($, t) { var _ = h(n($)); return t ? a(_) : _ }, s.ArrayBuffer = function () { this.reset() }, s.ArrayBuffer.prototype.append = function ($) { var t, r, n, f, h, i = (r = this._buff.buffer, n = $, f = !0, (h = new Uint8Array(r.byteLength + n.byteLength)).set(new Uint8Array(r)), h.set(new Uint8Array(n), r.byteLength), f ? h : h.buffer), a = i.length; for (this._length += $.byteLength, t = 64; t <= a; t += 64)_(this._hash, e(i.subarray(t - 64, t))); return this._buff = new Uint8Array(t - 64 < a ? i.buffer.slice(t - 64) : 0), this }, s.ArrayBuffer.prototype.end = function ($) { var t, _, r = this._buff, e = r.length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; for (t = 0; t < e; t += 1)n[t >> 2] |= r[t] << (t % 4 << 3); return this._finish(n, e), _ = h(this._hash), $ && (_ = a(_)), this.reset(), _ }, s.ArrayBuffer.prototype.reset = function () { return this._buff = new Uint8Array(0), this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this }, s.ArrayBuffer.prototype.getState = function () { var $, t = s.prototype.getState.call(this); return t.buff = ($ = t.buff, String.fromCharCode.apply(null, new Uint8Array($))), t }, s.ArrayBuffer.prototype.setState = function ($) { return $.buff = function ($, t) { var _, r = $.length, e = new ArrayBuffer(r), n = new Uint8Array(e); for (_ = 0; _ < r; _ += 1)n[_] = $.charCodeAt(_); return t ? n : e }($.buff, !0), s.prototype.setState.call(this, $) }, s.ArrayBuffer.prototype.destroy = s.prototype.destroy, s.ArrayBuffer.prototype._finish = s.prototype._finish, s.ArrayBuffer.hash = function ($, t) { var r = h(function ($) { var t, r, n, f, h, i, a = $.length, s = [1732584193, -271733879, -1732584194, 271733878]; for (t = 64; t <= a; t += 64)_(s, e($.subarray(t - 64, t))); for (r = ($ = t - 64 < a ? $.subarray(t - 64) : new Uint8Array(0)).length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], t = 0; t < r; t += 1)n[t >> 2] |= $[t] << (t % 4 << 3); if (n[t >> 2] |= 128 << (t % 4 << 3), t > 55) for (_(s, n), t = 0; t < 16; t += 1)n[t] = 0; return h = parseInt((f = (f = 8 * a).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), i = parseInt(f[1], 16) || 0, n[14] = h, n[15] = i, _(s, n), s }(new Uint8Array($))); return t ? a(r) : r }, s }(), e = (($, t) => { try { let { salt: _ } = $.reduce(($, t) => ({ salt: r.hash($.salt + t.salt) }), { salt: t }); return `1.${_}` } catch (e) { return console.error("[calculateCaptchaSign:]", e), e } })(t.algorithms, "" + t.clientId + t.clientVersion + t.packageName + _ + t.timestamp); return ["YUMx5nI8ZU8Ap8pm", _, "ck0.IV9lup1uPyJTnnasuUnDV-1KpUpXN2vzYVodgXMkZ4lVw-SJWVLE1slzppHJR_-hlN85lZvBFfUlIpqeWi2L_SJ07pzSyiNN_4xFjAEJCpab8QudjJCdWLiKxK44gVpz83qd5dHcHOYIyi_3PWuO9MfJORr0tRpawk2NfMiDOgfyAaciHYCHglYI24_mOymW6dGPwfkdkKmdV7CWqFXkA8U5uoyG1v6uN3cpHzHaSKI", $, e] }
// prettier-ignore
function Env(name, opts) { class Http { constructor(env) { this.env = env } send(opts, method = "GET") { opts = "string" == typeof opts ? { url: opts } : opts; let sender = this.get; return "POST" === method && (sender = this.post), new Promise((resolve, reject) => { sender.call(this, opts, (err, resp, body) => { err ? reject(err) : resolve(resp) }) }) } get(opts) { return this.send.call(this.env, opts) } post(opts) { return this.send.call(this.env, opts, "POST") } } return new class { constructor(name, opts) { this.name = name, this.http = new Http(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, opts), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : "undefined" != typeof importModule ? "Scriptable" : "function" == typeof require && "undefined" != typeof $jsbox ? "JSBox" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } isScriptable() { return "Scriptable" === this.getEnv() } isJSBox() { return "JSBox" === this.getEnv() } toObj(str, defaultValue = null) { try { return JSON.parse(str) } catch { return defaultValue } } toStr(obj, defaultValue = null) { try { return JSON.stringify(obj) } catch { return defaultValue } } getjson(key, defaultValue) { let json = defaultValue; const val = this.getdata(key); if (val) try { json = JSON.parse(this.getdata(key)) } catch { } return json } setjson(val, key) { try { return this.setdata(JSON.stringify(val), key) } catch { return !1 } } getScript(url) { return new Promise(resolve => { this.get({ url: url }, (err, resp, body) => resolve(body)) }) } runScript(script, runOpts) { return new Promise(resolve => { let httpapi = this.getdata("@chavy_boxjs_userCfgs.httpapi"); httpapi = httpapi ? httpapi.replace(/\n/g, "").trim() : httpapi; let httpapi_timeout = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); httpapi_timeout = httpapi_timeout ? 1 * httpapi_timeout : 20, httpapi_timeout = runOpts && runOpts.timeout ? runOpts.timeout : httpapi_timeout; const [key, addr] = httpapi.split("@"), opts = { url: `http://${addr}/v1/scripting/evaluate`, body: { script_text: script, mock_type: "cron", timeout: httpapi_timeout }, headers: { "X-Key": key, Accept: "*/*" }, timeout: httpapi_timeout }; this.post(opts, (err, resp, body) => resolve(body)) }).catch(e => this.logErr(e)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const curDirDataFilePath = this.path.resolve(this.dataFile), rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile), isCurDirDataFile = this.fs.existsSync(curDirDataFilePath), isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath); if (!isCurDirDataFile && !isRootDirDataFile) return {}; { const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath; try { return JSON.parse(this.fs.readFileSync(datPath)) } catch (e) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const curDirDataFilePath = this.path.resolve(this.dataFile), rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile), isCurDirDataFile = this.fs.existsSync(curDirDataFilePath), isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath), jsondata = JSON.stringify(this.data); isCurDirDataFile ? this.fs.writeFileSync(curDirDataFilePath, jsondata) : isRootDirDataFile ? this.fs.writeFileSync(rootDirDataFilePath, jsondata) : this.fs.writeFileSync(curDirDataFilePath, jsondata) } } lodash_get(source, path, defaultValue) { const paths = path.replace(/\[(\d+)\]/g, ".$1").split("."); let result = source; for (const p of paths) if (result = Object(result)[p], void 0 === result) return defaultValue; return result } lodash_set(obj, path, value) { return Object(obj) !== obj ? obj : (Array.isArray(path) || (path = path.toString().match(/[^.[\]]+/g) || []), path.slice(0, -1).reduce((a, c, i) => Object(a[c]) === a[c] ? a[c] : a[c] = Math.abs(path[i + 1]) >> 0 == +path[i + 1] ? [] : {}, obj)[path[path.length - 1]] = value, obj) } getdata(key) { let val = this.getval(key); if (/^@/.test(key)) { const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key), objval = objkey ? this.getval(objkey) : ""; if (objval) try { const objedval = JSON.parse(objval); val = objedval ? this.lodash_get(objedval, paths, "") : val } catch (e) { val = "" } } return val } setdata(val, key) { let issuc = !1; if (/^@/.test(key)) { const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key), objdat = this.getval(objkey), objval = objkey ? "null" === objdat ? null : objdat || "{}" : "{}"; try { const objedval = JSON.parse(objval); this.lodash_set(objedval, paths, val), issuc = this.setval(JSON.stringify(objedval), objkey) } catch (e) { const objedval = {}; this.lodash_set(objedval, paths, val), issuc = this.setval(JSON.stringify(objedval), objkey) } } else issuc = this.setval(val, key); return issuc } getval(key) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(key); case "Quantumult X": return $prefs.valueForKey(key); case "Node.js": return this.data = this.loaddata(), this.data[key]; default: return this.data && this.data[key] || null } } setval(val, key) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(val, key); case "Quantumult X": return $prefs.setValueForKey(val, key); case "Node.js": return this.data = this.loaddata(), this.data[key] = val, this.writedata(), !0; default: return this.data && this.data[key] || null } } initGotEnv(opts) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, opts && (opts.headers = opts.headers ? opts.headers : {}, void 0 === opts.headers.Cookie && void 0 === opts.cookieJar && (opts.cookieJar = this.ckjar)) } get(request, callback = (() => { })) { switch (request.headers && (delete request.headers["Content-Type"], delete request.headers["Content-Length"], delete request.headers["content-type"], delete request.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (request.headers = request.headers || {}, Object.assign(request.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(request, (err, resp, body) => { !err && resp && (resp.body = body, resp.statusCode = resp.status ? resp.status : resp.statusCode, resp.status = resp.statusCode), callback(err, resp, body) }); break; case "Quantumult X": this.isNeedRewrite && (request.opts = request.opts || {}, Object.assign(request.opts, { hints: !1 })), $task.fetch(request).then(resp => { const { statusCode: status, statusCode: statusCode, headers: headers, body: body, bodyBytes: bodyBytes } = resp; callback(null, { status: status, statusCode: statusCode, headers: headers, body: body, bodyBytes: bodyBytes }, body, bodyBytes) }, err => callback(err && err.error || "UndefinedError")); break; case "Node.js": let iconv = require("iconv-lite"); this.initGotEnv(request), this.got(request).on("redirect", (resp, nextOpts) => { try { if (resp.headers["set-cookie"]) { const ck = resp.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); ck && this.ckjar.setCookieSync(ck, null), nextOpts.cookieJar = this.ckjar } } catch (e) { this.logErr(e) } }).then(resp => { const { statusCode: status, statusCode: statusCode, headers: headers, rawBody: rawBody } = resp, body = iconv.decode(rawBody, this.encoding); callback(null, { status: status, statusCode: statusCode, headers: headers, rawBody: rawBody, body: body }, body) }, err => { const { message: error, response: resp } = err; callback(error, resp, resp && iconv.decode(resp.rawBody, this.encoding)) }) } } post(request, callback = (() => { })) { const method = request.method ? request.method.toLocaleLowerCase() : "post"; switch (request.body && request.headers && !request.headers["Content-Type"] && !request.headers["content-type"] && (request.headers["content-type"] = "application/x-www-form-urlencoded"), request.headers && (delete request.headers["Content-Length"], delete request.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (request.headers = request.headers || {}, Object.assign(request.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[method](request, (err, resp, body) => { !err && resp && (resp.body = body, resp.statusCode = resp.status ? resp.status : resp.statusCode, resp.status = resp.statusCode), callback(err, resp, body) }); break; case "Quantumult X": request.method = method, this.isNeedRewrite && (request.opts = request.opts || {}, Object.assign(request.opts, { hints: !1 })), $task.fetch(request).then(resp => { const { statusCode: status, statusCode: statusCode, headers: headers, body: body, bodyBytes: bodyBytes } = resp; callback(null, { status: status, statusCode: statusCode, headers: headers, body: body, bodyBytes: bodyBytes }, body, bodyBytes) }, err => callback(err && err.error || "UndefinedError")); break; case "Node.js": let iconv = require("iconv-lite"); this.initGotEnv(request); const { url: url, ..._request } = request; this.got[method](url, _request).then(resp => { const { statusCode: status, statusCode: statusCode, headers: headers, rawBody: rawBody } = resp, body = iconv.decode(rawBody, this.encoding); callback(null, { status: status, statusCode: statusCode, headers: headers, rawBody: rawBody, body: body }, body) }, err => { const { message: error, response: resp } = err; callback(error, resp, resp && iconv.decode(resp.rawBody, this.encoding)) }) } } time(fmt, ts = null) { const date = ts ? new Date(ts) : new Date; let o = { "M+": date.getMonth() + 1, "d+": date.getDate(), "H+": date.getHours(), "m+": date.getMinutes(), "s+": date.getSeconds(), "q+": Math.floor((date.getMonth() + 3) / 3), S: date.getMilliseconds() }; /(y+)/.test(fmt) && (fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let k in o) new RegExp("(" + k + ")").test(fmt) && (fmt = fmt.replace(RegExp.$1, 1 == RegExp.$1.length ? o[k] : ("00" + o[k]).substr(("" + o[k]).length))); return fmt } queryStr(options) { let queryString = ""; for (const key in options) { let value = options[key]; null != value && "" !== value && ("object" == typeof value && (value = JSON.stringify(value)), queryString += `${key}=${value}&`) } return queryString = queryString.substring(0, queryString.length - 1), queryString } msg(title = name, subt = "", desc = "", opts) { const toEnvOpts = rawopts => { switch (typeof rawopts) { case void 0: return rawopts; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: rawopts }; case "Loon": case "Shadowrocket": return rawopts; case "Quantumult X": return { "open-url": rawopts }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let openUrl; return { url: rawopts.url || rawopts.openUrl || rawopts["open-url"] } } case "Loon": { let openUrl, mediaUrl; return { openUrl: rawopts.openUrl || rawopts.url || rawopts["open-url"], mediaUrl: rawopts.mediaUrl || rawopts["media-url"] } } case "Quantumult X": { let openUrl, mediaUrl, updatePasteboard; return { "open-url": rawopts["open-url"] || rawopts.url || rawopts.openUrl, "media-url": rawopts["media-url"] || rawopts.mediaUrl, "update-pasteboard": rawopts["update-pasteboard"] || rawopts.updatePasteboard } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(title, subt, desc, toEnvOpts(opts)); break; case "Quantumult X": $notify(title, subt, desc, toEnvOpts(opts)); break; case "Node.js": }if (!this。isMuteLog) { let logs = ["", "==============📣系统通知📣=============="]; logs.push(标题), subt && logs.push(subt), desc && logs.push(desc), console.log(logs.join("\n")), this。logs = this。logs。concat(logs) } } notify(标题 = name, subtitle = "", content = "", 选项 = {}) { const openURL = options["open-url"], mediaURL = options["media-url"]; if (this。isQuanX() && $notify(title, subtitle, content, options), this。isSurge() && $notification.post(title, subtitle, content + `${mediaURL ? "\n多媒体:" + mediaURL : ""}`, { url: openURL }), this。isLoon()) { let opts = {}; openURL && (opts.openUrl = openURL), mediaURL && (opts.mediaUrl = mediaURL), "{}" === JSON.stringify(opts) ? $notification.post(title, subtitle, content) : $notification.post(title, subtitle, content, opts) } if (this。isJSBox()) { const content_ = content + (openURL ? `\n点击跳转: ${openURL}` : "") + (mediaURL ? `\n多媒体: ${mediaURL}` : ""), push = require("push"); push.schedule({ 标题: title, 内容: (subtitle ? subtitle + "\n" : "") + content_ }) } if (!this。isMuteLog) { let logs = ["", "==============📣系统通知📣=============="]; logs.push(标题), subtitle && logs.push(subtitle), content && logs.push(content + (openURL ? `\n点击跳转: ${openURL}` : "") + (mediaURL ? `\n多媒体: ${mediaURL}` : "")), console.log(logs.join("\n")), this。logs = this。logs。concat(logs) } } log(...logs) { logs.length > 0 && (this。logs = [...this。logs, ...logs]), console.log(logs.join(this。logSeparator)) } logErr(err, msg) { switch (this。getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": 默认: this。log("", `❗️${this。名字}, 错误!`, err); break; case "Node.js": this。log("", `❗️${this。名字}, 错误!`, err.stack) } } wait(time) { return 新建 Promise(resolve => setTimeout(resolve, time)) } 已完成(val = {}) { const endTime = (新建 日期)。getTime(), costTime = (endTime - this。startTime) / 1e3; switch (this。log("", `🔔${this。名字}, 结束! 🕛 ${costTime} 秒`), this。log(), this。getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": 默认: $done(val); break; case "Node.js": process.exit(1) } } }(name, opts) }
