const Diff = require('./diff')

const TEXT = 'conf'
const SUBS = 'subs'
const PROXIES = 'proxies'
const POLICIES = 'policies'
const TEXT_PROXIES = 'conf_proxies'
const DIFF_URL = "diff_url"


$define({
  type: "KeyboardObserver: NSObject",
  props: ["height"],
  events: {
    "init": () => {
      self = self.$super().$init();

      const center = $objc("NSNotificationCenter").$defaultCenter();
      const observer = self;
      const register = (selector, name) => {
        center.$addObserver_selector_name_object(observer, selector, name, null);
      }

      register("show:", "UIKeyboardWillShowNotification");
      register("show:", "UIKeyboardDidShowNotification");
      register("hide:", "UIKeyboardWillHideNotification");
      return self;
    },
    "show": notification => {
      const info = notification.$userInfo();
      const frame = info.$objectForKey("UIKeyboardFrameEndUserInfoKey");
      const rect = frame.$CGRectValue();
      const height = rect.height;
      self.$setHeight(height);
      self.$notifyHeightChange();
    },
    "hide": notification => {
      self.$setHeight(0);
      self.$notifyHeightChange();
    },
    "notifyHeightChange": () => {
      const height = self.$height();
      console.log('height:', height)
      let v = $("basicConfView")
      if (v) {
        let f = v.frame
        v.remakeLayout(make => {
          make.size.equalTo($size(f.width, $('mainView').frame.height - height + 30))
        })
      }
    }
  }
});

const observer = $objc("KeyboardObserver").$new();
$objc_retain(observer);

$app.listen({
  exit: () => $objc_release(observer)
});

let renderUI = async () => {
  $ui.render({
    props: {
      title: 'Surge'
    },
    events: {
      appeared: handleMainViewAppeared
    },
    views: [{
      type: 'view',
      props: {
        id: 'mainView'
      },
      layout: (make, view) => {
        make.height.width.equalTo(view.super).offset(-30)
        make.top.left.equalTo(view.super).offset(15)
      },
      events: {},
      views: [{
        type: 'stack',
        props: {
          id: '',
          spacing: 10,
          distribution: $stackViewDistribution.equalCentering,
          stack: {
            views: [{
              type: 'image',
              props: {
                id: '',
                icon: $icon("030", $color("tint"), $size(30, 30)),
              },
              events: {
                tapped: renderTextEditUI
              },
              views: []
            }, {
              type: 'image',
              props: {
                id: '',
                icon: $icon("091", $color("tint"), $size(30, 30)),
              },
              events: {
                tapped: renderSubscrptionUI
              },
              views: []
            }, {
              type: 'image',
              props: {
                id: '',
                icon: $icon("162", $color("tint"), $size(30, 30)),
              },
              events: {
                tapped: handleSubsUpdate
              },
              views: []
            }, {
              type: 'image',
              props: {
                id: '',
                icon: $icon("002", $color("tint"), $size(30, 30)),
              },
              events: {
                tapped: () => {
                  $prefs.open()
                }
              },
              views: []
            },],
          }
        },
        layout: (make, view) => {
          make.height.equalTo(30)
          make.width.equalTo(view.super).offset(-40)
          make.left.equalTo(view.super).offset(20)
        },
      }, {
        type: 'menu',
        props: {
          id: 'policyMenuView',
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(10)
          make.height.equalTo(40)
          make.width.equalTo(view.super)
        },
        events: {
          changed: handleMenuChange
        },
        views: []
      }, {
        type: 'label',
        props: {
          id: 'labelTop',
          align: $align.center,
          font: $font("bold", 17),
          text: 'PROXIES'
        },
        layout: (make, view) => {
          make.height.equalTo(30)
          make.width.equalTo(view.super)
          make.top.equalTo(view.prev.bottom).offset(10)
        },
        events: {},
        views: []
      }, {
        type: 'view',
        props: {
          id: 'line1',
          bgcolor: $color('#f1f3f4')
        },
        layout: (make, view) => {
          make.height.equalTo(2)
          make.width.equalTo($("mainView")).offset(30)
          make.left.equalTo(view.super).offset(-15)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {},
        views: []
      }, {
        type: 'list',
        props: {
          id: 'existListView',
          reorder: true,
          rowHeight: 35,
          template: {
            views: [{
              type: 'label',
              props: {
                id: 'name',
                font: $font(16),
              },
              layout: $layout.fill,
            },]
          }
        },
        layout: (make, view) => {
          make.width.equalTo(view.super)
          make.height.equalTo(view.super).multipliedBy(1 / 2).offset(-125)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {
          didSelect: (sender, indexPath, data) => {
            let idx = $('policyMenuView').index
            let od = $cache.get(POLICIES)
            od[idx].proxies.splice(indexPath.row, 1)
            $cache.set(POLICIES, od)
            saveConf(od)

            sender.delete(indexPath)
            if (isPolicyExist(data.name.text)) {
              let ed = $('allListView').data
              data.name.color = $color("black")
              ed.push(data)
              $('allListView').data = ed
            }
          },
          reorderFinished: data => {
            let idx = $('policyMenuView').index
            let od = $cache.get(POLICIES)
            od[idx].proxies = data.map(i => i.name.text)
            $cache.set(POLICIES, od)
            saveConf(od)
          }
        },
        views: []
      }, {
        type: 'view',
        props: {
          id: 'line2',
          bgcolor: $color('#f1f3f4')
        },
        layout: (make, view) => {
          make.height.equalTo(2)
          make.width.equalTo($("mainView")).offset(30)
          make.left.equalTo(view.super).offset(-15)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {},
        views: []
      }, {
        type: 'label',
        props: {
          id: 'labelBottom',
          align: $align.center,
          font: $font("bold", 17),
          text: 'MORE'
        },
        layout: (make, view) => {
          make.height.equalTo(30)
          make.width.equalTo(view.super)
          make.top.equalTo(view.prev.bottom).offset(10)
        },
        events: {},
        views: []
      }, {
        type: 'view',
        props: {
          id: 'line3',
          bgcolor: $color('#f1f3f4')
        },
        layout: (make, view) => {
          make.height.equalTo(2)
          make.width.equalTo($("mainView")).offset(30)
          make.left.equalTo(view.super).offset(-15)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {},
        views: []
      }, {
        type: 'list',
        props: {
          id: 'allListView',
          rowHeight: 35,
          template: {
            views: [{
              type: 'label',
              props: {
                id: 'name',
                font: $font(16),
              },
              layout: $layout.fill,
            },]
          }
        },
        layout: (make, view) => {
          make.width.equalTo(view.super)
          make.height.equalTo(view.super).multipliedBy(1 / 2).offset(-125)
          make.top.equalTo(view.prev.bottom)
        },
        events: {
          didSelect: (sender, indexPath, data) => {
            let idx = $('policyMenuView').index
            let od = $cache.get(POLICIES)
            od[idx].proxies.push(data.name.text)
            $cache.set(POLICIES, od)

            let reg = filePartReg('Proxy Group')
            let text = $cache.get(TEXT)
            text = text.replace(reg, `$1\n${policyStringify(od)}\n\n$3`)
            $cache.set(TEXT, text)

            sender.delete(indexPath)
            let ed = $('existListView').data
            data.name.color = $color('black')
            ed.push(data)
            $('existListView').data = ed
          }
        },
        views: []
      }, {
        type: 'view',
        props: {
          id: 'line4',
          bgcolor: $color('#f1f3f4')
        },
        layout: (make, view) => {
          make.height.equalTo(2)
          make.width.equalTo($("mainView")).offset(30)
          make.left.equalTo(view.super).offset(-15)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {},
        views: []
      }, {
        type: 'button',
        props: {
          title: 'Generate',
          id: 'genButtonView'
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(10)
          make.height.equalTo(50)
          make.width.equalTo(view.super)
        },
        events: {
          tapped: generateConf
        },
        views: []
      }, {
        type: 'label',
        props: {
          id: 'hint',
          hidden: true,
          text: "Edit in Text Mode",
          font: $font("bold", 25),
          textColor: $color("#a6a5a4")
        },
        layout: $layout.center,
        events: {
          tapped: renderTextEditUI
        },
        views: []
      },]
    }]
  })
}

let renderTextEditUI = () => {
  $ui.push({
    props: {
      title: "BASIC CONF",
    },
    views: [{
      type: 'text',
      props: {
        placeholder: "Surge Configuration",
        text: $cache.get(TEXT) || '',
        font: $font(14),
        id: 'basicConfView'
      },
      layout: (make, view) => {
        make.width.left.top.equalTo(view.super)
        make.height.equalTo(view.super)
      },
      events: {
        didChange: (sender) => {
          $cache.set(TEXT, sender.text)
        }
      },
      views: []
    }, {
      type: 'button',
      props: {
        id: '',
        radius: 20,
        bgcolor: $color("tint"),
        icon: $icon('165', $color('white'), $size(25, 25))
      },
      layout: (make, view) => {
        make.size.equalTo($size(40, 40))
        make.right.equalTo(view.super).offset(-30)
        make.bottom.equalTo(view.prev).offset(-30)
      },
      events: {
        tapped: async sender => {
          let t = await $input.text({
            placeholder: "URL, will overwrite current profile",
          })
          if (!t) return
          let resp = await $http.get(t)
          $('basicConfView').text = resp.data
          $cache.set(TEXT, resp.data)
        }
      },
      views: []
    }, {
      type: 'button',
      props: {
        id: '',
        radius: 20,
        bgcolor: $color("tint"),
        icon: $icon('045', $color('white'), $size(25, 25))
      },
      layout: (make, view) => {
        make.size.equalTo($size(40, 40))
        make.right.equalTo(view.super).offset(-80)
        make.bottom.equalTo(view.prev.prev).offset(-30)
      },
      events: {
        tapped: async sender => {
          let t = await $input.text({
            placeholder: "URL, profile to show diff",
            text: $cache.get(DIFF_URL) || ''
          })
          if (!t) return
          $cache.set(DIFF_URL, t)
          let resp = await $http.get(t)
          let diff = new Diff()
          let d = diff.main(resp.data.replace(/\r\n/g, '\n'),$cache.get(TEXT).replace(/\r\n/g, '\n'))
          diff.cleanupSemantic(d)
          // console.log(diff.prettyHtml(d))
          $ui.push({
            props: {
              title: "DIFF"
            },
            views: [{
              type: 'web',
              props: {
                id: '',
                script: () => {
                  let btn = document.getElementsByClassName('button')[0]
                  let content = document.getElementsByClassName('content')[0]
                  btn.onclick = () => {
                    $notify("save", content.innerText)
                    return false
                  }
                },
                html: `<html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <style>
                            html, body {
                              font-family: "lucida grande", "lucida sans unicode", lucida, helvetica, "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
                              font-size: 14px;
                              overflow: hidden;
                              overflow-y: auto;
                              word-break: break-all;
                              white-space: normal;
                            }
                            ins {
                              text-decoration: none;
                              background-color: #ccffcc;
                            }
                            del {
                              text-decoration: none;
                              color: #fff;
                              background-color: #e32727;
                            }
                            .button {
                              position: fixed;
                              bottom: 50px;
                              right: 30px;
                              width: 80px;
                              height: 40px;
                              background-color: #498bf6;
                              text-align: center;
                              color: #fff;
                              font-size: 1.2em;
                              border-radius: 5px;
                              line-height: 40px;
                              box-shadow: 0px 0px 6px #a6a5a4;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="content">
                            ${diff.prettyHtml(d)}
                          </div>

                          <div class="button">Save</div>

                          <script type="text/javascript">
                            window.onload = () => {
                              let insEles = document.getElementsByTagName("ins");
                              for (let i=0; i<insEles.length; i++) {
                                insEles[i].onclick = (event) => {
                                  var source = event.target || event.srcElement
                                  source.parentNode.removeChild(source)
                                  return false
                                }
                              }

                              let delEles = document.getElementsByTagName("del");
                              for (let i=0; i<delEles.length; i++) {
                                delEles[i].onclick = (event) => {
                                  var source = event.target || event.srcElement
                                  source.parentNode.removeChild(source)
                                  return false
                                }
                              }
                            }
                          </script>
                        </body>
                      </html>`
              },
              layout: $layout.fill,
              events: {
                save: content => {
                  $ui.alert({
                    title: "Warning",
                    message: "Are you sure to overwrite the profile?",
                    actions: [{
                      title: "Yes",
                      handler: () => {
                        $('basicConfView').text = content
                        $cache.set(TEXT, content)
                        $ui.pop()
                      }
                    }, {
                      title: "No"
                    }]
                  })
                }
              }
            },]
          })
        }
      },
      views: []
    },]
  })
}

let renderSubscrptionUI = () => {
  $ui.push({
    props: {
      title: "SUBSCRIPTIONS",
    },
    views: [{
      type: 'list',
      props: {
        id: 'subscriptionListView',
        data: $cache.get(SUBS) || [],
        reorder: true,
        actions: [{
          title: 'delete',
          handler: (sender, indexPath) => {
            // sender.delete(indexPath)
            $cache.set(SUBS, $('subscriptionListView').data)
          }
        }]
      },
      layout: $layout.fill,
      events: {
        reorderFinished: data => {
          $cache.set(SUBS, data)
        },
        didSelect: async (sender, indexPath, data) => {
          let t = await $input.text({
            text: data
          })
          if (!t) return

          let d = sender.data
          d[indexPath.row] = t
          sender.data = d
          $cache.set(SUBS, d)
        }
      },
      views: []
    }, {
      type: 'button',
      props: {
        id: '',
        bgcolor: $color("#fff"),
        radius: 20,
        icon: $icon('104', $color('tint'), $size(40, 40))
      },
      layout: (make, view) => {
        make.right.equalTo(view.super).offset(-30)
        make.bottom.equalTo(view.super).offset(-50)
      },
      events: {
        tapped: async sender => {
          let t = await $input.text({
            placeholder: "URL"
          })
          if (!t) return
          let d = $('subscriptionListView').data
          d.push(t)
          $cache.set(SUBS, d)
          $('subscriptionListView').data = d
        }
      },
      views: []
    },]
  })
}

let handleMainViewAppeared = () => {
  let t = $cache.get(TEXT)
  if (!t) return
  let lines = t.split('\n').filter(l => !/^\s*(#|\/\/)/.test(l))
  let policies = []
  lines.forEach(l => {
    if (/(.+?)=\s*(url-test|select|fallback|ssid)\s*,(.+)/.test(l)) {
      let name = RegExp.$1.trim()
      let type = RegExp.$2
      let others = RegExp.$3
      if (/policy\-path\s*=\s*http/.test(others) || type === "ssid") {
        policies.push({
          name,
          type,
          raw: l
        })
      } else if (type === 'select') {
        policies.push({
          name,
          type,
          proxies: others.split(',').map(i => i.trim())
        })
      } else if (type === 'fallback' || type === 'url-test') {
        let os = others.split(',').map(i => i.trim())
        let proxies = []
        let url = 'http://www.gstatic.com/generate_204'
        let interval = 200
        os.forEach(o => {
          if (/url\s*=\s*(http.+)/.test(o)) {
            url = RegExp.$1.trim()
          } else if (/interval\s*=\s*(\d+)/.test(o)) {
            interval = RegExp.$1 * 1
          } else {
            proxies.push(o)
          }
        })
        policies.push({
          name,
          type,
          proxies,
          url,
          interval
        })
      }
    }
  })
  $('policyMenuView').items = policies.map(p => p.name)
  $cache.set(POLICIES, policies)
  $cache.set(TEXT_PROXIES, parseProxies(t, true).map(p => p.name))
  handleMenuChange({ index: $('policyMenuView').index })

}

let handleMenuChange = async sender => {
  let idx = sender.index
  let policies = $cache.get(POLICIES)

  let editable = policies[idx].hasOwnProperty('proxies')

  let viewGroup = ['labelTop', 'labelBottom', 'line1', 'line2', 'line3', 'line4', 'existListView', 'allListView']
  viewGroup.forEach(v => {
    $('mainView').get(v).hidden = !editable
  })
  $("hint").hidden = editable

  if (!editable) {
    $('existListView').data = []
    $('allListView').data = []
    return
  }

  let existProxies = policies[idx].proxies
  let psns = getAllProxyNames()

  $('existListView').data = existProxies.map(ep => {
    return {
      name: {
        text: ep,
        textColor: isPolicyExist(ep) ? $color('black') : $color("red")
      }
    }
  })

  $('allListView').data = psns.filter(p => {
    if (existProxies.find(ep => ep === p)) {
      return false
    }
    return true
  }).map(p => {
    return {
      name: {
        text: p
      }
    }
  })
}

let getAllProxyNames = () => {
  let ps = $cache.get(PROXIES) || []
  let policies = $cache.get(POLICIES)
  let originNames = $cache.get(TEXT_PROXIES)
  return originNames.concat(ps.map(p => p.name).concat(policies.map(p => p.name)).concat(['DIRECT', 'REJECT', 'REJECT-TINYGIF']))
}

let isPolicyExist = (name) => {
  let psns = getAllProxyNames()
  return psns.find(ps => ps === name) !== undefined
}

let handleSubsUpdate = async () => {
  $ui.loading(true)
  let subs = $cache.get(SUBS)
  let resps = await Promise.all(subs.map(s => $http.get({
    url: s,
    timeout: $prefs.get('updateTimeout')
  })))
  let failedUrls = []
  resps.forEach((resp, idx) => {
    if (resp.error || resp.response.statusCode !== 200) {
      failedUrls.push(subs[idx])
    }
  })
  if (failedUrls.length > 0) {
    $ui.alert({
      title: 'Update Failed',
      message: failedUrls.join('\n\n')
    })
  }
  $ui.loading(false)
  let proxies = resps.map(resp => parseProxies(resp.data)).reduce((prev, cur) => prev.concat(cur), [])
  let oldProxies = $cache.get(PROXIES) || []
  let newProxies = proxies.filter(p => oldProxies.find(o => o.name === p.name) === undefined)
  if (newProxies.length > 0) {
    $ui.alert({
      title: 'New Proxies',
      message: newProxies.map(p => p.name).join('\n')
    })
  }
  $cache.set(PROXIES, proxies)
  handleMenuChange({ index: $('policyMenuView').index })
}

let parseProxies = (raw, alias = false) => {
  let proxies = []
  let lines = raw.split('\n').filter(l => !/^\s*(#|\/\/)/.test(l))
  lines.forEach(l => {
    if (/(.+?)=\s*(ss|custom|http|sorcks5|snell|vmess)\s*,/.test(l)) {
      proxies.push({
        name: RegExp.$1.trim(),
        raw: l
      })
    } else if (alias && /(.+?)=\s*(direct|reject|reject-tinygif)\s*$/.test(l)) {
      proxies.push({
        name: RegExp.$1.trim(),
        raw: l
      })
    }
  })
  return proxies
}

let policyStringify = (policies) => {
  let lines = []
  policies.forEach(ps => {
    if (ps.hasOwnProperty('raw')) {
      lines.push(ps.raw)
    } else if (ps.type === 'select') {
      lines.push(`${ps.name} = select, ${ps.proxies.join(', ')}`)
    } else {
      lines.push(`${ps.name} = ${ps.type}, ${ps.proxies.join(', ')}, interval=${ps.interval}, url=${ps.url}`)
    }
  })
  return lines.join('\n\n')
}

let filePartReg = name => {
  let reg = `(\\[${name}\\])([\\S\\s]*?)(\\[General\\]|\\[Replica\\]|\\[Proxy\\]|\\[Proxy Group\\]|\\[Rule\\]|\\[Host\\]|\\[URL Rewrite\\]|\\[Header Rewrite\\]|\\[SSID Setting\\]|\\[MITM\\]|\\[URL-REJECTION\\]|\\[HOST\\]|\\[POLICY\\]|\\[REWRITE\\]|\\[Script\\]|$)`
  return new RegExp(reg)
}

let saveConf = (od) => {
  let reg = filePartReg('Proxy Group')
  let text = $cache.get(TEXT)
  text = text.replace(reg, `$1\n${policyStringify(od)}\n\n$3`)
  $cache.set(TEXT, text)
}

let generateConf = async _ => {
  // Check before generate
  let policies = $cache.get(POLICIES)
  for (let i = 0; i < policies.length; i++) {
    if (policies[i].hasOwnProperty('raw')) continue
    for (let j = 0; j < policies[i].proxies.length; j++) {
      let node = policies[i].proxies[j]
      if (!isPolicyExist(node)) {
        $ui.toast('Proxy not exist')
        $('policyMenuView').index = i
        handleMenuChange({ index: i })
        $('existListView').scrollTo({
          animated: true,
          indexPath: $indexPath(0, j)
        })
        $device.taptic(2)
        return
      }
    }
  }

  const filename = $prefs.get('filename')
  let proxies = $cache.get(PROXIES)
  let raw = proxies.map(p => p.raw).join('\n\n')
  let t = $cache.get(TEXT)
  t = t.replace(filePartReg('Proxy'), `$1$2\n${raw}\n$3`)

  let exportWith = $prefs.get('export')
  if (exportWith === 0) {
    $share.sheet([filename, $data({ string: t })])
  } else {
    const SCHEMES = ["surge3", "surge", "surge-enterprise"]
    const schemeIdx = $prefs.get("scheme")
    let server = $server.new()
    server.addHandler({
      response: _ => {
        return {
          type: "data",
          props: {
            text: t
          }
        }
      }
    })
    let randomPort = Math.round(Math.random() * 30000 + 30000)
    server.start({ port: randomPort })
    let serverUrl = `http://127.0.0.1:${randomPort}/${filename}`
    let testResp = await $http.get(serverUrl)
    if (testResp.response.statusCode === 200) {
      let surgeScheme = `${SCHEMES[schemeIdx]}:///install-config?url=${encodeURIComponent(serverUrl)}`
      $app.openURL(surgeScheme)
      $app.listen({
        resume: () => {
          server && server.stop()
        }
      })
    } else {
      $ui.alert('Server Error, please try again or use Share Sheet to export!')
    }

    $delay(10, () => {
      server && server.stop()
    })
  }
}

module.exports = {
  renderUI
}