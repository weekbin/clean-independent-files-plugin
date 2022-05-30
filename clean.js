const fs = require("fs");
const glob = require("glob");
const path = require("path");

class WebpackCleanUndependentFilesPlugin {
  constructor(options) {
    this.options = {
      /**
       * 清理文件入口
       * 适配多入口打包的情况，可以同时清理多个入口的非依赖文件
       */
      entry: ["./src"], // 
      /**
       * 是否自动清除未被依赖的文件
       */
      autoDelete: false,
      /**
       * 是否输出日志
       */
      outputLogs: true,
      /**
       * 日志输出目录
       */
      outputLogsPath: "./wcufp.json",
      /**
       * 正则数组，不被清除的未被依赖的文件
       * 例如：utils 文件夹下的内容虽然当前不被引用，但是也不打算直接清除
       */
      exclude: [],
      /**
       * 正则数组，外部依赖，视为可清除的文件
       * 例如：某个自己写的依赖采用模块的方式引入，但是现在打算用 script 的方式引入
       */
      externalDependencies: [],
      /**
       * 用户自定义处理函数，会传入 this.files2Delete，this 会帮定为类实例
       * 存在 callback 将忽略 autoDelete 参数，不自动删除任何文件
       */
      callback: null,
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
    options.autoDelete = !!options.autoDelete;
    options.outputLogs =
      typeof options.outputLogs === "boolean" ? options.outputLogs : true;
    if (options.exclude) {
      options.exclude = options.exclude.filter((reg) => {
        return reg instanceof RegExp || typeof reg === "string";
      });
    }
    return options;
  }

  // plugin 入口
  apply(compiler) {
    compiler.hooks.afterEmit.tap("cleanFiles", async (compilation) => {
      // webpack 生命周期钩子收集项目目录下自己写的依赖
      await this.gatherDependencies(compilation);
      // 收集入口下的所有文件
      await this.gatherEntryFiles();
      // 过滤出需要被删除的文件
      await this.gatherFiles2Delete();
      // 如果存在 callback，调用 callback
      if (this.options.callback) {
        this.options.callback.call(this, this.files2Delete);
      }
      // 自动删除未被依赖的文件
      if (this.options.autoDelete && !this.options.callback) {
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
      (path) =>
        !path.includes("node_modules") &&
        !this.options.externalDependencies.some((dependencyRegExp) => {
          return !!path.match(dependencyRegExp);
        })
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
    this.allEntryFiles.push(
      ...allEntryFilesList.filter((fileList) => Array.isArray(fileList)).flat()
    );
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
      // filePath is not a directory, ignore the error
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
      if (fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        console.log(`成功删除空文件夹： ${filePath}`);
      }
    }
  }
}

module.exports = { WebpackCleanUndependentFilesPlugin };
