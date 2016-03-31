---
title: iproute2 Command Cheatsheet
date: 2016-02-16
updated: 2016-03-01
banner:
  image: http://7fva40.com1.z0.glb.clouddn.com/cncs-iproute2.png
  size: 1234px 480px
  position: center
  color: '#282a36'
  height: 450px
---

## 基本语法

ip命令基本上都可以描述成下面的形式。

```text
ip [ OPTIONS ] OBJECT { COMMAND | help }
```

其中OBJECT可以是：

 * `addr`
 * `list`
 * `route`
 * `rule`
 * `neigh`
 * `netns`
 * `tunnel`
 * `xfrm`
 * ...

## iproute2命令都可以是用shorthand

比如命令`ip addr`可以用`ip a`, `ip ad`或`ip add`。

```sh
ip r # ip route
ip a # ip addr
ip n # ip neighbor
ip l # ip link
...

# 常用的command操作也可以用shorthand
ip a a 1.1.1.1/24 dev eth1 # ip addr add 1.1.1.1/24 dev eth1
ip a d 1.1.1.1/24 dev eth1 # ip addr del 1.1.1.1/24 dev eth1
ip a f dev eth1 # ip addr flush dev eth1
```

## Help

```sh
# 查看ip命令帮助
ip help

# 查看ip addr帮助
ip addr help

# 查看ip link帮助
ip link help
```

## Address

```sh
# 查看所有interface上的地址
ip addr

# 查看具体interface上的地址
ip addr show eth1 # ip addr ls eth1 或 ip addr ls dev eth1

# 添加ipv4地址
ip addr add 1.2.3.4/24 dev eth1

# 删除ipv4地址
ip addr del 1.2.3.4/24 dev eth1

# 清空eth1上的地址
ip addr flush dev eth1

# 添加ipv6地址
ip addr add 2015:1:15::1/64 dev eth1
```

## Link

```sh
# 查看所以interface的link状态
ip link

# 查看具体interface的link状态
ip link show eth1 # ip link ls eth1

# bring eth1 up
ip link set eth1 up

# bring eth1 down
ip link set eth1 down

# 查看具体interface的link数据(packets tx/rx drop/error)
ip -s link show dev eth1

# 设置MTU
ip link set mtu 9000 dev eth1

# 修改 interface 名字
ip link set dev tap2 name eth2

# 打开混杂模式
ip link set promisc on dev eth1

# 在eth1上创建一个VLAN 100的VLAN端口
ip link add link eth1 name eth1.100 type vlan id 100
```

## Route

```sh
# 查看路由
ip route

# 添加ipv4子网路由
ip route add 1.2.3.0/24 dev eth1

# 添加默认路由
ip route add default via 1.2.3.1

# 根据目的IP显示所选路由(很有用)
ip route get 1.2.3.4

# 查看table 10中的路由(如果不加table参数，默认查看的是table 254)
ip route show table 10

# 在table 10中添加路由
ip route add 1.2.3.128/25 dev eth1 table 10

# 查看ipv6路由
ip -6 route

# 填加ipv6路由
ip route add 2016:1:16::1/64 dev eth1
```

## Neighbor/ARP

ip neighbor主要用于操作arp cache。

```sh
# 查看arp cache
ip neigh show

# 查看指定interface上的arp cache
ip neigh show dev eth1

# 查看指定网段的arp cache
ip neigh show 1.2.3.0/24

# 清空指定interface上的arp cache
ip neigh flush dev eth1

# 添加一个arp条目
ip neigh add 1.2.3.4 lladdr da:8b:56:d4:b5:4d dev eth0

# 删除一个arp条目
ip neigh del 1.2.3.4 lladdr da:8b:56:d4:b5:4d dev eth0

# see http://linux-ip.net/html/tools-ip-neighbor.html
# see http://man7.org/linux/man-pages/man8/ip-neighbour.8.html
```

## Rule

```sh
# 查看rule
ip rule

# 添加rule (1.2.3.0/24的数据包查看路由table 10)
ip rule add from 1.2.3.0/24 lookup 10

# 删除rule
ip rule del from 1.2.3.0/24 lookup 10
```

## Network namespace

```sh
# 添加一个network namespace，叫ns1
ip netns add ns1

# 把eth1放入namespace ns1中
# 注意，此时eth1的link状态和IP地址信息会丢失，需要重新设置
ip link set eth1 netns ns1

# 在namesapce ns1中 执行相应命令
ip netns exec ns1 ip link set eth1 up
ip netns exec ns1 ip addr add 2.2.2.2/24 dev eth1
ip netns exec ns1 ping 2.2.2.1

# 将eth1移回默认的namespace
# netns后面可以使用namespace的名字作参数
# 也可以使用运行在该namespace中的某进程的PID坐参数
# 移回默认namespace可以使用init的PID(1)
ip link exec ns1 ip link set eth1 netns 1

## More at https://lwn.net/Articles/580893/
```


## veth pair

```sh
# 创建veth对，名字分别为veth1和veth2
ip link add name veth1 type veth peer name veth2

# 把veth1和veth2分别放入namesapce ns1和ns2中
ip netns add ns1
ip netns add ns2
ip link set veth1 netns ns1
ip link set veth2 netns ns2
```

## VXLAN

```sh
# see https://www.kernel.org/doc/Documentation/networking/vxlan.txt
# 创建一个名为vxlan0的设备(组播)，使用组播地址239.1.1.1，eth1作为vxlan tunnel point，VXLAN使用端口4789
ip link add vxlan0 type vxlan id 42 group 239.1.1.1 dev eth1 dstport 4789

# 创建一个名为vxlan1的设备(单播)，本地使用地址10.10.10.1，远端使用地址10.10.10.2，eth1作为vxlan tunnel point，VXLAN使用端口4789
ip link add vxlan1 type vxlan id 44 remote 10.10.10.2 local 10.10.10.1 dev eth1 dstport 4789
```

---

## Contributors

[haishanh][haishanh]

[haishanh]: http://hanhaishan.com