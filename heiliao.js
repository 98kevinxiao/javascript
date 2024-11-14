/**
 * @author ONZ3V
 * @name 黑料不打烊
 * @team 随便玩玩
 * @version 1.0.0
 * @description 使用前请先执行npm i axios cheerio moment, 调整分类和需要通知请前往web端进行相关配置
 * @create_at 2024-09-20 09:00:00
 * @rule ^(黑料|黑料不打烊|heiliao|hl)
 * @cron 22 20 * * *
 * @priority 100000000
 * @admin true
 * @public true
 * @disable false
 * @classification []
 */
// ----------------------------------------
const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment')
const { operator, PLATFORM_LIST, combineURLs } = require('./utils')
const NAV_URL = `https://155.fun` // 永久链接
const instance = axios.create({
    headers: {
        'user-agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
    },
    timeout: 1e4
})
/**
 * 黑料不打烊
 */
class Heiliao {
    static MENU = {
        最新黑料: 0,
        今日黑料: 6,
        今日热搜: 7,
        热门大瓜: 8,
        // 黑料历史: 10,
        // 每日TOP10: 11,
        网红乱象: 1,
        // 反差女友: 4,
        原创社区: 13,
        // 校园春宫: 2,
        独家爆料: 9
        // 官员干部:17,
        // 性爱课堂: 12,
        // 中外奇闻: 3,
        // 禁播影视: 14,
        // 社会新闻: 15,
        // 明星丑闻: 16
    }
    constructor(key) {
        this.key = Heiliao.MENU[key] || 0
    }
    /**
     * 获取最新地址
     */
    async getBaseUrl() {
        const { data } = await instance.get(NAV_URL)
        const $ = cheerio.load(data)
        this.baseURL = $('.box-wrap a')
            .toArray()
            .map((el) => {
                return {
                    link: $(el).attr('href'),
                    title: $(el).find('p').first().text()
                }
            })
            .find((item) => item.title.includes('线路'))?.link
        instance.defaults.baseURL = this.baseURL
        console.log(`设置最新链接成功: ${instance.defaults.baseURL}`)
    }
    /**
     * 根据筛选获取对应地址
     */
    getUrl = () => (this.key === 0 ? '' : `category/${this.key}.html`)
    /**
     * 获取对应列表
     */
    async getList() {
        const { data } = await instance.get(this.getUrl())
        const $ = cheerio.load(data)
        this.list = $('.cursor-pointer')
            .toArray()
            .map((el) => {
                const $el = $(el)
                const title = $el.find('.title').text().trim()
                const fakeThumb = $el
                    .find('img')
                    .attr('onload')
                    ?.match(/'(.*?)'/)?.[1]
                const status = $el.find('.ishot').text().trim()
                const link = $el.attr('href')
                return { title, link, status, fakeThumb }
            })
            .filter((it) => it.link && it.title && it.fakeThumb)
        // console.log(`获取${Heiliao.MENU[this.key] || `最新黑料`}列表成功: ${JSON.stringify(this.list, null, 2)}`)
    }
    /**
     * 获取详情
     */
    async getDetail(link) {
        const { data } = await instance.get(link)
        const $ = cheerio.load(data)
        const title = $('.detail-title').text().trim()
        const date = $('.detail-page .detail-date .detail-txt')
            .text()
            ?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
            ?.slice(1)
            ?.join('-')
        console.log(`获取[${title}]详情成功: ${JSON.stringify({ title, date }, null, 2)}`)
        return date
    }
}
// 字段表
const fields = {
    category: BncrCreateSchema.string()
        .setTitle('分类')
        .setDescription(`请选择对应分类, 默认最新黑料`)
        .setEnum(Object.keys(Heiliao.MENU))
        .setDefault(`最新黑料`),
    diff: BncrCreateSchema.number().setTitle('间隔时间').setDescription(`请填写间隔时间, 默认为3天`).setDefault(3),
    platform: BncrCreateSchema.string()
        .setTitle('通知平台')
        .setDescription(`设置后会推送到对应平台,群组ID和人员ID必须填一个，否则不推送`)
        .setEnum(PLATFORM_LIST),
    groupId: BncrCreateSchema.string().setTitle('通知群组ID').setDescription(`设置后会推送到对应群组`),
    userId: BncrCreateSchema.string().setTitle('通知个人ID').setDescription(`设置后上会推送到对应人员`)
}
const jsonSchema = BncrCreateSchema.object(fields)
const ConfigDB = new BncrPluginConfig(jsonSchema)
/**
 * 根据间隔日期过滤数据
 */
const filterByDiff = (list, diff) => {
    const now = sysMethod.getTime()
    const result = list
        ?.map((it) => {
            const date = moment(it.date).valueOf()
            const diff = moment(now).diff(moment(date), 'days')
            return { ...it, diff }
        })
        ?.filter((item) => item.diff <= diff)
        ?.sort((a, b) => a.diff - b.diff)
    return result
}
module.exports = async (s) => {
    // TODO: 自动安装依赖
    // await sysMethod.testModule(['axios', 'cheerio', 'moment'], { install: true });
    await ConfigDB.get()
    console.log('ConfigDB.userConfig', ConfigDB.userConfig)
    const from = s.getFrom()
    if (!Object.keys(ConfigDB.userConfig).length) return await s.reply('请先发送"修改无界配置",或者前往前端web"插件配置"来完成插件首次配置')
    const { category, diff, platform, groupId, userId } = ConfigDB.userConfig
    const isTG = /tg/i.test(from) || /tg/i.test(platform)
    const isCron = /^cron$/i.test(from)
    if (isCron) {
        if (!platform) return console.log(`未填写通知平台信息, 不使用cron进行通知`)
        if (!groupId && !userId) return console.log(`未填写群组信息和个人信息, 不使用cron进行通知`)
    }
    const hl = new Heiliao(category)
    try {
        await hl.getBaseUrl() // 获取最新地址
        await hl.getList() // 获取分类列表页
        // ------ 耗时 start ------
        const startTime = moment().valueOf()
        let lastSecond = 0
        const intervalId = setInterval(() => {
            lastSecond++
            console.log(`已运行${lastSecond}秒`)
        }, 1e3)
        const tasks = hl.list.map(async (item) => {
            const date = await hl.getDetail(item.link)
            Object.assign(item, { date })
        })
        await Promise.all(tasks).then(() => {
            clearInterval(intervalId)
            const endTime = moment().valueOf()
            const totalTime = (endTime - startTime) / 1000
            console.log(`列表[${hl.list.length}]条信息添加日期成功，总耗时：${totalTime}秒`)
        })
        // ------ 耗时 end ------
        hl.list = filterByDiff(
            hl.list.filter((item) => item.date) /* 过滤一遍广告 */,
            diff
        )
        console.log(`列表[${hl.list.length}]条信息过滤成功，剩余${hl.list.length}条`)
        const msg = []
        if (isTG) {
            msg.push(`**黑料不打烊** (*${category}*)`)
        } else {
            msg.push(`黑料不打烊 [${category}]`)
        }
        if (!hl.list.length) return await s.reply(`${category}暂时没有数据哦~请切换分类或者调整间隔时间后重试!`)
        hl.list.forEach((it, i) => {
            const { title, date, status } = it
            const index = (i + 1).toString()
            const link = `${combineURLs(hl.baseURL, it.link)}`
            let content = status ? `💥 ` : `💖 `
            content += `[${operator(index)}] `
            content += isTG ? `[${title}](${link})` : `${title}\n${link}`
            msg.push(content)
        })
        if (isCron) {
            sysMethod.push({
                platform: platform,
                groupId: groupId,
                userId: userId,
                msg: msg.join('\n')
            })
        } else {
            await s.reply({ type: isTG ? 'markdown' : 'text', msg: msg.join('\n') })
        }
    } catch (e) {
        const errMsg = `获取${category}失败：${e.message}`
        console.log(errMsg)
        await s.reply(errMsg)
    }
}
