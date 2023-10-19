FROM node:16
# 安装Python 2和pip
RUN apt-get update && apt-get install -y python

# 安装pip
RUN curl https://bootstrap.pypa.io/pip/2.7/get-pip.py -o get-pip.py
RUN python2 get-pip.py

# 安装requests和BeautifulSoup
RUN pip2 install requests beautifulsoup4

WORKDIR /app

COPY package.json .
COPY . .

RUN npm install
# RUN npm run build

EXPOSE 8080

CMD ["node", "index.js"]
