#!/usr/bin/env node

const chalk = require('chalk');
const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const ora = require('ora');

const spinner = ora();

const packageJson = require('../package.json');

const { log, error } = require('../utils/log');

const {
    isDangerousToCreateProject,
    initTemplate,
    installDependencies
} = require('../utils');



async function createApp(projectName) {
    if (isDangerousToCreateProject(projectName)){
        const { action } = await inquirer.prompt([{
            name: 'action',
            type: 'list',
            message: projectName === '.' ? '当前目录中已存在文件，请选择一个操作：' : `项目文件夹 ${chalk.green(projectName)} 已存在，请选择一个操作：`,
            choices: [
              { name: '覆盖（删除原文件）', value: 'overwrite' },
              { name: '合并（保留原文件）', value: 'merge' },
              { name: '取消', value: false },
            ],
        }]);

        if (!action) {
            return;
        } 
        
        if (action === 'overwrite') {
            spinner.start('正在删除原文件');
            try {
              await fs.emptyDir(projectName);
              spinner.succeed('原文件已删除');
            } catch (e) {
              log();
              error(e);
              spinner.stop();
              process.exit(1);
            }
        }
    }

    const config = {
        projectName,
        template:'react', //保留项目类型，留作以后扩展，例如vue等
    };

    // 初始化模板
    await initTemplate(config);
    
    // 安装依赖
    await installDependencies(config);
}


program
  .version(packageJson.version);

program
  .command('create')
  .arguments('<project-directory>')
  .description('创建一个新的项目（「.」表示在当前目录创建）')
  .action((projectName) => {
    createApp(projectName);
  });

program
  .arguments('<command>')
  .action((cmd) => {
    log();
    log(`  ${chalk.red(`Unknown command ${chalk.yellow(cmd)}.`)}`);
    log(`  Please run ${chalk.cyan('ark -h')} for more information of usage.`);
    log();
  });

program.parse(process.argv);