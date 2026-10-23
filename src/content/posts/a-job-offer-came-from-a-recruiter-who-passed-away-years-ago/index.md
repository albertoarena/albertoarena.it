---
title: "A job offer came from a recruiter who passed away years ago"
date: "2026-10-23T07:10:00.000Z"
template: "post"
draft: false
slug: "a-job-offer-came-from-a-recruiter-who-passed-away-years-ago"
category: "Security"
tags:
  - "Security"
  - "Job Search"
  - "Scams"
description: "A fake recruiter emailed me a senior Laravel role with a big salary. Here is what looked right, what did not fit, how they found me, and what to check before you reply."
socialImage: "/images/posts/a-job-offer-came-from-a-recruiter-who-passed-away-years-ago/cover.jpg"
coverAlt: "A silver laptop with a dark screen on a wooden desk, next to a cup of tea, reading glasses, a phone and a small model sailing ship"
---

## Two inboxes, one email

On 22/10, at 20:59, an email arrived with the subject "Confidential Opportunity, Senior Laravel Engineer". It offered a salary between €75,000 and €95,000, and the role was marked confidential. I have been open to work for just a few days, so I was happily surprised.

## What looked right

The sender had a real name, and the signature said "Senior Recruiter (contractor)" at a US energy company. The body was short and it talked about me. It said my background building production Laravel backends and my work on [my open-source package](https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=a-job-offer-came-from-a-recruiter-who-passed-away-years-ago) had stood out, and it mentioned integrating AI tooling. Details would follow, but only if I replied.

I searched the name on LinkedIn and found a real profile with a face, and the company from the signature. It was a recruiter profile. It seemed legit.

## What did not fit

The first thing I noticed was the address. The email came to my personal Gmail, which is public: it is the author email on hundreds of my commits on GitHub. The same message also went to my work email, for a contract I have, and that address is not published anywhere I know of. Maybe someone simply tried my name at my company's domain. I cannot know. My work inbox marked the email as spam, while my personal inbox did not.

Then I looked at the signature. Every word was separated by a slash, as if the formatting had broken, and there was no phone number, website or LinkedIn link. The sender was a Gmail address with ".hr" in it, while the LinkedIn profile listed a different email address at the company, plus office and mobile numbers. A recruiter who works for a company usually writes from the company.

The company was odd too. A US energy company is not a software house, and I doubt it would offer a Laravel salary in euros.

The LinkedIn account had been inactive for a long time, so I searched the name again, this time with the word "obituary". I found the same face. He passed away years ago. I had never heard of him. I reported the profile to LinkedIn, telling them that he had died and that a scam email had been sent to me. I did not reply to the email.

## How they probably found me

I cannot prove it, but the likely answer is simple. My personal address is on GitHub, in every public commit I made. Anyone can collect it, and nobody needs to hack anything. This works for any developer with public repositories, and I find that the most useful part of the story. The sender only needs your commit address and the name of your open-source project. The line about my work sounded personal, but anyone could write it after a look at my GitHub profile.

## What these emails usually want

I did not get that far, so this part is not my story. It is what others have documented. In 2023, the security team at Palo Alto Networks (Unit 42) described a campaign it called "Contagious Interview". Attackers pose as employers and ask developers to take part in a fake job interview. The task is often a take-home assessment: a repository to clone and run. The report is called ["Hacking Employers and Seeking Employment: Two Job-Related Campaigns Bear Hallmarks of North Korean Threat Actors"](https://unit42.paloaltonetworks.com/two-campaigns-by-north-korea-bad-actors-target-job-hunters/).

One way this can work: when you run `npm install`, npm also runs a script called `postinstall`, if the project has one. It runs by itself at the end of the install and does not ask you anything. So if you clone a recruiter's repository and install it, you may be running their code on your machine. Composer, the PHP package manager, has something similar: the scripts in `composer.json` can run when you install too.

## The second one was clumsy

The same day, 22/10, a different person contacted me on LinkedIn. He offered me a contractor role at a company I already work with. The message was written by an AI, and it was easy to see. I blocked him.

That one was easy to ignore. The email was the careful one, with a real name, a real profile and a detail about my own work. It stopped making sense only when I put it next to the company, the sender address and the signature. Are the two related? Both were about a job, and both reached me on 22/10. That is all I know.

## What I would check next time

This is the list I wish I had read on 22/10 at 20:59:

- Compare the sender's email domain with the company's domain. The [FTC lists this as a sign of a job scam](https://consumer.ftc.gov/consumer-alerts/2023/12/how-spot-latest-job-scams): recruiters will generally email from their company, not from a personal address like @gmail.com or @yahoo.com.
- Search the person outside the email. Look at the profile, and also check whether the company email and phone numbers match the ones in the message.
- Read the scripts in `package.json` and `composer.json` before you install anything a recruiter sends you. Better still, do not run it on your main machine.
- Use GitHub's private "noreply" commit email, so your real address is not in every public commit.
- Do not reply just to ask for details. A reply tells them the address is alive.
- Report it. Mark the email as phishing, report the profile, and tell your work IT team if it reached a work inbox.
