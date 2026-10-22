#!/usr/bin/env node
import { spawn } from 'node:child_process';
import {
    cp,
    mkdir,
    readFile,
    readdir,
    rm,
    stat,
    writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, 'release');

const ENTRIES = [
    'dist',
    'prisma',
    'package.json',
    'package-lock.json',
    'prisma.config.js',
    'ecosystem.config.cjs',
    '.env.example',
];

const PROD_SCRIPTS = [
    'start',
    'db:push',
    'db:seed',
    'pm2:start',
    'pm2:reload',
    'pm2:stop',
    'pm2:delete',
    'pm2:logs',
];

const exists = target =>
    stat(target).then(
        () => true,
        () => false
    );

function run(command, args) {
    return new Promise((resolve_, reject) => {
        const child = spawn(command, args, {
            cwd: root,
            stdio: 'inherit',
            shell: process.platform === 'win32',
        });
        child.on('error', reject);
        child.on('exit', code =>
            code === 0
                ? resolve_()
                : reject(
                      new Error(`${command} ${args.join(' ')} 退出码 ${code}`)
                  )
        );
    });
}

async function dirSize(dir) {
    const items = await readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const item of items) {
        const full = join(dir, item.name);
        total += item.isDirectory()
            ? await dirSize(full)
            : (await stat(full)).size;
    }
    return total;
}

function human(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
    console.log('\n[1/3] 构建 dist');
    await run('npm', ['run', 'build']);

    console.log('\n[2/3] 生成 Prisma Client');
    await run('npx', ['prisma', 'generate']);

    console.log('\n[3/3] 收集发布文件');
    if (!(await exists(join(root, 'dist', 'main.js')))) {
        console.error('缺少 dist/main.js，构建未产出可执行文件');
        process.exit(1);
    }
    if (!(await exists(join(root, 'node_modules', '.prisma', 'client')))) {
        console.error('缺少 Prisma Client，请确认 prisma generate 是否成功');
        process.exit(1);
    }

    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const rows = [];
    for (const name of ENTRIES) {
        const from = join(root, name);
        if (!(await exists(from))) {
            rows.push([name, '跳过（源文件不存在）']);
            continue;
        }
        await cp(from, join(outDir, name), {
            recursive: true,
            dereference: true,
        });
        const to = join(outDir, name);
        const size = (await stat(to)).isDirectory()
            ? await dirSize(to)
            : (await stat(to)).size;
        rows.push([name, human(size)]);
    }

    const pkgPath = join(outDir, 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    delete pkg.devDependencies;
    pkg.scripts = Object.fromEntries(
        Object.entries(pkg.scripts).filter(([name]) =>
            PROD_SCRIPTS.includes(name)
        )
    );
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`);

    const width = Math.max(...rows.map(([name]) => name.length));
    console.log(`\n打包完成: ${relative(process.cwd(), outDir) || outDir}/\n`);
    for (const [name, size] of rows) {
        console.log(`  ${name.padEnd(width)}  ${size}`);
    }
    const total = await dirSize(outDir);
    console.log(`\n  合计 ${human(total)}（不含 node_modules）`);
    console.log('\n部署步骤:');
    console.log('  1. 上传 release/ 到服务器');
    console.log('  2. npm ci --omit=dev');
    console.log('  3. npx prisma generate');
    console.log('  4. npm run db:push            # 同步数据库结构');
    console.log('  5. npm run db:seed            # 可选');
    console.log('  6. npm run pm2:start\n');
}

main().catch(error => {
    console.error(`\n打包失败: ${error.message}`);
    process.exit(1);
});
