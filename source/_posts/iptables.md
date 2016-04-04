---
title: iptables
date: 2016-02-01
updated: 2016-04-01
---

{% admonition critical 本文还未完成 %}
编写中...
{% endadmonition %}

## Introduction

**iptabels** is a userspace application used to configure the firewall(netfilter) in Linux kernel.

**iptables** 是一个用来配置 Linux kernel 中 firewall(netfilter) 的一个工具。

## 基本语法

```text
iptables [-t table] command [match] [target/jump]
```

`[match] [target/jump]`在一起构成一条规则`rule`

### table

`-t` 选项可以指定当前命令作用的 `table`。

其中`table`可以是：

 * `nat`
 * `mangle`
 * `filter`
 * `raw`

**注意**：如果不使用`-t`选项，则默认是`filter` table，相当于`-t filter`。


 `nat` table，主要用于NAT(Natwork Address Translation)。对于一个stream，只有其中的第一个包才会从经过一次这个 table，该 stream 中后续的数据包会自动使用第一个数据包的规则，不会再经过这个 table。比如你 ping 一个主机10个数据包，查看 iptables 的时候，你只能看到第一个数据包匹配了这个规则。所以我们不应该在这个 table 中设置过滤(filtering)相关的规则。

 `mangle` table，主要用于修改(mangling)数据包。我们可以修改包头(header)和负载(payload)。比如说修改TTL, TOS等。

 `filter` table，用于对过滤数据包。比如可以`DROP`, `LOG`, `ACCEPT` 或者 `REJECT` 特定类型的数据。

 `raw` table 比较特殊。`netfilter` 以及其中的 chains 会在其他任何 table 之前被应用。它主要用于`NOTRACK` *target*。

### Command

有以下 command， 要注意如果不指定 table，则默认作用于 table `filter`。

 * `-A / --append`

```sh
iptables -A INPUT ...
```

用于在一条 chain 后面追加一个 rule。

 * `-D / --delete`

```sh
iptables -D INPUT --dport 80 -j DROP
iptables -D INPUT 1
```

用于删除指定 chain 中的指定 rule。删除的时候，可以写出待删除 rule 的完整 rule 语法来删除，也可以通过指定 chain 中 rule 的序号来删除。

 * `-R / --replace`

```sh
iptables -R INPUT 1 -s 192.168.0.1 -j DROP
```

用于替换指定 chain 中的指定 rule。

 * `-I / --insert`

```sh
iptables -I INPUT 2 --dport 80 -j ACCEPT
iptables -I INPUT --dport 80 -j ACCEPT
```

用于在指定 chain 中插入一条 rule。可以通过指定rule序号来选择插入位置，新 rule 会插入到指定序号的 rule 之前，其实新 rule 插入后，其序号也就是命令中指定的那个序号。比如上面第一个例子中，会把这条 rule 变成`INPUT` chain 的第2条 rule，其后续的 rule 的序号会顺延。如果该命令不指定序号，则插入到该 chain 的最前面。

 * `-L / --list`

```sh
iptables -L INPUT
```

用于列出指定 chain 中的rule条目。如果不指定 chain 则定出指定 table 中的所有 chain 的所有 rule。

 * `-F / --flush`

```sh
iptables -F INPUT
```

用于清空指定 chain 中的所有 rule。

 * `-Z / --zero`

```sh
iptables -Z INPUT
```

用于将指定 china 中的 counter 全部清0.


 * `-N / --new-chain`

```sh
iptables -N allowed
```

用于创建一个新的 chain。上面的例子中创建了一个名字叫 *allowed* 的 chain。

 * `-X / --delete-chain`

```sh
iptables -X allowed
```

用于删除一个 chain。

 * `-P / --policy`

```sh
iptables -P INPUT DROP
```

用于设置指定 chain 的默认 policy。 对于不匹配一个 chain 中所有规则的数据包，则会使用默认 policy。目前可以是`DROP`和`ACCEPT`。


 * `-E / --rename-chain`

```sh
iptables -E allowed disallowed
```

用于重命名一个 chain。


### Options

`-v / --verbose`

显示详细。通常和`-L`一起使用，可以显示每条 rule 匹配的包数目，字节数等。

`-x / --exact`

与`-L`一起使用，用于将带有`K`, `M` 或者 `G` 的数展开。

`-n / --numeric`

与`-L`一起使用。使用该选项后，IP 地址和端口号会打印出数字值，而不是主机名，端口应用名等。


## 匹配规则

### 通用匹配 Generic Match

 * `-p / --protocol`

匹配指定协议，其参数可以是`tcp`, `udp`, `icmp`. 另外，可以是用`!`符号作反向方向操作，比如`-p ! tcp`表示匹配不是 TCP 的数据包。

 * `-s / --src / --source` && `-d / --dst / --destination`

```
-s 192.168.1.2
-s 192.168.1.0/24
-s 192.168.1.0/255.255.255.0
-s ! 192.168.1.0/24
```

匹配源/目的 IP 地址。 可以使用子网掩码来指定网段。 可以使用`!`。

{% admonition note Note %}
iptables 中很多匹配选项中可以使用"!"符号来作反向作用。比如 `-s ! 192.168.1.0/24` 匹配不是从 192.168.1.0/24 网段来源的数据包。
{% endadmonition %}

 * `-i / --in-interface` && `-o / --out-interface`

```
-i eth4
-i eth4+   # 匹配以eth4开头的端口，比如eth4.1
-i eth+    # 匹配所有的eth设备
-i ! eth0
```

匹配使用指定端口进行接收(`-i`) 和发送(`-o`) 的数据包。 注意， `-i`匹配只能在`INPUT` `FORWARD` 和 `PREROUTING` chains 中使用，`-o`匹配只能在 `OUTPUT` `FORWARD` 和 `POSTROUTING` chains中使用, 它们在其他 chain 中使用会报错。在指定端口的字符串中可以附加`+`符号，来匹配任意字母和数字，见例子。可以使用`!`。


 * `-f / --fragment`

用于匹配分片数据包中第二，第三片。不带参数。有这个匹配的原因，就是因为对于分片数据包没办法去识别源和目的IP地址，或是不是ICMP等数据包。该选项也可以使用`!`，但需要注意的是`!`要放在选项之前，也就是`! -f`。表示匹配分片数据包的第一个数据包，或者所有没有被分片的数据包。
 ---> to here


```sh
-p, --protocol
tcp, udp, icmp

-s, --src, --source
192.168.1.1

-d, --dst, --destination
192.168.1.1

-i, --in-interface
eth1, eth4+

-o, --out-interface
eth1, eth4+
```

### 隐式匹配 Implicit Match

#### TCP 匹配

以下匹配用于匹配TCP数据包中的字段，所以在各选项之前要先使用`-p tcp`。

 * `--sport / --source-port`

```
iptables -A INPUT -p tcp --sport 22
iptables -A INPUT -p tcp --sport ssh
iptables -A INPUT -p tcp --sport 22:80
iptables -A INPUT -p tcp --sport ! 22
iptables -A INPUT -p tcp --sport ! 22:80
```

用于基于源端口匹配数据包。可以使用数字形式，也可以使用服务名。如果使用服务名的话，服务名和端口号的映射必须已经存在于文件`/etc/services`中。参数也可以使用一个范围，比如`--sport 22:80`，表示匹配所有源端口在22和80之间的数据包。如果省略了第一个端口号，如`--sport :80`，则默认第一个端口号为0。如果省略了第二个端口号，如`--sport 22:`，则默认第二个端口号为65535。该选项也可以使用`!`符号，比如`---source-port ! 22`表示匹配22端口之外的数据包，`--source-port ! 22-80`表示匹配源端口在22至80之外的数据包。

 * `--dport / --destination-port`

用于基于目的端口匹配数据包。用法和`--sport`一样。

 * `--tcp-flags`

```sh
iptables -p tcp --tcp-flags SYN,FIN,ACK SYN,ACK
iptables -p tcp --tcp-flags ! SYN,FIN,ACK SYN
```

用于匹配 TCP 数据包中的 flag 标志位。 该选型参数是2个list，第1个list是表示要作检查和比较的 TCP flag， 第2个list中包含置1的flag。 这2个list之间用空 格隔开， 2个list中的 flag  之间用英文逗号隔开，逗号前后无空格。可用的 flag有 `SYN`, `ACK`, `FIN`, `RST`, `URG`, `PSH`。除了这些常规 TCP flag 外，也可以使用 `ALL` 和 `NONE`。 `ALL`表示使用所有的 flag， `NONE`表示不使用任何 flag。所以`--tcp-flags ALL NONE`表示检查所有TCP flag标志位， 匹配没有设置任何表示位的数据包。该选项可以使用`!`符号，`--tcp-flags ! SYN,FIN,ACK SYN`表示匹配设置了 ACK 和 FIN， 但**没有**设置 SYN 的数据包。

 * `--syn`

```sh
iptables -p tcp --syn
iptables -p tcp ! --syn
```

该选项的存在是为了向后兼容。 使用该选项的效果于使用`--tcp-flags SYN,RST,ACK SYN`一致， 即匹配设置了 SYN，但没有设置 ACK 和 RST 的 TCP 数据包。

 * `--tcp-option`

```sh
iptables -p tcp --tcp-option 16
```

基于TCP 选项进行匹配。十进制。可以使用`!`，表示匹配除了除了给定选项外的其他所有选项。

#### UDP 匹配

 * `--sport / --source-port` 和 `--dport / --destination-port`

```sh
iptables -A INPUT -p udp --sport 53
iptables -A INPUT -p udp --dport 53
```

使用方法于 TCP 中的同名选项一致。


#### ICMP 匹配

 * `--icmp-type`

```sh
iptables -A INPUT -p icmp --icmp-type 8
iptables -A INPUT -p icmp --icmp-type ！ 8
iptables -A INPUT -p icmp --icmp-type echo-reply
```

用于 ICMP 数据包头的 ICMP 类型进行匹配。 可以使用数字或字符名称。也可以使用`!`符号。具体可使用的icmp type列表可以运行`iptables -p icmp --help`来查看。

#### SCTP 匹配

 * `--sport / --source-port` 和 `-dport / --destination-port`

使用方法于 TCP UDP 中的同名选项一致。

 * `--chunk-type`

```sh
iptables -A INPUT -p sctp --chunk-types any INIT,INIT_ACK
```

用于匹配 SCTP 中的 chunk type。第一个参数可以是`all`, `any` 或 `none`，第二个参数中是逗号分隔的chunk type 名字。第一个参数是`all`即表示匹配第二个参数中的所有type，第一个参数是`any`表示匹配第二参数中的某一个或多个，第一个参数是`none`表示不匹配第二个参数中的所有type。

### 显式匹配 Explicit Match

#### addrtype

```sh
addrtype
-m addrtype –-src-type
-m addrtype –dst-type
UNICAST, BROADCAST, MULTICAST…
AH/ESP
-p 51 –m ah –-ahspi
-p 50 –m esp –-espspi
500 //Security Parameter Index
Comment
-m comment –-comment
“This is a comment”

DSCP
-m dscp –-dscp
32
-m dscp –dscp-class
  BE, EF…
ECN
-m ecn –-ecn-tcp-cwr
//match packets set bit:Congestion Window Received
TOS
-m tos –-tos
0x16
TTL
-m ttl –-ttl-eq
-m ttl –-ttl-gt
-m ttl --ttl-lt
64

Length
-m length –-length
1400:1500, 1500
Limit
-m limit –-limit
3/hour, 10/day
-m limit –-limit-burst
5
```

## Examples

```sh
iptables -I INPUT -s 172.24.220.56 -p icmp --icmp-type echo-request -j REJECT --reject-with icmp-host-prohibited
iptables –L INPUT –v
iptables –L INPUT –v --line-numbers
iptables -I INPUT -s 172.24.220.56 -p icmp --icmp-type echo-request -m limit --limit 6/minute --limit-burst 5 -j ACCEPT
iptables -R INPUT 2 -s 172.24.220.56 -p icmp --icmp-type echo-request -j REJECT --reject-with icmp-host-unreachable



iptables –t nat -A PREROUTING -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 8000
```