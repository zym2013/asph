#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入命令
import initCmd from '../src/commands/init.js';
import devCmd from '../src/commands/dev.js';
import buildCmd from '../src/commands/build.js';
import previewCmd from '../src/commands/preview.js';
import helpCmd from '../src/commands/help.js';

const program = new Command();

program
  .name('asph')
  .description('🚀 Astro Simple Personal Homepage - 快速搭建个人主页/博客')
  .version('1.0.0');

// 👇 命令定义
program
  .command('init [project-name]')
  .description('📦 初始化新项目')
  .option('-t, --template <name>', '使用指定模板', 'default')
  .option('-f, --force', '强制覆盖现有文件', false)
  .action(initCmd);

program
  .command('dev')
  .description('🔥 本地开发预览')
  .option('-p, --port <port>', '指定端口', '4321')
  .option('-h, --host <host>', '指定主机', 'localhost')
  .action(devCmd);

program
  .command('build')
  .description('🔨 构建生产版本')
  .action(buildCmd);

program
  .command('preview')
  .description('👁️ 预览生产构建')
  .option('-p, --port <port>', '指定端口', '4321')
  .action(previewCmd);

program
  .command('help [command]')
  .description('❓ 显示帮助信息')
  .action(helpCmd);

// 👇 未知命令处理
program.on('command:*', () => {
  console.error(`❌ 未知命令: ${program.args.join(' ')}`);
  program.help();
});

// 👇 解析参数
program.parse(process.argv);

// 👇 无命令时显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}