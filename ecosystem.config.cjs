module.exports = {
  apps: [
    {
      name: 'prospector-v14',
      script: 'npx',
      args: 'vite --host 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        API_KEY: 'AIzaSyAV6hkIy11i8y5bYHfScBUTJYHbmuiRs4g',
        KIE_KEY: '302d700cb3e9e3dcc2ad9d94d5059279',
        KIE_API_KEY: '302d700cb3e9e3dcc2ad9d94d5059279'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
