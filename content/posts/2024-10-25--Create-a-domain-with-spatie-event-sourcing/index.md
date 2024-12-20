---
title: "Create a domain using Spatie event sourcing"
date: "2024-12-20T15:13:00.000Z"
template: "post"
draft: false
slug: "/posts/domain-using-spatie-event-sourcing"
category: "Laravel"
tags:
  - "PHP"
  - "Event sourcing"
  - "Spatie"
  - "Laravel"
description: "A Laravel command that generates a domain using Spatie event sourcing."
socialImage: "./media/spatie.jpg"
---

Event sourcing is a powerful pattern for tracking changes to application state, offering a robust way to manage
domain-driven design in Laravel. However, setting up an event-sourcing domain can be time-consuming and repetitive,
especially when following best practices.

To streamline this process, I've created a Laravel package that automates the creation of event-sourcing domains using
Spatie's event sourcing library. With just one artisan command, you can generate all the boilerplate code needed for
your domain, including aggregates, events, and projectors.

This package empowers developers to focus on their business logic rather than spending time on repetitive setup tasks.
Whether you're building financial systems, audit trails, or complex applications that require detailed state tracking,
this package can help you get started faster and with less hassle.

Here's a sneak peek at how simple it is to use:

```shell
php artisan make:event-sourcing-domain MODEL --domain=DOMAIN
```

In this blog post, I'll walk you through how to use this package, explain its key features, and provide practical
examples to help you integrate event sourcing into your Laravel projects efficiently.

👉 [Check out the package on GitHub!](https://github.com/albertoarena/laravel-event-sourcing-generator)

## Understanding the command

The primary command provided by this package is:

```shell
php artisan make:event-sourcing-domain MODEL --domain=DOMAIN
```

This command generates the necessary structure and files for a complete event-sourcing domain in your Laravel project.
Let's break it down:

### Parameters

1. `MODEL`:

- This represents the core entity or aggregate root for your domain.
- Example: If you're building an e-commerce application, a MODEL could be Order, Product, or Customer.

2. `--domain=DOMAIN`:

- This defines the domain or bounded context where your model operates.
- Example: For an Order model, you might place it in a domain like Sales or Inventory.

### Command Usage

Here's an example of how to use this command:

```shell
php artisan make:event-sourcing-domain Order --domain=Sales
```

Running this will generate the following structure:

```
app/
└── Domain/
    └── Sales/
        ├── Actions/
        │   ├── CreateOrder.php
        │   ├── DeleteOrder.php
        │   └── UpdateOrder.php
        ├── Aggregates/
        │   └── OrderAggregate.php
        ├── Events/
        │   ├── OrderCreated.php
        │   ├── OrderDeleted.php
        │   └── OrderUpdated.php
        ├── Projections/
        │   └── Order.php
        └──Projectors/
           └── OrderProjector.php
```

## Example workflow

To demonstrate the power of this package, let's walk through an example of setting up a domain for managing Orders
within a Sales domain in your Laravel application.

We'll assume that a migration already exists.

```php
// database/migrations/2024_12_20_121314_create_orders_table.php
return new class extends Migration
{
    **
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid()->primary();
            $table->string('customer_email')->index();
            $table->string('customer_name');
            $table->string('status')->default('pending');
            $table->decimal('total_amount', 10, 2);
            $table->json('items');
            $table->timestamps();
        });
    }

    // etc.
};
```

### Step 1: Generate the Event-Sourcing Domain

Run the `make:event-sourcing-domain` command:

```shell
php artisan make:event-sourcing-domain Order \
  --domain=Sales \
  --aggregate=1
```

Running this will generate the following structure:

```shell
app/
└── Domain/
    └── Sales/
        ├── Aggregates/
        │   └── OrderAggregate.php
        ├── DataTrasnferObjects/
        │   └── OrderData.php
        ├── Events/
        │   ├── OrderCreated.php
        │   ├── OrderUpdated.php
        │   └── OrderDeleted.php
        ├── Projections/
        │   └── Order.php
        └── Projectors/
            └── OrderProjector.php
```


### Step 2: Use it

```php
use App\Domain\Sales\Actions\CreateOrder;
use App\Domain\Sales\DataTransferObjects\OrderData;
use App\Domain\Sales\Projections\Order;

# This will create a record in 'orders' table, using projector OrderProjector
(new CreateOrder)(new OrderData(
  customer_email: 'john@acme.org',
  customer_name: 'John Doe',
  total_amount: 110.2,
  items: [
    [
      'id' => 12345, 'name' => 'Whiskey bottle', 'quantity' => 2, 'price' => 55.1,
    ]
  ],
));

# Retrieve record
$order = Order::query()->where('email', 'john@acme.org')->first();
```

## Advanced Examples

### Generate PHPUnit tests

> [Read full documentation here](https://github.com/albertoarena/laravel-event-sourcing-generator/blob/main/docs/unit-tests.md)

Another interesting feature is the ability to generate automatically PHPUnit tests for the model.

Run the `make:event-sourcing-domain` command:

```shell
php artisan make:event-sourcing-domain Order \
  --domain=Sales --unit-test
```

### Generate notifications

> [Read full documentation here](https://github.com/albertoarena/laravel-event-sourcing-generator/blob/main/docs/advanced-options.md#generate-notifications)

The package allows to generate notifications (mail, Slack and Teams) with an option.

Run the `make:event-sourcing-domain` command:

```shell
php artisan make:event-sourcing-domain Order \
  --domain=Sales \
  --aggregate=1 \
  --notifications=mail,slack
```

Running this will generate the following structure:

```
app/
└── Domain/
    └── Sales/
        ├── Aggregates/
        │   └── OrderAggregate.php
        ├── DataTrasnferObjects/
        │   └── OrderData.php
        ├── Events/
        │   ├── OrderCreated.php
        │   ├── OrderUpdated.php
        │   └── OrderDeleted.php
        ├── Notifications/
        │   ├── Concerns/
        │   │   └── HasDataAsArray
        │   ├── OrderCreated.php
        │   ├── OrderUpdated.php
        │   └── OrderDeleted.php
        ├── Projections/
        │   └── Order.php
        └── Projectors/
            └── OrderProjector.php
```


## What's next

Some Bluepoint column types are not yet
supported. You can find the [list at this link](https://github.com/albertoarena/laravel-event-sourcing-generator/blob/main/docs/migrations.md#unsupported-column-types).

Update migrations cannot yet be used, but only create migrations.

Finally, the package will need to be properly tested with PHP 8.3 and released for that version.

## Conclusion

Event sourcing is a transformative approach to building applications with robust state management and a clear audit
trail. By leveraging the Spatie event-sourcing library, combined with this Laravel package, you can drastically reduce
the time spent setting up event-sourcing domains while ensuring consistency and best practices.

With a single artisan command, you can generate all the necessary files and structure for your domain, empowering you to
focus on building the unique aspects of your application.

If you're ready to streamline your development workflow and dive into event sourcing, try the package today:

👉 [Check out the package on GitHub!](https://github.com/albertoarena/laravel-event-sourcing-generator)

Feel free to star the repository, report issues, or contribute to its development. Your feedback and contributions are
invaluable for improving the package and making it even more powerful for Laravel developers worldwide.
