---
title: Open vSwitch ovs-ofctl Command Cheatsheet
date: 2016-01-15
updated: 2016-03-01
banner:
  image: http://carlog.qiniudn.com/ovs-ofctl.png
  size: 1000px 172px
  position: center
  color: '#1B78E3'
  height: 172px
---

## 管理相关命令

### 查看bridge信息

```sh
ovs-ofctl show br0
# 显示结果中port前面的数字为OpenFlow port id
```

### Dump flow **table**

```sh
# Dump br0所使用的flow table
ovs-ofctl dump-tables br0
```

### Dump flow

```sh
# Dump br0的所有flow
ovs-ofctl dump-flows br0

# Dump br0上匹配xx的flow
ovs-ofctl dump-flows br0 xx
```

## Flow Table相关命令

### 添加 flow

```sh
ovs-ofctl add-flow br0 in_port=1,actions=xx

# 从文件br0flow.txt中导入Flow Table
# 该文件必须一行一个flow
ovs-ofctl add-flow br0 - < br0flow.txt
```

### 修改 flow

```sh
ovs-ofctl mod-flows br0 xxx

ovs-ofctl mod-flows br0 - < br0flow.txt
```

### 删除 flow

```sh
# 删除br0上的所有flow
ovs-ofctl del-flows br0

# 删除br0上匹配xx的所有flow
ovs-ofctl del-flows br0 xx

# 删除br0上匹配文件br0flow.txt中各条目的flow
ovs-ofctl del-flows br0 - < br0flow.txt
```

## Flow Syntax

`ovs-ofctl`的Flow语法由一系列`field=value`形式的键值对组成，用英文逗号和空格隔开。

在描述Flow时，必须要遵循IP stack常理。比如说，在flow中使用了L3(层3)的字段时，必须也要指明L2所用的协议。使用了L4的字段时，必须也要指明L2和L3所用的协议。

本文档不包含 `ovs-ofctl` 对 OpenFlow 的 VMware/Nicira 扩展 flow 语法。

### in_port

```
in_port=<port>
```

匹配从OpenFlow port id `<port>` 进入的数据包。OpenFlow port id可以通过`ovs-ofctl show <br>`来查看。

### dl_vlan

```
dl_vlan=<vlan>
```

匹配IEEE 802.1Q VLAN tag为 `<vlan>` 的数据包。<vlan>的值应该在[0-4095]这个区间。`dl_vlan=0xffff`表示匹配没有VLAN tag的包。

### dl_vlan_pcp

```
dl_vlan_pcp=<priority>
```

匹配IEEE 802.1Q Priority Code Point(PCP, 优先级代码点)为<priority>的数据包，改值取值区间为[0-7]。数字越大，表示优先级越高。

### dl_src & dl_dst

```
dl_src=xx:xx:xx:xx:xx:xx
dl_dst=xx:xx:xx:xx:xx:xx
```

匹配源和目标MAC地址。

```
dl_src=xx:xx:xx:xx:xx:xx/xx:xx:xx:xx:xx:xx
dl_dst=xx:xx:xx:xx:xx:xx/xx:xx:xx:xx:xx:xx
```

匹配源和目的MAC地址。其中"/"后面的为掩码。比如说，如果掩码是：

 * `01:00:00:00:00:00` 只匹配组播MAC (第一个字节LSB为1的MAC地址为MAC组播地址)
 * `fe:ff:ff:ff:ff:ff` 匹配其他所有MAC，除了组播MAC
 * `ff:ff:ff:ff:ff:ff` 完全匹配掩码前的MAC，和省掉掩码的效果一样
 * `00:00:00:00:00:00` 完全通配，相当于(dl_dst=*)

### dl_type

```
dl_type=<ethertype>
```

匹配L2(Data Link Layer) header中的协议类型<ethertype>，该字段描述L3的类型。有效值区间[0, 65535]，可以是十进制数或者是以"0x"开头的十六进制数。比如：

 * `dl_type=0x0800` 匹配IP数据包
 * `dl_type=0x0806` 匹配ARP数据包
 * `dl_type=0x8035` 匹配RARP数据包


{% admonition note Note %}
需要说明的是 dl_type=0x0800 可以用关键字 ip 代替。
而 dl_type=0x0806 可以用关键字 arp 代替。dl_type=0x8035 可以用关键字 rarp 代替。
{% endadmonition %}

### nw_src & nw_dst

```
nw_src=<ip[/netmask]>
nw_dst=<ip[/netmask]>
```

当使用了 `dl_type=0x0800` 或者关键字 `ip` 或 `tcp` 时，`nw_src` 和 `nw_dst`分配匹配IP头中的源IP地址和目的IP地址。其中**netmask**可以是`255.255.255.0`这样的(dotted quad)形式，也可以是数字 `24` 这样的(CIDR)形式

当使用了 `dl_type=0x0806` 或者关键字 `arp` 时，`nw_src` 匹配 ARP 头中的 **ar_spa**(Sender Protocol Address)字段。`nw_dst` 匹配ARP头中的 **ar_tpa**(Target Protocol Address)字段

当使用了 `dl_type=0x8035` 或者关键字 `rarp` 时，`nw_src`匹配 RARP 头中的 **ar_spa**(Sender Protocol Address)字段。`nw_dst`匹配RARP头中的 **ar_tpa**(Target Protocol Address)字段

当 `dl_type` 使用了通配符或者除了`0x0800`, `0x0806`, `0x8035`以外的值，则`nw_src`, `nw_dst`的值会被忽略

### nw_proto or ip_proto

```
nw_proto=<proto>
ip_proto=<proto>
```

 * 当`dl_type=0x0800`或使用了关键字`ip`时，匹配IP头中的proto字段，取值区间[0, 255]，比如为1时可以匹配ICMP数据包，为6时匹配TCP数据包。
 * 当`dl_type=0x86dd`或使用了关键字`ipv6`是，匹配IPv6头中的proto字段，取值区间[0, 255]，比如为58时匹配ICMPv6数据包，为6时匹配TCP数据包
 * 当`dl_type=0x0806`或者使用了关键字`arp`时，匹配ARP opcode的低8位，ARP opcode大于255时，与等于0效果一样
 * 当`dl_type=0x8035`或者使用了关键字`rarp`时，匹配ARP opcode的低8位， ARP opcode大于255时，与等于0效果一样
 * 当`dl_type`使用了通配符或这除了`0x0800`, `0x0806`, `0x8035`以外的值，则`nw_proto`的值会被忽略

### nw_tos

```
nw_tos=<tos>
```

匹配IP ToS字段或IPv6的traffic class字段取值为`<toc>`的数据包。取值区间[0, 255]，需要注意的是最低2位会被忽略。当`dl_type`使用除0x800(IP)和0x86dd(IPv6)以为的数值时，该字段被忽略。

### ip_dscp

```
ip_dscp=<dscp>
```

匹配IP DSCP字段或IPv6的traffic class字段取值为`<dscp>`的数据包。IP ToS字段的高6位为DSCP比特位。取值区间[0, 63]，需要注意的是最低2位会被忽略。当`dl_type`使用除0x800(IP)和0x86dd(IPv6)以为的数值时，该字段被忽略。

### nw_ecn or ip_ecn

```
nw_ecn=<ecn>
ip_ecn=<ecn>
```

匹配IP ToS字段或IPv6的traffic class字段中ecn比特位为`<ecn>`的数据包。IP ToS字段的低2位为ECN比特位。取值区间[0, 3]。当`dl_type`使用除0x800(IP)和0x86dd(IPv6)以为的数值时，该字段被忽略。

### nw_ttl

```
nw_ttl=<ttl>
```

匹配IP和IPv6的TTL字段为<ttl>的数据包。取值区间[0, 255]。当`dl_type`使用除0x800(IP)和0x86dd(IPv6)以为的数值时，该字段被忽略。

### tcp / udp / sctp port

```
tcp_src=<port>
tcp_dst=<port>
udp_src=<port>
udp_dst=<port>
sctp_src=<port>
sctp_dst=<port>
```

匹配TCP, UDP, SCTP 源或目的端口为`<port>`的数据包。取值区间[0, 65535]。当`dl_type`以及`nw_proto`使用了通配符或者设置了不合理的值，该字段被忽略。


```
tcp_src=<port/mask>
tcp_dst=<port/mask>
udp_src=<port/mask>
udp_dst=<port/mask>
sctp_src=<port/mask>
sctp_dst=<port/mask>
```

按位匹配TCP, UDP, SCTP源或目的端口。

### tcp flags

```
tcp_flags=<flags>/<mask>
tcp_flags=[+<flag>...][-<flag...>]
```

按位匹配TCP flags。其中<flags>和<mask>都是16bit数字，可以使十进制的形式或者是以"0x"开头的十六进制形式。<mask>中为1的bit，要求<flags>中对应bit必须匹配。<mask>中为0的bit，<flags>中的对应bit在进行匹配时会忽略。

除了按位匹配TCP flags外，也可以flag的名称（见下）来进行描述匹配规则。每个flag名称前面的"+"表示匹配设置了该flag的数据包，而"-"表示匹配未设置该flag的数据包。规则中未提及的flag在匹配时忽略。比如 `tcp,tcp_flags=+syn-ack` 表示匹配SYN但非ACK的TCP数据包。

目前TCP协议中定义了9个flag位，3个额外的保留位（必须设置成0）。这些 flag 从 LSB（最低有效位）开始的排序如下：

 - `0`: `fin` 表示发送方没有数据要传输了，要去释放连接
 - `1`: `syn` 同步序列数
 - `2`: `rst` 重置连接
 - `3`: `psh` Push功能，指示接收方应该加快将这个报文段交给应用层而不用等待缓冲区装满
 - `4`: `ack` ACK
 - `5`: `urg` 表示高优先级数据包
 - `6`: `ece` ECN Echo
 - `7`: `cwr` Congestion Windows Reduced
 - `8`: `ns` Nonce Sum
 - `9-11`: 保留位
 - `12-15`: 不可用于匹配，必须设为0

### icmp_type & icmp_code

```
icmp_type=<type>
icmp_code=<code>
```

当 `dl_type` 和 `nw_proto` 确定数据包为 ICMP 或 ICMPv6 时，匹配 ICMP type 和 code。取值区间都为[0, 255]。如果 `dl_type` 和 `mw_proto` 使用了其他值时，该字段忽略。

### 协议关键字

协议关键字相当于是个*alias*，对应如下：

```text
ip     =  dl_type=0x0800
ipv6   =  dl_type=0x86dd
icmp   =  dl_type=0x0800,nw_proto=1
icmp6  =  dl_type=0x86dd,nw_proto=58
tcp    =  dl_type=0x0800,nw_proto=6
tcp6   =  dl_type=0x86dd,nw_proto=6
udp    =  dl_type=0x0800,nw_proto=17
udp6   =  dl_type=0x86dd,nw_proto=17
sctp   =  dl_type=0x0800,nw_proto=132
sctp6  =  dl_type=0x86dd,nw_proto=132
arp    =  dl_type=0x0806
rarp   =  dl_type=0x8035
mpls   =  dl_type=0x8847
mplsm  =  dl_type=0x8848
```

### cookie

```
cookie=<value>
```

cookie 字段可以用于
命令`add-flow`， `add-flows`和 `mod-flows`中可以使用该字段，用于给 flow 设置识别信息。

```
cookie=<value/mask>
```

### actions

ovs-ofctl的 `add-flow`, `add-flows` 以及 `mod-flows` 命令都需要 **actions** 字段，描述对匹配的数据包执行的动作

在上述的三条命令中，actions字段是flow的一部分，actions字段中**可以有多个 action**，它们之间用逗号隔开，一个flow的完整语法如下:

```
<field>=<value>,[<field>=<value>]...,actions=<action>[,<action>...]
```

可使用的**action**非常多。如下：

#### output

```
output:<port>
```

将数据包输出到OpenFlow port `<port>`

#### group

```
group:<group_id>
```

将数据包输出到OpenFlow group `<group_id>`

#### normal

```
normal
```

按照设备的常规L2/L3处理流程来处理数据包。这通常是OVS默认flow中的action。要注意的是，并不是所有的OpenFlow switch都支持这个action。

#### flood

```
flood
```

将数据包输出到所有物理端口，除了该数据包的输入口以及不可被flooding的端口。

#### all

```
all
```

将数据包输出到所有物理端口，除了该数据包的输入口。

#### local

```
local
```

将数据包输出到local port（与bridge同名的端口）

#### in_port

```
in_port
```

将数据包输出到其输入口

#### controller

```
controller(<key>=<value>...)
```

将数据包以"packet in"消息的形式发送到OpenFlow控制器。其中`<key>=<value>`键值对可以是：

 * `max_len=<nbytes>` 只将数据包的<nbytes>个字节发送到控制器。默认发送这个数据包。
 * `reson=<reason>` 指明"pakcet in"消息中的reason字段。默认reason为`action`，还可以是`no_match`, `invalid_ttl`。
 * `id=<controller-id>`  指明控制器id，16位整数。表示要发送给那个控制器。默认使用的id是0.

```
controller
controller[:nbytes]
```

分别是`controller()`和`controller(max_len=<nbytes>)`的简略写法。

#### enqueue

```
enqueue(<port>,<queue>)
```

将数据包放到端口<port>的队列<queue>中。其中<port>必须是OpenFlow端口号或关键字(如"LOCAL")。不同交换机支持的队列数不同，有些OpenFlow实现根本不支持队列。

#### drop

```
drop
```

丢掉该数据包。

#### vlan

```
mod_vlan_vid:<vlan_vid>
```

修改数据包的VLAN id为<vlan_vid>。如果数据包没有VLAN tag则添加VLAN id为<vlan_vid>的VLAN tag。如果数据包VLAN id已经为<vlan_vid>，则将其VLAN 优先级priority设为0.

```
mod_vlan_pcp:<vlan_pcp>
```

修改数据包的VLAN 优先级priority为<vlan_pcp>。如果数据包没有VLAN tag则添加VLAN priority为<vlan_pcp>的VLAN tag。合法值区间为[0, 7]，数字越大优先级越高。如果数据包VLAN priority已经为<vlan_pcp>，则将其VLAN id设为0.

```
strip_vlan
```

如果数据包有VLAN tag，则剥去VLAN tag。

```
push_vlan:<ethertype>
```

给数据包添加新的VLAN tag。VLAN tag中ethertype设置为<ethertype>。目前<ethertype>只能是0x8100。新Tag的priority为0，vid为0.

#### mpls

```
push_mpls:<ethertype>
```

将数据包的Ethertype改成`<ethertype>`，只能是`0x8847`或者`0x8848`，同时添加MPLS LSE。


```
pop_mpls:<ethertype>
```

#### datalink header mod

剥去数据包**最外层**的一个MPLS lable stack。目前的实现中`<ethertype>`只能是non-MPLS Ethertype，所以`pop_mpls`只能用于只有一层MPLS lable stack的数据包。

```
mod_dl_src:<mac>
mod_dl_dst:<mac>
```

将数据包的源或目的MAC地址设置成<mac>

#### network header mod

```
mod_nw_src:<ip>
mod_nw_dst:<ip>
```

将数据包的源或目的IP地址设置成<ip>

```
mod_nw_tos:<tos>
```

设置IPv4头ToS/DSCP或IPv6头traffic class field中DSCP比特位设置成<tos>，数值必须是4的倍数，且在[0, 255]区间。这个action并不会修改ToS中的低2位(2 LSB)。

```
mod_nw_ecn:<ecn>
```

设置IPv4头ToS或IPv6头traffic class field中ECN比特位为`<ecn>`，数值区间为[0, 3]。这个action并不会修改高6位(6 MSB)。

需要OpenFLow 1.1以上。

```
mod_nw_ttl:<ttl>
```

修改IPv4 TTL或IPv6 hop limit为<ttl>，取值区间为[0, 255]。

需要OpenFlow 1.1以上。

#### transport header mod

```
mod_tp_src:<port>
mod_tp_dst:<port>
```

将数据包的TCP/UDP/SCTP源或目的端口设置成<port>

### Examples

#### VLAN相关

```sh
# 添加VLAN tag
ovs-ofctl add-flow br0 in_port=1,actions=mod_vlan_vid:10,output:2

# 剥去VLAN tag
ovs-ofctl add-flow br0 in_port=2,dl_vlan=100,actions=strip_vlan,output:1
```

#### 使用cookie

```sh
# add a flow
ovs-ofctl add-flow br0 cookie=0xf,tcp,tcp_dst=22,actions=mod_nw_tos:128,normal

# To delte this flow
ovs-ofctl del-flows br0 cookie=0xf/-1,tcp,tcp_dst=22
# Or simply
ovs-ofctl del-flows br0 cookie=0xf/-1

# trace a flow
ovs-appctl ofproto/trace br0 tcp,tcp_dst=22
```

---

## Contributors

[haishanh][haishanh]

[haishanh]: http://hanhaishan.com