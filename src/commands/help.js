/**
 * @fileoverview ASPH 博客命令帮助工具
 * @description 提供命令行帮助信息，展示所有可用命令及其使用说明
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import chalk from 'chalk';

/**
 * 显示命令帮助信息
 * @description 展示特定命令的详细帮助或列出所有可用命令
 * @param {string} [command] - 指定查看帮助的命令名称，不提供则显示所有命令
 * @returns {void}
 */
export default function help(command) {
  const commands = {
    init: {
      usage: 'asph init [project-name]',
      description: '初始化新项目',
      options: [
        ['-f, --force', '强制覆盖现有文件']
      ]
    },
    dev: {
      usage: 'asph dev',
      description: '本地开发预览',
      options: [
        ['-p, --port <port>', '指定端口（默认: 4321）'],
        ['-h, --host <host>', '指定主机（默认: localhost）']
      ]
    },
    build: {
      usage: 'asph build',
      description: '构建生产版本',
      options: []
    },
    preview: {
      usage: 'asph preview',
      description: '预览生产构建',
      options: [
        ['-p, --port <port>', '指定端口（默认: 4321）']
      ]
    },
    deploy: {
      usage: 'asph deploy',
      description: '部署到 GitHub Pages',
      options: [
      ]
    }
  };

  if (command && commands[command]) {
    const cmd = commands[command];
    console.log(chalk.cyan(`\n${cmd.usage}\n`));
    console.log(chalk.gray(cmd.description));
    if (cmd.options.length > 0) {
      console.log(chalk.blueBright('\n选项:'));
      cmd.options.forEach(([flag, desc]) => {
        console.log(`  ${chalk.cyan(flag.padEnd(25))} ${chalk.gray(desc)}`);
      });
    }
    console.log(chalk.whiteBright('[LOG]') + chalk.gray(' 以上为 ') + chalk.cyan(command) + chalk.gray(' 命令的详细说明。\n'));
  } else {
    console.log(chalk.cyan('\n可用命令:\n'));
    Object.entries(commands).forEach(([name, cmd]) => {
      console.log(`  ${chalk.greenBright(name.padEnd(12))} ${chalk.gray(cmd.description)}`);
      console.log(`  ${chalk.gray('           ')} ${chalk.yellow(cmd.usage)}`);
      console.log();
    });
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 使用 ') + chalk.cyan('asph help <command>') + chalk.gray(' 查看具体命令的帮助信息。\n'));
  }
}