module.exports = {
    apps: [
        {
            name: 'wmp-backend',
            script: 'server.js',
            cwd: __dirname,
            instances: 2,           // Use 2 instances for load balancing
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 4000,
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_file: './logs/backend-combined.log',
            time: true,
            max_memory_restart: '2G',
            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s',
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'uploads'],
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
