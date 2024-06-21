---
category:
  - 前端
  - Promise
tag:
  - 珠峰架构
---

# 从 0 开始，手写完整的 Promise 原理


## 1. 高阶函数

### 1.1 什么是高阶函数？

- 将函数作为返回值

  ```js
  (function () {
    return function () {}
  })()
  ```

- 将函数作为参数

  ```js
  function fn (cb) { cb() }
  ```

两个条件满足一个即为高阶函数，promise 内部也是回调函数（内部包含着高阶函数）

### 1.2 高阶函数应用

#### 1.2.1 扩展方法

给 `core` 增加一些额外的逻辑，但不能更改核心代码。

> AOP (面向切面编程)的主要作用是把一些与核心业务逻辑模块无关的功能抽离出来，其实就是给原函数增加一层。不管原函数内部的实现。

```js
function core (...args) { // 核心代码
  // xxx 额外代码
  console.log('core', ...args)
  // xxx 额外代码
}

Function.prototype.before = function (cb) {
  return (...args) => { // 剩余运算符，将参数转化为数组
    console.log(args) // ['a', 'b']
    cb()
    this(...args) // this === core // 扩展运算符
  }
}

const newCore = core.before(() => {
  console.log('before')
})

// newCore === (cb) => { return () => { cb(); this() } }
newCore('a', 'b') // before    core a b
```

> **题外话：**函数的定义有作用域的概念，一个函数定义的作用域与其执行的作用域不同，必定会产生闭包。
>
> ```js
> function a () { return function b () {} }
> b()
> ```

#### 1.2.2 函数柯里化

对于多个参数的传入，将其转化为多个函数，可以暂存变量。

```js
function fn (a, b, c) {}
fn('a', 'b', 'c')

function CurryingFn (a) {
  return function (b) { // function (b, c) {} // 一般柯里化函数只有一个参数，多个参数为偏函数
    return function (c) {}
  }
}
const fnB = CurryingFn('a')
const fnc = fn1('b')
const returnC = fn2('c')
```

函数柯里化举例：

```js
function curring (fn, args = []) {
  console.log(fn.length) // 4 函数的 length 为参数
  const length = fn.length
  return (..._) => {
    const arg = args.concat(_)
    if (arg.length < length) {
      return curring(fn, arg) // 递归返回函数
    }
    return fn(...arg)
  }
}

function add (a, b, c, d) {
  return a + b + c +d
}

const res = curring(add)(1)(2, 3)(4, 5)
console.log(res) // 10
```

类型判断：

```js
function checkType (type) {
  return function (content) {
    return Object.prototype.toString.call(content) === `[object ${type}]`
  }
}

const util = {}
const types = ['String', 'Number', 'Boolean']
types.forEach(type => {
  util[`is${type}`] = checkType(type)
})
console.log(util)
```

类型判断（柯里化）：

```js
function curring (fn, args = []) {
  const length = fn.length
  return (..._) => {
    const arg = args.concat(_)
    if (arg.length < length) {
      return curring(fn, arg)
    }
    return fn(...arg)
  }
}

function checkType (type, content) {
  return Object.prototype.toString.call(content) === `[object ${type}]`
}

const util = {}
const types = ['String', 'Number', 'Boolean']
types.forEach(type => {
  util[`is${type}`] = curring(checkType)(type)
})
console.log(util)
```

#### 1.2.3 并发问题

请求数据，多个接口等待数据返回后，再渲染页面。

```js
// 两个 setTimeout 都执行完毕后再执行后续操作

// 缺陷：引入了全局变量 arr，固定了数量 2

const arr = []

const out = () => {
  if (arr.length === 2) {
    console.log(arr)
  }
}

setTimeout(() => {
  arr.push(500)
  out()
}, 500)

setTimeout(() => {
  arr.push(1000)
  out()
}, 1000)
```

柯里化：

```js
const after = (times, fn) => {
  const arr = []
  return (data) => {
    arr.push(data)
    if (--times === 0) {
      fn(arr)
    }
  }
}

const out = after(2, (arr) => {
  console.log(arr)
})

setTimeout(() => {
  out(500)
}, 500)

setTimeout(() => {
  out(1000)
}, 1000)
```

## 2. 发布订阅模式

将多个方法先暂存，再依次执行。

```js
/**
* 事件中心
*/
const events = {
  _events: [],
  on (fn) {
    this._events.push(fn)
  },
  emit (data) {
    this._events.forEach(fn => fn(data))
  }
}

// 订阅有顺序，可以采用数组控制
events.on(() => console.log('每读取一次，就触发一次'))
const arr = []
events.on(data => {
  console.log('加入数据', data)
  arr.push(data)
})
events.on(data => {
  if (arr.length === 2) {
    console.log('读取完毕', arr)
  }
})

setTimeout(() => {
  events.emit(500)
}, 500)

setTimeout(() => {
  events.emit(1000)
}, 1000)

// 每读取一次，就触发一次
// 加入数据 500
// 每读取一次，就触发一次
// 加入数据 1000
// 读取完毕 [500, 1000]
```

## 3. 观察者模式

观察者模式基于发布订阅模式。

```js
/**
 * 被观察者的类
 * 被观察着需要将观察者收集起来
 */
class Subject {
  constructor (name) {
    this.name = name
    this.state = '非常开心'
    this.observers = []
  }

  attach (o) {
    this.observers.push(o)
  }

  setState (newState) {
    this.state = newState
    this.observers.forEach(o => o.update(this.name, this.state))
  }
}

/**
 * 观察者
 */
class Observer {
  constructor (name) {
    this.name = name
  }

  update (name, state) {
    console.log(`${this.name}: ${name}当前${state}了`)
  }
}

const s = new Subject('小宝宝')
const o1 = new Observer('爸爸')
const o2 = new Observer('妈妈')
s.attach(o1)
s.attach(o2)
s.setState('不开心')
s.setState('开心')

// 爸爸: 小宝宝当前不开心了
// 妈妈: 小宝宝当前不开心了
// 爸爸: 小宝宝当前开心了
// 妈妈: 小宝宝当开心了
```

## 4. promise 基本实现

promise 还是基于回调的 es6-promise。

- promise 是一个类。
- 使用 promise 时，传入一个执行器 executor，此执行器立即执行。
- executor 参数为 resolve/reject 两个函数描述 promise 状态，promise 有 等待态/成功态/失败态 三种状态。默认为等待态，如果调用 resolve 会变为成功态，调用 reject 或发生异常会变为失败态。
- 每个 promise 实例都有一个 then 方法。
- promise 一旦状态发生改变则不能更改。

```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class PolyfillPromise {
  constructor (executor) {
    this.status = PENDING // promise 默认状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    // 成功 resolve 函数
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED // 修改状态
      }
    }
    // 失败 reject 函数
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED // 修改状态
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    if (this.status === FULFILLED) { // 成功调用成功方法
      onFulfilled(this.value)
    }
    if (this.status === REJECTED) { // 失败调用失败方法
      onRejected(this.reason)
    }
  }
}

const promise = new PolyfillPromise((resolve, reject) => {
  console.log('promise')
  resolve()
  reject()
  throw new Error('失败了')
})

promise.then((value) => {
  console.log('成功', value)
}, (reason) => {
  console.log('失败', reason)
})

console.log('ok')
```

## 5. promise 多个成功失败回调实现

发布订阅模式

```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class PolyfillPromise {
  constructor (executor) {
    this.status = PENDING // promise 默认状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    this.onResolvedCallbacks = [] // 存放成功的回调
    this.onRejectedCallbacks = [] // 存放失败的回调
    // 成功 resolve 函数
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED // 修改状态
        // 发布模式
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    // 失败 reject 函数
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED // 修改状态
        // 发布模式
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    if (this.status === PENDING) { // 代码为异步调用 resolve 或 rejected
      // 订阅模式
      this.onResolvedCallbacks.push(() => { // AOP 切片编程（将函数切开放入自己内容）
        onFulfilled(this.value)
      })
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
    if (this.status === FULFILLED) { // 成功调用成功方法
      onFulfilled(this.value)
    }
    if (this.status === REJECTED) { // 失败调用失败方法
      onRejected(this.reason)
    }
  }
}

const promise = new PolyfillPromise((resolve, reject) => {
  console.log('promise')
  setTimeout(() => {
    resolve()
    reject()
    // throw new Error('失败了')
  }, 1000)
})

// 发布订阅
// 上述采用 setTimeout 延时变更 resolve 与 reject。当用户调用 then 方法时，promise 仍为等待态。需要先暂存起来，后续调用 resolve 与 reject 时，再触发对应的 onFulfilled 或 onRejected
promise.then((value) => {
  console.log('成功1', value)
}, (reason) => {
  console.log('失败2', reason)
})

// 发布订阅
// 多次调用 then，有多个 onFulfilled 或 onRejected 需要触发
promise.then((value) => {
  console.log('成功1', value)
}, (reason) => {
  console.log('失败2', reason)
})

console.log('ok')
```

## 6. promise 链式调用实现

promise 的链式调用，当调用 then 方法后会返回一个新的 promise。

- then 中方法返回普通值（不是 promise），会作为外层下一次 then 的成功结果。无论上一次 then 成功还是失败，只要 return 普通值，都会执行下一次 then 的成功。
- then 中方法执行出错，会作为外层下一次 then 的失败结果。
- then 方法中返回 promise，会根据 promise 结果处理走成功还是失败，见7。

```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class PolyfillPromise {
  constructor (executor) {
    this.status = PENDING // promise 默认状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    this.onResolvedCallbacks = [] // 存放成功的回调
    this.onRejectedCallbacks = [] // 存放失败的回调
    // 成功 resolve 函数
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED // 修改状态
        // 发布模式
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    // 失败 reject 函数
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED // 修改状态
        // 发布模式
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    const _promise = new PolyfillPromise((resolve, reject) => {
      // 成功调用成功方法
      if (this.status === FULFILLED) {
        try {
          const x = onFulfilled(this.value)
          resolve(x)
        } catch (e) {
          reject(e)
        }
      }
      // 失败调用失败方法
      if (this.status === REJECTED) {
        try {
          const x = onRejected(this.reason)
          resolve(x)
        } catch (e) {
          reject(e)
        }
      }
      // 代码为异步调用 resolve 或 rejected
      if (this.status === PENDING) {
        // 订阅模式
        this.onResolvedCallbacks.push(() => { // AOP 切片编程（将函数切开放入自己内容）
          try {
            const x = onFulfilled(this.value)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
        this.onRejectedCallbacks.push(() => {
          try {
            const x = onRejected(this.reason)
            resolve(x)
          } catch (e) {
            reject(e)
          }
        })
      }
    })
    return _promise
  }
}

const promise = new PolyfillPromise((resolve, reject) => {
  resolve(0)
}).then(data => {
  console.log('1', data) // 1 0
  return data
}).then(data => {
  console.log('2', data) // 2 0
  return data
})
```

## 7. promise 返回结果的处理

resolvePromise 方法，利用返回结果 x 值判断调用 promise 的 resolve / reject或是普通值。

```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

/**
 * 利用 x 值判断调用 promise 的 resolve / reject
 */
function resolvePromise (promise, x, resolve, reject) {
  // ① 返回值不能是当前 promise
  if (promise === x) {
    reject(new TypeError('chaining cycle detected for promise'))
  }
  // ② 是否是 promise
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // ③ 兼容其他规范的 promise，别人的 promise 状态可能是可变的，成功后还能变为失败。需使用 called 进行锁控制，保证只能调用一次
    let called = false
    try {
      const then = x.then
      if (typeof then === 'function') { // 是 promise
        then.call(x, y => {
          if (called) return
          called = true
          resolve(y)
        }, r => {
          if (called) return
          called = true
          reject(r)
        }) // === x.then() 但 x.then 这样写会会触发 getter，仍有可能异常，例如 let index = 0; const p = {}; Object.defineProperty(p, 'then', { get () { if (++index === 2) { throw new Error(); } } }); 虽然第一次 p.then 没有进入下方 reject，但第二次的时候报错了。所以这里直接使用已取出的值 const then = x.then
      } else {
        // {} 或 { then: xxx }
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e) // const p = {}; Object.defineProperty(p, 'then', { get () { throw new Error(); } });
    }
  } else {
    // 普通值
    resolve(x)
  }
}

class PolyfillPromise {
  constructor (executor) {
    this.status = PENDING // promise 默认状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    this.onResolvedCallbacks = [] // 存放成功的回调
    this.onRejectedCallbacks = [] // 存放失败的回调
    // 成功 resolve 函数
    const resolve = (value) => {
      if (value instanceof PolyfillPromise) { // 兼容 resolve promise，不需要处理 reject
        return value.then(resolve, reject)
      }
     
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED // 修改状态
        // 发布模式
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    // 失败 reject 函数
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED // 修改状态
        // 发布模式
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    const _promise = new PolyfillPromise((resolve, reject) => {
      // 成功调用成功方法
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(_promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      // 失败调用失败方法
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(_promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      // 代码为异步调用 resolve 或 rejected
      if (this.status === PENDING) {
        // 订阅模式
        this.onResolvedCallbacks.push(() => { // AOP 切片编程（将函数切开放入自己内容）
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value)
              resolvePromise(_promise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason)
              resolvePromise(_promise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return _promise
  }
}

const promise = new PolyfillPromise((resolve, reject) => {
  resolve(1)
}).then(() => {
  // return promise // ①
  // ②
  return new PolyfillPromise((resolve, reject) => {
    resolve('success')
    // reject('error')
  })
}, () => {
  return 'err'
})

promise.then(data => {
  console.log(data)
}, err => {
  console.log(err)
})

const _promise = new PolyfillPromise((resolve, reject) => {
  resolve(new PolyfillPromise((resolve) => { // resolve promise，需等待 promise 处理结束，返回此 promise resolve 结果
    resolve(100)
  }))
})

_promise.then(data => {
  console.log(data) // 100
})
```

## 8. promise 值的穿透

 onFulfilled, onRejected 为可选参数，不传时需通过 then 链向下穿透传递数据。

```js
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

/**
 * 利用 x 值判断调用 promise 的 resolve / reject
 */
function resolvePromise (promise, x, resolve, reject) {
  // ① 返回值不能是当前 promise
  if (promise === x) {
    reject(new TypeError('chaining cycle detected for promise'))
  }
  // ② 是否是 promise
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // ③ 兼容其他规范的 promise，别人的 promise 状态可能是可变的，成功后还能变为失败。需使用 called 进行锁控制，保证只能调用一次
    let called = false
    try {
      const then = x.then
      if (typeof then === 'function') { // 是 promise
        then.call(x, y => {
          if (called) return
          called = true
         resolvePromise(promise, y, resolve, reject) // promise 递归处理
        }, r => {
          if (called) return
          called = true
          reject(r)
        }) // === x.then() 但 x.then 这样写会会触发 getter，仍有可能异常，例如 let index = 0; const p = {}; Object.defineProperty(p, 'then', { get () { if (++index === 2) { throw new Error(); } } }); 虽然第一次 p.then 没有进入下方 reject，但第二次的时候报错了。所以这里直接使用已取出的值 const then = x.then
      } else {
        // {} 或 { then: xxx }
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e) // const p = {}; Object.defineProperty(p, 'then', { get () { throw new Error(); } });
    }
  } else {
    // 普通值
    resolve(x)
  }
}

class PolyfillPromise {
  constructor (executor) {
    this.status = PENDING // promise 默认状态
    this.value = undefined // 成功值
    this.reason = undefined // 失败原因
    this.onResolvedCallbacks = [] // 存放成功的回调
    this.onRejectedCallbacks = [] // 存放失败的回调
    // 成功 resolve 函数
    const resolve = (value) => {
      if (value instanceof PolyfillPromise) { // 兼容 resolve promise，不需要处理 reject
        return value.then(resolve, reject)
      }
  
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED // 修改状态
        // 发布模式
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    // 失败 reject 函数
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED // 修改状态
        // 发布模式
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then (onFulfilled, onRejected) {
    // onFulfilled, onRejected 为可选参数，不传时需通过 then 链向下穿透传递数据
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err }

    const _promise = new PolyfillPromise((resolve, reject) => {
      // 成功调用成功方法
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(_promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      } 
      // 失败调用失败方法
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(_promise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      // 代码为异步调用 resolve 或 rejected
      if (this.status === PENDING) {
        // 订阅模式
        this.onResolvedCallbacks.push(() => { // AOP 切片编程（将函数切开放入自己内容）
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value)
              resolvePromise(_promise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason)
              resolvePromise(_promise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return _promise
  }
}

const promise = new PolyfillPromise((resolve, reject) => {
  resolve(1)
}).then(() => {
  // return promise // ①
  // ②
  return new PolyfillPromise((resolve, reject) => {
    setTimeout(() => {
      // resolve(new Promise((resolve) => { // resolve 仍是 promise
      //   resolve('200')
      // }))
      reject('500')
    }, 500)
  })
}, () => {
  return 'err'
})

promise.then(data => {
  console.log('success', data) // success 200
}, error => {
  console.log('error', error) // error 500
})

promise.then().then().then().then().then(data => {
  console.log('success', data) // success 200
}, error => {
  console.log('error', error) // error 500
})
```

## 9. promise 规范测试

```shell
npm i promise-aplus-test
```



> 扩展：延迟对象
>
> ```js
> /**
>  * 延迟对象，减少一次套用
>  */
> 
> Promise.deferred = function () {
>   let dfd = {}
>   dfd.promise = new Promise((resolve, reject) => {
> 		dfd.resolve = resolve
> 		dfd.reject = reject
>   })
>   return dfd
> }
> 
> /**
>  * 普通写法
>  */
> function readFile (filePath, encoding) {
>   return new Promise((resolve, reject) => {
> 		fs.readFile(filePath, encoding, (err, data) => {
> 			if (err) return reject(err)
> 			resolve(data)
> 		})
> 	})
> }
> 
> /**
>  * 使用延迟对象写法
>  */
> 
> function readFile (filePath, encoding) {
>   let dfd = Promise.deferred()
> 
>   fs.readFile(filePath, encoding, (err, data) => {
>     if (err) return dfd.reject(err)
>     dfd.resolve(data)
>   })
> 
>   return dfd.promise
> }
> 
> readFile('./a.txt', 'utf8').then(data => {
>   console.log(data)
> })
> ```

## 10. promise 中的静态方法

### 10.1 Promise.resolve()

Promise.resolve() 会创建一个成功的 promise。

```js
class PolyfillPromise {
  // ...
  static resolve(value) {
    return new PolyfillPromise((resolve, reject) => {
      resolve(value)
    })
  }
}

PolyfillPromise.resolve(new PolyfillPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(200)
  }, 1000)
})).then(data => {
  console.log(data) // 200
})
```

### 10.2 Promise.reject()

Promise.reject() 会创建一个失败的 promise。

```js
class PolyfillPromise {
  // ...
  static reject(err) {
    return new PolyfillPromise((resolve, reject) => {
      reject(err)
    })
  }
}

PolyfillPromise.reject(new PolyfillPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(200)
  }, 1000)
})).then(data => {
  console.log(data) // 后打印 200
}, err => {
  console.log(err) // 先打印 PolyfillPromise {}
})
```

### 10.3 Promise.all()

Promise.all() 多个 promise 全部成功后获取结果，任意一个失败则这个 promise 失败，但其余仍会继续执行。

```js
class PolyfillPromise {
  // ...
    static all (promises) {
    return new PolyfillPromise((resolve, reject) => {
      let results = []
      let times = 0
    
      const processSuccess = (index, val) => {
        results[index] = val
        if (++times === promises.length) {
          resolve(results)
        }
      }

      for (let i = 0; i < promises.length; i++) {
        let p = promises[i]

        if (p && typeof p.then === 'function') {
          // promise 类型
          p.then(data => {
            processSuccess(i, data)
          }, reject) // 有一个 promise 失败，则直接执行失败
        } else {
          // 普通值
          processSuccess(i, p)
        }
      }
    })
  }
}

PolyfillPromise.all([1, 2, 3, new PolyfillPromise((resolve) => {
  setTimeout(() => {
    resolve('success')
  }, 1000)
})]).then(data => {
  console.log(data) // [1, 2, 3, 'success']
})

PolyfillPromise.all([1, 2, 3, new PolyfillPromise((resolve) => {
  setTimeout(() => {
    resolve('success')
  }, 1000)
}), new PolyfillPromise((resolve, reject) => {
  reject('fail')
})]).then(data => {
  console.log(data)
}, err => {
  console.log(err) // fail
})
```

> 扩展：promise.allSettled()

### 10.4 Promise.race()

Promise.race() 有一个成功或失败，就采用它的结果，其他仍会继续执行。只是不采用其结果。

常用作超时处理。

```js
class PolyfillPromise {
  // ...
  static race (promises) {
    return new PolyfillPromise((resolve, reject) => {    
      for (let i = 0; i < promises.length; i++) {
        let p = promises[i]

        if (p && typeof p.then === 'function') {
          // promise 类型
          p.then(data => {
            resolve(data)
          }, reject) // 有一个 promise 失败，则直接执行失败，但其余不会终止，仍会继续进行
        } else {
          // 普通值
          resolve(p)
        }
      }
    })
  }
}

const p1 = new PolyfillPromise(resolve => {
  setTimeout(() => {
    resolve('success')
  }, 500)
})

const p2 = new PolyfillPromise((resolve, reject) => {
  setTimeout(() => {
    reject('fail')
  }, 1000)
})

PolyfillPromise.race([p1, p2]).then(data => {
  console.log(data) // 'success'
}, err => {
  console.log(err)
})
```



## 11. promise catch 的实现

catch 是没有成功的 then，即 then(null, errorFn)，所以 catch 后可以继续 then。

```js
class PolyfillPromise {
  // ...
  catch (errorFn) {
    return this.then(null, errorFn)
  }
}

PolyfillPromise.resolve(new PolyfillPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(200)
  }, 1000)
})).then(data => {
  console.log(data) // 200
})

PolyfillPromise.reject(new PolyfillPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(200)
  }, 1000)
})).then(data => {
  console.log(data) // 后打印 200
}).catch( err => {
  console.log(err) // 先打印 PolyfillPromise {}
})
```

## 11. Promise.all 的实现



