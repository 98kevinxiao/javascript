//小白脸
const scriptName = 'Pikpak'
    , $ = 新建 Env(scriptName);
function http(t, e = "post") {
    e = e.toLowerCase();
    return 新建 Promise((resolve, reject) => {
        $[e](t, (err, response, data) => {
            // console.log(response)
            if (err) {
                const error = data.match(/[\u4e00-\u9fff]+/g)?.join(" ") + "\n" + t.url;
                reject(`err: ${err || error}`);
            } else resolve(typeof data == "string" && !/<div/。test(data) ? JSON.parse(data) : data);
        })
    })
}

class Pikpak {
    constructor(pikpak_id) {
        this。captcha_token = pikpak_id[2];
        this。timestamp = pikpak_id[3];
        this。captcha_sign = pikpak_id[4];
        this。内容 = {
            client_id: pikpak_id[0],
            device_id: pikpak_id[1],
        };
        this。headers = {
            origin: "https://mypikpak.com",
            referer: "https://mypikpak.com/",
            "x-client-id": pikpak_id[0],
            "x-device-id": pikpak_id[1],
        };
        this。email = "";
    }

    async getEmailCode() {
        await this。newMail(); //获取邮件
        const captchaToken = await this。getCaptchaToken("POST:/v1/auth/verification", this。captcha_token); //获取安全认证token
        const verificationId = await this。sendVerificationRequest(captchaToken); //发送验证码
        const verificationCode = await this。getVerificationCode(); //获取验证码
        const verificationToken = await this。getVerificationToken(verificationId, verificationCode); //获取注册token
        await this。gregister(verificationToken, verificationCode, captchaToken); //模拟注册
        // const signin_captchaToken = await this.getCaptchaToken("POST:/v1/auth/signin"); //账号验证tk
        $.msg($.名字, "注册成功", `账号: ${this。email}`)
        // const [access_token, user_id] = await this.signin(signin_captchaToken); //获取账号tk
        // const invite_captchaToken = await this.getCaptchaToken("POST:/vip/v1/activity/invite", signin_captchaToken, user_id); //验证新设备tk
        // await this.invite(invite_captchaToken, access_token);
        // await this.invite(access_token);
    }

    async newMail() {
        const list = {
            url: "https://api.internal.temp-mail.io/api/v3/email/new",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
            },
            内容: `{"min_name_length":10,"max_name_length":10}`,
        };
        const json = await http(list);
        this。email = json.email;
    }

    async getCaptchaToken(操作, captcha_tokens, user_id = "") {

        const tokens = captcha_tokens
            ? { captcha_token: captcha_tokens }
            : {};
        const meta = actions.includes("vip")
            ? {
                meta: {
                    captcha_sign: this。captcha_sign,
                    timestamp: `${this。timestamp}`,
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
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const json = (await http({ url: `https://api.internal.temp-mail.io/api/v3/email/${this.email}/messages` }, "get"))?.[0]
                ?.body_text;

            if (json) {
                const code = json.match(/(\d{6})/)[0];
                return code;
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
                ...this.headers,
                "x-captcha-token": captcha_token,
            },
            body: JSON.stringify({
                username: this.email,
                password: "Aa147258",
                client_id: "YUMx5nI8ZU8Ap8pm",
            }),
        }
        const { access_token, sub } = await http(list);
        return [`Bearer ${access_token}`, sub];
    }


    // async invite(invite_captchaToken, access_token) {
    //     let list = {
    //         url: "https://api-drive.mypikpak.com/vip/v1/activity/invite",
    //         headers: {
    //             ...this.headers,
    //             "x-captcha-token": invite_captchaToken,
    //             authorization: access_token,
    //         },
    //         body: `{"from":"web"}`,
    //     }
    //     const { free_days } = await http(list);
    //     console.log(this.email);
    //     console.log(`获得vip ${free_days}天`);
    //     $.msg(`获得vip ${free_days}天`, this.email, "邮件在日志里看")
    //     //结束
    // }
    async invite(access_token) {
        let invitation = {
            url: "https://api-drive.mypikpak.com/vip/v1/activity/invite",
            headers: {
                ...this.headers,
                authorization: access_token,
            },
            body: `{"activation_code":"${this.invitation_Code}","page":"invite"}`
        }
        const resp = await http(invitation);
        console.log(JSON.stringify(resp, null, 2))
        let { add_days } = resp;
        console.log(this.email);
        console.log(`获得vip ${add_days}天`);
        $.msg(`获得vip ${add_days}天`, this.email, "邮件在日志里看")
        //结束
    }

}


const pikpak_id = Data();

new Pikpak(pikpak_id).getEmailCode().catch((err) => {
    $.msg("", "", err);
    console.log(err);
})
    .finally(() => $.done());





function Data() { let $ = Date.now(), t = { clientId: "YUMx5nI8ZU8Ap8pm", clientVersion: "1.0.0", packageName: "mypikpak.com", timestamp: `${$}`, algorithms: [{ alg: "md5", salt: "mg3UtlOJ5/6WjxHsGXtAthe" }, { alg: "md5", salt: "kRG2RIlL/eScz3oDbzeF1" }, { alg: "md5", salt: "uOIOBDcR5QALlRUUK4JVoreEI0i3RG8ZiUf2hMOH" }, { alg: "md5", salt: "wa+0OkzHAzpyZ0S/JAnHmF2BlMR9Y" }, { alg: "md5", salt: "ZWV2OkSLoNkmbr58v0f6U3udtqUNP7XON" }, { alg: "md5", salt: "Jg4cDxtvbmlakZIOpQN0oY1P0eYkA4xquMY9/xqwZE5sjrcHwufR" }, { alg: "md5", salt: "XHfs" }, { alg: "md5", salt: "S4/mRgYpWyNGEUxVsYBw8n//zlywe5Ga1R8ffWJSOPZnMqWb4w" },] }, _ = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function ($) { var t = 16 * Math.random() | 0; return ("x" == $ ? t : 3 & t | 8).toString(16) }), r = function ($) { "use strict"; var t = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]; function _($, t) { var _ = $[0], r = $[1], e = $[2], n = $[3]; r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[0] - 680876936 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[1] - 389564586 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[2] + 606105819 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[3] - 1044525330 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[4] - 176418897 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[5] + 1200080426 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[6] - 1473231341 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[7] - 45705983 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[8] + 1770035416 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[9] - 1958414417 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[10] - 42063 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[11] - 1990404162 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & e | ~r & n) + t[12] + 1804603682 | 0) << 7 | _ >>> 25) + r | 0) & r | ~_ & e) + t[13] - 40341101 | 0) << 12 | n >>> 20) + _ | 0) & _ | ~n & r) + t[14] - 1502002290 | 0) << 17 | e >>> 15) + n | 0) & n | ~e & _) + t[15] + 1236535329 | 0) << 22 | r >>> 10) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[1] - 165796510 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[6] - 1069501632 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[11] + 643717713 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[0] - 373897302 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[5] - 701558691 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[10] + 38016083 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[15] - 660478335 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[4] - 405537848 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[9] + 568446438 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[14] - 1019803690 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[3] - 187363961 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[8] + 1163531501 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r & n | e & ~n) + t[13] - 1444681467 | 0) << 5 | _ >>> 27) + r | 0) & e | r & ~e) + t[2] - 51403784 | 0) << 9 | n >>> 23) + _ | 0) & r | _ & ~r) + t[7] + 1735328473 | 0) << 14 | e >>> 18) + n | 0) & _ | n & ~_) + t[12] - 1926607734 | 0) << 20 | r >>> 12) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[5] - 378558 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[8] - 2022574463 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[11] + 1839030562 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[14] - 35309556 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[1] - 1530992060 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[4] + 1272893353 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[7] - 155497632 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[10] - 1094730640 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[13] + 681279174 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[0] - 358537222 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[3] - 722521979 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[6] + 76029189 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((e = ((e += ((n = ((n += ((_ = ((_ += (r ^ e ^ n) + t[9] - 640364487 | 0) << 4 | _ >>> 28) + r | 0) ^ r ^ e) + t[12] - 421815835 | 0) << 11 | n >>> 21) + _ | 0) ^ _ ^ r) + t[15] + 530742520 | 0) << 16 | e >>> 16) + n | 0) ^ n ^ _) + t[2] - 995338651 | 0) << 23 | r >>> 9) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[0] - 198630844 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[7] + 1126891415 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[14] - 1416354905 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[5] - 57434055 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[12] + 1700485571 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[3] - 1894986606 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[10] - 1051523 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[1] - 2054922799 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[8] + 1873313359 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[15] - 30611744 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[6] - 1560198380 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[13] + 1309151649 | 0) << 21 | r >>> 11) + e | 0, r = ((r += ((n = ((n += (r ^ ((_ = ((_ += (e ^ (r | ~n)) + t[4] - 145523070 | 0) << 6 | _ >>> 26) + r | 0) | ~e)) + t[11] - 1120210379 | 0) << 10 | n >>> 22) + _ | 0) ^ ((e = ((e += (_ ^ (n | ~r)) + t[2] + 718787259 | 0) << 15 | e >>> 17) + n | 0) | ~_)) + t[9] - 343485551 | 0) << 21 | r >>> 11) + e | 0, $[0] = _ + $[0] | 0, $[1] = r + $[1] | 0, $[2] = e + $[2] | 0, $[3] = n + $[3] | 0 } function r($) { var t, _ = []; for (t = 0; t < 64; t += 4)_[t >> 2] = $.charCodeAt(t) + ($.charCodeAt(t + 1) << 8) + ($.charCodeAt(t + 2) << 16) + ($.charCodeAt(t + 3) << 24); return _ } function e($) { var t, _ = []; for (t = 0; t < 64; t += 4)_[t >> 2] = $[t] + ($[t + 1] << 8) + ($[t + 2] << 16) + ($[t + 3] << 24); return _ } function n($) { var t, e, n, f, h, i, a = $.length, s = [1732584193, -271733879, -1732584194, 271733878]; for (t = 64; t <= a; t += 64)_(s, r($.substring(t - 64, t))); for (e = ($ = $.substring(t - 64)).length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], t = 0; t < e; t += 1)n[t >> 2] |= $.charCodeAt(t) << (t % 4 << 3); if (n[t >> 2] |= 128 << (t % 4 << 3), t > 55) for (_(s, n), t = 0; t < 16; t += 1)n[t] = 0; return h = parseInt((f = (f = 8 * a).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), i = parseInt(f[1], 16) || 0, n[14] = h, n[15] = i, _(s, n), s } function f($) { var _, r = ""; for (_ = 0; _ < 4; _ += 1)r += t[$ >> 8 * _ + 4 & 15] + t[$ >> 8 * _ & 15]; return r } function h($) { var t; for (t = 0; t < $.length; t += 1)$[t] = f($[t]); return $.join("") } function i($) { return /[\u0080-\uFFFF]/.test($) && ($ = unescape(encodeURIComponent($))), $ } function a($) { var t, _ = [], r = $.length; for (t = 0; t < r - 1; t += 2)_.push(parseInt($.substr(t, 2), 16)); return String.fromCharCode.apply(String, _) } function s() { this.reset() } return h(n("hello")), "undefined" == typeof ArrayBuffer || ArrayBuffer.prototype.slice || function () { function $($, t) { return ($ = 0 | $ || 0) < 0 ? Math.max($ + t, 0) : Math.min($, t) } ArrayBuffer.prototype.slice = function (t, _) { var r, e, n, f, h = this.byteLength, i = $(t, h), a = h; return void 0 !== _ && (a = $(_, h)), i > a ? new ArrayBuffer(0) : (r = a - i, e = new ArrayBuffer(r), n = new Uint8Array(e), f = new Uint8Array(this, i, r), n.set(f), e) } }(), s.prototype.append = function ($) { return this.appendBinary(i($)), this }, s.prototype.appendBinary = function ($) { this._buff += $, this._length += $.length; var t, e = this._buff.length; for (t = 64; t <= e; t += 64)_(this._hash, r(this._buff.substring(t - 64, t))); return this._buff = this._buff.substring(t - 64), this }, s.prototype.end = function ($) { var t, _, r = this._buff, e = r.length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; for (t = 0; t < e; t += 1)n[t >> 2] |= r.charCodeAt(t) << (t % 4 << 3); return this._finish(n, e), _ = h(this._hash), $ && (_ = a(_)), this.reset(), _ }, s.prototype.reset = function () { return this._buff = "", this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this }, s.prototype.getState = function () { return { buff: this._buff, length: this._length, hash: this._hash.slice() } }, s.prototype.setState = function ($) { return this._buff = $.buff, this._length = $.length, this._hash = $.hash, this }, s.prototype.destroy = function () { delete this._hash, delete this._buff, delete this._length }, s.prototype._finish = function ($, t) { var r, e, n, f = t; if ($[f >> 2] |= 128 << (f % 4 << 3), f > 55) for (_(this._hash, $), f = 0; f < 16; f += 1)$[f] = 0; e = parseInt((r = (r = 8 * this._length).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), n = parseInt(r[1], 16) || 0, $[14] = e, $[15] = n, _(this._hash, $) }, s.hash = function ($, t) { return s.hashBinary(i($), t) }, s.hashBinary = function ($, t) { var _ = h(n($)); return t ? a(_) : _ }, s.ArrayBuffer = function () { this.reset() }, s.ArrayBuffer.prototype.append = function ($) { var t, r, n, f, h, i = (r = this._buff.buffer, n = $, f = !0, (h = new Uint8Array(r.byteLength + n.byteLength)).set(new Uint8Array(r)), h.set(new Uint8Array(n), r.byteLength), f ? h : h.buffer), a = i.length; for (this._length += $.byteLength, t = 64; t <= a; t += 64)_(this._hash, e(i.subarray(t - 64, t))); return this._buff = new Uint8Array(t - 64 < a ? i.buffer.slice(t - 64) : 0), this }, s.ArrayBuffer.prototype.end = function ($) { var t, _, r = this._buff, e = r.length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; for (t = 0; t < e; t += 1)n[t >> 2] |= r[t] << (t % 4 << 3); return this._finish(n, e), _ = h(this._hash), $ && (_ = a(_)), this.reset(), _ }, s.ArrayBuffer.prototype.reset = function () { return this._buff = new Uint8Array(0), this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this }, s.ArrayBuffer.prototype.getState = function () { var $, t = s.prototype.getState.call(this); return t.buff = ($ = t.buff, String.fromCharCode.apply(null, new Uint8Array($))), t }, s.ArrayBuffer.prototype.setState = function ($) { return $.buff = function ($, t) { var _, r = $.length, e = new ArrayBuffer(r), n = new Uint8Array(e); for (_ = 0; _ < r; _ += 1)n[_] = $.charCodeAt(_); return t ? n : e }($.buff, !0), s.prototype.setState.call(this, $) }, s.ArrayBuffer.prototype.destroy = s.prototype.destroy, s.ArrayBuffer.prototype._finish = s.prototype._finish, s.ArrayBuffer.hash = function ($, t) { var r = h(function ($) { var t, r, n, f, h, i, a = $.length, s = [1732584193, -271733879, -1732584194, 271733878]; for (t = 64; t <= a; t += 64)_(s, e($.subarray(t - 64, t))); for (r = ($ = t - 64 < a ? $.subarray(t - 64) : new Uint8Array(0)).length, n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], t = 0; t < r; t += 1)n[t >> 2] |= $[t] << (t % 4 << 3); if (n[t >> 2] |= 128 << (t % 4 << 3), t > 55) for (_(s, n), t = 0; t < 16; t += 1)n[t] = 0; return h = parseInt((f = (f = 8 * a).toString(16).match(/(.*?)(.{0,8})$/))[2], 16), i = parseInt(f[1], 16) || 0, n[14] = h, n[15] = i, _(s, n), s }(new Uint8Array($))); return t ? a(r) : r }, s }(), e = (($, t) => { try { let { salt: _ } = $.reduce(($, t) => ({ salt: r.hash($.salt + t.salt) }), { salt: t }); return `1.${_}` } catch (e) { return console.error("[calculateCaptchaSign:]", e), e } })(t.algorithms, "" + t.clientId + t.clientVersion + t.packageName + _ + t.timestamp); return ["YUMx5nI8ZU8Ap8pm", _, "ck0.IV9lup1uPyJTnnasuUnDV-1KpUpXN2vzYVodgXMkZ4lVw-SJWVLE1slzppHJR_-hlN85lZvBFfUlIpqeWi2L_SJ07pzSyiNN_4xFjAEJCpab8QudjJCdWLiKxK44gVpz83qd5dHcHOYIyi_3PWuO9MfJORr0tRpawk2NfMiDOgfyAaciHYCHglYI24_mOymW6dGPwfkdkKmdV7CWqFXkA8U5uoyG1v6uN3cpHzHaSKI", $, e] }

function Env(t, e) {
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            } : t;
            let s = this.get;
            return "POST" === e.toUpperCase() && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date)
                .getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch { }
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "")
                    .trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), a = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {
                        script_text: t,
                        mock_type: "cron",
                        timeout: r
                    },
                    headers: {
                        "X-Key": o,
                        Accept: "*/*"
                    }
                };
                this.post(a, (t, e, i) => s(i))
            })
                .catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode()) return {}; {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i) return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1")
                .split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r) return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString()
                .match(/[^.[\]]+/g) || []), e.slice(0, -1)
                    .reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => { })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t)
                .then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t)
                    .on("redirect", (t, e) => {
                        try {
                            if (t.headers["set-cookie"]) {
                                const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse)
                                    .toString();
                                this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                            }
                        } catch (t) {
                            this.logErr(t)
                        }
                    })
                    .then(t => {
                        const {
                            statusCode: s,
                            statusCode: i,
                            headers: r,
                            body: o
                        } = t;
                        e(null, {
                            status: s,
                            statusCode: i,
                            headers: r,
                            body: o
                        }, o)
                    }, t => {
                        const {
                            message: s,
                            response: i
                        } = t;
                        e(s, i, i && i.body)
                    }))
        }
        post(t, e = (() => { })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                "X-Surge-Skip-Scripting": !1
            })), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            });
            else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                hints: !1
            })), $task.fetch(t)
                .then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i)
                    .then(t => {
                        const {
                            statusCode: s,
                            statusCode: i,
                            headers: r,
                            body: o
                        } = t;
                        e(null, {
                            status: s,
                            statusCode: i,
                            headers: r,
                            body: o
                        }, o)
                    }, t => {
                        const {
                            message: s,
                            response: i
                        } = t;
                        e(s, i, i && i.body)
                    })
            }
        }
        time(t) {
            let e = {
                "M+": (new Date)
                    .getMonth() + 1,
                "d+": (new Date)
                    .getDate(),
                "H+": (new Date)
                    .getHours(),
                "m+": (new Date)
                    .getMinutes(),
                "s+": (new Date)
                    .getSeconds(),
                "q+": Math.floor(((new Date)
                    .getMonth() + 3) / 3),
                S: (new Date)
                    .getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date)
                .getFullYear() + "")
                .substr(4 - RegExp.$1.length)));
            for (let s in e) new RegExp("(" + s + ")")
                .test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s])
                    .substr(("" + e[s])
                        .length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this。isLoon() ? t : this。isQuanX() ? {
                    "open-url": t
                } : this。isSurge() ? {
                    url: t
                } : void 0;
                if ("object" == typeof t) {
                    if (this。isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this。isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this。isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            this。isMute || (this。isSurge() || this。isLoon() ? $notification.post(e, s, i, o(r)) : this。isQuanX() && $notify(e, s, i, o(r)));
            let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
            h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this。logs = this。logs。concat(h)
        }
        log(...t) {
            t.length > 0 && (this。logs = [...this。logs, ...t]), console.log(t.join(this。logSeparator))
        }
        logErr(t, e) {
            const s = !this。isSurge() && !this。isQuanX() && !this。isLoon();
            s ? this。log("", `\u2757\ufe0f${this。名字}, \u9519\u8bef!`, t.stack) : this。log("", `\u2757\ufe0f${this。名字}, \u9519\u8bef!`, t)
        }
        wait(t) {
            return 新建 Promise(e => setTimeout(e, t))
        }
        已完成(t = {}) {
            const e = (新建 日期)
                。getTime(),
                s = (e - this。startTime) / 1e3;
            this。log("", `\ud83d\udd14${this。名字}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this。log(), (this。isSurge() || this。isQuanX() || this。isLoon()) && $done(t)
        }
    }(t, e)
}
