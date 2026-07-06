---
title: "Beyond the Bastion: Secure Artisan Command Execution with AWS Systems Manager"
date: "2026-07-06T10:00:00.000Z"
template: "post"
draft: false
slug: "beyond-the-bastion-aws-ssm-laravel-artisan"
category: "AWS"
tags:
  - "AWS"
  - "SSM"
  - "Laravel"
  - "PHP"
  - "DevOps"
  - "Security"
  - "EC2"
description: "When IT blocks SSH for compliance, your manual Artisan operations go dark. Here is how AWS Systems Manager Run Command replaces the bastion host with an IAM-authenticated, CloudTrail-audited alternative, and the engineering decisions behind building a reusable toolkit around it."
socialImage: "/images/posts/beyond-the-bastion-aws-ssm-laravel-artisan/cover.jpg"
---

![Beyond the Bastion: Secure Artisan Command Execution with AWS Systems Manager](/images/posts/beyond-the-bastion-aws-ssm-laravel-artisan/cover.jpg)

One day IT tells you SSH is going away. Not because anything broke, but because compliance
and security hardening demand it. Port 22 gets closed. The bastion host or jump box
disappears. For an infrastructure-level system this is the right call, but for a team
running corrective operations by SSHing into boxes and typing `php artisan`, it is a
sharp cliff.

This is the problem I had to solve for a fleet of Laravel applications running on EC2.
Scheduled commands were safe: the Laravel scheduler runs on the box itself and needs no
interactive login. But everything *manual* was going to die the moment IT pulled the plug
on SSH: resending a failed report, clearing a stuck queue, running a one-off data fix.

This is what I built instead, and what I learned along the way.

## Why not the obvious alternatives

Before settling on SSM, I looked at the options you would normally reach for:

**An authenticated admin web UI or HTTP API.** This would work operationally, but it
reintroduces exactly the attack surface the security hardening is trying to reduce: a
new publicly-accessible endpoint with its own auth, cert, and attack exposure. Not the
direction security wants to go.

**Porting the apps to Lambda.** Tempting architecturally, but these are stateful EC2
Laravel apps with on-box schedulers, S3 integrations, and database migrations. A full
rewrite is not a corrective action. It is a multi-quarter project.

**A dedicated bastion or jump path.** Still SSH. IT will block that too, and rightly so.

SSM is the path AWS intends for exactly this situation: managed, IAM-controlled access to
EC2 instances with no inbound ports, no shared keys, and a full audit trail in CloudTrail.

## How SSM Run Command works

AWS Systems Manager Run Command lets you execute shell commands on EC2 instances from
your own machine, authenticated by your IAM credentials. The instance never needs to
accept an inbound connection. The SSM Agent on the box polls AWS endpoints over outbound
HTTPS (port 443), picks up the command, executes it, and reports the result back. No open
ports at all.

The flow looks like this:

<img src="/images/posts/beyond-the-bastion-aws-ssm-laravel-artisan/diagram.webp" alt="SSM flow diagram" class="mx-auto block dark:invert max-w-xs" />

The prerequisites are modest: the SSM Agent must be running on the instance (pre-installed
on Amazon Linux; on Ubuntu it is a snap), the instance role needs the
`AmazonSSMManagedInstanceCore` managed policy, and outbound 443 to the SSM endpoints must
be open (or you use VPC endpoints). No SSH daemon, no open inbound port.

## The toolkit

Rather than having engineers hand-craft `aws ssm send-command` strings, I built a small
CLI wrapper:

```bash
ssm-run <app> -- <artisan command and args>
```

The environment defaults to Stage. Reaching production requires an explicit `--env prod`,
which encodes the "verify on Stage first" policy in the tool itself rather than in a
wiki page nobody reads.

The wrapper resolves the config for the named app and environment, picks the right EC2
instance, assembles the SSM call, fires it, polls for completion, and prints the output
inline, with no server-side changes to the applications.

The tool is written in pure Bash, with `aws` CLI v2 and `jq` as its only runtime
dependencies. No framework, no package manager, no installation onto the servers. It runs
entirely on the operator's machine using their own AWS credentials.

## The design decisions worth explaining

Building something that drives production infrastructure forced me to think carefully
about the failure modes. A few decisions shaped the final design.

### Fail loudly on fleet mismatch

In a multi-app shared environment, running an Artisan command on one instance is
sufficient and correct. Running it on all of them would duplicate side effects: send the
same report email twice, process the same records twice.

The toolkit declares the expected set of instances per environment in config, then
verifies the *running* set matches before firing. If an undeclared instance has appeared,
if one of the declared boxes is offline, or if the count is wrong, the command fails
loudly rather than silently proceeding. This deterministic pick-and-assert approach treats
a mismatched fleet as an error, not an inconvenience.

### Route through the on-box wrapper

The applications already had an on-box wrapper script that prevents overlapping runs of
the same Artisan command and handles privilege escalation. The toolkit routes every
command through this wrapper rather than calling `php artisan` directly. This preserves
the overlap-protection guarantee that already exists for scheduled commands, keeps
privilege escalation in one well-known place, and means there is a single source of truth
for how a command runs on the box.

### No Artisan allow-list in v1

I considered restricting which commands could be sent. Ultimately I left this out of the
first version. The real control gate is IAM: only engineers who have `ssm:SendCommand`
in their policy can use the tool at all, and every invocation is recorded in CloudTrail.
An explicit allow-list is a v2 concern, if security asks for it.

## IAM: the minimum blast radius

The IAM policy for an operator is minimal: `ssm:SendCommand` scoped to the specific EC2
instance ARNs and the `AWS-RunShellScript` document, plus `ssm:DescribeInstanceInformation`
and `ssm:GetCommandInvocation` for the polling side.

One notable caveat: `DescribeInstanceInformation` and `GetCommandInvocation` do **not**
support resource-level scoping in IAM. AWS's own service authorization reference lists
no ARN form for these actions. Any attempt to narrow `Resource` to a specific instance
ARN silently matches nothing and denies every call. These two actions genuinely require
`Resource: *`. They are read-only status checks, so the risk is low, but it is worth
flagging the caveat when working with IT to approve the policy.

Every `send-command` call appears in CloudTrail. The command-level audit trail is
automatic.

## Testing without live AWS

No tests, no code is a mantra I try to stick to, and a Bash toolkit is no exception.
The toolkit is tested with [Bats](https://github.com/bats-core/bats-core), with the `aws`
CLI stubbed out so the suite runs with no live infrastructure. The unit tests cover config
resolution, target selection, and the assembled command string: the parts most likely to
be wrong quietly. Shellcheck runs as a lint gate on every commit, and a dry-run mode
(which prints the exact `aws` call without firing it) bridges the gap between
"tests pass" and "this looks right on prod."

## What is next

The transport (`aws ssm send-command`) is isolated in one place by design. If the fleet
moves to containers, that single function swaps to ECS Exec and the operator-facing
surface stays unchanged. A Lambda bridge is designed but deferred: build it when a
non-terminal trigger (a CI job, a chat integration) is actually needed, not before.

## The result

The toolkit is in production, verified live on both Stage and Prod. Adding a new Laravel
application takes about ten minutes: drop a config file with the deploy path, confirm the
SSM agent is online, smoke test on Stage.

The interesting part of this project was not the AWS mechanics. The SSM Run Command API
is well-documented and straightforward. It was the design work around it: the fleet
assertion, the stage-first default, the on-box wrapper integration. The primitives are
simple. The decisions about how to compose them safely are where the engineering lives.
