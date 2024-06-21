---
category:
  - 前端
tag:
  - 珠峰架构
---

# 模拟 new

## 1.使用

ES5 中通过类模拟构造函数，构造函数可以接收属性

```js
function Animal (type) {
  this.type = type // 实例属性
}

// 原型方法
Animal.prototype.say = function () {
  console.log('say') // 公共属性
}

const animal = new Animal('哺乳类')

console.log(animal.type) // 哺乳类
animal.say() // say
```

## 2.原型图

实例 animal 含有 `__proto__` 属性，指向所属类的原型。原型上还有构造函数 constructor 属性，指向动物类 Animal。

<img src="/Users/haohaiyou/Library/Application Support/typora-user-images/image-20240607184438392.png" alt="image-20240607184438392" style="zoom:50%;" />

## 3.实现

通过一个类 Animal，产生一个对象 animal，并可以拿到实例属性 type 与原型属性 say。

```js
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
```

















