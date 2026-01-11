module.exports = {
  apps: [
    {
      name: 'prospector-v14',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};
