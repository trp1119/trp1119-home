console.log(typeof null) // object
console.log(typeof []) // object
console.log(typeof new RegExp(/A/)) // object
console.log(typeof function () {}) // function

console.log(Object.prototype.toString.call(null)) // [object Null]
console.log(Object.prototype.toString.call([])) // [object Array]
console.log(Object.prototype.toString.call(new RegExp(/A/))) // [object RegExp]
console.log(Object.prototype.toString.call(function () {})) // [object Function]

// Object.prototype.toString.call 只能校验已经存在的类型，不支持自定义类型
// 例如：
class A {}
const a = new A()
console.log(Object.prototype.toString.call(a)) // [object Object]，但实际上 a 的 类型为 A

// 为了支持校验自定义类型，可以使用 instanceof
console.log(a instanceof A) // true
console.log([] instanceof Array) // true
console.log([] instanceof Object) // true
// 相当于
console.log([].__proto__ === Array.prototype) // true
console.log([].__proto__.__proto__ === Object.prototype) // true
// 基于此，自己实现 instanceof
function _instanceof (A, B) {
  A = A.__proto__
  B = B.prototype
  while (true) {
    if (A === null) { // Object.prototype.__proto__ === null
      return false
    }
    if (A === B) {
      return true
    }
    A = A.__proto__
  }
}

console.log(_instanceof(a, A)) // true
console.log(_instanceof(a, Object)) // true
console.log(_instanceof(a, Array)) // false

// 缺陷，instanceof 无法校验基础数据类型
console.log('str' instanceof String) // false，应为 true
// instanceof 默认会调用 String 的 Symbol.hasInstance 方法进行校验，所以上述写法等价于
console.log(String[Symbol.hasInstance]('str')) // false
// 所以，可以对 Symbol.hasInstance 进行重写
class ValidateStr {
  static [Symbol.hasInstance] (x) {
    return typeof x === 'string'
  }
}
console.log(ValidateStr[Symbol.hasInstance]('str')) // true
console.log('str' instanceof ValidateStr) // true