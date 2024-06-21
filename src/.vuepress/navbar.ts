import { navbar } from "vuepress-theme-hope";

export default navbar([
  '/',
  {
    text: '前端',
    icon: 'html',
    prefix: '/fe/',
    children: [
      {
        text: '源码',
        children: [
          {
            text: 'Vue2源码',
            link: 'Vue2源码/'
          },
          {
            text: 'Vue3源码',
            link: 'Vue3源码/'
          },
          {
            text: 'React源码',
            link: 'React源码/'
          },
          {
            text: 'Promise源码',
            link: 'Promise源码/'
          },
        ]
      }
    ]
  },
  {
    text: '后端',
    icon: 'nodeJS',
    prefix: '/be/',
    children: [
      {
        text: '源码',
        children: [
          {
            text: 'Node源码',
            link: 'Node源码/'
          },
          {
            text: 'Express源码',
            link: 'Express源码/'
          },
          {
            text: 'Koa源码',
            link: 'Koa源码/'
          },
        ]
      }
    ]
  },
  {
    text: '计算机',
    icon: 'code',
    prefix: '/base/',
    children: []
  },
  {
    text: '笔记',
    icon: 'write',
    link: '/note/',
  },
  {
    text: "最近更新",
    icon: "cycle",
    link: "/update.md",
  },
  // {
  //   text: "博文",
  //   icon: "pen-to-square",
  //   prefix: "/posts/",
  //   children: [
  //     {
  //       text: "苹果",
  //       icon: "pen-to-square",
  //       prefix: "apple/",
  //       children: [
  //         { text: "苹果1", icon: "pen-to-square", link: "1" },
  //         { text: "苹果2", icon: "pen-to-square", link: "2" },
  //         "3",
  //         "4",
  //       ],
  //     },
  //     {
  //       text: "香蕉",
  //       icon: "pen-to-square",
  //       prefix: "banana/",
  //       children: [
  //         {
  //           text: "香蕉 1",
  //           icon: "pen-to-square",
  //           link: "1",
  //         },
  //         {
  //           text: "香蕉 2",
  //           icon: "pen-to-square",
  //           link: "2",
  //         },
  //         "3",
  //         "4",
  //       ],
  //     },
  //     { text: "樱桃", icon: "pen-to-square", link: "cherry" },
  //     { text: "火龙果", icon: "pen-to-square", link: "dragonfruit" },
  //     "tomato",
  //     "strawberry",
  //   ],
  // },
  // {
  //   text: "V2 文档",
  //   icon: "book",
  //   link: "https://theme-hope.vuejs.press/zh/",
  // },
]);
