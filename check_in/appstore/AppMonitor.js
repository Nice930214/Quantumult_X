/*
【app版本及价格监控】修改自t.me/QuanXApp群友分享 
Modified by evilbutcher

【仓库地址】https://github.com/evilbutcher/Quantumult_X/tree/master（欢迎star🌟）

【BoxJs】https://raw.githubusercontent.com/evilbutcher/Quantumult_X/master/evilbutcher.boxjs.json

【致谢】
感谢来自t.me/QuanXApp群友分享脚本！
感谢Peng-YM的OpenAPI.js！

⚠️【免责声明】
------------------------------------------
1、此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2、由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3、请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4、此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5、本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6、如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7、所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。

【Quantumult X】
————————————————
30 7-22 * * * https://raw.githubusercontent.com/evilbutcher/Quantumult_X/master/check_in/appstore/AppMonitor.js, tag=App价格监控

【Surge】
————————————————
App价格监控 = type=cron,cronexp="30 7-22 * * *",script-path=https://raw.githubusercontent.com/evilbutcher/Quantumult_X/master/check_in/appstore/AppMonitor.js,wake-system=true,timeout=600

【Loon】
————————————————
cron "30 7-22 * * *" script-path=https://raw.githubusercontent.com/evilbutcher/Quantumult_X/master/check_in/appstore/AppMonitor.js, timeout=600, tag=App价格监控

app可单独设置区域，未单独设置区域，则采用reg默认区域
设置区域方式apps=["1443988620:hk","1443988620/us","1443988620-uk","1443988620_jp","1443988620 au"]
以上方式均可 分隔符支持 空格/:|_-

*/
const $ = new API("App价格监控");

let apps = $.read("apps") || [
  "1443988620:hk",
  "1312014438:cn",
  "499470113:vn",
  "1314212521:jp",
  "1282297037:au",
  "932747118:us",
  "1116905928",
  "1373567447:us",
  "6443729790:us",
].join("，").split("，");

let reg = $.read("reg") || "cn"; // 默认区域：美国us 中国cn 香港hk

let notifys = [];

format_apps(apps);

async function format_apps(apps) {
  const appsFormatted = {};

  apps.forEach(app => {
    const [id, country = reg] = app.replace(/[\/|_\s]/g, ":").split(":");
    
    if (/^\d+$/.test(id)) {
      if (appsFormatted.hasOwnProperty(country)) {
        appsFormatted[country].push(id);
      } else {
        appsFormatted[country] = [id];
      }
    } else {
      notifys.push(`ID格式错误:【${app}】`);
    }
  });

  if (Object.keys(appsFormatted).length > 0) {
    await post_data(appsFormatted);
  }
}

async function post_data(appsFormatted) {
  try {
    let app_monitor = JSON.parse($.read("app_monitor") || "{}");
    let infos = {};

    await Promise.all(Object.keys(appsFormatted).map(async country => {
      const ids = appsFormatted[country];
      const config = {
        url: `https://itunes.apple.com/lookup?id=${ids.join(",")}&country=${country}`
      };

      try {
        const response = await $.http.get(config);
        const results = JSON.parse(response.body).results;

        if (Array.isArray(results) && results.length > 0) {
          results.forEach(app => {
            const { trackId, trackName, version, formattedPrice } = app;

            infos[trackId] = { n: trackName, v: version, p: formattedPrice };

            if (app_monitor.hasOwnProperty(trackId)) {
              const monitorData = app_monitor[trackId];

              if (monitorData.v !== version) {
                notifys.push(`${flag(country)}🧩${trackName}:升级【${version}】`);
              }

              if (monitorData.p !== formattedPrice) {
                notifys.push(`${flag(country)}💰${trackName}:价格【${formattedPrice}】`);
              }
            } else {
              notifys.push(`${flag(country)}🧩${trackName}:版本【${version}】`);
              notifys.push(`${flag(country)}💰${trackName}:价格【${formattedPrice}】`);
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }));

    $.write(JSON.stringify(infos), "app_monitor");

    if (notifys.length > 0) {
      notify(notifys);
    } else {
      console.log("APP监控：版本及价格无变化");
    }
  } catch (error) {
    console.log(error);
  } finally {
    $.done();
  }
}

function notify(notifys) {
  const notifyMessage = notifys.join("\n");
  console.log(notifyMessage);
  $.notify("APP监控", "", notifyMessage);
}

function flag(countryCode) {
  const flags = new Map([
    ["AC", "🇦🇨"], ["AF", "🇦🇫"], ["AI", "🇦🇮"], ["AL", "🇦🇱"], ["AM", "🇦🇲"],
    ["AQ", "🇦🇶"], ["AR", "🇦🇷"], ["AS", "🇦🇸"], ["AT", "🇦🇹"], ["AU", "🇦🇺"],
    ["AW", "🇦🇼"], ["AX", "🇦🇽"], ["AZ", "🇦🇿"], ["BB", "🇧🇧"], ["BD", "🇧🇩"],
    ["BE", "🇧🇪"], ["BF", "🇧🇫"], ["BG", "🇧🇬"], ["BH", "🇧🇭"], ["BI", "🇧🇮"],
    ["BJ", "🇧🇯"], ["BM", "🇧🇲"], ["BN", "🇧🇳"], ["BO", "🇧🇴"], ["BR", "🇧🇷"],
    ["BS", "🇧🇸"], ["BT", "🇧🇹"], ["BV", "🇧🇻"], ["BW", "🇧🇼"], ["BY", "🇧🇾"],
    ["BZ", "🇧🇿"], ["CA", "🇨🇦"], ["CF", "🇨🇫"], ["CH", "🇨🇭"], ["CK", "🇨🇰"],
    ["CL", "🇨🇱"], ["CM", "🇨🇲"], ["CN", "🇨🇳"], ["CO", "🇨🇴"], ["CP", "🇨🇵"],
    ["CR", "🇨🇷"], ["CU", "🇨🇺"], ["CV", "🇨🇻"], ["CW", "🇨🇼"], ["CX", "🇨🇽"],
    ["CY", "🇨🇾"], ["CZ", "🇨🇿"], ["DE", "🇩🇪"], ["DG", "🇩🇬"], ["DJ", "🇩🇯"],
    ["DK", "🇩🇰"], ["DM", "🇩🇲"], ["DO", "🇩🇴"], ["DZ", "🇩🇿"], ["EA", "🇪🇦"],
    ["EC", "🇪🇨"], ["EE", "🇪🇪"], ["EG", "🇪🇬"], ["EH", "🇪🇭"], ["ER", "🇪🇷"],
    ["ES", "🇪🇸"], ["ET", "🇪🇹"], ["EU", "🇪🇺"], ["FI", "🇫🇮"], ["FJ", "🇫🇯"],
    ["FK", "🇫🇰"], ["FM", "🇫🇲"], ["FO", "🇫🇴"], ["FR", "🇫🇷"], ["GA", "🇬🇦"],
    ["GB", "🇬🇧"], ["HK", "🇭🇰"], ["ID", "🇮🇩"], ["IE", "🇮🇪"], ["IL", "🇮🇱"],
    ["IM", "🇮🇲"], ["IN", "🇮🇳"], ["IS", "🇮🇸"], ["IT", "🇮🇹"], ["JP", "🇯🇵"],
    ["KR", "🇰🇷"], ["MO", "🇲🇴"], ["MX", "🇲🇽"], ["MY", "🇲🇾"], ["NL", "🇳🇱"],
    ["PH", "🇵🇭"], ["RO", "🇷🇴"], ["RS", "🇷🇸"], ["RU", "🇷🇺"], ["RW", "🇷🇼"],
    ["SA", "🇸🇦"], ["SB", "🇸🇧"], ["SC", "🇸🇨"], ["SD", "🇸🇩"], ["SE", "🇸🇪"],
    ["SG", "🇸🇬"], ["TH", "🇹🇭"], ["TN", "🇹🇳"], ["TO", "🇹🇴"], ["TR", "🇹🇷"],
    ["TV", "🇹🇻"], ["TW", "🇨🇳"], ["UK", "🇬🇧"], ["UM", "🇺🇲"], ["US", "🇺🇸"],
    ["UY", "🇺🇾"], ["UZ", "🇺🇿"], ["VA", "🇻🇦"], ["VE", "🇻🇪"], ["VG", "🇻🇬"],
    ["VI", "🇻🇮"], ["VN", "🇻🇳"]
  ]);

  return flags.get(countryCode.toUpperCase()) || "";
}


/**
 * OpenAPI
 * @author: Peng-YM
 * https://github.com/Peng-YM/QuanX/blob/master/Tools/OpenAPI/README.md
 */
function ENV() {
  const isQX = typeof $task !== "undefined";
  const isLoon = typeof $loon !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && !isLoon;
  const isJSBox = typeof require == "function" && typeof $jsbox != "undefined";
  const isNode = typeof require == "function" && !isJSBox;
  const isRequest = typeof $request !== "undefined";
  const isScriptable = typeof importModule !== "undefined";
  return {
    isQX,
    isLoon,
    isSurge,
    isNode,
    isJSBox,
    isRequest,
    isScriptable,
  };
}

function HTTP(defaultOptions = { baseURL: "" }) {
  const { isQX, isLoon, isSurge, isScriptable, isNode } = ENV();
  const methods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"];
  const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

  function send(method, options) {
    options = typeof options === "string" ? { url: options } : options;
    const baseURL = defaultOptions.baseURL;
    if (baseURL && !URL_REGEX.test(options.url || "")) {
      options.url = baseURL ? baseURL + options.url : options.url;
    }
    options = { ...defaultOptions, ...options };
    const { timeout, events = {} } = options;
    const { onRequest = () => {}, onResponse = (resp) => resp, onTimeout = () => {} } = events;

    onRequest(method, options);

    let worker;
    if (isQX) {
      worker = $task.fetch({ method, ...options });
    } else if (isLoon || isSurge || isNode) {
      worker = new Promise((resolve, reject) => {
        const request = isNode ? require("request") : $httpClient;
        request[method.toLowerCase()](options, (err, response, body) => {
          if (err) reject(err);
          else resolve({ statusCode: response.status || response.statusCode, headers: response.headers, body });
        });
      });
    } else if (isScriptable) {
      const request = new Request(options.url);
      request.method = method;
      request.headers = options.headers;
      request.body = options.body;
      worker = new Promise((resolve, reject) => {
        request.loadString().then((body) => {
          resolve({ statusCode: request.response.statusCode, headers: request.response.headers, body });
        }).catch((err) => reject(err));
      });
    }

    let timeoutId;
    const timer = timeout ? new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        onTimeout();
        reject(`${method} URL: ${options.url} exceeds the timeout ${timeout} ms`);
      }, timeout);
    }) : null;

    return (timer ? Promise.race([timer, worker]).then((res) => {
      clearTimeout(timeoutId);
      return res;
    }) : worker).then((resp) => onResponse(resp));
  }

  const http = {};
  methods.forEach((method) => (http[method.toLowerCase()] = (options) => send(method, options)));
  return http;
}

function API(name = "untitled", debug = false) {
  const { isQX, isLoon, isSurge, isNode, isJSBox, isScriptable } = ENV();
  return new (class {
    constructor(name, debug) {
      this.name = name;
      this.debug = debug;
      this.http = HTTP();
      this.env = ENV();

      if (isNode) {
        const fs = require("fs");
        this.node = { fs };
      } else {
        this.node = null;
      }
      this.initCache();

      const delay = (t, v) => new Promise((resolve) => setTimeout(resolve.bind(null, v), t));
      Promise.prototype.delay = function (t) {
        return this.then((v) => delay(t, v));
      };
    }

    initCache() {
      if (isQX) this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}");
      if (isLoon || isSurge) this.cache = JSON.parse($persistentStore.read(this.name) || "{}");

      if (isNode) {
        const fs = this.node.fs;
        const fpath = `${this.name}.json`;
        if (!fs.existsSync(fpath)) {
          fs.writeFileSync(fpath, JSON.stringify({}), { flag: "wx" }, (err) => console.log(err));
          this.cache = {};
        } else {
          this.cache = JSON.parse(fs.readFileSync(fpath));
        }
      }
    }

    persistCache() {
      const data = JSON.stringify(this.cache, null, 2);
      if (isQX) $prefs.setValueForKey(data, this.name);
      if (isLoon || isSurge) $persistentStore.write(data, this.name);
      if (isNode) {
        const fs = this.node.fs;
        fs.writeFileSync(`${this.name}.json`, data, { flag: "w" }, (err) => console.log(err));
      }
    }

    write(data, key) {
      this.log(`SET ${key}`);
      if (key.startsWith("#")) {
        key = key.substr(1);
        if (isSurge || isLoon) {
          return $persistentStore.write(data, key);
        }
        if (isQX) {
          return $prefs.setValueForKey(data, key);
        }
        if (isNode) {
          this.cache[key] = data;
        }
      } else {
        this.cache[key] = data;
      }
      this.persistCache();
    }

    read(key) {
      this.log(`READ ${key}`);
      if (key.startsWith("#")) {
        key = key.substr(1);
        if (isSurge || isLoon) {
          return $persistentStore.read(key);
        }
        if (isQX) {
          return $prefs.valueForKey(key);
        }
        if (isNode) {
          return this.cache[key];
        }
      } else {
        return this.cache[key];
      }
    }

    delete(key) {
      this.log(`DELETE ${key}`);
      if (key.startsWith("#")) {
        key = key.substr(1);
        if (isSurge || isLoon) {
          return $persistentStore.write(null, key);
        }
        if (isQX) {
          return $prefs.removeValueForKey(key);
        }
        if (isNode) {
          delete this.cache[key];
        }
      } else {
        delete this.cache[key];
      }
      this.persistCache();
    }

    notify(title, subtitle = "", content = "", options = {}) {
      const openURL = options["open-url"];
      const mediaURL = options["media-url"];

      if (isQX) {
        $notify(title, subtitle, content, options);
      }
      if (isSurge) {
        $notification.post(title, subtitle, content + (mediaURL ? `\n多媒体: ${mediaURL}` : ""), { url: openURL });
      }
      if (isLoon) {
        const opts = {};
        if (openURL) opts["openUrl"] = openURL;
        if (mediaURL) opts["mediaUrl"] = mediaURL;
        if (Object.keys(opts).length === 0) {
          $notification.post(title, subtitle, content);
        } else {
          $notification.post(title, subtitle, content, opts);
        }
      }
      if (isNode || isScriptable) {
        const content_ = content + (openURL ? `\n点击跳转: ${openURL}` : "") + (mediaURL ? `\n多媒体: ${mediaURL}` : "");
        if (isJSBox) {
          const push = require("push");
          push.schedule({ title: title, body: (subtitle ? subtitle + "\n" : "") + content_ });
        } else {
          console.log(`${title}\n${subtitle}\n${content_}\n\n`);
        }
      }
    }

    log(msg) {
      if (this.debug) console.log(`[${this.name}] LOG: ${this.stringify(msg)}`);
    }

    info(msg) {
      console.log(`[${this.name}] INFO: ${this.stringify(msg)}`);
    }

    error(msg) {
      console.log(`[${this.name}] ERROR: ${this.stringify(msg)}`);
    }

    wait(millisec) {
      return new Promise((resolve) => setTimeout(resolve, millisec));
    }

    done(value = {}) {
      if (isQX || isLoon || isSurge) {
        $done(value);
      } else if (isNode && typeof $context !== "undefined") {
        $context.headers = value.headers;
        $context.statusCode = value.statusCode;
        $context.body = value.body;
      }
    }

    stringify(objOrStr) {
      if (typeof objOrStr === "string" || objOrStr instanceof String) return objOrStr;
      try {
        return JSON.stringify(objOrStr, null, 2);
      } catch (err) {
        return "[object Object]";
      }
    }
  })(name, debug);
}
