import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const root = process.cwd();

const mdDir = path.join(root, 'md');
const htmlDir = path.join(root, 'html');
const outDir = path.join(root, 'public');

const htmlPath = path.join(htmlDir, 'index.html');
const outputPath = path.join(outDir, 'index.html');

marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
});

function stripDangerousTags(html) {
    html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<link\b[^>]*>/gi, '');
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    return html;
}

function removeBadgeBlocks(html) {
    return html.replace(
        /<div\s+class=["']badges["'][^>]*>[\s\S]*?<\/div>/gi,
        ''
    );
}

function removeButtonBlocks(html) {
    return html.replace(
        /<div\s+class=["']buttons["'][^>]*>[\s\S]*?<\/div>/gi,
        ''
    );
}

function normalizePublicPaths(html) {
    return html.replace(/\.\.\/public(?=\/)/g, '');
}

function removeEmptyLines(html) {
    return html
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
}

function build() {
    if (!fs.existsSync(htmlPath)) {
        throw new Error(`HTML 不存在: ${htmlPath}`);
    }

    if (!fs.existsSync(mdDir)) {
        throw new Error(`Markdown 不存在: ${mdDir}`);
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');

    const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
        const page = file.replace(/\.md$/, '');
        const placeholder = `<!--${page}-->`;

        if (!html.includes(placeholder)) {
            console.warn(`⚠️ 无占位符 ${placeholder}`);
            continue;
        }

        const mdPath = path.join(mdDir, file);
        const md = fs.readFileSync(mdPath, 'utf-8');

        let rendered = marked.parse(md);

        rendered = stripDangerousTags(rendered);
        rendered = removeBadgeBlocks(rendered);
        rendered = normalizePublicPaths(rendered);

        html = html.replace(
            placeholder,
            `\n${rendered}\n`
        );

        console.log(`✅ 成功注入 ${file}`);
    }

    const rawTargets = ['ios.md', 'android.md'];

    for (const file of rawTargets) {
        const srcPath = path.join(mdDir, file);
        if (!fs.existsSync(srcPath)) continue;

        let raw = fs.readFileSync(srcPath, 'utf-8');

        raw = stripDangerousTags(raw);
        raw = removeButtonBlocks(raw);

        const outPath = path.join(root, file);
        fs.writeFileSync(outPath, raw, 'utf-8');

        console.log(`📝 成功处理 ${file}`);
    }

    html = removeEmptyLines(html);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outputPath, html, 'utf-8');

    console.log('🎉 构建成功 index.html');
}

try {
    build();
} catch (err) {
    console.error('❌ 构建失败');
    console.error(err);
    process.exit(1);
}