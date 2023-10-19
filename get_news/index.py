# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup
import re
import json

pattern = r'background-image:url\((.*?)\)'
# 目标网页的URL
url = 'https://news.baidu.com'  # 请替换为你要爬取的网页
url2 = 'https://news.sohu.com/'  # 请替换为你要爬取的网页

# 发起HTTP请求获取网页内容
response = requests.get(url)
response2 = requests.get(url2)
data = []
count = 0
# 检查请求是否成功
if response.status_code == 200:
    # 使用BeautifulSoup解析网页内容
    soup = BeautifulSoup(response.text, 'html.parser')
    baijiaElement = soup.find('div', {'id': 'baijia'})
    baijialinks = baijiaElement.find_all('a')
    for link in baijialinks:
        title = link.get('title')
        img = link.get('style')
        if title is not None and img is not None:
          decoded_title = title.encode('utf-8')
          item = {}  # 创建一个字典来存储数据
          item['title'] = decoded_title
          item['img'] = re.search(pattern, img).group(1)
          item['href'] = link.get('href')
          data.append(item)  # 将字典添加到列表
    count = count + 1
    if count == 2:
      with open('./data.json', 'w') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)
if response2.status_code == 200:
    # 使用BeautifulSoup解析网页内容
    soup = BeautifulSoup(response2.text, 'html.parser')
    sideItems = soup.find_all('div', {'class': 'side_item'})
    for sideItem in sideItems:
      sideItemTitle = sideItem.find('div', {'class': 'title'})
      sideItemImg = sideItem.find('img', {'class': 'item_img'})
      sideItemA = sideItem.find('a')
      if sideItemTitle is not None and sideItemImg is not None and sideItemA is not None:
        data.append({
          'title': sideItemTitle.text.encode('utf-8'),
          'img': 'https' + sideItemImg.get('src'),
          'href': 'https://www.sohu.com' + sideItemA.get('href')
        })  # 将字典添加到列表
    count = count + 1
    if count == 2:
      with open('./data.json', 'w') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)
else:
    # print(f'请求失败，状态码: {response.status_code}')
    print('请求失败，状态码: {}'.format(response.status_code))
