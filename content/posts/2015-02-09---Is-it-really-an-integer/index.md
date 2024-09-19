---
title: "Is it really an integer?"
date: "2015-02-09T09:12:03.284Z"
template: "post"
draft: false
slug: "/posts/is-it-really-an-integer"
category: "Type Checking"
tags:
  - "PHP"
  - "Javascript"
  - "Ruby"
description: "How to check if a variable is really an integer or a float in Javascript, and some considerations on data types."
---

Recently, while working on a Node.js application, I met a serious problem: how can I check an integer … being really an
integer? It may seem a wordplay, but it wasn't for me.

I had a variable that may contain a number (`15`), or a string with number representation (`"15.3"`), but also a string
that wasn't a number (`"3 2/3"`). I needed to check if it was really a number.

I was surprised that it wasn't easy as I expected. As you may know, in JavaScript **data typing** is not always
reliable.
You need to be aware of this limitation, if you don't want to spend your days on debugging strange behaviours.

## Kind of, type of

One of the most common ways to check variable type is using the `typeof` operator. You may be surprised that it doesn't
always return what you expect (you can test on [JSFiddle](https://jsfiddle.net/albertoarena/xdx89ppm/)):

```javascript
// typeof operator samples
// http://jsfiddle.net/albertoarena/xdx89ppm/

// All is fine with scalar values
console.log(typeof 3); // number
console.log(typeof 3.14); // number
console.log(typeof "hello"); // string
console.log(typeof true); // boolean

// But now surprises with non-scalar values
console.log(typeof { a: 1 }); // object, phew it works
console.log(typeof [1, 2]); // object !?!?!?
console.log(typeof null); // object again !?!?!?
console.log(typeof undefined); // undefined
```

As you can see, `typeof` is not useful e.g. to recognize an array, and a possible workaround may be the following one:

```javascript
// Source: Stoyan Stefanov, JavaScript Patterns, 2010 O'Reilly
// ECMAScript 5 defines a new method Array.isArray(), that can be defined
// below if it's not available in your environment
if (typeof Array.isArray === "undefined") {
  Array.isArray = function (arg) {
    return Object.prototype.toString.call(arg) === "[object Array]";
  };
}
```

## Why all this mess?

The reasons of this confusion depend on the history of JavaScript language. It was born in Netscape environment an age
ago (20 years, in 1995!) and later was adopted by Microsoft till it was standardized as ECMAScript in 1997. In other
words, it was born to do something, and now we use to write complex web-applications or effects.

In traditional and more “classical” programming languages, data types are usually static. I've been writing C++ code for
years, and it was unthinkable that a variable may change its type on-the-fly (but sometimes I strongly desired that it
may happen, I admit!). The same occurs in other languages like Ada, Cobol, C#, Fortran, Pascal, etc.

In functional and more recent (and usually interpreted) languages, instead, types can be dynamic. In my opinion, this is
one of the best innovations ever implemented in software development, together with closures. This occurs e.g. in Lisp,
JavaScript, PHP, Python, Ruby, Smalltalk etc.

However, having dynamic typing has its pros and cons. You feel like Superman because you can change the data type of
variable over the process, but be aware of the Kryptonite! One of the most common challenges is to check what is really
the data type of the piece of information you are processing.

In PHP there are many useful functions that can be used, those grouped in
the ["Variable handling functions"](https://www.php.net/manual/en/ref.var.php) group. E.g.:

```php
$a = 5;
$b = 31.2;
$c = 'Hello world';

is_int($a);         // true
is_float($a);       // false
is_string($c);      // true
```

In Ruby, where all is an object, there are simpler and general ways using `is_a?(class)` or `instance_of?(class)`:

```ruby
a = 1
a.is_a? Integer
a.is_a? Float
a.is_a? String
```

## Is it really an integer?

And now we are finally to the problem I met. Imagine to have the following values:

```javascript
var data = [10, 10.0, "10", "10.0", "10a", "10.0a"];
```

My requirements were simple: check if the variables contains an integer (it doesn't mind if represented as string), but
exclude values like the floats (second and fourth element) and the last two elements (`"10a"` and `"10.0a"`).

Initially I supposed it was an easy game, and I started with the simpler thing, that was, to convert the variable to a
number with `parseInt`, and I was immediately disappointed:

```javascript
var data = [10, 10.0, "10", "10.0", "10a", "10.0a"];
for (var i = 0; i < data.length; i++) {
  console.log("#" + i, data[i], parseInt(data[i]));
}
// It doesn't work, it returns always 10!!!
```

A better approach seemed to convert to a number with unary plus operator and later use `parseInt`:

```javascript
var data = [10, 10.0, "10", "10.0", "10a", "10.0a"];
for (var i = 0; i < data.length; i++) {
  console.log("#" + i, data[i], parseInt(+data[i]));
}

// It handles correctly the strings "10a" and "10.0a" but not the floats
// #0 10 10
// #1 10 10         this must be excluded, because it's a float
// #2 10 10
// #3 10.0 10       this must be excluded, because it's a float
// #4 10a NaN
// #5 10.0a NaN
```

Inspired by a post
on [Stackoverflow](https://stackoverflow.com/questions/3885817/how-do-i-check-that-a-number-is-float-or-integer/3885844#3885844),
I tried the following elegant way:

```javascript
var isInt = function (n) {
  n = +n;
  return +n === n && n === (n | 0);
};

var data = [10, 10.0, "10", "10.0", "10a", "10.0a", "", " ", undefined, true];
for (var i = 0; i < data.length; i++) {
  console.log("#" + i, data[i], isInt(data[i]));
}
```

However, I noticed two issues:

- floats like `10.0` aren't distinguished by the integers like `10`
- empty strings, `null` and `true` are considered integers

It seemed a dog chasing its tail! I doubt arose in my mind: is there a way in Javascript to distinguish `10`
from `10.0`? There isn't, and it's simple to demonstrate:

```javascript
console.log(10 === 10.0); // true!!!
```

The reason was stupidly simple: they're both of `number` data type. It isn't like in PHP where integers and floats are
two different data types.

## How to avoid dying of a broken heart

At this point, while you are probably lost in my attempts, it’s useful to sum up where we are:

- I have a variable that may contain numbers or strings that may represent (but it _**may**_ not)
- I need to check if the variable contains a valid integer
- I need to exclude invalid numbers (like `"10a"`)
- I need to exclude null and booleans

Finally, this is the improved version of the above function (on [JSFiddle](https://jsfiddle.net/albertoarena/o48y7bo3/1/)):

```javascript
var isInt = function (n) {
  if (isNaN(parseInt(n))) {
    return false;
  }
  n = Number(n);
  return +n === n && n === (n | 0);
};

var isFloat = function (n) {
  if (isNaN(parseFloat(n))) {
    return false;
  }
  n = Number(n);
  return +n === n && n !== (n | 0);
};

// Test
var data = [
  10,
  10.0,
  10.2,
  "10",
  "10.0",
  "10.2",
  "10a",
  "10.0a",
  "",
  " ",
  undefined,
  true,
];
var table = {};
for (var i = 0; i < data.length; i++) {
  table[i] = {
    value: data[i],
    isInt: isInt(data[i]),
    isFloat: isFloat(data[i]),
  };
}

console.table(table);
```

## Conclusion

Each programming language has got its peculiarities and pros and cons, as it occurs with natural languages. And a good developer should be aware of those limitations, and avoid stupid slips (like mine!), e.g. assuming that what applies to PHP should work in Javascript and vice versa.

My original question was: it is really an integer? Well, at the end of this long post, I’m sad to say that the answer could be: maybe!
