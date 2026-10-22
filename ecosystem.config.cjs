const os = require('node:os');

const cores = os.cpus().length;

module.exports = {
    apps: [
        {
            name: 'nestjs-api-starter',
            script: './dist/main.js',
            node_args: '--enable-source-maps',
            cwd: __dirname,
            exec_mode: 'cluster',
            instances: cores,
            max_memory_restart: '512M',
            watch: false,
            kill_timeout: 10000,
            env: {
                NODE_ENV: 'production',
                DATABASE_POOL_MAX: String(Math.max(2, Math.floor(180 / cores))),
            },
        },
    ],
};
