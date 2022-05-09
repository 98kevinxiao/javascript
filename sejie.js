
var body = $response.body;
var urlq = $request.url;
var objc = JSON.parse(body);

const user = '/user/info';
const info = '/fansAndUp';

if (urlq.indexOf(user) != -1) {
    objc.data = [
      {
        "readLevel": 0,
        "haveExtendInfo": 0,
        "firstRechargeTime": null,
        "subchannelCode": "yyzx000",
        "gameLink": "",
        "todayDownNum": 99,
        "extrViewNumber": 99,
        "rechargeVipState": 1,
        "appCode": "002503",
        "dailyViewNum": 99,
        "myInviteCode": "666666",
        "inviteCnt": 99,
        "nextLevelNeed": 0,
        "isFree": 0,
        "leftViewNum": 99,
        "vipExpiredDate": "2999-09-28",
        "isShowBindInviteCode": 0,
        "potato_url": "https:\/\/t.me\/yqc_123",
        "state": 1,
        "certSignStatus": 0,
        "vipEndDate": "2999-09-28",
        "hasCompleteInfo": 0,
        "aliasName": "\u6D65\u8F7B\u5C18",
        "ExpiredDays": 9999,
        "foreverVipTitle": "\u6C38\u4E45\u0053\u0056\u0049\u0050",
        "level": 9,
        "totalBalance": 99,
        "appVer": "0",
        "limitDownNum": 99,
        "birth": "",
        "isOfficial": 0,
        "isPaid": 1,
        "isMaxLevel": 1,
        "oldDriver": 1,
        "phone": "666666",
        "name": null,
        "dailyViewShortNum": 99,
        "userType": 2,
        "job": "",
        "isZhenren": 0,
        "nextLevelNum": 0,
        "preferenceCustom": "",
        "gender": 1,
        "hasJoinPotatoGroup": 0,
        "supUserId": 2109061203550001,
        "companion": null,
        "maxInviteCnt": null,
        "userBrowCnt": 0,
        "tagIds": "",
        "icon": "/icon/9.png",
        "title": "\u6559\u6388",
        "pkg": "sj0002",
        "userCode": null,
        "tagNames": "",
        "countryCode": "+1",
        "isZhubo": 1,
        "hasDownloadApplication": 0,
        "leftViewShortNum": 99,
        "channelCode": "03",
        "gameId": "",
        "oriAppVer": "100",
        "userCls": 2,
        "exceedPercent": 0,
        "gmtCreate": "2021-10-05",
        "downloadApplication": 0,
        "userId": 2110050724360001,
        "token": "39992ffa267f811a826f7745d728094d97ba7d2da8d39ada706912c2affc410a",
        "vipLogo": 1,
        "isMcn": 0,
        "joinPotatogroup": 0,
        "appid": "",
        "isUper": 1,
        "isUpload": 1,
        "vcoinLeft": 0,
        "isWanghong": 1,
        "isExpired": 1,
        "hasSign": false
      }
    ];
    body = JSON.stringify(objc);
}

if (urlq.indexOf(info) != -1) {
    objc.data = [
      {
        "likeCnt" : 999999,
        "uploadCnt" : 999999,
        "upedCnt" : 999999,
        "fansCnt" : 999999,
        "attentionCnt" : 999999
      }
    ];
    body = JSON.stringify(objc);
}

$done({ 
    body 
});
