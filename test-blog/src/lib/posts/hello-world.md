---
title: "Hello World!"
description: "测试文章"
pubDate: "2026-04-12"
tags: ["Test"]
category: "测试"
icon: "fa-solid fa-paw"
iconColor: "#ff6b6b"
wordCount: 2576
---

# 欢迎使用 zym2013 的博客

呃呃呃，还有亿亿亿点东西没写完。

这是一个支持 **Markdown**、$\LaTeX$ 公式和代码高亮的博客系统。

为什么没有自定义组件呢？因为样式还没写……

## 数学公式 (KaTeX)

行内公式：$E = mc^2$

块级公式：
$$
\int_{a}^{b} f(x) dx = F(b) - F(a)
$$

矩阵示例：
$$
\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}
$$

## 代码高亮 (Shiki)

```cpp [Hello World]
# include <bits/stdc++.h>
# define ny(x) q_pow((x) , p - 2 , p)
using namespace std;
typedef long long LL;
LL x , y , a , b;
int p;
unordered_map <LL , LL> mp;
LL q_pow(LL x , LL y , int p)
{
	LL res = 1;
	while(y)
	{
		if(y & 1) (res *= x) %= p;
		(x *= x) %= p;
		y >>= 1;
	}
	return res;
}
LL exgcd(LL a , LL b , LL& x , LL& y)
{
	if(!b) return x = 1 , y = 0 , a;
	LL g = exgcd(b , a % b , y , x);
	y -= a / b * x;
	return g;
}
LL BSGS(LL a , LL b , int p)
{
    b %= p;
    if(b == 1) return 0;
    mp.clear() , mp[b] = 0;
    LL hl = sqrt(p) + 1;
    for(int i = 1 ; i < hl ; i ++) mp[(b *= a) %= p] = i;
    b = 1;
    for(int i = 1 ; i <= hl ; i ++) (b *= a) %= p;
    LL n = 1;
    for(int i = 1 ; i <= hl ; i ++)
    {
        if(mp.count((n *= b) %= p)) return i * hl - mp[n];
    }
    return -1;
}
LL exBSGS(LL a , LL b , int p)
{
    a %= p , b %= p;
    if(b == 1 || p == 1) return 0;
    LL g = __gcd(a , (LL)p) , A = 1 , cnt = 0;
    while(g > 1)
    {
        if(b % g) return -1;
        cnt ++;
        b /= g , p /= g , A = A * a / g % p;
        if(A == b) return cnt;
        g = __gcd(a , (LL)p);
    }
    exgcd(A , p , x , y);
    x = (x + p) % p;
    (b *= x) %= p;
    LL req = BSGS(a , b , p);
    return (req < 0 ? -1 : req + cnt);
}
void solve()
{
    if(!a && !b && !p) return ;
    LL req = exBSGS(a , b , p);
    if(req < 0) cout << "No Solution\n";
    else cout << req << "\n";
    return ;
}
int main()
{
    int t = 1;
    while(cin >> a >> p >> b) solve();
    return 0;
}
```

### 行高亮/错误/警告/Diff

```ts
// [!code word:console:1]
console.log('No errors, warnings or highlights')
console.error('Error') // [!code error]
console.warn('Warning') // [!code warning]
console.log('Highlighted') // [!code highlight]
console.log('hewwo') // [!code --]
console.log('hello') // [!code ++]
```

```ts
// [!code highlight:2]
console.log('Highlighted')
console.log('Highlighted')
console.log('Not highlighted')
```

```ts
console.log('Not highlighted')
// [!code highlight:1]
console.log('Highlighted')
console.log('Not highlighted')
```

```js {1,3-4}
console.log('1')
console.log('2')
console.log('3')
console.log('4')
```

### 代码聚焦

```js
console.log('Not focused')
console.log('Not focused')
console.log('Focused') // [!code focus]
console.log('Not focused')
console.log('Focused') // [!code focus]
console.log('Not focused')
```

### 字段突出

```ts
// [!code word:Hello]
const message = 'Hello World'
console.log(message) // prints Hello World
```

```ts
// [!code word:Hello:1]
const message = 'Hello World'
console.log(message) // prints Hello World
```

```js /Hello/
const msg = 'Hello World'
console.log(msg)
console.log(msg) // 打印 Hello World
```

### TypeScript 语法分析

```ts
console.log('normal eslint twoslash')
const unused = 1

type Foo = {
  bar: string
}
```

```ts
// @errors: 2339
let x: [string, number]
x = ['hello', 10] // OK
// ---cut---
console.log(x[0].substring(1))
console.log(x[1].substring(1))
```

### 代码组

额，这里还没写完……

:::code-group

```js [config.js]
export default {
  port: 3000
}
```

```ts [config.ts]
export default {
  port: 3000
}
```

```json [package.json]
{
  "name": "test"
}
```

:::

## 自定义组件

::: info[==快去点个 star！==]{open}
hi
:::

::: info
hi
:::

::: tip
hi
:::

::: success
hi
:::

::: important
hi
:::

::: warning
hi
:::

::: caution
hi
:::

::: error
hi
:::

::: danger
hi
:::

::: details
hi
:::

<!-- > [!NOTE]
> 这是普通提示，图标为 ℹ️

> [!TIP] 自定义标题
> 带自定义标题的提示

> [!WARNING]
> 警告内容，图标为 ⚠️

> [!IMPORTANT]
> 重点内容

> [!CAUTION]
> 注意内容

> [!ERROR]
> 错误内容

> [!信息] 中文类型
> 支持中文别名

> [!警告]
> 中文类型同样生效 -->

## Badge

<span class="Badge tip">NEW</span> 这是一个新功能

<span class="Badge warning">BETA</span> 测试版