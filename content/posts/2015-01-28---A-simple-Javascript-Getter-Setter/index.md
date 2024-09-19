---
title: "A simple Javascript Getter/Setter"
date: "2015-01-28T11:12:03.284Z"
template: "post"
draft: false
slug: "/posts/a-simple-javascript-gettersetter"
category: "Javascript"
tags:
  - "Javascript"
description: "How to implement a simple Javascript getter/setter than can be used with different libraries and frameworks."
---

[A GitHub repository is available!](https://github.com/albertoarena/gettersetter)

In different Javascript projects, it occurred that I needed a simple getter/setter functionality. And because I was
working on very different platforms (from a front-end web-application to a Titanium app), I needed some general code
that may be re-usable.

My pre-requisites were:

- simple to implement
- light code
- portable over different frameworks
- method chaining approach (like jQuery)

E.g., in I had a complex object with many properties. When some of the properties were updated, they needed to trigger
some code. And the object was passed as a parameter to other functions or methods.

I needed something like this:

```javascript
var Person = {
  name: "Jim",
  job: "Junior developer",
  salary: 30000,
};
Person.job("Senior developer").salary(40000);
// ==> Now you are a Senior developer! Now you earn 40000!

console.log(Person.job);
// ==> Senior developer
```

I wrote the following code for the getter/setter, as a RequireJS module:

```javascript
define([], function () {
  return function (initValue, callback) {
    var val = initValue;
    if (typeof callback != "function") {
      callback = null;
    }

    return function (v) {
      if (v !== undefined) {
        val = v;
        if (callback) {
          callback(v);
        }
      }
      return val;
    };
  };
});
```

At this point, things were simpler! I could chain the methods and finally write the following nice code:

```javascript
define(["getterSetter"], function (getterSetter) {
  return function (options) {
    if (typeof options != "object") {
      options = {};
    }

    // We assume you can't change your name!
    this.name = options.name;

    // Role, e.g. Web developer
    this.role = new getterSetter(options.role, options.onRoleChange);

    // Salary, e.g. 30000
    this.salary = new getterSetter(options.salary, options.onSalaryChange);

    return this;
  };
});
```

Now I can define a collection of persons:

```javascript
define(['person.js'], function(Person) {
  var people = {};

  var onRoleChange:

  function(v) {
    console.log('Wow, now you are a ' + v + '!');
  };

  var onSalaryChange = function(v) {
    console.log('Congratulations, now your salary is ' + v + '!');
  };

  people.jim = new Person({
    name: 'Jim Slave',
    role: 'Web developer',
    salary: 30000,
    onRoleChange: onRoleChange,
    onSalaryChange: onSalaryChange
  });

  people.tim = new Person({
    name: 'Tim Wise',
    role: 'Senior developer',
    salary: 40000,
    onRoleChange: onRoleChange,
    onSalaryChange: onSalaryChange
  })

  people.john = new Person({
    name: 'John Boss',
    role: 'Lead developer',
    salary: 50000,
    onSalaryChange: onSalaryChange
  });

  return people;
});
```

And finally I can do something like this:

```javascript
var myPeople = new People();

myPeople.jim.salary(35000).role("Mid developer");

// ==> Congratulations, now your salary is 35000!
// ==> Wow, now you are a Mid developer!

myPeople.john.salary(55000);

// ==> Congratulations, now your salary is 55000!

for (var person in myPeople) {
  console.log(
    person +
      "'s role is " +
      myPeople[person].role() +
      ", and earns " +
      myPeople[person].salary() +
      ".",
  );
}

// ==> Jim Slave's role is Mid developer, and earns 35000.
// ==> Tim Wise's role is Senior developer, and earns 40000.
// ==> John Boss's role is Lead developer, and earns 55000
```

It works in **only 0.169 kb**!

Future improvements:

- pass a reference to the original object to the callback

Alternative (and more classical) implementation:

- [John Resig's getter/setter](http://ejohn.org/blog/javascript-getters-and-setters/)
