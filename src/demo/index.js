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

  static resolve(value) {
    return new PolyfillPromise((resolve, reject) => {
      resolve(value)
    })
  }

  static reject(err) {
    return new PolyfillPromise((resolve, reject) => {
      reject(err)
    })
  }

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
          }, reject) // 有一个 promise 失败，则直接执行失败，但其余不会终止，仍会继续进行
        } else {
          // 普通值
          processSuccess(i, p)
        }
      }
    })
  }

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

  catch (errorFn) {
    return this.then(null, errorFn)
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

PolyfillPromise.resolve(1)
.then(res=>222)
.catch(err=>3)
.then(res=>console.log(res));