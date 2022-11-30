#!/bin/bash
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export LANG=en_US.UTF-8
wpygV="22.9.27 V 0.3.1"
remoteV=`wget -qO- https://gitlab.com/rwkgyg/CFwarp/raw/main/CFwarp.sh | sed -n 4p | cut -d '"' -f 2`
chmod +x /root/CFwarp.sh
red='\033[0;31m'
bblue='\033[0;34m'
yellow='\033[0;33m'
green='\033[0;32m'
plain='\033[0m'
red(){ echo -e "\033[31m\033[01m$1\033[0m";}
green(){ echo -e "\033[32m\033[01m$1\033[0m";}
yellow(){ echo -e "\033[33m\033[01m$1\033[0m";}
blue(){ echo -e "\033[36m\033[01m$1\033[0m";}
white(){ echo -e "\033[37m\033[01m$1\033[0m";}
bblue(){ echo -e "\033[34m\033[01m$1\033[0m";}
rred(){ echo -e "\033[35m\033[01m$1\033[0m";}
readtp(){ read -t5 -n26 -p "$(yellow "$1")" $2;}
readp(){ read -p "$(yellow "$1")" $2;}
[[ $EUID -ne 0 ]] && yellow "请以root模式运行脚本" && exit

start(){
yellow " 请稍等3秒……正在扫描vps类型及参数中……"
if [[ -f /etc/redhat-release ]]; then
release="Centos"
elif cat /etc/issue | grep -q -E -i "debian"; then
release="Debian"
elif cat /etc/issue | grep -q -E -i "ubuntu"; then
release="Ubuntu"
elif cat /etc/issue | grep -q -E -i "centos|red hat|redhat"; then
release="Centos"
elif cat /proc/version | grep -q -E -i "debian"; then
release="Debian"
elif cat /proc/version | grep -q -E -i "ubuntu"; then
release="Ubuntu"
elif cat /proc/version | grep -q -E -i "centos|red hat|redhat"; then
release="Centos"
else 
red "不支持你当前系统，请选择使用Ubuntu,Debian,Centos系统。" && rm -f CFwarp.sh && exit
fi
vsid=`grep -i version_id /etc/os-release | cut -d \" -f2 | cut -d . -f1`
sys(){
[ -f /etc/os-release ] && grep -i pretty_name /etc/os-release | cut -d \" -f2 && return
[ -f /etc/lsb-release ] && grep -i description /etc/lsb-release | cut -d \" -f2 && return
[ -f /etc/redhat-release ] && awk '{print $0}' /etc/redhat-release && return;}
op=`sys`
version=`uname -r | awk -F "-" '{print $1}'`
main=`uname  -r | awk -F . '{print $1}'`
minor=`uname -r | awk -F . '{print $2}'`
bit=`uname -m`
[[ $bit = x86_64 ]] && cpu=amd64
[[ $bit = aarch64 ]] && cpu=arm64
vi=`systemd-detect-virt`
if [[ $vi = openvz ]]; then
TUN=$(cat /dev/net/tun 2>&1)
if [[ ! $TUN =~ 'in bad state' ]] && [[ ! $TUN =~ '处于错误状态' ]] && [[ ! $TUN =~ 'Die Dateizugriffsnummer ist in schlechter Verfassung' ]]; then 
red "检测到未开启TUN，现尝试添加TUN支持" && sleep 4
cd /dev
mkdir net
mknod net/tun c 10 200
chmod 0666 net/tun
TUN=$(cat /dev/net/tun 2>&1)
if [[ ! $TUN =~ 'in bad state' ]] && [[ ! $TUN =~ '处于错误状态' ]] && [[ ! $TUN =~ 'Die Dateizugriffsnummer ist in schlechter Verfassung' ]]; then 
green "添加TUN支持失败，建议与VPS厂商沟通或后台设置开启" && exit
else
cat <<EOF > /root/tun.sh
#!/bin/bash
cd /dev
mkdir net
mknod net/tun c 10 200
chmod 0666 net/tun
EOF
chmod +x /root/tun.sh
grep -qE "^ *@reboot root bash /root/tun.sh >/dev/null 2>&1" /etc/crontab || echo "@reboot root bash /root/tun.sh >/dev/null 2>&1" >> /etc/crontab
green "TUN守护功能已启动"
fi
fi
fi
if [[ ! -f /root/nf || ! -s /root/nf ]]; then
wget -O nf https://raw.githubusercontent.com/rkygogo/netflix-verify/main/nf_linux_$cpu
chmod +x nf
fi
[[ $(type -P yum) ]] && yumapt='yum -y' || yumapt='apt -y'
[[ $(type -P curl) ]] || (yellow "检测到curl未安装，升级安装中" && $yumapt update;$yumapt install curl)
[[ $(type -P bc) ]] || ($yumapt update;$yumapt install bc)
[[ ! $(type -P qrencode) ]] && ($yumapt update;$yumapt install qrencode)
[[ ! $(type -P python3) ]] && (yellow "检测到python3未安装，升级安装中" && $yumapt update;$yumapt install python3)
[[ ! $(type -P screen) ]] && (yellow "检测到screen未安装，升级安装中" && $yumapt update;$yumapt install screen)
}

ud4='sed -i "7 s/^/PostUp = ip -4 rule add from $(ip route get 162.159.192.1 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf && sed -i "7 s/^/PostDown = ip -4 rule delete from $(ip route get 162.159.192.1 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf'
ud6='sed -i "7 s/^/PostUp = ip -6 rule add from $(ip route get 2606:4700:d0::a29f:c001 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf && sed -i "7 s/^/PostDown = ip -6 rule delete from $(ip route get 2606:4700:d0::a29f:c001 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf'
ud4ud6='sed -i "7 s/^/PostUp = ip -4 rule add from $(ip route get 162.159.192.1 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf && sed -i "7 s/^/PostDown = ip -4 rule delete from $(ip route get 162.159.192.1 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf && sed -i "7 s/^/PostUp = ip -6 rule add from $(ip route get 2606:4700:d0::a29f:c001 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf && sed -i "7 s/^/PostDown = ip -6 rule delete from $(ip route get 2606:4700:d0::a29f:c001 | grep -oP '"'src \K\S+') lookup main\n/"'" /etc/wireguard/wgcf.conf'
c1="sed -i '/0\.0\.0\.0\/0/d' /etc/wireguard/wgcf.conf"
c2="sed -i '/\:\:\/0/d' /etc/wireguard/wgcf.conf"
c3="sed -i 's/engage.cloudflareclient.com/162.159.193.10/g' /etc/wireguard/wgcf.conf"
c4="sed -i 's/engage.cloudflareclient.com/2606:4700:d0::a29f:c001/g' /etc/wireguard/wgcf.conf"
c5="sed -i 's/1.1.1.1/8.8.8.8,2001:4860:4860::8888/g' /etc/wireguard/wgcf.conf"
c6="sed -i 's/1.1.1.1/2001:4860:4860::8888,8.8.8.8/g' /etc/wireguard/wgcf.conf"

v4v6(){
v6=$(curl -s6m6 ip.p3terx.com -k | sed -n 1p)
v4=$(curl -s4m6 ip.p3terx.com -k | sed -n 1p)
}

checkwgcf(){
wgcfv6=$(curl -s6m6 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
wgcfv4=$(curl -s4m6 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
}

ShowWGCF(){
UA_Browser="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36"
v4v6
warppflow=$((`grep -oP '"quota":\K\d+' <<< $(curl -s "https://api.cloudflareclient.com/v0a884/reg/$(grep 'device_id' /etc/wireguard/wgcf-account.toml 2>/dev/null | cut -d \' -f2)" -H "User-Agent: okhttp/3.12.1" -H "Authorization: Bearer $(grep 'access_token' /etc/wireguard/wgcf-account.toml 2>/dev/null | cut -d \' -f2)")`))
flow=`echo "scale=2; $warppflow/1000000000" | bc`
[[ -e /etc/wireguard/wgcf+p.log ]] && cfplus="WARP+普通账户(有限WARP+流量：$flow GB)，设备名称：$(grep -s 'Device name' /etc/wireguard/wgcf+p.log | awk '{ print $NF }')" || cfplus="WARP+Teams账户(无限WARP+流量)"
if [[ -n $v4 ]]; then
wgcfv4=$(curl -s4 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
isp4a=`curl -sm6 --user-agent "${UA_Browser}" http://ip-api.com/json/$v4?lang=zh-CN -k | cut -f13 -d ":" | cut -f2 -d '"'`
isp4b=`curl -sm6 --user-agent "${UA_Browser}" https://api.ip.sb/geoip/$v4 -k | awk -F "isp" '{print $2}' | awk -F "offset" '{print $1}' | sed "s/[,\":]//g"`
[[ -n $isp4a ]] && isp4=$isp4a || isp4=$isp4b
nonf=$(curl -sm6 --user-agent "${UA_Browser}" http://ip-api.com/json/$v4?lang=zh-CN -k | cut -f2 -d"," | cut -f4 -d '"')
sunf=$(./nf | awk '{print $1}' | sed -n '4p')
snnf=$(curl -s4m6 ip.p3terx.com -k | sed -n 2p | awk '{print $3}')
if [[ -n $sunf ]]; then
country=$sunf
elif [[ -z $sunf && -n $nonf ]]; then
country=$nonf
else
country=$snnf
fi
case ${wgcfv4} in 
plus) 
WARPIPv4Status=$(white "WARP+状态：\c" ; rred "运行中，$cfplus" ; white " 服务商 Cloudflare 获取IPV4地址：\c" ; rred "$v4  $country" ; white " 奈飞NF解锁情况：\c" ; rred "$(./nf | awk '{print $1}' | sed -n '3p')");;  
on) 
WARPIPv4Status=$(white "WARP状态：\c" ; green "运行中，WARP普通账户(无限WARP流量)" ; white " 服务商 Cloudflare 获取IPV4地址：\c" ; green "$v4  $country" ; white " 奈飞NF解锁情况：\c" ; green "$(./nf | awk '{print $1}' | sed -n '3p')");;
off) 
WARPIPv4Status=$(white "WARP状态：\c" ; yellow "关闭中" ; white " 服务商 $isp4 获取IPV4地址：\c" ; yellow "$v4  $country" ; white " 奈飞NF解锁情况：\c" ; yellow "$(./nf | awk '{print $1}' | sed -n '3p')");; 
esac 
else
WARPIPv4Status=$(white "IPV4状态：\c" ; red "不存在IPV4地址 ")
fi 
if [[ -n $v6 ]]; then
wgcfv6=$(curl -s6 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
isp6a=`curl -sm6 --user-agent "${UA_Browser}" http://ip-api.com/json/$v6?lang=zh-CN -k | cut -f13 -d":" | cut -f2 -d '"'`
isp6b=`curl -sm6 --user-agent "${UA_Browser}" https://api.ip.sb/geoip/$v6 -k | awk -F "isp" '{print $2}' | awk -F "offset" '{print $1}' | sed "s/[,\":]//g"`
[[ -n $isp6a ]] && isp6=$isp6a || isp6=$isp6b
nonf=$(curl -sm6 --user-agent "${UA_Browser}" http://ip-api.com/json/$v6?lang=zh-CN -k | cut -f2 -d"," | cut -f4 -d '"')
sunf=$(./nf | awk '{print $1}' | sed -n '8p')
snnf=$(curl -s6m6 ip.p3terx.com -k | sed -n 2p | awk '{print $3}')
if [[ -n $sunf ]]; then
country=$sunf
elif [[ -z $sunf && -n $nonf ]]; then
country=$nonf
else
country=$snnf
fi
case ${wgcfv6} in 
plus) 
WARPIPv6Status=$(white "WARP+状态：\c" ; rred "运行中，$cfplus" ; white " 服务商 Cloudflare 获取IPV6地址：\c" ; rred "$v6  $country" ; white " 奈飞NF解锁情况：\c" ; rred "$(./nf | awk '{print $1}' | sed -n '7p')");;  
on) 
WARPIPv6Status=$(white "WARP状态：\c" ; green "运行中，WARP普通账户(无限WARP流量)" ; white " 服务商 Cloudflare 获取IPV6地址：\c" ; green "$v6  $country" ; white " 奈飞NF解锁情况：\c" ; green "$(./nf | awk '{print $1}' | sed -n '7p')");;
off) 
WARPIPv6Status=$(white "WARP状态：\c" ; yellow "关闭中" ; white " 服务商 $isp6 获取IPV6地址：\c" ; yellow "$v6  $country" ; white " 奈飞NF解锁情况：\c" ; yellow "$(./nf | awk '{print $1}' | sed -n '7p')");;
esac 
else
WARPIPv6Status=$(white "IPV6状态：\c" ; red "不存在IPV6地址 ")
fi 
}

get_char(){
SAVEDSTTY=`stty -g`
stty -echo
stty cbreak
dd if=/dev/tty bs=1 count=1 2> /dev/null
stty -raw
stty echo
stty $SAVEDSTTY
}

dig9(){
if [[ -n $(grep 'DiG 9' /etc/hosts) ]]; then
echo -e "search blue.kundencontroller.de\noptions rotate\nnameserver 2a02:180:6:5::1c\nnameserver 2a02:180:6:5::4\nnameserver 2a02:180:6:5::1e\nnameserver 2a02:180:6:5::1d" > /etc/resolv.conf
fi
}

docker(){
if [[ -n $(ip a | grep docker) ]]; then
red "检测到VPS已安装docker，如继续安装wgcf-warp，docker可能会失效"
sleep 3s
yellow "6秒后继续安装，退出安装请按Ctrl+c"
sleep 6s
fi
}

STOPwgcf(){
if [[ $(type -P warp-cli) ]]; then
red "已安装Socks5-WARP(+)，不支持当前选择的wgcf-warp安装方案" 
systemctl restart wg-quick@wgcf ; bash CFwarp.sh
fi
}

lncf(){
if [[ $(type -P wg-quick) || $(type -P warp-cli) ]]; then
chmod +x /root/CFwarp.sh 
ln -sf /root/CFwarp.sh /usr/bin/cf
fi
}

first4(){
checkwgcf
if [[ $wgcfv4 =~ on|plus && -z $wgcfv6 ]]; then
[[ -n /etc/gai.conf ]] && grep -qE '^ *precedence ::ffff:0:0/96  100' /etc/gai.conf || echo 'precedence ::ffff:0:0/96  100' >> /etc/gai.conf
sed -i '/^label 2002::\/16   2/d' /etc/gai.conf
else
sed -i '/^precedence ::ffff:0:0\/96  100/d;/^label 2002::\/16   2/d' /etc/gai.conf
fi
}

fawgcf(){
rm -f /etc/wireguard/wgcf+p.log
ID=$(cat /etc/wireguard/buckup-account.toml | grep license_key | awk '{print $3}')
sed -i "s/license_key.*/license_key = $ID/g" /etc/wireguard/wgcf-account.toml
cd /etc/wireguard && wgcf update >/dev/null 2>&1
wgcf generate >/dev/null 2>&1 && cd
sed -i "2s#.*#$(sed -ne 2p /etc/wireguard/wgcf-profile.conf)#;4s#.*#$(sed -ne 4p /etc/wireguard/wgcf-profile.conf)#" /etc/wireguard/wgcf.conf
CheckWARP
ShowWGCF && WGCFmenu
}

WGproxy(){
[[ ! $(type -P wg-quick) ]] && red "未安装Wgcf-WARP" && bash CFwarp.sh
blue "\nWireguard客户端相关设置说明请关注甬哥博客"
green "\n根据网络环境，选择Wireguard代理节点的Endpoint对端IP地址"
readp "1. 使用IPV4地址 (支持v4或v6+v4网络环境，回车默认)\n2. 使用IPV6地址 (仅支持v6+v4网络环境)\n请选择：" IPet
if [ -z "${IPet}" ] || [ $IPet == "1" ];then
endip=162.159.193.10
elif [ $IPet == "2" ];then
endip=[2606:4700:d0::]
else 
red "输入错误，请重新选择" && WGproxy
fi
cp -f /etc/wireguard/wgcf.conf /etc/wireguard/wgproxy.conf >/dev/null 2>&1
sed -i '/PostUp/d;/PostDown/d;/AllowedIPs/d;/Endpoint/d' /etc/wireguard/wgproxy.conf
sed -i "8a AllowedIPs = 0.0.0.0\/0\nAllowedIPs = ::\/0\n" /etc/wireguard/wgproxy.conf
sed -i "10a Endpoint = $endip:1701" /etc/wireguard/wgproxy.conf
green "当前wireguard客户端配置文件wgproxy.conf内容如下，保存到 /etc/wireguard/wgproxy.conf\n" && sleep 2
yellow "$(cat /etc/wireguard/wgproxy.conf)\n"
green "当前wireguard节点二维码分享链接如下" && sleep 2
qrencode -t ansiutf8 < /etc/wireguard/wgproxy.conf
}

ABC(){
echo $ABC1 | sh
echo $ABC2 | sh
echo $ABC3 | sh
echo $ABC4 | sh
echo $ABC5 | sh
}

conf(){
rm -rf /etc/wireguard/wgcf.conf
cp -f /etc/wireguard/wgcf-profile.conf /etc/wireguard/wgcf.conf >/dev/null 2>&1
}

nat4(){
[[ -n $(ip route get 162.159.192.1 2>/dev/null | grep -oP 'src \K\S+') ]] && ABC4=$ud4 || ABC4=echo
}

WGCFv4(){
yellow "稍等3秒，检测VPS内warp环境"
docker && checkwgcf
if [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps首次安装wgcf-warp\n现添加IPV4单栈wgcf-warp模式" && sleep 2
ABC1=$c5 && ABC2=$c2 && ABC3=$ud4 && ABC4=$c3 && WGCFins
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps首次安装wgcf-warp\n现添加IPV4单栈wgcf-warp模式" && sleep 2
ABC1=$c5 && ABC2=$c4 && ABC3=$c2 && nat4 && WGCFins
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps首次安装wgcf-warp\n现添加IPV4单栈wgcf-warp模式" && sleep 2
STOPwgcf ; ABC1=$c5 && ABC2=$c2 && ABC3=$c3 && ABC4=$ud4 && WGCFins
fi
first4
else
wg-quick down wgcf >/dev/null 2>&1
sleep 1 && v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps已安装wgcf-warp\n现快速切换IPV4单栈wgcf-warp模式" && sleep 2
conf && ABC1=$c5 && ABC2=$c2 && ABC3=$ud4 && ABC4=$c3 && ABC
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps已安装wgcf-warp\n现快速切换IPV4单栈wgcf-warp模式" && sleep 2
conf && ABC1=$c5 && ABC2=$c4 && ABC3=$c2 && nat4 && ABC
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps已安装wgcf-warp\n现快速切换IPV4单栈wgcf-warp模式" && sleep 2
STOPwgcf ; conf && ABC1=$c5 && ABC2=$c2 && ABC3=$c3 && ABC4=$ud4 && ABC
fi
CheckWARP && first4 && ShowWGCF && WGCFmenu
fi
}

WGCFv6(){
yellow "稍等3秒，检测VPS内warp环境"
docker && checkwgcf
if [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps首次安装wgcf-warp\n现添加IPV6单栈wgcf-warp模式" && sleep 2
ABC1=$c5 && ABC2=$c1 && ABC3=$ud6 && ABC4=$c3 && WGCFins
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps首次安装wgcf-warp\n现添加IPV6单栈wgcf-warp模式(无IPV4！！！)" && sleep 2
ABC1=$c6 && ABC2=$c1 && ABC3=$c4 && nat4 && ABC5=$ud6 && WGCFins
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps首次安装wgcf-warp\n现添加IPV6单栈wgcf-warp模式" && sleep 2
ABC1=$c5 && ABC2=$c3 && ABC3=$c1 && WGCFins
fi
else
wg-quick down wgcf >/dev/null 2>&1
sleep 1 && v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps已安装wgcf-warp\n现快速切换IPV6单栈wgcf-warp模式" && sleep 2
conf && ABC1=$c5 && ABC2=$c1 && ABC3=$ud6 && ABC4=$c3 && ABC
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps已安装wgcf-warp\n现快速切换IPV6单栈wgcf-warp模式(无IPV4！！！)" && sleep 2
conf && ABC1=$c6 && ABC2=$c1 && ABC3=$c4 && nat4 && ABC5=$ud6 && ABC
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps已安装wgcf-warp\n现快速切换IPV6单栈wgcf-warp模式" && sleep 2
conf && ABC1=$c5 && ABC2=$c3 && ABC3=$c1 && ABC
fi
CheckWARP && first4 && ShowWGCF && WGCFmenu
fi
}

WGCFv4v6(){
yellow "稍等3秒，检测VPS内warp环境"
docker && checkwgcf
if [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps首次安装wgcf-warp\n现添加IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; ABC1=$c5 && ABC2=$ud4ud6 && ABC3=$c3 && WGCFins
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps首次安装wgcf-warp\n现添加IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; ABC1=$c5 && ABC2=$c4 && ABC3=$ud6 && nat4 && WGCFins
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps首次安装wgcf-warp\n现添加IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; ABC1=$c5 && ABC2=$c3 && ABC3=$ud4 && WGCFins
fi
else
wg-quick down wgcf >/dev/null 2>&1
sleep 1 && v4v6
if [[ -n $v4 && -n $v6 ]]; then
green "当前原生v4+v6双栈vps已安装wgcf-warp\n现快速切换IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; conf && ABC1=$c5 && ABC2=$ud4ud6 && ABC3=$c3 && ABC
fi
if [[ -n $v6 && -z $v4 ]]; then
green "当前原生v6单栈vps已安装wgcf-warp\n现快速切换IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; conf && ABC1=$c5 && ABC2=$c4 && ABC3=$ud6 && nat4 && ABC
fi
if [[ -z $v6 && -n $v4 ]]; then
green "当前原生v4单栈vps已安装wgcf-warp\n现快速切换IPV4+IPV6双栈wgcf-warp模式" && sleep 2
STOPwgcf ; conf && ABC1=$c5 && ABC2=$c3 && ABC3=$ud4 && ABC
fi
CheckWARP && first4 && ShowWGCF && WGCFmenu
fi
}

WGCFmenu(){
white "------------------------------------------------------------------------------------"
white " 当前 IPV4 接管出站流量情况如下 "
white " ${WARPIPv4Status}"
white "------------------------------------------------------------------------------------"
white " 当前 IPV6 接管出站流量情况如下"
white " ${WARPIPv6Status}"
white "------------------------------------------------------------------------------------"
}
back(){
white "------------------------------------------------------------------------------------"
white " 回主菜单，请按任意键"
white " 退出脚本，请按Ctrl+C"
get_char && bash CFwarp.sh
}

IP_Status_menu(){
WGCFmenu 
}

CheckWARP(){
i=0
wg-quick down wgcf >/dev/null 2>&1
while [ $i -le 4 ]; do let i++
yellow "共执行5次，第$i次获取warp的IP中……"
systemctl restart wg-quick@wgcf >/dev/null 2>&1
checkwgcf
[[ $wgcfv4 =~ on|plus || $wgcfv6 =~ on|plus ]] && green "恭喜！warp的IP获取成功！" && break || red "遗憾！warp的IP获取失败"
done
checkwgcf
if [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
yellow "安装WARP失败，还原VPS，卸载Wgcf-WARP组件中……"
cwg
green "卸载Wgcf-WARP组件完成"
green "安装WARP失败，建议如下："
[[ $release = Centos && ${vsid} -lt 7 ]] && yellow "当前系统版本号：Centos $vsid \n建议使用 Centos 7 以上系统 " 
[[ $release = Ubuntu && ${vsid} -lt 18 ]] && yellow "当前系统版本号：Ubuntu $vsid \n建议使用 Ubuntu 18 以上系统 " 
[[ $release = Debian && ${vsid} -lt 10 ]] && yellow "当前系统版本号：Debian $vsid \n建议使用 Debian 10 以上系统 "
yellow "1、强烈建议使用官方源升级系统及内核加速！如已使用第三方源及内核加速，请务必更新到最新版，或重置为官方源"
yellow "2、部分VPS系统极度精简，相关依赖需自行安装后再尝试"
yellow "3、查看https://www.cloudflarestatus.com/,你当前VPS就近区域可能处于黄色的【Re-routed】状态"
exit
else 
green "ok"
fi
xyz(){
att
[[ -e /root/check.sh ]] && screen -S aw -X quit ; screen -UdmS aw bash -c '/bin/bash /root/check.sh'
[[ -e /root/WARP-CR.sh ]] && screen -S cr -X quit ; screen -UdmS cr bash -c '/bin/bash /root/WARP-CR.sh'
[[ -e /root/WARP-CP.sh ]] && screen -S cp -X quit ; screen -UdmS cp bash -c '/bin/bash /root/WARP-CP.sh'
if [[ -e /root/WARP-UP.sh ]]; then
screen -S up -X quit ; screen -UdmS up bash -c '/bin/bash /root/WARP-UP.sh'
else
green "安装warp在线监测守护进程"
cat>/root/WARP-UP.sh<<-\EOF
#!/bin/bash
red(){ echo -e "\033[31m\033[01m$1\033[0m";}
green(){ echo -e "\033[32m\033[01m$1\033[0m";}
checkwgcf(){
wgcfv6=$(curl -s6m6 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
wgcfv4=$(curl -s4m6 https://www.cloudflare.com/cdn-cgi/trace -k | grep warp | cut -d= -f2) 
}
warpclose(){
wg-quick down wgcf >/dev/null 2>&1 ; systemctl stop wg-quick@wgcf >/dev/null 2>&1 ; systemctl disable wg-quick@wgcf >/dev/null 2>&1
}
warpopen(){
wg-quick down wgcf >/dev/null 2>&1 ; systemctl enable wg-quick@wgcf >/dev/null 2>&1 ; systemctl start wg-quick@wgcf >/dev/null 2>&1 ; systemctl restart wg-quick@wgcf >/dev/null 2>&1
}
warpre(){
i=0
while [ $i -le 4 ]; do let i++
warpopen
checkwgcf
[[ $wgcfv4 =~ on|plus || $wgcfv6 =~ on|plus ]] && green "中断后的warp尝试获取IP成功！" && break || red "中断后的warp尝试获取IP失败！"
done
checkwgcf
if [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
warpclose
red "由于5次尝试获取warp的IP失败，现执行停止并关闭warp，VPS恢复原IP状态"
fi
}
while true; do
green "检测warp是否启动中…………"
checkwgcf
[[ $wgcfv4 =~ on|plus || $wgcfv6 =~ on|plus ]] && green "恭喜！warp状态为运行中！下轮检测将在你设置的60秒后自动执行" && sleep 60s || (warpre ; green "下轮检测将在你设置的50秒后自动执行" ; sleep 50s)
done
EOF
readp "warp状态为运行时，重新检测warp状态间隔时间（回车默认60秒）,请输入间隔时间（例：50秒，输入50）:" stop
[[ -n $stop ]] && sed -i "s/60s/${stop}s/g;s/60秒/${stop}秒/g" /root/WARP-UP.sh || green "默认间隔60秒"
readp "warp状态为中断时(连续5次失败自动关闭warp)，继续检测WARP状态间隔时间（回车默认50秒）,请输入间隔时间（例：50秒，输入50）:" goon
[[ -n $goon ]] && sed -i "s/50s/${goon}s/g;s/50秒/${goon}秒/g" /root/WARP-UP.sh || green "默认间隔50秒"
[[ -e /root/WARP-UP.sh ]] && screen -S up -X quit ; screen -UdmS up bash -c '/bin/bash /root/WARP-UP.sh'
green "设置screen窗口名称'up'" && sleep 2
grep -qE "^ *@reboot root screen -UdmS up bash -c '/bin/bash /root/WARP-UP.sh' >/dev/null 2>&1" /etc/crontab || echo "@reboot root screen -UdmS up bash -c '/bin/bash /root/WARP-UP.sh' >/dev/null 2>&1" >> /etc/crontab
green "添加warp在线守护进程功能"
fi
}
}

WGCFins(){
rm -rf /usr/local/bin/wgcf /etc/wireguard/wgcf.conf /etc/wireguard/wgcf-profile.conf /etc/wireguard/wgcf-account.toml /etc/wireguard/wgcf+p.log /etc/wireguard/ID /usr/bin/wireguard-go /usr/bin/wgcf wgcf-account.toml wgcf-profile.conf
ShowWGCF
if [[ $release = Centos ]]; then
if [[ ${vsid} =~ 8 ]]; then
cd /etc/yum.repos.d/ && mkdir backup && mv *repo backup/ 
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-8.repo
sed -i -e "s|mirrors.cloud.aliyuncs.com|mirrors.aliyun.com|g " /etc/yum.repos.d/CentOS-*
sed -i -e "s|releasever|releasever-stream|g" /etc/yum.repos.d/CentOS-*
yum clean all && yum makecache
fi
yum install epel-release -y;yum install iproute iptables wireguard-tools -y
elif [[ $release = Debian ]]; then
apt install lsb-release -y
echo "deb http://deb.debian.org/debian $(lsb_release -sc)-backports main" | tee /etc/apt/sources.list.d/backports.list
apt update -y;apt install iproute2 openresolv dnsutils iptables -y;apt install wireguard-tools --no-install-recommends -y      		
elif [[ $release = Ubuntu ]]; then
apt update -y;apt install iproute2 openresolv dnsutils iptables -y;apt install wireguard-tools --no-install-recommends -y			
fi
wget -N https://gitlab.com/rwkgyg/cfwarp/raw/main/wgcf_2.2.15_$cpu -O /usr/local/bin/wgcf && chmod +x /usr/local/bin/wgcf         
if [[ $main -lt 5 || $minor -lt 6 ]] || [[ $vi =~ lxc|openvz ]]; then
[[ -e /usr/bin/wireguard-go ]] || wget -N https://gitlab.com/rwkgyg/cfwarp/raw/main/wireguard-go -O /usr/bin/wireguard-go && chmod +x /usr/bin/wireguard-go
fi
echo | wgcf register
until [[ -e wgcf-account.toml ]]
do
yellow "申请warp普通账户过程中可能会多次提示：429 Too Many Requests，请等待30秒" && sleep 1
echo | wgcf register --accept-tos
done
wgcf generate
yellow "开始自动设置warp的MTU最佳网络吞吐量值，以优化WARP网络！"
MTUy=1500
MTUc=10
if [[ -n $v6 && -z $v4 ]]; then
ping='ping6'
IP1='2606:4700:4700::1111'
IP2='2001:4860:4860::8888'
else
ping='ping'
IP1='1.1.1.1'
IP2='8.8.8.8'
fi
while true; do
if ${ping} -c1 -W1 -s$((${MTUy} - 28)) -Mdo ${IP1} >/dev/null 2>&1 || ${ping} -c1 -W1 -s$((${MTUy} - 28)) -Mdo ${IP2} >/dev/null 2>&1; then
MTUc=1
MTUy=$((${MTUy} + ${MTUc}))
else
MTUy=$((${MTUy} - ${MTUc}))
[[ ${MTUc} = 1 ]] && break
fi
[[ ${MTUy} -le 1360 ]] && MTUy='1360' && break
done
MTU=$((${MTUy} - 80))
green "MTU最佳网络吞吐量值= $MTU 已设置完毕"
sed -i "s/MTU.*/MTU = $MTU/g" wgcf-profile.conf
cp -f wgcf-profile.conf /etc/wireguard/wgcf.conf >/dev/null 2>&1
cp -f wgcf-account.toml /etc/wireguard/buckup-account.toml  >/dev/null 2>&1
ABC
mv -f wgcf-profile.conf /etc/wireguard >/dev/null 2>&1
mv -f wgcf-account.toml /etc/wireguard >/dev/null 2>&1
systemctl enable wg-quick@wgcf >/dev/null 2>&1
CheckWARP && ShowWGCF && WGCFmenu && lncf
}

warprefresh(){
wget -N https://gitlab.com/rwkgyg/CFwarp/raw/main/wp-plus.py 
sed -i "27 s/[(][^)]*[)]//g" wp-plus.py
readp "客户端配置ID(36个字符)：" ID
sed -i "27 s/input/'$ID'/" wp-plus.py
python3 wp-plus.py
}

WARPup(){
[[ ! $(type -P wg-quick) ]] && red "未安装wgcf-warp" && bash CFwarp.sh
backconf(){
yellow "升级失败，自动恢复warp普通账户"
sed -i "2s#.*#$(sed -ne 2p /etc/wireguard/wgcf-profile.conf)#;4s#.*#$(sed -ne 4p /etc/wireguard/wgcf-profile.conf)#" /etc/wireguard/wgcf.conf
systemctl restart wg-quick@wgcf
ShowWGCF && WGCFmenu && back
}
ab="1.Teams账户\n2.warp+账户\n3.普通warp账户\n0.返回上一层\n 请选择："
readp "$ab" cd
case "$cd" in 
1 )
[[ ! -e /etc/wireguard/wgcf.conf ]] && red "无法找到wgcf-warp配置文件，建议重装wgcf-warp" && bash CFwarp.sh
readp "请复制privateKey(44个字符）：" Key
readp "请复制IPV6的Address：" Add
if [[ -n $Key && -n $Add ]]; then
sed -i "s#PrivateKey.*#PrivateKey = $Key#g;s#Address.*128#Address = $Add/128#g" /etc/wireguard/wgcf.conf
systemctl restart wg-quick@wgcf >/dev/null 2>&1
checkwgcf
if [[ $wgcfv4 = plus || $wgcfv6 = plus ]]; then
rm -rf /etc/wireguard/wgcf+p.log && green "wgcf-warp+Teams账户已生效" && ShowWGCF && WGCFmenu && back
else
backconf
fi
else 
backconf
fi;;
2 )
ShowWGCF
[[ $wgcfv4 = plus || $wgcfv6 = plus ]] && red "当前已是Wgcf-WARP+账户，无须再升级" && bash CFwarp.sh 
readp "请确保手机上的warp客户端已处于warp+状态，复制按键许可证秘钥(26个字符):" ID
[[ -n $ID ]] && sed -i "s/license_key.*/license_key = '$ID'/g" /etc/wireguard/wgcf-account.toml && readp "设备名称重命名(直接回车随机命名)：" sbmc || (red "未输入按键许可证秘钥(26个字符)" && bash CFwarp.sh)
[[ -n $sbmc ]] && SBID="--name $(echo $sbmc | sed s/[[:space:]]/_/g)"
cd /etc/wireguard && wgcf update $SBID > /etc/wireguard/wgcf+p.log 2>&1
wgcf generate && cd
sed -i "2s#.*#$(sed -ne 2p /etc/wireguard/wgcf-profile.conf)#;4s#.*#$(sed -ne 4p /etc/wireguard/wgcf-profile.conf)#" /etc/wireguard/wgcf.conf
CheckWARP && checkwgcf
if [[ $wgcfv4 = plus || $wgcfv6 = plus ]]; then
warppflow=$((`grep -oP '"quota":\K\d+' <<< $(curl -s "https://api.cloudflareclient.com/v0a884/reg/$(grep 'device_id' /etc/wireguard/wgcf-account.toml 2>/dev/null | cut -d \' -f2)" -H "User-Agent: okhttp/3.12.1" -H "Authorization: Bearer $(grep 'access_token' /etc/wireguard/wgcf-account.toml 2>/dev/null | cut -d \' -f2)")`))
flow=`echo "scale=2; $warppflow/1000000000" | bc`
green "已升级为wgcf-warp+账户\nwgcf-warp+账户设备名称：$(grep -s 'Device name' /etc/wireguard/wgcf+p.log | awk '{ print $NF }')\nwgcf-warp+账户剩余流量：$flow GB"
ShowWGCF && WGCFmenu 
else
red "经IP检测，升级warp+失败，请确保密钥使用的设备不超过5个，建议更换下秘钥再尝试，脚本退出" && exit
fi;;
3 )
checkwgcf
if [[ $wgcfv4 = plus || $wgcfv6 = plus ]]; then
fawgcf
else
yellow "当前已是wgcf-warp普通账号"
ShowWGCF && WGCFmenu
fi;;
0 ) bash CFwarp.sh
esac
}

WARPonoff(){
[[ ! $(type -P wg-quick) ]] && red "wgcf-warp未安装，无法启动或关闭，建议重新安装wgcf-warp" && bash CFwarp.sh
ab="1.开启或者完全关闭wgcf-warp\n0.返回上一层\n 请选择："
readp "$ab" cd
case "$cd" in  
1 )
checkwgcf
if [[ $wgcfv4 =~ on|plus || $wgcfv6 =~ on|plus ]]; then
yellow "当前wgcf-warp状态：已运行中，现执行:完全关闭……"
wg-quick down wgcf >/dev/null 2>&1
systemctl stop wg-quick@wgcf >/dev/null 2>&1
systemctl disable wg-quick@wgcf >/dev/null 2>&1
checkwgcf
[[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]] && green "关闭wgcf-warp成功" || red "关闭wgcf-warp失败"
elif [[ ! $wgcfv4 =~ on|plus && ! $wgcfv6 =~ on|plus ]]; then
yellow "当前wgcf-warp为完全关闭状态，现执行:恢复运行……"
wg-quick down wgcf >/dev/null 2>&1
systemctl restart wg-quick@wgcf >/dev/null 2>&1
CheckWARP
fi
ShowWGCF && WGCFmenu && back;;
0 ) WARPOC
esac
}

cwg(){
screen -S up -X quit ; rm -rf WARP-UP.sh ; sed -i '/WARP-UP.sh/d' /etc/crontab
wg-quick down wgcf >/dev/null 2>&1
systemctl disable wg-quick@wgcf >/dev/null 2>&1
$yumapt autoremove wireguard-tools
dig9
sed -i '/^precedence ::ffff:0:0\/96  100/d;/^label 2002::\/16   2/d' /etc/gai.conf
}

WARPun(){
wj="rm -rf /usr/local/bin/wgcf /etc/wireguard/wgcf.conf /etc/wireguard/wgcf-profile.conf /etc/wireguard/wgcf-account.toml /etc/wireguard/wgcf+p.log /etc/wireguard/ID /usr/bin/wireguard-go /usr/bin/wgcf wgcf-account.toml wgcf-profile.conf"
cron1="rm -rf CFwarp.sh screen.sh check.sh WARP-CR.sh WARP-CP.sh WARP-UP.sh /usr/bin/cf"
cron2(){
sed -i '/check.sh/d' /etc/crontab ; sed -i '/WARP-CR.sh/d' /etc/crontab ; sed -i '/WARP-CP.sh/d' /etc/crontab ; sed -i '/WARP-UP.sh/d' /etc/crontab
}
cron3(){
screen -S up -X quit;screen -S aw -X quit;screen -S cr -X quit;screen -S cp -X quit
}
ab="1.彻底卸载并清除warp脚本及相关进程文件\n0.返回上一层\n 请选择："
readp "$ab" cd
case "$cd" in     
# 1 ) [[ $(type -P wg-quick) ]] && (cwg ; $wj ; green "Wgcf-WARP(+)卸载完成" && ShowWGCF && WGCFmenu && back) || (yellow "并未安装Wgcf-WARP(+)，无法卸载" && bash CFwarp.sh);;
# 2 ) [[ $(type -P warp-cli) ]] && (cso ; green "Socks5-WARP(+)卸载完成" && ShowSOCKS5 && S5menu && back) || (yellow "并未安装Socks5-WARP(+)，无法卸载" && bash CFwarp.sh);;
1 ) [[ ! $(type -P wg-quick) && ! $(type -P warp-cli) ]] && (red "并没有安装任何的warp功能，无法卸载" && CFwarp.sh) || (cron3 ; cron2 ; $cron1 ; cwg ; $wj ; green "warp已全部卸载完成" && ShowWGCF && WGCFmenu && exit);;
0 ) WARPOC
esac
}

WARPOC(){
ab="1.完全关闭或开启warp功能\n2.卸载warp功能\n0.返回上一层\n 请选择："
readp "$ab" cd
case "$cd" in
1 ) WARPonoff;;
2 ) WARPun;;
0 ) bash CFwarp.sh
esac
}

UPwpyg(){
if [[ ! $(type -P wg-quick) && ! $(type -P warp-cli) ]] && [[ ! -f '/root/CFwarp.sh' ]]; then
red "未正常安装CFwarp脚本!" && exit
fi
wget -N https://gitlab.com/rwkgyg/CFwarp/raw/main/CFwarp.sh
chmod +x /root/CFwarp.sh 
ln -sf /root/CFwarp.sh /usr/bin/cf
green "CFwarp安装脚本升级成功"
}

warpinscha(){
yellow "提示：VPS的本地出站IP将被你选择的warp的IP所接管，如VPS本地无该出站IP，则被另外生成warp的IP所接管"
echo
yellow "如果你什么都不懂，回车便是！！！"
echo
green "1. 安装/切换wgcf-warp单栈IPV4（回车默认）"
green "2. 安装/切换wgcf-warp单栈IPV6"
green "3. 安装/切换wgcf-warp双栈IPV4+IPV6"
readp "\n请选择：" wgcfwarp
if [ -z "${wgcfwarp}" ] || [ $wgcfwarp == "1" ];then
WGCFv4
elif [ $wgcfwarp == "2" ];then
WGCFv6
elif [ $wgcfwarp == "3" ];then
WGCFv4v6
else 
red "输入错误，请重新选择" && warpinscha
fi
echo
}  

start_menu(){
ShowWGCF
clear
green "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"           
echo -e "${bblue} ░██     ░██      ░██ ██ ██         ░█${plain}█   ░██     ░██   ░██     ░█${red}█   ░██${plain}  "
echo -e "${bblue}  ░██   ░██      ░██    ░░██${plain}        ░██  ░██      ░██  ░██${red}      ░██  ░██${plain}   "
echo -e "${bblue}   ░██ ░██      ░██ ${plain}                ░██ ██        ░██ █${red}█        ░██ ██  ${plain}   "
echo -e "${bblue}     ░██        ░${plain}██    ░██ ██       ░██ ██        ░█${red}█ ██        ░██ ██  ${plain}  "
echo -e "${bblue}     ░██ ${plain}        ░██    ░░██        ░██ ░██       ░${red}██ ░██       ░██ ░██ ${plain}  "
echo -e "${bblue}     ░█${plain}█          ░██ ██ ██         ░██  ░░${red}██     ░██  ░░██     ░██  ░░██ ${plain}  "
echo
white " 甬哥Gitlab项目  ：gitlab.com/rwkgyg"
white " 甬哥blogger博客 ：ygkkk.blogspot.com"
white " 甬哥YouTube频道 ：www.youtube.com/c/甬哥侃侃侃kkkyg"
green "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
yellow " 安装warp成功后，进入脚本快捷方式：cf"
white " ================================================================="
green "  1. 安装/切换wgcf-warp" 
green "  2. warp关闭、开启、卸载"
green "  3. 显示wgcf-warp代理节点的配置文件、二维码（WireGuard协议）"
white " -----------------------------------------------------------------"
green "  4. warp刷刷刷选项：warp+流量……"
green "  5. warp三类账户升级/切换(warp/warp+/warp Teams)"
green "  6. 更新CFwarp脚本" 
green "  0. 退出脚本 "
white " ================================================================="
if [[ $(type -P wg-quick) || $(type -P warp-cli) ]] && [[ -f '/root/CFwarp.sh' ]]; then
if [ "${wpygV}" = "${remoteV}" ]; then
green " 当前CFwarp脚本版本号：${wpygV} 重置版第二版 ，已是最新版本\n"
else
green " 当前CFwarp脚本版本号：${wpygV}"
yellow " 检测到最新CFwarp脚本版本号：${remoteV} ，可选择6进行更新\n"
fi
fi
white " VPS系统信息如下："
white " VPS操作系统: $(blue "$op") \c" && white " 内核版本: $(blue "$version") \c" && white " CPU架构 : $(blue "$cpu") \c" && white " 虚拟化类型: $(blue "$vi")"
IP_Status_menu
echo
readp " 请输入数字:" Input
case "$Input" in     
 1 ) warpinscha;;
 2 ) WARPOC;;
 3 ) WGproxy;;
 4 ) warprefresh;;
 5 ) WARPup;;
 6 ) UPwpyg;;
 * ) exit 
esac
}

if [ $# == 0 ]; then
start
start_menu
fi
