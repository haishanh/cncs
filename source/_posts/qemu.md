---
title: QEMU Cheatsheet
date: 2016-06-10
updated: 2016-06-10
author:
  - haishanh
banner:
  image: /assets/qemu.svg
  size: 400px 170px
  position: center
  color: '#1B78E3'
  height: 252px
---

QEMU 是一个开源的虚拟化软件。更准确的说：

> QEMU is a generic and open source machine emulator and virtualizer.

QEMU可以作为单独的virtualizer使用，就是说只需要QEMU本身就可以运行虚拟机(VM)。 但QEMU也可以使用其他的 hypervisor，比如使用 Xen 和 KVM 来达到更高效更快速的基于硬件的虚拟化。

原始的QEMU软件中，对不同架构的VM需要使用不同的qemu可执行文件。



```text
$ qemu-system-
qemu-system-aarch64       qemu-system-mips64        qemu-system-sh4eb
qemu-system-alpha         qemu-system-mips64el      qemu-system-sparc
qemu-system-arm           qemu-system-mipsel        qemu-system-sparc64
qemu-system-cris          qemu-system-moxie         qemu-system-tricore
qemu-system-i386          qemu-system-or32          qemu-system-unicore32
qemu-system-lm32          qemu-system-ppc           qemu-system-x86_64
qemu-system-m68k          qemu-system-ppc64         qemu-system-xtensa
qemu-system-microblaze    qemu-system-ppcemb        qemu-system-xtensaeb
qemu-system-microblazeel  qemu-system-s390x
qemu-system-mips          qemu-system-sh4
```

比如如果你运行的是一个arm的VM，你需要使用`qemu-system-arm`，如果是运行64位x86的VM，需要使用`qemu-system-x86_64`。如果想获得KVM的加速，VM guest本身的架构要和host主机的架构相同。本文例子中的命令都使用`qemu-system-x86_64`。

## Launch a VM

以下命令会运行一个 VM，image 为 `arch.qcow2`，该虚拟机会默认有一个 Intel e1000 的 nic (Network Interface Card, 网卡)

```sh
qemu-system-x86_64 arch.qcow2
```

{% admonition note %}
使用上面的命令，会打开 QEMU 的窗口作为 VM 的 console。所以当前的环境必须要支持图形化显示。

主机要装有X窗口(此处，可直接理解成图形化界面/桌面)。可以直接在主机桌面环境下运行这个命令，或在有 X 转发的远程终端软件中运行，或 VNC 中。

不需要 VM 的图像界面的话，推荐加上 `-nographic` 选项。

{% endadmonition %}

{% admonition note %}

推荐加上 `-enable-kvm` 选项，有了该选项 QEMU 会使用 `KVM` (Kernel-based Virtual Machine) 技术。 VM 的运行速度会有非常显著的提升。

{% endadmonition %}


所以推荐这样运行：

```sh
qemu-system-x86_64 -enable-kvm arch.qcow2
```

## 基本配置


运行 VM 的时候，可以指定其内存大小 和 CPU 类型和个数。

```sh
qemu-system-x86_64 \
-enable-kvm \
-nographic \
-m 4G \
-cpu SandyBridge \
-smp 4 \
arch.qcow2
```

以上命令中:

  * `-m 4G` 来指定 VM 的内存为4G。也可以使用 `M` 作单位。QEMU默认会将VM内存配置成128M。
  * `-cpu SandyBridge` 指定了 CPU model(CPU model，会决定 VM 的 CPU 所支持的 feature)。当然也可以是`-cpu Haswell`, `-cpu Haswell`等，完整可用列表可以通过运行 `qemu-system-x86_64 -cpu ?` 来查看。`-cpu host`，表示使用和主机一直的 CPU model。

  * `-smp 4`, 表示 VM 会有4个 CPU。对于 VM 来说，相当于有4个 CPU socket(插槽)，每个 CPU 会有1个单线程的 core。我们也可以自己指定 CPU layout， 比如 `-smp cores=4,threads=2,sockets=1` 可以指定 1个 CPU，该 CPU 有4个 core，每个 core 双线程，所以总共有 8 个逻辑 core。


## VNC访问

使用`-vnc`选项及相关参数，可以让我们通过VNC来访问VM。

用法：

```sh
qemu-system-x86_64 [...] \
-vnc display[,option[,option[,...]]]
```

其中`display`不是字面值，通常使用`host:d`的格式，`host`是listen的IP地址，通常省略，表示localhost。`d`是指VNC display id。

比如：

```sh
qemu-system-x86_64 \
-enable-kvm \
-nographic \
-vnc :30
arch.qcow2
```

这样就可以在 host 主机上通过 VNC viewer 访问 `0:30` 来看到 VM 的运行窗口。

更实用的是，假设host主机有个IP 12.13.14.15，在主机外部的其他机器上可以通过VNC viewer 访问 `12.13.14.15:30` 来查看VM的运行窗口。通常选项`-vnc :d` 会使用host主机的TCP 5900+d 端口，上面的例子会使用5930 TCP 端口。所以host主机的防火墙需要开放对应TCP端口。


## Networking

### 定义Nic

使用选项 `-net nic`，可以给VM定义一个nic。语法是：

```sh
qemu-system-x86_64 [...] \
-net nic[,vlan=n][,macaddr=mac][,model=type] [,name=name][,addr=addr][,vectors=v]
```

比如下面的命令，给VM定义了2个 nic，第1个nic的VLAN为0(默认)，model为e1000(默认)。第2个nic的VLAN为10，model为virtio，MAC地址为`52:54:1b:aa:fc:d2`。

如果不使用任何`-net nic`(或其他Nic相关)参数，QEMU 也默认会给 VM 一个 VLAN 为0的 e1000 nic。完整可用的nic model列表可以通过命令`qemu-system-x86_64 -net nic,model=?`来查看。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic \
-net nic,vlan=10,model=virtio,macaddr=52:54:1b:aa:fc:d2 \
arch.qcow2
```

{% admonition note Tips %}

以上所说的nic的model，其实就是指nic所用的driver。在 VM 中使用`ethtool`来查看。比如`ethtool -i ens3`。通常将model设置成`virtio`来获得更好的性能。

{% endadmonition %}

{% admonition note Info %}

如果不指定MAC地址，则 QEMU 会自动给这个nic一个MAC地址，但问题是这个MAC地址是一个固定值。假设你在这台主机上运行了第2个VM，并且该VM有nic也没指定MAC地址，则这两个VM的相应nic会有相同的MAC地址。假设这两个VM的对应nic接入同一网络，则会出现冲突。所以一般会指定MAC地址。

VM nic的MAC地址必须是 `52:54` 开头。所以你可以试试下面的命令来随机生成一个有效的MAC地址。

<pre>
printf "52:54:%02x:%02x:%02x:%02x" \
$(( $RANDOM & 0xff)) $(( $RANDOM & 0xff )) \
$(( $RANDOM & 0xff)) $(( $RANDOM & 0xff ))
</pre>

{% endadmonition %}


{% admonition critical 注意 %}

前面的`-net nic`只是定义 nic，你从VM中可以看到这个nic。但这个nic没有接入任何网络。

{% endadmonition %}

### User-mode Networking

使用`-net user`选项，可以指定前面定义的 nic 使用用户网络(User-mode Networking)。用法：

```
qemu-system-x86_64 [...] \
-net nic[,...] \
-net user[,option][,option][,...]
```

使用User-mode networking时，QEMU会通过**QEMU内建**的DHCP server给相应的nic分配IP地址。IP地址段从10.0.2.15开始，在VM中可以通过IP 10.0.2.2访问DHCP server，也就是host主机。所以在VM中，可以通过`ssh`/`scp`连接10.0.2.2来登录或拷贝文件。

比如下面的命令运行的 VM 中会有一个 nic，该 nic model为e1000，VLAN为0，使用**User-mode networking**。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic,macaddr=52:54:1b:aa:fc:d2 \
-net user \
arch.qcow2
```

如果不使用任何nic相关选项时，QEMU 默认会给 VM 一个VLAN为0，model为e1000，使用User-mode networking的nic。所以，以下两个命令作用相同。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic \
-net user \
arch.qcow2

qemu-system-x86_64 \
-enable-kvm \
arch.qcow2
```

假设VM的user-mode networking nic获得的IP地址是10.0.2.15，VM可以通过连接10.0.2.2来访问host主机。但host主机**并不能**通过10.0.2.15来访问该VM。如果需要从host主机访问VM，可以使用user-mode networking的端口转发功能。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic \
-net user,hostfwd=tcp::2222-:22 \
arch.qcow2
```

然后我们就可以通过`ssh`或`scp`连接主机的2222端口来访问这个VM。

```sh
# 登录VM
ssh -p 2222 0
# 或者
ssh -p 2222 0.0.0.0
# 或者
ssh -p 2222 localhost
# 使用用户xiaoming登录VM
ssh -p 2222 xiaoming@0

# 拷贝文件至VM
scp -P 2222 hello.c 0:~
```


### Tap Networking

选项`-net tap`，可以让之前定义的nic使用tap networking。Tap networking能让我们更自由地组建虚拟化网络，而且起性能比user-mode networking好很多。

用法：
```
qemu-system-x86_64 [...] \
-net nic[,...] \
-net tap[,vlan=n][,name=name][,fd=h][,ifname=name][,script=file][,downscript=dfile][,helper=helper]
```

下面的例子运行的VM中会有一个nic，该nic会使用tap networking。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic \
-net tap,script=no \
arch.qcow2
```

该VM运行之后，在host主机上会多出来一个nic，默认名字格式是`tapX`，其中X可以是0, 1, 2...。

发送到host主机tap网卡的数据，会被发送到VM中的对应nic；VM中对应nic上的发送的数据也会被发送到host主机的对应tap网卡上。

假设上面的VM运行之后，该VM中的nic名字叫eth0，主机上生成的nic名字叫tap0。你可以想象是有根网线将VM的eth0和host主机的tap0连接在了一起。

`-net tap`选项中:

  * `script=file`用来指定该VM起来时，要运行的脚本。通常这样的脚本用来对该tap网卡进行一些配置，比如设置IP地址，或者添加到某bridge中。`script=no`表示不使用任何脚本。如果不指明，QEMU默认会使用脚本`/etc/qemu-ifup`，如果host主机上没有这个脚本，会报错。
  * `downscript=dfile`用来指定VM被shutdown时，要运行的脚本。
  * `ifname=name`可以指定这个tap网卡的名字，比如`ifname=intf0`，就可以将其名字设成`intf0`。默认名字格式是`tapX`。

上面`-net tap`的用法中没有提到的是，我们可以通过`vhost=on`来启用vhost从而获得**更好的性能**，通常与`-net nic,model=virtio`一起使用。比如：

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic,model=virtio \
-net tap,script=no,downscript=no,vhost=on \
arch.qcow2
```

### Bridged Networking

其实自己创建一个bridge，然后把host主机上的tap网卡添加进去就可以了。

但我们也可以使用`-net bridge`选项，qemu-bridge-helper 会自动帮我们把tap网卡添加到相应的bridge中。用法：

```sh
qemu-system-x86_64 [...] \
-net nic[,...] \
-net bridge[,vlan=n][,name=name][,br=bridge][,helper=helper]
```

比如下面的例子，会自动将tap网卡添加到bridge `qemubr0`中。

```sh
qemu-system-x86_64 \
-enable-kvm \
-net nic,model=virtio \
-net bridge,br=qemubr0 \
arch.qcow2
```

在使用qemu-bridge-helper 之前我们必须要设定好`/etc/qemu/bridge.conf`，该文件用来描述允许QEMU使用的bridge。

比如，内容可以如下：

```
allow br0
allow qemubr0
```

helper工具的路径，也可以通过`helper=helper`来指定，默认为 `/usr/lib/qemu/qemu-bridge/helper`。

{% admonition note %}

上述qemu-brige-helper 和 bridge.conf 具体目录会因发行版(或自编译)安装目录的不同而不同。

{% endadmonition %}


## Using Devices

QEMU VM中使用设备的语法为：

```sh
qemu [...] \
-drive if=none,id=drive0,format=raw \
-device virtio-blk-pci,drive=drive0,scsi=off ...
```

使用命令`qemu-system-x86_64 -device ?`来查看支持的 device driver 列表。要查看可以该 driver 可以使用的属性，使用命令 `qemu-system-x86_64 -device driver,?`，比如`qemu-system-x86_64 -devce virtio-blk-pci,?`。

### Storage Device

比如使用4个image文件作为存储设备，可以使用下面的命令：

```sh
qemu-system-x86_64 -enable-kvm \
-drive file=/images/image1.raw,index=0,media=disk \
-drive file=/images/image2.raw,index=1,media=disk \
-drive file=/images/image3.raw,index=2,media=disk \
-drive file=/images/image4.raw,index=3,media=disk
```

但通常我们会使用QEMU提供的shortcut，比如上面的命令可以这样：

```sh
qemu-system-x86_64 -enable-kvm \
-hda /images/imagei1.raw \
-hdb /images/image2.raw \
-hdc /images/image3.raw \
-hdd /images/image4.raw
```

### Others

其他诸如USB设备，显示设备，声音设备等，请参考[QEMU Emulator User Documentation][qemu-doc]。


## Refs

  * [QEMU Emulator User Documentation][qemu-doc]
  * [QEMU entry of archlinux wiki][qemu-arch-wiki]
  * [SUSE QEMU documentation][qemu-suse]

[qemu-doc]: http://wiki.qemu.org/download/qemu-doc.html
[qemu-arch-wiki]: https://wiki.archlinux.org/index.php/QEMU
[qemu-suse]: https://www.suse.com/documentation/sles11/book_kvm/data/cha_qemu_running.html
