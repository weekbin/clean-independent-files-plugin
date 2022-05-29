const fs = require("fs");
const glob = require("glob");
const path = require("path");

// fs.readdir("./src", (err, stats) => {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log(stats);
//   stats.forEach((stat) => {
//     const isDirectory = fs.lstatSync(`./src/${stat}`).isDirectory();
//     if (isDirectory) {
//       //
//     }
//   });
// });

class WebpackCleanUndependentFilesPlugin {
  constructor(options) {
    this.options = {
      entry: ["./src"], // 清理文件入口
      autoDelete: false, // 是否自动清除未被依赖的文件
      outputLogs: true, // 是否输出日志
      outputLogsPath: "./wcufp.json", // 日志输出目录
      exclude: [], // 不清除的正则数组
      ...this.normalizeOptions(options),
    };
    this.dependencies = [];
    this.allEntryFiles = [];
    this.files2Delete = [];
  }

  // 标准化与校验注入参数
  normalizeOptions(options = {}) {
    // 入口去重，防止有重复文件依赖
    if (options.entry) {
      options.entry = [...new Set(options.entry)];
    }
    return options;
  }

  // plugin 入口
  apply(compiler) {
    compiler.hooks.afterEmit.tap("cleanFiles", async (compilation) => {
      // webpack 生命周期钩子收集项目目录下自己写的依赖
      await this.gatherDependencies(compilation);
      await this.gatherEntryFiles();
      await this.gatherFiles2Delete();
      if (this.options.autoDelete) {
        await this.cleanFiles();
        for (const entry of this.options.entry) {
          await this.cleanEmptyDirectory(entry);
        }
      }
    });
  }

  // 收集 webpack 监测到的依赖
  async gatherDependencies(compilation) {
    this.dependencies = Array.from(compilation.fileDependencies).filter(
      (path) => !path.includes("node_modules")
    );
  }

  // 收集入口文件列表
  async gatherEntryFiles() {
    const promiseList = [];
    this.options.entry.forEach((et) => {
      promiseList.push(
        new Promise((resolve, reject) => {
          glob(`${et}/**/*`, { nodir: true }, (err, files) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(
                files.map((file) => {
                  return path.resolve(file);
                })
              );
            }
          });
        })
      );
    });
    const allEntryFilesList = await Promise.all(promiseList);
    this.allEntryFiles.push(...allEntryFilesList.flat());
  }

  // 过滤出需要被删除的文件
  async gatherFiles2Delete() {
    this.files2Delete = this.allEntryFiles.filter((file) => {
      return (
        !this.dependencies.includes(file) &&
        !this.options.exclude.some((excludeRegExp) => {
          return !!file.match(excludeRegExp);
        })
      );
    });
    if (this.options.outputLogs) {
      fs.writeFileSync(
        this.options.outputLogsPath,
        JSON.stringify(this.files2Delete, null, 4)
      );
    }
  }

  // 清除文件
  async cleanFiles() {
    this.files2Delete.forEach((file) => {
      fs.unlinkSync(file);
      console.log(`成功删除文件：${file}`);
    });
  }

  // 文件清理后调用，清除空文件夹
  async cleanEmptyDirectory(filePath) {
    let files;
    try {
      files = fs.readdirSync(filePath);
    } catch (error) {
      return;
    }
    if (files.length === 0) {
      fs.rmdirSync(filePath);
      console.log(`成功删除空文件夹：${filePath}`);
    } else {
      files.forEach((file) => {
        const nextFilePath = `${filePath}/${file}`;
        this.cleanEmptyDirectory(nextFilePath);
      });
      //删除母文件夹下的所有字空文件夹后，将母文件夹也删除
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        console.log(`成功删除空文件夹： ${filePath}`);
      }
    }
  }
}

module.exports = { WebpackCleanUndependentFilesPlugin };
