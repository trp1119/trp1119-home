const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile) // 将 readFile 包装为 promise

function *read () {
  // 读取不再有回调形式
  let data = yield readFile('./a.txt', 'utf-8') // data 为 promise
  data = yield readFile(data, 'utf-8')
  return data
}

// 使用复杂
const iterator = read()
const { value, done } = iterator.next() // value 为 a.txt 内容 promise
value.then(data => {
  const { value, done } = iterator.next(data) // 此 data 作为第一次 yield 的结果 data
  value.then(data => { // value 为 b.txt 内容 promise
    const { value, done } = iterator.next(data) // 此 data 作为第二次 yield 的结果 data
    console.log(value, done) // b, true
  })
})

function co (iterator) {
  return new Promise(resolve => {
    // 同步迭代可以用 for，while，do while，但异步迭代只能用递归
    function next (data) {
      let { value, next } = iterator.next(data)
      if (done) {
        resolve(value)
      } else {
        // 原生的 Promise 有优化，如果原来是 promise，则直接返回，否则包装为 promise
        Promise.resolve(value).then(next)
      }
    }
    next()
  })
}