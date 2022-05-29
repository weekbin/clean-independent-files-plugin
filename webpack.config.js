const glob = require("glob");
const path = require("path");
const fs = require("fs");
const { WebpackCleanUndependentFilesPlugin } = require("./clean");

class FileShaking {
  constructor(options) {
    this.options = {
      excludeRegex: [
        /readme\.md/i, // 不删除readme文件
        /utils/, // 不删除工具方法目录下的文件
      ],
      delete: true,
      ...options,
    };
    this.fileDependencies = [];
    this.srcFiles = [];
    this.toDelFiles = [];
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap("FileShaking", (compilation) => {
      this.fileDependencies = Array.from(compilation.fileDependencies).filter(
        (path) => !path.includes("node_modules")
      );
      this.deleteIndependence();
    });
  }
  async deleteIndependence() {
    this.srcFiles = await this.getSrcFiles();
    this.srcFiles.forEach((filePath) => {
      if (
        !this.fileDependencies.includes(filePath) &&
        !this.matchExclude(filePath)
      ) {
        this.toDelFiles.push(filePath);
      }
    });
    if (this.options.delete) {
      // this.delFiles();
      // this.delEmptyDir('./src', (err) => {
      //     if (err) {
      //         console.log(err)
      //     } else {
      //         console.log('删除空文件夹DONE')
      //     }
      // });
      console.log(this.toDelFiles);
      this.delEmptyDir('./src')
    }
  }
  getSrcFiles() {
    return new Promise((resolve, reject) => {
      glob(
        "./src/**/*",
        {
          nodir: true,
        },
        (err, files) => {
          if (err) {
            reject(err);
          } else {
            let out = files.map((file) => {
              let tmpFilePath = path.resolve(file);
              return (
                tmpFilePath.slice(0, 1).toUpperCase() + tmpFilePath.slice(1)
              );
            });
            resolve(out);
          }
        }
      );
    });
  }
  matchExclude(pathname) {
    let matchResult = false;
    if (this.options.excludeRegex.length) {
      for (let i = 0; i < this.options.excludeRegex.length; i++) {
        if ((matchResult = this.options.excludeRegex[i].test(pathname))) {
          return matchResult;
        }
      }
    }
    return matchResult;
  }
  delEmptyDir(dir, cb) {
    fs.stat(dir, (err, stat) => {
      if (err) {
        cb(err);
        return;
      }
      if (stat.isDirectory()) {
        fs.readdir(dir, (err, objs) => {
          objs = objs.map((item) => path.join(dir, item));
          if (err) {
            cb(err);
            return;
          }
          if (objs.length === 0) {
            console.log(dir)
            // return fs.rmdir(dir, cb);
            return
          } else {
            let count = 0;
            function done(...rest) {
              count++;
              if (count === objs.length) {
                cb(...rest);
              }
            }
            objs.forEach((obj) => {
              this.delEmptyDir(obj, done);
            });
          }
        });
      }
    });
  }
  delFiles() {
    this.toDelFiles.forEach((item) => {
      fs.unlink(item, (err) => {
        console.log(err);
      });
    });
    console.log("删除文件DONE");
  }
}

module.exports = {
  mode: "development",
//   plugins: [new FileShaking()],
  plugins: [new WebpackCleanUndependentFilesPlugin({
      autoDelete: true
  })],
};
