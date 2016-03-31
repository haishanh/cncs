---
title: Open vSwitch ovs-vsctl Command Sheatsheet
date: 2016-01-15
updated: 2016-03-01
---
## Introduction

Open vSwitch中有多个命令，分别有不同的作用，大致如下：

 * `ovs-vsctl`用于控制ovs db
 * `ovs-ofctl`用于管理OpenFlow switch 的 flow
 * `ovs-dpctl`用于管理ovs的datapath
 * `ovs-appctl`用于查询和管理ovs daemon

本文主要介绍`ovs-vsctl`。以下命令查询主机上已有的 OVS bridge，以及其中的 port。

```sh
ovs-vsctl show
```

例子

```sh
$ ovs-vsctl show
fc562da8-fb36-4d62-8b47-5502e72069dc
    Bridge br-vxlan
        Port "vxlan0"
            Interface "vxlan0"
                type: vxlan
                options: {remote_ip="10.10.10.1"}
        Port br-vxlan
            Interface br-vxlan
                type: internal
        Port "veth2"
            Interface "veth2"
    ovs_version: "2.5.0"
```

## Bridge 相关命令

### 创建 bridge

创建bridge(或switch，以下统称为bridge) `br0`

> 使用选项`--may-exist`后，若欲创建的bridge已存在，该命令什么也不做，也不报错。

```sh
ovs-vsctl [--may-exist] add-br br0
```

### 删除bridge

删除 bridge `br0`

> 使用选项`--if-exists`后，若欲删除的bridge不存在，该命令什么也不做，也不报错。

```sh
ovs-vsctl [--if-exists] del-br br0
```

### 查询已有的 bridge


```sh
ovs-vsctl list-br
```

## 端口相关命令

### 添加端口

添加端口(物理端口或vNIC)eth1到bridge eth1中

```sh
ovs-vsctl [--may-exist] add-port br0 eth1
```

### 创建 bond

在br0上创建一个bond了eth0,eth1和eth2的bond端口bond0

```sh
# ovs-vsctl add-bond <bridge> <port> <iface...>
ovs-vsctl add-bond br0 bond0 eth0 eth1 eth2
```

### 移除端口

从br0上移除端口eth1

```sh
ovs-vsctl [--if-exists] del-port br0 eth1
```

### 列出端口

列出br0上的端口（不包括internal port）

```sh
ovs-vsctl list-ports br0
```

### 查看端口详细数据

列出OVS中端口eth1的详细数据

```sh
$ ovs-vsctl list interface eth1
```

## OpenFlow 控制器相关

### 添加控制器

```sh
# ovs-vsctl set-controller <bridge> <target...>
ovs-vsctl set-controller br0 tcp:1.2.3.4:6633

# 设置多个controller
ovs-vsctl set-controller br0 tcp:1.2.3.4:6633 tcp:4.3.2.1:6633

# 添加使用unix socket通信的controller
ovs-vsctl set-controller br0 unix:/var/run/xx/xx.sock
```

### 移除控制器

```sh
ovs-vsctl del-controller br0
```

### 查询 brige 上已配置的控制器

```sh
ovs-vsctl get-controller br0
```

## VLAN 相关

### 配置端口为Access口

设置br0中的端口eth0为VLAN 10的access口

```sh
ovs-vsctl set port eth0 tag=10
```

添加eth1到指定bridge br0中，同时将其配置成指定VLAN 10的access端口

```sh
ovs-svctl add-port br0 eth1 tag=10
```

### 配置端口为Trunk口

在br0上添加port eth1为VLAN 9,10,11的trunk

```sh
ovs-vsctl add-port br0 eth1 trunk=9,10,11
```

## VXLAN 相关

在bridge ovs0中添加远端IP为10.10.10.1的VXLAN endpoint端口vxlan0

```sh
# key=100表示设置vni为100，不设置默认为0
ovs-vsctl add-port ovs0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=10.10.10.1 options:key=100

# 不设key值，vni默认为0
ovs-vsctl add-port ovs0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=10.10.10.1

# key=flow的话，表示该port的vni可以通过openflow的actions来进行设置
# 如： actions=set_field:100->tun_id
# 或： actions=set_tunnel:100
ovs-vsctl add-port ovs0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=10.10.10.1 options:key=flow
```

## 其他

### Atomic operation

一条命令创建bridge br0的，并添加eth0到br0中

```sh
ovs-vsctl add-br br0 -- add-port br0 eth0
```

### 创建 internal port

OVS **internal port** 可以配置IP地址，普通 port 上配置的IP地址是不起作用的。在 br0 上创建一个internal port `in0`:

```sh
ovs-vsctl add-br br0 in0 -- set interface in0 type=internal
ip addr add 10.10.10.10/24 dev in0

# 创建internal port的同时将其设置为VLAN 10的access port
ovs-vsctl add-br br0 in1 tag=10 -- set interface in1 type=internal
ip addr add 20.20.20.20/24 dev in1
```

### 设置 OpenFlow port id

```sh
# 将已在ovs中的端口veth1的OpenFlow端口设置成100
ovs-vsctl set interface veth1 ofport_request=100

# 将端口veth1添加到bridge br0中，并将veth1的OpenFlow端口设置成200
ovs-vsctl add-port br0 veth1 -- set interface veth1 ofport_request=200
```

{% admonition note Note %}
OpenFlow的端口 id 在设置 flow 的匹配字段 in_port 以及 actions 字段的 output 中都会用到。
可以通过命令ovs-ofctl show br0来查看 br0 中各端口的 OpenFlow 端口 id，该 id 并不求是按顺序的。
{% endadmonition %}

### 设置OpenFlow版本

```sh
ovs-vsctl set bridge br0 protocols=OpenFlow10,OpenFlow12,OpenFlow13
```

---

## Contributors

[haishanh][haishanh]

[haishanh]: http://hanhaishan.com