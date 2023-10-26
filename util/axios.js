const axios = require('axios');

// 创建一个自定义的 Axios 实例
const apiClient = axios.create({
  baseURL: 'https://aip.baidubce.com', // 设置基本的 API 地址
  timeout: 20000, // 请求超时时间（单位：毫秒）
  headers: {
    'Content-Type': 'application/json',
    // 你可以在这里添加其他请求头
  },
});

// 在此处可以添加拦截器、认证等其他自定义配置

module.exports = apiClient;
