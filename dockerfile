FROM node:18
# 时区指定为中国上海，否则python日期相关会出现错乱
ENV TZ "Asia/Shanghai"
# 替换为国内源
RUN rm -f /etc/apt/sources.list.d/debian.sources && \
    echo "deb https://mirrors.ustc.edu.cn/debian bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb https://mirrors.ustc.edu.cn/debian bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.ustc.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list
#指定工作目录
RUN apt-get update
RUN apt-get install -y openssh-server zsh curl vim ffmpeg && apt-get clean
# 安装python环境
WORKDIR /workspace
# 启动SSH服务
RUN mkdir /var/run/sshd
RUN echo 'root:root' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
CMD ["/usr/sbin/sshd", "-D"]

