module.exports = {
    apps: [
        {
            name: 'moneyprinter',
            script: 'npm start',
            time: true,
            instances: 1,
            autorestart: true,
            max_restarts: 50,
            watch: false,
            max_memory_restart: '1G',
            env: {
                PORT: 3000,
                BOT_TOKEN: process.env.BOT_TOKEN
            },
        },
    ]
}