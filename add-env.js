const { exec } = require('child_process');

const envs = {
    'DATABASE_URL': 'postgresql://neondb_owner:npg_9Qceu3OHKXtk@ep-lively-cake-a1djdzuz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    'GEMINI_API_KEY': 'AIzaSyCGrULuKx_OnxrFLiLRiIHf6IIoilFAf7g',
    'AUTH_SECRET': '044dd6e9c26c09fe0b398ae2dee8538a27037c85d7e2c8366001d787c0813ee5',
    'NEXTAUTH_URL': 'https://receipt-tracker-livid.vercel.app',
    'AUTH_URL': 'https://receipt-tracker-livid.vercel.app'
};

function addEnv(key, value) {
    return new Promise((resolve, reject) => {
        const p = exec(`npx vercel env add ${key} production`);
        p.stdin.write(value);
        p.stdin.end();
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        p.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error('Vercel env add failed with code ' + code));
        });
    });
}

(async () => {
    try {
        for (const [key, value] of Object.entries(envs)) {
            console.log(`Adding ${key}...`);
            await addEnv(key, value);
        }
        console.log('Successfully added env vars');
    } catch (e) {
        console.error(e);
    }
})();
