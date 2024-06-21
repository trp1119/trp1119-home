function Animal (type) {
  this.type = type // 实例属性

  // return 'zhangsan'

  return {
    name: 'zhangsan' // 如果构造函数返回的是引用类型，则需要将这个引用对象返回，即 animal = { name: 'zhangsan' }
  }
}

// 原型方法
Animal.prototype.say = function () {
  console.log('say') // 公共属性
}

/**
 * 使用 mockNew 返回对象
 */
function mockNew () {
  const Constructor = [].shift.call(arguments) // 去除数组第一项，剩余 arguments 就是其他参数
  const obj = {} // 返回的结果。不能写 Object.create(null)，因为这样不会产生原型链
  obj.__proto__ = Constructor.prototype // 继承原型上的方法
  let r = Constructor.apply(obj, arguments) // 执行构造函数以绑定实例属性

  return r instanceof Object ? r : obj
}

// const animal = new Animal('哺乳类')
const animal = mockNew(Animal, '哺乳类') // 类与类中属性
console.log(animal)

console.log(animal.type) // 哺乳类
animal.say() // say