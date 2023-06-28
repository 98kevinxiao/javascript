
const $argument = '33092726'
const scriptName = 'PikPak';
const $env = new Env(scriptName);
function http(t, e = "post") {
    e = e.toLowerCase();
    return new Promise((resolve, reject) => {
        console.log(JSON.stringify(t))
        $env[e](t, (error, response, data) => {
            if (error) reject(error);
            else resolve(typeof data == "string" ? JSON.parse(data) : data);
        })
    })
}
class Pikpak {
    constructor(t) {
        this.captcha_token = t[2], this.timestamp = t[3], this.captcha_sign = t[4], this.body = {
            client_id: t[0],
            device_id: t[1]
        }, this.headers = {
            referer: "https://mypikpak.com/",
            "x-client-id": t[0],
            "x-device-id": t[1]
        }, this.email = ""
    }
    async getEmailCode() {
        if ("undefined" === typeof $argument) throw "请填入验证码,也不要手动运行";
        if (isNaN($argument)) throw "邀请码必须为数字";
        await this.newMail();
        $env.wait(1000);
        // console.log(`邮箱为: ${this.email}`)
        let t = await this.getCaptchaToken("POST:/v1/auth/verification", this.captcha_token);
        let e = await this.sendVerificationRequest(t);
        // console.log(`发送验证码成功,验证码id为: ${e}`)
        let i = await this.getVerificationCode();
        // console.log(`获取验证码成功,验证码为: ${i}`)
        let $ = await this.getVerificationToken(e, i);
        // console.log(`获取验证码token成功,验证码token为: ${$}`)
        await this.gregister($, i, t);
        // console.log(`注册成功`);
        $env.msg(`PikPak注册成功 🎉🎉🎉`, '', `${this.email}\nAa123456`);
        // let a = await this.getCaptchaToken("POST:/v1/auth/signin", t);
        // console.log(`获取登录captchaToken成功,captchaToken为: ${a}`)
        // let r = await this.signin(a);
        // console.log(`登录成功,token为: ${r}`)
        // let n = await this.getCaptchaToken("POST:/vip/v1/activity/invite", a);
        // console.log(`获取邀请captchaToken成功,captchaToken为: ${n}`)
        // await this.invite(n, r)
    }
    async newMail() {
        let t = await http({
            url: "https://api.internal.temp-mail.io/api/v3/email/new",
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: '{"min_name_length":10,"max_name_length":10}'
        });
        this.email = t.email
    }
    async getCaptchaToken(t, e) {
        let i = t.includes("vip") ? {
            meta: {
                captcha_sign: this.captcha_sign,
                timestamp: `${this.timestamp}`,
                user_id: "ZBsCRuG84Dlo9UuV",
                client_version: "1.0.0",
                package_name: "mypikpak.com"
            }
        } : {
            meta: {
                email: this.email
            }
        },
            $ = {
                url: "https://user.mypikpak.com/v1/shield/captcha/init",
                headers: {
                    ...this.headers,
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                    ...this.body,
                    captcha_token: e,
                    ...i,
                    action: t
                })
            },
            {
                captcha_token: a
            } = await http($);
        return a
    }
    async sendVerificationRequest(t) {
        let e = {
            url: "https://user.mypikpak.com/v1/auth/verification",
            headers: {
                ...this.headers,
                "Content-Type": "application/json;charset=UTF-8",
                "x-captcha-token": t
            },
            body: JSON.stringify({
                client_id: this.body.client_id,
                email: this.email,
                usage: "REGISTER",
                selected_channel: "VERIFICATION_EMAIL",
                target: "ANY"
            })
        },
            {
                verification_id: i
            } = await http(e);
        return i
    }
    async getVerificationCode() {
        for (; ;) {
            await new Promise(t => setTimeout(t, 500));
            let t = (await http({ url: `https://api.internal.temp-mail.io/api/v3/email/${this.email}/messages` }, "get"))?.[0]?.body_text;
            if (t) {
                let e = t.match(/(\d{6})/)[0];
                return e
            }
        }
    }
    async getVerificationToken(t, e) {
        let i = {
            url: "https://user.mypikpak.com/v1/auth/verification/verify",
            headers: {
                ...this.headers,
            },
            body: JSON.stringify({
                verification_id: t,
                verification_code: e,
                client_id: this.body.client_id
            })
        },
            {
                verification_token: $
            } = await http(i);
        return $
    }
    async gregister(t, e, i) {
        let $ = {
            url: "https://user.mypikpak.com/v1/auth/signup",
            headers: this.headers,
            body: JSON.stringify({
                email: this.email,
                password: "Aa123456",
                client_id: this.body.client_id,
                verification_token: t,
                verification_code: e
            })
        };
        return await http($)
    }
    async signin(t) {
        let e = {
            url: "https://user.mypikpak.com/v1/auth/signin",
            headers: {
                ...this.headers,
                "x-captcha-token": t
            },
            body: JSON.stringify({
                username: this.email,
                password: "Aa123456",
                client_id: "YcrttD06T9PIkqAY",
                client_secret: "A3zfcmfNEeyTH0pX2k4GNg"
            })
        },
            {
                access_token: i
            } = await http(e);
        return `Bearer ${i}`
    }
    async invite(t, e) {
        const i = {
            url: "https://api-drive.mypikpak.com/vip/v1/activity/invite",
            headers: {
                ...this.headers,
                "Content-Type": "application/json;charset=UTF-8",
                "x-captcha-token": t,
                authorization: e
            },
            body: "{}"
        },
            {
                free_days: $
            } = await http(i);
        if (!$) throw "账号已被使用过,请重新运行";
        i.url = "https://api-drive.mypikpak.com/vip/v1/order/activation-code",
            i.body = `{"activation_code":"${$argument}","page":"invite"}`;
        let {
            add_days: a,
            data: {
                expire: r
            }
        } = await http(i);
        if (!a) throw "无奖励，可能已被风控可以准备换号了";
        // $notification.post
        $env.msg(`白嫖成功 🎉🎉🎉`, `刷新时间 ${r}`, `第一次刷奖励5天,后续都是2天`)
    }
}
const pikpak_id = Data();
// 逆向解密 大佬牛逼
function Data() {
    let t = Date.now(),
        e = {
            clientId: "YUMx5nI8ZU8Ap8pm",
            clientVersion: "1.0.0",
            packageName: "mypikpak.com",
            timestamp: `${t}`,
            algorithms: [{
                alg: "md5",
                salt: "mg3UtlOJ5/6WjxHsGXtAthe"
            }, {
                alg: "md5",
                salt: "kRG2RIlL/eScz3oDbzeF1"
            }, {
                alg: "md5",
                salt: "uOIOBDcR5QALlRUUK4JVoreEI0i3RG8ZiUf2hMOH"
            }, {
                alg: "md5",
                salt: "wa+0OkzHAzpyZ0S/JAnHmF2BlMR9Y"
            }, {
                alg: "md5",
                salt: "ZWV2OkSLoNkmbr58v0f6U3udtqUNP7XON"
            }, {
                alg: "md5",
                salt: "Jg4cDxtvbmlakZIOpQN0oY1P0eYkA4xquMY9/xqwZE5sjrcHwufR"
            }, {
                alg: "md5",
                salt: "XHfs"
            }, {
                alg: "md5",
                salt: "S4/mRgYpWyNGEUxVsYBw8n//zlywe5Ga1R8ffWJSOPZnMqWb4w"
            },]
        },
        i = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (t) {
            var e = 16 * Math.random() | 0;
            return ("x" == t ? e : 3 & e | 8)
                .toString(16)
        }),
        $ = function (t) {
            "use strict";
            var e = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

            function i(t, e) {
                var i = t[0],
                    $ = t[1],
                    a = t[2],
                    r = t[3];
                $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & a | ~$ & r) + e[0] - 680876936 | 0) << 7 | i >>> 25) + $ | 0) & $ | ~i & a) + e[1] - 389564586 | 0) << 12 | r >>> 20) + i | 0) & i | ~r & $) + e[2] + 606105819 | 0) << 17 | a >>> 15) + r | 0) & r | ~a & i) + e[3] - 1044525330 | 0) << 22 | $ >>> 10) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & a | ~$ & r) + e[4] - 176418897 | 0) << 7 | i >>> 25) + $ | 0) & $ | ~i & a) + e[5] + 1200080426 | 0) << 12 | r >>> 20) + i | 0) & i | ~r & $) + e[6] - 1473231341 | 0) << 17 | a >>> 15) + r | 0) & r | ~a & i) + e[7] - 45705983 | 0) << 22 | $ >>> 10) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & a | ~$ & r) + e[8] + 1770035416 | 0) << 7 | i >>> 25) + $ | 0) & $ | ~i & a) + e[9] - 1958414417 | 0) << 12 | r >>> 20) + i | 0) & i | ~r & $) + e[10] - 42063 | 0) << 17 | a >>> 15) + r | 0) & r | ~a & i) + e[11] - 1990404162 | 0) << 22 | $ >>> 10) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & a | ~$ & r) + e[12] + 1804603682 | 0) << 7 | i >>> 25) + $ | 0) & $ | ~i & a) + e[13] - 40341101 | 0) << 12 | r >>> 20) + i | 0) & i | ~r & $) + e[14] - 1502002290 | 0) << 17 | a >>> 15) + r | 0) & r | ~a & i) + e[15] + 1236535329 | 0) << 22 | $ >>> 10) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & r | a & ~r) + e[1] - 165796510 | 0) << 5 | i >>> 27) + $ | 0) & a | $ & ~a) + e[6] - 1069501632 | 0) << 9 | r >>> 23) + i | 0) & $ | i & ~$) + e[11] + 643717713 | 0) << 14 | a >>> 18) + r | 0) & i | r & ~i) + e[0] - 373897302 | 0) << 20 | $ >>> 12) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & r | a & ~r) + e[5] - 701558691 | 0) << 5 | i >>> 27) + $ | 0) & a | $ & ~a) + e[10] + 38016083 | 0) << 9 | r >>> 23) + i | 0) & $ | i & ~$) + e[15] - 660478335 | 0) << 14 | a >>> 18) + r | 0) & i | r & ~i) + e[4] - 405537848 | 0) << 20 | $ >>> 12) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & r | a & ~r) + e[9] + 568446438 | 0) << 5 | i >>> 27) + $ | 0) & a | $ & ~a) + e[14] - 1019803690 | 0) << 9 | r >>> 23) + i | 0) & $ | i & ~$) + e[3] - 187363961 | 0) << 14 | a >>> 18) + r | 0) & i | r & ~i) + e[8] + 1163531501 | 0) << 20 | $ >>> 12) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ & r | a & ~r) + e[13] - 1444681467 | 0) << 5 | i >>> 27) + $ | 0) & a | $ & ~a) + e[2] - 51403784 | 0) << 9 | r >>> 23) + i | 0) & $ | i & ~$) + e[7] + 1735328473 | 0) << 14 | a >>> 18) + r | 0) & i | r & ~i) + e[12] - 1926607734 | 0) << 20 | $ >>> 12) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ ^ a ^ r) + e[5] - 378558 | 0) << 4 | i >>> 28) + $ | 0) ^ $ ^ a) + e[8] - 2022574463 | 0) << 11 | r >>> 21) + i | 0) ^ i ^ $) + e[11] + 1839030562 | 0) << 16 | a >>> 16) + r | 0) ^ r ^ i) + e[14] - 35309556 | 0) << 23 | $ >>> 9) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ ^ a ^ r) + e[1] - 1530992060 | 0) << 4 | i >>> 28) + $ | 0) ^ $ ^ a) + e[4] + 1272893353 | 0) << 11 | r >>> 21) + i | 0) ^ i ^ $) + e[7] - 155497632 | 0) << 16 | a >>> 16) + r | 0) ^ r ^ i) + e[10] - 1094730640 | 0) << 23 | $ >>> 9) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ ^ a ^ r) + e[13] + 681279174 | 0) << 4 | i >>> 28) + $ | 0) ^ $ ^ a) + e[0] - 358537222 | 0) << 11 | r >>> 21) + i | 0) ^ i ^ $) + e[3] - 722521979 | 0) << 16 | a >>> 16) + r | 0) ^ r ^ i) + e[6] + 76029189 | 0) << 23 | $ >>> 9) + a | 0, $ = (($ += ((a = ((a += ((r = ((r += ((i = ((i += ($ ^ a ^ r) + e[9] - 640364487 | 0) << 4 | i >>> 28) + $ | 0) ^ $ ^ a) + e[12] - 421815835 | 0) << 11 | r >>> 21) + i | 0) ^ i ^ $) + e[15] + 530742520 | 0) << 16 | a >>> 16) + r | 0) ^ r ^ i) + e[2] - 995338651 | 0) << 23 | $ >>> 9) + a | 0, $ = (($ += ((r = ((r += ($ ^ ((i = ((i += (a ^ ($ | ~r)) + e[0] - 198630844 | 0) << 6 | i >>> 26) + $ | 0) | ~a)) + e[7] + 1126891415 | 0) << 10 | r >>> 22) + i | 0) ^ ((a = ((a += (i ^ (r | ~$)) + e[14] - 1416354905 | 0) << 15 | a >>> 17) + r | 0) | ~i)) + e[5] - 57434055 | 0) << 21 | $ >>> 11) + a | 0, $ = (($ += ((r = ((r += ($ ^ ((i = ((i += (a ^ ($ | ~r)) + e[12] + 1700485571 | 0) << 6 | i >>> 26) + $ | 0) | ~a)) + e[3] - 1894986606 | 0) << 10 | r >>> 22) + i | 0) ^ ((a = ((a += (i ^ (r | ~$)) + e[10] - 1051523 | 0) << 15 | a >>> 17) + r | 0) | ~i)) + e[1] - 2054922799 | 0) << 21 | $ >>> 11) + a | 0, $ = (($ += ((r = ((r += ($ ^ ((i = ((i += (a ^ ($ | ~r)) + e[8] + 1873313359 | 0) << 6 | i >>> 26) + $ | 0) | ~a)) + e[15] - 30611744 | 0) << 10 | r >>> 22) + i | 0) ^ ((a = ((a += (i ^ (r | ~$)) + e[6] - 1560198380 | 0) << 15 | a >>> 17) + r | 0) | ~i)) + e[13] + 1309151649 | 0) << 21 | $ >>> 11) + a | 0, $ = (($ += ((r = ((r += ($ ^ ((i = ((i += (a ^ ($ | ~r)) + e[4] - 145523070 | 0) << 6 | i >>> 26) + $ | 0) | ~a)) + e[11] - 1120210379 | 0) << 10 | r >>> 22) + i | 0) ^ ((a = ((a += (i ^ (r | ~$)) + e[2] + 718787259 | 0) << 15 | a >>> 17) + r | 0) | ~i)) + e[9] - 343485551 | 0) << 21 | $ >>> 11) + a | 0, t[0] = i + t[0] | 0, t[1] = $ + t[1] | 0, t[2] = a + t[2] | 0, t[3] = r + t[3] | 0
            }

            function $(t) {
                var e, i = [];
                for (e = 0; e < 64; e += 4) i[e >> 2] = t.charCodeAt(e) + (t.charCodeAt(e + 1) << 8) + (t.charCodeAt(e + 2) << 16) + (t.charCodeAt(e + 3) << 24);
                return i
            }

            function a(t) {
                var e, i = [];
                for (e = 0; e < 64; e += 4) i[e >> 2] = t[e] + (t[e + 1] << 8) + (t[e + 2] << 16) + (t[e + 3] << 24);
                return i
            }

            function r(t) {
                var e, a, r, n, _, s, h = t.length,
                    o = [1732584193, -271733879, -1732584194, 271733878];
                for (e = 64; e <= h; e += 64) i(o, $(t.substring(e - 64, e)));
                for (a = (t = t.substring(e - 64))
                    .length, r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], e = 0; e < a; e += 1) r[e >> 2] |= t.charCodeAt(e) << (e % 4 << 3);
                if (r[e >> 2] |= 128 << (e % 4 << 3), e > 55)
                    for (i(o, r), e = 0; e < 16; e += 1) r[e] = 0;
                return _ = parseInt((n = (n = 8 * h)
                    .toString(16)
                    .match(/(.*?)(.{0,8})$/))[2], 16), s = parseInt(n[1], 16) || 0, r[14] = _, r[15] = s, i(o, r), o
            }

            function n(t) {
                var i, $ = "";
                for (i = 0; i < 4; i += 1) $ += e[t >> 8 * i + 4 & 15] + e[t >> 8 * i & 15];
                return $
            }

            function _(t) {
                var e;
                for (e = 0; e < t.length; e += 1) t[e] = n(t[e]);
                return t.join("")
            }

            function s(t) {
                return /[\u0080-\uFFFF]/.test(t) && (t = unescape(encodeURIComponent(t))), t
            }

            function h(t) {
                var e, i = [],
                    $ = t.length;
                for (e = 0; e < $ - 1; e += 2) i.push(parseInt(t.substr(e, 2), 16));
                return String.fromCharCode.apply(String, i)
            }

            function o() {
                this.reset()
            }
            return _(r("hello")), "undefined" == typeof ArrayBuffer || ArrayBuffer.prototype.slice || function () {
                function t(t, e) {
                    return (t = 0 | t || 0) < 0 ? Math.max(t + e, 0) : Math.min(t, e)
                }
                ArrayBuffer.prototype.slice = function (e, i) {
                    var $, a, r, n, _ = this.byteLength,
                        s = t(e, _),
                        h = _;
                    return void 0 !== i && (h = t(i, _)), s > h ? new ArrayBuffer(0) : ($ = h - s, a = new ArrayBuffer($), r = new Uint8Array(a), n = new Uint8Array(this, s, $), r.set(n), a)
                }
            }(), o.prototype.append = function (t) {
                return this.appendBinary(s(t)), this
            }, o.prototype.appendBinary = function (t) {
                this._buff += t, this._length += t.length;
                var e, a = this._buff.length;
                for (e = 64; e <= a; e += 64) i(this._hash, $(this._buff.substring(e - 64, e)));
                return this._buff = this._buff.substring(e - 64), this
            }, o.prototype.end = function (t) {
                var e, i, $ = this._buff,
                    a = $.length,
                    r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (e = 0; e < a; e += 1) r[e >> 2] |= $.charCodeAt(e) << (e % 4 << 3);
                return this._finish(r, a), i = _(this._hash), t && (i = h(i)), this.reset(), i
            }, o.prototype.reset = function () {
                return this._buff = "", this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this
            }, o.prototype.getState = function () {
                return {
                    buff: this._buff,
                    length: this._length,
                    hash: this._hash.slice()
                }
            }, o.prototype.setState = function (t) {
                return this._buff = t.buff, this._length = t.length, this._hash = t.hash, this
            }, o.prototype.destroy = function () {
                delete this._hash, delete this._buff, delete this._length
            }, o.prototype._finish = function (t, e) {
                var $, a, r, n = e;
                if (t[n >> 2] |= 128 << (n % 4 << 3), n > 55)
                    for (i(this._hash, t), n = 0; n < 16; n += 1) t[n] = 0;
                a = parseInt(($ = ($ = 8 * this._length)
                    .toString(16)
                    .match(/(.*?)(.{0,8})$/))[2], 16), r = parseInt($[1], 16) || 0, t[14] = a, t[15] = r, i(this._hash, t)
            }, o.hash = function (t, e) {
                return o.hashBinary(s(t), e)
            }, o.hashBinary = function (t, e) {
                var i = _(r(t));
                return e ? h(i) : i
            }, o.ArrayBuffer = function () {
                this.reset()
            }, o.ArrayBuffer.prototype.append = function (t) {
                var e, $, r, n, _, s = ($ = this._buff.buffer, r = t, n = !0, (_ = new Uint8Array($.byteLength + r.byteLength))
                    .set(new Uint8Array($)), _.set(new Uint8Array(r), $.byteLength), n ? _ : _.buffer),
                    h = s.length;
                for (this._length += t.byteLength, e = 64; e <= h; e += 64) i(this._hash, a(s.subarray(e - 64, e)));
                return this._buff = new Uint8Array(e - 64 < h ? s.buffer.slice(e - 64) : 0), this
            }, o.ArrayBuffer.prototype.end = function (t) {
                var e, i, $ = this._buff,
                    a = $.length,
                    r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (e = 0; e < a; e += 1) r[e >> 2] |= $[e] << (e % 4 << 3);
                return this._finish(r, a), i = _(this._hash), t && (i = h(i)), this.reset(), i
            }, o.ArrayBuffer.prototype.reset = function () {
                return this._buff = new Uint8Array(0), this._length = 0, this._hash = [1732584193, -271733879, -1732584194, 271733878], this
            }, o.ArrayBuffer.prototype.getState = function () {
                var t, e = o.prototype.getState.call(this);
                return e.buff = (t = e.buff, String.fromCharCode.apply(null, new Uint8Array(t))), e
            }, o.ArrayBuffer.prototype.setState = function (t) {
                return t.buff = function (t, e) {
                    var i, $ = t.length,
                        a = new ArrayBuffer($),
                        r = new Uint8Array(a);
                    for (i = 0; i < $; i += 1) r[i] = t.charCodeAt(i);
                    return e ? r : a
                }(t.buff, !0), o.prototype.setState.call(this, t)
            }, o.ArrayBuffer.prototype.destroy = o.prototype.destroy, o.ArrayBuffer.prototype._finish = o.prototype._finish, o.ArrayBuffer.hash = function (t, e) {
                var $ = _(function (t) {
                    var e, $, r, n, _, s, h = t.length,
                        o = [1732584193, -271733879, -1732584194, 271733878];
                    for (e = 64; e <= h; e += 64) i(o, a(t.subarray(e - 64, e)));
                    for ($ = (t = e - 64 < h ? t.subarray(e - 64) : new Uint8Array(0))
                        .length, r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], e = 0; e < $; e += 1) r[e >> 2] |= t[e] << (e % 4 << 3);
                    if (r[e >> 2] |= 128 << (e % 4 << 3), e > 55)
                        for (i(o, r), e = 0; e < 16; e += 1) r[e] = 0;
                    return _ = parseInt((n = (n = 8 * h)
                        .toString(16)
                        .match(/(.*?)(.{0,8})$/))[2], 16), s = parseInt(n[1], 16) || 0, r[14] = _, r[15] = s, i(o, r), o
                }(new Uint8Array(t)));
                return e ? h($) : $
            }, o
        }(),
        a = ((t, e) => {
            try {
                let {
                    salt: i
                } = t.reduce((t, e) => ({
                    salt: $.hash(t.salt + e.salt)
                }), {
                    salt: e
                });
                return `1.${i}`
            } catch (a) {
                return console.error("[calculateCaptchaSign:]", a), a
            }
        })(e.algorithms, "" + e.clientId + e.clientVersion + e.packageName + i + e.timestamp);
    return ["YUMx5nI8ZU8Ap8pm", i, "ck0.IV9lup1uPyJTnnasuUnDV-1KpUpXN2vzYVodgXMkZ4lVw-SJWVLE1slzppHJR_-hlN85lZvBFfUlIpqeWi2L_SJ07pzSyiNN_4xFjAEJCpab8QudjJCdWLiKxK44gVpz83qd5dHcHOYIyi_3PWuO9MfJORr0tRpawk2NfMiDOgfyAaciHYCHglYI24_mOymW6dGPwfkdkKmdV7CWqFXkA8U5uoyG1v6uN3cpHzHaSKI", t, a]
}

new Pikpak(pikpak_id)
    .getEmailCode()
    .catch(t => {
        $env.logErr(t)
    })
    .finally(() => $env.done());

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
