import chalk from 'chalk';

export default function help(command) {
  const commands = {
    init: {
      usage: 'asph init [project-name]',
      description: '📦 初始化新项目',
      options: [
        ['-t, --template <name>', '使用指定模板（默认: default）'],
        ['-f, --force', '强制覆盖现有文件']
      ]
    },
    dev: {
      usage: 'asph dev',
      description: '🔥 本地开发预览',
      options: [
        ['-p, --port <port>', '指定端口（默认: 4321）'],
        ['-h, --host <host>', '指定主机（默认: localhost）']
      ]
    },
    build: {
      usage: 'asph build',
      description: '🔨 构建生产版本',
      options: []
    },
    preview: {
      usage: 'asph preview',
      description: '👁️ 预览生产构建',
      options: [
        ['-p, --port <port>', '指定端口（默认: 4321）']
      ]
    }
  };
  
  if (command && commands[command]) {
    const cmd = commands[command];
    console.log(chalk.cyan(`\n📖 ${cmd.usage}\n`));
    console.log(chalk.white(cmd.description));
    if (cmd.options.length > 0) {
      console.log(chalk.yellow('\n选项:'));
      cmd.options.forEach(([flag, desc]) => {
        console.log(`  ${chalk.green(flag.padEnd(25))} ${desc}`);
      });
    }
    console.log();
  } else {
    console.log(chalk.cyan('\n📖 可用命令:\n'));
    Object.entries(commands).forEach(([name, cmd]) => {
      console.log(`  ${chalk.green(name.padEnd(12))} ${cmd.description}`);
      console.log(`  ${chalk.gray('           ')} ${chalk.italic(cmd.usage)}`);
      console.log();
    });
    console.log(chalk.gray('使用 `asph help <command>` 查看具体命令的帮助信息。\n'));
  }
}