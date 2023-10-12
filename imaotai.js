/*

#本地
^https?://app.moutai519.com.cn/xhr/front/user/info url script-response-body http://192.168.10.5:5500/demo/Scripts/Task/iMaotai/imaotai.js

hostname = app.moutai519.com.cn

*/

const $ = new Env('i茅台'),
    service = $.http
const isRequest = typeof $request !== 'undefined'
var CryptoJS
const maotai = new Maotai()
// -----------------------------------------------------------------------------------------
// 配置项
var province = $.getdata('imaotai__config__province') || '' // 省份
var city = $.getdata('imaotai__config__city') || '' // 城市
var itemList = $.getdata('imaotai__config__itemcode')?.split(',') || ['10213', '10214'] // 预约项
var itemMap = {
    10213: '贵州茅台酒（癸卯兔年）',
    10056: '53%vol 500ml 茅台1935',
    2478: '贵州茅台酒（珍品）',
    10214: '贵州茅台酒（癸卯兔年）x2'
}
var address = $.getdata('imaotai__config__address') || '' // 详细地址
var location = $.getdata('imaotai__config__location') || '' // 地址经纬度
var shopid = $.getdata('imaotai__config__shopid') || '' // 商铺id
var imaotaiParams = JSON.parse($.getdata('imaotai_params') || '{}') // 抓包参数
var Message = '' // 消息内容
// -----------------------------------------------------------------------------------------
!(async () => {
    // 抓包
    if (isRequest) {
        if ($request.method === 'OPTIONS') return false
        var userId = JSON.parse($response.body).data.userId
        $.setdata(
            JSON.stringify({
                headers: $request.headers,
                userId
            }),
            'imaotai_params'
        )
        $.msg($.name, '', `抓取数据成功🎉\nuserId:${userId}`)
        return
    }
    if (!imaotaiParams?.userId) throw '请先开启代理工具进行抓包相关操作!'
    if (!province) throw '请在BoxJs中配置省份'
    if (!city) throw '请在BoxJs中配置城市'
    if (!location) {
        if (!address) throw `请在BoxJs中配置当前位置`
        await queryAddress() // 查询经纬度
    }
    // TODO:测试使用初始化CryptoJS
    if ($.isNode()) {
        CryptoJS = require('crypto-js')
    } else {
        eval(
            `${
                (
                    await service.get(
                        `https://gist.githubusercontent.com/Yuheng0101/04627dd91acf96ba50a363ff921aa3d0/raw/5c26880d7fbcad4a78f909e6c45ee237a3446a86/cryptojs`
                    )
                ).body
            }`
        )
        CryptoJS = loadCryptoJS()
    }
    await maotai.initParams() // 初始化参数
    await maotai.getLatestVersion() // 获取最新版本号
    await maotai.getSessionId() // 获取今日sessionId
    await maotai.getStoreMap() // 获取商铺地图信息
    // var isApply = await maotai.isTodayApply() // 今日是否申购过
    // if (isApply) {
    //     await maotai._award() // 旅行
    // } else {
    //     await maotai._run() // 预约
    // }
    await maotai._run() // 预约
    await showMsg(Message)
})()
    .catch((e) => $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, ''))
    .finally(() => $.done())
/**
 * 根据详细地址查询经纬度
 */
function queryAddress() {
    return new Promise(async (resolve, reject) => {
        var amapApi = '0a7f4baae0a5e37e6f90e4dc88e3a10d'
        var url = `https://restapi.amap.com/v3/geocode/geo?key=${amapApi}&output=json&address=${encodeURIComponent(
            address
        )}`
        try {
            var { body: resp } = await service.get(url)
            var { status, info, geocodes } = JSON.parse(resp)
            if (status !== '1') throw `获取经纬度失败, ${info}`
            var { location: _location } = geocodes[0]
            $.setdata(_location, 'imaotai__config__location')
            location = _location
            $.log(`获取到经纬度：${location}`)
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}
/**
 * 显示通知
 * @param {*} msg 消息内容
 */
async function showMsg(msg) {
    $.msg($.name, '', msg)
}
/**
 * 兼容HTTP2抓包key值小写的问题
 * @param {*} obj headers对象
 * @returns
 */
function compatibleWithHTTP2(obj) {
    var result = {}
    for (var key in obj) {
        result[`${key.toLowerCase()}`] = obj[key]
    }
    return { ...obj, ...result }
}
/**
 * 工具类
 */
function Maotai() {
    return new (class {
        constructor() {
            this.headers = {
                'MT-Info': `028e7f96f6369cafe1d105579c5b9377`,
                'Accept-Encoding': `gzip, deflate, br`,
                Host: `app.moutai519.com.cn`,
                'MT-User-Tag': `0`,
                'MT-Token': ``, // 抓
                Connection: `keep-alive`,
                'MT-Device-ID': ``, // 抓
                'Accept-Language': `zh-Hans-CN;q=1`,
                'MT-Team-ID': ``,
                'Content-Type': `application/json`,
                'MT-Request-ID': `${Date.now()}${Math.floor(Math.random() * 90000 + 10000)}`,
                'MT-APP-Version': `1.4.9`,
                'User-Agent': `iOS;14.3;Apple;iPhone 12`, // 抓
                'MT-K': Date.now(),
                'MT-R': `clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdg==`,
                'MT-Bundle-ID': `com.moutai.mall`,
                'MT-Network-Type': `WIFI`,
                Accept: `*/*`,
                'BS-DVID': ``,
                'MT-Lat': ``, // 填
                'MT-Lng': `` // 填
            }
            this.version = ''
            this.sessionId = ''
            this.dictionary = []
            this.shopId = ''
            this.userId = '' // 抓
        }
        // 初始化参数
        async initParams() {
            var { headers, userId } = imaotaiParams
            this.headers = compatibleWithHTTP2(Object.assign(this.headers, headers))
            this.userId = userId
            if (shopid) maotai.shopId = shopid // 固定店铺的情况
            // $.log(`茅台参数：${JSON.stringify(maotai, null, 4)}`)
        }
        // 获取最新版本号 -- success
        async getLatestVersion() {
            try {
                this.version = JSON.parse((await service.get(`https://itunes.apple.com/cn/lookup?id=1600482450`)).body)[
                    'results'
                ][0]['version']
                $.log(`✅获取到最新版本号：${this.version}`)
            } catch (e) {
                throw e
            }
        }
        // 获取sessionId -- success
        async getSessionId() {
            try {
                var _ts = new Date().setHours(0, 0, 0, 0)
                var { body: response } = await service.get(
                    `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/index/session/get/${_ts}`
                )
                var { code, data, message } = JSON.parse(response)
                if (code !== 2000) throw `获取sessionId失败, ${message}`
                var { sessionId } = data
                this.sessionId = sessionId
                $.log(`✅获取到sessionId：${this.sessionId}`)
            } catch (e) {
                throw e
            }
        }
        // 判断今日是否申购 -- success
        async isTodayApply() {
            try {
                var options = {
                    url: `https://app.moutai519.com.cn/xhr/front/mall/reservation/list/pageOne/queryV2`,
                    headers: this.headers
                }
                var { body: resp } = await service.get(options)
                var { code, data, message } = JSON.parse(resp)
                if (code === 401) throw `token失效, 请重新抓包获取`
                if (code === 2000) {
                    if (data?.reservationItemVOS?.length > 0) {
                        var todayReserveList = data.reservationItemVOS.filter((item) => {
                            var { reservationTime } = item
                            return new Date(reservationTime).toDateString() === new Date().toDateString()
                        })
                        if (todayReserveList.length > 0) {
                            var name = todayReserveList.map((item) => item.itemName).join(' | ')
                            $.log(`✅今日已申购 [${name}] `)
                            return true
                        }
                    }
                } else {
                    $.log(`❌查询预约信息失败 ${message ? message : ''}!`)
                }
            } catch (e) {
                $.log(`❌查询预约信息失败: ${e}!`)
            }
        }
        // 获取商铺地图信息 -- success
        async getStoreMap() {
            try {
                var { body: response } = await service.get(
                    'https://static.moutai519.com.cn/mt-backend/xhr/front/mall/resource/get'
                )
                var { code, data, message } = JSON.parse(response)
                if (code === 2000) {
                    var {
                        mtshops_pc: { url: mapUrl }
                    } = data
                    var _json = (await service.get(mapUrl)).body
                    var arr = []
                    Object.values(JSON.parse(_json)).map((item) => {
                        if (item.provinceName === province && item.cityName === city) arr.push(item)
                    })
                    this.dictionary = arr
                    $.log(`✅获取到商铺地图数据成功!`)
                } else {
                    $.log(`❌获取商铺地图信息失败 ${message ? message : ''}!`)
                }
            } catch (err) {
                $.log(`❌获取商铺地图信息失败: ${err}!`)
            }
        }
        // 获取最近店铺 -- success
        async getNearbyStore(itemCode) {
            try {
                var _ts = new Date().setHours(0, 0, 0, 0)
                var url = `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/shop/list/slim/v3/${
                    this.sessionId
                }/${encodeURIComponent(province)}/${itemCode}/${_ts}`
                var { body: response } = await service.get({ url })
                var { code, data, message } = JSON.parse(response)
                if (code === 2000) {
                    var { shops } = data
                    // 查找最近店铺
                    const findBest = (shops) => {
                        var { dictionary } = this
                        var _lnt = location.split(',')[0]
                        var _lat = location.split(',')[1]
                        // 计算距离
                        const getDistance = (lnt1, lat1, lnt2, lat2) => {
                            var radLat1 = (lat1 * Math.PI) / 180.0
                            var radLat2 = (lat2 * Math.PI) / 180.0
                            var a = radLat1 - radLat2
                            var b = (lnt1 * Math.PI) / 180.0 - (lnt2 * Math.PI) / 180.0
                            var s =
                                2 *
                                Math.asin(
                                    Math.sqrt(
                                        Math.pow(Math.sin(a / 2), 2) +
                                            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
                                    )
                                )
                            s = s * 6378.137
                            s = Math.round(s * 10000) / 10000
                            return s
                        }
                        // 获取离填写经纬度距离
                        var nearestShop = dictionary.map((item) => ({
                            ...item,
                            distance: getDistance(_lnt, _lat, item.lng, item.lat)
                        }))
                        // 过滤出包含预约项的店铺列表
                        var _shops = shops.reduce((acc, item) => {
                            var _item = item.items.find((i) => i.itemId === itemCode)
                            if (_item) {
                                acc.push({
                                    shopId: item.shopId,
                                    items: _item
                                })
                            }
                            return acc
                        }, [])
                        // 寻找最佳最近且包含预约项的店铺
                        var bestReserveShop = nearestShop
                            .filter((item) => _shops.find((_item) => _item.shopId === item.shopId))
                            .sort((a, b) => a.distance - b.distance)[0]
                        // $.log(`获取到最近店铺：${JSON.stringify(bestReserveShop)}`)
                        if (!bestReserveShop) {
                            Message += `\n${itemMap[itemCode]}: ❌获取最近店铺失败: 没有找到包含预约项的店铺!`
                            return ''
                        } else {
                            $.log(`✅查询到最近店铺: ${bestReserveShop.address}!`)
                            return bestReserveShop.shopId
                        }
                    }
                    this.shopId = findBest(shops)
                    $.log(`✅${itemMap[itemCode]}获取到最近店铺成功: ${this.shopId}!`)
                } else {
                    $.log(`❌${itemMap[itemCode]}获取最近店铺失败 ${message ? message : ''}!`)
                }
            } catch (e) {
                $.log(`\n${itemMap[itemCode]}: ❌获取最近店铺失败: ${e}!`)
            }
        }
        // 预约 -- success
        async doReserve(itemCode) {
            try {
                var params = {
                    itemInfoList: [{ count: 1, itemId: itemCode }],
                    sessionId: parseInt(this.sessionId),
                    userId: this.userId,
                    shopId: this.shopId
                }
                var helper = new DecryptHelper()
                var actParam = helper.Encrypt(JSON.stringify(params))
                var options = {
                    url: `https://app.moutai519.com.cn/xhr/front/mall/reservation/add`,
                    headers: this.headers,
                    body: JSON.stringify({
                        actParam: actParam,
                        ...params
                    })
                }
                var { body: resp } = await service.post(options)
                var { code, data, message } = JSON.parse(resp)
                if (code === 401) throw `token失效, 请重新抓包获取`
                if (code !== 2000) {
                    Message += `\n${itemMap[itemCode]}\n❌${message}`
                } else {
                    Message += `${itemMap[itemCode]}\n✅${data.successDesc}`
                }
            } catch (e) {
                var errMsg = `\n${itemMap[itemCode]}\n❌预约失败: ${e}!`
                Message += errMsg
                $.log(errMsg)
            }
        }
        // 查询小茅运信息 -- success
        async queryXmy() {
            try {
                var options = {
                    url: `https://h5.moutai519.com.cn/game/isolationPage/getUserIsolationPageData?__timestamp=${Date.now()}`,
                    headers: this.headers
                }
                var { body: resp } = await service.get(options)
                var { code, data, message } = JSON.parse(resp)
                if (code === 401) throw `token失效, 请重新抓包获取`
                if (code === 2000) {
                    /**
                     * energy: 耐力值
                     * xmy: 小茅运
                     * xmTravel: 旅行状态
                     * energyReward: 耐力值奖励
                     */
                    var { energy, xmy, xmTravel, energyReward } = data
                    $.log(`✅当前耐力值: ${energy}, ✅当前小茅运: ${xmy}`)
                    /**
                     * status: 1. 未开始 2. 进行中 3. 已完成
                     * remainChance: 旅行剩余次数
                     * travelEndTime: 旅行结束时间
                     */
                    var { status, remainChance, travelEndTime } = xmTravel
                    var { value } = energyReward
                    if (value) {
                        await this.getUserEnergyAward() // 领取耐力
                        energy += value
                    }
                    let currentPeriodCanConvertXmyNum = await this.exchangeRateInfo() // 获取本月剩余耐力值
                    if (currentPeriodCanConvertXmyNum <= 0) throw `当月无可领取奖励` // 无需再旅行
                    if (status == 1) {
                        if (energy < 100) {
                            throw `耐力值(${energy})不足100, 无法开始旅行`
                        }
                    }
                    if (status == 2) throw `旅行进行中, 结束时间:${$.time('yyyy-MM-dd HH:mm:ss', travelEndTime * 1e3)}`
                    return { remainChance, isFinished: status === 3, currentPeriodCanConvertXmyNum }
                } else {
                    throw `❌查询小茅运信息失败 ${message ? message : ''}!`
                }
            } catch (e) {
                throw e
            }
        }
        // 获取本月剩余耐力值 -- success
        async exchangeRateInfo() {
            return new Promise(async (resolve) => {
                try {
                    var options = {
                        url: `https://h5.moutai519.com.cn/game/synthesize/exchangeRateInfo?__timestamp=${Date.now()}`,
                        headers: this.headers
                    }
                    var { body: resp } = await service.get(options)
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 2000) {
                        var { currentPeriodCanConvertXmyNum } = data
                        $.log(`✅本月剩余旅行奖励: ${currentPeriodCanConvertXmyNum}`)
                        resolve(currentPeriodCanConvertXmyNum)
                    } else {
                        reject(`❌获取本月剩余耐力值失败 ${message ? message : ''}!`)
                    }
                } catch (e) {
                    reject(`❌获取本月剩余耐力值失败: ${e}!`)
                }
            })
        }
        // 领取耐力值 -- success
        async getUserEnergyAward() {
            return new Promise(async (resolve) => {
                try {
                    var options = {
                        url: `https://h5.moutai519.com.cn/game/isolationPage/getUserEnergyAward`,
                        headers: this.headers,
                        body: JSON.stringify({})
                    }
                    var { body: resp } = await service.post(options)
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 200) {
                        $.log(`✅领取耐力成功`)
                        Message += `\n✅领取耐力成功`
                    } else {
                        $.log(`❌领取耐力失败 ${message ? message : ''}!`)
                    }
                } catch (e) {
                    $.log(`❌领取耐力失败: ${e}!`)
                } finally {
                    resolve()
                }
            })
        }
        // 开始旅行 -- success
        async startTravel() {
            return new Promise(async (resolve, reject) => {
                try {
                    var options = {
                        url: `https://h5.moutai519.com.cn/game/xmTravel/startTravel`,
                        headers: this.headers
                    }
                    var { body: resp } = await service.post(options)
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 2000) {
                        $.log(`✅旅行成功!`)
                        Message += `\n✅旅行成功!`
                    } else {
                        reject(`❌旅行失败 ${message ? message : ''}!`)
                    }
                } catch (e) {
                    reject(`❌旅行失败: ${e}!`)
                }
            })
        }
        // 查询旅行奖励 -- success
        async getXmTravelReward() {
            return new Promise(async (resolve, reject) => {
                try {
                    var url = `https://h5.moutai519.com.cn/game/xmTravel/getXmTravelReward?__timestamp=${Date.now()}`
                    var { body: resp } = await service.get({
                        url,
                        headers: this.headers
                    })
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 2000 && data?.travelRewardXmy) {
                        var claimableXmy = data.travelRewardXmy
                        $.log(`✅当前可领取${claimableXmy}小茅运!`)
                        resolve(claimableXmy)
                    } else {
                        reject(`❌旅行暂未开始 ${message ? message : ''}`)
                    }
                } catch (e) {
                    reject(`❌查询旅行奖励失败: ${e}!`)
                }
            })
        }
        // 领取旅行奖励 -- success
        async receiveReward(claimableXmy) {
            return new Promise(async (resolve) => {
                try {
                    var options = {
                        url: `https://h5.moutai519.com.cn/game/xmTravel/receiveReward`,
                        headers: this.headers
                    }
                    var { body: resp } = await service.post(options)
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 2000) {
                        $.log(`✅成功领取到${claimableXmy}小茅运!`)
                        Message += `\n✅成功领取到${claimableXmy}小茅运!`
                    } else {
                        $.log(`❌领取旅行奖励失败 ${message ? message : ''}!`)
                    }
                } catch (e) {
                    $.log(`❌领取旅行奖励失败: ${e}!`)
                } finally {
                    resolve()
                }
            })
        }
        // 每日分享 -- success
        async shareReward() {
            return new Promise(async (resolve) => {
                try {
                    var options = {
                        url: `https://h5.moutai519.com.cn/game/xmTravel/shareReward`,
                        headers: this.headers
                    }
                    var { body: resp } = await service.post(options)
                    var { code, data, message } = JSON.parse(resp)
                    if (code === 2000) {
                        $.log(`✅分享成功!`)
                        Message += `\n✅分享成功!`
                    } else {
                        $.log(`❌分享失败 ${message ? message : ''}!`)
                    }
                } catch (e) {
                    $.log(`❌分享失败: ${e}!`)
                } finally {
                    resolve()
                }
            })
        }
        // 循环预约
        async _run() {
            for (var key of Object.keys(itemMap)) {
                if (!itemList.includes(key)) {
                    $.log(`\n⚠️ 跳过${itemMap[key]}预约`)
                    continue
                }
                console.log(`\n🔔 ${itemMap[key]}预约开始!`)
                if (!shopid) await this.getNearbyStore(key) // 获取最近店铺
                if (!this.shopId) {
                    Message += `\n============================\n`
                    continue
                }
                await this.doReserve(key) // 预约
                Message += `\n============================\n`
            }
        }
        // 小茅运旅行
        async _award() {
            // 填充Cookie
            var cookies = {
                'MT-Device-ID-Wap': this.headers['MT-Device-ID'],
                'MT-Token-Wap': this.headers['MT-Token'],
                YX_SUPPORT_WEBP: '1'
            }
            this.headers = compatibleWithHTTP2({
                ...this.headers,
                Cookie: Object.entries(cookies)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ')
            })
            var { remainChance, isFinished, currentPeriodCanConvertXmyNum } = await this.queryXmy()
            if (isFinished) {
                let claimableXmy = await this.getXmTravelReward() // 查询旅行奖励
                await this.receiveReward(claimableXmy) // 领取旅行奖励
                await this.shareReward() // 每日分享
                if (currentPeriodCanConvertXmyNum <= claimableXmy) throw `当月无可领取奖励` // 无需再旅行
            }
            if (!remainChance) throw `今日已无旅行次数`
            $.log(`✅今日剩余旅行次数: ${remainChance}`)
            await this.startTravel() // 开始旅行
        }
    })()
}
/**
 * 加密类
 */
function DecryptHelper() {
    return new (class {
        constructor(key, iv) {
            this.key = CryptoJS.enc.Utf8.parse(key || 'qbhajinldepmucsonaaaccgypwuvcjaa')
            this.iv = CryptoJS.enc.Utf8.parse(iv || '2018534749963515')
        }
        pkcs7padding(text) {
            const bs = 16
            const length = text.length
            const padding_size = bs - (length % bs)
            const padding = String.fromCharCode(padding_size).repeat(padding_size)
            return text + padding
        }
        Encrypt(content) {
            const contentPadding = this.pkcs7padding(content)
            const encryptBytes = CryptoJS.AES.encrypt(contentPadding, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.NoPadding
            })
            return encryptBytes.toString()
        }
        Decrypt(content) {
            const decryptBytes = CryptoJS.AES.decrypt(content, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.NoPadding
            })
            const result = decryptBytes.toString(CryptoJS.enc.Utf8)
            return result.replace(/[\x00-\x1f]*$/g, '')
        }
    })()
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
